<template>
  <div
    class="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-gray-200 bg-white shadow-top"
  >
    <router-link
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      class="flex h-full flex-1 flex-col items-center justify-center px-2 py-1 text-center text-gray-600 hover:bg-gray-100 focus:outline-none"
      active-class="text-blue-600"
    >
      <component :is="link.icon" class="mb-0.5 h-6 w-6 flex-shrink-0" />
      <span class="text-xs">{{ link.label }}</span>
    </router-link>
  </div>
</template>

<script setup>
import {
  LayoutDashboard,
  CalendarCheck,
  GraduationCap,
  Banknote,
  UserCheck,
  BookOpen,
  LucideHome,
  User2,
  PieChart, // Renamed from HomeIcon to LucideHome for consistency
} from 'lucide-vue-next';

// Define the navigation links directly in the component
// or accept them as a prop if you prefer to manage them from a parent component.
const links = [
  {
    label: 'Home',
    to: '/home',
    icon: LucideHome,
  },
  {
    label: 'Schedule',
    to: '/schedule',
    icon: CalendarCheck,
  },
  {
    label: 'Mentor',
    to: '/mentor',
    icon: UserCheck,
  },
  {
    label: 'Analytics',
    to: '/analytics', // analytics icon below
    icon: PieChart,
  },
  {
    label: 'Profile',
    to: '/profile',
    icon: User2,
  },
  // Add other links as needed, e.g., Profile, Notes
  // {
  //   label: 'Notes',
  //   to: '/notes',
  //   icon: BookOpen,
  // },
];

// No need for isSidebarCollapsed or educationSettings in this component
// as it's specifically for a fixed bottom navigation.
</script>

<style scoped>
/* Custom style for the top shadow, as Tailwind doesn't have a direct utility for shadow-top */
.shadow-top {
  box-shadow: 0 -2px 4px -1px rgba(0, 0, 0, 0.06),
    0 -4px 5px -1px rgba(0, 0, 0, 0.1);
}

/* Style for the active link */
.router-link-exact-active,
.router-link-active {
  /* Tailwind's active-class prop handles this, but you can add more specific styles here if needed */
  /* For example, to make the icon and text bolder or change background */
}
</style>
