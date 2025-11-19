<template>
  <div class="page-container">
    <header class="page-header">
      <button @click="goBack" class="back-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <h1 class="page-title">New Log Entry</h1>
    </header>

    <main class="page-content">
      <form @submit.prevent="handleSubmit" class="form-wrapper">
        
        <!-- Student Info Card -->
        <div class="student-info-card">
          <div class="info-row">
            <span class="info-label">Student</span>
            <span class="info-value">{{ formatName(route.query.studentName) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Student ID</span>
            <span class="info-value">{{ logEntry.student }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Mentor</span>
            <span class="info-value">{{ logEntry.mentor }}</span>
          </div>
        </div>

        <!-- Meeting Date -->
        <div class="form-card">
          <label for="date" class="field-label">Meeting Date *</label>
          <input type="date" id="date" v-model="logEntry.date" class="form-input" required />
        </div>

        <!-- Discussion Notes -->
        <div class="form-card">
          <label for="notes" class="field-label">Discussion Notes</label>
          <textarea 
            id="notes"
            v-model="logEntry.notes" 
            class="form-textarea" 
            placeholder="Enter discussion notes here..."
            rows="4"
          ></textarea>
        </div>
        
        <!-- Academic Feedback -->
        <div class="form-card">
          <h3 class="card-title">Academic Feedback</h3>
          
          <div class="rating-field">
            <label class="rating-label">Teaching Quality</label>
            <div class="rating-buttons">
              <button 
                type="button"
                v-for="star in 5" 
                :key="'teaching-' + star"
                @click="logEntry.teaching_quality_rating = star / 5"
                :class="{ active: star <= Math.round(logEntry.teaching_quality_rating * 5) }"
                class="star-button"
              >
                {{ star <= Math.round(logEntry.teaching_quality_rating * 5) ? '★' : '☆' }}
              </button>
            </div>
          </div>
          
          <div class="rating-field">
            <label class="rating-label">Lab & Library Facilities</label>
            <div class="rating-buttons">
              <button 
                type="button"
                v-for="star in 5" 
                :key="'facilities-' + star"
                @click="logEntry.facilities_rating = star / 5"
                :class="{ active: star <= Math.round(logEntry.facilities_rating * 5) }"
                class="star-button"
              >
                {{ star <= Math.round(logEntry.facilities_rating * 5) ? '★' : '☆' }}
              </button>
            </div>
          </div>
          
          <div class="rating-field">
            <label class="rating-label">Content Relevancy</label>
            <div class="rating-buttons">
              <button 
                type="button"
                v-for="star in 5" 
                :key="'content-' + star"
                @click="logEntry.content_relevancy_rating = star / 5"
                :class="{ active: star <= Math.round(logEntry.content_relevancy_rating * 5) }"
                class="star-button"
              >
                {{ star <= Math.round(logEntry.content_relevancy_rating * 5) ? '★' : '☆' }}
              </button>
            </div>
          </div>
          
          <div class="rating-field">
            <label class="rating-label">Assessment Experience</label>
            <div class="rating-buttons">
              <button 
                type="button"
                v-for="star in 5" 
                :key="'assessment-' + star"
                @click="logEntry.assessment_rating = star / 5"
                :class="{ active: star <= Math.round(logEntry.assessment_rating * 5) }"
                class="star-button"
              >
                {{ star <= Math.round(logEntry.assessment_rating * 5) ? '★' : '☆' }}
              </button>
            </div>
          </div>

          <div class="checkbox-field">
            <input 
              type="checkbox" 
              id="subject_struggles" 
              v-model="logEntry.subject_struggles" 
              :true-value="1" 
              :false-value="0"
              class="checkbox-input"
            />
            <label for="subject_struggles" class="checkbox-label">
              Student is struggling with specific subjects?
            </label>
          </div>

          <div v-if="logEntry.subject_struggles" class="conditional-field">
            <label for="struggles_notes" class="field-label">Subject Struggles Details</label>
            <textarea 
              id="struggles_notes"
              v-model="logEntry.subject_struggles_notes" 
              class="form-textarea" 
              placeholder="List subjects and details..."
              rows="3"
            ></textarea>
          </div>
        </div>

        <!-- Campus Life -->
        <div class="form-card">
          <h3 class="card-title">Campus Life Feedback</h3>
          
          <div class="rating-field">
            <label class="rating-label">Hostel Facilities</label>
            <div class="rating-buttons">
              <button 
                type="button"
                v-for="star in 5" 
                :key="'hostel-' + star"
                @click="logEntry.hostel_rating = star / 5"
                :class="{ active: star <= Math.round(logEntry.hostel_rating * 5) }"
                class="star-button"
              >
                {{ star <= Math.round(logEntry.hostel_rating * 5) ? '★' : '☆' }}
              </button>
            </div>
          </div>
          
          <div class="rating-field">
            <label class="rating-label">Food Quality</label>
            <div class="rating-buttons">
              <button 
                type="button"
                v-for="star in 5" 
                :key="'food-' + star"
                @click="logEntry.food_rating = star / 5"
                :class="{ active: star <= Math.round(logEntry.food_rating * 5) }"
                class="star-button"
              >
                {{ star <= Math.round(logEntry.food_rating * 5) ? '★' : '☆' }}
              </button>
            </div>
          </div>
          
          <div class="rating-field">
            <label class="rating-label">Transport</label>
            <div class="rating-buttons">
              <button 
                type="button"
                v-for="star in 5" 
                :key="'transport-' + star"
                @click="logEntry.transport_rating = star / 5"
                :class="{ active: star <= Math.round(logEntry.transport_rating * 5) }"
                class="star-button"
              >
                {{ star <= Math.round(logEntry.transport_rating * 5) ? '★' : '☆' }}
              </button>
            </div>
          </div>
          
          <div class="rating-field">
            <label class="rating-label">Sports & Recreation</label>
            <div class="rating-buttons">
              <button 
                type="button"
                v-for="star in 5" 
                :key="'sports-' + star"
                @click="logEntry.sports_rating = star / 5"
                :class="{ active: star <= Math.round(logEntry.sports_rating * 5) }"
                class="star-button"
              >
                {{ star <= Math.round(logEntry.sports_rating * 5) ? '★' : '☆' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Action Plan -->
        <div class="form-card">
          <h3 class="card-title">Action Plan</h3>
          
          <div class="form-field">
            <label for="action_student" class="field-label">Action Items for Student</label>
            <textarea 
              id="action_student"
              v-model="logEntry.action_items_student" 
              class="form-textarea" 
              placeholder="e.g., Complete Chapter 3 exercises..."
              rows="3"
            ></textarea>
          </div>

          <div class="form-field">
            <label for="action_mentor" class="field-label">Action Items for Mentor</label>
            <textarea 
              id="action_mentor"
              v-model="logEntry.action_items_mentor" 
              class="form-textarea" 
              placeholder="e.g., Provide extra notes on topic X..."
              rows="3"
            ></textarea>
          </div>

          <div class="checkbox-field">
            <input 
              type="checkbox" 
              id="follow_up" 
              v-model="logEntry.follow_up_required" 
              :true-value="1" 
              :false-value="0"
              class="checkbox-input"
            />
            <label for="follow_up" class="checkbox-label">
              Follow-up meeting required?
            </label>
          </div>
        </div>

        <!-- Submit Button -->
        <button type="submit" class="submit-button" :disabled="createLogResource.loading">
          <span v-if="createLogResource.loading">Saving...</span>
          <span v-else>Save Log Entry</span>
        </button>
      </form>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createResource } from 'frappe-ui';
import { studentStore } from '@/stores/student';

const route = useRoute();
const router = useRouter();
const { getStudentInfo } = studentStore();

const studentId = route.query.student;
const instructorInfo = getStudentInfo().value;
const mentorName = instructorInfo?.instructor_record_id;

console.log('NewMentorshipLog - Student ID:', studentId);
console.log('NewMentorshipLog - Mentor:', mentorName);

const logEntry = ref({
  student: studentId,
  mentor: mentorName,
  date: new Date().toISOString().split('T')[0],
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

const createLogResource = createResource({
  url: 'srkr_frappe_app_api.instructor-mentorship.api.create_mentorship_log_entry',
  auto: false,
  onSuccess: (response) => {
    console.log('Log entry created successfully:', response);
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

const handleSubmit = () => {
  console.log('Submitting log entry:', logEntry.value);
  
  if (!logEntry.value.student || !logEntry.value.mentor) {
    alert('Missing required information. Please ensure student and mentor are set.');
    return;
  }
  
  createLogResource.fetch(logEntry.value);
};

const goBack = () => router.back();

const formatName = (name) => {
  if (!name) return '';
  return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
  padding-bottom: 2rem;
}

.form-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Student Info Card */
.student-info-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;
}

/* Form Cards */
.form-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

/* Form Fields */
.form-field {
  margin-bottom: 1rem;
}

.form-field:last-child {
  margin-bottom: 0;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-family: inherit;
  color: #111827;
  background: white;
  transition: all 0.15s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  line-height: 1.5;
}

/* Rating Fields */
.rating-field {
  padding: 1rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.rating-field:last-of-type {
  border-bottom: none;
}

.rating-label {
  display: block;
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
  margin-bottom: 0.625rem;
}

.rating-buttons {
  display: flex;
  gap: 0.375rem;
}

.star-button {
  width: 2.75rem;
  height: 2.75rem;
  border: 2px solid #f5f6f7;
  background: white;
  border-radius: 8px;
  font-size: 1.5rem;
  color: #d1d5db;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.star-button:hover {
  border-color: #fbbf24;
  background: #fffbeb;
  transform: scale(1.05);
}

.star-button.active {
  color: #fbbf24;
  border-color: #ffd56b;
  background: #fffbeb;
}

/* Checkbox Fields */
.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0;
  border-top: 1px solid #f3f4f6;
  margin-top: 0.5rem;
}

.checkbox-input {
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
  accent-color: #3b82f6;
}

.checkbox-label {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
}

/* Conditional Field */
.conditional-field {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

/* Submit Button */
.submit-button {
  width: 100%;
  padding: 1rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.submit-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
}

.submit-button:active:not(:disabled) {
  background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
}

.submit-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>