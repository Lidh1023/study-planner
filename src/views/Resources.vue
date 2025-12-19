<script setup lang="ts">
import { ref, computed } from 'vue'

const activeTab = ref('all')

const tabs = [
  { id: 'all', name: '全部' },
  { id: 'interview', name: '🔥 面试' },
  { id: 'algorithm', name: '算法' },
  { id: 'engineering', name: '工程化' },
  { id: 'chrome', name: 'Chrome插件' },
  { id: 'vscode', name: 'VSCode插件' },
  { id: 'lsp', name: 'LSP' },
  { id: 'ai', name: 'AI交互' },
]

const resources = ref([
  // 面试资源 - 优先级最高
  {
    category: 'interview',
    title: '前端面试派 - JS手写代码',
    description: '高频面试题：深拷贝、防抖节流、Promise、LRU缓存等',
    url: 'https://www.mianshipai.com/docs/written-exam/JS-writing.html',
    icon: '🔥',
    priority: true
  },
  {
    category: 'interview',
    title: '前端面试派 - 数据结构与算法',
    description: '面试常考的数据结构和算法题目',
    url: 'https://www.mianshipai.com/docs/written-exam/JS-writing.html',
    icon: '🧮'
  },
  {
    category: 'interview',
    title: '前端面试派 - 完整文档',
    description: '涵盖一面、二面、三面、HR面全流程',
    url: 'https://www.mianshipai.com/',
    icon: '📚'
  },
  // 算法
  {
    category: 'algorithm',
    title: '代码随想录',
    description: '系统的算法学习路线，适合刷题入门',
    url: 'https://programmercarl.com/',
    icon: '📖'
  },
  {
    category: 'algorithm',
    title: 'labuladong 的算法笔记',
    description: '框架思维学算法，讲解清晰',
    url: 'https://labuladong.github.io/algo/',
    icon: '📖'
  },
  {
    category: 'algorithm',
    title: 'LeetCode Hot 100',
    description: '高频面试题精选',
    url: 'https://leetcode.cn/studyplan/top-100-liked/',
    icon: '🔥'
  },
  {
    category: 'algorithm',
    title: 'LeetCode 主站',
    description: '刷题主站',
    url: 'https://leetcode.cn/',
    icon: '💻'
  },
  // 工程化
  {
    category: 'engineering',
    title: 'Vite 官方文档',
    description: '下一代前端构建工具',
    url: 'https://cn.vitejs.dev/',
    icon: '⚡'
  },
  {
    category: 'engineering',
    title: 'Webpack 官方文档',
    description: '模块打包器',
    url: 'https://webpack.docschina.org/',
    icon: '📦'
  },
  {
    category: 'engineering',
    title: 'Rollup 官方文档',
    description: 'ES 模块打包器',
    url: 'https://cn.rollupjs.org/',
    icon: '🎯'
  },
  // Chrome 插件
  {
    category: 'chrome',
    title: 'Chrome 插件开发文档',
    description: '官方开发指南',
    url: 'https://developer.chrome.com/docs/extensions/',
    icon: '🌐'
  },
  {
    category: 'chrome',
    title: 'Chrome Extension Samples',
    description: '官方示例代码',
    url: 'https://github.com/nicedreams/nicedreams-chrome-extension-samples',
    icon: '📂'
  },
  // VSCode 插件
  {
    category: 'vscode',
    title: 'VSCode 插件开发文档',
    description: '官方 API 文档',
    url: 'https://code.visualstudio.com/api',
    icon: '💠'
  },
  {
    category: 'vscode',
    title: 'VSCode Extension Samples',
    description: '官方示例仓库',
    url: 'https://github.com/microsoft/vscode-extension-samples',
    icon: '📂'
  },
  // LSP
  {
    category: 'lsp',
    title: 'LSP 官方规范',
    description: 'Language Server Protocol 规范',
    url: 'https://microsoft.github.io/language-server-protocol/',
    icon: '📜'
  },
  {
    category: 'lsp',
    title: 'LSP 示例仓库',
    description: 'Microsoft LSP 实现示例',
    url: 'https://github.com/microsoft/vscode-languageserver-node',
    icon: '📂'
  },
  // AI 交互
  {
    category: 'ai',
    title: 'Vercel AI SDK',
    description: 'AI 应用开发框架',
    url: 'https://sdk.vercel.ai/',
    icon: '🤖'
  },
  {
    category: 'ai',
    title: 'OpenAI API 文档',
    description: '官方 API 文档',
    url: 'https://platform.openai.com/docs/',
    icon: '🧠'
  },
])

