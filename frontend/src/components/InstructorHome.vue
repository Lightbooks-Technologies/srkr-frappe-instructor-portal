<template>
  <div class="home-page">
    <!-- Welcome Card -->
    <div class="welcome-card">
      <h1 class="welcome-name">Hi {{props.events?.instructor?.employee_name || ''}},</h1>
      <p class="welcome-date">{{ getGreeting() }}, {{ getCurrentDay() }} {{ getCurrentDate() }}</p>
      
      <router-link to="/schedule" class="schedule-link">
        <div class="schedule-text">View Schedule</div>
        <FeatherIcon name="chevron-right" class="w-5 h-5 text-white" />
      </router-link>
    </div>

    <!-- Today's Classes Section -->
    <div class="classes-section">
      <div v-if="!todaysClasses || todaysClasses.length === 0" class="no-classes-card">
        <div class="calendar-icon">
          <FeatherIcon name="calendar" class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="no-classes-title">No Classes Today</h3>
        <p class="no-classes-subtitle">Enjoy your free day!</p>
      </div>
      
      <div v-else class="classes-card">
        <h3 class="classes-title">Today's Classes</h3>
        <div class="classes-list">
          <div v-for="(classItem, index) in todaysClasses" :key="classItem.id || index" class="class-item">
            <div class="class-info">
              <div class="class-name">{{ classItem.name }}</div>
              <div class="class-time">{{ classItem.time }}</div>
              <div class="class-room">{{ classItem.room }}</div>
            </div>
            <div class="class-status-container">
              <div class="class-status" :class="getClassStatus(classItem.startTime, classItem.endTime)">
                {{ getStatusText(classItem.startTime, classItem.endTime) }}
              </div>
            </div>
          </div>
        </div>
        <router-link to="/schedule" class="view-all-btn">
          <span>View All</span>
          <FeatherIcon name="arrow-right" class="w-4 h-4" />
        </router-link>
      </div>
    </div>

    <!-- Action Cards Grid -->
    <!-- <div class="cards-grid">
      <router-link to="/clubs" class="action-card clubs-card">
        <div class="card-icon clubs-icon">
          <FeatherIcon name="users" class="w-6 h-6 text-white" />
        </div>
        <div class="card-title">Clubs</div>
        <div class="card-subtitle">Join activities</div>
      </router-link>

      <router-link to="/events" class="action-card events-card">
        <div class="card-icon events-icon">
          <FeatherIcon name="calendar-days" class="w-6 h-6 text-white" />
        </div>
        <div class="card-title">Events</div>
        <div class="card-subtitle">8 upcoming</div>
      </router-link>

      <router-link to="/requests" class="action-card requests-card">
        <div class="card-icon requests-icon">
          <FeatherIcon name="user-check" class="w-6 h-6 text-white" />
        </div>
        <div class="card-title">Requests</div>
        <div class="card-subtitle">Submit requests</div>
      </router-link>

      <router-link to="/posts/new" class="action-card posts-card">
        <div class="card-icon posts-icon">
          <FeatherIcon name="edit-3" class="w-6 h-6 text-white" />
        </div>
        <div class="card-title">Add New Post</div>
        <div class="card-subtitle">Share updates</div>
      </router-link>
    </div> -->
  </div>
</template>

<script setup>
import { FeatherIcon } from 'frappe-ui'
import { computed } from 'vue'

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

// Get current greeting based on time
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

// Get current day
function getCurrentDay() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const today = new Date()
  return days[today.getDay()]
}

// Get current date
function getCurrentDate() {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const today = new Date()
  const day = today.getDate()
  const month = months[today.getMonth()]
  return `${day} ${month}`
}

// Format end time from API response
function formatEndTime(timeString) {
  const date = new Date(timeString)
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  })
}

// Get class status based on time (using full datetime string)
function getClassStatus(startTimeString, endTimeString) {
  // Get current time in IST
  const nowIST = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}))
  
  // Parse class times (assuming they're already in IST)
  const classStartTime = new Date(startTimeString)
  const classEndTime = new Date(endTimeString)
  
  if (nowIST < classStartTime) return 'upcoming'
  if (nowIST >= classStartTime && nowIST <= classEndTime) return 'ongoing'
  return 'completed'
}

// Get status text
function getStatusText(startTimeString, endTimeString) {
  const status = getClassStatus(startTimeString, endTimeString)
  switch (status) {
    case 'completed': return 'Completed'
    case 'ongoing': return 'Ongoing'
    case 'upcoming': return 'Upcoming'
    default: return 'Upcoming'
  }
}

</script>

<style scoped>
.home-page {
  max-width: 100%;
  margin: 0 auto;
  padding: 0 0 2rem 0;
}

.welcome-card {
  background: linear-gradient(135deg, #4c63d2 0%, #6366f1 100%);
  margin: 1rem 1rem 1.5rem 1rem;
  padding: 1.5rem;
  border-radius: 1rem;
  color: white;
  position: relative;
  overflow: hidden;
}

.welcome-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  z-index: 1;
}

.welcome-name {
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  position: relative;
  z-index: 2;
}

.welcome-date {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 2;
}

.schedule-link {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  text-decoration: none;
  color: white;
  font-weight: 600;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.schedule-link:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.schedule-text {
  font-size: 1rem;
}

.classes-section {
  margin: 0 1rem 1.5rem 1rem;
}

.no-classes-card {
  background: white;
  border-radius: 1.5rem;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.calendar-icon {
  margin-bottom: 1rem;
}

.no-classes-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.no-classes-subtitle {
  color: #6b7280;
  font-size: 0.9rem;
}

.classes-card {
  background: white;
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.classes-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.classes-list {
  space-y: 0.75rem;
}

.class-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.75rem;
  margin-bottom: 0.75rem;
}

.class-info {
  flex: 1;
}

.class-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.95rem;
}

.class-time {
  color: #4f46e5;
  font-size: 0.85rem;
  font-weight: 500;
  margin: 0.25rem 0;
}

.class-room {
  color: #6b7280;
  font-size: 0.8rem;
}

.class-status-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.class-time-range {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: right;
}

.class-status {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
  min-width: 80px;
}

.status-text {
  font-weight: 600;
  margin-bottom: 0.125rem;
}

.class-end-time {
  font-size: 0.65rem;
  opacity: 0.8;
  text-transform: none;
  font-weight: 400;
  letter-spacing: normal;
}

.class-status.upcoming {
  background: #dbeafe;
  color: #1d4ed8;
}

.class-status.ongoing {
  background: #d1fae5;
  color: #059669;
}

.class-status.completed {
  background: #f3f4f6;
  color: #6b7280;
}

.view-all-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.5rem;
  color: #4f46e5;
  font-weight: 500;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.view-all-btn:hover {
  color: #3730a3;
}

.cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 0 1rem;
}

.action-card {
  background: white;
  border-radius: 1.5rem;
  padding: 1.5rem;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.action-card:hover::before {
  opacity: 1;
}

.clubs-card {
  background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
  color: white;
}

.events-card {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.requests-card {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  color: white;
}

.posts-card {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.card-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.clubs-icon {
  background: rgba(255, 255, 255, 0.2);
}

.events-icon {
  background: rgba(255, 255, 255, 0.2);
}

.requests-icon {
  background: rgba(255, 255, 255, 0.2);
}

.posts-icon {
  background: rgba(255, 255, 255, 0.2);
}

.card-title {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.card-subtitle {
  font-size: 0.85rem;
  opacity: 0.8;
}
</style>