<template>
  <Attendance v-if="!attendanceResource.loading && attendanceResource.data"
      :students="students"
      :courseInfo="courseInfo"/>
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
const courseScheduleId = ref(route.params.courseScheduleId)
const studentGroup = ref(route.params.studentGroup)
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
    // students.value = [
		// 	{
		// 		"student": "EDU-STU-2025-00002",
		// 		"student_name": "HARSHA VARDHAN JANUP",
		// 		"group_roll_number": 1,
		// 		"status": "Present"
		// 	},
		// 	{
		// 		"student": "EDU-STU-2025-00003", 
		// 		"student_name": "VARUN VARMA",
		// 		"status": "Absent",
		// 		"group_roll_number": 2
		// 	},
		// 	{
		// 		"student": "EDU-STU-2025-00004",
		// 		"student_name": "ARUN KUMAR REDDY",
		// 		"group_roll_number": 3
		// 	},
		// 	{
		// 		"student": "EDU-STU-2025-00005",
		// 		"student_name": "PRIYA SHARMA",
		// 		"group_roll_number": 4
		// 	},
		// 	{
		// 		"student": "EDU-STU-2025-00006",
		// 		"student_name": "RAJESH KUMAR",
		// 		"group_roll_number": 5
		// 	}
		// ]
    
    console.log('Students loaded:', students.value.length)
  },
  onError: (error) => {
    console.error('Error fetching attendance data:', error)
  },
  auto: false // Don't auto-load, we'll trigger manually
})

// Initialize component
onMounted(() => {
  console.log('Route parameters:', {
    courseScheduleId: courseScheduleId.value,
    studentGroup: studentGroup.value,
    basedOn: basedOn.value,
    courseInfo: courseInfo.value
  })
  
  // Validate required parameters
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
})
</script>