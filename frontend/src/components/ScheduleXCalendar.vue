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
      courseRoom: eventData.location,
      courseDate: new Date(eventData.start).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
      }),
      allCourseScheduleId: eventData.allCourseScheduleId ? eventData.allCourseScheduleId.join(',') : eventData.id
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
          // Add instructor and student group info
          const instructorInfo = document.createElement('div')
          instructorInfo.style.marginTop = '12px'
          instructorInfo.style.fontSize = '14px'
          instructorInfo.style.color = '#6b7280'
          
          const fullEventData = events.value.find(event => event.id === eventData.id)
          if (fullEventData) {
            const instructorNames = formatInstructorNames(
              fullEventData.instructor, 
              fullEventData.coInstructor1, 
              fullEventData.coInstructor2
            )
            // instructorInfo.innerHTML = `
            //   <div style="margin-bottom: 4px;"><strong>Instructor:</strong> ${instructorNames}</div>
            //   <div><strong>Student Group:</strong> ${fullEventData.studentGroup}</div>
            // `
            instructorInfo.innerHTML = `
              <div style="margin-bottom: 4px;"><strong>Instructor:</strong> ${instructorNames}</div>
            `
          }
          
          const attendanceBtn = document.createElement('button')
          attendanceBtn.className = 'custom-attendance-btn'
          attendanceBtn.innerHTML = eventData.attendanceSummary && Object.keys(eventData.attendanceSummary).length > 0 ? 'View Attendance' : 'Take Attendance'

          attendanceBtn.addEventListener('click', () => {
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
          
          // Append instructor info, then spacer, then button
          if (content.parentNode) {
            content.parentNode.appendChild(instructorInfo)
            content.parentNode.appendChild(spacer)
            content.parentNode.appendChild(attendanceBtn)
          } else {
            content.appendChild(instructorInfo)
            content.appendChild(spacer)
            content.appendChild(attendanceBtn)
          }
        }
      }
    }
  }, 200)
}


// Function to combine consecutive courses with the same course_id
const combineConsecutiveCourses = (scheduleData) => {
  if (!scheduleData || scheduleData.length === 0) {
    return []
  }

  // Sort by start_time to ensure proper ordering
  const sortedData = [...scheduleData].sort((a, b) => 
    new Date(a.start_time) - new Date(b.start_time)
  )

  const combined = []
  let currentGroup = null

  for (const course of sortedData) {
    // If this is the first course or different course_id/student_group, start a new group
    if (!currentGroup || 
        currentGroup.course_id !== course.course_id || 
        currentGroup.student_group !== course.student_group) {
      // Save the previous group if it exists
      if (currentGroup) {
        combined.push(currentGroup)
      }
      
      // Start new group
      currentGroup = {
        ...course,
        all_course_schedule_id: [course.course_schedule_id]
      }
    } else {
      // Same course_id and student_group, check if it's consecutive
      const currentEndTime = new Date(currentGroup.end_time)
      const nextStartTime = new Date(course.start_time)
      
      // Consider courses consecutive if they are within 1 minute of each other
      // This handles cases where end_time might be 21:00 and start_time is 21:00
      const timeDiff = Math.abs(nextStartTime - currentEndTime)
      const isConsecutive = timeDiff <= 60000 // 1 minute in milliseconds
      
      if (isConsecutive) {
        // Extend the current group
        currentGroup.end_time = course.end_time
        currentGroup.all_course_schedule_id.push(course.course_schedule_id)
        
        // Merge attendance_summary if both exist
        if (course.attendance_summary && Object.keys(course.attendance_summary).length > 0) {
          if (!currentGroup.attendance_summary || Object.keys(currentGroup.attendance_summary).length === 0) {
            currentGroup.attendance_summary = course.attendance_summary
          } else {
            // Merge attendance summaries by adding counts
            currentGroup.attendance_summary = {
              total_students: (currentGroup.attendance_summary.total_students || 0) + (course.attendance_summary.total_students || 0),
              present_count: (currentGroup.attendance_summary.present_count || 0) + (course.attendance_summary.present_count || 0),
              absent_count: (currentGroup.attendance_summary.absent_count || 0) + (course.attendance_summary.absent_count || 0),
              on_leave_count: (currentGroup.attendance_summary.on_leave_count || 0) + (course.attendance_summary.on_leave_count || 0)
            }
          }
        }
      } else {
        // Not consecutive, save current group and start new one
        combined.push(currentGroup)
        currentGroup = {
          ...course,
          all_course_schedule_id: [course.course_schedule_id]
        }
      }
    }
  }

  // Don't forget to add the last group
  if (currentGroup) {
    combined.push(currentGroup)
  }

  return combined
}

// Helper function to format instructor names
const formatInstructorNames = (instructor, coInstructor1, coInstructor2) => {
  const instructors = [instructor, coInstructor1, coInstructor2].filter(Boolean)
  return instructors.join(', ')
}

// Helper function to determine attendance status
const getAttendanceStatus = (attendanceSummary, startDateTime) => {
  const eventDate = new Date(startDateTime)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  
  // Check if event is in the future
  if (eventDate > today) {
    return 'future'
  }
  
  // Check if attendance summary exists and has data
  if (attendanceSummary && Object.keys(attendanceSummary).length > 0) {
    return 'completed'
  }
  
  // Past event with no attendance data
  return 'missing'
}

