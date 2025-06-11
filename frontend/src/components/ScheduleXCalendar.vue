<template>
  <div class="p-5 h-full">
    <v-card class="ma-12">
      <ScheduleXCalendar
        v-if="calendarApp != undefined"
        :calendar-app="calendarApp"
      />
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ScheduleXCalendar } from '@schedule-x/vue';
import {
  createCalendar,
  viewDay,
  viewWeek,
  viewMonthGrid,
  viewMonthAgenda,
} from '@schedule-x/calendar';
import '@schedule-x/theme-default/dist/index.css';
import { createEventModalPlugin } from '@schedule-x/event-modal';

export interface ScheduleXCalendarProps {
  defaultView?: string;
  withPagination?: boolean;
  rerender?: number;
  events: Event[];
}

const props = withDefaults(
  defineProps<ScheduleXCalendarProps>(),
  {
    defaultView: viewWeek.name,
    withPagination: false,
  },
);

const calendarApp = createCalendar({
  locale: 'en-GB',
  selectedDate: new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata'
  }),
  views: [viewWeek, viewMonthAgenda, viewDay, viewMonthGrid],
  defaultView: viewMonthGrid.name,
  plugins: [createEventModalPlugin()],
  events: props.events,
  callbacks: {
    onRangeUpdate: props.withPagination ? (range) => {
      console.log('new calendar range start date', range.start);
      console.log('new calendar range end date', range.end);
    } : undefined,
  },
});
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
