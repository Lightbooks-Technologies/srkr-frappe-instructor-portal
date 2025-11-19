<template>
  <div class="page-container">
    <header class="page-header">
      <button @click="goBack" class="back-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <h1 class="page-title">Log Entry Details</h1>
    </header>

    <main class="page-content">
      <div v-if="logDetailsResource.loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading Details...</p>
      </div>
      <div v-else-if="logDetailsResource.error" class="error-state">
        <div class="error-icon">⚠️</div>
        <p>Failed to load log details.</p>
      </div>
      <div v-else-if="logDetails.name" class="details-wrapper">
        
        <!-- Student Header Card -->
        <div class="student-header-card">
          <div class="student-info-row">
            <div>
              <h2 class="student-name">{{ formatName(logDetails.student_name) }}</h2>
              <p class="mentor-label">Mentor: <span class="mentor-value">{{ logDetails.mentor }}</span></p>
            </div>
            <div class="date-badge">
              <div class="date-day">{{ getDay(logDetails.date) }}</div>
              <div class="date-month">{{ getMonth(logDetails.date) }}</div>
            </div>
          </div>
          <div class="term-badge">{{ logDetails.academic_term }}</div>
        </div>

        <!-- Discussion Notes -->
        <section v-if="logDetails.notes" class="content-card">
          <div class="card-header">
            <h3 class="card-title">Discussion Notes</h3>
          </div>
          <div v-html="logDetails.notes" class="notes-content"></div>
        </section>

        <!-- Academic Feedback -->
        <section class="content-card">
          <div class="card-header">
            <h3 class="card-title">Academic Feedback</h3>
          </div>
          
          <div class="feedback-list">
            <div class="feedback-item">
              <div class="feedback-row">
                <span class="feedback-label">Teaching Quality</span>
                <span class="rating-value" :class="getRatingClass(logDetails.teaching_quality_rating)">
                  {{ formatRatingText(logDetails.teaching_quality_rating) }}
                </span>
              </div>
              <div class="rating-stars">{{ formatRating(logDetails.teaching_quality_rating) }}</div>
            </div>

            <div class="feedback-item">
              <div class="feedback-row">
                <span class="feedback-label">Lab & Library Facilities</span>
                <span class="rating-value" :class="getRatingClass(logDetails.facilities_rating)">
                  {{ formatRatingText(logDetails.facilities_rating) }}
                </span>
              </div>
              <div class="rating-stars">{{ formatRating(logDetails.facilities_rating) }}</div>
            </div>

            <div class="feedback-item">
              <div class="feedback-row">
                <span class="feedback-label">Content Relevancy</span>
                <span class="rating-value" :class="getRatingClass(logDetails.content_relevancy_rating)">
                  {{ formatRatingText(logDetails.content_relevancy_rating) }}
                </span>
              </div>
              <div class="rating-stars">{{ formatRating(logDetails.content_relevancy_rating) }}</div>
            </div>

            <div class="feedback-item">
              <div class="feedback-row">
                <span class="feedback-label">Assessment Experience</span>
                <span class="rating-value" :class="getRatingClass(logDetails.assessment_rating)">
                  {{ formatRatingText(logDetails.assessment_rating) }}
                </span>
              </div>
              <div class="rating-stars">{{ formatRating(logDetails.assessment_rating) }}</div>
            </div>
          </div>

          <div v-if="logDetails.subject_struggles" class="struggles-notice">
            <div class="notice-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span class="notice-title">Struggling with Subjects</span>
            </div>
            <p class="notice-text">{{ logDetails.subject_struggles_notes }}</p>
          </div>
        </section>

        <!-- Action Plan -->
        <section class="content-card">
          <div class="card-header">
            <h3 class="card-title">Action Plan</h3>
          </div>

          <div class="action-list">
            <div class="action-block">
              <div class="action-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span class="action-title">For Student</span>
              </div>
              <p class="action-text">{{ logDetails.action_items_student || 'No action items assigned' }}</p>
            </div>

            <div class="action-block">
              <div class="action-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span class="action-title">For Mentor</span>
              </div>
              <p class="action-text">{{ logDetails.action_items_mentor || 'No action items assigned' }}</p>
            </div>
          </div>

          <div class="followup-row">
            <span class="followup-label">Follow-up Required</span>
            <span class="followup-status" :class="{ 'status-yes': logDetails.follow_up_required }">
              {{ logDetails.follow_up_required ? 'Yes' : 'No' }}
            </span>
          </div>
        </section>

      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <p>Log entry not found.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createResource } from 'frappe-ui';

const USE_MOCK = false;

