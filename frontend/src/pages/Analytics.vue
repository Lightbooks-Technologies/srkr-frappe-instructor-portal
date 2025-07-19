<template>
  <div class="analytics-page">
    <!-- Header -->
    <div class="header">
      <FeatherIcon name="pie-chart" class="w-5 h-5" />
      <div class="header-info">
        <h1 class="page-title">Student Analytics</h1>
        <p class="page-subtitle">Monitor student attendance performance</p>
      </div>
    </div>

    <!-- Batch Selector -->
    <div class="batch-selector-section">
      <div class="batch-selector-card">
        <div class="selector-header">
          <FeatherIcon name="users" class="w-5 h-5 text-gray-500" />
          <label for="batch-select" class="selector-label">Select Student Batch</label>
        </div>
        <div class="selector-wrapper">
          <div 
            @click="toggleDropdown" 
            class="custom-select"
            :class="{ 'dropdown-open': dropdownOpen }"
          >
            <span class="selected-text">
              {{ selectedBatchName || 'Choose a batch...' }}
            </span>
            <FeatherIcon name="chevron-down" class="select-icon" :class="{ 'rotated': dropdownOpen }" />
            
            <div v-if="dropdownOpen" class="dropdown-menu">
              <div 
                v-for="group in groups" 
                :key="group.id"
                @click.stop="selectBatch(group)"
                class="dropdown-item"
              >
                {{ group.name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading student data...</p>
    </div>

    <!-- Students Grid -->
    <div v-if="!loading && students.length > 0" class="students-section">
      <div class="students-header">
        <h2 class="students-title">Students ({{ students.length }})</h2>
        <div class="header-actions">
          <div class="filter-dropdown">
            <button @click="toggleFilterDropdown" class="filter-button">
              <FeatherIcon name="filter" class="w-4 h-4" />
              <span>{{ currentSortLabel }}</span>
              <FeatherIcon name="chevron-down" class="w-4 h-4" :class="{ 'rotated': filterDropdownOpen }" />
            </button>
            <div v-if="filterDropdownOpen" class="filter-menu">
              <div 
                v-for="option in sortOptions" 
                :key="option.value"
                @click="selectSort(option)"
                class="filter-item"
                :class="{ 'active': currentSort === option.value }"
              >
                {{ option.label }}
              </div>
            </div>
          </div>
          <p class="students-subtitle">
            Click on any student card to view detailed course-wise attendance
          </p>
        </div>
      </div>
      
      <div class="students-grid">
        <div
          v-for="student in sortedStudents"
          :key="student.student_id"
          @click="openStudentModal(student)"
          class="student-card"
        >
          <!-- Student Header -->
          <div class="student-header">
            <div class="student-info">
              <h3 class="student-name">{{ student.student_name }}</h3>
              <p class="student-roll">{{ student.roll_number }}</p>
            </div>
            <div class="status-badge" :class="getAttendanceStatusClass(student.overall_percentage)">
              {{ getAttendanceStatus(student.overall_percentage) }}
            </div>
          </div>

          <!-- Attendance Percentage -->
          <div class="attendance-section">
            <div class="attendance-header">
              <span class="attendance-label">Overall Attendance</span>
              <span class="attendance-percentage">
                {{ student.overall_percentage.toFixed(1) }}%
              </span>
            </div>
            
            <!-- Progress Bar -->
            <div class="progress-bar-container">
              <div
                class="progress-bar"
                :class="getProgressBarClass(student.overall_percentage)"
                :style="{ width: student.overall_percentage + '%' }"
              ></div>
            </div>
          </div>

          <!-- Statistics -->
          <div class="student-stats-single-row">
            <div class="stat-item">
              <FeatherIcon name="calendar" class="w-4 h-4 text-gray-400" />
              <div class="stat-content">
                <p class="stat-label">Classes Attended</p>
                <p class="stat-value">
                  {{ student.attended_classes }}/{{ student.total_classes }}
                </p>
              </div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <FeatherIcon name="book-open" class="w-4 h-4 text-gray-400" />
              <div class="stat-content">
                <p class="stat-label">Courses</p>
                <p class="stat-value">{{ student.courses.length }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && selectedBatch && students.length === 0" class="empty-state">
      <FeatherIcon name="users" class="w-12 h-12 text-gray-400" />
      <p class="empty-text">No students found for the selected batch.</p>
    </div>

    <!-- Initial State -->
    <div v-if="!loading && !selectedBatch" class="empty-state">
      <FeatherIcon name="trending-up" class="w-12 h-12 text-gray-400" />
      <p class="empty-text">Select a batch to view student analytics.</p>
    </div>

    <!-- Student Detail Modal -->
    <div v-if="showModal && selectedStudent" class="modal-overlay" @click="closeModal">
      <div class="modal-content student-detail-modal" @click.stop>
        <!-- Modal Header -->
        <div class="modal-header student-modal-header">
          <div class="modal-student-info">
            <h3 class="modal-student-name">{{ selectedStudent.student_name }}</h3>
            <p class="modal-student-roll">{{ selectedStudent.roll_number }}</p>
          </div>
          <button @click="closeModal" class="close-button">
            <FeatherIcon name="x" class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body student-modal-body">
          <!-- Overall Stats -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-card-content">
                <div class="stat-icon">
                  <FeatherIcon name="trending-up" class="w-5 h-5" />
                </div>
                <div class="stat-details">
                  <p class="stat-card-label">Overall Attendance</p>
                  <p class="stat-card-value">
                    {{ selectedStudent.overall_percentage.toFixed(1) }}%
                  </p>
                </div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-card-content">
                <div class="stat-icon">
                  <FeatherIcon name="calendar" class="w-5 h-5" />
                </div>
                <div class="stat-details">
                  <p class="stat-card-label">Classes Attended</p>
                  <p class="stat-card-value">
                    {{ selectedStudent.attended_classes }}/{{ selectedStudent.total_classes }}
                  </p>
                </div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-card-content">
                <div class="stat-icon">
                  <FeatherIcon name="book-open" class="w-5 h-5" />
                </div>
                <div class="stat-details">
                  <p class="stat-card-label">Active Courses</p>
                  <p class="stat-card-value">
                    {{ selectedStudent.courses.length }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Course-wise Breakdown -->
          <div class="courses-section">
            <h4 class="courses-title">Course-wise Attendance</h4>
            <div class="courses-list">
              <div 
                v-for="(course, index) in selectedStudent.courses" 
                :key="index" 
                class="course-item"
              >
                <div class="course-header">
                  <h5 class="course-name">{{ course.course_name }}</h5>
                  <div class="course-stats">
                    <span class="course-classes">
                      {{ course.attended }}/{{ course.total }} classes
                    </span>
                    <span 
                      class="course-percentage" 
                      :class="getAttendanceStatusClass(course.percentage)"
                    >
                      {{ course.percentage.toFixed(1) }}%
                    </span>
                  </div>
                </div>
                
                <!-- Course Progress Bar -->
                <div class="progress-bar-container">
                  <div
                    class="progress-bar"
                    :class="getProgressBarClass(course.percentage)"
                    :style="{ width: course.percentage + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-actions">
          <button @click="closeModal" class="modal-button primary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { FeatherIcon } from 'frappe-ui'

// Reactive data
const selectedBatch = ref('')
const selectedBatchName = ref('')
const students = ref([])
const loading = ref(false)
const selectedStudent = ref(null)
const showModal = ref(false)
const dropdownOpen = ref(false)
const filterDropdownOpen = ref(false)
const currentSort = ref('name')

// Mock batch data
const sortOptions = ref([
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'attendance-high', label: 'Attendance (High to Low)' },
  { value: 'attendance-low', label: 'Attendance (Low to High)' },
  { value: 'roll', label: 'Roll Number' }
])

// Computed properties
const currentSortLabel = computed(() => {
  return sortOptions.value.find(option => option.value === currentSort.value)?.label || 'Sort'
})

const sortedStudents = computed(() => {
  const studentsCopy = [...students.value]
  
  switch (currentSort.value) {
    case 'name':
      return studentsCopy.sort((a, b) => a.student_name.localeCompare(b.student_name))
    case 'attendance-high':
      return studentsCopy.sort((a, b) => b.overall_percentage - a.overall_percentage)
    case 'attendance-low':
      return studentsCopy.sort((a, b) => a.overall_percentage - b.overall_percentage)
    case 'roll':
      return studentsCopy.sort((a, b) => a.roll_number.localeCompare(b.roll_number))
    default:
      return studentsCopy
  }
})
const groups = ref([
  { id: '2025-29-1T1-AIML-A', name: '2025-29 1T1 AIML-A' },
  { id: '2025-29-1T1-AIML-B', name: '2025-29 1T1 AIML-B' },
  { id: '2025-29-1T1-CSE-A', name: '2025-29 1T1 CSE-A' },
  { id: '2025-29-1T1-CSE-B', name: '2025-29 1T1 CSE-B' },
  { id: '2025-29-1T1-ECE-A', name: '2025-29 1T1 ECE-A' },
])

// Mock student data
const mockStudentsData = {
  '2025-29-1T1-AIML-A': [
    {
      student_id: 'STU001',
      student_name: 'Aarav Sharma',
      roll_number: '22AI001',
      overall_percentage: 92.5,
      total_classes: 120,
      attended_classes: 111,
      courses: [
        { course_name: 'Machine Learning', percentage: 95.2, attended: 20, total: 21 },
        { course_name: 'Data Structures', percentage: 88.9, attended: 16, total: 18 },
        { course_name: 'Database Systems', percentage: 94.1, attended: 16, total: 17 },
        { course_name: 'Computer Networks', percentage: 90.0, attended: 18, total: 20 },
        { course_name: 'Software Engineering', percentage: 92.3, attended: 12, total: 13 },
        { course_name: 'Operating Systems', percentage: 87.5, attended: 14, total: 16 },
        { course_name: 'Web Technologies', percentage: 93.3, attended: 14, total: 15 }
      ]
    },
    {
      student_id: 'STU002',
      student_name: 'Priya Patel',
      roll_number: '22AI002',
      overall_percentage: 87.3,
      total_classes: 118,
      attended_classes: 103,
      courses: [
        { course_name: 'Machine Learning', percentage: 90.5, attended: 19, total: 21 },
        { course_name: 'Data Structures', percentage: 83.3, attended: 15, total: 18 },
        { course_name: 'Database Systems', percentage: 88.2, attended: 15, total: 17 },
        { course_name: 'Computer Networks', percentage: 85.0, attended: 17, total: 20 },
        { course_name: 'Software Engineering', percentage: 84.6, attended: 11, total: 13 },
        { course_name: 'Operating Systems', percentage: 87.5, attended: 14, total: 16 },
        { course_name: 'Web Technologies', percentage: 86.7, attended: 13, total: 15 }
      ]
    },
    {
      student_id: 'STU003',
      student_name: 'Rohit Kumar',
      roll_number: '22AI003',
      overall_percentage: 78.9,
      total_classes: 115,
      attended_classes: 91,
      courses: [
        { course_name: 'Machine Learning', percentage: 81.0, attended: 17, total: 21 },
        { course_name: 'Data Structures', percentage: 72.2, attended: 13, total: 18 },
        { course_name: 'Database Systems', percentage: 82.4, attended: 14, total: 17 },
        { course_name: 'Computer Networks', percentage: 75.0, attended: 15, total: 20 },
        { course_name: 'Software Engineering', percentage: 76.9, attended: 10, total: 13 },
        { course_name: 'Operating Systems', percentage: 81.3, attended: 13, total: 16 },
        { course_name: 'Web Technologies', percentage: 80.0, attended: 12, total: 15 }
      ]
    },
    {
      student_id: 'STU004',
      student_name: 'Sneha Reddy',
      roll_number: '22AI004',
      overall_percentage: 94.7,
      total_classes: 122,
      attended_classes: 115,
      courses: [
        { course_name: 'Machine Learning', percentage: 95.2, attended: 20, total: 21 },
        { course_name: 'Data Structures', percentage: 94.4, attended: 17, total: 18 },
        { course_name: 'Database Systems', percentage: 94.1, attended: 16, total: 17 },
        { course_name: 'Computer Networks', percentage: 95.0, attended: 19, total: 20 },
        { course_name: 'Software Engineering', percentage: 92.3, attended: 12, total: 13 },
        { course_name: 'Operating Systems', percentage: 93.8, attended: 15, total: 16 },
        { course_name: 'Web Technologies', percentage: 96.7, attended: 14, total: 15 }
      ]
    },
    {
      student_id: 'STU005',
      student_name: 'Arjun Singh',
      roll_number: '22AI005',
      overall_percentage: 82.1,
      total_classes: 119,
      attended_classes: 98,
      courses: [
        { course_name: 'Machine Learning', percentage: 85.7, attended: 18, total: 21 },
        { course_name: 'Data Structures', percentage: 77.8, attended: 14, total: 18 },
        { course_name: 'Database Systems', percentage: 88.2, attended: 15, total: 17 },
        { course_name: 'Computer Networks', percentage: 80.0, attended: 16, total: 20 },
        { course_name: 'Software Engineering', percentage: 84.6, attended: 11, total: 13 },
        { course_name: 'Operating Systems', percentage: 81.3, attended: 13, total: 16 },
        { course_name: 'Web Technologies', percentage: 86.7, attended: 13, total: 15 }
      ]
    },
    {
      student_id: 'STU006',
      student_name: 'Kavya Nair',
      roll_number: '22AI006',
      overall_percentage: 71.2,
      total_classes: 113,
      attended_classes: 80,
      courses: [
        { course_name: 'Machine Learning', percentage: 76.2, attended: 16, total: 21 },
        { course_name: 'Data Structures', percentage: 66.7, attended: 12, total: 18 },
        { course_name: 'Database Systems', percentage: 70.6, attended: 12, total: 17 },
        { course_name: 'Computer Networks', percentage: 70.0, attended: 14, total: 20 },
        { course_name: 'Software Engineering', percentage: 69.2, attended: 9, total: 13 },
        { course_name: 'Operating Systems', percentage: 75.0, attended: 12, total: 16 },
        { course_name: 'Web Technologies', percentage: 73.3, attended: 11, total: 15 }
      ]
    }
  ]
}

// Methods
const fetchStudentData = async (batchId) => {
  loading.value = true
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In real implementation, call:
    // const response = await fetch(`/api/method/your_app.api.get_batch_analytics?batch=${batchId}`)
    // const data = await response.json()
    
    const data = mockStudentsData[batchId] || []
    students.value = data
  } catch (error) {
    console.error('Error fetching student data:', error)
    students.value = []
  } finally {
    loading.value = false
  }
}

const handleBatchChange = () => {
  if (selectedBatch.value) {
    fetchStudentData(selectedBatch.value)
  } else {
    students.value = []
  }
}

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const selectBatch = (batch) => {
  selectedBatch.value = batch.id
  selectedBatchName.value = batch.name
  dropdownOpen.value = false
  handleBatchChange()
}

const toggleFilterDropdown = () => {
  filterDropdownOpen.value = !filterDropdownOpen.value
}

const selectSort = (option) => {
  currentSort.value = option.value
  filterDropdownOpen.value = false
}

const getAttendanceStatusClass = (percentage) => {
  if (percentage >= 85) return 'status-good'
  if (percentage >= 75) return 'status-average'
  return 'status-poor'
}

const getProgressBarClass = (percentage) => {
  if (percentage >= 85) return 'progress-good'
  if (percentage >= 75) return 'progress-average'
  return 'progress-poor'
}

const getAttendanceStatus = (percentage) => {
  if (percentage >= 85) return 'Good'
  if (percentage >= 75) return 'Average'
  return 'Poor'
}

const openStudentModal = (student) => {
  selectedStudent.value = student
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedStudent.value = null
}

onMounted(() => {
  console.log('Student Analytics component mounted')
})
</script>

<style scoped>
/* Base styles following the attendance component pattern */
.analytics-page {
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

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
}

.header-icon {
  display: flex;
  align-items: center;
}

/* Batch Selector */
.batch-selector-section {
  padding: 1rem;
  position: relative;
  z-index: 10;
}

.batch-selector-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.selector-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.selector-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
}

.selector-wrapper {
  position: relative;
  max-width: 24rem;
  z-index: 10;
}

/* Custom Select Dropdown */
.custom-select {
  position: relative;
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  font-size: 0.9rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.custom-select:hover {
  border-color: #9ca3af;
}

.custom-select.dropdown-open {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.selected-text {
  flex: 1;
  truncate: true;
}

.select-icon {
  width: 1rem;
  height: 1rem;
  color: #6b7280;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.select-icon.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 50;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 0.25rem;
}

.dropdown-item {
  padding: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f3f4f6;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: #f3f4f6;
}

/* Hide the old select styles */
.batch-select {
  display: none;
}

.batch-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.select-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: #6b7280;
  pointer-events: none;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  background: white;
  margin: 0 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #6b7280;
  margin: 0;
}

/* Students Section */
.students-section {
  padding: 0 1rem;
  margin-bottom: 2rem;
}

.students-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.filter-dropdown {
  position: relative;
}

.filter-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-button:hover {
  border-color: #9ca3af;
}

.filter-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: auto;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 50;
  min-width: 200px;
  margin-top: 0.25rem;
}

.filter-item {
  padding: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.85rem;
}

.filter-item:last-child {
  border-bottom: none;
}

.filter-item:hover {
  background: #f3f4f6;
}

.filter-item.active {
  background: #3b82f6;
  color: white;
}

.students-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.students-subtitle {
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0;
  text-align: right;
  flex-shrink: 0;
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

/* Student Cards */
.student-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
}

.student-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
  transform: translateY(-1px);
}

