<template>
  <div class="attendance-page">
    <!-- Header -->
    <div class="header">
      <button @click="$router.go(-1)" class="back-button">
        <FeatherIcon name="arrow-left" class="w-5 h-5" />
      </button>
      <div class="header-info">
        <h1 class="course-title">{{ courseInfo.name }}</h1>
        <p class="course-details">{{ courseInfo.date }} -> {{ courseInfo.time }}</p>
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
      <!-- Course Topics Selection -->
      <div class="topics-section">
        <div class="topics-header">
          <label class="topics-label">
            Select Course Topics <span class="required-asterisk">*</span>
          </label>
          <div class="course-completion-checkbox">
            <input 
              type="checkbox" 
              id="course-completed"
              v-model="isCourseCompleted"
              class="completion-checkbox"
            />
            <label for="course-completed" class="completion-label">
              <span class="checkbox-icon">
                <FeatherIcon v-if="isCourseCompleted" name="check" class="w-3 h-3 text-white" />
              </span>
              Course Completed
            </label>
          </div>
        </div>
        <div class="topics-dropdown">
          <div 
            @click="toggleTopicsDropdown" 
            class="topics-selector"
            :class="{ 'open': showTopicsDropdown, 'error': topicsError }"
          >
            <div class="selected-topics">
              <span v-if="selectedTopics.length === 0" class="placeholder">
                Select topics covered in this class...
              </span>
              <div v-else class="topics-display">
                <span 
                  v-for="topic in selectedTopics" 
                  :key="topic.id"
                  class="topic-tag"
                >
                  {{ topic.name }}
                  <button 
                    @click.stop="removeSelectedTopic(topic)"
                    class="remove-topic"
                  >
                    <FeatherIcon name="x" class="w-3 h-3" />
                  </button>
                </span>
              </div>
            </div>
            <FeatherIcon 
              name="chevron-down" 
              class="dropdown-icon"
              :class="{ 'rotated': showTopicsDropdown }"
            />
          </div>
          
          <div v-if="showTopicsDropdown" class="topics-dropdown-menu">
            <div class="dropdown-search">
              <FeatherIcon name="search" class="search-icon-small" />
              <input 
                type="text" 
                v-model="topicsSearchQuery"
                placeholder="Search topics..."
                class="dropdown-search-input"
                @click.stop
              />
            </div>
            <div class="topics-list">
              <div 
                v-for="topic in filteredTopics" 
                :key="topic.id"
                class="topic-option"
                :class="{ 'selected': isTopicSelected(topic) }"
                @click="toggleTopicSelection(topic)"
              >
                <div class="topic-checkbox">
                  <FeatherIcon 
                    v-if="isTopicSelected(topic)" 
                    name="check" 
                    class="w-4 h-4 text-white" 
                  />
                </div>
                <span class="topic-name">{{ topic.name }}</span>
              </div>
              <div v-if="filteredTopics.length === 0" class="no-topics">
                No topics found
              </div>
            </div>
          </div>
        </div>
        <div v-if="topicsError" class="error-message">
          Please select at least one course topic before submitting attendance.
        </div>
      </div>

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
      </div>
      
      <!-- Search Box -->
      <div class="search-section">
        <div class="search-container">
          <FeatherIcon name="search" class="search-icon" />
          <input 
            type="text" 
            v-model="searchQuery"
            placeholder="Search by student name or roll number..."
            class="search-input"
          />
          <button 
            v-if="searchQuery" 
            @click="clearSearch" 
            class="clear-search-button"
          >
            <FeatherIcon name="x" class="w-4 h-4" />
          </button>
        </div>
        <div v-if="searchQuery && filteredStudents.length === 0" class="no-results">
          No students found matching "{{ searchQuery }}"
        </div>
        <div v-if="searchQuery && filteredStudents.length > 0" class="search-results-info">
          Showing {{ filteredStudents.length }} of {{ students.length }} students
        </div>
      </div>
    </div>

    <!-- Students List -->
    <div class="students-list">
      <div 
        v-for="student in filteredStudents" 
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
            <span class="roll-number">{{ student.custom_student_id || student.student || 'N/A' }}</span> 
          </div>
        </div>
        
        <!-- Student Percentage Display -->
        <div class="student-percentage" 
             v-if="student.attendance_percentage !== undefined"
             :class="getPercentageClass(student.attendance_percentage)">
          {{ student.attendance_percentage.toFixed(1) }}%
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
        <span v-else-if="selectedTopics.length === 0">Please select course topics</span>
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
          
          <!-- Selected Topics -->
          <div class="submission-section">
            <h4 class="section-title">Selected Course Topics:</h4>
            <div class="selected-topics-list">
              <span 
                v-for="topic in selectedTopics" 
                :key="topic.id"
                class="topic-pill"
              >
                {{ topic.name }}
              </span>
            </div>
            <div class="course-completion-status" v-if="isCourseCompleted">
              <FeatherIcon name="check-circle" class="w-4 h-4 text-green-600" />
              <span class="completion-text">Course marked as completed</span>
            </div>
          </div>
          
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { FeatherIcon } from 'frappe-ui'
import { createResource } from 'frappe-ui'

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

