<template>
  <div>
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
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { createResource } from 'frappe-ui';
import { studentStore } from '@/stores/student';
import MentorshipStudentList from '../components/MentorshipStudentList.vue';

console.log('--- Mentor.vue setup started ---');

const router = useRouter();
const { getStudentInfo } = studentStore();

// 1. Get instructor info SYNCHRONOUSLY
const instructorInfo = getStudentInfo().value;
const instructorId = instructorInfo?.instructor_record_id;

// Log the ID we found
console.log(`Retrieved instructor ID from store: ${instructorId}`);

// 2. Define the resource - params should return the data object
const studentProfilesResource = createResource({
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

// 4. Use onMounted to trigger the API call
onMounted(() => {
  console.log('Component has mounted.');
  if (instructorId) {
    console.log('Triggering API fetch with instructor:', instructorId);
    
    // Option 1: Use fetch with explicit params
    studentProfilesResource.fetch({
      instructor: instructorId
    });
    
    // OR Option 2: Update params and reload
    // studentProfilesResource.update({
    //   params: {
    //     instructor: instructorId
    //   }
    // });
    // studentProfilesResource.reload();
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
      },
    });
  }
};
</script>

<style scoped>
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