.student-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 1rem;
}

.student-info {
  flex: 1;
}

.student-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.student-roll {
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0;
}

/* Status Badges - 3 Colors Only */
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-good {
  background: #dcfce7;
  color: #166534;
}

.status-average {
  background: #fef3c7;
  color: #92400e;
}

.status-poor {
  background: #fee2e2;
  color: #dc2626;
}

/* Attendance Section */
.attendance-section {
  margin-bottom: 1rem;
}

.attendance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.attendance-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}

.attendance-percentage {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

/* Progress Bars */
.progress-bar-container {
  width: 100%;
  height: 0.5rem;
  background: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 0.25rem;
}

/* Progress Bars - 3 Colors Only */
.progress-good {
  background: #10b981;
}

.progress-average {
  background: #f59e0b;
}

.progress-poor {
  background: #ef4444;
}

/* Student Stats - Single Row */
.student-stats-single-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.stat-content {
  flex: 1;
}

.stat-label {
  color: #6b7280;
  font-size: 0.75rem;
  margin: 0;
}

.stat-value {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.85rem;
  margin: 0;
}

.stat-divider {
  width: 1px;
  height: 2rem;
  background: #e5e7eb;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.stat-content {
  flex: 1;
}

.stat-label {
  color: #6b7280;
  font-size: 0.75rem;
  margin: 0;
}

.stat-value {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.85rem;
  margin: 0;
}

/* Empty States */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  background: white;
  margin: 0 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-text {
  color: #6b7280;
  margin: 1rem 0 0 0;
  text-align: center;
}

/* Modal Styles */
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

.student-detail-modal {
  max-width: 56rem;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

/* Modal Header - Professional Look */
.student-modal-header {
  background: #1f2937;
  color: white;
  padding: 1.25rem 1.5rem;
  border-radius: 0.75rem 0.75rem 0 0;
}

.modal-student-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.modal-student-roll {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  margin: 0.25rem 0 0 0;
}

.close-button {
  padding: 0.5rem;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-student-info {
  flex: 1;
}

.student-modal-body {
  padding: 1.25rem;
  max-height: calc(90vh - 200px);
  overflow-y: auto;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

/* Stats Grid - Professional Look */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
}

.stat-card-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-icon {
  padding: 0.5rem;
  background: #e2e8f0;
  color: #475569;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-details {
  flex: 1;
}

.stat-card-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  margin: 0 0 0.25rem 0;
}

.stat-card-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}d-label {
  color: #6b21a8;
}

.stat-card-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.stat-card-green .stat-card-value {
  color: #047857;
}

.stat-card-blue .stat-card-value {
  color: #1d4ed8;
}

.stat-card-purple .stat-card-value {
  color: #7c3aed;
}

/* Courses Section - Professional Look */
.courses-section {
  margin-top: 1.25rem;
}

.courses-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
}

