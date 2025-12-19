import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '仪表盘', icon: 'home' }
  },
  {
    path: '/roadmap',
    name: 'Roadmap',
    component: () => import('@/views/Roadmap.vue'),
    meta: { title: '学习大纲', icon: 'roadmap' }
  },
  {
    path: '/plan',
    name: 'PlanGenerator',
    component: () => import('@/views/PlanGenerator.vue'),
    meta: { title: 'AI 规划', icon: 'ai' }
  },
  {
    path: '/tasks',
    name: 'DailyTask',
    component: () => import('@/views/DailyTask.vue'),
    meta: { title: '每日任务', icon: 'tasks' }
  },
  {
    path: '/review',
    name: 'Review',
    component: () => import('@/views/Review.vue'),
    meta: { title: '每日复盘', icon: 'review' }
  },
  {
    path: '/notes',
    name: 'Notes',
    component: () => import('@/views/Notes.vue'),
    meta: { title: '笔记链接', icon: 'notes' }
  },
  {
    path: '/progress',
    name: 'Progress',
    component: () => import('@/views/Progress.vue'),
    meta: { title: '进度统计', icon: 'progress' }
  },
  {
    path: '/resources',
    name: 'Resources',
    component: () => import('@/views/Resources.vue'),
    meta: { title: '学习资源', icon: 'resources' }
  },
  {
    path: '/extra',
    name: 'ExtraLearning',
    component: () => import('@/views/ExtraLearning.vue'),
    meta: { title: '额外学习', icon: 'extra' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: { title: '系统设置', icon: 'settings' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '12WeekDev'} - 12周学习计划`
  next()
})

export default router

