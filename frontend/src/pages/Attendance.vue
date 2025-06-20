<template>
  <Attendance v-if="!attendanceResource.loading && attendanceResource.data"
      :students="students"
      :courseInfo="courseInfo"
      @refresh-data="handleRefreshData"/>
</template>

<script setup>
import Attendance from '../components/Attendance.vue'
import { createResource } from 'frappe-ui'
import { studentStore } from '@/stores/student'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const { getStudentInfo } = studentStore()
const instructorInfo = getStudentInfo().value

// Get parameters from route (passed from home page class item)
const courseScheduleId = ref(route.query.courseScheduleId)
const studentGroup = ref(route.query.studentGroup)
const basedOn = ref(route.query.basedOn || 'Course Schedule')

// Course info from route query
const courseInfo = ref({
  name: route.query.courseName || 'Course',
  time: route.query.courseTime || '',
  room: route.query.courseRoom || '',
  scheduleId: courseScheduleId.value,
  studentGroup: studentGroup.value
})

// Students data
const students = ref([])

// Create resource to fetch attendance data using route parameters
const attendanceResource = createResource({
  url: '/api/method/education.education.doctype.student_attendance_tool.student_attendance_tool.get_student_attendance_records',
  params: {
    based_on: basedOn.value,           // "Course Schedule" (hardcoded)
    student_group: studentGroup.value, // From route params (e.g., "2025-29-1T1-AIML-A")
    course_schedule: courseScheduleId.value // From route params (e.g., "EDU-CSH-2025-00370")
  },
  onSuccess: (response) => {
    console.log('Attendance data fetched successfully:', response)
    
    // Set students data
    students.value = response || []
    
    console.log('Students loaded:', students.value.length)
  },
  onError: (error) => {
    console.error('Error fetching attendance data:', error)
  },
  auto: false // Don't auto-load, we'll trigger manually
})

// Handle refresh data event from child component
const handleRefreshData = () => {
  console.log('Refreshing attendance data after successful submission...')
  
  // Reload the attendance data to get updated status
  attendanceResource.reload()
}

// Function to fetch attendance data (can be called independently)
const fetchAttendanceData = () => {
  if (courseScheduleId.value && studentGroup.value) {
    // Update resource params and fetch data
    attendanceResource.update({
      params: {
        based_on: basedOn.value,
        student_group: studentGroup.value,
        course_schedule: courseScheduleId.value
      }
    })
    attendanceResource.reload()
  } else {
    console.error('Missing required route parameters:', {
      courseScheduleId: courseScheduleId.value,
      studentGroup: studentGroup.value
    })
  }
}

// Initialize component
onMounted(() => {
  console.log('Route parameters:', {
    courseScheduleId: courseScheduleId.value,
    studentGroup: studentGroup.value,
    basedOn: basedOn.value,
    courseInfo: courseInfo.value
  })
  
  // Fetch initial data
  fetchAttendanceData()
})

// Expose methods if needed by parent components
defineExpose({
  fetchAttendanceData,
  handleRefreshData
})
</script>