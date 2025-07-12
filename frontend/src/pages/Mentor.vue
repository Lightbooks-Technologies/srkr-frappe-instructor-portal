<template>
  <div class="h-full">
    <v-card class="h-full">
      <v-card-text class="pa-0 h-full">
        <div class="iframe-container">
          <iframe
            ref="mentorIframe"
            :src="mentorUrl"
            frameborder="0"
            class="mentor-iframe"
            @load="onIframeLoad"
            @error="onIframeError"
          ></iframe>
          
          <!-- Loading overlay -->
          <div v-if="isLoading" class="iframe-loading-overlay">
            <v-progress-circular
              indeterminate
              color="primary"
              size="64"
            ></v-progress-circular>
            <p class="mt-4">Loading Mentorship Log...</p>
          </div>
          
          <!-- Error overlay -->
          <div v-if="hasError" class="iframe-error-overlay">
            <v-icon size="64" color="error">mdi-alert-circle</v-icon>
            <p class="mt-4 text-error">Failed to load mentorship log</p>
            <v-btn @click="refreshIframe" color="primary" class="mt-2">
              Try Again
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const mentorIframe = ref(null)
const isLoading = ref(true)
const hasError = ref(false)

// The admin URL to embed (same origin - no need for special parameters)
const mentorUrl = '/app/mentorship-log-entry'

// Handle iframe load event
const onIframeLoad = () => {
  isLoading.value = false
  hasError.value = false
  console.log('Mentorship log loaded successfully')
  
  // Inject CSS to hide header elements (same origin)
  // try {
  //   const iframe = mentorIframe.value
  //   if (iframe && iframe.contentDocument) {
  //     // Wait a bit for content to fully load
  //     setTimeout(() => {
  //       const style = iframe.contentDocument.createElement('style')
  //       style.textContent = `
  //         /* Hide header based on the HTML structure seen in screenshot */
  //         header.navbar.navbar-expand,
  //         .navbar.navbar-expand,
  //         [role="navigation"],
  //         .sticky-top {
  //           display: none !important;
  //         }
          
  //         /* Hide specific header elements visible in the DOM */
  //         header, .header, .navbar, .nav-bar, #header, #navbar,
  //         .main-header, .page-header, .top-header,
  //         [role="banner"], [data-v-navbar] {
  //           display: none !important;
  //         }
          
  //         /* Adjust body and main content */
  //         body {
  //           padding-top: 0 !important;
  //           margin-top: 0 !important;
  //         }
          
  //         /* Target the main content area to take full height */
  //         .main-section, .content, #body, .page-content,
  //         .body-sidebar-container, .main-content {
  //           padding-top: 0 !important;
  //           margin-top: 0 !important;
  //         }
          
  //         /* Ensure the app div takes full height */
  //         #app, [data-v-app] {
  //           padding-top: 0 !important;
  //         }
          
  //         /* Hide any fixed positioned elements at the top */
  //         *[style*="position: fixed"][style*="top: 0"],
  //         *[style*="position:fixed"][style*="top:0"] {
  //           display: none !important;
  //         }
  //       `
  //       iframe.contentDocument.head.appendChild(style)
        
  //       // Also try to remove header elements directly
  //       const headerSelectors = [
  //         'header',
  //         '.navbar',
  //         '.navbar-expand',
  //         '[role="navigation"]',
  //         '.sticky-top',
  //         '.main-header',
  //         '.page-header'
  //       ]
        
  //       headerSelectors.forEach(selector => {
  //         const elements = iframe.contentDocument.querySelectorAll(selector)
  //         elements.forEach(el => {
  //           if (el.tagName === 'HEADER' || 
  //               el.classList.contains('navbar') || 
  //               el.classList.contains('header')) {
  //             el.style.display = 'none'
  //           }
  //         })
  //       })
        
  //       console.log('Header hiding CSS and DOM manipulation applied')
  //     }, 500) // Wait 500ms for content to load
  //   }
  // } catch (error) {
  //   console.error('Error hiding header:', error)
  // }
}

// Handle iframe error
const onIframeError = () => {
  isLoading.value = false
  hasError.value = true
  console.error('Failed to load mentorship log')
}

// Refresh iframe
const refreshIframe = () => {
  isLoading.value = true
  hasError.value = false
  
  if (mentorIframe.value) {
    mentorIframe.value.src = mentorUrl
  }
}

// Open in new tab
const openInNewTab = () => {
  window.open(mentorUrl, '_blank')
}

// Handle responsive iframe
const handleResize = () => {
  // You can add responsive logic here if needed
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  
  // Optional: Add message listener for cross-origin communication
  window.addEventListener('message', (event) => {
    // Handle messages from the iframe if needed
    // if (event.origin === 'https://srkr.lightbooks-dev.io') {
      console.log('Message from iframe:', event.data)
    // }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.iframe-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 200px); /* Adjust based on your layout */
  min-height: 600px;
}

.mentor-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 4px;
}

.iframe-loading-overlay,
.iframe-error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

.iframe-loading-overlay p,
.iframe-error-overlay p {
  margin: 0;
  text-align: center;
  color: #666;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .iframe-container {
    height: calc(100vh - 150px);
    min-height: 400px;
  }
  
  .p-5 {
    padding: 0.5rem !important;
  }
  
  .ma-12 {
    margin: 0.5rem !important;
  }
}

@media (max-width: 480px) {
  .iframe-container {
    height: calc(100vh - 120px);
    min-height: 300px;
  }
}
</style>