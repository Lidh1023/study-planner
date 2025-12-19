<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useTaskStore } from "@/stores/taskStore";
import {
  getWeekDateRange,
  getWeekNumber,
  formatDate,
  getPlanWeeks,
} from "@/utils/dateUtils";
import dayjs from "dayjs";

const router = useRouter();
const taskStore = useTaskStore();
const loading = ref(true);
const expandedWeek = ref<number | null>(null);
const planWeeks = getPlanWeeks();

// 当前周
const currentWeek = computed(() => getWeekNumber(dayjs()));

// 自适应阶段概览
const stageOverview = computed(() => {
  const stages: any[] = [];

  // 策略 1: 优先使用数据库中的 Milestones 作为阶段
  // 如果 AI 生成了 milestones 数据，那么每个 milestone 就是一个阶段
  if (taskStore.milestones && taskStore.milestones.length > 0) {
    taskStore.milestones.forEach((m, index) => {
      // 默认样式循环
      const styles = [
        { border: "border-purple-500", text: "text-purple-400" },
        { border: "border-blue-500", text: "text-blue-400" },
        { border: "border-cyan-500", text: "text-cyan-400" },
        { border: "border-red-500", text: "text-red-400" },
      ];
      const style = styles[index % 4];

      stages.push({
        label: `第${m.week}周`,
        title: m.title,
        description:
          (m.description?.slice(0, 30) || "") +
            ((m.description?.length || 0) > 30 ? "..." : "") || "阶段性目标",
        style,
      });
    });
    return stages;
  }

  // 策略 2: 如果没有里程碑数据，则使用自适应分段算法
  // - 1-4 周：每周一个阶段
  // - 5-12 周：分为 4 个阶段
  // - >12 周：每 4-8 周一个阶段
  let stageCount = 4;
  if (planWeeks <= 4) stageCount = planWeeks;
  else if (planWeeks > 12) stageCount = Math.ceil(planWeeks / 6); // 每6周一个阶段

  const step = Math.ceil(planWeeks / stageCount);

  for (let i = 0; i < stageCount; i++) {
    const startWeek = i * step + 1;
    const endWeek = Math.min((i + 1) * step, planWeeks);

    if (startWeek > planWeeks) break;

    // 样式循环
    const styles = [
      { border: "border-purple-500", text: "text-purple-400" },
      { border: "border-blue-500", text: "text-blue-400" },
      { border: "border-cyan-500", text: "text-cyan-400" },
      { border: "border-red-500", text: "text-red-400" },
    ];
    const style = styles[i % 4];

    stages.push({
      label:
        startWeek === endWeek
          ? `第${startWeek}周`
          : `第${startWeek}-${endWeek}周`,
      title: `阶段 ${i + 1}`,
      description: "完成阶段性学习目标",
      style,
    });
  }
  return stages;
});

// 动态周数的学习大纲数据
const weeklyRoadmap = computed(() => {
  const roadmap = [];

  for (let week = 1; week <= planWeeks; week++) {
    const dateRange = getWeekDateRange(week);

    // 获取这一周的任务
    const weekTasks = taskStore.tasks.filter((t) => t.week === week);
    const algorithmTasks = weekTasks.filter((t) => t.type === "algorithm");
    const studyTasks = weekTasks.filter((t) => t.type === "study");
    const projectTasks = weekTasks.filter((t) => t.type === "project");
    const otherTasks = weekTasks.filter(
      (t) => !["algorithm", "study", "project"].includes(t.type || "")
    );
    const completedCount = weekTasks.filter((t) => t.completed).length;

    // 获取这一周的里程碑
    const milestone = taskStore.milestones?.find((m) => m.week === week);

    // 动态推断本周分类 (Category)
    // 逻辑：统计哪种类型的任务最多
    let inferredCategory = "general";
    const counts = {
      algorithm: algorithmTasks.length,
      study: studyTasks.length,
      project: projectTasks.length,
      other: otherTasks.length,
    };

    // 找出数量最多的类型
    const maxType = Object.entries(counts).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];
    inferredCategory = maxType;

    // 按天分组任务
    const dayTasks: Record<number, any> = {};
    for (let day = (week - 1) * 7 + 1; day <= week * 7 && day <= 84; day++) {
      dayTasks[day] = {
        algorithm: algorithmTasks.filter((t) => t.day === day),
        study: studyTasks.filter((t) => t.day === day),
        project: projectTasks.filter((t) => t.day === day),
        other: otherTasks.filter((t) => t.day === day),
      };
    }

    roadmap.push({
      week,
      theme: milestone?.title || `第 ${week} 周学习`,
      category: inferredCategory,
      dateRange: `${formatDate(dateRange.start)} ~ ${formatDate(
        dateRange.end
      )}`,
      totalTasks: weekTasks.length,
      completedTasks: completedCount,
      percentage:
        weekTasks.length > 0
          ? Math.round((completedCount / weekTasks.length) * 100)
          : 0,
      algorithmCount: algorithmTasks.length,
      studyCount: studyTasks.length,
      projectCount: projectTasks.length,
      dayTasks,
      objectives: milestone?.description ? [milestone.description] : [],
    });
  }

  return roadmap;
});

// 切换展开状态
const toggleWeek = (week: number) => {
  expandedWeek.value = expandedWeek.value === week ? null : week;
};

