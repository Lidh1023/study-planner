<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { Link, BookOpen, Video, FileText, Code } from 'lucide-vue-next'

const taskStore = useTaskStore()
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  await taskStore.loadTasks() // This loads tasks and resources
  loading.value = false
})

// 聚合数据：按周分组
const weekResources = computed(() => {
  const weeks: Record<number, { 
    week: number;
    resources: any[];
    algorithms: any[];
  }> = {}

  // 1. 处理学习资源
  taskStore.taskResources.forEach(res => {
    const task = taskStore.tasks.find(t => t.id === res.task_id)
    if (task) {
      if (!weeks[task.week]) {
        weeks[task.week] = { week: task.week, resources: [], algorithms: [] }
      }
      weeks[task.week].resources.push({
        ...res,
        taskTitle: task.title
      })
    }
  })

  // 2. 处理算法题目 (作为资源展示)
  taskStore.tasks.filter(t => t.type === 'algorithm').forEach(task => {
    if (!weeks[task.week]) {
      weeks[task.week] = { week: task.week, resources: [], algorithms: [] }
    }
    weeks[task.week].algorithms.push(task)
  })

  // 转换为数组并排序
  return Object.values(weeks).sort((a, b) => a.week - b.week)
})

const getResourceTypeIcon = (type: string) => {
  switch (type) {
    case 'video': return Video
    case 'article': return FileText
    case 'book': return BookOpen
    case 'code': return Code
    default: return Link
  }
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- 页面标题 -->
    <div class="card bg-gradient-to-r from-primary-600/10 to-accent-600/10">
      <h2 class="text-xl font-bold text-white mb-2">📚 学习资源</h2>
      <p class="text-dark-400">您的个性化学习资源库，跟随学习计划自动更新</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin text-3xl mb-2">🔄</div>
      <div class="text-dark-400">正在加载资源...</div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="weekResources.length === 0" class="text-center py-12 text-dark-400">
      暂无学习资源，请先生成学习规划或手动添加资源。
    </div>

    <!-- 资源列表 (按周) -->
    <div v-else class="space-y-8">
      <div 
        v-for="item in weekResources" 
        :key="item.week"
        class="card"
      >
        <div class="flex items-center gap-3 mb-6 border-b border-dark-700 pb-4">
          <span class="text-2xl font-bold text-primary-400">Week {{ item.week }}</span>
          <span class="text-dark-400 text-sm">阶段资源</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- 左侧：学习资料 -->
          <div>
            <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen class="w-5 h-5 text-accent-400" />
              学习资料
            </h3>
            
            <div v-if="item.resources.length === 0" class="text-dark-500 text-sm italic">
              本周暂无资料
            </div>
            
            <div v-else class="space-y-3">
              <a 
                v-for="res in item.resources" 
                :key="res.id"
                :href="res.url"
                target="_blank"
                class="flex items-start gap-3 p-3 rounded-lg bg-dark-800/50 hover:bg-dark-700/50 border border-dark-700 hover:border-accent-500/30 transition-all group"
              >
                <component :is="getResourceTypeIcon(res.type)" class="w-5 h-5 text-dark-400 group-hover:text-accent-400 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-white group-hover:text-accent-300 truncate">{{ res.title }}</div>
                  <div class="text-xs text-dark-500 mt-1">关联任务: {{ res.taskTitle }}</div>
                </div>
              </a>
            </div>
          </div>

          <!-- 右侧：算法题目 -->
          <div>
            <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Code class="w-5 h-5 text-emerald-400" />
              算法练习
            </h3>

            <div v-if="item.algorithms.length === 0" class="text-dark-500 text-sm italic">
              本周无算法任务
            </div>

            <div v-else class="space-y-3">
              <div 
                v-for="algo in item.algorithms" 
                :key="algo.id"
                class="flex items-center justify-between p-3 rounded-lg bg-dark-800/50 border border-dark-700"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <span :class="['tag', `tag-${algo.difficulty || 'medium'}`]">
                    {{ algo.difficulty === 'easy' ? '简单' : algo.difficulty === 'medium' ? '中等' : '困难' }}
                  </span>
                  <span class="text-white truncate">{{ algo.title }}</span>
                </div>
                <a 
                  v-if="algo.resource_url"
                  :href="algo.resource_url"
                  target="_blank"
                  class="text-xs text-emerald-400 hover:text-emerald-300 whitespace-nowrap ml-2"
                >
                  去练习 →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
