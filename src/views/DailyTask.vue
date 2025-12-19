<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTaskStore } from '@/stores/taskStore'
import { getToday, getWeekNumber, getWeekTheme, getDayNumber } from '@/utils/dateUtils'
import type { Task } from '@/types/database'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import CalendarPicker from '@/components/CalendarPicker.vue'

dayjs.locale('zh-cn')

const route = useRoute()
const taskStore = useTaskStore()

// 支持从 URL 参数获取日期
const getInitialDate = () => {
  const dateParam = route.query.date as string
  if (dateParam && dayjs(dateParam).isValid()) {
    return dateParam
  }
  return getToday()
}

const currentDate = ref(getInitialDate())
const showNoteModal = ref(false)
const showCalendar = ref(false)
const selectedTask = ref<Task | null>(null)
const noteForm = ref({
  title: '',
  url: '',
  platform: 'notion' as 'yuque' | 'notion' | 'feishu' | 'other'
})

// 日期导航
const prevDate = computed(() => {
  return dayjs(currentDate.value).subtract(1, 'day').format('YYYY-MM-DD')
})

const nextDate = computed(() => {
  return dayjs(currentDate.value).add(1, 'day').format('YYYY-MM-DD')
})

// 当前日期信息
const dateInfo = computed(() => {
  const date = dayjs(currentDate.value)
  const week = getWeekNumber(currentDate.value)
  const day = getDayNumber(currentDate.value)
  const weekInfo = getWeekTheme(week)
  
  return {
    week,
    day,
    weekday: date.format('dddd'),
    theme: weekInfo.theme,
    formatted: date.format('M月D日')
  }
})

// 切换日期
const changeDate = (direction: 'prev' | 'next' | 'today') => {
  if (direction === 'today') {
    currentDate.value = getToday()
  } else if (direction === 'prev') {
    currentDate.value = prevDate.value
  } else {
    currentDate.value = nextDate.value
  }
}

// 监听日期变化，加载对应任务
watch(currentDate, async (newDate) => {
  await taskStore.loadTasksByDate(newDate)
}, { immediate: true })

onMounted(async () => {
  await taskStore.loadNoteLinks()
})

// 打开添加笔记弹窗
const openNoteModal = (task: Task) => {
  selectedTask.value = task
  noteForm.value = { title: '', url: '', platform: 'notion' }
  showNoteModal.value = true
}

// 添加笔记
const addNote = async () => {
  if (!selectedTask.value || !noteForm.value.title || !noteForm.value.url) return
  
  try {
    await taskStore.addNoteLink({
      task_id: selectedTask.value.id,
      title: noteForm.value.title,
      url: noteForm.value.url,
      platform: noteForm.value.platform
    })
    showNoteModal.value = false
  } catch (error) {
    alert('添加笔记失败')
  }
}

// 删除笔记
const deleteNote = async (noteId: string) => {
  if (confirm('确定删除这个笔记链接吗？')) {
    await taskStore.deleteNoteLink(noteId)
  }
}

