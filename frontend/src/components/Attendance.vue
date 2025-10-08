<template>
  <div class="attendance-page">
    <!-- Header -->
    <div class="header">
      <button @click="$router.go(-1)" class="back-button">
        <FeatherIcon name="arrow-left" class="w-5 h-5" />
      </button>
      <div class="header-info">
        <h1 class="course-title">{{ courseInfo.name }}</h1>
        <p class="course-details flex">{{ courseInfo.date }} → {{ courseInfo.time }}
          <span
            className="hidden md:block ms-3 px-3 py-[0.5px] bg-blue-100 text-blue-700 rounded-full text-sm font-medium">{{
            courseInfo.room }}</span>
        </p>
        <p class="md:hidden blockcourse-room">{{ courseInfo.room }}</p>
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
          Attendance has been partially recorded. Some students' attendance is already submitted and cannot be changed.
          You can only mark attendance for the remaining students.
        </p>
      </div>
    </div>

    <div v-else-if="isEditMode" class="alert-message edit">
      <FeatherIcon name="info" class="w-5 h-5 text-blue-600" />
      <div>
        <p class="alert-text">
          Attendance has already been recorded. You are now editing the existing entry to update or correct any details
          as needed.
        </p>
      </div>
    </div>

    <!-- Instructions and Actions -->
    <div class="md:px-3 lg:px-5 pt-3 hidden md:block">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 ">
      <div class="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">

        <!-- Search Input -->
        <div class="search-section">
          <div class="search-container">
            <FeatherIcon name="search" class="search-icon" />
            <input type="text" v-model="searchQuery" placeholder="Search by student name or roll number..."
              class="search-input" />
            <button v-if="searchQuery" @click="clearSearch" class="clear-search-button">
              <FeatherIcon name="x" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex gap-3 w-full md:w-auto">
          <button @click="markAllAsPresent" :disabled="allStudentsHaveStatus || studentsWithoutStatus.length === 0"
            class="px-6 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
            Mark All Present
          </button>

          <button @click="markAllAsAbsent" :disabled="allStudentsHaveStatus || studentsWithoutStatus.length === 0"
            class="px-6 py-2 bg-white border-2 border-red-500 text-red-500 font-medium rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
            Mark All Absent
          </button>
        </div>
      </div>
    </div>
    </div>
    <div class="actions-section  md:hidden block">
      <div class="bulk-actions">
        <button @click="markAllAsPresent" class="action-button mark-present"
          :disabled="allStudentsHaveStatus || studentsWithoutStatus.length === 0">
          Mark all as present
        </button>
        <button @click="markAllAsAbsent" class="action-button mark-absent"
          :disabled="allStudentsHaveStatus || studentsWithoutStatus.length === 0">
          Mark all as absent
        </button>
      </div>

      <!-- Search Box -->
      <div class="search-section">
        <div class="search-container">
          <FeatherIcon name="search" class="search-icon" />
          <input type="text" v-model="searchQuery" placeholder="Search by student name or roll number..."
            class="search-input" />
          <button v-if="searchQuery" @click="clearSearch" class="clear-search-button">
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
     <div class="md:px-3 lg:px-5 hidden md:block">
    <div class=" bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Roll Number
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student Name
            </th>
            <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Attendance %
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="student in filteredStudents" :key="student.student" class="hover:bg-gray-50 transition-colors"
            :class="{
            'bg-red-50': student.checked === false,
            'opacity-50 cursor-not-allowed': isStudentDisabled(student),
            'bg-green-50': student.status === 'Present',
            'bg-yellow-50': student.status === 'Absent'
          }" @click="!isStudentDisabled(student) && toggleStudentAttendance(student)">
            <!-- Checkbox / Status -->
            <td class="px-6 py-4">
              <div class="flex items-center">
                <div class="relative">
                  <input type="checkbox" v-model="student.checked" :disabled="isStudentDisabled(student)"
                    class="opacity-0 absolute h-6 w-6" @click.stop />
                  <div class="w-6 h-6 border-2 rounded flex items-center justify-center" :class="{
                    'bg-teal-600 border-teal-600': student.checked === true,
                    'border-gray-300 hover:border-teal-600': student.checked !== true,
                    'bg-[#ef4444]': student.checked === false && !isStudentDisabled(student)
                  }">
                    <FeatherIcon v-if="student.checked === true" name="check" class="w-4 h-4 text-white" />
                    <FeatherIcon v-else-if="student.checked === false" name="x" class="w-4 h-4 text-white" />
                  </div>
                </div>

                <!-- Status Badge -->
                <span v-if="student.status" class="ml-2 px-2 py-0.5 rounded text-xs font-semibold uppercase" :class="{
                  'bg-green-100 text-green-800': student.status === 'Present',
                  'bg-red-100 text-red-800': student.status === 'Absent'
                }">
                  {{ student.status.charAt(0) }}
                </span>


              </div>
            </td>

            <!-- Roll Number -->
            <td class="px-6 py-4">
              <span class="text-sm font-medium text-gray-900">
                {{ student.custom_student_id || student.student || 'N/A' }}
              </span>
            </td>

            <!-- Student Name -->
            <td class="px-6 py-4">
              <span class="text-sm font-semibold text-gray-900">
                {{ student.student_name }}
              </span>
            </td>

            <!-- Attendance Percentage -->
            <td class="px-6 py-4 text-right flex justify-end">
              <!--  <span
              v-if="student.attendance_percentage !== undefined"
              :class="['text-lg font-bold', getPercentageClass(student.attendance_percentage)]"
            >
              {{ student.attendance_percentage.toFixed(1) }}%
            </span>-->
              <div class="student-percentage" v-if="student.attendance_percentage !== undefined"
                :class="getPercentageClass(student.attendance_percentage)">
                {{ student.attendance_percentage.toFixed(1) }}%
              </div>
              <!-- Absent Badge -->
              <span v-if="student.checked === false && !isStudentDisabled(student)" class="absent-badge">
                Ab
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    </div>
    <div class="students-list block md:hidden">
      <div v-for="student in filteredStudents" :key="student.student" class="student-row" :class="{ 
          'absent': student.checked === false, 
          'disabled': isStudentDisabled(student),
          'status-present': student.status === 'Present',
          'status-absent': student.status === 'Absent'
        }" @click="toggleStudentAttendance(student)">
        <div class="student-info">
          <div class="checkbox-container">
            <input type="checkbox" v-model="student.checked" :disabled="isStudentDisabled(student)"
              class="student-checkbox" @click.stop />
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
        <div class="student-percentage" v-if="student.attendance_percentage !== undefined"
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
    <div class="submit-section md:flex md:justify-center">
      <button @click="submitAttendance" class="submit-button w-full md:w-[300px]" :disabled="isSubmitDisabled">
        <span v-if="isSubmitting">Submitting...</span>
        <span v-else-if="allStudentsHaveStatus">Attendance Already Submitted</span>
        <span v-else-if="unmarkedCount > 0">Please mark all students ({{ unmarkedCount }} unmarked)</span>
        <span v-else>Submit Attendance</span>
      </button>
    </div>

    <!-- Topics Selection Modal -->
    <div v-if="showTopicsModal" class="modal-overlay" @click.stop>
      <div class="modal-content topics-modal" @click.stop>
        <div class="modal-header">
          <h3>Select Course Topics Covered</h3>
          <button @click="closeTopicsModal" class="close-button">
            <FeatherIcon name="x" class="w-5 h-5" />
          </button>
        </div>
        <div class="modal-body topics-modal-body">
          <p class="topics-instruction">Please select the topics that were covered in this class session:</p>

          <!-- Course Completion Checkbox -->
          <!-- <div class="course-completion-section">
            <label class="course-completion-label">
              <input 
                type="checkbox" 
                v-model="isCourseCompleted"
                class="course-checkbox"
              />
              <span class="checkbox-text">Mark course as completed</span>
            </label>
          </div> -->

          <!-- Search Topics -->
          <div class="topics-search-container">
            <FeatherIcon name="search" class="search-icon-small" />
            <input type="text" v-model="topicsSearchQuery" placeholder="Search topics..." class="topics-search-input" />
          </div>

          <!-- Topics List with Hierarchy or Fallback -->
          <div v-if="organizedTopics && organizedTopics.length > 0" class="topics-hierarchy">
            <div v-for="unit in (topicsSearchQuery ? filteredOrganizedTopics : organizedTopics)" :key="unit.unitName"
              class="unit-section">

              <!-- Unit Header -->
              <div class="unit-header" @click="toggleUnit(unit.unitName)">
                <FeatherIcon :name="expandedUnits[unit.unitName] ? 'chevron-down' : 'chevron-right'"
                  class="unit-chevron" />
                <label class="unit-checkbox-label" @click.stop>
                  <input type="checkbox" :checked="isUnitSelected(unit)" @change="toggleUnitSelection(unit)"
                    class="topic-checkbox" />
                  <span class="unit-title">{{ unit.displayName }}</span>
                  <span class="unit-count">({{ unit.leafTopicsInUnit.length }} topics)</span>
                </label>
              </div>

              <!-- Unit Content -->
              <div v-if="expandedUnits[unit.unitName]" class="unit-content">

                <!-- ADD THE NEW HTML HERE - RIGHT AFTER THE OPENING div -->
                <div v-if="unit.directTopics && unit.directTopics.length > 0" class="unit-direct-topics">
                  <label v-for="topic in unit.directTopics" :key="topic.no" class="topic-item-label level-1">
                    <input type="checkbox" v-model="selectedTopicIds" :value="topic.no" class="topic-checkbox" />
                    <span class="topic-name" :title="topic.originalName">{{ topic.displayName }}</span>
                  </label>
                </div>
                <!-- END OF NEW HTML -->

                <!-- Sections -->
                <div v-for="section in unit.sections" :key="section.sectionName" class="section-group">

                  <!-- Section with expandable header -->
                  <div class="section-header">
                    <div class="section-toggle" @click="toggleSectionExpansion(unit.unitName, section.sectionName)">
                      <FeatherIcon
                        :name="getSectionExpansion(unit.unitName, section.sectionName) ? 'chevron-down' : 'chevron-right'"
                        class="section-chevron" />
                      <label class="section-checkbox-label" @click.stop>
                        <input type="checkbox" :checked="isSectionSelected(section)"
                          @change="toggleSectionSelection(section)" class="topic-checkbox" />
                        <span class="section-title">{{ section.displayName }}</span>
                        <span class="section-count" v-if="section.leafTopicsInSection.length > 0">
                          ({{ section.leafTopicsInSection.length }})
                        </span>
                      </label>
                    </div>
                  </div>

                  <!-- Section Content -->
                  <div v-if="getSectionExpansion(unit.unitName, section.sectionName)" class="section-content">

                    <!-- Direct Section Topics (if any) -->
                    <div v-if="section.directTopics.length > 0" class="direct-topics">
                      <label v-for="topic in section.directTopics" :key="topic.no" class="topic-item-label level-2">
                        <input type="checkbox" v-model="selectedTopicIds" :value="topic.no" class="topic-checkbox" />
                        <span class="topic-name" :title="topic.originalName">{{ topic.displayName }}</span>
                      </label>
                    </div>

                    <!-- Subsections -->
                    <div v-if="Object.keys(section.subsections).length > 0" class="subsections">
                      <div v-for="subsection in section.subsections" :key="subsection.subsectionName"
                        class="subsection-group">

                        <!-- Subsection as Level 3 topic -->
                        <div class="subsection-content">
                          <!-- Subsection Parent Topic (without Overview label) -->
                          <label class="topic-item-label level-3">
                            <input type="checkbox" v-model="selectedTopicIds" :value="subsection.topicId"
                              class="topic-checkbox" />
                            <span class="topic-name">{{ subsection.displayName }}</span>
                          </label>

                          <!-- Subsection Child Topics (Level 4) -->
                          <div v-if="subsection.topics.length > 0" class="subsection-topics">
                            <label v-for="topic in subsection.topics" :key="topic.no" class="topic-item-label level-4">
                              <input type="checkbox" v-model="selectedTopicIds" :value="topic.no"
                                class="topic-checkbox" />
                              <span class="topic-name" :title="topic.originalName">{{ topic.displayName }}</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No search results -->
            <div v-if="topicsSearchQuery && filteredOrganizedTopics.length === 0" class="no-topics-found">
              No topics found matching your search
            </div>
          </div>

          <!-- NEW Fallback: Show topics grouped by Unit -->
          <div v-else-if="props.topics && props.topics.length > 0" class="topics-hierarchy">

            <!-- This part renders the grouped list -->
            <div v-if="Object.keys(groupedFallbackTopics).length > 0" class="fallback-topics-list">
              <p class="fallback-notice">Showing all topics (simplified view):</p>

              <!-- Loop through each Unit group -->
              <div v-for="(groupTopics, unitName) in groupedFallbackTopics" :key="unitName" class="unit-group">
                <h4 class="unit-title">{{ unitName }}</h4>
                <div class="topic-items">
                  <!-- Loop through topics within this unit -->
                  <label v-for="topic in groupTopics" :key="topic.no" class="topic-item-label">
                    <input type="checkbox" v-model="selectedTopicIds" :value="topic.no" class="topic-checkbox" />
                    <span class="topic-name">
                      {{ formatTopicNameForDisplay(topic.topic_name || topic.topic || `Topic ${topic.no}`) }}
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <!-- Show this message ONLY if a search is active and yields zero results -->
            <div v-else-if="topicsSearchQuery" class="no-topics-found">
              No topics found matching "{{ topicsSearchQuery }}"
            </div>

          </div>
          <!-- No topics available -->
          <div v-else class="no-topics-found">
            <p>No topics available for this course. Please contact the administrator.</p>
          </div>

          <!-- Selected Topics Summary -->
          <div class="selected-topics-summary">
            <span class="summary-text">
              {{ selectedTopicIds.length }} topic{{ selectedTopicIds.length !== 1 ? 's' : '' }} selected
            </span>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeTopicsModal" class="modal-button secondary">Cancel</button>
          <button @click="confirmTopicsSelection" class="modal-button primary">
            Continue {{ selectedTopicIds.length === 0 ? '' : '' }}
          </button>
        </div>
      </div>
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
            <h4 class="section-title">Topics Covered in this Session:</h4>

            <div v-if="getSelectedTopicDetails().length > 0" class="topic-completion-list">
              <p class="completion-instruction">
                <FeatherIcon name="info" class="instruction-icon" />
                <span>Mark completed topics:</span>
              </p>
              <div v-for="topic in getSelectedTopicDetails()" :key="topic.no" class="topic-completion-item">
                <label class="topic-completion-label">
                  <input type="checkbox" v-model="completedTopicIds" :value="topic.no" class="topic-checkbox" />
                  <span class="completion-topic-name">{{ topic.displayName }}</span>
                </label>
              </div>

              <!-- Informational note about parent topics -->
              <!-- <div class="parent-topics-note">
                <FeatherIcon name="info" class="w-4 h-4 text-blue-500" />
                <span class="note-text">
                  Parent topics (like "Database Concepts", "Introduction to Database Concepts") will be automatically 
                  marked as completed when all their child topics are completed.
                </span>
              </div> -->
            </div>

            <div v-else class="no-topics-selected">
              No topics were selected as covered.
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
        <div class="modal-actions">
          <button @click="closeErrorModal" class="modal-button primary">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { FeatherIcon } from 'frappe-ui'
  import { createResource } from 'frappe-ui'
  import { nextTick } from 'vue'

  // Props from parent component
  const props = defineProps({
    students: { type: Array, default: () => [] },
    topics: { type: Array, default: () => [] },
    courseInfo: { type: Object, required: true }
  })

  // Define emit for parent communication
  const emit = defineEmits(['refresh-data'])

  // Local reactive state
  const students = ref([])
  const searchQuery = ref('')
  const showTopicsModal = ref(false)
  const selectedTopicIds = ref([]) // From the first modal (covered topics)
  const completedTopicIds = ref([]) // --- NEW: For checkboxes in the final confirm modal
  const topicsSearchQuery = ref('')
  const isCourseCompleted = ref(false)
  const expandedUnits = ref({})
  const isEditMode = ref(false)
  const isSubmitting = ref(false)
  const showConfirmModal = ref(false)
  const showSuccessModal = ref(false)
  const showErrorModal = ref(false)
  const successTitle = ref('')
  const successMessage = ref('')
  const errorTitle = ref('')
  const errorMessage = ref('')
  // Add these to your existing reactive state
  const expandedSections = ref({}) // Format: "unitName-sectionName": boolean
  const expandedSubsections = ref({}) // Format: "unitName-sectionName-subsectionName": boolean

  // Watch for changes in props.students
  watch(() => props.students, (newStudents) => {
    students.value = (newStudents || []).map(student => ({
      ...student,
      checked: student.status ? student.status === 'Present' : true
    }));
  }, { immediate: true, deep: true })


  // Enhanced formatTopicNameForDisplay to handle LAB format
  const formatTopicNameForDisplay = (topicName) => {
    if (typeof topicName !== 'string') return '';

    // Handle LAB format
    const labMatch = topicName.match(/^LAB-(\d+)-(.*)$/);
    if (labMatch) {
      return `Lab ${labMatch[1]}: ${labMatch[2]}`;
    }

    // Handle UNIT format (existing logic)
    const unitMatch = topicName.match(/^(?:UNIT-[IVX]+(?:-[A-Z])?(?:-\d+)?-)?(.*)$/);
    return unitMatch ? (unitMatch[1] || topicName) : topicName;
  };

  // Helper methods for section expansion
  const getSectionKey = (unitName, sectionName) => `${unitName}-${sectionName}`
  const getSubsectionKey = (unitName, sectionName, subsectionName) => `${unitName}-${sectionName}-${subsectionName}`

  const getSectionExpansion = (unitName, sectionName) => {
    const key = getSectionKey(unitName, sectionName)
    return expandedSections.value[key] ?? true // Default to expanded
  }

  const getSubsectionExpansion = (unitName, sectionName, subsectionName) => {
    const key = getSubsectionKey(unitName, sectionName, subsectionName)
    return expandedSubsections.value[key] ?? false // Default to collapsed
  }

  const toggleSectionExpansion = (unitName, sectionName) => {
    const key = getSectionKey(unitName, sectionName)
    expandedSections.value[key] = !getSectionExpansion(unitName, sectionName)
  }

  const toggleSubsectionExpansion = (unitName, sectionName, subsectionName) => {
    const key = getSubsectionKey(unitName, sectionName, subsectionName)
    expandedSubsections.value[key] = !getSubsectionExpansion(unitName, sectionName, subsectionName)
  }


  // Helper function to count only leaf topics (non-parent topics)
  const countLeafTopics = (topics) => {
    return topics.filter(topic => {
      const topicName = topic.topic_name || topic.topic || '';
      const match = topicName.match(/^(UNIT-[IVX]+)(?:-([A-Z]))?(?:-(\d+))?-(.*)$/);

      if (!match) return true; // Include non-standard topics

      const unitKey = match[1];
      const sectionKey = match[2];
      const subsectionKey = match[3];

      // Exclude unit-level parents (UNIT-I-Database Concepts)
      if (!sectionKey && !subsectionKey) return false;

      // Exclude section-level parents (UNIT-I-A-Introduction to Database Concepts)
      if (sectionKey && !subsectionKey) return false;

      // Include subsection-level topics and below (UNIT-I-A-1-Characteristics, etc.)
      return true;
    }).length;
  };

  // Enhanced organizeTopics function that handles UNIT, LAB, and normal topics
  const organizeTopics = (topicsList) => {
    if (!topicsList || topicsList.length === 0) return [];

    const units = {};
    const labs = {};
    const normalTopics = [];

    const unitRegex = /^(UNIT-[IVX]+)(?:-([A-Z]))?(?:-(\d+))?-(.*)$/;
    const labRegex = /^(LAB)-(\d+)-(.*)$/;

    console.log('Processing topics:', topicsList.map(t => t.topic_name || t.topic));

    // Helper functions
    const processUnitTopic = (topic, topicName, units, unitRegex) => {
      const match = topicName.match(unitRegex);
      if (!match) return;

      const unitKey = match[1];
      const sectionKey = match[2];
      const subsectionKey = match[3];
      const displayName = match[4];
      const unitNumber = unitKey.split('-')[1];

      if (!units[unitKey]) {
        units[unitKey] = {
          unitName: unitKey,
          displayName: `Unit ${unitNumber}`,
          topicId: null,
          allTopicsInUnit: [],
          leafTopicsInUnit: [],
          sections: {}
        };
      }

      if (!sectionKey && !subsectionKey) {
        units[unitKey].displayName = displayName;
        units[unitKey].topicId = topic.no;
      }

      const topicData = { ...topic, originalName: topicName, displayName: displayName };
      units[unitKey].allTopicsInUnit.push(topicData);

      const isParentTopic = (!sectionKey && !subsectionKey) || (sectionKey && !subsectionKey);
      if (!isParentTopic) {
        units[unitKey].leafTopicsInUnit.push(topicData);
      }

      if (!sectionKey) return;

      if (!units[unitKey].sections[sectionKey]) {
        units[unitKey].sections[sectionKey] = {
          sectionName: sectionKey,
          displayName: '',
          topicId: null,
          subsections: {},
          directTopics: [],
          leafTopicsInSection: []
        };
      }

      const section = units[unitKey].sections[sectionKey];

      if (!subsectionKey) {
        section.displayName = displayName;
        section.topicId = topic.no;
      } else {
        section.leafTopicsInSection.push(topicData);

        if (!section.subsections[subsectionKey]) {
          section.subsections[subsectionKey] = {
            subsectionName: subsectionKey,
            displayName: displayName,
            topicId: topic.no,
            topics: []
          };
        }
      }
    };

    const processLabTopic = (topic, topicName, labs, labRegex) => {
      const match = topicName.match(labRegex);
      if (!match) return;

      const labNumber = parseInt(match[2]);
      const labDescription = match[3];

      const topicData = {
        ...topic,
        originalName: topicName,
        displayName: `Lab ${labNumber}: ${labDescription}`,
        labNumber: labNumber
      };

      labs[labNumber] = topicData;
    };

    const organizeUnits = (units) => {
      const romanToNum = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5 };

      return Object.values(units)
        .sort((a, b) => (romanToNum[a.unitName.split('-')[1]] || 0) - (romanToNum[b.unitName.split('-')[1]] || 0))
        .map(unit => ({
          ...unit,
          sections: Object.values(unit.sections)
            .filter(s => s.topicId || s.directTopics.length > 0 || Object.keys(s.subsections).length > 0)
            .sort((a, b) => a.sectionName.localeCompare(b.sectionName))
            .map(section => ({
              ...section,
              subsections: Object.values(section.subsections)
                .sort((a, b) => {
                  const aNum = parseInt(a.subsectionName);
                  const bNum = parseInt(b.subsectionName);
                  return !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : a.subsectionName.localeCompare(b.subsectionName);
                })
            }))
        }))
        .filter(unit => unit.allTopicsInUnit.length > 0);
    };

    const organizeLabs = (labs) => {
      const labTopics = Object.values(labs).sort((a, b) => a.labNumber - b.labNumber);

      // Return labs as direct topics under the unit, not in a nested section
      return {
        unitName: 'LABS',
        displayName: `Laboratory Experiments`,
        topicId: null,
        allTopicsInUnit: labTopics,
        leafTopicsInUnit: labTopics,
        // Use empty sections array since labs should be direct topics
        sections: [],
        // Add direct topics at unit level for labs
        directTopics: labTopics
      };
    };

    // First, categorize topics by type
    topicsList.forEach(topic => {
      const topicName = topic.topic_name || topic.topic || '';

      if (unitRegex.test(topicName)) {
        processUnitTopic(topic, topicName, units, unitRegex);
      } else if (labRegex.test(topicName)) {
        processLabTopic(topic, topicName, labs, labRegex);
      } else {
        normalTopics.push({
          ...topic,
          originalName: topicName,
          displayName: formatTopicNameForDisplay(topicName)
        });
      }
    });

    // Handle child topics under numbered subsections (existing logic)
    topicsList.forEach(topic => {
      const topicName = topic.topic_name || topic.topic || '';
      const childMatch = topicName.match(/^(UNIT-[IVX]+)-([A-Z])-(\d+)-(\d+)-(.*)$/);

      if (childMatch) {
        const unitKey = childMatch[1];
        const sectionKey = childMatch[2];
        const subsectionKey = childMatch[3];

        if (units[unitKey]?.sections[sectionKey]?.subsections[subsectionKey]) {
          const childTopic = {
            ...topic,
            originalName: topicName,
            displayName: childMatch[5]
          };

          units[unitKey].sections[sectionKey].subsections[subsectionKey].topics.push(childTopic);
          units[unitKey].leafTopicsInUnit.push(childTopic);
          units[unitKey].sections[sectionKey].leafTopicsInSection.push(childTopic);
        }
      }
    });

    // Organize results
    const result = [];

    if (Object.keys(units).length > 0) {
      result.push(...organizeUnits(units));
    }

    if (Object.keys(labs).length > 0) {
      result.push(organizeLabs(labs));
    }

    if (normalTopics.length > 0) {
      result.push({
        unitName: 'General',
        displayName: 'General Topics',
        topicId: null,
        allTopicsInUnit: normalTopics,
        leafTopicsInUnit: normalTopics,
        sections: [{
          sectionName: 'A',
          displayName: 'General Topics',
          topicId: null,
          subsections: {},
          directTopics: normalTopics,
          leafTopicsInSection: normalTopics
        }]
      });
    }

    console.log('Organized topics result:', result);
    return result;
  };

  // Process UNIT topics (existing logic)
  function processUnitTopic(topic, topicName, units, unitRegex) {
    const match = topicName.match(unitRegex);
    if (!match) return;

    const unitKey = match[1]; // e.g., "UNIT-I"
    const sectionKey = match[2]; // e.g., "A" 
    const subsectionKey = match[3]; // e.g., "1"
    const displayName = match[4]; // e.g., "Database Concepts"
    const unitNumber = unitKey.split('-')[1];

    // Initialize unit if doesn't exist
    if (!units[unitKey]) {
      units[unitKey] = {
        unitName: unitKey,
        displayName: `Unit ${unitNumber}`,
        topicId: null,
        allTopicsInUnit: [],
        leafTopicsInUnit: [],
        sections: {}
      };
    }

    // If this is a unit-level topic (no section, no subsection)
    if (!sectionKey && !subsectionKey) {
      units[unitKey].displayName = displayName;
      units[unitKey].topicId = topic.no;
    }

    const topicData = {
      ...topic,
      originalName: topicName,
      displayName: displayName
    };

    // Add to unit's all topics
    units[unitKey].allTopicsInUnit.push(topicData);

    // Add to leaf topics only if it's not a parent topic
    const isParentTopic = (!sectionKey && !subsectionKey) || (sectionKey && !subsectionKey);
    if (!isParentTopic) {
      units[unitKey].leafTopicsInUnit.push(topicData);
    }

    // Handle different hierarchy levels
    if (!sectionKey) return;

    // Initialize section if doesn't exist
    if (!units[unitKey].sections[sectionKey]) {
      units[unitKey].sections[sectionKey] = {
        sectionName: sectionKey,
        displayName: '',
        topicId: null,
        subsections: {},
        directTopics: [],
        leafTopicsInSection: []
      };
    }

    const section = units[unitKey].sections[sectionKey];

    if (!subsectionKey) {
      section.displayName = displayName;
      section.topicId = topic.no;
    } else {
      section.leafTopicsInSection.push(topicData);

      if (!section.subsections[subsectionKey]) {
        section.subsections[subsectionKey] = {
          subsectionName: subsectionKey,
          displayName: displayName,
          topicId: topic.no,
          topics: []
        };
      }
    }
  }

  // Process LAB topics
  function processLabTopic(topic, topicName, labs, labRegex) {
    const match = topicName.match(labRegex);
    if (!match) return;

    const labNumber = parseInt(match[2]); // e.g., "1", "2", etc.
    const labDescription = match[3]; // e.g., "Tensile test on a mild steel specimen"

    const topicData = {
      ...topic,
      originalName: topicName,
      displayName: `Lab ${labNumber}: ${labDescription}`,
      labNumber: labNumber
    };

    // Store in labs object for later organization
    labs[labNumber] = topicData;
  }

  // Organize units (existing logic)
  function organizeUnits(units) {
    const romanToNum = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5 };

    return Object.values(units)
      .sort((a, b) => {
        return (romanToNum[a.unitName.split('-')[1]] || 0) - (romanToNum[b.unitName.split('-')[1]] || 0);
      })
      .map(unit => ({
        ...unit,
        sections: Object.values(unit.sections)
          .filter(s => s.topicId || s.directTopics.length > 0 || Object.keys(s.subsections).length > 0)
          .sort((a, b) => a.sectionName.localeCompare(b.sectionName))
          .map(section => ({
            ...section,
            subsections: Object.values(section.subsections)
              .sort((a, b) => {
                const aNum = parseInt(a.subsectionName);
                const bNum = parseInt(b.subsectionName);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                  return aNum - bNum;
                }
                return a.subsectionName.localeCompare(b.subsectionName);
              })
          }))
      }))
      .filter(unit => unit.allTopicsInUnit.length > 0);
  }

  // Organize labs into a single unit-like structure
  function organizeLabs(labs) {
    const labTopics = Object.values(labs).sort((a, b) => a.labNumber - b.labNumber);

    return {
      unitName: 'LABS',
      displayName: 'Laboratory Experiments',
      topicId: null,
      allTopicsInUnit: labTopics,
      leafTopicsInUnit: labTopics, // All lab topics are leaf topics
      sections: [{
        sectionName: 'A',
        displayName: 'Laboratory Experiments',
        topicId: null,
        subsections: {},
        directTopics: labTopics,
        leafTopicsInSection: labTopics
      }]
    };
  }


  // Enhanced fallback grouping for mixed topic types
  const groupedFallbackTopics = computed(() => {
    if (!props.topics || props.topics.length === 0) return {};

    const groups = {};
    const unitRegex = /^(UNIT-[IVX]+)/;
    const labRegex = /^(LAB)-(\d+)/;

    props.topics.forEach(topic => {
      const topicName = topic.topic_name || topic.topic || '';
      let groupKey = 'General Topics';

      if (unitRegex.test(topicName)) {
        const match = topicName.match(unitRegex);
        const unitNumber = match[1].split('-')[1];
        groupKey = `Unit ${unitNumber}`;
      } else if (labRegex.test(topicName)) {
        groupKey = 'Laboratory Experiments';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      groups[groupKey].push({
        ...topic,
        displayName: formatTopicNameForDisplay(topicName)
      });
    });

    return groups;
  });


  const organizedTopics = computed(() => organizeTopics(props.topics));

  const isSubsectionSelected = (subsection) => {
    const allSubsectionTopics = [];

    // Add subsection parent
    if (subsection.topicId) {
      allSubsectionTopics.push({ no: subsection.topicId });
    }

    // Add subsection child topics
    allSubsectionTopics.push(...subsection.topics);

    return allSubsectionTopics.length > 0 && allSubsectionTopics.every(t => selectedTopicIds.value.includes(t.no));
  };

  const toggleSubsectionSelection = (subsection) => {
    const shouldSelect = !isSubsectionSelected(subsection);

    // Toggle subsection parent
    if (subsection.topicId) {
      const index = selectedTopicIds.value.indexOf(subsection.topicId);
      if (shouldSelect && index === -1) {
        selectedTopicIds.value.push(subsection.topicId);
      } else if (!shouldSelect && index > -1) {
        selectedTopicIds.value.splice(index, 1);
      }
    }

    // Toggle subsection topics
    subsection.topics.forEach(t => {
      const index = selectedTopicIds.value.indexOf(t.no);
      if (shouldSelect && index === -1) {
        selectedTopicIds.value.push(t.no);
      } else if (!shouldSelect && index > -1) {
        selectedTopicIds.value.splice(index, 1);
      }
    });
  };

  // Updated filteredOrganizedTopics to handle the new structure
  const filteredOrganizedTopics = computed(() => {
    if (!topicsSearchQuery.value.trim()) return organizedTopics.value;

    const query = topicsSearchQuery.value.toLowerCase();

    return organizedTopics.value
      .map(unit => {
        // For lab sections, filter directTopics
        const filteredSections = unit.sections.map(section => {
          if (section.directTopics && section.directTopics.length > 0) {
            // This is likely a lab or general section
            return {
              ...section,
              directTopics: section.directTopics.filter(topic =>
                topic.displayName.toLowerCase().includes(query)
              )
            };
          } else {
            // This is a regular unit section with subsections
            return {
              ...section,
              subsections: Object.fromEntries(
                Object.entries(section.subsections)
                  .map(([key, subsection]) => [
                    key,
                    {
                      ...subsection,
                      topics: subsection.topics.filter(t =>
                        t.displayName.toLowerCase().includes(query)
                      )
                    }
                  ])
                  .filter(([key, subsection]) => subsection.topics.length > 0)
              )
            };
          }
        }).filter(section =>
          (section.directTopics && section.directTopics.length > 0) ||
          (section.subsections && Object.keys(section.subsections).length > 0)
        );

        return {
          ...unit,
          sections: filteredSections
        };
      })
      .filter(unit => unit.sections.length > 0);
  });


  // --- COMPUTED PROPERTIES & METHODS (No changes here, except confirmSubmit) ---

  const filteredStudents = computed(() => {
    if (!searchQuery.value.trim()) return students.value;
    const query = searchQuery.value.toLowerCase().trim();
    return students.value.filter(s => (s.student_name || '').toLowerCase().includes(query) || (s.custom_student_id || s.student || '').toLowerCase().includes(query));
  });

  const studentsWithoutStatus = computed(() => students.value.filter(s => !s.status));
  const studentsWithStatus = computed(() => students.value.filter(s => s.status));
  const allStudentsHaveStatus = computed(() => studentsWithStatus.value.length === students.value.length && students.value.length > 0);
  const someStudentsHaveStatus = computed(() => studentsWithStatus.value.length > 0 && !allStudentsHaveStatus.value);
  const unmarkedCount = computed(() => studentsWithoutStatus.value.filter(s => s.checked === null).length);
  const isSubmitDisabled = computed(() => allStudentsHaveStatus.value || isSubmitting.value || unmarkedCount.value > 0);
  const editablePresentCount = computed(() => studentsWithoutStatus.value.filter(s => s.checked === true).length);
  const editableAbsentCount = computed(() => studentsWithoutStatus.value.filter(s => s.checked === false).length);
  const alreadyPresentCount = computed(() => studentsWithStatus.value.filter(s => s.status === 'Present').length);
  const alreadyAbsentCount = computed(() => studentsWithStatus.value.filter(s => s.status === 'Absent').length);
  const totalPresentCount = computed(() => editablePresentCount.value + alreadyPresentCount.value);
  const totalAbsentCount = computed(() => editableAbsentCount.value + alreadyAbsentCount.value);

  const isStudentDisabled = (student) => !!student.status;
  const getPercentageClass = (percentage) => {
    if (percentage >= 85) return 'percentage-good';
    if (percentage >= 75) return 'percentage-average';
    return 'percentage-poor';
  };
  const clearSearch = () => { searchQuery.value = ''; };

  const toggleStudentAttendance = (student) => {
    if (isStudentDisabled(student)) return;
    if (student.checked === null) student.checked = true;
    else if (student.checked === true) student.checked = false;
    else student.checked = true;
  };

  const markAllAsPresent = () => studentsWithoutStatus.value.forEach(s => s.checked = true);
  const markAllAsAbsent = () => studentsWithoutStatus.value.forEach(s => s.checked = false);

  const openTopicsModal = () => {
    if (unmarkedCount.value > 0) return;
    showTopicsModal.value = true;
  };
  const closeTopicsModal = () => { showTopicsModal.value = false; };
  const confirmTopicsSelection = () => {
    showTopicsModal.value = false;
    showConfirmModal.value = true;
    // Reset completion checkboxes each time the modal opens
    completedTopicIds.value = [];
  };
  const closeConfirmModal = () => { showConfirmModal.value = false; };

  const toggleUnit = (unitName) => { expandedUnits.value[unitName] = !expandedUnits.value[unitName]; };
  const isUnitSelected = (unit) => {
    return unit.allTopicsInUnit.every(t => selectedTopicIds.value.includes(t.no));
  };
  const toggleUnitSelection = (unit) => {
    const shouldSelect = !isUnitSelected(unit);

    unit.allTopicsInUnit.forEach(t => {
      const index = selectedTopicIds.value.indexOf(t.no);
      if (shouldSelect && index === -1) {
        selectedTopicIds.value.push(t.no);
      } else if (!shouldSelect && index > -1) {
        selectedTopicIds.value.splice(index, 1);
      }
    });
  };

  const isSectionSelected = (section) => {
    const allSectionTopics = [];

    // Add section parent if exists
    if (section.topicId) {
      allSectionTopics.push({ no: section.topicId });
    }

    // Add direct topics
    allSectionTopics.push(...section.directTopics);

    // Add all subsection topics (both parent and children)
    Object.values(section.subsections).forEach(subsection => {
      if (subsection.topicId) {
        allSectionTopics.push({ no: subsection.topicId });
      }
      allSectionTopics.push(...subsection.topics);
    });

    return allSectionTopics.length > 0 && allSectionTopics.every(t => selectedTopicIds.value.includes(t.no));
  };

  const toggleSectionSelection = (section) => {
    const shouldSelect = !isSectionSelected(section);

    // Toggle section parent if exists
    if (section.topicId) {
      const index = selectedTopicIds.value.indexOf(section.topicId);
      if (shouldSelect && index === -1) {
        selectedTopicIds.value.push(section.topicId);
      } else if (!shouldSelect && index > -1) {
        selectedTopicIds.value.splice(index, 1);
      }
    }

    // Toggle direct topics
    section.directTopics.forEach(t => {
      const index = selectedTopicIds.value.indexOf(t.no);
      if (shouldSelect && index === -1) {
        selectedTopicIds.value.push(t.no);
      } else if (!shouldSelect && index > -1) {
        selectedTopicIds.value.splice(index, 1);
      }
    });

    // Toggle all subsections
    Object.values(section.subsections).forEach(subsection => {
      // Toggle subsection parent
      if (subsection.topicId) {
        const index = selectedTopicIds.value.indexOf(subsection.topicId);
        if (shouldSelect && index === -1) {
          selectedTopicIds.value.push(subsection.topicId);
        } else if (!shouldSelect && index > -1) {
          selectedTopicIds.value.splice(index, 1);
        }
      }

      // Toggle subsection topics
      subsection.topics.forEach(t => {
        const index = selectedTopicIds.value.indexOf(t.no);
        if (shouldSelect && index === -1) {
          selectedTopicIds.value.push(t.no);
        } else if (!shouldSelect && index > -1) {
          selectedTopicIds.value.splice(index, 1);
        }
      });
    });
  };

  const getSelectedTopicDetails = () => {
    const allSelectedTopics = (props.topics || [])
      .filter(t => selectedTopicIds.value.includes(t.no))
      .map(t => ({ ...t, displayName: formatTopicNameForDisplay(t.topic_name || t.topic) }));

    // Filter out parent topics - only show leaf/child topics that teachers actually teach
    const leafTopics = allSelectedTopics.filter(topic => {
      const topicName = topic.topic_name || topic.topic || '';
      const match = topicName.match(/^(UNIT-[IVX]+)(?:-([A-Z]))?(?:-(\d+))?-(.*)$/);

      if (!match) return true; // Include non-standard topics

      const unitKey = match[1];
      const sectionKey = match[2];
      const subsectionKey = match[3];

      // Hide unit-level parents (UNIT-I-Database Concepts)
      if (!sectionKey && !subsectionKey) return false;

      // Hide section-level parents (UNIT-I-A-Introduction to Database Concepts)
      if (sectionKey && !subsectionKey) return false;

      // Show subsection-level topics and below (UNIT-I-A-1-Characteristics, etc.)
      return true;
    });

    return leafTopics;
  };

  // --- SUBMISSION LOGIC (The only function that changes) ---

  const submitAttendance = () => {
    if (isSubmitDisabled.value) return;
    openTopicsModal();
  };

  /**
   * UPDATED: Builds the payload based on the final confirmation checkboxes.
   */
  const confirmSubmit = () => {
    closeConfirmModal();
    isSubmitting.value = true;

    // Get all topics that were selected (including parents)
    const allSelectedTopics = (props.topics || [])
      .filter(topic => selectedTopicIds.value.includes(topic.no));

    // Separate parent topics from leaf topics
    const parentTopics = [];
    const leafTopics = [];

    allSelectedTopics.forEach(topic => {
      const topicName = topic.topic_name || topic.topic || '';
      const match = topicName.match(/^(UNIT-[IVX]+)(?:-([A-Z]))?(?:-(\d+))?-(.*)$/);

      if (!match) {
        leafTopics.push(topic);
        return;
      }

      const unitKey = match[1];
      const sectionKey = match[2];
      const subsectionKey = match[3];

      // Classify as parent or leaf
      if ((!sectionKey && !subsectionKey) || (sectionKey && !subsectionKey)) {
        parentTopics.push(topic);
      } else {
        leafTopics.push(topic);
      }
    });

    // Build the payload with intelligent parent completion
    const taughtTopics = [];

    // Add leaf topics with their completion status from the modal
    leafTopics.forEach(topic => {
      taughtTopics.push({
        topic: topic.topic || topic.topic_name,
        completed: completedTopicIds.value.includes(topic.no)
      });
    });

    // Add parent topics with auto-completion logic
    parentTopics.forEach(parentTopic => {
      const topicName = parentTopic.topic_name || parentTopic.topic || '';
      const match = topicName.match(/^(UNIT-[IVX]+)(?:-([A-Z]))?(?:-(\d+))?-(.*)$/);

      if (!match) {
        // Non-standard parent topic - mark as completed if selected
        taughtTopics.push({
          topic: parentTopic.topic || parentTopic.topic_name,
          completed: completedTopicIds.value.includes(parentTopic.no)
        });
        return;
      }

      const unitKey = match[1];
      const sectionKey = match[2];
      const subsectionKey = match[3];

      // Auto-complete parent topics based on their children's completion
      let shouldComplete = false;

      if (!sectionKey && !subsectionKey) {
        // Unit-level parent: complete if all its child sections/subsections are completed
        const unitChildren = leafTopics.filter(child => {
          const childName = child.topic_name || child.topic || '';
          return childName.startsWith(unitKey + '-');
        });

        const unitChildrenSelected = unitChildren.filter(child =>
          selectedTopicIds.value.includes(child.no)
        );

        const unitChildrenCompleted = unitChildren.filter(child =>
          completedTopicIds.value.includes(child.no)
        );

        // Complete if all selected children of this unit are completed
        shouldComplete = unitChildrenSelected.length > 0 &&
          unitChildrenSelected.every(child => completedTopicIds.value.includes(child.no));

      } else if (sectionKey && !subsectionKey) {
        // Section-level parent: complete if all its subsections are completed
        const sectionChildren = leafTopics.filter(child => {
          const childName = child.topic_name || child.topic || '';
          return childName.startsWith(`${unitKey}-${sectionKey}-`);
        });

        const sectionChildrenSelected = sectionChildren.filter(child =>
          selectedTopicIds.value.includes(child.no)
        );

        // Complete if all selected children of this section are completed
        shouldComplete = sectionChildrenSelected.length > 0 &&
          sectionChildrenSelected.every(child => completedTopicIds.value.includes(child.no));
      }

      taughtTopics.push({
        topic: parentTopic.topic || parentTopic.topic_name,
        completed: shouldComplete
      });
    });

    console.log('Topics being submitted:', taughtTopics);

    const requestData = {
      students_present: JSON.stringify(students.value.filter(s => !s.status && s.checked === true).map(s => ({ student: s.student, student_name: s.student_name }))),
      students_absent: JSON.stringify(students.value.filter(s => !s.status && s.checked === false).map(s => ({ student: s.student, student_name: s.student_name }))),
      student_group: props.courseInfo.studentGroup || '',
      course_schedule: props.courseInfo.allScheduleId || props.courseInfo.scheduleId,
      taught_topics: JSON.stringify(taughtTopics),
      course_completed: isCourseCompleted.value
    };

    submitAttendanceResource.submit(requestData);
  };

  const submitAttendanceResource = createResource({
    url: 'srkr_frappe_app_api.instructor.api.mark_attendances',
    method: 'POST',
    onSuccess: () => {
      successTitle.value = 'Success';
      successMessage.value = 'Attendance has been marked successfully.';
      showSuccessModal.value = true;
    },
    onError: (err) => {
      errorTitle.value = 'Submission Failed';
      errorMessage.value = err.message || 'An unknown error occurred.';
      showErrorModal.value = true;
    },
    onFinish: () => { isSubmitting.value = false; }
  });

  const closeSuccessModal = () => {
    showSuccessModal.value = false;
    emit('refresh-data');
  };
  const closeErrorModal = () => { showErrorModal.value = false; };

  onMounted(() => {
    if (organizedTopics.value.length > 0) {
      expandedUnits.value[organizedTopics.value[0].unitName] = true;
    }
  });

  // Auto-selection watcher - updated version
  const checkAutoSelection = () => {
    organizedTopics.value.forEach(unit => {
      // Check if all unit topics are selected to auto-select unit
      if (unit.topicId && !selectedTopicIds.value.includes(unit.topicId)) {
        const unitTopicsWithoutParent = unit.allTopicsInUnit.filter(t => t.no !== unit.topicId);
        if (unitTopicsWithoutParent.length > 0 && unitTopicsWithoutParent.every(t => selectedTopicIds.value.includes(t.no))) {
          selectedTopicIds.value.push(unit.topicId);
        }
      }

      unit.sections.forEach(section => {
        // Check if all section content is selected to auto-select section parent
        if (section.topicId && !selectedTopicIds.value.includes(section.topicId)) {
          const allSectionContent = [
            ...section.directTopics,
            ...Object.values(section.subsections).flatMap(sub => {
              const items = [...sub.topics];
              if (sub.topicId) items.push({ no: sub.topicId });
              return items;
            })
          ];

          if (allSectionContent.length > 0 && allSectionContent.every(t => selectedTopicIds.value.includes(t.no))) {
            selectedTopicIds.value.push(section.topicId);
          }
        }
      });
    });
  };

  // Watch for changes in selectedTopicIds to trigger auto-selection
  watch(selectedTopicIds, () => {
    nextTick(() => {
      checkAutoSelection();
    });
  }, { deep: true });
</script>

<style scoped>
  /* Base styles */
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

  /* Search Section */
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

  /* Students List */
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

  /* Student Percentage Display */
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

  /* Submit Section */
  .submit-section {
    padding: 1rem;
    position: sticky;
    bottom: 0;
    background: #f8fafc;
    border-top: 1px solid #e5e7eb;
  }

  .submit-button {
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

  .modal-content {
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    max-width: 400px;
    width: 100%;
  }

  .modal-content.topics-modal {
    max-width: 600px;
    max-height: 85vh;
    min-height: 85vh;
    display: flex;
    flex-direction: column;
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
    max-height: 600px;
    overflow: auto;
  }

  .modal-body p {
    margin: 0 0 0.5rem 0;
    color: #374151;
    font-size: 0.9rem;
  }

  /* Topics Modal Specific Styles */
  .topics-modal-body {
    overflow-y: auto;
    /* max-height: 60vh; */
  }

  .topics-instruction {
    color: #6b7280;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .course-completion-section {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #f9fafb;
    border-radius: 0.5rem;
  }

  .course-completion-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    color: #374151;
  }

  .course-checkbox {
    width: 18px;
    height: 18px;
  }

  .checkbox-text {
    font-weight: 500;
  }

  .topics-search-container {
    position: relative;
    margin-bottom: 1rem;
  }

  .search-icon-small {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 0.875rem;
    height: 0.875rem;
    color: #9ca3af;
  }

  .topics-search-input {
    width: 100%;
    padding: 0.5rem 0.5rem 0.5rem 2rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.2s;
  }

  .topics-search-input:focus {
    border-color: #3b82f6;
  }

  /* Topics Hierarchy */
  .topics-hierarchy {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .unit-section {
    border-bottom: 1px solid #e5e7eb;
  }

  .unit-section:last-child {
    border-bottom: none;
  }

  .unit-header {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    background: #f9fafb;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .unit-header:hover {
    background: #f3f4f6;
  }

  .unit-chevron {
    width: 1rem;
    height: 1rem;
    color: #6b7280;
    margin-right: 0.5rem;
    transition: transform 0.2s;
  }

  .unit-checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    cursor: pointer;
  }

  .unit-title {
    font-weight: 600;
    color: #1f2937;
    font-size: 0.95rem;
  }

  .unit-count {
    color: #6b7280;
    font-size: 0.85rem;
    margin-left: 0.5rem;
  }

  .unit-topics {
    background: white;
    padding: 0.5rem 0;
  }

  .section-group {
    border-top: 1px solid #f3f4f6;
  }

  .section-group:first-child {
    border-top: none;
  }

  .section-header {
    /* padding: 0.5rem 1rem 0.5rem 1rem; */
    background: #eef1f3;
  }

  .section-checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .section-title {
    font-weight: 500;
    color: #374151;
    font-size: 0.9rem;
  }

  .topic-items {
    padding: 0.25rem 0;
  }

  .unit-group {
    margin-bottom: 1.25rem;
  }

  .unit-title {
    font-size: 1rem;
    font-weight: bold;
    /* margin-bottom: 0.5rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #e0e0e0; */
  }

  .topic-item-label {
    display: block;
    /* Makes each checkbox appear on a new line */
    padding: 4px 0;
  }

  .topic-item-label:hover {
    background: #f9fafb;
  }

  .topic-item-label.subsection-topic {
    padding-left: 2rem;
  }

  .topic-checkbox {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .topic-name {
    font-size: 0.875rem;
    color: #374151;
    line-height: 1.4;
    padding-left: 5px;
  }

  .no-topics-found {
    padding: 2rem;
    text-align: center;
    color: #6b7280;
    font-size: 0.9rem;
  }

  .selected-topics-summary {
    margin-top: 1rem;
    padding: 0.75rem;
    background: #eff6ff;
    border-radius: 0.5rem;
    text-align: center;
  }

  .summary-text {
    font-size: 0.9rem;
    color: #1e40af;
    font-weight: 500;
  }

  /* Selected Topics List */
  .selected-topics-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .fallback-topics-list {
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
  }

  .fallback-notice {
    font-size: 0.85rem;
    color: #6b7280;
    margin-bottom: 1rem;
    font-style: italic;
  }

  .no-topics-selected {
    color: #6b7280;
    font-style: italic;
    font-size: 0.9rem;
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

  .modal-button.primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Success and Error Icons */
  .error-icon,
  .success-icon {
    display: flex;
    align-items: center;
  }

  /* Submission Sections in Confirmation Modal */
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
    /* margin: 0 0 0.5rem 0; */
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

  /* Add these styles to your <style scoped> block */
  .topic-completion-list {
    margin-top: 0.5rem;
  }

  .completion-instruction {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    /* Space between icon and text */
    padding: 0.25rem;
    background-color: #ff6060;
    /* Light grey background, consistent with other UI elements */
    border-radius: 0.5rem;
    font-size: 0.875rem;
    /* 14px for better readability */
    font-weight: 500;
    color: #ffffff !important;
    margin-bottom: 1rem;
  }

  .instruction-icon {
    width: 1rem;
    /* 16px */
    height: 1rem;
    /* 16px */
    color: #ffffff;
    flex-shrink: 0;
    /* Prevents the icon from shrinking */
  }

  .topic-completion-item {
    margin-bottom: 0.5rem;
  }

  .topic-completion-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: background-color 0.2s;
  }

  .topic-completion-label:hover {
    background-color: #f9fafb;
  }

  .completion-topic-name {
    font-size: 0.9rem;
    color: #374151;
  }

  /* Add these missing CSS styles to your existing <style scoped> section */

  /* Unit Content */
  .unit-content {
    background: white;
  }

  /* Unit Parent Topic */
  .unit-parent-topic {
    padding: 0.5rem 1rem;
    background: #fafbfc;
    border-bottom: 1px solid #f1f5f9;
  }

  /* Section Styles */
  .section-toggle {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem 0.75rem 2rem;
    cursor: pointer;
    transition: background-color 0.2s;
    background: #eef1f3;
  }

  .section-toggle:hover {
    background: #f1f5f9;
  }

  .section-chevron {
    width: 1rem;
    height: 1rem;
    color: #64748b;
    margin-right: 0.5rem;
    transition: transform 0.2s;
    flex-shrink: 0;
  }

  .section-content {
    background: white;
  }

  /* Direct Topics */
  .direct-topics {
    padding: 0.25rem 0;
  }

  /* Subsections */
  .subsections {
    margin-top: 0.25rem;
  }

  .subsection-group {
    border-top: 1px solid #f3f4f6;
  }

  .subsection-group:first-child {
    border-top: none;
  }

  .subsection-header {
    background: #f9fafb;
  }

  .subsection-toggle {
    display: flex;
    align-items: center;
    padding: 0.625rem 1rem 0.625rem 3rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .subsection-toggle:hover {
    background: #f3f4f6;
  }

  .subsection-chevron {
    width: 0.875rem;
    height: 0.875rem;
    color: #64748b;
    margin-right: 0.5rem;
    transition: transform 0.2s;
    flex-shrink: 0;
  }

  .subsection-checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    cursor: pointer;
    font-weight: 500;
  }

  .subsection-title {
    font-weight: 500;
    color: #4b5563;
    font-size: 0.9rem;
  }

  .subsection-content {
    background: #f6f6f6;
    padding: 0.25rem 0;
  }

  .subsection-topics {
    padding: 0.25rem 0;
  }

  /* Topic Items with Different Levels */
  .topic-item-label {
    display: flex !important;
    /* Override the existing block display */
    align-items: flex-start;
    gap: 0.75rem;
    /* padding: 0.5rem 1rem; */
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 0.875rem;
    line-height: 1.4;
  }

  /* Level-based indentation - IMPORTANT: These override existing styles */
  .topic-item-label.level-1 {
    padding-left: 2.5rem !important;
    background: #fafbfc;
    border-left: 3px solid #3b82f6;
    margin-bottom: 0.25rem;
  }

  .topic-item-label.level-2 {
    padding-left: 3.5rem !important;
    border-left: 2px solid #e5e7eb;
  }

  .topic-item-label.level-3 {
    padding-left: 4.5rem !important;
    background: #f6f6f6;
    border-left: 2px solid #10b981;
    font-weight: 600;
    color: #1e293b;
  }

  .topic-item-label.level-4 {
    padding-left: 5.5rem !important;
    border-left: 1px solid #e5e7eb;
  }

  .topic-checkbox {
    width: 18px !important;
    /* Override existing 16px */
    height: 18px !important;
    flex-shrink: 0;
    margin-top: 0.125rem;
    accent-color: #3b82f6;
  }

  .topic-name {
    color: #374151;
    line-height: 1.4;
    word-break: break-word;
    flex: 1;
    padding-left: 0 !important;
    /* Remove existing padding-left: 5px */
  }

  .topic-name.parent-topic {
    font-weight: 600;
    color: #1e293b;
  }

  /* Hover effects for different levels */
  .topic-item-label.level-1:hover {
    background: #f1f5f9 !important;
  }

  .topic-item-label.level-2:hover {
    background: #f9fafb !important;
  }

  .topic-item-label.level-3:hover {
    background: #f1f5f9 !important;
  }

  .topic-item-label.level-4:hover {
    background: #f9fafb !important;
  }

  /* Selected state styling */
  .topic-item-label:has(input:checked) {
    background: #eff6ff !important;
  }

  .topic-item-label:has(input:checked) .topic-name {
    color: #1d4ed8;
    font-weight: 500;
  }

  /* Better unit header styling */
  .unit-header {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
    border-bottom: 2px solid #e2e8f0;
    font-weight: 600;
  }

  .unit-chevron {
    width: 1.25rem !important;
    height: 1.25rem !important;
    color: #64748b;
    margin-right: 0.75rem;
    transition: transform 0.2s;
    flex-shrink: 0;
  }

  /* Section header improvements */
  .section-toggle {
    border-left: 3px solid transparent;
    transition: all 0.2s;
  }

  .section-toggle:hover {
    border-left-color: #3b82f6;
  }

  /* Compact mode for smaller screens */
  @media (max-width: 640px) {
    .topic-item-label.level-1 {
      padding-left: 1.5rem !important;
    }

    .topic-item-label.level-2 {
      padding-left: 2rem !important;
    }

    .topic-item-label.level-3 {
      padding-left: 2.5rem !important;
    }

    .topic-item-label.level-4 {
      padding-left: 3rem !important;
    }

    .section-toggle {
      padding-left: 1rem !important;
    }

    .subsection-toggle {
      padding-left: 2rem !important;
    }

    .unit-header {
      padding: 0.75rem;
    }

    .section-toggle {
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
    }

    .subsection-toggle {
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
    }
  }

  /* Add this CSS to your existing styles */

  .parent-topics-note {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.75rem;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 0.5rem;
    border-left: 3px solid #3b82f6;
  }

  .note-text {
    font-size: 0.875rem;
    color: #1e40af;
    line-height: 1.4;
    flex: 1;
  }
</style>