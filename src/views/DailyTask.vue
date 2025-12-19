<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useTaskStore } from "@/stores/taskStore";
import {
  getToday,
  getWeekNumber,
  getWeekTheme,
  getDayNumber,
} from "@/utils/dateUtils";
import type { Task } from "@/types/database";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import CalendarPicker from "@/components/CalendarPicker.vue";
import { Link, BookOpen, Video, FileText, Plus } from "lucide-vue-next";

dayjs.locale("zh-cn");

const route = useRoute();
const taskStore = useTaskStore();

// 支持从 URL 参数获取日期
const getInitialDate = () => {
  const dateParam = route.query.date as string;
  if (dateParam && dayjs(dateParam).isValid()) {
    return dateParam;
  }
  return getToday();
};

const currentDate = ref(getInitialDate());
const showNoteModal = ref(false);
const showResourceModal = ref(false);
const showCalendar = ref(false);
const selectedTask = ref<Task | null>(null);

// Note Form
const noteForm = ref({
  title: "",
  url: "",
  platform: "notion" as "yuque" | "notion" | "feishu" | "other",
});

// Resource Form
const resourceForm = ref({
  title: "",
  url: "",
  type: "article",
});

// 日期导航
const prevDate = computed(() => {
  return dayjs(currentDate.value).subtract(1, "day").format("YYYY-MM-DD");
});

const nextDate = computed(() => {
  return dayjs(currentDate.value).add(1, "day").format("YYYY-MM-DD");
});

// 当前日期信息
const dateInfo = computed(() => {
  const date = dayjs(currentDate.value);
  const week = getWeekNumber(currentDate.value);
  const day = getDayNumber(currentDate.value);
  const weekInfo = getWeekTheme(week);

  return {
    week,
    day,
    weekday: date.format("dddd"),
    theme: weekInfo.theme,
    formatted: date.format("M月D日"),
  };
});

// 切换日期
const changeDate = (direction: "prev" | "next" | "today") => {
  if (direction === "today") {
    currentDate.value = getToday();
  } else if (direction === "prev") {
    currentDate.value = prevDate.value;
  } else {
    currentDate.value = nextDate.value;
  }
};

// 监听日期变化，加载对应任务
watch(
  currentDate,
  async (newDate) => {
    await taskStore.loadTasksByDate(newDate);
  },
  { immediate: true }
);

onMounted(async () => {
  await taskStore.loadNoteLinks();
});

// 任务类型信息辅助函数
const getTypeInfo = (type: string) => {
  const map: Record<string, any> = {
    algorithm: { icon: "🧮", label: "算法任务", tag: "algorithm" },
    study: { icon: "📖", label: "专项学习", tag: "study" },
    project: { icon: "💻", label: "项目实战", tag: "project" },
    other: { icon: "📝", label: "其他任务", tag: "other" },
  };
  return map[type] || { icon: "📌", label: type, tag: "other" };
};

// 打开添加笔记弹窗
const openNoteModal = (task: Task) => {
  selectedTask.value = task;
  noteForm.value = { title: "", url: "", platform: "notion" };
  showNoteModal.value = true;
};

// 打开添加资源弹窗
const openResourceModal = (task: Task) => {
  selectedTask.value = task;
  resourceForm.value = { title: "", url: "", type: "article" };
  showResourceModal.value = true;
};

// 添加笔记
const addNote = async () => {
  if (!selectedTask.value || !noteForm.value.title || !noteForm.value.url)
    return;

  try {
    await taskStore.addNoteLink({
      task_id: selectedTask.value.id,
      title: noteForm.value.title,
      url: noteForm.value.url,
      platform: noteForm.value.platform,
    });
    showNoteModal.value = false;
  } catch (error) {
    alert("添加笔记失败");
  }
};

// 添加资源
const addResource = async () => {
  if (!selectedTask.value || !resourceForm.value.title) return;

  try {
    await taskStore.addTaskResource({
      task_id: selectedTask.value.id,
      title: resourceForm.value.title,
      url: resourceForm.value.url,
      type: resourceForm.value.type,
    });
    showResourceModal.value = false;
  } catch (error) {
    alert("添加资源失败");
  }
};