// 跳转到每日任务
const goToDay = (day: number) => {
  const dateRange = getWeekDateRange(Math.ceil(day / 7));
  const dayInWeek = (day - 1) % 7;
  const targetDate = dateRange.start.add(dayInWeek, "day").format("YYYY-MM-DD");
  router.push(`/tasks?date=${targetDate}`);
};

// 获取分类标签样式
const getCategoryClass = (category: string) => {
  const classes: Record<string, string> = {
    algorithm: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    study: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    project: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    chrome: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", // 兼容旧数据
    ai: "bg-green-500/20 text-green-400 border-green-500/30", // 兼容旧数据
    other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    general: "bg-dark-600 text-dark-300",
  };
  return classes[category] || classes.general;
};

// 获取分类名称
const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    algorithm: "算法强化",
    study: "专项学习",
    project: "项目实战",
    chrome: "插件开发", // 兼容旧数据
    ai: "AI应用", // 兼容旧数据
    other: "综合任务",
    general: "综合学习",
  };
  return names[category] || "综合学习";
};

onMounted(async () => {
  loading.value = true;
  await taskStore.loadTasks();
  loading.value = false;
});
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- 页面标题 -->
    <div class="card bg-gradient-to-r from-primary-600/10 to-accent-600/10">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white flex items-center gap-3">
            🗺️ {{ planWeeks }}周学习大纲
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

    <!-- 阶段总览 (自适应生成) -->
    <div
      class="grid grid-cols-1 gap-4"
      :class="`md:grid-cols-${Math.min(stageOverview.length, 4)}`"
    >
      <div
        v-for="(stage, index) in stageOverview"
        :key="index"
        class="card text-center border-l-4"
        :class="stage.style.border"
      >
        <div class="text-sm text-dark-400 mb-1">{{ stage.label }}</div>
        <div
          class="text-lg font-bold truncate px-2"
          :title="stage.title"
          :class="stage.style.text"
        >
          {{ stage.title }}
        </div>
        <div
          class="text-xs text-dark-500 mt-1 truncate px-2"
          :title="stage.description"
        >
          {{ stage.description }}
        </div>
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
              :class="
                week.week === currentWeek
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-700 text-dark-300'
              "
            >
              W{{ week.week }}
            </div>

            <!-- 周信息 -->
            <div>
              <div class="flex items-center gap-3">
                <h3 class="text-lg font-semibold text-white">
                  {{ week.theme }}
                </h3>
                <span
                  :class="[
                    'px-2 py-0.5 text-xs rounded-full border',
                    getCategoryClass(week.category),
                  ]"
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
              <div class="text-sm text-dark-400 space-x-3">
                <span v-if="week.algorithmCount" class="text-purple-400"
                  >🧮 {{ week.algorithmCount }}</span
                >
                <span v-if="week.studyCount" class="text-blue-400"
                  >📖 {{ week.studyCount }}</span
                >
                <span v-if="week.projectCount" class="text-orange-400"
                  >� {{ week.projectCount }}</span
                >
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
          <div
            v-if="expandedWeek === week.week"
            class="mt-6 pt-6 border-t border-dark-700"
          >
            <!-- 学习目标 -->
            <div class="mb-6">
              <h4 class="text-sm font-medium text-dark-400 mb-3">
                🎯 本周学习目标
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div
                  v-for="(obj, idx) in week.objectives"
                  :key="idx"
                  class="flex items-center gap-2 text-sm"
                >
                  <span class="text-primary-400">✓</span>
                  <span class="text-dark-300">{{ obj }}</span>
                </div>
                <div
                  v-if="week.objectives.length === 0"
                  class="text-sm text-dark-500 italic"
                >
                  暂无具体目标描述
                </div>
              </div>
            </div>

            <!-- 每日任务预览 -->
            <div>
              <h4 class="text-sm font-medium text-dark-400 mb-3">
                📅 每日任务概览
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-7 gap-2">
                <div
                  v-for="(tasks, day) in week.dayTasks"
                  :key="day"
                  class="p-3 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 cursor-pointer transition-colors"
                  @click="goToDay(Number(day))"
                >
                  <div class="text-xs text-dark-500 mb-2">Day {{ day }}</div>

                  <!-- 动态显示前两个任务 -->
                  <div class="space-y-1">
                    <template
                      v-for="(typeTasks, typeKey) in tasks"
                      :key="typeKey"
                    >
                      <div
                        v-for="task in typeTasks.slice(0, 2)"
                        :key="task.id"
                        class="text-xs truncate"
                        :class="[
                          String(typeKey) === 'algorithm'
                            ? 'text-purple-400'
                            : String(typeKey) === 'study'
                            ? 'text-blue-400'
                            : String(typeKey) === 'project'
                            ? 'text-orange-400'
                            : 'text-gray-400',
                          { 'line-through opacity-50': task.completed },
                        ]"
                      >
                        {{
                          String(typeKey) === "algorithm"
                            ? "🧮"
                            : String(typeKey) === "study"
                            ? "📖"
                            : String(typeKey) === "project"
                            ? "💻"
                            : "📝"
                        }}
                        {{ task.title.slice(0, 10) }}...
                      </div>
                    </template>

                    <div
                      v-if="Object.values(tasks).flat().length === 0"
                      class="text-xs text-dark-600"
                    >
                      暂无任务
                    </div>
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
