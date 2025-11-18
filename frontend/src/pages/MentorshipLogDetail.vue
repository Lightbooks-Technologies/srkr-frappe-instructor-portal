<template>
  <div class="page-container">
    <header class="page-header">
      <button @click="goBack" class="back-button">&larr;</button>
      <h1 class="page-title">Log Entry Details</h1>
    </header>

    <main class="page-content">
      <div v-if="logDetailsResource.loading" class="loading-state">
        Loading Details...
      </div>
      <div v-else-if="logDetailsResource.error" class="error-state">
        Failed to load log details.
      </div>
      <div v-else-if="logDetails.name" class="details-wrapper">
        <!-- Section 1: General Information -->
        <section class="details-section">
          <h2 class="section-title">General Information</h2>
          <div class="section-grid">
            <div class="detail-item">
              <span class="label">Student</span>
              <span class="value">{{ logDetails.student_name }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Mentor</span>
              <span class="value">{{ logDetails.mentor }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Meeting Date</span>
              <span class="value">{{ formatDate(logDetails.date) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Academic Term</span>
              <span class="value">{{ logDetails.academic_term }}</span>
            </div>
          </div>
        </section>

        <!-- Section 2: Discussion Notes -->
        <section class="details-section">
          <h2 class="section-title">Discussion Notes</h2>
          <div v-if="logDetails.notes" v-html="logDetails.notes" class="notes-content"></div>
          <div v-else class="value">No discussion notes were recorded.</div>
        </section>

        <!-- Section 3: Academic Feedback -->
        <section class="details-section">
          <h2 class="section-title">Academic Feedback</h2>
          <div class="section-grid">
            <div class="detail-item rating-item">
              <span class="label">Teaching Quality</span>
              <span class="value rating">{{ formatRating(logDetails.teaching_quality_rating) }}</span>
            </div>
            <div class="detail-item rating-item">
              <span class="label">Lab & Library Facilities</span>
              <span class="value rating">{{ formatRating(logDetails.facilities_rating) }}</span>
            </div>
            <div class="detail-item rating-item">
              <span class="label">Content Relevancy</span>
              <span class="value rating">{{ formatRating(logDetails.content_relevancy_rating) }}</span>
            </div>
            <div class="detail-item rating-item">
              <span class="label">Assessment Experience</span>
              <span class="value rating">{{ formatRating(logDetails.assessment_rating) }}</span>
            </div>
            <div class="detail-item full-width">
              <span class="label">Struggling with Subjects?</span>
              <span class="value">{{ formatBoolean(logDetails.subject_struggles) }}</span>
              <p v-if="logDetails.subject_struggles" class="notes-subtext">{{ logDetails.subject_struggles_notes }}</p>
            </div>
          </div>
        </section>
        
        <!-- Section 4: Action Plan -->
        <section class="details-section">
          <h2 class="section-title">Action Plan</h2>
          <div class="detail-item">
            <span class="label">Action Items for Student</span>
            <p class="value">{{ logDetails.action_items_student || 'N/A' }}</p>
          </div>
          <div class="detail-item">
            <span class="label">Action Items for Mentor</span>
            <p class="value">{{ logDetails.action_items_mentor || 'N/A' }}</p>
          </div>
           <div class="detail-item">
            <span class="label">Follow-up Required?</span>
            <p class="value">{{ formatBoolean(logDetails.follow_up_required) }}</p>
          </div>
        </section>

      </div>
      <div v-else class="empty-state">
        Log entry not found.
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createResource } from 'frappe-ui';

const route = useRoute();
const router = useRouter();

// 1. Get logId from the URL
const logId = route.query.logId;

console.log('MentorshipLogDetails - Log ID:', logId);

// 2. Define the resource for fetching log details
const logDetailsResource = createResource({
  url: 'srkr_frappe_app_api.instructor-mentorship.api.get_mentorship_log_details',
  params: { 
    log_id: logId 
  },
  auto: false,
  onSuccess: (response) => {
    console.log('Log details loaded successfully:', response);
  },
  onError: (error) => {
    console.error('Error loading log details:', error);
  }
});

// 3. Create the robust computed property to access the data
const logDetails = computed(() => {
  const data = logDetailsResource.data;
  console.log('Computed logDetails - raw data:', data);
  
  // Handle both direct object and { message: {...} } format
  if (data && data.message) {
    return data.message;
  }
  if (data && data.name) {
    return data;
  }
  return {};
});

// 4. Trigger the API call on mount
onMounted(() => {
  console.log('Component mounted');
  if (logId) {
    console.log('Fetching log details for:', logId);
    // Use fetch() with explicit params instead of reload()
    logDetailsResource.fetch({
      log_id: logId
    });
  } else {
    console.error('CRITICAL: No log ID found in route query');
  }
});

// 5. Helper functions for formatting data in the template
const goBack = () => router.back();

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

const formatBoolean = (value) => (value ? 'Yes' : 'No');

const formatRating = (rating) => {
  if (rating === null || rating === undefined || rating === 0) return 'Not Rated';
  const starCount = Math.round(rating * 5);
  return '★'.repeat(starCount) + '☆'.repeat(5 - starCount);
};
</script>

<style scoped>
/* Scoped styles for the detail page, consistent with previous pages */
.page-container { background-color: #f8fafc; min-height: 100vh; }
.page-header { background: white; padding: 1rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 1rem; }
.back-button { font-size: 1.5rem; background: none; border: none; cursor: pointer; color: #374151; }
.page-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
.page-content { padding: 1rem; }
.loading-state, .error-state, .empty-state { text-align: center; padding: 4rem 1rem; color: #6b7280; }
.error-state { color: #dc2626; }

.details-wrapper { display: flex; flex-direction: column; gap: 1.5rem; }
.details-section { background: white; border-radius: 0.75rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.section-title { font-size: 1.1rem; font-weight: 600; margin: 0 0 1rem 0; padding-bottom: 0.75rem; border-bottom: 1px solid #f3f4f6; }
.section-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
.detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
.full-width { grid-column: 1 / -1; }
.label { font-size: 0.875rem; color: #6b7280; }
.value { font-size: 1rem; font-weight: 500; color: #1f2937; }
.rating { color: #f59e0b; font-size: 1.25rem; }
.notes-content { padding: 0.5rem; border-left: 3px solid #e5e7eb; }
.notes-subtext { margin: 0.5rem 0 0 0; padding: 0.75rem; background-color: #f9fafb; border-radius: 0.5rem; font-style: italic; color: #4b5563; }

@media (max-width: 640px) {
  .section-grid { grid-template-columns: 1fr; }
}
</style>