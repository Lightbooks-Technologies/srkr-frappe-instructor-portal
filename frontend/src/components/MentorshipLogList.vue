<template>
  <div class="log-list-container">
    <ul class="log-list">
      <li
        v-for="log in logs"
        :key="log.name"
        class="log-item"
        @click="selectLog(log)"
      >
        <div class="log-info">
          <span class="log-date">{{ formatDate(log.date) }}</span>
          <span class="log-mentor">With: {{ log.mentor }}</span>
        </div>
        <div class="log-chevron">
          <span>&rsaquo;</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
// This component simply displays a list of logs and emits an event when one is clicked.

defineProps({
  logs: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['log-selected']);

const selectLog = (log) => {
  emit('log-selected', log);
};

// Helper function to format the date nicely
const formatDate = (dateString) => {
  if (!dateString) return 'No Date';
  // Fixed typo: toLocaleDateString (not toLocaleDateDateString)
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
</script>

<style scoped>
/* Using similar styling to the student list for consistency */
.log-list-container {
  padding: 1rem;
}
.log-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}
.log-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: #fff;
}
.log-item:not(:last-child) {
  border-bottom: 1px solid #e5e7eb;
}
.log-item:hover {
  background-color: #f9fafb;
}
.log-info {
  display: flex;
  flex-direction: column;
}
.log-date {
  font-weight: 600;
  font-size: 1rem;
  color: #111827;
}
.log-mentor {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}
.log-chevron {
  font-size: 1.5rem;
  color: #9ca3af;
}
</style>