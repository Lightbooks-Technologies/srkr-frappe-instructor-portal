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

const { getStudentInfo } = studentStore()
const instructorInfo = getStudentInfo().value

const events = ref([])
const calendarApp = shallowRef()
const currentRange = ref({
  start: null,
  end: null
})

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

const scheduleResource = createResource({
  url: 'srkr_frappe_app_api.instructor.api.get_instructor_schedule',
  params: {
    instructor: instructorInfo.instructor_record_id,
    start_date: getCurrentMonthRange().start,
    end_date: getCurrentMonthRange().end,
  },
  onSuccess: (response) => {
    let schedule = []
    response.forEach((classSchedule, index) => {
      console.log('classSchedule', classSchedule)
      
      // Use the full datetime strings directly
      const startDateTime = classSchedule.start_time
      const endDateTime = classSchedule.end_time
      
      // Format times for display (12-hour format)
      const displayStartTime = formatTimeTo12Hour(classSchedule.start_time)
      const displayEndTime = formatTimeTo12Hour(classSchedule.end_time)
      
      console.log('Event times:', { startDateTime, endDateTime, displayStartTime, displayEndTime })
      
      schedule.push({
        id: `${classSchedule.course_schedule_id}-${index}`,
        title: `${classSchedule.course_name}`,
        start: startDateTime,
        end: endDateTime,
        description: `Room: ${classSchedule.room}\nGroup: ${classSchedule.student_group}`,
        location: classSchedule.room,
        calendarId: classSchedule.calendar_id || 'default',
        // Additional data for reference
        courseId: classSchedule.course_id,
        studentGroup: classSchedule.student_group,
        scheduleId: classSchedule.course_schedule_id,
      })
    })
    console.log('Formatted schedule:', schedule)
    events.value = schedule
    
    // Update calendar events
    if (calendarApp.value) {
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
  console.log('Fetching schedule for range:', startDate, 'to', endDate)
  
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
  console.log('Calendar range updated:', range)
  
  const startDate = formatDateForAPI(new Date(range.start))
  const endDate = formatDateForAPI(new Date(range.end))
  
  // Only fetch if the range actually changed
  if (currentRange.value.start !== startDate || currentRange.value.end !== endDate) {
    currentRange.value = { start: startDate, end: endDate }
    fetchScheduleForRange(startDate, endDate)
  }
}

// Create the calendar instance
calendarApp.value = createCalendar({
  locale: 'en-GB',
  selectedDate: new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata'
  }),
  views: [viewWeek, viewMonthAgenda, viewDay, viewMonthGrid],
  defaultView: viewMonthGrid.name,
  plugins: [createEventModalPlugin()],
  events: events.value,
  callbacks: {
    onRangeUpdate: handleRangeUpdate,
    onEventClick: (calendarEvent) => {
      console.log('Event clicked:', calendarEvent)
      // Handle event click if needed
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
  
  // Update calendar's selected date
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