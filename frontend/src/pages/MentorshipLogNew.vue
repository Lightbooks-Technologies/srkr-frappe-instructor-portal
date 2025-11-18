<template>
  <div class="page-container">
    <header class="page-header">
      <button @click="goBack" class="back-button">&larr;</button>
      <h1 class="page-title">New Log Entry</h1>
    </header>

    <main class="page-content">
      <form @submit.prevent="handleSubmit" class="form-wrapper">
        <!-- Section 1: General Info (Read-only) -->
        <section class="details-section">
          <h2 class="section-title">General Information</h2>
          <div class="section-grid">
            <div class="detail-item">
              <span class="label">Student ID</span>
              <span class="value">{{ logEntry.student }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Mentor</span>
              <span class="value">{{ logEntry.mentor }}</span>
            </div>
            <div class="detail-item">
              <label for="date" class="label">Meeting Date</label>
              <input type="date" id="date" v-model="logEntry.date" class="form-input" />
            </div>
          </div>
        </section>

        <!-- Section 2: Discussion Notes -->
        <section class="details-section">
          <h2 class="section-title">Discussion Notes</h2>
          <textarea v-model="logEntry.notes" class="form-textarea" placeholder="Enter discussion notes here..."></textarea>
        </section>
        
        <!-- Section 3: Academic Feedback -->
        <section class="details-section">
          <h2 class="section-title">Academic Feedback</h2>
          <div class="section-grid">
            <div class="detail-item rating-item">
              <label class="label">Teaching Quality</label>
              <StarRating v-model="logEntry.teaching_quality_rating" />
            </div>
            <div class="detail-item rating-item">
              <label class="label">Lab & Library Facilities</label>
              <StarRating v-model="logEntry.facilities_rating" />
            </div>
            <div class="detail-item rating-item">
              <label class="label">Content Relevancy</label>
              <StarRating v-model="logEntry.content_relevancy_rating" />
            </div>
            <div class="detail-item rating-item">
              <label class="label">Assessment Experience</label>
              <StarRating v-model="logEntry.assessment_rating" />
            </div>
            <div class="detail-item full-width checkbox-item">
              <input type="checkbox" id="subject_struggles" v-model="logEntry.subject_struggles" :true-value="1" :false-value="0" />
              <label for="subject_struggles">Student is struggling with specific subjects?</label>
            </div>
            <div v-if="logEntry.subject_struggles" class="detail-item full-width">
              <textarea v-model="logEntry.subject_struggles_notes" class="form-textarea" placeholder="If yes, list subjects and notes..."></textarea>
            </div>
          </div>
        </section>

        <!-- Section 4: Campus Life -->
        <section class="details-section">
          <h2 class="section-title">Campus Life Feedback</h2>
          <div class="section-grid">
            <div class="detail-item rating-item">
              <label class="label">Hostel Facilities</label>
              <StarRating v-model="logEntry.hostel_rating" />
            </div>
            <div class="detail-item rating-item">
              <label class="label">Food Quality</label>
              <StarRating v-model="logEntry.food_rating" />
            </div>
            <div class="detail-item rating-item">
              <label class="label">Transport</label>
              <StarRating v-model="logEntry.transport_rating" />
            </div>
            <div class="detail-item rating-item">
              <label class="label">Sports & Recreation</label>
              <StarRating v-model="logEntry.sports_rating" />
            </div>
          </div>
        </section>

        <!-- Section 5: Action Plan -->
        <section class="details-section">
          <h2 class="section-title">Action Plan</h2>
          <div class="detail-item">
            <label for="action_student" class="label">Action Items for Student</label>
            <textarea id="action_student" v-model="logEntry.action_items_student" class="form-textarea" placeholder="e.g., Complete Chapter 3 exercises..."></textarea>
          </div>
          <div class="detail-item">
            <label for="action_mentor" class="label">Action Items for Mentor</label>
            <textarea id="action_mentor" v-model="logEntry.action_items_mentor" class="form-textarea" placeholder="e.g., Provide extra notes on topic X..."></textarea>
          </div>
          <div class="detail-item checkbox-item">
            <input type="checkbox" id="follow_up" v-model="logEntry.follow_up_required" :true-value="1" :false-value="0" />
            <label for="follow_up">Follow-up meeting required?</label>
          </div>
        </section>

        <!-- Submit Button -->
        <div class="submit-section">
          <button type="submit" class="submit-button" :disabled="createLogResource.loading">
            {{ createLogResource.loading ? 'Saving...' : 'Save Log Entry' }}
          </button>
        </div>
      </form>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createResource } from 'frappe-ui';