// 获取平台显示名称
const getPlatformName = (platform: string) => {
  const names: Record<string, string> = {
    yuque: '语雀',
    notion: 'Notion',
    feishu: '飞书',
    other: '其他'
  }
  return names[platform] || platform
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
          <div class="text-2xl font-bold text-white flex items-center justify-center gap-2">
            {{ dateInfo.formatted }} · {{ dateInfo.weekday }}
            <span class="text-base text-dark-400">📅</span>
          </div>
          <div class="text-dark-400 mt-1">
            <template v-if="dateInfo.day > 0">
              第 {{ dateInfo.week }} 周 · 第 {{ dateInfo.day }} 天 · {{ dateInfo.theme }}
            </template>
            <template v-else>
              计划未开始
            </template>
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

    <!-- 进度概览 -->
    <div class="card bg-gradient-to-r from-primary-600/10 to-accent-600/10">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-dark-400">今日完成度</span>
          <div class="text-3xl font-bold text-white mt-1">
            {{ taskStore.todayProgress }}%
          </div>
        </div>
        <div class="w-48">
          <div class="progress-bar h-3">
            <div 
              class="progress-bar-fill"
              :style="{ width: `${taskStore.todayProgress}%` }"
            ></div>
          </div>
          <div class="text-sm text-dark-400 mt-2 text-right">
            {{ taskStore.todayTasks.filter(t => t.completed).length }} / {{ taskStore.todayTasks.length }} 任务
          </div>
        </div>
      </div>
    </div>

    <!-- 算法任务 -->
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <span class="text-2xl">🧮</span>
          <h3 class="text-lg font-semibold text-white">算法任务</h3>
          <span class="tag tag-algorithm">45分钟</span>
        </div>
        <span class="text-dark-400">
          {{ taskStore.algorithmTasks.filter(t => t.completed).length }} / {{ taskStore.algorithmTasks.length }} 完成
        </span>
      </div>

      <div v-if="taskStore.loading" class="text-center py-8 text-dark-400">
        加载中...
      </div>

      <div v-else-if="taskStore.algorithmTasks.length === 0" class="text-center py-8 text-dark-400">
        今天没有算法任务
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="task in taskStore.algorithmTasks" 
          :key="task.id"
          class="p-4 rounded-xl bg-dark-800/50 border border-dark-700 hover:border-dark-600 transition-all"
        >
          <div class="flex items-start gap-4">
            <input 
              type="checkbox" 
              :checked="task.completed"
              class="checkbox mt-1"
              @change="taskStore.toggleTask(task.id)"
            />
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span :class="['font-medium', task.completed ? 'text-dark-500 line-through' : 'text-white']">
                  {{ task.title }}
                </span>
                <span v-if="task.difficulty" :class="['tag', `tag-${task.difficulty}`]">
                  {{ task.difficulty === 'easy' ? '简单' : task.difficulty === 'medium' ? '中等' : '困难' }}
                </span>
              </div>
              
              <div v-if="task.hint" class="text-sm text-dark-400 mb-3">
                💡 {{ task.hint }}
              </div>

              <!-- 笔记链接 -->
              <div class="flex flex-wrap items-center gap-2">
                <template v-for="note in taskStore.getTaskNotes(task.id)" :key="note.id">
                  <a 
                    :href="note.url" 
                    target="_blank"
                    :class="['tag', `tag-${note.platform}`]"
                  >
                    📝 {{ note.title }} ({{ getPlatformName(note.platform) }})
                  </a>
                  <button 
                    class="text-dark-500 hover:text-red-400 text-xs"
                    @click="deleteNote(note.id)"
                  >
                    ✕
                  </button>
                </template>
                
                <button 
                  class="text-xs text-primary-400 hover:text-primary-300"
                  @click="openNoteModal(task)"
                >
                  + 添加笔记
                </button>
              </div>

              <!-- 资源链接 -->
              <div v-if="task.resource_url" class="mt-3">
                <a 
                  :href="task.resource_url" 
                  target="_blank"
                  class="text-sm text-primary-400 hover:text-primary-300"
                >
                  → 去做题
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 专项学习任务 -->
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <span class="text-2xl">📖</span>
          <h3 class="text-lg font-semibold text-white">专项学习</h3>
          <span class="tag tag-study">75分钟</span>
        </div>
        <span class="text-dark-400">
          {{ taskStore.studyTasks.filter(t => t.completed).length }} / {{ taskStore.studyTasks.length }} 完成
        </span>
      </div>

      <div v-if="taskStore.loading" class="text-center py-8 text-dark-400">
        加载中...
      </div>

      <div v-else-if="taskStore.studyTasks.length === 0" class="text-center py-8 text-dark-400">
        今天没有学习任务
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="task in taskStore.studyTasks" 
          :key="task.id"
          class="p-4 rounded-xl bg-dark-800/50 border border-dark-700 hover:border-dark-600 transition-all"
        >
          <div class="flex items-start gap-4">
            <input 
              type="checkbox" 
              :checked="task.completed"
              class="checkbox mt-1"
              @change="taskStore.toggleTask(task.id)"
            />
            <div class="flex-1">
              <div :class="['font-medium mb-2', task.completed ? 'text-dark-500 line-through' : 'text-white']">
                {{ task.title }}
              </div>
              
              <div v-if="task.description" class="text-sm text-dark-400 mb-3">
                🎯 {{ task.description }}
              </div>

              <!-- 笔记链接 -->
              <div class="flex flex-wrap items-center gap-2">
                <template v-for="note in taskStore.getTaskNotes(task.id)" :key="note.id">
                  <a 
                    :href="note.url" 
                    target="_blank"
                    :class="['tag', `tag-${note.platform}`]"
                  >
                    📝 {{ note.title }} ({{ getPlatformName(note.platform) }})
                  </a>
                  <button 
                    class="text-dark-500 hover:text-red-400 text-xs"
                    @click="deleteNote(note.id)"
                  >
                    ✕
                  </button>
                </template>
                
                <button 
                  class="text-xs text-primary-400 hover:text-primary-300"
                  @click="openNoteModal(task)"
                >
                  + 添加笔记
                </button>
              </div>

              <!-- 资源链接 -->
              <div v-if="task.resource_url" class="mt-3">
                <a 
                  :href="task.resource_url" 
                  target="_blank"
                  class="text-sm text-primary-400 hover:text-primary-300"
                >
                  → 查看资源
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加笔记弹窗 -->
    <Teleport to="body">
      <div 
        v-if="showNoteModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="showNoteModal = false"
      >
        <div class="card w-full max-w-md mx-4">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-white">添加笔记链接</h3>
            <button 
              class="text-dark-400 hover:text-white"
              @click="showNoteModal = false"
            >
              ✕
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm text-dark-400 mb-2">关联任务</label>
              <div class="input bg-dark-700 cursor-not-allowed">
                {{ selectedTask?.title }}
              </div>
            </div>

            <div>
              <label class="block text-sm text-dark-400 mb-2">笔记标题 *</label>
              <input 
                v-model="noteForm.title"
                type="text"
                class="input"
                placeholder="例如：反转链表解题思路"
              />
            </div>

            <div>
              <label class="block text-sm text-dark-400 mb-2">笔记平台 *</label>
              <div class="flex gap-2">
                <button 
                  v-for="p in ['yuque', 'notion', 'feishu', 'other']"
                  :key="p"
                  :class="[
                    'px-4 py-2 rounded-lg border transition-all',
                    noteForm.platform === p 
                      ? 'bg-primary-600 border-primary-500 text-white' 
                      : 'border-dark-600 text-dark-300 hover:border-dark-500'
                  ]"
                  @click="noteForm.platform = p as any"
                >
                  {{ getPlatformName(p) }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm text-dark-400 mb-2">笔记链接 *</label>
              <input 
                v-model="noteForm.url"
                type="url"
                class="input"
                placeholder="https://..."
              />
            </div>

            <div class="flex gap-3 pt-4">
              <button 
                class="btn btn-secondary flex-1"
                @click="showNoteModal = false"
              >
                取消
              </button>
              <button 
                class="btn btn-primary flex-1"
                :disabled="!noteForm.title || !noteForm.url"
                @click="addNote"
              >
                保存链接
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
