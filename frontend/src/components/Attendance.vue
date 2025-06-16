<template>
  <div class="attendance-page">
    <!-- Header -->
    <div class="header">
      <button @click="$router.go(-1)" class="back-button">
        <FeatherIcon name="arrow-left" class="w-5 h-5" />
      </button>
      <div class="header-info">
        <h1 class="course-title">{{ courseInfo.name }}</h1>
        <p class="course-details">{{ courseInfo.time }}</p>
        <p class="course-room">{{ courseInfo.room }}</p>
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

    <!-- Instructions and Actions -->
    <div class="actions-section">
      <div class="bulk-actions">
        <button 
          @click="markAllAsPresent" 
          class="action-button mark-present"
          :disabled="allStudentsHaveStatus || studentsWithoutStatus.length === 0">
          Mark all as present
        </button>
        <button 
          @click="markAllAsAbsent" 
          class="action-button mark-absent"
          :disabled="allStudentsHaveStatus || studentsWithoutStatus.length === 0">
          Mark all as absent
        </button>
        <!-- <button @click="resetAttendance" class="action-button reset">
          Reset
        </button> -->
      </div>
    </div>

    <!-- Students List -->
    <div class="students-list">
      <div 
        v-for="student in students" 
        :key="student.student"
        class="student-row"
        :class="{ 
          'absent': student.checked === false, 
          'disabled': isStudentDisabled(student),
          'status-present': student.status === 'Present',
          'status-absent': student.status === 'Absent'
        }"
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
            <div class="custom-checkbox" :class="{ 
              'checked': student.checked === true, 
              'unchecked': student.checked === false,
              'unmarked': student.checked === null 
            }">
              <FeatherIcon v-if="student.checked === true" name="check" class="w-4 h-4 text-white" />
              <FeatherIcon v-else-if="student.checked === false" name="x" class="w-4 h-4 text-white" />
            </div>
          </div>
          
          <div class="student-details">
            <span class="student-name">{{ student.student_name }}</span>
            <span class="roll-number">{{ student.student }}</span>
          </div>
        </div>
        
        <div v-if="student.checked === false && !isStudentDisabled(student)" class="absent-badge">
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
        <span v-else-if="unmarkedCount > 0">Please mark all students ({{ unmarkedCount }} unmarked)</span>
        <span v-else>Submit Attendance</span>
      </button>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="closeConfirmModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Confirm Attendance Submission</h3>
          <button @click="closeConfirmModal" class="close-button">
            <FeatherIcon name="x" class="w-5 h-5" />
          </button>
        </div>
        <div class="modal-body">
          <p>Do you want to submit attendance for the remaining students?</p>
          
          <!-- Current Submission -->
          <div class="submission-section">
            <h4 class="section-title">Students being submitted:</h4>
            <p><strong>Present:</strong> {{ editablePresentCount }}</p>
            <p><strong>Absent:</strong> {{ editableAbsentCount }}</p>
            <p v-if="editableUnmarkedCount > 0"><strong>Unmarked:</strong> {{ editableUnmarkedCount }}</p>
          </div>
          
          <!-- Already Submitted (if any) -->
          <div v-if="studentsWithStatus.length > 0" class="already-submitted-section">
            <h4 class="section-title">Already submitted:</h4>
            <p><strong>Present:</strong> {{ alreadyPresentCount }}</p>
            <p><strong>Absent:</strong> {{ alreadyAbsentCount }}</p>
          </div>
          
          <!-- Total Summary -->
          <div class="total-section">
            <h4 class="section-title">Total class attendance:</h4>
            <p><strong>Total Present:</strong> {{ totalPresentCount }}</p>
            <p><strong>Total Absent:</strong> {{ totalAbsentCount }}</p>
            <p><strong>Total Students:</strong> {{ students.length }}</p>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeConfirmModal" class="modal-button secondary">Cancel</button>
          <button @click="confirmSubmit" class="modal-button primary">Submit Attendance</button>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
      <div class="modal-content success" @click.stop>
        <div class="modal-header">
          <div class="success-icon">
            <FeatherIcon name="check-circle" class="w-5 h-5 text-green-600" />
          </div>
          <h3>{{ successTitle }}</h3>
          <button @click="closeSuccessModal" class="close-button">
            <FeatherIcon name="x" class="w-5 h-5" />
          </button>
        </div>
        <div class="modal-body">
          <p>{{ successMessage }}</p>
        </div>
        <div class="modal-actions">
          <button @click="closeSuccessModal" class="modal-button primary">OK</button>
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
import { ref, computed, onMounted, watch } from 'vue'
import { FeatherIcon } from 'frappe-ui'

// Props from parent component
const props = defineProps({
  students: {
    type: Array,
    default: () => []
  },
  courseInfo: {
    type: Object,
    required: true
  }
})

