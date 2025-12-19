<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'
import { generateCalendarDays, getStartDate, getEndDate, formatDate } from '@/utils/dateUtils'

const props = defineProps<{
  modelValue: string
  show: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:show': [value: boolean]
}>()

const currentYear = ref(dayjs(props.modelValue).year())
const currentMonth = ref(dayjs(props.modelValue).month() + 1)

// 监听传入日期变化
watch(() => props.modelValue, (newVal) => {
  currentYear.value = dayjs(newVal).year()
  currentMonth.value = dayjs(newVal).month() + 1
})

const weekdays = ['一', '二', '三', '四', '五', '六', '日']

const calendarDays = computed(() => {
  return generateCalendarDays(currentYear.value, currentMonth.value)
})

const monthTitle = computed(() => {
  return `${currentYear.value}年${currentMonth.value}月`
})

// 学习计划时间范围
const startDate = computed(() => formatDate(getStartDate()))
const endDate = computed(() => formatDate(getEndDate()))

const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentYear.value--
    currentMonth.value = 12
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentYear.value++
    currentMonth.value = 1
  } else {
    currentMonth.value++
  }
}

const selectDate = (date: string) => {
  emit('update:modelValue', date)
  emit('update:show', false)
}

const goToToday = () => {
  const today = dayjs()
  currentYear.value = today.year()
  currentMonth.value = today.month() + 1
  selectDate(today.format('YYYY-MM-DD'))
}

const close = () => {
  emit('update:show', false)
}

// 判断日期是否在学习计划范围内
const isInPlanRange = (date: string) => {
  return date >= startDate.value && date <= endDate.value
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div 
        v-if="show"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="close"
      >
        <div class="bg-dark-800 rounded-2xl border border-dark-700 shadow-2xl w-full max-w-md mx-4 overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-dark-700">
            <button 
              class="w-10 h-10 rounded-lg hover:bg-dark-700 flex items-center justify-center transition-colors"
              @click="prevMonth"
            >
              ◀
            </button>
            <span class="text-lg font-bold text-white">{{ monthTitle }}</span>
            <button 
              class="w-10 h-10 rounded-lg hover:bg-dark-700 flex items-center justify-center transition-colors"
              @click="nextMonth"
            >
              ▶
            </button>
          </div>

          <!-- Weekday headers -->
          <div class="grid grid-cols-7 px-4 py-2 border-b border-dark-700/50">
            <div 
              v-for="day in weekdays" 
              :key="day"
              class="text-center text-sm text-dark-400 py-2"
            >
              {{ day }}
            </div>
          </div>

          <!-- Calendar grid -->
          <div class="grid grid-cols-7 gap-1 p-4">
            <button
              v-for="day in calendarDays"
              :key="day.date"
              :class="[
                'relative h-12 rounded-lg flex flex-col items-center justify-center transition-all',
                !day.isCurrentMonth && 'opacity-30',
                day.isToday && 'ring-2 ring-primary-500',
                day.date === modelValue && 'bg-primary-600 text-white',
                day.date !== modelValue && day.isCurrentMonth && 'hover:bg-dark-700',
                isInPlanRange(day.date) && day.date !== modelValue && 'bg-dark-700/50'
              ]"
              @click="selectDate(day.date)"
            >
              <span class="text-sm font-medium">{{ day.day }}</span>
              <span 
                v-if="day.dayNumber > 0 && day.dayNumber <= 84" 
                class="text-[10px] text-dark-400"
                :class="day.date === modelValue && 'text-white/70'"
              >
                D{{ day.dayNumber }}
              </span>
            </button>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-6 py-4 border-t border-dark-700 bg-dark-900/50">
            <div class="text-xs text-dark-400">
              计划: {{ startDate }} ~ {{ endDate }}
            </div>
            <div class="flex gap-2">
              <button 
                class="px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-sm transition-colors"
                @click="goToToday"
              >
                今天
              </button>
              <button 
                class="px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-sm transition-colors"
                @click="close"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

