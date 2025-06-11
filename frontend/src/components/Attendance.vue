<template>
  <div class="attendance-page">
    <!-- Header -->
    <div class="header">
      <button @click="$router.go(-1)" class="back-button">
        <FeatherIcon name="arrow-left" class="w-5 h-5" />
      </button>
      <div class="header-info">
        <h1 class="course-title">{{ courseInfo.name }}</h1>
        <p class="course-details">{{ courseInfo.year }}</p>
      </div>
    </div>

    <!-- Alert Messages -->
    <div v-if="allStudentsHaveStatus" class="alert-message completed">
      <FeatherIcon name="check-circle" class="w-5 h-5 text-green-600" />
      <div>
        <p class="alert-text">
          Attendance for this class has already been recorded and submitted. No further changes can be made.
        </p>
      </div>
    </div>

    <div v-else-if="someStudentsHaveStatus" class="alert-message partial">
      <FeatherIcon name="alert-triangle" class="w-5 h-5 text-yellow-600" />
      <div>
        <p class="alert-text">
          Attendance has been partially recorded. Some students' attendance is already submitted and cannot be changed. You can only mark attendance for the remaining students.
        </p>
      </div>
    </div>

    <div v-else-if="isEditMode" class="alert-message edit">
      <FeatherIcon name="info" class="w-5 h-5 text-blue-600" />
      <div>
        <p class="alert-text">
          Attendance has already been recorded. You are now editing the existing entry to update or correct any details as needed.
        </p>
      </div>
    </div>

    <!-- Session Info -->
    <div class="session-info">
      <h3 class="session-title">Attendance for the following session</h3>
      <p class="session-time">{{ formatSessionTime(sessionData.start_time, sessionData.end_time) }}</p>
    </div>

    <!-- Instructions and Actions -->
    <div class="actions-section">
      <p class="instructions">Click on the checkbox to mark as absent</p>
      
      <div class="bulk-actions">
        <button @click="markAllAsPresent" class="action-button mark-present">
          Mark all as present
        </button>
        <button @click="markAllAsAbsent" class="action-button mark-absent">
          Mark all as absent
        </button>
        <button @click="resetAttendance" class="action-button reset">
          Reset
        </button>
      </div>
    </div>

    <!-- Students List -->
    <div class="students-list">
      <div 
        v-for="student in students" 
        :key="student.student"
        class="student-row"
        :class="{ 'absent': !student.checked }"
        @click="toggleStudentAttendance(student)"
      >
        <div class="student-info">
          <div class="checkbox-container">
            <input 
              type="checkbox" 
              v-model="student.checked"
              :disabled="isStudentDisabled(student)"
              class="student-checkbox"
              @click.stop
            />
            <div class="custom-checkbox" :class="{ 'checked': student.checked }">
              <FeatherIcon v-if="student.checked" name="check" class="w-4 h-4 text-white" />
            </div>
          </div>
          
          <div class="student-details">
            <span class="student-name">{{ student.student_name }}</span>
            <span class="roll-number">Roll: {{ student.group_roll_number }}</span>
            <span v-if="student.status" class="status-indicator">{{ student.status }} (Submitted)</span>
          </div>
        </div>
        
        <div v-if="!student.checked && !isStudentDisabled(student)" class="absent-badge">
          Ab
        </div>
        <div v-if="student.status" class="status-badge" :class="student.status.toLowerCase()">
          {{ student.status.charAt(0) }}
        </div>
      </div>
    </div>

    <!-- Submit Button -->
    <div class="submit-section">
      <button @click="submitAttendance" class="submit-button" :disabled="isSubmitDisabled">
        <span v-if="isSubmitting">Submitting...</span>
        <span v-else-if="allStudentsHaveStatus">Attendance Already Submitted</span>
        <span v-else>Submit Attendance</span>
      </button>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="closeConfirmModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Confirm</h3>
          <button @click="closeConfirmModal" class="close-button">
            <FeatherIcon name="x" class="w-5 h-5" />
          </button>
        </div>
        <div class="modal-body">
          <p>Do you want to update attendance?</p>
          <p><strong>Present:</strong> {{ presentCount }}</p>
          <p><strong>Absent:</strong> {{ absentCount }}</p>
        </div>
        <div class="modal-actions">
          <button @click="closeConfirmModal" class="modal-button secondary">No</button>
          <button @click="confirmSubmit" class="modal-button primary">Yes</button>
        </div>
      </div>
    </div>

    <!-- Error Modal -->
    <div v-if="showErrorModal" class="modal-overlay" @click="closeErrorModal">
      <div class="modal-content error" @click.stop>
        <div class="modal-header">
          <div class="error-icon">
            <FeatherIcon name="alert-circle" class="w-5 h-5 text-red-600" />
          </div>
          <h3>{{ errorTitle }}</h3>
          <button @click="closeErrorModal" class="close-button">
            <FeatherIcon name="x" class="w-5 h-5" />
          </button>
        </div>
        <div class="modal-body">
          <p>{{ errorMessage }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { FeatherIcon } from 'frappe-ui'

// Mock data - replace with actual props/API calls
const courseInfo = ref({
  name: 'CSBS-A',
  year: '1st year'
})

const sessionData = ref({
  start_time: '2025-04-04 09:00:00',
  end_time: '2025-04-04 10:30:00'
})

const isEditMode = ref(true)
const isSubmitting = ref(false)
const showConfirmModal = ref(false)
const showErrorModal = ref(false)
const errorTitle = ref('')
const errorMessage = ref('')

// Sample student data based on your API response
const students = ref([
  {
    student: "EDU-STU-2025-00002",
    student_name: "HARSHA VARDHAN JANUP",
    group_roll_number: 1,
    status: "Present"
  },
  {
    student: "EDU-STU-2025-00003", 
    student_name: "VARUN VARMA",
    status: "Absent",
    group_roll_number: 2
  },
  {
    student: "EDU-STU-2025-00004",
    student_name: "ARUN KUMAR REDDY",
    group_roll_number: 3
  },
  {
    student: "EDU-STU-2025-00005",
    student_name: "PRIYA SHARMA",
    group_roll_number: 4
  },
  {
    student: "EDU-STU-2025-00006",
    student_name: "RAJESH KUMAR",
    group_roll_number: 5
  }
])

// Computed properties
const presentCount = computed(() => students.value.filter(s => s.checked).length)
const absentCount = computed(() => students.value.filter(s => !s.checked).length)

// Attendance status checks
const studentsWithStatus = computed(() => students.value.filter(s => s.status))
const studentsWithoutStatus = computed(() => students.value.filter(s => !s.status))
const allStudentsHaveStatus = computed(() => studentsWithStatus.value.length === students.value.length)
const someStudentsHaveStatus = computed(() => studentsWithStatus.value.length > 0 && studentsWithoutStatus.value.length > 0)
const noStudentsHaveStatus = computed(() => studentsWithStatus.value.length === 0)

// Submit button state
const isSubmitDisabled = computed(() => allStudentsHaveStatus.value || isSubmitting.value)

// Helper function to check if student is disabled
const isStudentDisabled = (student) => {
  return !!student.status
}

// Methods
const formatSessionTime = (startTime, endTime) => {
  const start = new Date(startTime)
  const end = new Date(endTime)
  
  const formatOptions = {
    day: '2-digit',
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  
  const startFormatted = start.toLocaleDateString('en-GB', formatOptions)
  const endFormatted = end.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  
  return `${startFormatted} - ${endFormatted}`
}

const toggleStudentAttendance = (student) => {
  if (!isStudentDisabled(student)) {
    student.checked = !student.checked
  }
}

const markAllAsPresent = () => {
  students.value.forEach(student => {
    if (!isStudentDisabled(student)) {
      student.checked = true
    }
  })
}

const markAllAsAbsent = () => {
  students.value.forEach(student => {
    if (!isStudentDisabled(student)) {
      student.checked = false
    }
  })
}

const resetAttendance = () => {
  students.value.forEach(student => {
    if (!isStudentDisabled(student)) {
      student.checked = false // Reset to unchecked by default
    }
  })
}

const submitAttendance = () => {
  showConfirmModal.value = true
}

const closeConfirmModal = () => {
  showConfirmModal.value = false
}

const confirmSubmit = async () => {
  showConfirmModal.value = false
  isSubmitting.value = true
  
  try {
    // Prepare data for submission
    const studentsPresent = students.value.filter(s => s.checked)
    const studentsAbsent = students.value.filter(s => !s.checked)
    
    const payload = {
      students_present: JSON.stringify(studentsPresent),
      students_absent: JSON.stringify(studentsAbsent),
      student_group: '', // Add actual student group
      course_schedule: 'EDU-CSH-2025-00313' // Add actual course schedule ID
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simulate error for demonstration
    if (Math.random() > 0.7) {
      throw new Error('Duplicate Entry')
    }
    
    console.log('Attendance submitted successfully:', payload)
    
  } catch (error) {
    console.error('Error submitting attendance:', error)
    
    if (error.message === 'Duplicate Entry') {
      errorTitle.value = 'Duplicate Entry'
      errorMessage.value = 'Student Attendance record EDU-ATT-2025-00005 already exists against the Student EDU-STU-2025-00002'
    } else {
      errorTitle.value = 'Error'
      errorMessage.value = 'Failed to submit attendance. Please try again.'
    }
    
    showErrorModal.value = true
  } finally {
    isSubmitting.value = false
  }
}

const closeErrorModal = () => {
  showErrorModal.value = false
}

// Initialize component
onMounted(() => {
  // Process student data from API
  students.value.forEach(student => {
    if (student.status) {
      // Student has existing attendance record - set checked state based on status
      student.checked = student.status === 'Present'
    } else {
      // Student doesn't have attendance record - default to unchecked (absent)
      student.checked = false
    }
  })
})
</script>

<style scoped>
.attendance-page {
  max-width: 100%;
  margin: 0 auto;
  padding: 0 0 2rem 0;
  background: #f8fafc;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  gap: 1rem;
}

.back-button {
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
}

.back-button:hover {
  background: #f3f4f6;
}

.header-info {
  flex: 1;
}

.course-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.course-details {
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
}

.alert-message {
  display: flex;
  gap: 0.75rem;
  margin: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  border-left: 4px solid;
}

.alert-message.edit {
  background: #dbeafe;
  border-left-color: #3b82f6;
}

.alert-message.completed {
  background: #d1fae5;
  border-left-color: #10b981;
}

.alert-message.partial {
  background: #fef3c7;
  border-left-color: #f59e0b;
}

.alert-text {
  margin: 0;
  font-size: 0.9rem;
}

.alert-message.edit .alert-text {
  color: #1e40af;
}

.alert-message.completed .alert-text {
  color: #065f46;
}

.alert-message.partial .alert-text {
  color: #92400e;
}

.session-info {
  padding: 1rem;
  margin: 0 1rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.session-title {
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.session-time {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.actions-section {
  padding: 1rem;
}

.instructions {
  color: #6b7280;
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
}

.bulk-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-button {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.mark-present {
  background: #10b981;
  color: white;
}

.mark-present:hover {
  background: #059669;
}

.mark-absent {
  background: #ef4444;
  color: white;
}

.mark-absent:hover {
  background: #dc2626;
}

.reset {
  background: #f59e0b;
  color: white;
}

.reset:hover {
  background: #d97706;
}

.students-list {
  margin: 0 1rem;
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.student-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s;
}

.student-row:hover {
  background: #f9fafb;
}

.student-row:last-child {
  border-bottom: none;
}

.student-row.absent {
  background: #fef2f2;
}

.student-row.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.student-row.disabled:hover {
  background: inherit;
}

.student-row.status-present {
  background: #f0fdf4;
  border-left: 4px solid #10b981;
}

.student-row.status-absent {
  background: #fef2f2;
  border-left: 4px solid #ef4444;
}

.status-indicator {
  color: #059669;
  font-size: 0.75rem;
  font-weight: 500;
  background: #d1fae5;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  margin-top: 0.25rem;
  display: inline-block;
}

.status-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.status-badge.present {
  background: #10b981;
}

.status-badge.absent {
  background: #ef4444;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.checkbox-container {
  position: relative;
}

.student-checkbox {
  opacity: 0;
  position: absolute;
  width: 20px;
  height: 20px;
}

.custom-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: white;
}

.custom-checkbox.checked {
  background: #10b981;
  border-color: #10b981;
}

.student-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.student-name {
  font-weight: 500;
  color: #1f2937;
  font-size: 0.95rem;
}

.roll-number {
  color: #6b7280;
  font-size: 0.8rem;
}

.absent-badge {
  background: #ef4444;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.submit-section {
  padding: 1rem;
  position: sticky;
  bottom: 0;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
}

.submit-button {
  width: 100%;
  padding: 1rem;
  background: #1f2937;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover:not(:disabled) {
  background: #111827;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
}

.modal-content.error {
  border-top: 4px solid #ef4444;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1rem 0.5rem 1rem;
  gap: 0.5rem;
}

.modal-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  flex: 1;
}

.error-icon {
  display: flex;
  align-items: center;
}

.close-button {
  padding: 0.25rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.25rem;
  color: #6b7280;
}

.close-button:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 0.5rem 1rem 1rem 1rem;
}

.modal-body p {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 0.9rem;
}

.modal-body p:last-child {
  margin-bottom: 0;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0 1rem 1rem 1rem;
  justify-content: flex-end;
}

.modal-button {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-button.secondary {
  background: #f3f4f6;
  color: #374151;
}

.modal-button.secondary:hover {
  background: #e5e7eb;
}

.modal-button.primary {
  background: #3b82f6;
  color: white;
}

.modal-button.primary:hover {
  background: #2563eb;
}
</style>