// Define emit for parent communication
const emit = defineEmits(['refresh-data'])

// Local reactive copy of students for manipulation
const students = ref([...props.students])

// Watch for changes in props.students
watch(() => props.students, (newStudents) => {
  students.value = [...newStudents]
  // Process student data
  students.value.forEach(student => {
    if (student.status) {
      student.checked = student.status === 'Present'
    } else {
      student.checked = true  // Not marked yet
    }
  })
}, { immediate: true })

const isEditMode = ref(false)
const isSubmitting = ref(false)
const showConfirmModal = ref(false)
const showSuccessModal = ref(false)
const showErrorModal = ref(false)
const successTitle = ref('')
const successMessage = ref('')
const errorTitle = ref('')
const errorMessage = ref('')

// Computed properties
// Updated computed properties for modal
const editableStudents = computed(() => students.value.filter(s => !s.status))
const editablePresentCount = computed(() => editableStudents.value.filter(s => s.checked === true).length)
const editableAbsentCount = computed(() => editableStudents.value.filter(s => s.checked === false).length)
const editableUnmarkedCount = computed(() => editableStudents.value.filter(s => s.checked === null).length)

// Already submitted students
const alreadyPresentCount = computed(() => studentsWithStatus.value.filter(s => s.status === 'Present').length)
const alreadyAbsentCount = computed(() => studentsWithStatus.value.filter(s => s.status === 'Absent').length)

// Total counts (current submission + already submitted)
const totalPresentCount = computed(() => editablePresentCount.value + alreadyPresentCount.value)
const totalAbsentCount = computed(() => editableAbsentCount.value + alreadyAbsentCount.value)

// Update the existing computed properties to only consider editable students
const presentCount = computed(() => editablePresentCount.value)
const absentCount = computed(() => editableAbsentCount.value)
const unmarkedCount = computed(() => editableUnmarkedCount.value)

// Attendance status checks
const studentsWithStatus = computed(() => students.value.filter(s => s.status))
const studentsWithoutStatus = computed(() => students.value.filter(s => !s.status))
const allStudentsHaveStatus = computed(() => studentsWithStatus.value.length === students.value.length && students.value.length > 0)
const someStudentsHaveStatus = computed(() => studentsWithStatus.value.length > 0 && studentsWithoutStatus.value.length > 0)

// Submit button state - disable if there are unmarked students or all have status
const isSubmitDisabled = computed(() => 
  allStudentsHaveStatus.value || 
  isSubmitting.value || 
  unmarkedCount.value > 0
)

// Helper function to check if student is disabled
const isStudentDisabled = (student) => {
  return !!student.status
}

// Methods
const toggleStudentAttendance = (student) => {
  if (!isStudentDisabled(student)) {
    if (student.checked === null) {
      student.checked = true  // null → present
    } else if (student.checked === true) {
      student.checked = false // present → absent
    } else {
      student.checked = null  // absent → null
    }
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
      student.checked = null  // Reset to unmarked
    }
  })
}

const submitAttendance = () => {
  // Check if all students are marked
  if (unmarkedCount.value > 0) {
    return // Don't show modal if there are unmarked students
  }
  showConfirmModal.value = true
}

const closeConfirmModal = () => {
  showConfirmModal.value = false
}

const closeSuccessModal = () => {
  showSuccessModal.value = false
  // Emit event to parent to refresh data
  emit('refresh-data')
}

const closeErrorModal = () => {
  showErrorModal.value = false
}

