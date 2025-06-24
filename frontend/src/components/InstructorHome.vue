<template>
  <div class="home-page">
    <!-- Welcome Card -->
    <div class="welcome-card">
      <div class="welcome-content">
        <h1 class="welcome-name">Hello, {{props.events?.instructor?.employee_name || 'Instructor Example'}}!</h1>
        <p class="welcome-date">{{ getGreeting() }}, {{ getCurrentDay() }} {{ getCurrentDate() }}</p>
        
        <router-link to="/schedule" class="schedule-btn">
          <span>View Full Schedule</span>
          <FeatherIcon name="arrow-right" class="w-5 h-5 ml-2" />
        </router-link>
      </div>
      <div class="welcome-bg-elements">
        <div class="bg-circle-1"></div>
        <div class="bg-circle-2"></div>
      </div>
    </div>

    <!-- Today's Classes Section -->
    <div class="classes-section">
      <div class="section-header">
        <h3 class="section-title">Today's Classes</h3>
        <router-link to="/schedule" class="view-all-link">
          <span>View All</span>
          <FeatherIcon name="chevron-right" class="w-4 h-4 ml-1" />
        </router-link>
      </div>

      <div v-if="!todaysClasses || todaysClasses.length === 0" class="no-classes-card">
        <div class="no-classes-content">
          <FeatherIcon name="calendar" class="w-12 h-12 text-gray-400 mb-4" />
          <h4 class="no-classes-title">No Classes Today</h4>
          <p class="no-classes-subtitle">Enjoy your free day!</p>
        </div>
      </div>
      
      <div v-else class="classes-list">
        <div v-for="(classItem, index) in todaysClasses" :key="classItem.id || index" 
             class="class-card"
             :class="{ 'ongoing-highlight': getClassStatus(classItem.startTime, classItem.endTime) === 'ongoing' }"
             @click="navigateToAttendance(classItem)">
          <div class="class-main-content">
            <div class="class-info">
              <h4 class="class-name">{{ classItem.name }}</h4>
              <p class="class-time">{{ classItem.time }}</p>
              <p class="class-room">{{ classItem.room }}</p>
            </div>
            <div class="class-status-badge" :class="getStatusClass(classItem.startTime, classItem.endTime)">
              {{ getStatusText(classItem.startTime, classItem.endTime) }}
            </div>
          </div>
          
          <!-- Attendance Status Bar - Only for completed classes -->
          <div v-if="shouldShowAttendance(classItem)" class="attendance-status-bar">
            <div v-if="!hasAttendanceData(classItem)" class="attendance-incomplete">
              <div class="incomplete-icon">
                <FeatherIcon name="alert-circle" class="w-4 h-4" />
              </div>
              <span class="incomplete-text">Attendance Incomplete</span>
              <div class="incomplete-accent"></div>
            </div>
            <div v-else class="attendance-complete">
              <div class="attendance-header">
                <div class="attendance-icon">
                  <FeatherIcon name="check-circle" class="w-4 h-4" />
                </div>
                <div class="attendance-summary">
                  <span class="summary-text">{{ classItem.attendance_summary.present_count }}/{{ classItem.attendance_summary.total_students }} Present</span>
                  <span class="percentage-badge" :class="getPercentageBadgeClass(classItem)">{{ getAttendancePercentage(classItem) }}%</span>
                </div>
              </div>
              <div class="attendance-visual">
                <div class="attendance-bar">
                  <div class="bar-fill" :class="getProgressBarClass(classItem)" :style="{ width: getAttendancePercentage(classItem) + '%' }"></div>
                </div>
                <div class="attendance-details">
                  <div class="detail-item present">
                    <div class="detail-dot present-dot"></div>
                    <span>{{ classItem.attendance_summary.present_count }} Present</span>
                  </div>
                  <div class="detail-item absent">
                    <div class="detail-dot absent-dot"></div>
                    <span>{{ classItem.attendance_summary.absent_count }} Absent</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { FeatherIcon } from 'frappe-ui'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  events: {
    type: Object,
    required: true
  }
})

