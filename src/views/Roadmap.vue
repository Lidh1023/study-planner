<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '@/stores/taskStore'
import { getWeekTheme, getWeekDateRange, getWeekNumber, formatDate } from '@/utils/dateUtils'
import dayjs from 'dayjs'

const router = useRouter()
const taskStore = useTaskStore()
const loading = ref(true)
const expandedWeek = ref<number | null>(null)

// 当前周
const currentWeek = computed(() => getWeekNumber(dayjs()))

// 12周的学习大纲数据
const weeklyRoadmap = computed(() => {
  const roadmap = []
  
  for (let week = 1; week <= 12; week++) {
    const weekInfo = getWeekTheme(week)
    const dateRange = getWeekDateRange(week)
    
    // 获取这一周的任务
    const weekTasks = taskStore.tasks.filter(t => t.week === week)
    const algorithmTasks = weekTasks.filter(t => t.type === 'algorithm')
    const studyTasks = weekTasks.filter(t => t.type === 'study')
    const completedCount = weekTasks.filter(t => t.completed).length
    
    // 按天分组任务
    const dayTasks: Record<number, { algorithm: typeof algorithmTasks, study: typeof studyTasks }> = {}
    for (let day = (week - 1) * 7 + 1; day <= week * 7 && day <= 84; day++) {
      dayTasks[day] = {
        algorithm: algorithmTasks.filter(t => t.day === day),
        study: studyTasks.filter(t => t.day === day)
      }
    }
    
    roadmap.push({
      week,
      theme: weekInfo.theme,
      category: weekInfo.category,
      dateRange: `${formatDate(dateRange.start)} ~ ${formatDate(dateRange.end)}`,
      totalTasks: weekTasks.length,
      completedTasks: completedCount,
      percentage: weekTasks.length > 0 ? Math.round((completedCount / weekTasks.length) * 100) : 0,
      algorithmCount: algorithmTasks.length,
      studyCount: studyTasks.length,
      dayTasks,
      // 学习目标描述
      objectives: getWeekObjectives(week)
    })
  }
  
  return roadmap
})

// 获取每周学习目标
function getWeekObjectives(week: number): string[] {
  // TODO: 自定义每周的学习目标
  const objectives: Record<number, string[]> = {
    1: ['目标 1', '目标 2', '目标 3'],
    2: ['目标 1', '目标 2', '目标 3'],
    // ... 配置更多周次
  }
  return objectives[week] || []
}

// 切换展开状态
const toggleWeek = (week: number) => {
  expandedWeek.value = expandedWeek.value === week ? null : week
}

// 跳转到每日任务
const goToDay = (day: number) => {
  // 计算日期并跳转
  const dateRange = getWeekDateRange(Math.ceil(day / 7))
  const dayInWeek = ((day - 1) % 7)
  const targetDate = dateRange.start.add(dayInWeek, 'day').format('YYYY-MM-DD')
  router.push(`/tasks?date=${targetDate}`)
}

// 获取分类标签样式
const getCategoryClass = (category: string) => {
  const classes: Record<string, string> = {
    algorithm: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    chrome: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ai: 'bg-green-500/20 text-green-400 border-green-500/30',
    vscode: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    lsp: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    interview: 'bg-red-500/20 text-red-400 border-red-500/30'
  }
  return classes[category] || 'bg-dark-600 text-dark-300'
}

// 获取分类名称
const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    algorithm: '算法基础',
    chrome: 'Chrome插件',
    ai: 'AI应用',
    vscode: 'VSCode插件',
    lsp: 'LSP协议',
    interview: '面试冲刺'
  }
  return names[category] || category
}