const confirmSubmit = async () => {
  showConfirmModal.value = false
  isSubmitting.value = true
  
  try {
    // Filter out students who already have status (exclude from submission)
    const editableStudents = students.value.filter(s => !s.status)
    
    // Prepare data for submission - only include students without existing status
    const studentsPresent = editableStudents.filter(s => s.checked === true)
    const studentsAbsent = editableStudents.filter(s => s.checked === false)
    
    // Prepare form data in the required format
    const formData = new FormData()
    
    // Add students_present as JSON string
    formData.append('students_present', JSON.stringify(studentsPresent.map(student => ({
      student: student.student,
      student_name: student.student_name,
      group_roll_number: student.group_roll_number,
      disabled: false,
      checked: true
    }))))
    
    // Add students_absent as JSON string  
    formData.append('students_absent', JSON.stringify(studentsAbsent.map(student => ({
      student: student.student,
      student_name: student.student_name,
      group_roll_number: student.group_roll_number,
      disabled: false,
      checked: false
    }))))
    
    // Add other required fields
    formData.append('student_group', props.courseInfo.studentGroup || '')
    formData.append('course_schedule', props.courseInfo.scheduleId)
    
    console.log('Submitting attendance:', {
      students_present: studentsPresent.length,
      students_absent: studentsAbsent.length,
      students_excluded: students.value.filter(s => s.status).length,
      course_schedule: props.courseInfo.scheduleId,
      student_group: props.courseInfo.studentGroup
    })
    
    // Call the API
    const response = await fetch('/api/method/education.education.api.mark_attendance', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to submit attendance')
    }
    
    const result = await response.json()
    console.log('Attendance submitted successfully:', result)
    
    // Parse server messages if present
    if (result._server_messages) {
      try {
        const serverMessages = JSON.parse(result._server_messages)
        if (serverMessages.length > 0) {
          const message = JSON.parse(serverMessages[0])
          successTitle.value = message.title || 'Success'
          successMessage.value = message.message || 'Attendance has been marked successfully.'
        } else {
          successTitle.value = 'Success'
          successMessage.value = 'Attendance has been marked successfully.'
        }
      } catch (parseError) {
        console.warn('Could not parse server messages:', parseError)
        successTitle.value = 'Success'
        successMessage.value = 'Attendance has been marked successfully.'
      }
    } else {
      successTitle.value = 'Success'
      successMessage.value = 'Attendance has been marked successfully.'
    }
    
    // Clear auto-save data on successful submission
    localStorage.removeItem('attendance_draft')
    
    // Show success modal
    showSuccessModal.value = true
    
  } catch (error) {
    console.error('Error submitting attendance:', error)
    
    if (error.message.includes('Duplicate') || error.message.includes('already exists')) {
      errorTitle.value = 'Duplicate Entry'
      errorMessage.value = 'Attendance record already exists for some students in this session.'
    } else {
      errorTitle.value = 'Error'
      errorMessage.value = error.message || 'Failed to submit attendance. Please try again.'
    }
    
    showErrorModal.value = true
  } finally {
    isSubmitting.value = false
  }
}

// Optional: Auto-save functionality
const autoSave = () => {
  // Save current state to localStorage or similar
  const attendanceState = {
    courseScheduleId: props.courseInfo.scheduleId,
    students: students.value.map(s => ({
      student: s.student,
      checked: s.checked
    }))
  }
  localStorage.setItem('attendance_draft', JSON.stringify(attendanceState))
}

// Optional: Load auto-saved data
const loadAutoSave = () => {
  try {
    const saved = localStorage.getItem('attendance_draft')
    if (saved) {
      const data = JSON.parse(saved)
      if (data.courseScheduleId === props.courseInfo.scheduleId) {
        // Restore saved state for this course
        data.students.forEach(savedStudent => {
          const student = students.value.find(s => s.student === savedStudent.student)
          if (student && !student.status) {
            student.checked = savedStudent.checked
          }
        })
      }
    }
  } catch (error) {
    console.error('Error loading auto-save:', error)
  }
}

// Watch for changes and auto-save
watch(students, autoSave, { deep: true })

onMounted(() => {
  loadAutoSave()
})
</script>

<style scoped>
/* Include all the existing styles from the previous attendance component */
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
  padding: 0.5rem 1rem;
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

.course-room {
  color: #6b7280;
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
}

.alert-message {
  display: flex;
  gap: 0.75rem;
  margin: 1rem 1rem 0 1rem;
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
  margin: 0 0 0.25rem 0;
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
  flex-wrap: nowrap;
  justify-content: space-between;
}

.action-button {
  padding: 0.35rem 0.5rem;
  border-radius: 0.35rem; 
  border: none;
  width: 100%;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mark-present {
  background: #10b981;
  color: white;
}

.mark-present:hover:not(:disabled) {
  background: #059669;
}

.mark-absent {
  background: #ef4444;
  color: white;
}

.mark-absent:hover:not(:disabled) {
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

.custom-checkbox.unchecked {
  background: #ef4444;
  border-color: #ef4444;
}

.custom-checkbox.unmarked {
  background: #f3f4f6;
  border-color: #d1d5db;
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

.modal-content.success {
  border-top: 4px solid #10b981;
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

.success-icon {
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

.submission-section,
.already-submitted-section,
.total-section {
  margin: 1rem 0;
  padding: 0.75rem;
  border-radius: 0.5rem;
}

.submission-section {
  background: #f0f9ff;
  border-left: 3px solid #3b82f6;
}

.already-submitted-section {
  background: #f0fdf4;
  border-left: 3px solid #10b981;
}

.total-section {
  background: #f8fafc;
  border-left: 3px solid #64748b;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.submission-section .section-title {
  color: #1d4ed8;
}

.already-submitted-section .section-title {
  color: #059669;
}

.total-section .section-title {
  color: #475569;
}

.modal-body p {
  margin: 0.25rem 0;
}
</style>