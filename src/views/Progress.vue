<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { useReviewStore } from '@/stores/reviewStore'
import { useExtraStore } from '@/stores/extraStore'
import * as echarts from 'echarts'
import { getWeekTheme } from '@/utils/dateUtils'

const taskStore = useTaskStore()
const reviewStore = useReviewStore()
const extraStore = useExtraStore()

const weeklyChartRef = ref<HTMLDivElement>()
const categoryChartRef = ref<HTMLDivElement>()
const loading = ref(true)

// 周进度数据
const weeklyProgress = ref<{ week: number; completed: number; total: number; percentage: number }[]>([])

// 分类统计
const categoryStats = computed(() => {
  const stats = {
    algorithm: { completed: 0, total: 0 },
    study: { completed: 0, total: 0 }
  }
  
  taskStore.tasks.forEach(task => {
    if (task.type === 'algorithm') {
      stats.algorithm.total++
      if (task.completed) stats.algorithm.completed++
    } else {
      stats.study.total++
      if (task.completed) stats.study.completed++
    }
  })
  
  return stats
})

// LeetCode 统计
const leetcodeStats = computed(() => {
  const stats = { easy: 0, medium: 0, hard: 0 }
  taskStore.tasks
    .filter(t => t.type === 'algorithm' && t.completed)
    .forEach(t => {
      if (t.difficulty) stats[t.difficulty]++
    })
  return stats
})

// 连续学习天数
const streakDays = computed(() => {
  // 简单计算：有复盘记录的天数
  return reviewStore.reviews.length
})

onMounted(async () => {
  loading.value = true
  
  await Promise.all([
    taskStore.loadTasks(),
    reviewStore.loadReviews(),
    extraStore.loadExtraLearnings()
  ])

  // 计算每周进度
  for (let week = 1; week <= 12; week++) {
    const stats = await taskStore.getWeekStats(week)
    weeklyProgress.value.push({
      week,
      ...stats
    })
  }

  loading.value = false

  // 初始化图表
  initWeeklyChart()
  initCategoryChart()
})

// 周进度柱状图
const initWeeklyChart = () => {
  if (!weeklyChartRef.value) return
  
  const chart = echarts.init(weeklyChartRef.value)
  
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30, 41, 59, 0.9)',
      borderColor: '#475569',
      textStyle: { color: '#f1f5f9' },
      formatter: (params: any) => {
        const data = params[0]
        const weekData = weeklyProgress.value[data.dataIndex]
        return `
          <div>
            <div style="font-weight: bold; margin-bottom: 4px;">第 ${data.name} 周</div>
            <div>${getWeekTheme(Number(data.name)).theme}</div>
            <div style="margin-top: 8px;">完成率: ${weekData.percentage}%</div>
            <div>完成: ${weekData.completed} / ${weekData.total}</div>
          </div>
        `
      }
    },
    grid: {
      top: 20,
      right: 20,
      bottom: 30,
      left: 50
    },
    xAxis: {
      type: 'category',
      data: weeklyProgress.value.map(w => w.week),
      axisLabel: {
        color: '#94a3b8',
        formatter: 'W{value}'
      },
      axisLine: { lineStyle: { color: '#334155' } }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        color: '#94a3b8',
        formatter: '{value}%'
      },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#334155' } }
    },
    series: [{
      type: 'bar',
      data: weeklyProgress.value.map(w => w.percentage),
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#0ea5e9' },
          { offset: 1, color: '#0369a1' }
        ])
      },
      barWidth: '60%'
    }]
  })

  window.addEventListener('resize', () => chart.resize())
}