.courses-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.course-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.875rem;
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 1rem;
}

.course-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #1e293b;
  margin: 0;
  flex: 1;
}

.course-stats {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.course-classes {
  font-size: 0.75rem;
  color: #64748b;
}

.course-percentage {
  padding: 0.125rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Modal Actions - Professional Look */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  padding: 1rem 1.25rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 0 0 0.75rem 0.75rem;
}

.modal-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.modal-button.primary {
  background: #1e293b;
  color: white;
}

.modal-button.primary:hover {
  background: #0f172a;
}

/* Responsive Design Updates */
@media (max-width: 768px) {
  .students-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .header-actions {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .students-subtitle {
    text-align: left;
    font-size: 0.8rem;
  }

  .students-grid {
    grid-template-columns: 1fr;
  }

  .student-stats-single-row {
    gap: 0.75rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .course-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .course-stats {
    align-self: stretch;
    justify-content: space-between;
  }

  .student-modal-body {
    padding: 1rem;
  }

  .modal-actions {
    padding: 1rem;
  }

  .filter-menu {
    left: 0;
    right: auto;
  }
}

@media (max-width: 480px) {
  .analytics-page {
    padding: 0;
  }

  .header {
    padding: 0.75rem;
  }

  .batch-selector-section {
    padding: 0.75rem;
  }

  .students-section {
    padding: 0 0.75rem;
  }

  .modal-overlay {
    padding: 0.5rem;
  }

  .student-detail-modal {
    max-height: 95vh;
  }

  .student-modal-header {
    padding: 1rem;
  }

  .modal-student-name {
    font-size: 1rem;
  }

  .header-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .student-stats-single-row {
    flex-direction: row;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .stat-divider {
    display: none;
  }
}
</style>