// Add this function after your helper functions
const generateAttendanceCalendars = () => {
  return {
    'completed': {
      colorName: 'completed',
      lightColors: {
        main: '#16a34a',        // Green border
        container: '#f0fdf4',   // Light green background
        onContainer: '#15803d', // Dark green text
      },
      darkColors: {
        main: '#22c55e',
        container: '#166534',
        onContainer: '#dcfce7',
      },
    },
    'missing': {
      colorName: 'missing',
      lightColors: {
        main: '#dc2626',        // Red border
        container: '#fef2f2',   // Light red background
        onContainer: '#991b1b', // Dark red text
      },
      darkColors: {
        main: '#ef4444',
        container: '#991b1b',
        onContainer: '#fef2f2',
      },
    },
    'future': {
      colorName: 'future',
      lightColors: {
        main: '#6b7280',        // Grey border
        container: '#f9fafb',   // Light grey background
        onContainer: '#374151', // Dark grey text
      },
      darkColors: {
        main: '#9ca3af',
        container: '#4b5563',
        onContainer: '#f9fafb',
      },
    }
  };
};

const scheduleResource = createResource({
  url: 'srkr_frappe_app_api.instructor.api.get_instructor_schedule',
  params: {
    instructor: instructorInfo.instructor_record_id,
    start_date: getCurrentMonthRange().start,
    end_date: getCurrentMonthRange().end,
  },
  onSuccess: (response) => {
    const schedule = []
    const combinedResponse = combineConsecutiveCourses(response)
    
    combinedResponse.forEach((classSchedule, index) => {
      const startDateTime = classSchedule.start_time
      const endDateTime = classSchedule.end_time
      
      // Determine attendance status
      const attendanceStatus = getAttendanceStatus(classSchedule.attendance_summary, startDateTime)
      
      schedule.push({
        id: `${classSchedule.course_schedule_id}-${index}`,
        title: `${classSchedule.course_name}`,
        start: startDateTime,
        end: endDateTime,
        description: `Group: ${classSchedule.student_group}`,
        location: classSchedule.room_name,
        calendarId: attendanceStatus, // Use attendance status as calendar ID
        courseId: classSchedule.course_id,
        studentGroup: classSchedule.student_group,
        scheduleId: classSchedule.course_schedule_id,
        allCourseScheduleId: classSchedule.all_course_schedule_id || [classSchedule.course_schedule_id],
        attendanceSummary: classSchedule.attendance_summary || {},
        instructor: classSchedule.instructor,
        coInstructor1: classSchedule.co_instructor_1,
        coInstructor2: classSchedule.co_instructor_2,
      })
    })
    
    events.value = schedule
    
    // Update calendar with attendance-based calendars
    const attendanceCalendars = generateAttendanceCalendars()
    
    if (calendarApp.value) {
      calendarApp.value.calendars.set(attendanceCalendars);
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
  locale: 'en-US',
  selectedDate: new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata'
  }),
  views: [viewWeek, viewMonthAgenda, viewDay, viewMonthGrid],
  defaultView: viewMonthAgenda.name,
  plugins: [createEventModalPlugin()],
  calendars: generateAttendanceCalendars(), // Use attendance-based calendars
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

<!-- NEW: Added custom styles to match the UI in the image -->
<style>
/* Remove default borders and adjust spacing to match the design */
.sx__calendar {
  border-radius: 0;
  border-width: 0;
  --sx-color-background: #fff; /* Set a clean white background */
}

/* Add instructor and group info below the time in agenda events */
.sx__month-agenda-event::after {
  content: attr(data-instructor) " • Group: " attr(data-group);
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 4px;
  font-weight: 400;
  opacity: 0.9;
}

/* Hide the after pseudo-element if no instructor data */
.sx__month-agenda-event:not([data-instructor])::after {
  display: none;
}

/* Style for the event items in the agenda list */
.sx__month-agenda-event {
  border-radius: 0.5rem; /* 8px rounded corners */
  margin-bottom: 0.75rem; /* 12px space between items */
  padding: 0.75rem 1rem; /* 12px vertical, 16px horizontal padding */
  border: none; /* Remove default border */
  border-left-width: 5px; /* Make the left accent border thicker */
  border-left-style: solid;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

/* Style for the event title */
.sx__month-agenda-event-title {
  font-weight: 600; /* Bolder title */
  font-size: 0.95rem;
}

/* Style for the event time, making it slightly smaller and lighter */
.sx__month-agenda-event-time {
  opacity: 0.8;
  font-size: 0.8rem;
}

/* Style the dots under dates in the grid view to match the green accent */
.sx__month-grid-day-event-dot {
  background: #16a34a !important;
  width: 5px;
  height: 5px;
}

/* Style the selected day in the grid view with a green border */
.sx__month-grid-day.sx__is-selected {
  background-color: transparent !important;
}

.sx__month-grid-day.sx__is-selected .sx__month-grid-day-date {
  background-color: transparent !important;
  outline: 2px solid #16a34a; /* Green outline */
  color: #16a34a !important;
}

.sx__month-grid-day__events {
  min-height: 60px;
}

.sx__month-agenda-events {
  margin: 20px 0;
}
.sx__event-modal {
  max-width: 600px; /* Limit modal width */
  width: 90%; /* Responsive width */
}
/* Style for the event description in agenda view */
.sx__month-agenda-event-description {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 2px;
  font-weight: 400;
}

/* Make sure description is visible */
.sx__month-agenda-event .sx__month-agenda-event-description {
  display: block !important;
  opacity: 0.8;
}
</style>