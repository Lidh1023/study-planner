<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useReviewStore } from '@/stores/reviewStore'
import { getToday, formatDateFriendly } from '@/utils/dateUtils'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import CalendarPicker from '@/components/CalendarPicker.vue'

dayjs.locale('zh-cn')

const reviewStore = useReviewStore()

const currentDate = ref(getToday())
const saving = ref(false)
const showCalendar = ref(false)

const form = ref({
  content: '',
  problems: '',
  tomorrow_plan: '',
  mood: 3
})

const moods = [
  { value: 1, emoji: '😫', label: '很差' },
  { value: 2, emoji: '😐', label: '一般' },
  { value: 3, emoji: '😊', label: '还好' },
  { value: 4, emoji: '😄', label: '不错' },
  { value: 5, emoji: '🔥', label: '超棒' },
]

// 日期导航
const prevDate = computed(() => {
  return dayjs(currentDate.value).subtract(1, 'day').format('YYYY-MM-DD')
})

const nextDate = computed(() => {
  return dayjs(currentDate.value).add(1, 'day').format('YYYY-MM-DD')
})

const changeDate = (direction: 'prev' | 'next' | 'today') => {
  if (direction === 'today') {
    currentDate.value = getToday()
  } else if (direction === 'prev') {
    currentDate.value = prevDate.value
  } else {
    currentDate.value = nextDate.value
  }
}

// 监听日期变化
watch(currentDate, async () => {
  await reviewStore.loadReviewByDate(currentDate.value)
  if (reviewStore.currentReview) {
    form.value = {
      content: reviewStore.currentReview.content || '',
      problems: reviewStore.currentReview.problems || '',
      tomorrow_plan: reviewStore.currentReview.tomorrow_plan || '',
      mood: reviewStore.currentReview.mood || 3
    }
  } else {
    form.value = { content: '', problems: '', tomorrow_plan: '', mood: 3 }
  }
}, { immediate: true })

onMounted(async () => {
  await reviewStore.loadReviews()
})

// 保存复盘
const saveReview = async () => {
  saving.value = true
  try {
    await reviewStore.saveReview({
      date: currentDate.value,
      ...form.value
    })
    alert('保存成功！')
  } catch (error) {
    alert('保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- 日期导航 -->
    <div class="card">
      <div class="flex items-center justify-between">
        <button 
          class="btn btn-ghost"
          @click="changeDate('prev')"
        >
          ◀ 前一天
        </button>
        
        <!-- 点击弹出日历 -->
        <div 
          class="text-center cursor-pointer hover:bg-dark-700/50 px-6 py-2 rounded-xl transition-all"
          @click="showCalendar = true"
        >
          <div class="text-xl font-bold text-white flex items-center justify-center gap-2">
            {{ formatDateFriendly(currentDate) }}
            <span class="text-base text-dark-400">📅</span>
          </div>
          <div class="text-dark-400 text-sm mt-1">
            {{ dayjs(currentDate).format('YYYY年M月D日 dddd') }}
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <button 
            v-if="currentDate !== getToday()"
            class="btn btn-secondary text-sm"
            @click="changeDate('today')"
          >
            今天
          </button>
          <button 
            class="btn btn-ghost"
            @click="changeDate('next')"
          >
            后一天 ▶
          </button>
        </div>
      </div>
    </div>

    <!-- 日历选择器 -->
    <CalendarPicker 
      v-model="currentDate"
      v-model:show="showCalendar"
    />

    <!-- 心情选择 -->
    <div class="card">
      <label class="block text-dark-400 mb-4">今日心情</label>
      <div class="flex justify-center gap-4">
        <button 
          v-for="mood in moods"
          :key="mood.value"
          :class="[
            'flex flex-col items-center p-4 rounded-xl transition-all',
            form.mood === mood.value 
              ? 'bg-primary-600/20 border-2 border-primary-500 scale-110' 
              : 'bg-dark-800/50 border-2 border-transparent hover:border-dark-600'
          ]"
          @click="form.mood = mood.value"
        >
          <span class="text-3xl mb-1">{{ mood.emoji }}</span>
          <span class="text-xs text-dark-400">{{ mood.label }}</span>
        </button>
      </div>
    </div>

    <!-- 学习心得 -->
    <div class="card">
      <label class="block text-dark-400 mb-3">
        <span class="text-lg mr-2">📖</span>
        今日学习心得
      </label>
      <textarea 
        v-model="form.content"
        class="input min-h-[150px] resize-none"
        placeholder="今天学到了什么？有什么收获？"
      ></textarea>
    </div>

    <!-- 遇到的问题 -->
    <div class="card">
      <label class="block text-dark-400 mb-3">
        <span class="text-lg mr-2">❓</span>
        遇到的问题
      </label>
      <textarea 
        v-model="form.problems"
        class="input min-h-[100px] resize-none"
        placeholder="遇到了什么困难？如何解决的？"
      ></textarea>
    </div>

    <!-- 明日计划 -->
    <div class="card">
      <label class="block text-dark-400 mb-3">
        <span class="text-lg mr-2">📅</span>
        明日计划
      </label>
      <textarea 
        v-model="form.tomorrow_plan"
        class="input min-h-[100px] resize-none"
        placeholder="明天打算做什么？"
      ></textarea>
    </div>

    <!-- 保存按钮 -->
    <div class="flex justify-end">
      <button 
        class="btn btn-primary px-8"
        :disabled="saving"
        @click="saveReview"
      >
        {{ saving ? '保存中...' : '保存复盘' }}
      </button>
    </div>

    <!-- 历史复盘 -->
    <div class="card">
      <h3 class="text-lg font-semibold text-white mb-6">📚 历史复盘</h3>
      
      <div v-if="reviewStore.reviews.length === 0" class="text-center py-8 text-dark-400">
        暂无复盘记录
      </div>

      <div v-else class="space-y-3">
        <div 
          v-for="review in reviewStore.reviews.slice(0, 10)"
          :key="review.id"
          :class="[
            'p-4 rounded-xl cursor-pointer transition-all',
            review.date === currentDate 
              ? 'bg-primary-600/20 border border-primary-500/30' 
              : 'bg-dark-800/50 hover:bg-dark-700/50'
          ]"
          @click="currentDate = review.date"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">
                {{ moods.find(m => m.value === review.mood)?.emoji || '😊' }}
              </span>
              <div>
                <div class="font-medium text-white">
                  {{ formatDateFriendly(review.date) }}
                </div>
                <div class="text-sm text-dark-400 truncate max-w-[300px]">
                  {{ review.content?.slice(0, 50) }}{{ (review.content?.length || 0) > 50 ? '...' : '' }}
                </div>
              </div>
            </div>
            <span class="text-dark-500">→</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
