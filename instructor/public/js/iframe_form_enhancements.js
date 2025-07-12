(function() {
    const isInIframe = window !== window.parent;
    
    if (isInIframe) {
        console.log('Iframe detected, setting up form back button enhancement');
        
        let initializationAttempts = 0;
        const maxAttempts = 50; // 10 seconds max wait
        
        function initializeFormEnhancements() {
            initializationAttempts++;
            
            // Check if frappe and required objects are available
            if (typeof frappe === 'undefined' || 
                !frappe.ui || 
                !frappe.ui.form || 
                !frappe.ui.form.Form ||
                !frappe.router ||
                !frappe.set_route) {
                
                if (initializationAttempts < maxAttempts) {
                    setTimeout(initializeFormEnhancements, 200);
                }
                return;
            }
            
            console.log('Frappe form objects available, setting up back button enhancement');
            
            // Store original refresh method
            const originalRefresh = frappe.ui.form.Form.prototype.refresh;
            
            // Override form refresh to add back button
            frappe.ui.form.Form.prototype.refresh = function() {
                try {
                    // Call original refresh
                    const result = originalRefresh.apply(this, arguments);
                    
                    // Add back button after refresh
                    setTimeout(() => {
                        addBackButtonToCurrentForm(this);
                    }, 100);
                    
                    return result;
                } catch (error) {
                    console.error('Error in form refresh override:', error);
                    return originalRefresh.apply(this, arguments);
                }
            };
            
            // Also hook into route changes
            if (frappe.router && frappe.router.on) {
                frappe.router.on('change', () => {
                    setTimeout(() => {
                        const currentForm = cur_frm;
                        if (currentForm) {
                            addBackButtonToCurrentForm(currentForm);
                        }
                    }, 200);
                });
            }
            
            // Listen for page changes
            $(document).on('page-change', () => {
                setTimeout(() => {
                    const currentForm = cur_frm;
                    if (currentForm) {
                        addBackButtonToCurrentForm(currentForm);
                    }
                }, 200);
            });
            
            console.log('Form enhancement setup complete');
        }
        
        // Multiple initialization strategies
        function startInitialization() {
            // Strategy 1: Immediate check
            initializeFormEnhancements();
            
            // Strategy 2: DOM ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(initializeFormEnhancements, 100);
                });
            } else {
                setTimeout(initializeFormEnhancements, 100);
            }
            
            // Strategy 3: Window load
            window.addEventListener('load', () => {
                setTimeout(initializeFormEnhancements, 200);
            });
            
            // Strategy 4: Check for frappe app ready
            const checkFrappeApp = () => {
                if (typeof frappe !== 'undefined' && 
                    frappe.app && 
                    (frappe.app.startup_complete || frappe.app_status === 'ready')) {
                    initializeFormEnhancements();
                } else {
                    setTimeout(checkFrappeApp, 200);
                }
            };
            checkFrappeApp();
        }
        
        startInitialization();
    }
    
    function addBackButtonToCurrentForm(frm) {
        try {
            if (!frm || !frm.page) return;
            
            // Check if we're on a form page
            const route = frappe.get_route && frappe.get_route();
            if (!route || route[0] !== 'Form') return;
            
            // Check if back button already exists
            if (frm.page.wrapper.find('.back-to-list-btn').length > 0) return;
            
            console.log('Adding back button to form:', frm.doctype);
            
            // Create back button
            const $backButton = $(`
                <button class="btn btn-secondary me-2 back-to-list-btn" style="margin-right: 8px;">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="margin-right: 4px;">
                        <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                    </svg>
                </button>
            `);
            
            // Add click handler
            $backButton.on('click', function(e) {
                e.preventDefault();
                handleBackNavigation(frm);
            });
            
            // Strategy 1: Target the visible editable form page-title
            let inserted = false;
            
            // Find the editable form container (not hidden)
            // const $editableContainer = frm.page.$wrapper.find('.page-container.editable-form:not([style*="display: none"]):not(.hidden)');
            // if ($editableContainer.length) {
            //     const $pageTitle = $editableContainer.find('.page-title');
            //     if ($pageTitle.length) {
            //         // Create a wrapper for the back button and title
            //         if (!$pageTitle.parent().hasClass('title-with-back-button')) {
            //             $pageTitle.wrap('<div class="title-with-back-button d-flex align-items-center"></div>');
            //             $pageTitle.parent().prepend($backButton);
            //             inserted = true;
            //             console.log('Back button inserted before page title in editable container');
            //         }
            //     }
            // }
            
            // Strategy 2: Target page-head in editable form
            if (!inserted) {
                const $editablePageHead = frm.page.wrapper.find('.page-head-content');
                if ($editablePageHead.length) {
                    const $titleArea = $editablePageHead.find('.title-area, .page-title').first();
                    if ($titleArea.length) {
                        if (!$titleArea.parent().hasClass('title-with-back-button')) {
                            $titleArea.wrap('<div class="title-with-back-button d-flex align-items-center"></div>');
                            $titleArea.prepend($backButton);
                            inserted = true;
                            console.log('Back button inserted in page-head title area');
                        }
                    }
                }
            }
            
            // Strategy 3: Target any visible page-title
            // if (!inserted) {
            //     const $visiblePageTitle = frm.page.$wrapper.find('.page-title:visible').first();
            //     if ($visiblePageTitle.length) {
            //         // Check if parent container is not hidden
            //         const $parentContainer = $visiblePageTitle.closest('.page-container');
            //         if (!$parentContainer.hasClass('hidden') && !$parentContainer.is(':hidden')) {
            //             if (!$visiblePageTitle.parent().hasClass('title-with-back-button')) {
            //                 $visiblePageTitle.wrap('<div class="title-with-back-button d-flex align-items-center"></div>');
            //                 $visiblePageTitle.parent().prepend($backButton);
            //                 inserted = true;
            //                 console.log('Back button inserted before visible page title');
            //             }
            //         }
            //     }
            // }
            
            // Strategy 4: Target the row containing page title in editable form
            // if (!inserted) {
            //     const $editableRow = frm.page.$wrapper.find('.page-container.editable-form .row.page-head-content');
            //     if ($editableRow.length) {
            //         const $titleCol = $editableRow.find('.col-md-4.col-sm-6.col-xs-7.page-title');
            //         if ($titleCol.length) {
            //             if (!$titleCol.hasClass('title-with-back-button')) {
            //                 $titleCol.addClass('title-with-back-button d-flex align-items-center');
            //                 $titleCol.prepend($backButton);
            //                 inserted = true;
            //                 console.log('Back button inserted in title column');
            //             }
            //         }
            //     }
            // }
            
            // Strategy 5: DOM-based approach using the exact structure from your HTML
            // if (!inserted) {
            //     // Target: .page-container.editable-form .page-head .container .row .col-md-4.page-title
            //     const $targetTitle = $(`.page-container.editable-form .page-head .container .row .col-md-4.page-title`);
            //     if ($targetTitle.length && $targetTitle.is(':visible')) {
            //         if (!$targetTitle.hasClass('has-back-button')) {
            //             $targetTitle.addClass('has-back-button');
            //             $targetTitle.css('display', 'flex');
            //             $targetTitle.css('align-items', 'center');
            //             $targetTitle.prepend($backButton);
            //             inserted = true;
            //             console.log('Back button inserted using DOM structure approach');
            //         }
            //     }
            // }
            
            // Strategy 6: Fallback - insert before any primary button
            if (!inserted) {
                const $primaryAction = frm.page.$primary_action;
                if ($primaryAction && $primaryAction.length) {
                    $backButton.insertBefore($primaryAction);
                    inserted = true;
                    console.log('Back button inserted as fallback before primary action');
                }
            }
            
            if (inserted) {
                console.log('Back button successfully added to form');
                
                // Add custom CSS for better integration
                if (!document.getElementById('back-button-styles')) {
                    const styles = `
                        <style id="back-button-styles">
                            .title-with-back-button {
                                display: flex !important;
                                align-items: center !important;
                                gap: 8px !important;
                            }
                            
                            .has-back-button {
                                display: flex !important;
                                align-items: center !important;
                                gap: 8px !important;
                            }
                            
                            .back-to-list-btn {
                                flex-shrink: 0 !important;
                                font-size: 0.875rem !important;
                                padding: 0.375rem 0.75rem !important;
                                height: auto !important;
                                line-height: 1.5 !important;
                            }
                            
                            .back-to-list-btn:hover {
                                background-color: #6c757d !important;
                                border-color: #6c757d !important;
                                color: white !important;
                            }
                            
                            /* Ensure title text doesn't wrap awkwardly */
                            .title-with-back-button .page-title,
                            .has-back-button .editable-title {
                                flex-grow: 1 !important;
                                min-width: 0 !important;
                            }
                            
                            /* Responsive adjustments */
                            @media (max-width: 768px) {
                                .back-to-list-btn {
                                    font-size: 0.8rem !important;
                                    padding: 0.25rem 0.5rem !important;
                                }
                                
                                .back-to-list-btn svg {
                                    width: 14px !important;
                                    height: 14px !important;
                                }
                            }
                        </style>
                    `;
                    document.head.insertAdjacentHTML('beforeend', styles);
                }
            } else {
                console.warn('Could not find suitable location to insert back button');
                
                // Debug: log available elements
                console.log('Available page containers:', frm.page.$wrapper.find('.page-container').length);
                console.log('Available page titles:', frm.page.$wrapper.find('.page-title').length);
                console.log('Editable containers:', frm.page.$wrapper.find('.page-container.editable-form').length);
            }
            
        } catch (error) {
            console.error('Error adding back button to form:', error);
        }
    }
    
    function handleBackNavigation(frm) {
        try {
            // Check if form has unsaved changes
            if (frm.is_dirty && frm.is_dirty()) {
                if (frappe.confirm) {
                    frappe.confirm(
                        'You have unsaved changes. Are you sure you want to go back?',
                        () => {
                            navigateBack(frm);
                        }
                    );
                } else {
                    // Fallback confirmation
                    if (confirm('You have unsaved changes. Are you sure you want to go back?')) {
                        navigateBack(frm);
                    }
                }
            } else {
                navigateBack(frm);
            }
        } catch (error) {
            console.error('Error handling back navigation:', error);
            navigateBack(frm);
        }
    }
    
    function navigateBack(frm) {
        try {
            // Try to go back to the list view
            if (frm.doctype && frappe.set_route) {
                frappe.set_route('List', frm.doctype);
            } else {
                // Fallback: use browser history
                window.history.back();
            }
        } catch (error) {
            console.error('Error navigating back:', error);
            // Ultimate fallback
            window.history.back();
        }
    }
})();