const mockLogDetails = {
  message: {
    name: "LOG-EDU-STU-2025-00118-159916",
    student: "EDU-STU-2025-00118",
    student_name: "ABHISHEK SANKE",
    mentor: "T. Rajasri",
    date: "2025-11-17",
    academic_term: "AY-2025-2026 (AY-2025-2026 - Semester 1)",
    notes: "<p>This is a test log entry created via the new API.</p>",
    teaching_quality_rating: 0.8,
    facilities_rating: 1.0,
    subject_struggles: 1,
    subject_struggles_notes: "Struggling with Advanced Calculus.",
    content_relevancy_rating: 0.6,
    assessment_rating: 0.4,
    follow_up_required: 1,
    action_items_student: "Complete practice problems from Chapter 5 and attend extra help sessions.",
    action_items_mentor: "Arrange peer tutoring and provide additional resources for Calculus.",
  }
};

const route = useRoute();
const router = useRouter();

const logId = route.query.logId;

const logDetailsResource = USE_MOCK
  ? {
      data: mockLogDetails,
      loading: false,
      error: null,
    }
  : createResource({
      url: 'srkr_frappe_app_api.instructor-mentorship.api.get_mentorship_log_details',
      params: { log_id: logId },
      auto: false,
    });

const logDetails = computed(() => {
  const data = logDetailsResource.data;
  if (data && data.message) return data.message;
  if (data && data.name) return data;
  return {};
});

onMounted(() => {
  if (!USE_MOCK && logId) {
    logDetailsResource.fetch({ log_id: logId });
  }
});

const goBack = () => router.back();

const formatName = (name) => {
  if (!name) return '';
  return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getDay = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).getDate();
};

const getMonth = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
};

const formatRating = (rating) => {
  if (rating === null || rating === undefined || rating === 0) return '☆☆☆☆☆';
  const starCount = Math.round(rating * 5);
  return '★'.repeat(starCount) + '☆'.repeat(5 - starCount);
};

const formatRatingText = (rating) => {
  if (rating === null || rating === undefined || rating === 0) return 'Not Rated';
  const percentage = (rating * 100).toFixed(0);
  if (rating >= 0.8) return 'Excellent';
  if (rating >= 0.6) return 'Good';
  if (rating >= 0.4) return 'Average';
  return 'Needs Improvement';
};

const getRatingClass = (rating) => {
  if (rating === null || rating === undefined || rating === 0) return 'rating-none';
  if (rating >= 0.8) return 'rating-excellent';
  if (rating >= 0.6) return 'rating-good';
  if (rating >= 0.4) return 'rating-average';
  return 'rating-poor';
};
</script>

<style scoped>
.page-container {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  background: white;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: sticky;
  top: 0;
  z-index: 10;
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
  margin-left: -0.5rem;
}

.page-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: #111827;
}

.page-content {
  padding: 1rem;
  padding-bottom: 6rem;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.details-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Student Header Card */
.student-header-card {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #3b82f6;
}

.student-info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.student-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.mentor-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.mentor-value {
  font-weight: 500;
  color: #374151;
}

.date-badge {
  background: #f3f4f6;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  text-align: center;
  min-width: 60px;
}

.date-day {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.date-month {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-top: 0.125rem;
}

.term-badge {
  font-size: 0.8125rem;
  color: #6b7280;
  background: #f9fafb;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  display: inline-block;
}

/* Content Cards */
.content-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #111827;
}

/* Notes */
.notes-content {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  color: #374151;
  line-height: 1.6;
  font-size: 0.9375rem;
}

/* Feedback List */
.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.feedback-item {
  padding-bottom: 0.875rem;
  border-bottom: 1px solid #f3f4f6;
}

.feedback-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.feedback-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.feedback-label {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.rating-value {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.625rem;
  border-radius: 12px;
}

.rating-excellent {
  background: #d1fae5;
  color: #065f46;
}

.rating-good {
  background: #dbeafe;
  color: #1e40af;
}

.rating-average {
  background: #fef3c7;
  color: #92400e;
}

.rating-poor {
  background: #fee2e2;
  color: #991b1b;
}

.rating-none {
  background: #f3f4f6;
  color: #6b7280;
}

.rating-stars {
  color: #fbbf24;
  font-size: 1.125rem;
  letter-spacing: 2px;
}

/* Struggles Notice */
.struggles-notice {
  margin-top: 1rem;
  padding: 1rem;
  background: #fef3c7;
  border-radius: 8px;
  border-left: 3px solid #f59e0b;
}

.notice-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.notice-header svg {
  color: #f59e0b;
}

.notice-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #92400e;
}

.notice-text {
  font-size: 0.875rem;
  color: #78350f;
  margin: 0;
  line-height: 1.5;
}

/* Action List */
.action-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.action-block {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.action-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.action-header svg {
  color: #3b82f6;
}

.action-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.action-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

/* Follow-up Row */
.followup-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem;
  background: #f9fafb;
  border-radius: 8px;
}

.followup-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.followup-status {
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  background: #f3f4f6;
  color: #6b7280;
}

.followup-status.status-yes {
  background: #dbeafe;
  color: #1e40af;
}
</style>