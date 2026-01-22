<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">Student Mentorship Profile</h1>
      <p v-if="!studentProfilesResource.loading && !studentProfilesResource.error && studentProfiles.length > 0" class="page-subtitle">
        {{ studentProfiles.length }} {{ studentProfiles.length === 1 ? 'student' : 'students' }} assigned
      </p>
    </div>

    <!-- The loading state is now correctly driven by the resource -->
    <div v-if="studentProfilesResource.loading" class="loading-state">
      Loading students...
    </div>

    <!-- Error state -->
    <div v-else-if="studentProfilesResource.error" class="error-state">
      Error loading students: {{ studentProfilesResource.error }}
    </div>

    <!-- The list component gets the reactive computed property -->
    <MentorshipStudentList
      v-else-if="studentProfiles.length > 0"
      :profiles="studentProfiles"
      @student-selected="navigateToStudentLogs"
    />

    <!-- Empty state -->
    <div v-else class="empty-state">
      No students found.
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createResource } from 'frappe-ui';
import { studentStore } from '@/stores/student';
import MentorshipStudentList from '../components/MentorshipStudentList.vue';

console.log('--- Mentor.vue setup started ---');

const USE_MOCK = false; // Set to false to use real API

const mockStudentProfiles = {
    "message": [
        {
            "name": "EDU-STU-2025-00118",
            "student": "EDU-STU-2025-00118",
            "student_name": "ABHISHEK SANKE",
            "program": "B.Tech Artificial Intelligence and Data Science",
            "cumulative_attendance": null,
            "student_group": "BTECH-ADS-AY2526-SEM-03-A",
            "custom_student_id": "24B91A5401",
            "student_image": "https://mockmind-api.uifaces.co/content/human/125.jpg"
        },
        {
            "name": "EDU-STU-2025-00119",
            "student": "EDU-STU-2025-00119",
            "student_name": "ADABALA ARAVIND",
            "program": "B.Tech Artificial Intelligence and Data Science",
            "cumulative_attendance": 10,
            "student_group": "BTECH-ADS-AY2526-SEM-03-A",
            "custom_student_id": "24B91A5402",
            "student_image": "https://mockmind-api.uifaces.co/content/human/222.jpg"
        },
        {
            "name": "EDU-STU-2025-00120",
            "student": "EDU-STU-2025-00120",
            "student_name": "AKULA SRI DURGA MALLESWARI",
            "program": "B.Tech Artificial Intelligence and Data Science",
            "cumulative_attendance": 90,
            "student_group": "BTECH-ADS-AY2526-SEM-03-A",
            "custom_student_id": "24B91A5403",
            "student_image": "https://mockmind-api.uifaces.co/content/human/80.jpg"
        },
        {
            "name": "EDU-STU-2025-00121",
            "student": "EDU-STU-2025-00121",
            "student_name": "ANDE DURGA SRAVANI",
            "program": "B.Tech Artificial Intelligence and Data Science",
            "cumulative_attendance": 40,
            "student_group": "BTECH-ADS-AY2526-SEM-03-A",
            "custom_student_id": "24B91A5404",
            "student_image": "https://mockmind-api.uifaces.co/content/human/218.jpg"
        },
        {
            "name": "EDU-STU-2025-00122",
            "student": "EDU-STU-2025-00122",
            "student_name": "ANDE VINAY KUMAR",
            "program": "B.Tech Artificial Intelligence and Data Science",
            "cumulative_attendance": 65,
            "student_group": "BTECH-ADS-AY2526-SEM-03-A",
            "custom_student_id": "24B91A5405",
            "student_image": "https://mockmind-api.uifaces.co/content/human/217.jpg"
        },
        {
            "name": "EDU-STU-2025-01369",
            "student": "EDU-STU-2025-01369",
            "student_name": "MANDAPATI VENKATA YAMINI",
            "program": "B.Tech Computer Science and Information Technology",
            "cumulative_attendance": 95.65,
            "student_group": "BTECH-CSIT-AY2526-SEM-03-B",
            "custom_student_id": "24B91A0767",
            "student_image": null
        }
    ]
};

const router = useRouter();
const { getStudentInfo } = studentStore();

// 1. Get instructor info SYNCHRONOUSLY
const instructorInfo = getStudentInfo().value;
const instructorId = instructorInfo?.instructor_record_id;

// Log the ID we found
console.log(`Retrieved instructor ID from store: ${instructorId}`);

// 2. Define the resource OR mock it
const studentProfilesResource = USE_MOCK
  ? {
      data: mockStudentProfiles,
      loading: false,
      error: null,
      fetch: () => {
        console.log('Mock: fetch called (no-op)');
        return Promise.resolve(mockStudentProfiles);
      },
      reload: () => {
        console.log('Mock: reload called (no-op)');
        return Promise.resolve(mockStudentProfiles);
      }
    }
  : createResource({
      url: 'srkr_frappe_app_api.instructor-mentorship.api.get_mentorship_students',
      params: {
        instructor: instructorId,
      },
      auto: false,
      onSuccess: (response) => {
        console.log('API call successful. Response:', response);
        console.log('Student profiles:', response?.message);
      },
      onError: (error) => {
        console.error('API call failed:', error);
      }
    });

// 3. Create a reactive COMPUTED property
const studentProfiles = computed(() => {
  const data = studentProfilesResource.data;
  console.log('Computed studentProfiles - raw data:', data);
  
  // Handle both direct array and nested message format
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.message)) {
    return data.message;
  }
  return [];
});

// 4. Use onMounted to trigger the API call (or mock initialization)
onMounted(() => {
  console.log('Component has mounted.');
  
  if (USE_MOCK) {
    console.log('Using mock data - no API call made');
  } else if (instructorId) {
    console.log('Triggering API fetch with instructor:', instructorId);
    studentProfilesResource.fetch({
      instructor: instructorId
    });
  } else {
    console.error('CRITICAL: Could not get instructorId from the store on mount!');
  }
});

// 5. Navigation function
const navigateToStudentLogs = (profile) => {
  if (profile && profile.student) {
    router.push({
      path: '/mentorship-logs',
      query: {
        student: profile.student,
        studentName: profile.student_name,
        guardianName: profile.guardian_name,
        guardianPhone: profile.guardian_phone,
        customStudentId: profile.custom_student_id,
      },
    });
  }
};
</script>

<style scoped>
.page-header {
  padding: 1.25rem 1rem 1rem 1rem;
  background-color: #ffffff;
  border-bottom: 1px solid #f3f4f6;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.loading-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.error-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #dc2626;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}
</style>