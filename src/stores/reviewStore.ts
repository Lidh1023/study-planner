import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { DailyReview } from '@/types/database'

export const useReviewStore = defineStore('review', () => {
  const reviews = ref<DailyReview[]>([])
  const currentReview = ref<DailyReview | null>(null)
  const loading = ref(false)

  // 加载所有复盘
  async function loadReviews() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('daily_reviews')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      reviews.value = data || []
    } catch (error) {
      console.error('加载复盘失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 加载指定日期的复盘
  async function loadReviewByDate(date: string) {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('daily_reviews')
        .select('*')
        .eq('date', date)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      currentReview.value = data || null
    } catch (error) {
      console.error('加载复盘失败:', error)
      currentReview.value = null
    } finally {
      loading.value = false
    }
  }

  // 保存复盘
  async function saveReview(review: Partial<DailyReview> & { date: string }) {
    loading.value = true
    try {
      // 先检查是否存在
      const { data: existing } = await supabase
        .from('daily_reviews')
        .select('id')
        .eq('date', review.date)
        .single()

      let result
      if (existing) {
        // 更新
        const { data, error } = await supabase
          .from('daily_reviews')
          .update({
            content: review.content,
            problems: review.problems,
            tomorrow_plan: review.tomorrow_plan,
            mood: review.mood,
            updated_at: new Date().toISOString()
          })
          .eq('date', review.date)
          .select()
          .single()

        if (error) throw error
        result = data
      } else {
        // 新增
        const { data, error } = await supabase
          .from('daily_reviews')
          .insert({
            date: review.date,
            content: review.content || '',
            problems: review.problems || '',
            tomorrow_plan: review.tomorrow_plan || '',
            mood: review.mood || 3
          })
          .select()
          .single()

        if (error) throw error
        result = data
      }

      if (result) {
        currentReview.value = result
        // 更新列表
        const index = reviews.value.findIndex(r => r.date === review.date)
        if (index >= 0) {
          reviews.value[index] = result
        } else {
          reviews.value.unshift(result)
        }
      }

      return result
    } catch (error) {
      console.error('保存复盘失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取复盘统计
  function getReviewStats() {
    const totalReviews = reviews.value.length
    const avgMood = reviews.value.length > 0
      ? reviews.value.reduce((sum, r) => sum + (r.mood || 3), 0) / reviews.value.length
      : 0
    
    return {
      totalReviews,
      avgMood: Math.round(avgMood * 10) / 10
    }
  }

  return {
    reviews,
    currentReview,
    loading,
    loadReviews,
    loadReviewByDate,
    saveReview,
    getReviewStats
  }
})
