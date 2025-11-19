<template>
  <div class="student-list-container">
    <div v-if="profiles.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      </div>
      <p class="empty-title">No Students Yet</p>
      <p class="empty-description">Students will appear here once they are assigned to you.</p>
    </div>
    <ul v-else class="student-list">
      <li
        v-for="profile in profiles"
        :key="profile.name"
        class="student-item"
        @click="selectStudent(profile)"
      >
        <!-- Profile Picture or Avatar -->
        <div class="student-avatar">
          <img 
            v-if="profile.student_image" 
            :src="profile.student_image" 
            :alt="profile.student_name"
            class="avatar-image"
            @error="handleImageError"
          />
          <span v-else class="avatar-initials">{{ getInitials(profile.student_name) }}</span>
        </div>

        <!-- Student Info -->
        <div class="student-info">
          <span class="student-name">{{ formatName(profile.student_name) }}</span>
          <span class="student-group">{{ profile.student_group }}</span>
          <div class="student-footer">
            <span class="student-id">{{ profile.custom_student_id }}</span>
            <span 
              v-if="profile.cumulative_attendance !== null && profile.cumulative_attendance !== undefined" 
              class="attendance-badge"
              :class="getAttendanceClass(profile.cumulative_attendance)"
            >
              {{ profile.cumulative_attendance.toFixed(1) }}%
            </span>
          </div>
        </div>

        <!-- Chevron -->
        <div class="student-chevron">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  profiles: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['student-selected']);

const selectStudent = (profile) => {
  emit('student-selected', profile);
};

const formatName = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getAttendanceClass = (attendance) => {
  if (attendance >= 90) return 'attendance-excellent';
  if (attendance >= 75) return 'attendance-good';
  if (attendance >= 60) return 'attendance-warning';
  return 'attendance-critical';
};

const handleImageError = (event) => {
  event.target.style.display = 'none';
};
</script>

<style scoped>
.student-list-container {
  padding: 0;
  background-color: #ffffff;
  min-height: 100%;
}

.student-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
  background-color: #ffffff;
  border-bottom: 1px solid #f3f4f6;
}

.student-item:hover {
  background-color: #f9fafb;
}

.student-item:active {
  background-color: #f3f4f6;
}

.student-avatar {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  font-weight: 600;
  font-size: 0.9375rem;
  color: white;
  letter-spacing: 0.5px;
}

.student-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 0.25rem;
  min-width: 0;
}

.student-name {
  font-weight: 600;
  font-size: 0.9375rem;
  color: #111827;
  line-height: 1.4;
}

.student-group {
  font-size: 0.8125rem;
  color: #6b7280;
  line-height: 1.4;
}

.student-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.student-id {
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
  line-height: 1.4;
}

.attendance-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  white-space: nowrap;
  line-height: 1.4;
}

.attendance-excellent {
  background-color: #d1fae5;
  color: #065f46;
}

.attendance-good {
  background-color: #dbeafe;
  color: #1e40af;
}

.attendance-warning {
  background-color: #fef3c7;
  color: #92400e;
}

.attendance-critical {
  background-color: #fee2e2;
  color: #991b1b;
}

.student-chevron {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #b0b4ba;
  transition: all 0.15s ease;
}

.student-item:hover .student-chevron {
  color: #9ca3af;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  color: #9ca3af;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.empty-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  max-width: 280px;
  line-height: 1.5;
}
</style>