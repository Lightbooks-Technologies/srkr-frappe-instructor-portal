<template>
  <div class="w-full h-full">
    <ScheduleXCalendar
      v-if="calendarApp != undefined"
      :calendar-app="calendarApp"
    />
  </div>
</template>

<script setup>
import { ScheduleXCalendar } from '@schedule-x/vue'
import {
  createCalendar,
  viewDay,
  viewWeek,
  viewMonthGrid,
  viewMonthAgenda,
} from '@schedule-x/calendar'
import '@schedule-x/theme-default/dist/index.css'
import { createEventModalPlugin } from '@schedule-x/event-modal'
import { createResource } from 'frappe-ui'
import { ref, watch, shallowRef } from 'vue'
import { studentStore } from '@/stores/student'
import { useRouter } from 'vue-router'

const router = useRouter()
const { getStudentInfo } = studentStore()
const instructorInfo = getStudentInfo().value

const events = ref([])
const calendarApp = shallowRef()
const currentRange = ref({
  start: null,
  end: null
})

// Navigate to attendance page with class data
const navigateToAttendance = (eventData) => {
  router.push({
    path: '/attendance',
    query: {
      courseScheduleId: eventData.scheduleId,
      studentGroup: eventData.studentGroup,
      basedOn: 'Course Schedule',
      courseName: eventData.title,
      courseTime: `${formatTimeTo12Hour(eventData.start)} - ${formatTimeTo12Hour(eventData.end)}`,
      courseRoom: eventData.location
    }
  })
}

// Helper function to get first day of month
const getFirstDayOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// Helper function to get last day of month
const getLastDayOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

// Helper function to format date for API
const formatDateForAPI = (date) => {
  return date.toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata'
  })
}

// Get current month's date range
const getCurrentMonthRange = () => {
  const now = new Date()
  return {
    start: formatDateForAPI(getFirstDayOfMonth(now)),
    end: formatDateForAPI(getLastDayOfMonth(now))
  }
}

// This function is still useful for passing time to the navigation query
const formatTimeTo12Hour = (datetimeStr) => {
  if (!datetimeStr) return '12:00 AM'
  
  // Extract time part from "YYYY-MM-DD HH:MM" format
  const timePart = datetimeStr.split(' ')[1]
  if (!timePart) return '12:00 AM'
  
  const [hours, minutes] = timePart.split(':')
  const hour24 = parseInt(hours, 10)
  const minute = minutes || '00'
  
  if (hour24 === 0) {
    return `12:${minute} AM`
  } else if (hour24 < 12) {
    return `${hour24}:${minute} AM`
  } else if (hour24 === 12) {
    return `12:${minute} PM`
  } else {
    return `${hour24 - 12}:${minute} PM`
  }
}

// Add custom styles and handle modal customization after calendar creation
const addCustomModalStyles = () => {
  const style = document.createElement('style')
  style.id = 'custom-attendance-styles'
  style.textContent = `
    .custom-attendance-btn {
      background: linear-gradient(135deg, #4c63d2 0%, #6366f1 100%);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 16px;
      width: 100%;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .custom-attendance-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(76, 99, 210, 0.3);
    }
    
    .custom-attendance-btn:active {
      transform: translateY(0);
    }
  `
  
  const existingStyle = document.getElementById('custom-attendance-styles')
  if (existingStyle) {
    existingStyle.remove()
  }
  
  document.head.appendChild(style)
}

// Function to customize the modal after it's created
const customizeEventModal = (eventData) => {
  setTimeout(() => {
    const modal = document.querySelector('.sx__event-modal')
    if (modal) {
      if (!modal.querySelector('.custom-attendance-btn')) {
        let content = modal.querySelector('.sx__event-modal__content')
        if (!content) {
          content = modal.querySelector('.sx__has-icon.sx__event-modal__description') || modal
        }
        
        if (content) {
          const attendanceBtn = document.createElement('button')
          attendanceBtn.className = 'custom-attendance-btn'
          attendanceBtn.innerHTML = 'Take Attendance'
          
          attendanceBtn.addEventListener('click', () => {
            const fullEventData = events.value.find(event => event.id === eventData.id)
            if (fullEventData) {
              navigateToAttendance(fullEventData)
            }
            const modalToClose = document.querySelector('.sx__event-modal')
            if (modalToClose && modalToClose.parentNode) {
              modalToClose.parentNode.removeChild(modalToClose)
            }
          })
          
          const spacer = document.createElement('div')
          spacer.style.marginTop = '16px'
          content.appendChild(spacer)
          content.appendChild(attendanceBtn)
        }
      }
    }
  }, 200)
}

// NEW: Helper function to determine contrasting text color (black or white) for a given background hex color.
const getContrastingTextColor = (hexColor) => {
  if (!hexColor) return '#000000';
  const color = hexColor.trim().replace('#', '');
  if (color.length !== 6) return '#000000';
  
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
}

