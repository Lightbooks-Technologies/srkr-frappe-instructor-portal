<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-content">
        <button @click="goBack" class="back-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1 class="student-name-title">{{ formatName(studentName) }}</h1>
      </div>
    </header>

    <main class="page-content">
      <div v-if="logEntriesResource.loading" class="loading-state">
        Loading log entries...
      </div>
      <div v-else-if="logEntriesResource.error" class="error-state">
        Error loading data. Please try again.
      </div>
      <div v-else>
        <!-- Action Button -->
        <div class="action-section">
          <button @click="navigateToNewLog" class="create-log-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create New Log Entry
          </button>
        </div>

        <!-- Section Title -->
        <div class="section-header">
          <h2 class="section-title">Log Entries</h2>
          <span v-if="logEntries.length > 0" class="section-count">{{ logEntries.length }}</span>
        </div>

        <!-- Log List or Empty State -->
        <MentorshipLogList
          v-if="logEntries.length > 0"
          :logs="logEntries"
          @log-selected="navigateToLogDetail"
        />
        <div v-else class="empty-state">
          <div class="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </div>
          <p class="empty-title">No Log Entries Yet</p>
          <p class="empty-description">Start documenting your mentorship sessions by creating your first log entry using the button above.</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createResource } from 'frappe-ui';
import MentorshipLogList from '../components/MentorshipLogList.vue';

const USE_MOCK = false; // Set to false to use real API

const mockLogEntries = {
  message: [
    {
      name: "LOG-EDU-STU-2025-00119-159915",
      date: "2025-11-17",
      mentor: "T. Rajasri",
      academic_term: "AY-2025-2026 (AY-2025-2026 - Semester 1)"
    },
    {
      name: "LOG-EDU-STU-2025-00119-159916",
      date: "2025-11-10",
      mentor: "T. Rajasri",
      academic_term: "AY-2025-2026 (AY-2025-2026 - Semester 1)"
    }
  ]
};

const route = useRoute();
const router = useRouter();

// 1. Get student info SYNCHRONOUSLY from the URL query parameters
const studentId = route.query.student;
const studentName = route.query.studentName || 'Student'; // Fallback name

console.log('MentorshipLogs - Student ID:', studentId);
console.log('MentorshipLogs - Student Name:', studentName);

// 2. Define the resource OR mock it
const logEntriesResource = USE_MOCK
  ? {
      data: mockLogEntries,
      loading: false,
      error: null,
      fetch: () => {
        console.log('Mock: fetch called for logs (no-op)');
        return Promise.resolve(mockLogEntries);
      },
      reload: () => {
        console.log('Mock: reload called for logs (no-op)');
        return Promise.resolve(mockLogEntries);
      }
    }
  : createResource({
      url: 'srkr_frappe_app_api.instructor-mentorship.api.get_mentorship_logs_by_student',
      params: {
        student: studentId,
      },
      auto: false,
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
  
  if (USE_MOCK) {
    console.log('Using mock log data - no API call made');
  } else if (studentId) {
    console.log('Fetching logs for student:', studentId);
    logEntriesResource.fetch({
      student: studentId
    });
  } else {
    console.error('CRITICAL: No student ID found in the route parameters!');
  }
});

// 5. Navigation functions
const goBack = () => {
  router.back();
};

const navigateToNewLog = () => {
  router.push({
    path: '/mentorship-log/new',
    query: { student: studentId, studentName: studentName }, // Pass student info
  });
};

const navigateToLogDetail = (log) => {
  router.push({
    path: '/mentorship-log/edit',
    query: { logId: log.name }, // Pass the unique log ID to the edit form
  });
};

// Format name from UPPERCASE to Title Case
const formatName = (name) => {
  if (!name) return 'Student';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.back-button {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease;
  margin-left: -0.5rem;
}

.back-button:hover {
  color: #111827;
}

.back-button:active {
  color: #6b7280;
}

.student-name-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: #111827;
  flex-grow: 1;
}

.page-content {
  flex-grow: 1;
  background-color: #f9fafb;
}

.action-section {
  padding: 1rem;
  background-color: #f9fafb;
}

.create-log-button {
  width: 100%;
  background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
  color: white;
  border: none;
  padding: 0.65rem 1rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.15s ease;
}

.create-log-button:hover {
  background-color: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
}

.create-log-button:active {
  background-color: linear-gradient(135deg, #0c6b68 0%, #115e5b 100%);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1rem 0.5rem 1rem;
  background-color: #f9fafb;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.section-count {
  font-size: 0.875rem;
  font-weight: 600;
  color: #9ca3af;
  background-color: #f3f4f6;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  min-width: 1.5rem;
  text-align: center;
}

.loading-state, .error-state {
  text-align: center;
  padding: 4rem 1rem;
  color: #6b7280;
}

.error-state {
  color: #dc2626;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  background-color: #f9fafb;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  color: #9ca3af;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.empty-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  max-width: 320px;
  line-height: 1.5;
}
</style>