// LeetCode 推荐题目
const leetcodeProblems = ref([
  // 第1周：数组与哈希表
  { week: 1, problems: [
    { id: 1, title: '两数之和', difficulty: 'easy', url: 'https://leetcode.cn/problems/two-sum/' },
    { id: 15, title: '三数之和', difficulty: 'medium', url: 'https://leetcode.cn/problems/3sum/' },
    { id: 3, title: '无重复字符的最长子串', difficulty: 'medium', url: 'https://leetcode.cn/problems/longest-substring-without-repeating-characters/' },
    { id: 49, title: '字母异位词分组', difficulty: 'medium', url: 'https://leetcode.cn/problems/group-anagrams/' },
    { id: 128, title: '最长连续序列', difficulty: 'medium', url: 'https://leetcode.cn/problems/longest-consecutive-sequence/' },
  ]},
  // 第2周：链表与栈
  { week: 2, problems: [
    { id: 206, title: '反转链表', difficulty: 'easy', url: 'https://leetcode.cn/problems/reverse-linked-list/' },
    { id: 21, title: '合并两个有序链表', difficulty: 'easy', url: 'https://leetcode.cn/problems/merge-two-sorted-lists/' },
    { id: 141, title: '环形链表', difficulty: 'easy', url: 'https://leetcode.cn/problems/linked-list-cycle/' },
    { id: 20, title: '有效的括号', difficulty: 'easy', url: 'https://leetcode.cn/problems/valid-parentheses/' },
    { id: 155, title: '最小栈', difficulty: 'medium', url: 'https://leetcode.cn/problems/min-stack/' },
  ]},
  // 第3周：二叉树
  { week: 3, problems: [
    { id: 94, title: '二叉树的中序遍历', difficulty: 'easy', url: 'https://leetcode.cn/problems/binary-tree-inorder-traversal/' },
    { id: 104, title: '二叉树的最大深度', difficulty: 'easy', url: 'https://leetcode.cn/problems/maximum-depth-of-binary-tree/' },
    { id: 102, title: '二叉树的层序遍历', difficulty: 'medium', url: 'https://leetcode.cn/problems/binary-tree-level-order-traversal/' },
    { id: 226, title: '翻转二叉树', difficulty: 'easy', url: 'https://leetcode.cn/problems/invert-binary-tree/' },
    { id: 236, title: '二叉树的最近公共祖先', difficulty: 'medium', url: 'https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/' },
  ]},
  // 第4周：动态规划
  { week: 4, problems: [
    { id: 70, title: '爬楼梯', difficulty: 'easy', url: 'https://leetcode.cn/problems/climbing-stairs/' },
    { id: 322, title: '零钱兑换', difficulty: 'medium', url: 'https://leetcode.cn/problems/coin-change/' },
    { id: 300, title: '最长递增子序列', difficulty: 'medium', url: 'https://leetcode.cn/problems/longest-increasing-subsequence/' },
    { id: 53, title: '最大子数组和', difficulty: 'medium', url: 'https://leetcode.cn/problems/maximum-subarray/' },
    { id: 62, title: '不同路径', difficulty: 'medium', url: 'https://leetcode.cn/problems/unique-paths/' },
  ]},
])

const filteredResources = computed(() => {
  if (activeTab.value === 'all') return resources.value
  return resources.value.filter(r => r.category === activeTab.value)
})

