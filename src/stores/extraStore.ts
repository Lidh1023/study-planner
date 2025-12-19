import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { ExtraLearning } from '@/types/database'

export const useExtraStore = defineStore('extra', () => {
  const extraLearnings = ref<ExtraLearning[]>([])
  const loading = ref(false)

  // 获取所有分类
  const categories = computed(() => {
    const cats = new Set(extraLearnings.value.map(e => e.category))
    return Array.from(cats)
  })

  // 获取总学习时长（分钟）
  const totalDuration = computed(() => {
    return extraLearnings.value.reduce((sum, e) => sum + (e.duration || 0), 0)
  })

  // 加载所有额外学习记录
  async function loadExtraLearnings() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('extra_learnings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      extraLearnings.value = data || []
    } catch (error) {
      console.error('加载额外学习失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 添加额外学习记录
  async function addExtraLearning(learning: Omit<ExtraLearning, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('extra_learnings')
        .insert(learning)
        .select()
        .single()

      if (error) throw error
      if (data) extraLearnings.value.unshift(data)
      return data
    } catch (error) {
      console.error('添加额外学习失败:', error)
      throw error
    }
  }

  // 更新额外学习记录
  async function updateExtraLearning(id: string, updates: Partial<ExtraLearning>) {
    try {
      const { data, error } = await supabase
        .from('extra_learnings')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        const index = extraLearnings.value.findIndex(e => e.id === id)
        if (index >= 0) extraLearnings.value[index] = data
      }
      return data
    } catch (error) {
      console.error('更新额外学习失败:', error)
      throw error
    }
  }

  // 删除额外学习记录
  async function deleteExtraLearning(id: string) {
    try {
      const { error } = await supabase
        .from('extra_learnings')
        .delete()
        .eq('id', id)

      if (error) throw error
      extraLearnings.value = extraLearnings.value.filter(e => e.id !== id)
    } catch (error) {
      console.error('删除额外学习失败:', error)
      throw error
    }
  }

  // 按分类获取记录
  function getByCategory(category: string) {
    return extraLearnings.value.filter(e => e.category === category)
  }

  // 按日期获取记录
  function getByDate(date: string) {
    return extraLearnings.value.filter(e => e.date === date)
  }

  return {
    extraLearnings,
    loading,
    categories,
    totalDuration,
    loadExtraLearnings,
    addExtraLearning,
    updateExtraLearning,
    deleteExtraLearning,
    getByCategory,
    getByDate
  }
})

