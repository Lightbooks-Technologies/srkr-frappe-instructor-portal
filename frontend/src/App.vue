<template>
  <div>
    <div class="flex h-screen w-screen">
      <!-- Desktop Sidebar - hidden on mobile -->
      <!-- <div class="hidden md:block h-full border-r bg-gray-50">
        <Sidebar />
      </div> -->
      
      <div class="flex-1 flex flex-col h-full">
        <!-- Header with fixed height of 48px -->
        <div class="h-[3.5rem] flex-shrink-0">
          <Navbar />
        </div>
        
        <!-- Body content with calculated height -->
        <div class="flex-1 overflow-auto body-content">
          <router-view class="" />
        </div>
        
        <!-- Mobile Bottom Navigation - hidden on desktop with fixed height of 64px -->
        <div class="xl:hidden h-16 flex-shrink-0 bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <BottomNavigation />
        </div>
      </div>
    </div>
  </div>
  <Toasts />
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
import BottomNavigation from '@/components/BottomNavigation.vue'
import Navbar from '@/components/Navbar.vue'
import { RouterView } from 'vue-router'
import { Toasts } from 'frappe-ui'
</script>

<style scoped>
/* Ensure proper height calculations */
.body-content {
  /* Desktop: 100vh - 48px (header) */
  height: calc(100vh - 48px);
}

/* Mobile specific height calculation */
@media (max-width: 767px) {
  .body-content {
    /* Mobile: 100vh - 48px (header) - 64px (bottom nav) */
    height: calc(100vh - 48px - 64px);
    /* Add padding bottom to prevent content from being hidden behind fixed bottom nav */
    padding-bottom: 0;
  }
}

/* Ensure the router-view takes full height */
.body-content > * {
  min-height: 100%;
}
</style>