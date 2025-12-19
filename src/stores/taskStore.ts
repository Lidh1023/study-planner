import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Task, NoteLink } from '@/types/database'
import { getToday, getDayNumber } from '@/utils/dateUtils'

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])
  const noteLinks = ref<NoteLink[]>([])
  const loading = ref(false)
  const currentDate = ref(getToday())
  const currentDayNumber = ref(getDayNumber(getToday()))

  // 获取当天任务（按 day 字段匹配，而不是 date）
  const todayTasks = computed(() => {
    return tasks.value.filter(t => t.day === currentDayNumber.value)
  })

  // 获取当天算法任务
  const algorithmTasks = computed(() => {
    return todayTasks.value.filter(t => t.type === 'algorithm')
  })

  // 获取当天学习任务
  const studyTasks = computed(() => {
    return todayTasks.value.filter(t => t.type === 'study')
  })

  // 获取当天完成率
  const todayProgress = computed(() => {
    if (todayTasks.value.length === 0) return 0
    const completed = todayTasks.value.filter(t => t.completed).length
    return Math.round((completed / todayTasks.value.length) * 100)
  })

  // 获取总完成率
  const totalProgress = computed(() => {
    if (tasks.value.length === 0) return 0
    const completed = tasks.value.filter(t => t.completed).length
    return Math.round((completed / tasks.value.length) * 100)
  })

  // 获取任务的笔记链接
  const getTaskNotes = (taskId: string) => {
    return noteLinks.value.filter(n => n.task_id === taskId)
  }

  // 加载所有任务
  async function loadTasks() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('date', { ascending: true })
        .order('type', { ascending: true })

      if (error) throw error
      tasks.value = data || []
    } catch (error) {
      console.error('加载任务失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 加载指定日期的任务（根据日期计算 dayNumber，按 day 字段查询）
  async function loadTasksByDate(date: string) {
    loading.value = true
    currentDate.value = date
    const dayNumber = getDayNumber(date)
    currentDayNumber.value = dayNumber
    
    // 如果日期不在计划范围内，清空任务
    if (dayNumber === 0) {
      tasks.value = tasks.value.filter(t => t.day !== dayNumber)
      loading.value = false
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('day', dayNumber)
        .order('type', { ascending: true })

      if (error) throw error
      
      // 更新 tasks 中对应 day 的数据
      tasks.value = tasks.value.filter(t => t.day !== dayNumber)
      tasks.value.push(...(data || []))
    } catch (error) {
      console.error('加载任务失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 切换任务完成状态
  async function toggleTask(taskId: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    const newCompleted = !task.completed
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null
        })
        .eq('id', taskId)

      if (error) throw error
      
      task.completed = newCompleted
      task.completed_at = newCompleted ? new Date().toISOString() : null
    } catch (error) {
      console.error('更新任务失败:', error)
    }
  }

  // 加载笔记链接
  async function loadNoteLinks() {
    try {
      const { data, error } = await supabase
        .from('note_links')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      noteLinks.value = data || []
    } catch (error) {
      console.error('加载笔记链接失败:', error)
    }
  }

  // 添加笔记链接
  async function addNoteLink(noteLink: Omit<NoteLink, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('note_links')
        .insert(noteLink)
        .select()
        .single()

      if (error) throw error
      if (data) noteLinks.value.unshift(data)
      return data
    } catch (error) {
      console.error('添加笔记链接失败:', error)
      throw error
    }
  }

  // 删除笔记链接
  async function deleteNoteLink(id: string) {
    try {
      const { error } = await supabase
        .from('note_links')
        .delete()
        .eq('id', id)

      if (error) throw error
      noteLinks.value = noteLinks.value.filter(n => n.id !== id)
    } catch (error) {
      console.error('删除笔记链接失败:', error)
      throw error
    }
  }

  // 获取周统计数据
  async function getWeekStats(weekNumber: number) {
    const startDay = (weekNumber - 1) * 7 + 1
    const endDay = weekNumber * 7
    
    const weekTasks = tasks.value.filter(t => {
      const taskDay = getDayNumber(t.date)
      return taskDay >= startDay && taskDay <= endDay
    })
    
    const completed = weekTasks.filter(t => t.completed).length
    const total = weekTasks.length
    
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }

  return {
    tasks,
    noteLinks,
    loading,
    currentDate,
    todayTasks,
    algorithmTasks,
    studyTasks,
    todayProgress,
    totalProgress,
    getTaskNotes,
    loadTasks,
    loadTasksByDate,
    toggleTask,
    loadNoteLinks,
    addNoteLink,
    deleteNoteLink,
    getWeekStats
  }
})
