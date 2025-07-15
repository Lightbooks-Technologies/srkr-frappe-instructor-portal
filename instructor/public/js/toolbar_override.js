(function() {
    const isInIframe = window !== window.parent;
    
    if (isInIframe) {
        console.log('Iframe detected - applying header and theme modifications');
        
        // Force light theme immediately
        localStorage.setItem('theme', 'light');
        localStorage.setItem('frappe_theme', 'light');
        document.body.setAttribute('data-theme', 'light');
        document.documentElement.setAttribute('data-theme', 'light');
        
        // Remove dark classes
        document.body.classList.remove('dark', 'dark-theme');
        document.body.classList.add('light', 'light-theme');
        document.documentElement.classList.remove('dark', 'dark-theme');
        document.documentElement.classList.add('light', 'light-theme');
        
        // Add CSS to set header height to 0 and force light theme
        const style = document.createElement('style');
        style.id = 'iframe-modifications';
        style.textContent = `
            /* Header modifications */
            :root {
                --navbar-height: 0px !important;
            }
            
            header, .navbar, .navbar-brand {
                height: 0 !important;
                min-height: 0 !important;
                max-height: 0 !important;
                overflow: hidden !important;
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
            }
            
            body {
                padding-top: 0 !important;
                margin-top: 0 !important;
            }
            
            .layout-main {
                padding-top: 0 !important;
                margin-top: 0 !important;
            }
            
            .form-tabs-list .form-tabs {
                scrollbar-color: #ffffff00 #ffffff00;
            }
            
            .page-head {
                top: 0 !important;
            }

            /* Ensure any fixed positioning doesn't interfere */
            header.fixed-top, .navbar.fixed-top {
                position: static !important;
            }
            
            /* Override any elements that might use the navbar height variable */
            [style*="var(--navbar-height)"] {
                padding-top: 0 !important;
                margin-top: 0 !important;
                top: 0 !important;
            }
            
            /* Simple light theme override */
            :root {
                color-scheme: light !important;
            }
            
            body, html,
            [data-theme="dark"],
            .dark,
            .dark-theme {
                background-color: #ffffff !important;
                color: #374151 !important;
            }
        `;
        document.head.appendChild(style);
        
        // Override frappe theme when available
        function overrideFrappeTheme() {
            if (typeof frappe !== 'undefined') {
                // Set boot theme
                if (frappe.boot) {
                    frappe.boot.theme = 'light';
                    frappe.boot.force_theme = 'light';
                    
                    if (frappe.boot.website_settings) {
                        frappe.boot.website_settings.theme = 'light';
                    }
                    
                    if (frappe.boot.user_info && frappe.session && frappe.session.user) {
                        if (frappe.boot.user_info[frappe.session.user]) {
                            frappe.boot.user_info[frappe.session.user].theme = 'light';
                        }
                    }
                }
                
                // Override theme methods
                if (frappe.theme && frappe.theme.set_theme) {
                    const originalSetTheme = frappe.theme.set_theme;
                    frappe.theme.set_theme = function(theme) {
                        console.log('Theme change intercepted in iframe, forcing light');
                        return originalSetTheme.call(this, 'light');
                    };
                    
                    // Set theme to light
                    frappe.theme.set_theme('light');
                }
                
                console.log('Frappe theme overridden to light');
            } else {
                setTimeout(overrideFrappeTheme, 100);
            }
        }
        
        // Monitor and prevent theme changes
        function preventThemeChanges() {
            // Monitor localStorage changes
            const originalSetItem = Storage.prototype.setItem;
            Storage.prototype.setItem = function(key, value) {
                if ((key === 'theme' || key === 'frappe_theme') && value !== 'light') {
                    console.log('Preventing theme change in localStorage, keeping light');
                    return originalSetItem.call(this, key, 'light');
                }
                return originalSetItem.call(this, key, value);
            };
            
            // Monitor attribute changes
            if (window.MutationObserver) {
                const observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.type === 'attributes') {
                            const target = mutation.target;
                            
                            if (mutation.attributeName === 'data-theme' && target.getAttribute('data-theme') === 'dark') {
                                console.log('Preventing dark theme attribute change');
                                target.setAttribute('data-theme', 'light');
                            }
                            
                            if (mutation.attributeName === 'class') {
                                if (target.classList.contains('dark') || target.classList.contains('dark-theme')) {
                                    console.log('Preventing dark theme class addition');
                                    target.classList.remove('dark', 'dark-theme');
                                    target.classList.add('light', 'light-theme');
                                }
                            }
                        }
                    });
                });
                
                observer.observe(document.documentElement, {
                    attributes: true,
                    attributeFilter: ['class', 'data-theme']
                });
                
                observer.observe(document.body, {
                    attributes: true,
                    attributeFilter: ['class', 'data-theme']
                });
                
                console.log('Theme change monitoring enabled');
            }
        }
        
        // Initialize overrides
        overrideFrappeTheme();
        preventThemeChanges();
        
        // Apply again on DOM ready and window load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    overrideFrappeTheme();
                    document.body.setAttribute('data-theme', 'light');
                }, 100);
            });
        }
        
        window.addEventListener('load', () => {
            setTimeout(() => {
                overrideFrappeTheme();
                document.body.setAttribute('data-theme', 'light');
            }, 100);
        });
        
        console.log('Header height set to 0 and light theme forced for iframe context');
    }
})();