const currentWeekProblems = computed(() => {
  return leetcodeProblems.value
})
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- 页面标题 -->
    <div class="card bg-gradient-to-r from-primary-600/10 to-accent-600/10">
      <h2 class="text-xl font-bold text-white mb-2">📚 学习资源</h2>
      <p class="text-dark-400">精选学习资源和 LeetCode 题目推荐</p>
    </div>

    <!-- 🔥 置顶推荐：面试资源 -->
    <div class="card bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-500/30">
      <div class="flex items-center gap-3 mb-4">
        <span class="text-2xl">🔥</span>
        <h3 class="text-lg font-bold text-white">面试必备资源</h3>
        <span class="px-2 py-0.5 text-xs rounded-full bg-orange-500/30 text-orange-400 border border-orange-500/40">
          置顶推荐
        </span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a 
          href="https://www.mianshipai.com/docs/written-exam/JS-writing.html"
          target="_blank"
          class="p-4 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 border border-dark-600 hover:border-orange-500/50 transition-all group"
        >
          <div class="flex items-center gap-3 mb-2">
            <span class="text-2xl">✍️</span>
            <span class="font-semibold text-white group-hover:text-orange-400 transition-colors">JS 手写代码</span>
          </div>
          <p class="text-sm text-dark-400">深拷贝、防抖节流、Promise、bind、LRU缓存...</p>
        </a>
        <a 
          href="https://www.mianshipai.com/docs/interview/JS-basic.html"
          target="_blank"
          class="p-4 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 border border-dark-600 hover:border-orange-500/50 transition-all group"
        >
          <div class="flex items-center gap-3 mb-2">
            <span class="text-2xl">📖</span>
            <span class="font-semibold text-white group-hover:text-orange-400 transition-colors">JS 基础知识</span>
          </div>
          <p class="text-sm text-dark-400">作用域、闭包、原型链、事件循环...</p>
        </a>
        <a 
          href="https://www.mianshipai.com/"
          target="_blank"
          class="p-4 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 border border-dark-600 hover:border-orange-500/50 transition-all group"
        >
          <div class="flex items-center gap-3 mb-2">
            <span class="text-2xl">🎯</span>
            <span class="font-semibold text-white group-hover:text-orange-400 transition-colors">完整面试指南</span>
          </div>
          <p class="text-sm text-dark-400">从简历到谈薪，一面到HR面全流程</p>
        </a>
      </div>
    </div>

    <!-- 分类标签 -->
    <div class="flex flex-wrap gap-2">
      <button 
        v-for="tab in tabs"
        :key="tab.id"
        :class="[
          'px-4 py-2 rounded-lg font-medium transition-all',
          activeTab === tab.id 
            ? 'bg-primary-600 text-white' 
            : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
        ]"
        @click="activeTab = tab.id"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- 资源列表 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <a 
        v-for="resource in filteredResources"
        :key="resource.url"
        :href="resource.url"
        target="_blank"
        class="card hover:scale-[1.02] hover:border-primary-500/30 transition-all"
      >
        <div class="flex items-start gap-4">
          <span class="text-3xl">{{ resource.icon }}</span>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-white mb-1">{{ resource.title }}</div>
            <div class="text-sm text-dark-400">{{ resource.description }}</div>
          </div>
          <span class="text-dark-500">→</span>
        </div>
      </a>
    </div>

    <!-- LeetCode 题目推荐 -->
    <div class="card">
      <h3 class="text-lg font-semibold text-white mb-6">🧮 LeetCode 题目推荐</h3>
      
      <div class="space-y-6">
        <div 
          v-for="weekData in currentWeekProblems"
          :key="weekData.week"
          class="p-4 rounded-xl bg-dark-800/50"
        >
          <div class="flex items-center gap-3 mb-4">
            <span class="text-lg font-semibold text-white">第 {{ weekData.week }} 周</span>
            <span class="tag tag-algorithm">
              {{ weekData.week === 1 ? '数组与哈希表' : 
                 weekData.week === 2 ? '链表与栈' : 
                 weekData.week === 3 ? '二叉树' : '动态规划' }}
            </span>
          </div>
          
          <div class="space-y-2">
            <a 
              v-for="problem in weekData.problems"
              :key="problem.id"
              :href="problem.url"
              target="_blank"
              class="flex items-center justify-between p-3 rounded-lg bg-dark-700/50 hover:bg-dark-600/50 transition-all"
            >
              <div class="flex items-center gap-3">
                <span class="text-dark-500 font-mono">#{{ problem.id }}</span>
                <span class="text-white">{{ problem.title }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span :class="['tag', `tag-${problem.difficulty}`]">
                  {{ problem.difficulty === 'easy' ? '简单' : problem.difficulty === 'medium' ? '中等' : '困难' }}
                </span>
                <span class="text-primary-400">去做题 →</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