onMounted(async () => {
  loading.value = true
  await taskStore.loadTasks()
  loading.value = false
})
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- 页面标题 -->
    <div class="card bg-gradient-to-r from-primary-600/10 to-accent-600/10">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white flex items-center gap-3">
            🗺️ 12周学习大纲
          </h2>
          <p class="text-dark-400 mt-2">
            全面了解学习路线，清晰掌握每个阶段的目标
          </p>
        </div>
        <div class="text-right">
          <div class="text-sm text-dark-400">当前进度</div>
          <div class="text-2xl font-bold text-primary-400">
            第 {{ currentWeek || 1 }} 周
          </div>
        </div>
      </div>
    </div>

    <!-- 阶段总览 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card text-center border-l-4 border-purple-500">
        <div class="text-sm text-dark-400 mb-1">第1-4周</div>
        <div class="text-lg font-bold text-purple-400">工程化 + 算法</div>
        <div class="text-xs text-dark-500 mt-1">夯实基础能力</div>
      </div>
      <div class="card text-center border-l-4 border-blue-500">
        <div class="text-sm text-dark-400 mb-1">第5-7周</div>
        <div class="text-lg font-bold text-blue-400">Chrome 插件</div>
        <div class="text-xs text-dark-500 mt-1">浏览器扩展开发</div>
      </div>
      <div class="card text-center border-l-4 border-cyan-500">
        <div class="text-sm text-dark-400 mb-1">第8-11周</div>
        <div class="text-lg font-bold text-cyan-400">AI + VSCode</div>
        <div class="text-xs text-dark-500 mt-1">编辑器插件 & LSP</div>
      </div>
      <div class="card text-center border-l-4 border-red-500">
        <div class="text-sm text-dark-400 mb-1">第12周</div>
        <div class="text-lg font-bold text-red-400">面试冲刺</div>
        <div class="text-xs text-dark-500 mt-1">总结与准备</div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="card text-center py-12">
      <div class="text-dark-400">加载中...</div>
    </div>

    <!-- 周详情列表 -->
    <div v-else class="space-y-4">
      <div 
        v-for="week in weeklyRoadmap" 
        :key="week.week"
        class="card overflow-hidden transition-all duration-300"
        :class="{ 'ring-2 ring-primary-500/50': week.week === currentWeek }"
      >
        <!-- 周标题栏 -->
        <div 
          class="flex items-center justify-between cursor-pointer hover:bg-dark-700/30 -m-6 p-6 transition-colors"
          @click="toggleWeek(week.week)"
        >
          <div class="flex items-center gap-4">
            <!-- 周数标识 -->
            <div 
              class="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
              :class="week.week === currentWeek ? 'bg-primary-500 text-white' : 'bg-dark-700 text-dark-300'"
            >
              W{{ week.week }}
            </div>
            
            <!-- 周信息 -->
            <div>
              <div class="flex items-center gap-3">
                <h3 class="text-lg font-semibold text-white">{{ week.theme }}</h3>
                <span 
                  :class="['px-2 py-0.5 text-xs rounded-full border', getCategoryClass(week.category)]"
                >
                  {{ getCategoryName(week.category) }}
                </span>
                <span 
                  v-if="week.week === currentWeek" 
                  class="px-2 py-0.5 text-xs rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30"
                >
                  当前周
                </span>
              </div>
              <div class="text-sm text-dark-400 mt-1">
                {{ week.dateRange }}
              </div>
            </div>
          </div>

          <!-- 右侧信息 -->
          <div class="flex items-center gap-6">
            <!-- 任务统计 -->
            <div class="text-right hidden md:block">
              <div class="text-sm text-dark-400">
                <span class="text-purple-400">🧮 {{ week.algorithmCount }}</span>
                <span class="mx-2">·</span>
                <span class="text-blue-400">📖 {{ week.studyCount }}</span>
              </div>
              <div class="text-xs text-dark-500 mt-1">
                {{ week.completedTasks }} / {{ week.totalTasks }} 完成
              </div>
            </div>
            
            <!-- 进度条 -->
            <div class="w-24">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-dark-400">{{ week.percentage }}%</span>
              </div>
              <div class="progress-bar h-2">
                <div 
                  class="progress-bar-fill"
                  :style="{ width: `${week.percentage}%` }"
                ></div>
              </div>
            </div>

            <!-- 展开图标 -->
            <span 
              class="text-dark-400 transition-transform duration-300"
              :class="{ 'rotate-180': expandedWeek === week.week }"
            >
              ▼
            </span>
          </div>
        </div>

        <!-- 展开内容 -->
        <Transition name="expand">
          <div v-if="expandedWeek === week.week" class="mt-6 pt-6 border-t border-dark-700">
            <!-- 学习目标 -->
            <div class="mb-6">
              <h4 class="text-sm font-medium text-dark-400 mb-3">🎯 本周学习目标</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div 
                  v-for="(obj, idx) in week.objectives" 
                  :key="idx"
                  class="flex items-center gap-2 text-sm"
                >
                  <span class="text-primary-400">✓</span>
                  <span class="text-dark-300">{{ obj }}</span>
                </div>
              </div>
            </div>

            <!-- 每日任务预览 -->
            <div>
              <h4 class="text-sm font-medium text-dark-400 mb-3">📅 每日任务概览</h4>
              <div class="grid grid-cols-1 md:grid-cols-7 gap-2">
                <div 
                  v-for="(tasks, day) in week.dayTasks" 
                  :key="day"
                  class="p-3 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 cursor-pointer transition-colors"
                  @click="goToDay(Number(day))"
                >
                  <div class="text-xs text-dark-500 mb-2">Day {{ day }}</div>
                  <div v-if="tasks.algorithm.length > 0" class="mb-2">
                    <div 
                      v-for="task in tasks.algorithm.slice(0, 2)" 
                      :key="task.id"
                      class="text-xs text-purple-400 truncate"
                      :class="{ 'line-through opacity-50': task.completed }"
                    >
                      🧮 {{ task.title.replace('LeetCode ', '').slice(0, 15) }}...
                    </div>
                    <div v-if="tasks.algorithm.length > 2" class="text-xs text-dark-500">
                      +{{ tasks.algorithm.length - 2 }} 更多
                    </div>
                  </div>
                  <div v-if="tasks.study.length > 0">
                    <div 
                      v-for="task in tasks.study.slice(0, 1)" 
                      :key="task.id"
                      class="text-xs text-blue-400 truncate"
                      :class="{ 'line-through opacity-50': task.completed }"
                    >
                      📖 {{ task.title.slice(0, 12) }}...
                    </div>
                    <div v-if="tasks.study.length > 1" class="text-xs text-dark-500">
                      +{{ tasks.study.length - 1 }} 更多
                    </div>
                  </div>
                  <div v-if="tasks.algorithm.length === 0 && tasks.study.length === 0" class="text-xs text-dark-600">
                    暂无任务
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
