<template>
  <InstructorHome v-if="!scheduleResource.loading && scheduleResource.data"
      :events="events"/>
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

// Function to get current date in YYYY-MM-DD format
const getCurrentDate = () => {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata'
  })
}

// Function to filter classes for current day
const filterTodaysClasses = (scheduleData) => {
  const today = getCurrentDate()
  return scheduleData.filter(classItem => classItem.date === today)
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

const scheduleResource = createResource({
  url: 'srkr_frappe_app_api.instructor.api.get_instructor_schedule',
  params: {
    instructor: instructorInfo.instructor_id,
    start_date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
    end_date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
  },
  onSuccess: (response) => {
    console.log('Schedule fetched successfully:', response)
    
    // Filter today's classes
    const todaysClasses = filterTodaysClasses(response)
    console.log('todaysClasses:', todaysClasses)

    // Transform the data to match the component's expected format
    const transformedClasses = todaysClasses.map(classItem => ({
      id: classItem.course_schedule_id,
      name: classItem.course_name,
      time: formatTime(classItem.start_time) + ' - ' + formatTime(classItem.end_time),
      room: classItem.room,
      startTime: classItem.start_time,
      endTime: classItem.end_time,
      color: classItem.color,
      studentGroup: classItem.student_group
    }))
    
    // Update events object
    events.value.schedule = response
    events.value.instructor = instructorInfo
    events.value.todaysClasses = transformedClasses
    
    console.log('Today\'s classes:', transformedClasses)
  },
  onError: (error) => {
    console.error('Error fetching schedule:', error)
  },
  auto: true,
})

</script>