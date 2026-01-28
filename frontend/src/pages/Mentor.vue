<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-main">
        <div class="header-info">
          <h1 class="page-title">Student Mentorship Profile</h1>
          <p v-if="!studentProfilesResource.loading && !studentProfilesResource.error && studentProfiles.length > 0" class="page-subtitle">
            {{ studentProfiles.length }} {{ studentProfiles.length === 1 ? 'student' : 'students' }} assigned
          </p>
        </div>
        
        <!-- Sort Control -->
        <div class="sort-wrapper">
          <div 
            @click="sortDropdownOpen = !sortDropdownOpen" 
            class="sort-button"
            :class="{ 'active': sortDropdownOpen }"
          >
            <FeatherIcon name="filter" class="w-4 h-4" />
            <span class="sort-text">{{ currentSortLabel }}</span>
            <FeatherIcon name="chevron-down" class="w-3.5 h-3.5 transition-transform" :class="{ 'rotate-180': sortDropdownOpen }" />
          </div>

          <div v-if="sortDropdownOpen" class="sort-dropdown" @click.stop>
            <div 
              v-for="option in sortOptions" 
              :key="option.value"
              @click="applySort(option.value)"
              class="sort-item"
              :class="{ 'active': sortBy === option.value }"
            >
              {{ option.label }}
            </div>
          </div>
        </div>
      </div>
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
import { createResource, FeatherIcon } from 'frappe-ui';
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
      onError: (error) => {
        console.error('API call failed:', error);
      }
    });

// Sort State
const sortBy = ref('semester-desc');
const sortDropdownOpen = ref(false);
const sortOptions = [
  { label: 'Semester (High to Low)', value: 'semester-desc' },
  { label: 'Semester (Low to High)', value: 'semester-asc' },
  { label: 'Name (A to Z)', value: 'name-asc' },
  { label: 'Attendance (Critical first)', value: 'attendance-low' }
];

const currentSortLabel = computed(() => {
  return sortOptions.find(o => o.value === sortBy.value)?.label || 'Sort';
});

const applySort = (val) => {
  sortBy.value = val;
  sortDropdownOpen.value = false;
};

// 3. Create a reactive COMPUTED property
const studentProfiles = computed(() => {
  let list = [];
  const data = studentProfilesResource.data;
  
  // Handle both direct array and nested message format
  if (Array.isArray(data)) {
    list = [...data];
  } else if (data && Array.isArray(data.message)) {
    list = [...data.message];
  } else {
    return [];
  }

  // Frontend Sorting Logic
  if (sortBy.value === 'semester-desc') {
    list.sort((a, b) => {
      const semA = a.program_semester || '';
      const semB = b.program_semester || '';
      if (semB !== semA) return semB.localeCompare(semA);
      return (a.student_name || '').localeCompare(b.student_name || '');
    });
  } else if (sortBy.value === 'semester-asc') {
    list.sort((a, b) => {
      const semA = a.program_semester || '';
      const semB = b.program_semester || '';
      if (semA !== semB) return semA.localeCompare(semB);
      return (a.student_name || '').localeCompare(b.student_name || '');
    });
  } else if (sortBy.value === 'name-asc') {
    list.sort((a, b) => (a.student_name || '').localeCompare(b.student_name || ''));
  } else if (sortBy.value === 'attendance-low') {
    list.sort((a, b) => {
      const attA = a.cumulative_attendance === null ? 100 : a.cumulative_attendance;
      const attB = b.cumulative_attendance === null ? 100 : b.cumulative_attendance;
      return attA - attB;
    });
  }
  
  return list;
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
  padding: 1rem 1rem;
  background-color: #ffffff;
  border-bottom: 1px solid #f3f4f6;
  position: sticky;
  top: 0;
  z-index: 20;
}

.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.sort-wrapper {
  position: relative;
}

.sort-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sort-button:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.sort-button.active {
  background-color: #ffffff;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.sort-text {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
}

.sort-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.625rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  min-width: 180px;
  overflow: hidden;
  z-index: 30;
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.sort-item {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sort-item:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.sort-item.active {
  background-color: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}

.rotate-180 {
  transform: rotate(180deg);
}

.transition-transform {
  transition: transform 0.2s ease;
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