// 分类完成率饼图
const initCategoryChart = () => {
  if (!categoryChartRef.value) return
  
  const chart = echarts.init(categoryChartRef.value)
  
  chart.setOption({
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(30, 41, 59, 0.9)',
      borderColor: '#475569',
      textStyle: { color: '#f1f5f9' }
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#94a3b8' }
    },
    series: [{
      type: 'pie',
      radius: ['50%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 4,
        borderColor: '#1e293b',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'center',
        formatter: () => `${taskStore.totalProgress}%\n总完成率`,
        fontSize: 16,
        color: '#f1f5f9'
      },
      data: [
        { 
          value: categoryStats.value.algorithm.completed, 
          name: '算法已完成',
          itemStyle: { color: '#a855f7' }
        },
        { 
          value: categoryStats.value.algorithm.total - categoryStats.value.algorithm.completed, 
          name: '算法未完成',
          itemStyle: { color: '#581c87' }
        },
        { 
          value: categoryStats.value.study.completed, 
          name: '学习已完成',
          itemStyle: { color: '#0ea5e9' }
        },
        { 
          value: categoryStats.value.study.total - categoryStats.value.study.completed, 
          name: '学习未完成',
          itemStyle: { color: '#0c4a6e' }
        }
      ]
    }]
  })

  window.addEventListener('resize', () => chart.resize())
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- 统计概览 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card text-center">
        <div class="text-3xl font-bold text-primary-400">
          {{ taskStore.totalProgress }}%
        </div>
        <div class="text-dark-400 mt-1">总体完成率</div>
      </div>
      <div class="card text-center">
        <div class="text-3xl font-bold text-accent-400">
          {{ taskStore.tasks.filter(t => t.completed).length }}
        </div>
        <div class="text-dark-400 mt-1">已完成任务</div>
      </div>
      <div class="card text-center">
        <div class="text-3xl font-bold text-green-400">
          {{ streakDays }}
        </div>
        <div class="text-dark-400 mt-1">复盘天数</div>
      </div>
      <div class="card text-center">
        <div class="text-3xl font-bold text-yellow-400">
          {{ taskStore.noteLinks.length }}
        </div>
        <div class="text-dark-400 mt-1">笔记链接</div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 周进度图 -->
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-6">📈 周完成率趋势</h3>
        <div ref="weeklyChartRef" class="h-[300px]"></div>
      </div>

      <!-- 分类完成率 -->
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-6">🎯 任务分类</h3>
        <div ref="categoryChartRef" class="h-[300px]"></div>
      </div>
    </div>

    <!-- LeetCode 统计 -->
    <div class="card">
      <h3 class="text-lg font-semibold text-white mb-6">🧮 LeetCode 刷题统计</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
          <div class="flex items-center justify-between">
            <span class="text-green-400">简单</span>
            <span class="text-2xl font-bold text-green-400">{{ leetcodeStats.easy }}</span>
          </div>
          <div class="progress-bar mt-3 bg-green-900/50">
            <div 
              class="h-full bg-green-500 rounded-full"
              :style="{ width: `${Math.min(leetcodeStats.easy / 40 * 100, 100)}%` }"
            ></div>
          </div>
          <div class="text-xs text-green-400/60 mt-1">目标: 40 道</div>
        </div>

        <div class="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <div class="flex items-center justify-between">
            <span class="text-yellow-400">中等</span>
            <span class="text-2xl font-bold text-yellow-400">{{ leetcodeStats.medium }}</span>
          </div>
          <div class="progress-bar mt-3 bg-yellow-900/50">
            <div 
              class="h-full bg-yellow-500 rounded-full"
              :style="{ width: `${Math.min(leetcodeStats.medium / 60 * 100, 100)}%` }"
            ></div>
          </div>
          <div class="text-xs text-yellow-400/60 mt-1">目标: 60 道</div>
        </div>

        <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <div class="flex items-center justify-between">
            <span class="text-red-400">困难</span>
            <span class="text-2xl font-bold text-red-400">{{ leetcodeStats.hard }}</span>
          </div>
          <div class="progress-bar mt-3 bg-red-900/50">
            <div 
              class="h-full bg-red-500 rounded-full"
              :style="{ width: `${Math.min(leetcodeStats.hard / 20 * 100, 100)}%` }"
            ></div>
          </div>
          <div class="text-xs text-red-400/60 mt-1">目标: 20 道</div>
        </div>
      </div>

      <div class="text-center">
        <div class="text-4xl font-bold text-white">
          {{ leetcodeStats.easy + leetcodeStats.medium + leetcodeStats.hard }}
          <span class="text-lg text-dark-400 font-normal">/ 120</span>
        </div>
        <div class="text-dark-400 mt-1">算法题目完成</div>
      </div>
    </div>

    <!-- 额外学习统计 -->
    <div class="card">
      <h3 class="text-lg font-semibold text-white mb-6">✨ 额外学习统计</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 rounded-xl bg-dark-800/50">
          <div class="text-2xl font-bold text-white">
            {{ extraStore.extraLearnings.length }}
          </div>
          <div class="text-dark-400">学习记录</div>
        </div>
        <div class="p-4 rounded-xl bg-dark-800/50">
          <div class="text-2xl font-bold text-white">
            {{ Math.round(extraStore.totalDuration / 60 * 10) / 10 }}
          </div>
          <div class="text-dark-400">累计小时</div>
        </div>
        <div class="p-4 rounded-xl bg-dark-800/50">
          <div class="text-2xl font-bold text-white">
            {{ extraStore.categories.length }}
          </div>
          <div class="text-dark-400">学习分类</div>
        </div>
      </div>
    </div>
  </div>
</template>

