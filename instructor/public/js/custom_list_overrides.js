(function() {
    function overrideSetResultHeight() {
        if (typeof frappe !== 'undefined' && frappe.views && frappe.views.BaseList) {
            // Override the method
            frappe.views.BaseList.prototype.set_result_height = function() {
                // Check if we're running inside an iframe
                const isInIframe = window !== window.parent;
                
                // Apply additional height adjustment for iframe context
                const iframeAdjustment = isInIframe ? 50 : 0;
                
                // place it at the footer of the page
                this.$result.css({
                    height:
                        window.innerHeight -
                        this.$result.get(0).offsetTop -
                        this.$paging_area.get(0).offsetHeight -
                        iframeAdjustment +
                        "px",
                });
                this.$no_result.css({
                    height: 
                        window.innerHeight - 
                        this.$no_result.get(0).offsetTop - 
                        iframeAdjustment + 
                        "px",
                });
            };
            console.log('BaseList.set_result_height overridden successfully');
        } else {
            // Retry after a short delay
            setTimeout(overrideSetResultHeight, 100);
        }
    }
    
    // Start the override process
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', overrideSetResultHeight);
    } else {
        overrideSetResultHeight();
    }
})();