// Search functionality
const searchQuery = ref('')

// Topics functionality
const showTopicsDropdown = ref(false)
const selectedTopics = ref([])
const topicsSearchQuery = ref('')
const topicsError = ref(false)
const isCourseCompleted = ref(false)

// Mock Course Topics Data
const mockTopics = ref([
  { id: 1, name: "Introduction to Machine Learning" },
  { id: 2, name: "Supervised Learning Algorithms" },
  { id: 3, name: "Neural Networks and Deep Learning" },
  { id: 4, name: "Unsupervised Learning Techniques" },
  { id: 5, name: "Natural Language Processing" },
  { id: 6, name: "Computer Vision Fundamentals" },
  { id: 7, name: "Reinforcement Learning" },
  { id: 8, name: "Data Preprocessing and Feature Engineering" },
  { id: 9, name: "Model Evaluation and Validation" },
  { id: 10, name: "Ethics in AI and Machine Learning" },
  { id: 11, name: "Transfer Learning" },
  { id: 12, name: "Ensemble Methods" },
  { id: 13, name: "Time Series Analysis" },
  { id: 14, name: "Clustering Algorithms" },
  { id: 15, name: "Dimensionality Reduction" }
])

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
// Filtered students based on search query
const filteredStudents = computed(() => {
  if (!searchQuery.value.trim()) {
    return students.value
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  
  return students.value.filter(student => {
    const studentName = (student.student_name || '').toLowerCase()
    const rollNumber = (student.custom_student_id || student.student || '').toLowerCase()
    
    return studentName.includes(query) || rollNumber.includes(query)
  })
})

// Filtered topics based on search query
const filteredTopics = computed(() => {
  if (!topicsSearchQuery.value.trim()) {
    return mockTopics.value
  }
  
  const query = topicsSearchQuery.value.toLowerCase().trim()
  
  return mockTopics.value.filter(topic => 
    topic.name.toLowerCase().includes(query)
  )
})

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

// Submit button state - disable if there are unmarked students, all have status, or no topics selected
const isSubmitDisabled = computed(() => 
  allStudentsHaveStatus.value || 
  isSubmitting.value || 
  unmarkedCount.value > 0 ||
  selectedTopics.value.length === 0
)

// Helper function to check if student is disabled
const isStudentDisabled = (student) => {
  return !!student.status
}

// Helper function to get percentage color class
const getPercentageClass = (percentage) => {
  if (percentage >= 85) return 'percentage-good'
  if (percentage >= 75) return 'percentage-average'
  return 'percentage-poor'
}

// Search methods
const clearSearch = () => {
  searchQuery.value = ''
}

// Topics methods
const toggleTopicsDropdown = () => {
  showTopicsDropdown.value = !showTopicsDropdown.value
  if (showTopicsDropdown.value) {
    topicsSearchQuery.value = ''
    topicsError.value = false
  }
}

const isTopicSelected = (topic) => {
  return selectedTopics.value.some(selected => selected.id === topic.id)
}

const toggleTopicSelection = (topic) => {
  const index = selectedTopics.value.findIndex(selected => selected.id === topic.id)
  if (index > -1) {
    selectedTopics.value.splice(index, 1)
  } else {
    selectedTopics.value.push(topic)
  }
  topicsError.value = false
}

const removeSelectedTopic = (topic) => {
  const index = selectedTopics.value.findIndex(selected => selected.id === topic.id)
  if (index > -1) {
    selectedTopics.value.splice(index, 1)
  }
}

// Close dropdown when clicking outside
const closeTopicsDropdown = (event) => {
  if (!event.target.closest('.topics-dropdown')) {
    showTopicsDropdown.value = false
  }
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
  // Check if topics are selected
  if (selectedTopics.value.length === 0) {
    topicsError.value = true
    return
  }
  
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

const submitAttendanceResource = createResource({
  url: 'srkr_frappe_app_api.instructor.api.mark_attendances',
  method: 'POST',
  onSuccess: (result) => {
    console.log('API response received:', result)
    console.log('Resource data:', submitAttendanceResource.data)
    
    // Use the resource data if result is undefined
    const responseData = result || submitAttendanceResource.data
    console.log('Using response data:', responseData)
    
    // Check if there's an exception in the response (Frappe error handling)
    if (responseData && (responseData.exception || responseData.exc_type)) {
      console.error('API returned an exception:', responseData.exception)
      
      // Parse server messages for error details
      if (responseData._server_messages) {
        try {
          const serverMessages = JSON.parse(responseData._server_messages)
          if (serverMessages.length > 0) {
            const message = JSON.parse(serverMessages[0])
            console.log('Parsed error message:', message)
            
            if (message.title === 'Duplicate Entry' || responseData.exception?.includes('already exists')) {
              errorTitle.value = 'Duplicate Entry'
              errorMessage.value = message.message?.replace(/<[^>]*>/g, '') || 'Attendance record already exists for some students in this session.'
            } else {
              errorTitle.value = message.title || 'Error'
              errorMessage.value = message.message?.replace(/<[^>]*>/g, '') || 'An error occurred while submitting attendance.'
            }
          }
        } catch (parseError) {
          console.warn('Could not parse error server messages:', parseError)
          errorTitle.value = 'Error'
          errorMessage.value = responseData.exception || 'An error occurred while submitting attendance.'
        }
      } else {
        errorTitle.value = 'Error'
        errorMessage.value = responseData.exception || 'An error occurred while submitting attendance.'
      }
      
      showErrorModal.value = true
      isSubmitting.value = false
      return
    }
    
    // Success case - no exception present
    console.log('Attendance submitted successfully')
    
    // Parse server messages if present - check both result and responseData
    const serverMessages = responseData?._server_messages || result?._server_messages
    if (serverMessages) {
      try {
        // Parse the outer JSON string first
        const parsedMessages = JSON.parse(serverMessages)
        console.log('Parsed server messages:', parsedMessages)
        
        if (parsedMessages.length > 0) {
          // Parse the inner JSON string
          const message = JSON.parse(parsedMessages[0])
          console.log('Parsed message:', message)
          
          successTitle.value = message.title || 'Success'
          successMessage.value = message.message || 'Attendance has been marked successfully.'
        } else {
          successTitle.value = 'Success'
          successMessage.value = 'Attendance has been marked successfully.'
        }
      } catch (parseError) {
        console.warn('Could not parse server messages:', parseError)
        console.warn('Raw _server_messages:', serverMessages)
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
    isSubmitting.value = false
  },
  onError: (error) => {
    console.error('Network/Resource error submitting attendance:', error)
    console.error('Error details:', error)
    
    if (error.message?.includes('Duplicate') || error.message?.includes('already exists')) {
      errorTitle.value = 'Duplicate Entry'
      errorMessage.value = 'Attendance record already exists for some students in this session.'
    } else {
      errorTitle.value = 'Error'
      errorMessage.value = error.message || 'Failed to submit attendance. Please try again.'
    }
    
    showErrorModal.value = true
    isSubmitting.value = false
  }
})

// Update your confirmSubmit method
const confirmSubmit = () => {
  showConfirmModal.value = false
  isSubmitting.value = true
  
  // Filter out students who already have status (exclude from submission)
  const editableStudents = students.value.filter(s => !s.status)
  
  // Prepare data for submission - only include students without existing status
  const studentsPresent = editableStudents.filter(s => s.checked === true)
  const studentsAbsent = editableStudents.filter(s => s.checked === false)
  
  // Prepare the data in the required format
  const requestData = {
    students_present: JSON.stringify(studentsPresent.map(student => ({
      student: student.student,
      student_name: student.student_name,
      group_roll_number: student.group_roll_number,
      disabled: false,
      checked: true
    }))),
    students_absent: JSON.stringify(studentsAbsent.map(student => ({
      student: student.student,
      student_name: student.student_name,
      group_roll_number: student.group_roll_number,
      disabled: false,
      checked: false
    }))),
    student_group: props.courseInfo.studentGroup || '',
    course_schedule: props.courseInfo.allScheduleId || props.courseInfo.scheduleId,
    topics: JSON.stringify(selectedTopics.value.map(topic => ({
      id: topic.id,
      name: topic.name
    }))),
    course_completed: isCourseCompleted.value
  }
  
  console.log('Submitting attendance with data:', requestData)
  
  // Submit using the resource
  submitAttendanceResource.submit(requestData)
}

// Optional: Auto-save functionality
const autoSave = () => {
  // Save current state to localStorage or similar
  const attendanceState = {
    courseScheduleId: props.courseInfo.scheduleId,
    students: students.value.map(s => ({
      student: s.student,
      checked: s.checked
    })),
    selectedTopics: selectedTopics.value,
    isCourseCompleted: isCourseCompleted.value
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
        
        // Restore selected topics and course completion status
        if (data.selectedTopics) {
          selectedTopics.value = data.selectedTopics
        }
        if (data.isCourseCompleted !== undefined) {
          isCourseCompleted.value = data.isCourseCompleted
        }
      }
    }
  } catch (error) {
    console.error('Error loading auto-save:', error)
  }
}

// Watch for changes and auto-save
watch([students, selectedTopics, isCourseCompleted], autoSave, { deep: true })

onMounted(() => {
  loadAutoSave()
  // Add event listener for closing topics dropdown when clicking outside
  document.addEventListener('click', closeTopicsDropdown)
})

// Clean up event listeners
onBeforeUnmount(() => {
  document.removeEventListener('click', closeTopicsDropdown)
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

.actions-section {
  padding: 1rem;
}

/* Topics Selection Styles */
.topics-section {
  margin-bottom: 1rem;
}

.topics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.topics-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.course-completion-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.completion-checkbox {
  opacity: 0;
  position: absolute;
  width: 16px;
  height: 16px;
}

.completion-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  color: #374151;
  font-weight: 500;
}

.checkbox-icon {
  width: 16px;
  height: 16px;
  border: 2px solid #d1d5db;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: white;
}

.completion-checkbox:checked + .completion-label .checkbox-icon {
  background: #10b981;
  border-color: #10b981;
}

.completion-label:hover .checkbox-icon {
  border-color: #9ca3af;
}

.required-asterisk {
  color: #ef4444;
  margin-left: 0.25rem;
}

.topics-dropdown {
  position: relative;
}

.topics-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 3rem;
}

.topics-selector:hover {
  border-color: #9ca3af;
}

.topics-selector.open {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.topics-selector.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.selected-topics {
  flex: 1;
  display: flex;
  align-items: center;
}

.placeholder {
  color: #9ca3af;
  font-size: 0.9rem;
}

.topics-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: 100%;
}

.topic-tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.remove-topic {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.125rem;
  border-radius: 0.125rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.remove-topic:hover {
  background: rgba(255, 255, 255, 0.2);
}

.dropdown-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #6b7280;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.topics-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 50;
  max-height: 300px;
  overflow: hidden;
  margin-top: 0.25rem;
}

.dropdown-search {
  position: relative;
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.search-icon-small {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 0.875rem;
  height: 0.875rem;
  color: #9ca3af;
}

.dropdown-search-input {
  width: 100%;
  padding: 0.5rem 0.5rem 0.5rem 2rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
}

.dropdown-search-input:focus {
  border-color: #3b82f6;
}

.topics-list {
  max-height: 200px;
  overflow-y: auto;
}

.topic-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f3f4f6;
}

.topic-option:hover {
  background: #f9fafb;
}

.topic-option:last-child {
  border-bottom: none;
}

.topic-option.selected {
  background: #eff6ff;
}

.topic-checkbox {
  width: 1rem;
  height: 1rem;
  border: 2px solid #d1d5db;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.topic-option.selected .topic-checkbox {
  background: #3b82f6;
  border-color: #3b82f6;
}

.topic-name {
  font-size: 0.9rem;
  color: #374151;
  flex: 1;
}

.no-topics {
  padding: 1rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
}

.error-message {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  color: #dc2626;
  font-size: 0.875rem;
}

.bulk-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: nowrap;
  justify-content: space-between;
  margin-bottom: 1rem;
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

/* Search Section Styles */
.search-section {
  margin-top: 0;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  color: #9ca3af;
  width: 1rem;
  height: 1rem;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input::placeholder {
  color: #9ca3af;
}

.clear-search-button {
  position: absolute;
  right: 0.5rem;
  padding: 0.25rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.25rem;
  color: #6b7280;
  transition: background-color 0.2s;
}

.clear-search-button:hover {
  background: #f3f4f6;
}

.no-results {
  margin-top: 0.5rem;
  padding: 0.5rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
  background: #f9fafb;
  border-radius: 0.375rem;
}

.search-results-info {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #6b7280;
  text-align: center;
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

/* Student Percentage Display with Color Coding */
.student-percentage {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  margin-right: 0.5rem;
}

.percentage-good {
  background: #dcfce7;
  color: #166534;
}

.percentage-average {
  background: #fed7aa;
  color: #c2410c;
}

.percentage-poor {
  background: #fecaca;
  color: #dc2626;
}

.absent-badge {
  background: #ef4444;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
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

.selected-topics-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.topic-pill {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.course-completion-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #f0fdf4;
  border: 1px solid #d1fae5;
  border-radius: 0.375rem;
}

.completion-text {
  font-size: 0.85rem;
  color: #166534;
  font-weight: 500;
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
.total-section .section-title {
  color: #475569;
}

.modal-body p {
  margin: 0.25rem 0;
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