// 删除笔记
const deleteNote = async (noteId: string) => {
  if (confirm("确定删除这个笔记链接吗？")) {
    await taskStore.deleteNoteLink(noteId);
  }
};

// 删除资源
const deleteResource = async (resourceId: string) => {
  if (confirm("确定移除这个学习资源吗？")) {
    await taskStore.deleteTaskResource(resourceId);
  }
};

// 获取平台显示名称
const getPlatformName = (platform: string) => {
  const names: Record<string, string> = {
    yuque: "语雀",
    notion: "Notion",
    feishu: "飞书",
    other: "其他",
  };
  return names[platform] || platform;
};

const getResourceTypeIcon = (type: string) => {
  switch (type) {
    case "video":
      return Video;
    case "article":
      return FileText;
    case "book":
      return BookOpen;
    default:
      return Link;
  }
};
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- 日期导航 -->
    <div class="card">
      <div class="flex items-center justify-between">
        <button class="btn btn-ghost" @click="changeDate('prev')">
          ◀ 前一天
        </button>

        <!-- 点击弹出日历 -->
        <div
          class="text-center cursor-pointer hover:bg-dark-700/50 px-6 py-2 rounded-xl transition-all"
          @click="showCalendar = true"
        >
          <div
            class="text-2xl font-bold text-white flex items-center justify-center gap-2"
          >
            {{ dateInfo.formatted }} · {{ dateInfo.weekday }}
            <span class="text-base text-dark-400">📅</span>
          </div>
          <div class="text-dark-400 mt-1">
            <template v-if="dateInfo.day > 0">
              第 {{ dateInfo.week }} 周 · 第 {{ dateInfo.day }} 天 ·
              {{ dateInfo.theme }}
            </template>
            <template v-else> 计划未开始 </template>
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
          <button class="btn btn-ghost" @click="changeDate('next')">
            后一天 ▶
          </button>
        </div>
      </div>
    </div>

    <!-- 日历选择器 -->
    <CalendarPicker v-model="currentDate" v-model:show="showCalendar" />

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
            {{ taskStore.todayTasks.filter((t) => t.completed).length }} /
            {{ taskStore.todayTasks.length }} 任务
          </div>
        </div>
      </div>
    </div>

    <!-- 动态渲染任务分组 -->
    <div v-if="taskStore.loading" class="text-center py-8 text-dark-400">
      加载中...
    </div>

    <div
      v-else-if="
        !taskStore.groupedTasks ||
        Object.keys(taskStore.groupedTasks).length === 0
      "
      class="text-center py-8 text-dark-400"
    >
      今天没有任务安排
    </div>

    <template v-else>
      <div
        v-for="(tasks, type) in taskStore.groupedTasks"
        :key="type"
        class="card"
      >
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <span class="text-2xl">{{ getTypeInfo(type).icon }}</span>
            <h3 class="text-lg font-semibold text-white">
              {{ getTypeInfo(type).label }}
            </h3>
            <!-- <span class="tag tag-algorithm">45分钟</span> (Time estimation not available in schema yet) -->
          </div>
          <span class="text-dark-400">
            {{ tasks.filter((t) => t.completed).length }} /
            {{ tasks.length }} 完成
          </span>
        </div>

        <div class="space-y-4">
          <div
            v-for="task in tasks"
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
                  <span
                    :class="[
                      'font-medium',
                      task.completed
                        ? 'text-dark-500 line-through'
                        : 'text-white',
                    ]"
                  >
                    {{ task.title }}
                  </span>
                  <span
                    v-if="task.difficulty"
                    :class="['tag', `tag-${task.difficulty}`]"
                  >
                    {{
                      task.difficulty === "easy"
                        ? "简单"
                        : task.difficulty === "medium"
                        ? "中等"
                        : "困难"
                    }}
                  </span>
                </div>

                <div v-if="task.description" class="text-sm text-dark-400 mb-3">
                  {{ type === "algorithm" ? "💡" : "🎯" }}
                  {{ task.description }}
                </div>

                <!-- 学习资源 (AI 生成 + 手动添加) -->
                <div class="mb-3">
                  <div class="flex flex-wrap items-center gap-2">
                    <template
                      v-for="resource in taskStore.getTaskResources(task.id)"
                      :key="resource.id"
                    >
                      <a
                        :href="resource.url"
                        target="_blank"
                        class="group flex items-center gap-1.5 px-2 py-1 rounded bg-dark-700 text-xs text-primary-300 hover:bg-dark-600 hover:text-primary-200 transition-colors"
                      >
                        <component
                          :is="getResourceTypeIcon(resource.type)"
                          class="w-3 h-3"
                        />
                        {{ resource.title }}
                        <button
                          class="ml-1 text-dark-500 opacity-0 group-hover:opacity-100 hover:text-red-400"
                          @click.prevent="deleteResource(resource.id)"
                        >
                          ✕
                        </button>
                      </a>
                    </template>

                    <!-- 旧版单一资源兼容 -->
                    <a
                      v-if="
                        task.resource_url &&
                        taskStore.getTaskResources(task.id).length === 0
                      "
                      :href="task.resource_url"
                      target="_blank"
                      class="flex items-center gap-1.5 px-2 py-1 rounded bg-dark-700 text-xs text-primary-300 hover:bg-dark-600"
                    >
                      <Link class="w-3 h-3" />
                      查看资源
                    </a>

                    <button
                      class="text-xs text-dark-400 hover:text-white flex items-center gap-1 px-2 py-1"
                      @click="openResourceModal(task)"
                    >
                      <Plus class="w-3 h-3" /> 资源
                    </button>
                  </div>
                </div>

                <!-- 笔记链接 (用户输出) -->
                <div
                  class="flex flex-wrap items-center gap-2 border-t border-dark-700/50 pt-3"
                >
                  <span class="text-xs text-dark-500 mr-1">我的笔记:</span>
                  <template
                    v-for="note in taskStore.getTaskNotes(task.id)"
                    :key="note.id"
                  >
                    <a
                      :href="note.url"
                      target="_blank"
                      :class="['tag', `tag-${note.platform}`]"
                    >
                      📝 {{ note.title }}
                    </a>
                    <button
                      class="text-dark-500 hover:text-red-400 text-xs -ml-1"
                      @click="deleteNote(note.id)"
                    >
                      ✕
                    </button>
                  </template>

                  <button
                    class="text-xs text-dark-400 hover:text-primary-400"
                    @click="openNoteModal(task)"
                  >
                    + 添加
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

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
                      : 'border-dark-600 text-dark-300 hover:border-dark-500',
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

    <!-- 添加资源弹窗 -->
    <Teleport to="body">
      <div
        v-if="showResourceModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="showResourceModal = false"
      >
        <div class="card w-full max-w-md mx-4">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-white">添加学习资源</h3>
            <button
              class="text-dark-400 hover:text-white"
              @click="showResourceModal = false"
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
              <label class="block text-sm text-dark-400 mb-2">资源标题 *</label>
              <input
                v-model="resourceForm.title"
                type="text"
                class="input"
                placeholder="例如：MDN 文档"
              />
            </div>

            <div>
              <label class="block text-sm text-dark-400 mb-2">资源类型</label>
              <select v-model="resourceForm.type" class="input w-full">
                <option value="article">文章/文档</option>
                <option value="video">视频</option>
                <option value="book">书籍</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div>
              <label class="block text-sm text-dark-400 mb-2">链接地址</label>
              <input
                v-model="resourceForm.url"
                type="url"
                class="input"
                placeholder="https://..."
              />
            </div>

            <div class="flex gap-3 pt-4">
              <button
                class="btn btn-secondary flex-1"
                @click="showResourceModal = false"
              >
                取消
              </button>
              <button
                class="btn btn-primary flex-1"
                :disabled="!resourceForm.title"
                @click="addResource"
              >
                添加资源
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
