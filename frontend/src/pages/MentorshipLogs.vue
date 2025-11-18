<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-content">
        <h1 class="student-name-title">Logs for {{ studentName }}</h1>
        <button @click="navigateToNewLog" class="add-button" title="Add New Log Entry">
          <!-- Using a simple plus sign, can be replaced with an icon -->
          &#43;
        </button>
      </div>
    </header>

    <main class="page-content">
      <div v-if="logEntriesResource.loading" class="loading-state">
        Loading log entries...
      </div>
      <div v-else-if="logEntriesResource.error" class="error-state">
        Error loading data. Please try again.
      </div>
      <MentorshipLogList
        v-else-if="logEntries.length > 0"
        :logs="logEntries"
        @log-selected="navigateToLogDetail"
      />
      <div v-else class="empty-state">
        No log entries have been created for this student yet.
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createResource } from 'frappe-ui';
import MentorshipLogList from '../components/MentorshipLogList.vue';

const route = useRoute();
const router = useRouter();

// 1. Get student info SYNCHRONOUSLY from the URL query parameters
const studentId = route.query.student;
const studentName = route.query.studentName || 'Student'; // Fallback name

console.log('MentorshipLogs - Student ID:', studentId);
console.log('MentorshipLogs - Student Name:', studentName);

// 2. Define the resource for fetching the logs for this student
const logEntriesResource = createResource({
  url: 'srkr_frappe_app_api.instructor-mentorship.api.get_mentorship_logs_by_student',
  params: {
    student: studentId,
  },
  auto: false, // We will trigger this manually in onMounted
  onSuccess: (response) => {
    console.log('Log entries loaded successfully:', response);
  },
  onError: (error) => {
    console.error('Error loading log entries:', error);
  }
});

// 3. Create the robust, defensive COMPUTED property
const logEntries = computed(() => {
  const data = logEntriesResource.data;
  console.log('Computed logEntries - raw data:', data);
  
  // This handles both direct array responses and { message: [...] } objects
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.message)) {
    return data.message;
  }
  return []; // Safe fallback
});

// 4. Use onMounted to trigger the API call
onMounted(() => {
  console.log('Component mounted');
  if (studentId) {
    console.log('Fetching logs for student:', studentId);
    // Use fetch() with explicit params instead of reload()
    logEntriesResource.fetch({
      student: studentId
    });
  } else {
    console.error('CRITICAL: No student ID found in the route parameters!');
  }
});

// 5. Navigation functions
const navigateToNewLog = () => {
  router.push({
    path: '/mentorship-log/new',
    query: { student: studentId }, // Pass student ID to the new log form
  });
};

const navigateToLogDetail = (log) => {
  router.push({
    path: '/mentorship-log/edit',
    query: { logId: log.name }, // Pass the unique log ID to the edit form
  });
};
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f9fafb;
}
.page-header {
  background-color: white;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.student-name-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #1f2937;
}
.add-button {
  background-color: #3b82f6;
  color: white;
  border: none;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  font-size: 1.75rem;
  font-weight: 300;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}
.add-button:hover {
  background-color: #2563eb;
}
.page-content {
  flex-grow: 1;
}
.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 4rem 1rem;
  color: #6b7280;
}
.error-state {
  color: #dc2626;
}
</style>