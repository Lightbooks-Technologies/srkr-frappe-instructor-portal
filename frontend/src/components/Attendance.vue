<template>
  <div class="attendance-page">
    <!-- Header -->
    <div class="header">
      <button @click="$router.go(-1)" class="back-button">
        <FeatherIcon name="arrow-left" class="w-5 h-5" />
      </button>
      <div class="header-info">
        <h1 class="course-title">{{ courseInfo.name }}</h1>
        <p class="course-details">{{ courseInfo.date }} → {{ courseInfo.time }}</p>
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
            <input 
              type="text" 
              v-model="topicsSearchQuery"
              placeholder="Search topics..."
              class="topics-search-input"
            />
          </div>

          <!-- Topics List with Hierarchy or Fallback -->
          <div v-if="organizedTopics && organizedTopics.length > 0" class="topics-hierarchy">
            <div v-for="unit in (topicsSearchQuery ? filteredOrganizedTopics : organizedTopics)" :key="unit.unitName" class="unit-section">
              <!-- Unit Header -->
              <div class="unit-header" @click="toggleUnit(unit.unitName)">
                <FeatherIcon 
                  :name="expandedUnits[unit.unitName] ? 'chevron-down' : 'chevron-right'" 
                  class="unit-chevron"
                />
                <label class="unit-checkbox-label">
                  <input 
                    type="checkbox" 
                    :checked="isUnitSelected(unit)"
                    @change="toggleUnitSelection(unit)"
                    @click.stop
                    class="topic-checkbox"
                  />
                  <span class="unit-title">{{ unit.displayName }}</span>
                  <span class="unit-count">({{ unit.allTopicsInUnit.length }} topics)</span>
                </label>
              </div>

              <!-- Unit Topics -->
              <div v-if="expandedUnits[unit.unitName]" class="unit-topics">
                <div v-for="section in unit.sections" :key="section.sectionName || 'main'" class="section-group">
                  <!-- Section Header (if exists) -->
                  <div v-if="section.displayName" class="section-header">
                    <label class="section-checkbox-label">
                      <input 
                        type="checkbox" 
                        :checked="isSectionSelected(section)"
                        @change="toggleSectionSelection(section)"
                        @click.stop
                        class="topic-checkbox"
                      />
                      <span class="section-title">{{ section.displayName }}</span>
                    </label>
                  </div>

                  <!-- Topic Items -->
                  <div class="topic-items">
                    <label 
                      v-for="topic in section.topics" 
                      :key="topic.no"
                      class="topic-item-label"
                      :class="{ 'subsection-topic': section.sectionName && section.sectionName !== '' }"
                    >
                      <input 
                        type="checkbox" 
                        v-model="selectedTopicIds"
                        :value="topic.no"
                        class="topic-checkbox"
                      />
                      <span class="topic-name" :title="topic.originalName">{{ topic.displayName }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- No search results in organized view -->
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
                    <input 
                      type="checkbox" 
                      v-model="selectedTopicIds"
                      :value="topic.no"
                      class="topic-checkbox"
                    />
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
          <button 
            @click="confirmTopicsSelection" 
            class="modal-button primary"
          >
            Continue {{ selectedTopicIds.length === 0 ? '(No topics selected)' : '' }}
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
            
            <div v-if="selectedTopicIds.length > 0" class="topic-completion-list">
              <p class="completion-instruction">
                <FeatherIcon name="info" class="instruction-icon" />
                <span>Mark completed topics:</span>
              </p>
              <div 
                v-for="topic in getSelectedTopicDetails()" 
                :key="topic.no"
                class="topic-completion-item"
              >
                <label class="topic-completion-label">
                  <input 
                    type="checkbox"
                    v-model="completedTopicIds"
                    :value="topic.no"
                    class="topic-checkbox"
                  />
                  <span class="completion-topic-name">{{ topic.displayName }}</span>
                </label>
              </div>
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

// Watch for changes in props.students
watch(() => props.students, (newStudents) => {
  students.value = (newStudents || []).map(student => ({
    ...student,
    checked: student.status ? student.status === 'Present' : true
  }));
}, { immediate: true, deep: true })


// --- HELPER & TOPIC ORGANIZATION FUNCTIONS (No changes here) ---

const formatTopicNameForDisplay = (topicName) => {
  if (typeof topicName !== 'string') return '';
  const match = topicName.match(/^(?:UNIT-[IVX]+(?:-[A-Z])?(?:-\d+)?-)?(.*)$/);
  return match ? (match[1] || topicName) : topicName;
};

const organizeTopics = (topicsList) => {
  if (!topicsList || topicsList.length === 0) return [];
  const units = {};
  const topicRegex = /^(UNIT-[IVX]+)(?:-([A-Z]))?(?:-\d+)?-(.*)$/;

  topicsList.forEach(topic => {
    const topicName = topic.topic_name || topic.topic || '';
    const match = topicName.match(topicRegex);
    let unitKey, sectionKey, displayName, unitNumber;

    if (match) {
      unitKey = match[1];
      sectionKey = match[2] || 'main';
      displayName = match[3];
      unitNumber = unitKey.split('-')[1];
    } else {
      unitKey = 'General';
      sectionKey = 'main';
      displayName = topicName;
      unitNumber = '';
    }

    if (!units[unitKey]) {
      units[unitKey] = {
        unitName: unitKey,
        displayName: unitKey === 'General' ? 'General Topics' : `Unit ${unitNumber}`,
        allTopicsInUnit: [],
        sections: {}
      };
    }
    if (!units[unitKey].sections[sectionKey]) {
      let sectionDisplayName = sectionKey === 'main' ? '' : `Section ${sectionKey}`;
      if (unitKey === 'General' && sectionKey === 'main') {
        sectionDisplayName = 'Select All';
      }
      units[unitKey].sections[sectionKey] = {
        sectionName: sectionKey,
        displayName: sectionDisplayName,
        topics: []
      };
    }
    const formattedTopic = { ...topic, originalName: topicName, displayName };
    units[unitKey].sections[sectionKey].topics.push(formattedTopic);
    units[unitKey].allTopicsInUnit.push(formattedTopic);
  });
  
  const romanToNum = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5 };
  return Object.values(units)
    .sort((a, b) => {
        if (a.unitName === 'General') return -1;
        if (b.unitName === 'General') return 1;
        return (romanToNum[a.unitName.split('-')[1]] || 0) - (romanToNum[b.unitName.split('-')[1]] || 0);
    })
    .map(unit => ({
      ...unit,
      sections: Object.values(unit.sections).filter(s => s.topics.length > 0).sort((a, b) => a.sectionName.localeCompare(b.sectionName))
    }))
    .filter(unit => unit.allTopicsInUnit.length > 0);
};

