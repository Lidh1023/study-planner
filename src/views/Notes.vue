<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useTaskStore } from "@/stores/taskStore";

const taskStore = useTaskStore();

const filterPlatform = ref<string>("all");
const filterWeek = ref<number>(0);
const searchQuery = ref("");

onMounted(async () => {
  await Promise.all([taskStore.loadTasks(), taskStore.loadNoteLinks()]);
});

// 获取任务信息
const getTaskInfo = (taskId: string) => {
  return taskStore.tasks.find((t) => t.id === taskId);
};

// 过滤后的笔记
const filteredNotes = computed(() => {
  let notes = taskStore.noteLinks;

  // 平台筛选
  if (filterPlatform.value !== "all") {
    notes = notes.filter((n) => n.platform === filterPlatform.value);
  }

  // 周次筛选
  if (filterWeek.value > 0) {
    notes = notes.filter((n) => {
      const task = getTaskInfo(n.task_id);
      return task && task.week === filterWeek.value;
    });
  }

  // 搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    notes = notes.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        getTaskInfo(n.task_id)?.title.toLowerCase().includes(query)
    );
  }

  return notes;
});

// 按周分组
const notesByWeek = computed(() => {
  const groups: Record<number, typeof filteredNotes.value> = {};

  filteredNotes.value.forEach((note) => {
    const task = getTaskInfo(note.task_id);
    const week = task?.week || 0;
    if (!groups[week]) groups[week] = [];
    groups[week].push(note);
  });

  return Object.entries(groups)
    .map(([week, notes]) => ({ week: Number(week), notes }))
    .sort((a, b) => b.week - a.week);
});

// 统计
const stats = computed(() => {
  const platforms: Record<string, number> = {};
  taskStore.noteLinks.forEach((n) => {
    platforms[n.platform] = (platforms[n.platform] || 0) + 1;
  });
  return platforms;
});

// 删除笔记
const deleteNote = async (noteId: string) => {
  if (confirm("确定删除这个笔记链接吗？")) {
    await taskStore.deleteNoteLink(noteId);
  }
};

// 获取平台显示名称和样式
const getPlatformInfo = (platform: string) => {
  const info: Record<string, { name: string; class: string }> = {
    yuque: { name: "语雀", class: "tag-yuque" },
    notion: { name: "Notion", class: "tag-notion" },
    feishu: { name: "飞书", class: "tag-feishu" },
    other: { name: "其他", class: "tag-other" },
  };
  return info[platform] || info.other;
};

// 周次主题
const weekThemes: Record<number, string> = {
  1: "数组与哈希表",
  2: "链表与栈",
  3: "二叉树",
  4: "动态规划入门",
  5: "Chrome 插件基础",
  6: "Chrome 插件核心 API",
  7: "AI 网页助手实战",
  8: "AI 前端交互",
  9: "VSCode 插件基础",
  10: "VSCode 插件核心功能",
  11: "LSP 协议入门",
  12: "面试冲刺",
};
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- 统计卡片 -->
    <div class="card bg-gradient-to-r from-primary-600/10 to-accent-600/10">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-white mb-2">📒 笔记链接</h2>
          <p class="text-dark-400">管理你的学习笔记链接</p>
        </div>
        <div class="flex items-center gap-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-white">
              {{ taskStore.noteLinks.length }}
            </div>
            <div class="text-xs text-dark-400">总计</div>
          </div>
          <div
            v-for="(count, platform) in stats"
            :key="platform"
            class="text-center"
          >
            <div class="text-lg font-bold text-white">{{ count }}</div>
            <div class="text-xs text-dark-400">
              {{ getPlatformInfo(platform).name }}
            </div>
          </div>
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
            placeholder="🔍 搜索笔记..."
          />
        </div>

        <!-- 平台筛选 -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-dark-400">平台:</span>
          <button
            v-for="p in ['all', 'yuque', 'notion', 'feishu', 'other']"
            :key="p"
            :class="[
              'px-3 py-1.5 rounded-lg text-sm transition-all',
              filterPlatform === p
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600',
            ]"
            @click="filterPlatform = p"
          >
            {{ p === "all" ? "全部" : getPlatformInfo(p).name }}
          </button>
        </div>

        <!-- 周次筛选 -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-dark-400">周次:</span>
          <select v-model="filterWeek" class="input w-auto py-1.5">
            <option :value="0">全部</option>
            <option v-for="w in 12" :key="w" :value="w">第 {{ w }} 周</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 笔记列表 -->
    <div v-if="filteredNotes.length === 0" class="card text-center py-12">
      <div class="text-4xl mb-4">📝</div>
      <div class="text-dark-400">暂无笔记链接</div>
      <div class="text-sm text-dark-500 mt-2">在每日任务页面添加笔记链接</div>
    </div>

    <template v-else>
      <div v-for="group in notesByWeek" :key="group.week" class="card">
        <div class="flex items-center gap-3 mb-6">
          <h3 class="text-lg font-semibold text-white">
            📅 第 {{ group.week }} 周
          </h3>
          <span class="tag tag-study">{{ weekThemes[group.week] }}</span>
          <span class="text-dark-400 text-sm ml-auto"
            >{{ group.notes.length }} 篇</span
          >
        </div>

        <div class="space-y-3">
          <div
            v-for="note in group.notes"
            :key="note.id"
            class="p-4 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 transition-all"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-lg">📝</span>
                  <a
                    :href="note.url"
                    target="_blank"
                    class="font-medium text-white hover:text-primary-400 transition-colors"
                  >
                    {{ note.title }}
                  </a>
                  <span :class="['tag', getPlatformInfo(note.platform).class]">
                    {{ getPlatformInfo(note.platform).name }}
                  </span>
                </div>
                <div class="text-sm text-dark-400">
                  关联任务: {{ getTaskInfo(note.task_id)?.title || "未知任务" }}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <a
                  :href="note.url"
                  target="_blank"
                  class="btn btn-ghost text-sm"
                >
                  打开 →
                </a>
                <button
                  class="btn btn-ghost text-sm text-red-400 hover:text-red-300"
                  @click="deleteNote(note.id)"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
