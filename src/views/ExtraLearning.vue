<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useExtraStore } from '@/stores/extraStore'
import { getToday, formatDateFriendly } from '@/utils/dateUtils'
import type { ExtraLearning } from '@/types/database'

const extraStore = useExtraStore()

const showModal = ref(false)
const editingId = ref<string | null>(null)
const filterCategory = ref('all')
const searchQuery = ref('')

const form = ref({
  title: '',
  category: '',
  duration: 30,
  resource_url: '',
  notes: ''
})

const defaultCategories = ['React', 'Vue', 'Node.js', 'TypeScript', '设计模式', 'Rust', '其他']

onMounted(async () => {
  await extraStore.loadExtraLearnings()
})

// 过滤后的记录
const filteredLearnings = computed(() => {
  let result = extraStore.extraLearnings

  if (filterCategory.value !== 'all') {
    result = result.filter(e => e.category === filterCategory.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(e => 
      e.title.toLowerCase().includes(query) ||
      e.category.toLowerCase().includes(query) ||
      e.notes?.toLowerCase().includes(query)
    )
  }

  return result
})

// 按日期分组
const learningsByDate = computed(() => {
  const groups: Record<string, ExtraLearning[]> = {}
  
  filteredLearnings.value.forEach(learning => {
    if (!groups[learning.date]) groups[learning.date] = []
    groups[learning.date].push(learning)
  })

  return Object.entries(groups)
    .map(([date, items]) => ({ date, items }))
    .sort((a, b) => b.date.localeCompare(a.date))
})

// 所有分类（包括用户自定义的）
const allCategories = computed(() => {
  const cats = new Set([...defaultCategories, ...extraStore.categories])
  return Array.from(cats)
})

// 打开添加弹窗
const openAddModal = () => {
  editingId.value = null
  form.value = {
    title: '',
    category: '',
    duration: 30,
    resource_url: '',
    notes: ''
  }
  showModal.value = true
}

// 打开编辑弹窗
const openEditModal = (learning: ExtraLearning) => {
  editingId.value = learning.id
  form.value = {
    title: learning.title,
    category: learning.category,
    duration: learning.duration,
    resource_url: learning.resource_url || '',
    notes: learning.notes || ''
  }
  showModal.value = true
}

// 保存记录
const saveRecord = async () => {
  if (!form.value.title || !form.value.category) {
    alert('请填写标题和分类')
    return
  }

  try {
    if (editingId.value) {
      await extraStore.updateExtraLearning(editingId.value, form.value)
    } else {
      await extraStore.addExtraLearning({
        date: getToday(),
        ...form.value
      })
    }
    showModal.value = false
  } catch (error) {
    alert('保存失败')
  }
}

// 删除记录
const deleteRecord = async (id: string) => {
  if (confirm('确定删除这条记录吗？')) {
    await extraStore.deleteExtraLearning(id)
  }
}

// 格式化时长
const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- 统计卡片 -->
    <div class="card bg-gradient-to-r from-accent-600/10 to-primary-600/10">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-white mb-2">✨ 额外学习</h2>
          <p class="text-dark-400">记录计划外的学习内容</p>
        </div>
        <div class="flex items-center gap-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-white">{{ extraStore.extraLearnings.length }}</div>
            <div class="text-xs text-dark-400">学习记录</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-white">{{ formatDuration(extraStore.totalDuration) }}</div>
            <div class="text-xs text-dark-400">累计时长</div>
          </div>
          <button 
            class="btn btn-primary"
            @click="openAddModal"
          >
            + 添加记录
          </button>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="card">
      <div class="flex flex-wrap items-center gap-4">
        <!-- 搜索 -->
        <div class="flex-1 min-w-[200px]">
          <input 
            v-model="searchQuery"
            type="text"
            class="input"
            placeholder="🔍 搜索学习记录..."
          />
        </div>

        <!-- 分类筛选 -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-sm text-dark-400">分类:</span>
          <button 
            :class="[
              'px-3 py-1.5 rounded-lg text-sm transition-all',
              filterCategory === 'all' 
                ? 'bg-primary-600 text-white' 
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            ]"
            @click="filterCategory = 'all'"
          >
            全部
          </button>
          <button 
            v-for="cat in allCategories"
            :key="cat"
            :class="[
              'px-3 py-1.5 rounded-lg text-sm transition-all',
              filterCategory === cat 
                ? 'bg-primary-600 text-white' 
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            ]"
            @click="filterCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>
    </div>

    <!-- 学习记录列表 -->
    <div v-if="filteredLearnings.length === 0" class="card text-center py-12">
      <div class="text-4xl mb-4">✨</div>
      <div class="text-dark-400">暂无学习记录</div>
      <button 
        class="btn btn-primary mt-4"
        @click="openAddModal"
      >
        添加第一条记录
      </button>
    </div>

    <template v-else>
      <div v-for="group in learningsByDate" :key="group.date" class="card">
        <div class="flex items-center gap-3 mb-6">
          <span class="text-lg font-semibold text-white">📅 {{ formatDateFriendly(group.date) }}</span>
          <span class="text-dark-400 text-sm">{{ group.items.length }} 条记录</span>
        </div>

        <div class="space-y-4">
          <div 
            v-for="learning in group.items"
            :key="learning.id"
            class="p-4 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 transition-all"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-lg">📚</span>
                  <span class="font-medium text-white">{{ learning.title }}</span>
                  <span class="tag tag-study">{{ learning.category }}</span>
                  <span class="text-sm text-dark-400">⏱️ {{ formatDuration(learning.duration) }}</span>
                </div>
                
                <div v-if="learning.notes" class="text-sm text-dark-400 mb-2 line-clamp-2">
                  {{ learning.notes }}
                </div>

                <div v-if="learning.resource_url" class="mt-2">
                  <a 
                    :href="learning.resource_url"
                    target="_blank"
                    class="text-sm text-primary-400 hover:text-primary-300"
                  >
                    🔗 查看资源 →
                  </a>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button 
                  class="btn btn-ghost text-sm"
                  @click="openEditModal(learning)"
                >
                  编辑
                </button>
                <button 
                  class="btn btn-ghost text-sm text-red-400 hover:text-red-300"
                  @click="deleteRecord(learning.id)"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 添加/编辑弹窗 -->
    <Teleport to="body">
      <div 
        v-if="showModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="showModal = false"
      >
        <div class="card w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-white">
              {{ editingId ? '编辑学习记录' : '添加学习记录' }}
            </h3>
            <button 
              class="text-dark-400 hover:text-white"
              @click="showModal = false"
            >
              ✕
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm text-dark-400 mb-2">学习主题 *</label>
              <input 
                v-model="form.title"
                type="text"
                class="input"
                placeholder="例如：React 18 Concurrent Mode 原理"
              />
            </div>

            <div>
              <label class="block text-sm text-dark-400 mb-2">分类标签 *</label>
              <div class="flex flex-wrap gap-2 mb-2">
                <button 
                  v-for="cat in defaultCategories"
                  :key="cat"
                  :class="[
                    'px-3 py-1.5 rounded-lg text-sm transition-all',
                    form.category === cat 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  ]"
                  @click="form.category = cat"
                >
                  {{ cat }}
                </button>
              </div>
              <input 
                v-model="form.category"
                type="text"
                class="input"
                placeholder="或输入自定义分类"
              />
            </div>

            <div>
              <label class="block text-sm text-dark-400 mb-2">学习时长（分钟）</label>
              <input 
                v-model.number="form.duration"
                type="number"
                class="input"
                min="1"
                placeholder="30"
              />
            </div>

            <div>
              <label class="block text-sm text-dark-400 mb-2">资源链接（可选）</label>
              <input 
                v-model="form.resource_url"
                type="url"
                class="input"
                placeholder="https://..."
              />
            </div>

            <div>
              <label class="block text-sm text-dark-400 mb-2">学习笔记（可选）</label>
              <textarea 
                v-model="form.notes"
                class="input min-h-[100px] resize-none"
                placeholder="记录学习心得..."
              ></textarea>
            </div>

            <div class="flex gap-3 pt-4">
              <button 
                class="btn btn-secondary flex-1"
                @click="showModal = false"
              >
                取消
              </button>
              <button 
                class="btn btn-primary flex-1"
                @click="saveRecord"
              >
                {{ editingId ? '保存修改' : '添加记录' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

