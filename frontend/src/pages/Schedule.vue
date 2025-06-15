<template>
  <div class="p-5 h-full">
    <v-card class="ma-12">
      <!-- Optional: Add navigation controls -->
      <!-- <v-card-title class="d-flex justify-space-between align-center">
        <span>Instructor Schedule</span>
        <div>
          <v-btn @click="goToToday" color="primary" size="small" class="mr-2">
            Today
          </v-btn>
          <v-btn @click="goToPreviousMonth" icon size="small" class="mr-1">
            <v-icon>mdi-chevron-left</v-icon>
          </v-btn>
          <v-btn @click="goToNextMonth" icon size="small">
            <v-icon>mdi-chevron-right</v-icon>
          </v-btn>
        </div>
      </v-card-title> -->
      
      <ScheduleXCalendar ref="calendarRef" />
    </v-card>
  </div>
</template>

<script setup>
import ScheduleXCalendar from '@/components/ScheduleXCalendar.vue'
import { ref } from 'vue'

const calendarRef = ref()

// Navigation methods
const goToToday = () => {
  calendarRef.value?.goToToday()
}

const goToPreviousMonth = () => {
  const now = new Date()
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  calendarRef.value?.navigateToMonth(prevMonth.getFullYear(), prevMonth.getMonth() + 1)
}

const goToNextMonth = () => {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  calendarRef.value?.navigateToMonth(nextMonth.getFullYear(), nextMonth.getMonth() + 1)
}

// Example: Navigate to specific month
const navigateToSpecificMonth = (year, month) => {
  calendarRef.value?.navigateToMonth(year, month)
}
</script>

<style></style>