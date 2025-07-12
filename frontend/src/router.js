import { createRouter, createWebHistory } from 'vue-router'
import { usersStore } from '@/stores/user'
import { sessionStore } from '@/stores/session'
import { studentStore } from '@/stores/student'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
  },
    {
    path: '/home',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: () => import('@/pages/Schedule.vue'),
  },
  {
    path: '/attendance',
    name: 'Attendance',
    component: () => import('@/pages/Attendance.vue'),
  },
    {
    path: '/mentor',
    name: 'Mentor',
    component: () => import('@/pages/Mentor.vue'),
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/Profile.vue'),
  },
]

let router = createRouter({
  history: createWebHistory('/instructor'),
  routes,
})

router.beforeEach(async (to, from) => {
  const { isLoggedIn, user: sessionUser } = sessionStore()
  const { user } = usersStore()
  const { student } = studentStore()

  if (!isLoggedIn) {
    window.location.href = '/login'
    return await next(false)
  }

  if (user.data.length === 0) {
    await user.reload()
  }
  await student.reload()
})

export default router
