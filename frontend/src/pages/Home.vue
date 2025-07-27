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
    all_course_schedule_id: classItem.all_course_schedule_id || [classItem.course_schedule_id],
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

    console.log('Instructor Info:', instructorInfo)
    if(instructorInfo.instructor_id === '1293' || instructorInfo.instructor_id === '123456') {
      console.log('Special case for instructor 1293 or 123456, using default schedule')
      response = [
          {
              "course_schedule_id": "EDU-CSH-2025-00865",
              "date": formatDateForAPI(currentViewDate.value),
              "course_name": "Mathematics - Calculus",
              "course_id": "Mathematics - Calculus",
              "calendar_id": "mathematics_-_calculus",
              "start_time": formatDateForAPI(currentViewDate.value) + " 04:00",
              "end_time": formatDateForAPI(currentViewDate.value) + " 08:00",
              "room": "HTL-ROOM-2025-00006",
              "student_group": "2025-group-name",
              "color": "#EDF6FD",
              "attendance_summary": {}
          },
          {
              "course_schedule_id": "EDU-CSH-2025-00724",
              "date": formatDateForAPI(currentViewDate.value),
              "course_name": "AI Lab",
              "course_id": "AI Lab",
              "calendar_id": "ai_lab",
              "start_time": formatDateForAPI(currentViewDate.value) + " 08:00",
              "end_time": formatDateForAPI(currentViewDate.value) + " 10:00",
              "room": "HTL-ROOM-2025-00001",
              "student_group": "2025-group-name",
              "color": "#EDF6FD",
              "attendance_summary": {}
          },
          {
              "course_schedule_id": "EDU-CSH-2025-00771",
              "date": formatDateForAPI(currentViewDate.value),
              "course_name": "Physics Lab",
              "course_id": "Physics Lab",
              "calendar_id": "physics_lab",
              "start_time": formatDateForAPI(currentViewDate.value) + " 10:00",
              "end_time": formatDateForAPI(currentViewDate.value) + " 12:00",
              "room": "HTL-ROOM-2025-00002",
              "student_group": "2025-group-name",
              "color": "#EDF6FD",
              "attendance_summary": {}
          },
          {
              "course_schedule_id": "EDU-CSH-2025-00817",
              "date": formatDateForAPI(currentViewDate.value),
              "course_name": "Chemistry Lab",
              "course_id": "Chemistry Lab",
              "calendar_id": "chemistry_lab",
              "start_time": formatDateForAPI(currentViewDate.value) + " 12:00",
              "end_time": formatDateForAPI(currentViewDate.value) + " 14:00",
              "room": "HTL-ROOM-2025-00003",
              "student_group": "2025-group-name",
              "color": "#EDF6FD",
              "attendance_summary": {}
          },
          {
              "course_schedule_id": "EDU-CSH-2025-00833",
              "date": formatDateForAPI(currentViewDate.value),
              "course_name": "Computer Programming",
              "course_id": "Computer Programming",
              "calendar_id": "computer_programming",
              "start_time": formatDateForAPI(currentViewDate.value) + " 14:00",
              "end_time": formatDateForAPI(currentViewDate.value) + " 16:00",
              "room": "HTL-ROOM-2025-00004",
              "student_group": "2025-group-name",
              "color": "#EDF6FD",
              "attendance_summary": {
                  "total_students": 7,
                  "present_count": 3,
                  "absent_count": 4,
                  "on_leave_count": 0
              }
          },
          {
              "course_schedule_id": "EDU-CSH-2025-00849",
              "date": formatDateForAPI(currentViewDate.value),
              "course_name": "Engineering Graphics",
              "course_id": "Engineering Graphics",
              "calendar_id": "engineering_graphics",
              "start_time": formatDateForAPI(currentViewDate.value) + " 16:00",
              "end_time": formatDateForAPI(currentViewDate.value) + " 18:00",
              "room": "HTL-ROOM-2025-00005",
              "student_group": "2025-group-name",
              "color": "#EDF6FD",
              "attendance_summary": {
                  "total_students": 7,
                  "present_count": 6,
                  "absent_count": 1,
                  "on_leave_count": 0
              }
          },
          {
              "course_schedule_id": "EDU-CSH-2025-00905",
              "date": formatDateForAPI(currentViewDate.value),
              "course_name": "Engineering Workshop",
              "course_id": "Engineering Workshop",
              "calendar_id": "engineering_workshop",
              "start_time": formatDateForAPI(currentViewDate.value) + " 18:00",
              "end_time": formatDateForAPI(currentViewDate.value) + " 20:00",
              "room": "HTL-ROOM-2025-00007",
              "student_group": "2025-group-name",
              "color": "#EDF6FD",
              "attendance_summary": {}
          },
          {
              "course_schedule_id": "EDU-CSH-2025-00939",
              "date": formatDateForAPI(currentViewDate.value),
              "course_name": "Communicative English Lab",
              "course_id": "Communicative English Lab",
              "calendar_id": "communicative_english_lab",
              "start_time": formatDateForAPI(currentViewDate.value) + " 20:00",
              "end_time": formatDateForAPI(currentViewDate.value) + " 23:00",
              "room": "HTL-ROOM-2025-00008",
              "student_group": "2025-group-name",
              "color": "#EDF6FD",
              "attendance_summary": {}
          },
          {
              "course_schedule_id": "EDU-CSH-2025-00973",
              "date": formatDateForAPI(currentViewDate.value),
              "course_name": "AI Lab",
              "course_id": "AI Lab",
              "calendar_id": "ai_lab",
              "start_time": formatDateForAPI(currentViewDate.value) + " 23:00",
              "end_time": formatDateForAPI(currentViewDate.value) + " 23:59",
              "room": "HTL-ROOM-2025-00001",
              "student_group": "2025-group-name",
              "color": "#EDF6FD",
              "attendance_summary": {}
          }
      ]
      console.log('Using default schedule:', response)
    }
    
    // Filter classes for the current view date
    const targetDate = formatDateForAPI(currentViewDate.value)
    console.log('Current view date:', currentViewDate.value)
    console.log('Formatted target date:', targetDate)
    
    // const dayClasses = filterClassesForDate(response, targetDate)
    // console.log('Classes for date:', targetDate, dayClasses)
    const combinedResponse = combineConsecutiveCourses(response)
    const dayClasses = filterClassesForDate(combinedResponse, targetDate)
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
    // If this is the first course or different course_id, start a new group
    if (!currentGroup || currentGroup.course_id !== course.course_id) {
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
      // Same course_id, check if it's consecutive
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

// Additional resource for fetching data for specific dates
const dateSpecificResource = createResource({
  url: 'srkr_frappe_app_api.instructor.api.get_instructor_schedule',
  onSuccess: (response) => {
    console.log('Date-specific schedule fetched:', response)
    console.log('Current view date for filtering:', currentViewDate.value)
    
    // Filter classes for the current view date
    const targetDate = formatDateForAPI(currentViewDate.value)
    console.log('Target date for filtering:', targetDate)
    
    // const dayClasses = filterClassesForDate(response, targetDate)
    // console.log('Filtered day classes:', dayClasses)
    const combinedResponse = combineConsecutiveCourses(response)
    const dayClasses = filterClassesForDate(combinedResponse, targetDate)
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