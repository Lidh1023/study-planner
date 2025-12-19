<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '@/stores/taskStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useReviewStore } from '@/stores/reviewStore'
import { getWeekNumber, getWeekTheme, getToday, getDayNumber } from '@/utils/dateUtils'

const router = useRouter()
const taskStore = useTaskStore()
const milestoneStore = useMilestoneStore()
const reviewStore = useReviewStore()

const loading = ref(true)

// 当前周次和主题
const currentWeek = computed(() => getWeekNumber(new Date()))
const weekInfo = computed(() => getWeekTheme(currentWeek.value))
const currentDay = computed(() => getDayNumber(new Date()))

// 本周进度
const weekProgress = ref({ completed: 0, total: 0, percentage: 0 })

onMounted(async () => {
  loading.value = true
  await Promise.all([
    taskStore.loadTasks(),
    taskStore.loadTasksByDate(getToday()),
    taskStore.loadNoteLinks(),
    milestoneStore.loadMilestones(),
    reviewStore.loadReviews()
  ])
  weekProgress.value = await taskStore.getWeekStats(currentWeek.value)
  loading.value = false
})

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <!-- 欢迎横幅 -->
    <div class="card bg-gradient-to-r from-primary-600/20 to-accent-600/20 border-primary-500/30">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white mb-2">
            👋 欢迎回来！
          </h2>
          <p class="text-dark-300">
            第 {{ currentWeek }} 周 · {{ weekInfo.theme }} · 第 {{ currentDay }} 天
          </p>
        </div>
        <div class="text-right">
          <div class="text-4xl font-bold text-primary-400">
            {{ taskStore.totalProgress }}%
          </div>
          <div class="text-sm text-dark-400">总体完成率</div>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- 今日进度 -->
      <div class="card cursor-pointer hover:scale-[1.02]" @click="navigateTo('/tasks')">
        <div class="flex items-center justify-between mb-4">
          <span class="text-dark-400">今日进度</span>
          <span class="text-2xl">📋</span>
        </div>
        <div class="text-3xl font-bold text-white mb-2">
          {{ taskStore.todayProgress }}%
        </div>
        <div class="progress-bar">
          <div 
            class="progress-bar-fill"
            :style="{ width: `${taskStore.todayProgress}%` }"
          ></div>
        </div>
        <div class="text-sm text-dark-400 mt-2">
          {{ taskStore.todayTasks.filter(t => t.completed).length }} / {{ taskStore.todayTasks.length }} 任务完成
        </div>
      </div>

      <!-- 本周进度 -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <span class="text-dark-400">本周进度</span>
          <span class="text-2xl">📊</span>
        </div>
        <div class="text-3xl font-bold text-white mb-2">
          {{ weekProgress.percentage }}%
        </div>
        <div class="progress-bar">
          <div 
            class="progress-bar-fill"
            :style="{ width: `${weekProgress.percentage}%` }"
          ></div>
        </div>
        <div class="text-sm text-dark-400 mt-2">
          {{ weekProgress.completed }} / {{ weekProgress.total }} 任务完成
        </div>
      </div>

      <!-- 复盘统计 -->
      <div class="card cursor-pointer hover:scale-[1.02]" @click="navigateTo('/review')">
        <div class="flex items-center justify-between mb-4">
          <span class="text-dark-400">复盘记录</span>
          <span class="text-2xl">📝</span>
        </div>
        <div class="text-3xl font-bold text-white mb-2">
          {{ reviewStore.reviews.length }}
        </div>
        <div class="text-sm text-dark-400">
          已完成 {{ reviewStore.reviews.length }} 天复盘
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 今日待办 -->
      <div class="card">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-white">🎯 今日待办</h3>
          <button 
            class="btn btn-ghost text-sm"
            @click="navigateTo('/tasks')"
          >
            查看全部 →
          </button>
        </div>
        
        <div v-if="loading" class="text-center py-8 text-dark-400">
          加载中...
        </div>
        
        <div v-else-if="taskStore.todayTasks.length === 0" class="text-center py-8 text-dark-400">
          今天没有任务，好好休息吧！
        </div>
        
        <div v-else class="space-y-3">
          <div 
            v-for="task in taskStore.todayTasks.slice(0, 5)" 
            :key="task.id"
            class="flex items-center gap-3 p-3 rounded-lg bg-dark-800/50 hover:bg-dark-700/50 transition-all cursor-pointer"
            @click="taskStore.toggleTask(task.id)"
          >
            <input 
              type="checkbox" 
              :checked="task.completed"
              class="checkbox"
              @click.stop
              @change="taskStore.toggleTask(task.id)"
            />
            <div class="flex-1 min-w-0">
              <div :class="['font-medium truncate', task.completed ? 'text-dark-500 line-through' : 'text-white']">
                {{ task.title }}
              </div>
              <div class="flex items-center gap-2 mt-1">
                <span :class="['tag', task.type === 'algorithm' ? 'tag-algorithm' : 'tag-study']">
                  {{ task.type === 'algorithm' ? '算法' : '学习' }}
                </span>
                <span v-if="task.difficulty" :class="['tag', `tag-${task.difficulty}`]">
                  {{ task.difficulty === 'easy' ? '简单' : task.difficulty === 'medium' ? '中等' : '困难' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 里程碑 -->
      <div class="card">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-white">🏆 里程碑</h3>
          <span class="text-sm text-dark-400">
            {{ milestoneStore.completedCount }} / {{ milestoneStore.milestones.length }} 完成
          </span>
        </div>
        
        <div class="space-y-4">
          <div 
            v-for="milestone in milestoneStore.milestones" 
            :key="milestone.id"
            :class="[
              'p-4 rounded-lg border transition-all',
              milestone.completed 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-dark-800/50 border-dark-700'
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span :class="milestone.completed ? 'text-green-400' : 'text-dark-400'">
                  {{ milestone.completed ? '✅' : '⏳' }}
                </span>
                <div>
                  <div :class="['font-medium', milestone.completed ? 'text-green-400' : 'text-white']">
                    第 {{ milestone.week }} 周：{{ milestone.title }}
                  </div>
                  <div class="text-sm text-dark-400">
                    {{ milestone.description }}
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div v-if="milestone.completed" class="text-sm text-green-400">
                  已完成
                </div>
                <div v-else class="text-sm text-dark-400">
                  还剩 {{ milestoneStore.getMilestoneDaysRemaining(milestone) }} 天
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 本周目标 -->
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-white">📅 本周目标</h3>
        <span class="tag tag-study">第 {{ currentWeek }} 周</span>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="p-4 rounded-lg bg-dark-800/50 border border-dark-700">
          <div class="text-2xl mb-2">🧮</div>
          <div class="font-medium text-white">算法练习</div>
          <div class="text-sm text-dark-400 mt-1">完成本周 LeetCode 题目</div>
        </div>
        <div class="p-4 rounded-lg bg-dark-800/50 border border-dark-700">
          <div class="text-2xl mb-2">📖</div>
          <div class="font-medium text-white">{{ weekInfo.theme }}</div>
          <div class="text-sm text-dark-400 mt-1">专项学习任务</div>
        </div>
        <div class="p-4 rounded-lg bg-dark-800/50 border border-dark-700">
          <div class="text-2xl mb-2">📝</div>
          <div class="font-medium text-white">每日复盘</div>
          <div class="text-sm text-dark-400 mt-1">记录学习心得</div>
        </div>
      </div>
    </div>
  </div>
</template>
