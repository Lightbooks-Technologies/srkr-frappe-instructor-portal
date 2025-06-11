<template>
  <div class="w-full h-full">
    <ScheduleXCalendar
      v-if="!scheduleResource.loading && scheduleResource.data"
      :events="events"
    />
  </div>
</template>

<script setup>
import ScheduleXCalendar from '@/components/ScheduleXCalendar.vue'
import { createResource } from 'frappe-ui'
import { ref } from 'vue'
import { studentStore } from '@/stores/student'
const { getStudentInfo } = studentStore()
const instructorInfo = getStudentInfo().value

const events = ref([])

const formatTime = (timeStr) => {
  const parts = timeStr.split(':')
  const hours = parts[0].padStart(2, '0')
  const minutes = parts[1]
  return `${hours}:${minutes}`
}

const scheduleResource = createResource({
  url: 'srkr_frappe_app_api.instructor.api.get_instructor_schedule',
  params: {
    instructor: instructorInfo.instructor_id,
    start_date: new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Kolkata'
    }), // Current date in YYYY-MM-DD format
    // end_date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
  },
  onSuccess: (response) => {
    let schedule = []
    response.forEach((classSchedule, index) => {
      console.log('classSchedule', classSchedule)
      const startDateTime = `${formatTime(classSchedule.start_time)}`
      const endDateTime = `${formatTime(classSchedule.end_time)}`
      schedule.push({
        id: index,
        title: classSchedule.course_name,
        start: startDateTime,
        end: endDateTime,
        with: classSchedule.instructor,
        name: classSchedule.course_name,
        location: classSchedule.room,
        date: classSchedule.date,
        from_time: classSchedule.start_time.split('.')[0],
        to_time: classSchedule.end_time.split('.')[0],
        color: classSchedule.color,
        _options: {
          additionalClasses: classSchedule.calendar_id,
        },
      })
    })
    console.log('Formatted schedule:', schedule)
    events.value = schedule
  },
  onError: (error) => {
    console.error('Error fetching schedule:', error)
  },
  auto: true,
})
</script>

<style></style>