import { studentStore } from '@/stores/student';

// A simple, local StarRating component
const StarRating = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: `
    <div class="star-rating">
      <span v-for="star in 5" :key="star" @click="$emit('update:modelValue', star)"
            :class="{ filled: star <= modelValue }">★</span>
    </div>
  `
};

const route = useRoute();
const router = useRouter();
const { getStudentInfo } = studentStore();

// 1. Get initial data from route and store
const studentId = route.query.student;
const instructorInfo = getStudentInfo().value;
const mentorName = instructorInfo?.instructor_record_id; // This contains the actual name like "T. Rajasri"

console.log('NewMentorshipLog - Student ID:', studentId);
console.log('NewMentorshipLog - Instructor Info:', instructorInfo);
console.log('NewMentorshipLog - Mentor:', mentorName);

// 2. Create the reactive form data model
const logEntry = ref({
  student: studentId,
  mentor: mentorName,
  date: new Date().toISOString().split('T')[0], // Defaults to today, but is optional
  notes: '',
  teaching_quality_rating: 0,
  facilities_rating: 0,
  content_relevancy_rating: 0,
  assessment_rating: 0,
  subject_struggles: 0,
  subject_struggles_notes: '',
  hostel_rating: 0,
  food_rating: 0,
  transport_rating: 0,
  sports_rating: 0,
  follow_up_required: 0,
  action_items_student: '',
  action_items_mentor: '',
});

// 3. Define the resource for the POST action
const createLogResource = createResource({
  url: 'srkr_frappe_app_api.instructor-mentorship.api.create_mentorship_log_entry',
  auto: false,
  onSuccess: (response) => {
    console.log('Log entry created successfully:', response);
    // On success, navigate back to the log list
    router.push({
      path: '/mentorship-logs',
      query: {
        student: studentId,
        studentName: route.query.studentName
      }
    });
  },
  onError: (error) => {
    console.error('Failed to create log entry:', error);
    alert('Error: Could not save the log entry. Please try again.');
  }
});

// 4. Handle form submission
const handleSubmit = () => {
  console.log('Submitting log entry:', logEntry.value);
  
  // Validate only the required pre-populated fields
  if (!logEntry.value.student || !logEntry.value.mentor) {
    alert('Missing required information. Please ensure student and mentor are set.');
    return;
  }
  
  // Use fetch() with the form data - this is the correct pattern
  createLogResource.fetch(logEntry.value);
};

// 5. Navigation helper
const goBack = () => router.back();
</script>

<style scoped>
/* Reusing styles for consistency */
.page-container { background-color: #f8fafc; min-height: 100vh; }
.page-header { background: white; padding: 1rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 1rem; position: sticky; top: 0; z-index: 10; }
.back-button { font-size: 1.5rem; background: none; border: none; cursor: pointer; color: #374151; }
.page-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
.page-content { padding: 1rem; padding-bottom: 3rem; }
.form-wrapper { display: flex; flex-direction: column; gap: 1.5rem; }
.details-section { background: white; border-radius: 0.75rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.section-title { font-size: 1.1rem; font-weight: 600; margin: 0 0 1rem 0; padding-bottom: 0.75rem; border-bottom: 1px solid #f3f4f6; }
.section-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
.detail-item { display: flex; flex-direction: column; gap: 0.5rem; }
.full-width { grid-column: 1 / -1; }
.label { font-size: 0.875rem; color: #6b7280; font-weight: 500; }
.value { font-size: 1rem; font-weight: 500; color: #1f2937; }

/* Form specific styles */
.form-input, .form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: inherit;
}
.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.form-textarea {
  min-height: 120px;
  resize: vertical;
}
.checkbox-item {
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}
.checkbox-item input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}
.checkbox-item label {
  cursor: pointer;
  margin: 0;
}
.submit-section {
  padding-top: 1rem;
}
.submit-button {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #2563eb;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}
.submit-button:hover:not(:disabled) {
  background-color: #1d4ed8;
}
.submit-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

/* Simple Star Rating Component Styles */
.star-rating {
  display: flex;
  gap: 0.25rem;
  font-size: 1.75rem;
  color: #d1d5db;
}
.star-rating span {
  cursor: pointer;
  transition: color 0.2s;
}
.star-rating span:hover {
  color: #fbbf24;
}
.star-rating span.filled {
  color: #f59e0b;
}

@media (max-width: 640px) {
  .section-grid { grid-template-columns: 1fr; }
}
</style>