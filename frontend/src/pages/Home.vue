<template>
  <InstructorHome 
    v-if="!scheduleResource.loading && scheduleResource.data"
    :events="events"
    @dateChanged="handleDateChange"
    @resetToToday="handleResetToToday"
  />
</template>

<script setup>
import InstructorHome from '../components/InstructorHome.vue'
import { createResource } from 'frappe-ui'
import { studentStore } from '@/stores/student'
import { ref, computed } from 'vue'

const { getStudentInfo } = studentStore()
const instructorInfo = getStudentInfo().value
console.log('Instructor Info:', instructorInfo.instructor_id)

const events = ref({
  schedule: null,
  instructor: null,
  todaysClasses: []
})

const currentViewDate = ref(new Date())

// Function to get current date in YYYY-MM-DD format
const getCurrentDate = () => {
  return new Date().toLocaleDateString('en-CA')
}

// Function to format date to YYYY-MM-DD
const formatDateForAPI = (date) => {
  return date.toLocaleDateString('en-CA')
}

// Function to filter classes for a specific day
const filterClassesForDate = (scheduleData, targetDate) => {
  console.log('Filtering classes for date:', targetDate)
  console.log('Available schedule data:', scheduleData)
  
  const filtered = scheduleData.filter(classItem => {
    console.log('Comparing:', classItem.date, '===', targetDate)
    return classItem.date === targetDate
  })
  
  console.log('Filtered results:', filtered)
  
  // If no results with exact match, let's try a more flexible approach
  if (filtered.length === 0) {
    console.log('No exact matches found, trying flexible date matching...')
    const flexibleFiltered = scheduleData.filter(classItem => {
      // Try to parse both dates and compare
      const itemDate = new Date(classItem.date).toLocaleDateString('en-CA')
      const compareDate = new Date(targetDate).toLocaleDateString('en-CA')
      console.log('Flexible compare:', itemDate, '===', compareDate)
      return itemDate === compareDate
    })
    console.log('Flexible filtered results:', flexibleFiltered)
    return flexibleFiltered
  }
  
  return filtered
}

// Function to format time from API response
const formatTime = (timeString) => {
  const date = new Date(timeString);
  console.log('Formatting time for:', timeString, '->', date);
  
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  })
}

// Transform classes data
const transformClasses = (classesData) => {
  return classesData.map(classItem => ({
    id: classItem.course_schedule_id,
    name: classItem.course_name,
    time: formatTime(classItem.start_time) + ' - ' + formatTime(classItem.end_time),
    room: classItem.room,
    startTime: classItem.start_time,
    endTime: classItem.end_time,
    color: classItem.color,
    studentGroup: classItem.student_group,
    attendance_summary: classItem.attendance_summary,
  }))
}

// Main schedule resource for fetching data
const scheduleResource = createResource({
  url: 'srkr_frappe_app_api.instructor.api.get_instructor_schedule',
  params: {
    instructor: instructorInfo.instructor_record_id,
    start_date: formatDateForAPI(currentViewDate.value),
    end_date: formatDateForAPI(currentViewDate.value),
  },
  onSuccess: (response) => {
    console.log('Schedule fetched successfully:', response)
    
    // Filter classes for the current view date
    const targetDate = formatDateForAPI(currentViewDate.value)
    console.log('Current view date:', currentViewDate.value)
    console.log('Formatted target date:', targetDate)
    
    const dayClasses = filterClassesForDate(response, targetDate)
    console.log('Classes for date:', targetDate, dayClasses)

    // Transform the data to match the component's expected format
    const transformedClasses = transformClasses(dayClasses)
    
    // Update events object
    events.value.schedule = response
    events.value.instructor = instructorInfo
    events.value.todaysClasses = transformedClasses
    
    console.log('Transformed classes:', transformedClasses)
  },
  onError: (error) => {
    console.error('Error fetching schedule:', error)
  },
  auto: true,
})

// Additional resource for fetching data for specific dates
const dateSpecificResource = createResource({
  url: 'srkr_frappe_app_api.instructor.api.get_instructor_schedule',
  onSuccess: (response) => {
    console.log('Date-specific schedule fetched:', response)
    console.log('Current view date for filtering:', currentViewDate.value)
    
    // Filter classes for the current view date
    const targetDate = formatDateForAPI(currentViewDate.value)
    console.log('Target date for filtering:', targetDate)
    
    const dayClasses = filterClassesForDate(response, targetDate)
    console.log('Filtered day classes:', dayClasses)
    
    // Transform and update events
    const transformedClasses = transformClasses(dayClasses)
    
    events.value.schedule = response
    events.value.todaysClasses = transformedClasses
    
    console.log('Final transformed classes:', transformedClasses)
    console.log('Updated events.value:', events.value)
  },
  onError: (error) => {
    console.error('Error fetching date-specific schedule:', error)
  }
})

// Handle date change from child component
const handleDateChange = async (dateInfo) => {
  try {
    console.log('Date changed:', dateInfo)
    console.log('Date object:', dateInfo.dateObj)
    console.log('Date string:', dateInfo.date)
    
    // Update current view date
    currentViewDate.value = new Date(dateInfo.dateObj)
    console.log('Updated currentViewDate:', currentViewDate.value)
    
    // Fetch data for the new date
    await dateSpecificResource.fetch({
      instructor: instructorInfo.instructor_record_id,
      start_date: dateInfo.date,
      end_date: dateInfo.date,
    })
    
  } catch (error) {
    console.error('Error handling date change:', error)
  }
}

// Handle reset to today
const handleResetToToday = async () => {
  try {
    console.log('Resetting to today')
    
    // Reset to current date
    currentViewDate.value = new Date()
    
    // Refetch today's data
    await scheduleResource.fetch({
      instructor: instructorInfo.instructor_record_id,
      start_date: getCurrentDate(),
      end_date: getCurrentDate(),
    })
    
  } catch (error) {
    console.error('Error resetting to today:', error)
  }
}

</script>