// Get today's classes from props
const todaysClasses = computed(() => {
  return props.events?.todaysClasses || []
})

// Navigate to attendance page with class data
const navigateToAttendance = (classItem) => {
  router.push({
    path: '/attendance',
    query: {
      basedOn: 'Course Schedule',
      courseName: classItem.name,
      courseTime: classItem.time,
      courseRoom: classItem.room,
      courseScheduleId: classItem.id,
      studentGroup: classItem.studentGroup
    }
  })
}

// Get current greeting based on local time
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

// Get current day in local time
function getCurrentDay() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const today = new Date()
  return days[today.getDay()]
}

// Get current date in local time
function getCurrentDate() {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const today = new Date()
  const day = today.getDate()
  const month = months[today.getMonth()]
  return `${day} ${month}`
}

// Get class status based on local time
function getClassStatus(startTimeString, endTimeString) {
  if (!startTimeString || !endTimeString) return 'upcoming'
  
  const now = new Date()
  const classStartTime = new Date(startTimeString)
  const classEndTime = new Date(endTimeString)
  
  if (now < classStartTime) return 'upcoming'
  if (now >= classStartTime && now <= classEndTime) return 'ongoing'
  return 'completed'
}

// Get status text
function getStatusText(startTimeString, endTimeString) {
  const status = getClassStatus(startTimeString, endTimeString)
  switch (status) {
    case 'completed': return 'COMPLETED'
    case 'ongoing': return 'ONGOING'
    case 'upcoming': return 'UPCOMING'
    default: return 'UPCOMING'
  }
}

// Get status CSS class
function getStatusClass(startTimeString, endTimeString) {
  const status = getClassStatus(startTimeString, endTimeString)
  return `status-${status}`
}

// Check if attendance should be shown (only for completed classes)
function shouldShowAttendance(classItem) {
  const status = getClassStatus(classItem.startTime, classItem.endTime)
  return status === 'completed'
}

// Check if class has attendance data
function hasAttendanceData(classItem) {
  return classItem.attendance_summary && 
         typeof classItem.attendance_summary.total_students === 'number' &&
         classItem.attendance_summary.total_students > 0
}

// Calculate attendance percentage
function getAttendancePercentage(classItem) {
  if (!hasAttendanceData(classItem)) return 0
  
  const { total_students, present_count } = classItem.attendance_summary
  return Math.round((present_count / total_students) * 100)
}

// Get dynamic background class for percentage badge
function getPercentageBadgeClass(classItem) {
  const percentage = getAttendancePercentage(classItem)
  if (percentage >= 80) return 'percentage-badge-green'
  if (percentage >= 60) return 'percentage-badge-yellow'
  return 'percentage-badge-red'
}

// Get dynamic color for progress bar
function getProgressBarClass(classItem) {
  const percentage = getAttendancePercentage(classItem)
  if (percentage >= 80) return 'bar-fill-green'
  if (percentage >= 60) return 'bar-fill-yellow'
  return 'bar-fill-red'
}

