<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { getStudyProgress, getPlanWeeks } from "@/utils/dateUtils";

dayjs.locale("zh-cn");

const route = useRoute();
const router = useRouter();
const isSidebarCollapsed = ref(false);
const planWeeks = getPlanWeeks();

const navItems = [
  { path: "/", name: "仪表盘", icon: "🏠" },
  { path: "/plan", name: "AI 规划", icon: "🤖" },
  { path: "/roadmap", name: "学习大纲", icon: "🗺️" },
  { path: "/tasks", name: "每日任务", icon: "📋" },
  { path: "/review", name: "每日复盘", icon: "📝" },
  { path: "/notes", name: "笔记链接", icon: "📒" },
  { path: "/progress", name: "进度统计", icon: "📊" },
  { path: "/resources", name: "学习资源", icon: "📚" },
  { path: "/extra", name: "额外学习", icon: "✨" },
];

const currentDate = computed(() => {
  return dayjs().format("YYYY年M月D日 dddd");
});

const studyProgress = computed(() => {
  return getStudyProgress();
});

const progressText = computed(() => {
  const progress = studyProgress.value;
  if (!progress.hasStarted) {
    return `距离开始还有 ${progress.daysUntilStart} 天`;
  }
  return `第 ${progress.week} 周 · 第 ${progress.day} 天`;
});

const navigateTo = (path: string) => {
  router.push(path);
};
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed left-0 top-0 h-full bg-dark-900/80 backdrop-blur-xl border-r border-dark-700/50 transition-all duration-300 z-50',
        isSidebarCollapsed ? 'w-20' : 'w-64',
      ]"
    >
      <!-- Logo -->
      <div
        class="flex items-center gap-3 px-6 py-6 border-b border-dark-700/50"
      >
        <div
          class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xl font-bold"
        >
          {{ planWeeks }}
        </div>
        <div v-if="!isSidebarCollapsed" class="flex flex-col">
          <span class="text-lg font-bold text-white">WeekDev</span>
          <span class="text-xs text-dark-400">{{ planWeeks }}周学习计划</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="p-4 space-y-2">
        <div
          v-for="item in navItems"
          :key="item.path"
          :class="['nav-item', route.path === item.path && 'active']"
          @click="navigateTo(item.path)"
        >
          <span class="text-xl">{{ item.icon }}</span>
          <span v-if="!isSidebarCollapsed" class="font-medium">{{
            item.name
          }}</span>
        </div>

        <!-- Settings Button -->
        <div class="!mt-6 pt-4 border-t border-dark-700/50">
          <div
            :class="['nav-item', route.path === '/settings' && 'active']"
            @click="navigateTo('/settings')"
          >
            <span class="text-xl">⚙️</span>
            <span v-if="!isSidebarCollapsed" class="font-medium">系统设置</span>
          </div>
        </div>
      </nav>

      <!-- Collapse Button -->
      <button
        class="absolute bottom-6 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-dark-700 hover:bg-dark-600 flex items-center justify-center transition-all"
        @click="isSidebarCollapsed = !isSidebarCollapsed"
      >
        <span
          :class="[
            'transition-transform',
            isSidebarCollapsed ? 'rotate-180' : '',
          ]"
        >
          ◀
        </span>
      </button>
    </aside>

    <!-- Main Content -->
    <main
      :class="[
        'flex-1 transition-all duration-300',
        isSidebarCollapsed ? 'ml-20' : 'ml-64',
      ]"
    >
      <!-- Header -->
      <header
        class="sticky top-0 z-40 glass border-b border-dark-700/50 px-8 py-4"
      >
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold text-white">
              {{ route.meta.title || "12WeekDev" }}
            </h1>
            <p class="text-sm text-dark-400 mt-1">{{ currentDate }}</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <div class="text-sm text-dark-400">学习进度</div>
              <div class="text-lg font-bold text-primary-400">
                {{ progressText }}
              </div>
            </div>
            <div
              class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center"
            >
              <span class="text-white font-bold text-sm"
                >{{ studyProgress.percentage }}%</span
              >
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="p-8">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
