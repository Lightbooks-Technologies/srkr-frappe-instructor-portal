<template>
  <Attendance v-if="!scheduleResource.loading && scheduleResource.data"
      :events="events"/>
</template>

<script setup>
import Attendance from '../components/Attendance.vue'
import { createResource } from 'frappe-ui'
import { studentStore } from '@/stores/student'
import { ref, computed } from 'vue'

const { getCurrentProgram, getStudentInfo, getStudentGroups } = studentStore()
const programName = ref(getCurrentProgram()?.value?.program)
const instructorInfo = getStudentInfo().value
const studentGroup = ref(getStudentGroups().value)
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
  url: '/api/method/education.education.doctype.student_attendance_tool.student_attendance_tool.get_student_attendance_records',
  params: {
    based_on: "Course Schedule",
    student_group: "",
    course_schedule: "EDU-CSH-2025-00313"
  },
  onSuccess: (response) => {
    console.log('Schedule fetched successfully:', response)
    
    // Mock response for testing - remove this when using real API
    response = [
        // Completed classes (earlier today)
        {
            "course_schedule_id": "EDU-CSH-2025-00367",
            "date": "2025-06-08", // Today's date
            "course_name": "Communicative English Lab",
            "course_id": "Communicative English Lab",
            "calendar_id": "communicative_english_lab",
            "start_time": "2025-06-09 08:00",
            "end_time": "2025-06-09 09:00",
            "room": "HTL-ROOM-2025-00350",
            "student_group": "2025-29-1T1-AIML-A",
            "color": "#FFF1E7"
        },
        {
            "course_schedule_id": "EDU-CSH-2025-00368",
            "date": "2025-06-09", // Today's date
            "course_name": "Mathematics",
            "course_id": "Mathematics",
            "calendar_id": "mathematics",
            "start_time": "2025-06-09 09:30",
            "end_time": "2025-06-09 10:30",
            "room": "Room 101",
            "student_group": "2025-29-1T1-AIML-A",
            "color": "#E7F3FF"
        },
        // Ongoing class (current time)
        {
            "course_schedule_id": "EDU-CSH-2025-00369",
            "date": "2025-06-09", // Today's date
            "course_name": "Data Structures",
            "course_id": "Data Structures",
            "calendar_id": "data_structures",
            "start_time": "2025-06-09 11:00",
            "end_time": "2025-06-09 12:00",
            "room": "CS Lab 1",
            "student_group": "2025-29-1T1-AIML-A",
            "color": "#E7F9FF"
        },
        // Upcoming classes (later today)
        {
            "course_schedule_id": "EDU-CSH-2025-00370",
            "date": "2025-06-09", // Today's date
            "course_name": "Physics Lab",
            "course_id": "Physics Lab",
            "calendar_id": "physics_lab",
            "start_time": "2025-06-09 14:00",
            "end_time": "2025-06-09 15:45",
            "room": "Physics Lab 2",
            "student_group": "2025-29-1T1-AIML-A",
            "color": "#F0E7FF"
        },
        {
            "course_schedule_id": "EDU-CSH-2025-00371",
            "date": "2025-06-09", // Today's date
            "course_name": "Database Management",
            "course_id": "Database Management",
            "calendar_id": "database_management",
            "start_time": "2025-06-09 15:45",
            "end_time": "2025-06-09 16:45",
            "room": "CS Lab 2",
            "student_group": "2025-29-1T1-AIML-A",
            "color": "#E7FFE7"
        },
        {
            "course_schedule_id": "EDU-CSH-2025-00372",
            "date": "2025-06-09", // Today's date
            "course_name": "Computer Networks",
            "course_id": "Computer Networks",
            "calendar_id": "computer_networks",
            "start_time": "2025-06-09 17:00",
            "end_time": "2025-06-09 18:00",
            "room": "Room 205",
            "student_group": "2025-29-1T1-AIML-A",
            "color": "#FFE7E7"
        },
        // Tomorrow's classes (should be filtered out)
        {
            "course_schedule_id": "EDU-CSH-2025-00373",
            "date": "2025-06-09", // Tomorrow's date
            "course_name": "Chemistry",
            "course_id": "Chemistry",
            "calendar_id": "chemistry",
            "start_time": "2025-06-09 11:30",
            "end_time": "2025-06-09 12:30",
            "room": "Chemistry Lab 1",
            "student_group": "2025-29-1T1-AIML-A",
            "color": "#E7FFE7"
        },
        {
            "course_schedule_id": "EDU-CSH-2025-00374",
            "date": "2025-06-09", // Tomorrow's date
            "course_name": "Software Engineering",
            "course_id": "Software Engineering",
            "calendar_id": "software_engineering",
            "start_time": "2025-06-09 14:00",
            "end_time": "2025-06-09 15:30",
            "room": "Room 301",
            "student_group": "2025-29-1T1-AIML-A",
            "color": "#F3E7FF"
        }
    ]
    
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