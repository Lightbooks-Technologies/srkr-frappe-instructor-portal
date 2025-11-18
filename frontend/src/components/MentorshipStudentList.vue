<template>
  <div class="student-list-container">
    <div v-if="profiles.length === 0" class="empty-state">
      No students have been assigned to you yet.
    </div>
    <ul v-else class="student-list">
      <li
        v-for="profile in profiles"
        :key="profile.name"
        class="student-item"
        @click="selectStudent(profile)"
      >
        <div class="student-info">
          <span class="student-name">{{ profile.student_name }}</span>
          <span class="student-program">{{ profile.program }}</span>
        </div>
        <div class="student-chevron">
          <!-- You can use an icon library here if you have one -->
          <span>&rsaquo;</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
// This component receives a list of profiles and emits an event when one is selected.
// It has no knowledge of APIs or routing.

defineProps({
  profiles: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['student-selected']);

const selectStudent = (profile) => {
  emit('student-selected', profile);
};
</script>

<style scoped>
.student-list-container {
  padding: 1rem;
}
.student-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}
.student-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: #fff;
}
.student-item:not(:last-child) {
  border-bottom: 1px solid #e5e7eb;
}
.student-item:hover {
  background-color: #f9fafb;
}
.student-info {
  display: flex;
  flex-direction: column;
}
.student-name {
  font-weight: 600;
  font-size: 1rem;
  color: #111827;
}
.student-program {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}
.student-chevron {
  font-size: 1.5rem;
  color: #9ca3af;
}
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}
</style>