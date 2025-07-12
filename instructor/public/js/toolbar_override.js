(function() {
    const isInIframe = window !== window.parent;
    
    if (isInIframe) {
        // Add CSS to set header height to 0
        const style = document.createElement('style');
        style.textContent = `
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
            .form-tabs-list .form-tabs{
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
        `;
        document.head.appendChild(style);
        
        console.log('Header height set to 0 for iframe context');
    }
})();