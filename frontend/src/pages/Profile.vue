<template>
  <div class="profile-page">
    <!-- Header -->
    <!-- <div class="header">
      <button @click="$router.go(-1)" class="back-button">
        <FeatherIcon name="arrow-left" class="w-5 h-5" />
      </button>
      <h1 class="page-title">Profile</h1>
    </div> -->

    <!-- Profile Content -->
    <div class="profile-content">
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="avatar-container">
          <img 
            v-if="studentInfo.image" 
            :src="studentInfo.image" 
            :alt="studentInfo.employee_name"
            class="avatar-image"
          />
          <div v-else class="avatar-placeholder">
            <span class="avatar-initials">
              {{ getInitials(studentInfo.employee_name) }}
            </span>
          </div>
        </div>
        <div class="profile-info">
          <h2 class="student-name">{{ studentInfo.employee_name }}</h2>
          <p class="student-email">{{ user?.data?.email || 'No email provided' }}</p>
        </div>
      </div>

      <!-- Profile Details -->
      <div class="profile-details">
        <div v-for="section in infoFormat" :key="section.section" class="details-section">
          <h3 class="section-title">{{ section.title }}</h3>
          <div class="section-grid">
            <div v-for="field in section.fields" :key="field.label" class="detail-item">
              <p class="detail-label">{{ field.label }}</p>
              <p class="detail-value">{{ field.value || 'Not provided' }}</p>
            </div>
          </div>
        </div>
        <!-- Remove Address Section - Not available in API -->
      </div>

      <!-- Info Notice -->
      <div class="info-notice">
        <FeatherIcon name="info" class="info-icon" />
        <p class="info-text">
          In case of any incorrect details, please contact the administration.
        </p>
      </div>

      <!-- Logout Button -->
      <div class="logout-section">
        <button @click="handleLogout" class="logout-button" :disabled="isLoggingOut">
          <FeatherIcon name="log-out" class="w-5 h-5" />
          <span v-if="isLoggingOut">Logging out...</span>
          <span v-else>Logout</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { FeatherIcon } from 'frappe-ui'
import { ref } from 'vue'
import { studentStore } from '@/stores/student'
import { sessionStore } from '@/stores/session'
import { usersStore } from '@/stores/user'

const { user } = usersStore()
const { getStudentInfo } = studentStore()
const { logout } = sessionStore()

const isLoggingOut = ref(false)

// Use actual store data
const studentInfo = getStudentInfo().value

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

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'Not provided'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  })
}

const infoFormat = [
  {
    section: 'personal',
    title: 'Personal Information',
    fields: [
      {
        label: 'First Name',
        value: studentInfo?.first_name,
      },
      {
        label: 'Last Name',
        value: studentInfo?.last_name,
      },
      {
        label: 'Date of Birth',
        value: formatDate(studentInfo?.date_of_birth),
      },
      {
        label: 'Gender',
        value: studentInfo?.gender,
      },
    ],
  },
  {
    section: 'professional',
    title: 'Professional Information', 
    fields: [
      {
        label: 'Instructor ID',
        value: studentInfo?.instructor_id,
      },
      {
        label: 'Department',
        value: studentInfo?.department,
      },
      {
        label: 'Designation',
        value: studentInfo?.designation,
      },
      {
        label: 'Company Email',
        value: studentInfo?.company_email,
      },
    ],
  },
]

const handleLogout = async () => {
  try {
    isLoggingOut.value = true
    await logout.submit()
  } catch (error) {
    console.error('Logout failed:', error)
  } finally {
    isLoggingOut.value = false
  }
}
</script>

<style scoped>
.profile-page {
  max-width: 100%;
  margin: 0 auto;
  padding: 0 0 2rem 0;
  background: #f8fafc;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  gap: 1rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-button {
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
  color: #374151;
}

.back-button:hover {
  background: #f3f4f6;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.profile-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-bottom: 3px solid #e5e7eb;
}

.avatar-container {
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-initials {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
}

.profile-info {
  flex: 1;
}

.student-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.student-email {
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.details-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f3f4f6;
}

.section-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 640px) {
  .section-grid {
    grid-template-columns: 1fr;
  }
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.address-item {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  margin: 0;
}

.detail-value {
  color: #1f2937;
  font-weight: 500;
  margin: 0;
  word-break: break-word;
}

.info-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: #f0f9ff;
  border: 1px solid #e0f2fe;
  border-radius: 0.75rem;
  padding: 1rem;
}

.info-icon {
  color: #0284c7;
  width: 1rem;
  height: 1rem;
  margin-top: 0.125rem;
  flex-shrink: 0;
}

.info-text {
  color: #0c4a6e;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
}

.logout-section {
  margin-top: 1rem;
}

.logout-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
}

.logout-button:hover:not(:disabled) {
  background: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
}

.logout-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.logout-button:active:not(:disabled) {
  transform: translateY(0);
}
</style>