// Expose utility functions if needed by parent
defineExpose({
  getClassStatus,
  getStatusText,
  shouldShowAttendance,
  hasAttendanceData,
  getAttendancePercentage,
  getPercentageBadgeClass,
  getProgressBarClass
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background-color: #f0fdfa;
  padding-bottom: 2rem;
}

/* Welcome Card */
.welcome-card {
  position: relative;
  background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
  margin: 1.5rem 1rem;
  padding: 1.5rem;
  border-radius: 0.75rem;
  color: white;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.welcome-content {
  position: relative;
  z-index: 10;
}

.welcome-name {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  line-height: 1.2;
}

.welcome-date {
  color: rgba(240, 253, 250, 0.9);
  font-size: 0.875rem;
  font-weight: 300;
  margin-bottom: 1.5rem;
}

.schedule-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  color: #0d9488;
  font-weight: 500;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
  transform: translateZ(0);
}

.schedule-btn:hover {
  background: white;
  transform: scale(1.05);
}

.welcome-bg-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.bg-circle-1 {
  position: absolute;
  top: -2.5rem;
  right: -2.5rem;
  width: 8rem;
  height: 8rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  opacity: 0.6;
}

.bg-circle-2 {
  position: absolute;
  bottom: -3rem;
  left: -2rem;
  width: 10rem;
  height: 10rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  opacity: 0.5;
}

/* Classes Section */
.classes-section {
  margin: 0 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.view-all-link {
  display: flex;
  align-items: center;
  color: #0d9488;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
}

.view-all-link:hover {
  color: #f472b6;
}

/* No Classes Card */
.no-classes-card {
  background: white;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.no-classes-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.no-classes-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.no-classes-subtitle {
  color: #6b7280;
  font-size: 0.875rem;
}

/* Classes List */
.classes-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.class-card {
  background: white;
  border-radius: 0.5rem;
  padding: 0.875rem 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  cursor: pointer;
  transition: all 0.2s;
}

.class-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.ongoing-highlight {
  border: 2px solid #f59e0b;
  border-opacity: 0.7;
}

.class-main-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.class-info {
  flex: 1;
}

.class-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.class-time {
  font-size: 0.75rem;
  font-weight: 500;
  color: #0d9488;
  margin-bottom: 0.125rem;
}

.class-room {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Status Badges */
.class-status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  white-space: nowrap;
}

.status-completed {
  background-color: #d1fae5;
  color: #047857;
}

.status-ongoing {
  background-color: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.status-upcoming {
  background-color: #dbeafe;
  color: #1d4ed8;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

/* Attendance Status Bar */
.attendance-status-bar {
  margin-top: 0.875rem;
}

/* Incomplete Attendance Styling */
.attendance-incomplete {
  position: relative;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #f87171;
  border-radius: 0.5rem;
  padding: 0.35rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
}

.attendance-incomplete::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent 0px,
    transparent 3px,
    rgba(248, 113, 113, 0.1) 3px,
    rgba(248, 113, 113, 0.1) 6px
  );
  pointer-events: none;
}

.incomplete-icon {
  color: #dc2626;
  z-index: 1;
  position: relative;
}

.incomplete-text {
  color: #dc2626;
  font-size: 0.8rem;
  font-weight: 600;
  z-index: 1;
  position: relative;
}

/* .incomplete-accent {
  position: absolute;
  top: 0;
  right: 0;
  width: 3px;
  height: 100%;
  background: #dc2626;
} */

/* Complete Attendance Styling */
.attendance-complete {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #0f7e75;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  position: relative;
  overflow: hidden;
}

/* .attendance-complete::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%);
} */

.attendance-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.attendance-icon {
  color: #0ea5e9;
}

.attendance-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
}

.summary-text {
  color: #075985;
  font-size: 0.8rem;
  font-weight: 500;
}

.percentage-badge {
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

/* Dynamic Percentage Badge Colors */
.percentage-badge-green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.percentage-badge-yellow {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
}

.percentage-badge-red {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

.attendance-visual {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.attendance-bar {
  width: 100%;
  height: 6px;
  background: rgba(186, 230, 253, 0.5);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

/* Dynamic Progress Bar Colors */
.bar-fill-green {
  background: linear-gradient(90deg, #10b981 0%, #059669 50%, #047857 100%);
}

.bar-fill-yellow {
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
}

.bar-fill-red {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%);
}

.bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.attendance-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.detail-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.present-dot {
  background: #10b981;
  box-shadow: 0 0 4px rgba(16, 185, 129, 0.5);
}

.absent-dot {
  background: #ef4444;
  box-shadow: 0 0 4px rgba(239, 68, 68, 0.5);
}

.detail-item.present {
  color: #059669;
}

.detail-item.absent {
  color: #dc2626;
}

/* Responsive Design */
@media (min-width: 640px) {
  .welcome-name {
    font-size: 1.875rem;
  }
  
  .welcome-date {
    font-size: 1rem;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .class-name {
    font-size: 1rem;
  }
  
  .class-time {
    font-size: 0.875rem;
  }
  
  .class-room {
    font-size: 0.75rem;
  }
}
</style>