const organizedTopics = computed(() => organizeTopics(props.topics));

const filteredOrganizedTopics = computed(() => {
  if (!topicsSearchQuery.value.trim()) return organizedTopics.value;
  const query = topicsSearchQuery.value.toLowerCase();
  return organizedTopics.value
    .map(unit => ({
      ...unit,
      sections: unit.sections.map(section => ({...section, topics: section.topics.filter(t => t.displayName.toLowerCase().includes(query))})).filter(s => s.topics.length > 0)
    }))
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
const isUnitSelected = (unit) => unit.allTopicsInUnit.every(t => selectedTopicIds.value.includes(t.no));
const toggleUnitSelection = (unit) => {
  const shouldSelect = !isUnitSelected(unit);
  unit.allTopicsInUnit.forEach(t => {
    const index = selectedTopicIds.value.indexOf(t.no);
    if (shouldSelect && index === -1) selectedTopicIds.value.push(t.no);
    else if (!shouldSelect && index > -1) selectedTopicIds.value.splice(index, 1);
  });
};

const isSectionSelected = (section) => section.topics.every(t => selectedTopicIds.value.includes(t.no));
const toggleSectionSelection = (section) => {
  const isSelected = isSectionSelected(section);
  section.topics.forEach(t => {
    const index = selectedTopicIds.value.indexOf(t.no);
    if (!isSelected && index === -1) selectedTopicIds.value.push(t.no);
    else if (isSelected && index > -1) selectedTopicIds.value.splice(index, 1);
  });
};

const getSelectedTopicDetails = () => (props.topics || [])
  .filter(t => selectedTopicIds.value.includes(t.no))
  .map(t => ({ ...t, displayName: formatTopicNameForDisplay(t.topic_name || t.topic) }));


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

  // Build the payload for ONLY the topics that were covered in this session
  const taughtTopics = (props.topics || [])
    .filter(topic => selectedTopicIds.value.includes(topic.no))
    .map(topic => {
      return {
        topic: topic.topic || topic.topic_name,
        // 'completed' is true only if it was checked in the final modal
        completed: completedTopicIds.value.includes(topic.no)
      };
    });
  
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
  padding: 0.5rem 1rem 0.5rem 1rem;
  background: #fafbfc;
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
  display: block; /* Makes each checkbox appear on a new line */
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
  gap: 0.65rem; /* Space between icon and text */
  padding: 0.25rem;
  background-color: #ff6060; /* Light grey background, consistent with other UI elements */
  border-radius: 0.5rem;
  font-size: 0.875rem; /* 14px for better readability */
  font-weight: 500;
  color: #ffffff !important;
  margin-bottom: 1rem;
}

.instruction-icon {
  width: 1rem;  /* 16px */
  height: 1rem; /* 16px */
  color: #ffffff;
  flex-shrink: 0; /* Prevents the icon from shrinking */
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
</style>