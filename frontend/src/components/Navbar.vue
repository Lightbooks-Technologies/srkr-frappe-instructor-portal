<template>
  <header class="modern-header">
    <div class="header-container">
      <!-- Logo Section -->
      <div class="logo-section">
        <img class="logo-image" src="/assets/instructor/frontend/srkrlogo.png" alt="SRKR" />
        <!-- <span class="logo-text">SRKR</span> -->
      </div>

      <!-- Actions Section -->
      <div class="actions-section">
        <!-- <button class="notification-btn">
          <FeatherIcon name="bell" class="notification-icon" />
          <span class="notification-badge"></span>
        </button> -->

        <div class="user-avatar" @click="navigateToProfile">
          <img 
            v-if="shouldShowImage && !imageError" 
            :src="getAvatarImage()"
            :alt="studentInfo?.employee_name || 'User'"
            class="avatar-image"
            @error="handleImageError"
            @load="handleImageLoad"
          />
          <div v-else class="avatar-placeholder">
            <span class="avatar-initials">
              {{ getInitials(studentInfo?.employee_name) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { FeatherIcon } from 'frappe-ui'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { leaveStore } from '@/stores/leave'
import { studentStore } from '@/stores/student'

const router = useRouter()
const currentRoute = computed(() => router.currentRoute.value.name)
const { getStudentInfo } = studentStore()
const { setIsAttendancePage } = leaveStore()

// Reactive refs for image handling
const imageError = ref(false)
const imageLoaded = ref(false)

// Make studentInfo reactive and computed
const studentInfo = computed(() => {
  const info = getStudentInfo()
  return info?.value || {}
})

// Default fallback avatar image (local path)
const defaultAvatarImage = "/images/default-avatar.png"

// Watch for changes in studentInfo to reset image state
watch(studentInfo, (newValue) => {
  if (newValue?.image) {
    imageError.value = false
    imageLoaded.value = false
  }
}, { deep: true })

// Computed property to determine if we should show an image
const shouldShowImage = computed(() => {
  return studentInfo.value?.image || defaultAvatarImage
})

// Get avatar image with fallback
const getAvatarImage = () => {
  if (studentInfo.value?.image && !imageError.value) {
    return studentInfo.value.image
  }
  return defaultAvatarImage
}

// Handle image load error
const handleImageError = () => {
  console.log('Avatar image failed to load, using fallback')
  imageError.value = true
}

// Handle successful image load
const handleImageLoad = () => {
  console.log('Avatar image loaded successfully')
  imageLoaded.value = true
  imageError.value = false
}

// Get initials for avatar placeholder
const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Navigate to profile screen
const navigateToProfile = () => {
  router.push('/profile')
}
</script>

<style scoped>
.modern-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid #e0f2f1;
}

.header-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 3.5rem;
}

/* Logo Section */
.logo-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.logo-section:hover {
  transform: scale(1.02);
}

.logo-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0d9488;
  letter-spacing: -0.025em;
  display: block;
}

/* Actions Section */
.actions-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.notification-btn {
  position: relative;
  padding: 0.5rem;
  color: #6b7280;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-btn:hover {
  color: #0d9488;
  background: rgba(13, 148, 136, 0.1);
  transform: translateY(-1px);
}

.notification-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.notification-badge {
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
  display: block;
  height: 0.625rem;
  width: 0.625rem;
  border-radius: 50%;
  background: #f472b6;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user-avatar {
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
  width: 2.25rem;
  height: 2.25rem;
}

.user-avatar:hover {
  transform: scale(1.05);
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 10%;
  /* border: 2px solid #0d9488; */
  object-fit: cover;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 10%;
  /* border: 2px solid #0d9488; */
  background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.avatar-initials {
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.025em;
}

/* Responsive Design */
@media (min-width: 640px) {
  .header-container {
    padding: 1rem 1.5rem;
  }
  
  .logo-text {
    font-size: 1.25rem;
  }
  
  .actions-section {
    gap: 1rem;
  }
  
  .notification-icon {
    width: 1.75rem;
    height: 1.75rem;
  }
  
  .notification-badge {
    height: 0.75rem;
    width: 0.75rem;
    top: 0.25rem;
    right: 0.25rem;
  }
  
  .user-avatar {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .avatar-initials {
    font-size: 1rem;
  }
}

/* Additional styling for glassmorphism effect */
@supports (backdrop-filter: blur(12px)) {
  .modern-header {
    background: rgba(255, 255, 255, 0.85);
  }
}

/* Fallback for browsers that don't support backdrop-filter */
@supports not (backdrop-filter: blur(12px)) {
  .modern-header {
    background: rgba(255, 255, 255, 0.95);
  }
}
.logo-image {
  height: 2rem;
}
</style>