const scheduleResource = createResource({
  url: 'srkr_frappe_app_api.instructor.api.get_instructor_schedule',
  params: {
    instructor: instructorInfo.instructor_record_id,
    start_date: getCurrentMonthRange().start,
    end_date: getCurrentMonthRange().end,
  },
  // MODIFIED: Updated onSuccess to handle event colors
  onSuccess: (response) => {
    const schedule = []
    const calendarConfigs = {} // To store calendar colors

    response.forEach((classSchedule, index) => {
      // Handle inconsistent API key for calendar ID ('calendar_id' vs 'calendarid')
      const calendarId = classSchedule.calendar_id || classSchedule.calendarid;
      // Handle potential newlines in color string from API and provide a default
      const eventColor = classSchedule.color ? classSchedule.color.trim() : '#d1e5f7';
      
      // If we haven't created a calendar config for this ID yet, create it now
      if (calendarId && !calendarConfigs[calendarId]) {
        const textColor = getContrastingTextColor(eventColor);
        calendarConfigs[calendarId] = {
          colorName: calendarId,
          // For simplicity, we use the same colors for light and dark themes
          lightColors: {
            main: eventColor, // Color for the event dot/stripe
            container: eventColor, // Background color for the event
            onContainer: textColor, // Text color for the event
          },
          darkColors: {
            main: eventColor,
            container: eventColor,
            onContainer: textColor,
          },
        };
      }
      
      const startDateTime = classSchedule.start_time
      const endDateTime = classSchedule.end_time
      
      schedule.push({
        id: `${classSchedule.course_schedule_id}-${index}`,
        title: `${classSchedule.course_name}`,
        start: startDateTime,
        end: endDateTime,
        description: `Room: ${classSchedule.room}\nGroup: ${classSchedule.student_group}`,
        location: classSchedule.room,
        calendarId: calendarId || 'default', // Assign the calendarId to the event
        // Additional data for reference
        courseId: classSchedule.course_id,
        studentGroup: classSchedule.student_group,
        scheduleId: classSchedule.course_schedule_id,
      })
    })
    
    events.value = schedule
    
    // Update calendar events and also the calendar configurations for colors
    if (calendarApp.value) {
      calendarApp.value.calendars.set(calendarConfigs);
      calendarApp.value.events.set(schedule)
    }
  },
  onError: (error) => {
    console.error('Error fetching schedule:', error)
  },
  auto: true,
})

// Function to fetch schedule for a specific date range
const fetchScheduleForRange = (startDate, endDate) => {
  scheduleResource.update({
    params: {
      instructor: instructorInfo.instructor_record_id,
      start_date: startDate,
      end_date: endDate,
    }
  })
  scheduleResource.fetch()
}

// Handle range updates from calendar navigation
const handleRangeUpdate = (range) => {
  const startDate = formatDateForAPI(new Date(range.start))
  const endDate = formatDateForAPI(new Date(range.end))
  
  if (currentRange.value.start !== startDate || currentRange.value.end !== endDate) {
    currentRange.value = { start: startDate, end: endDate }
    fetchScheduleForRange(startDate, endDate)
  }
}

// MODIFIED: Create the calendar instance with updated settings
calendarApp.value = createCalendar({
  // Switched to 'en-US' locale to display time in 12-hour format (e.g., 2:00 PM)
  locale: 'en-US',
  selectedDate: new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata'
  }),
  views: [viewWeek, viewMonthAgenda, viewDay, viewMonthGrid],
  defaultView: viewMonthGrid.name,
  plugins: [createEventModalPlugin()],
  // Start with an empty calendars object, which will be populated dynamically
  calendars: {},
  events: events.value,
  callbacks: {
    onRangeUpdate: handleRangeUpdate,
    onEventClick: (calendarEvent) => {
      addCustomModalStyles()
      customizeEventModal(calendarEvent)
    },
  },
})

// Watch for events changes and update calendar
watch(events, (newEvents) => {
  if (calendarApp.value && newEvents.length > 0) {
    calendarApp.value.events.set(newEvents)
  }
}, { deep: true })

// Utility methods for programmatic navigation
const navigateToMonth = (year, month) => {
  const targetDate = new Date(year, month - 1, 1)
  const startDate = formatDateForAPI(getFirstDayOfMonth(targetDate))
  const endDate = formatDateForAPI(getLastDayOfMonth(targetDate))
  
  if (calendarApp.value) {
    calendarApp.value.selectedDate = formatDateForAPI(targetDate)
  }
  
  fetchScheduleForRange(startDate, endDate)
}

const goToToday = () => {
  const today = new Date()
  const startDate = formatDateForAPI(getFirstDayOfMonth(today))
  const endDate = formatDateForAPI(getLastDayOfMonth(today))
  
  if (calendarApp.value) {
    calendarApp.value.selectedDate = formatDateForAPI(today)
  }
  
  fetchScheduleForRange(startDate, endDate)
}

// Expose methods for parent component
defineExpose({
  navigateToMonth,
  goToToday,
  fetchScheduleForRange
})
</script>

<style>
.sx__calendar {
  border-radius: 0;
  border-width: 0 0 1px 0;
}
.sx__month-grid-day__events {
  min-height: 60px;
}
</style>