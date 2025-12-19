import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Milestone } from '@/types/database'
import { getDaysRemaining } from '@/utils/dateUtils'

export const useMilestoneStore = defineStore('milestone', () => {
  const milestones = ref<Milestone[]>([])
  const loading = ref(false)

  // 获取下一个未完成的里程碑
  const nextMilestone = computed(() => {
    return milestones.value.find(m => !m.completed)
  })

  // 获取已完成的里程碑数量
  const completedCount = computed(() => {
    return milestones.value.filter(m => m.completed).length
  })

  // 加载所有里程碑
  async function loadMilestones() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .order('week', { ascending: true })

      if (error) throw error
      milestones.value = data || []
    } catch (error) {
      console.error('加载里程碑失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 切换里程碑完成状态
  async function toggleMilestone(id: string) {
    const milestone = milestones.value.find(m => m.id === id)
    if (!milestone) return

    const newCompleted = !milestone.completed

    try {
      const { error } = await supabase
        .from('milestones')
        .update({
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null
        })
        .eq('id', id)

      if (error) throw error

      milestone.completed = newCompleted
      milestone.completed_at = newCompleted ? new Date().toISOString() : null
    } catch (error) {
      console.error('更新里程碑失败:', error)
    }
  }

  // 获取里程碑剩余天数
  function getMilestoneDaysRemaining(milestone: Milestone) {
    return getDaysRemaining(milestone.target_date)
  }

  return {
    milestones,
    loading,
    nextMilestone,
    completedCount,
    loadMilestones,
    toggleMilestone,
    getMilestoneDaysRemaining
  }
})

