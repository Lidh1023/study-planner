<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useSettingsStore } from "@/stores/settingsStore";
import { getStartDate, setStartDate, formatDate } from "@/utils/dateUtils";
import dayjs from "dayjs";
import { Eye, EyeOff } from "lucide-vue-next";

const router = useRouter();
const settingsStore = useSettingsStore();

// Learning Plan Config
const planWeeks = ref(settingsStore.planDurationWeeks);

// Date Settings
const startDate = ref(formatDate(getStartDate()));
const endDate = computed(() => {
  const totalDays = planWeeks.value * 7 - 1;
  return dayjs(startDate.value).add(totalDays, "day").format("YYYY-MM-DD");
});

// Supabase Settings
const supabaseUrl = ref(settingsStore.supabaseUrl);
const supabaseKey = ref(settingsStore.supabaseKey);

// AI Settings
const llmApiKey = ref(settingsStore.llmApiKey);
const llmBaseUrl = ref(settingsStore.llmBaseUrl);

const showToast = ref(false);
const showConfirmModal = ref(false);
const showSupabaseKey = ref(false);
const showLlmApiKey = ref(false);

const saveSettings = () => {
  // Check if weeks changed
  if (planWeeks.value !== settingsStore.planDurationWeeks) {
    showConfirmModal.value = true;
    return;
  }

  commitSave(false);
};

const commitSave = (redirect: boolean) => {
  // Save Store Settings
  settingsStore.saveSettings(
    supabaseUrl.value,
    supabaseKey.value,
    llmApiKey.value,
    llmBaseUrl.value,
    planWeeks.value
  );

  // Save Date Setting (if changed)
  const currentStart = formatDate(getStartDate());
  if (startDate.value !== currentStart) {
    setStartDate(startDate.value); // This triggers reload
    return;
  }

  // If redirect requested (e.g. for re-planning)
  if (redirect) {
    router.push("/plan?auto=true");
    return;
  }

  // Otherwise, normal save
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
    window.location.reload();
  }, 1500);
};

const handleConfirm = () => {
  showConfirmModal.value = false;
  commitSave(true);
};

const handleCancel = () => {
  showConfirmModal.value = false;
  commitSave(false);
};
</script>

<template>
  <div class="space-y-8 animate-fade-in max-w-3xl mx-auto">
    <!-- Header -->
    <div
      class="card bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30"
    >
      <h2 class="text-2xl font-bold text-white mb-2">⚙️ 系统设置</h2>
      <p class="text-dark-300">配置学习周期、数据库和 AI 模型连接信息。</p>
    </div>

    <!-- Learning Plan Date -->
    <div class="card">
      <h3 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <span class="text-xl">📅</span> 学习周期设置
      </h3>

      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-dark-300 mb-1"
              >开始日期</label
            >
            <input v-model="startDate" type="date" class="input w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-dark-300 mb-1"
              >计划时长 (周)</label
            >
            <input
              v-model="planWeeks"
              type="number"
              min="1"
              max="52"
              class="input w-full"
            />
          </div>
        </div>

        <p class="text-xs text-dark-500 mt-2">
          预计结束日期：{{ endDate }} (共 {{ planWeeks * 7 }} 天)
        </p>

        <div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p class="text-sm text-amber-400">
            💡 修改设置后，系统会自动重算所有日期和进度。
          </p>
        </div>
      </div>
    </div>

    <!-- Supabase Configuration -->
    <div class="card">
      <h3 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <span class="text-xl">🗄️</span> Supabase 数据库配置
      </h3>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-dark-300 mb-1"
            >Project URL</label
          >
          <input
            v-model="supabaseUrl"
            type="text"
            placeholder="https://your-project.supabase.co"
            class="input w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-dark-300 mb-1"
            >Anon Public Key</label
          >
          <div class="relative">
            <textarea
              v-if="showSupabaseKey"
              v-model="supabaseKey"
              placeholder="eyJh..."
              rows="4"
              class="input w-full pr-10 font-mono text-xs leading-relaxed py-2"
              style="resize: none"
            ></textarea>

            <input
              v-else
              v-model="supabaseKey"
              type="password"
              placeholder="eyJh..."
              class="input w-full pr-10 font-mono text-xs py-2"
            />

            <button
              @click="showSupabaseKey = !showSupabaseKey"
              class="absolute right-3 top-3 text-dark-400 hover:text-white transition-colors z-10"
              type="button"
            >
              <Eye v-if="showSupabaseKey" class="w-4 h-4" />
              <EyeOff v-else class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div class="mt-4 text-sm text-dark-400">
        * 如果不配置，系统将尝试读取 .env 环境变量。配置后优先使用本地设置。
      </div>
    </div>

    <!-- AI Configuration -->
    <div class="card">
      <h3 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <span class="text-xl">🤖</span> AI 模型配置 (DeepSeek / OpenAI)
      </h3>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-dark-300 mb-1"
            >API Key</label
          >
          <div class="relative">
            <input
              v-model="llmApiKey"
              :type="showLlmApiKey ? 'text' : 'password'"
              placeholder="sk-..."
              class="input w-full pr-10"
            />
            <button
              @click="showLlmApiKey = !showLlmApiKey"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
              type="button"
            >
              <Eye v-if="showLlmApiKey" class="w-4 h-4" />
              <EyeOff v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-dark-300 mb-1"
            >Base URL</label
          >
          <input
            v-model="llmBaseUrl"
            type="text"
            placeholder="https://api.deepseek.com"
            class="input w-full"
          />
        </div>
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end">
      <button
        @click="saveSettings"
        class="btn btn-primary px-8 py-3 flex items-center gap-2"
      >
        <span>保存并重载</span>
        <span
          v-if="showToast"
          class="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-white opacity-75"
        ></span>
      </button>
    </div>

    <!-- Toast Notification -->
    <div
      v-if="showToast"
      class="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce"
    >
      ✅ 设置已保存，正在重载系统...
    </div>

    <!-- Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showConfirmModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]"
      >
        <div
          class="bg-dark-800 rounded-2xl border border-dark-700 shadow-2xl w-full max-w-md mx-4 p-6"
        >
          <div class="text-center mb-6">
            <div class="text-4xl mb-4">🔄</div>
            <h3 class="text-xl font-bold text-white mb-2">
              检测到学习周期变更
            </h3>
            <p class="text-dark-300 text-sm">
              您将学习周期修改为
              <span class="text-primary-400 font-bold">{{ planWeeks }} 周</span
              >。 是否需要让 AI 重新规划任务以填满新的时间表？
            </p>
            <p class="text-red-400 text-xs mt-3 bg-red-500/10 p-2 rounded">
              ⚠️ 注意：重新规划将覆盖当前所有未完成的任务安排。
            </p>
          </div>

          <div class="flex gap-3">
            <button
              class="flex-1 px-4 py-3 rounded-xl bg-dark-700 hover:bg-dark-600 text-white transition-colors"
              @click="handleCancel"
            >
              仅保存设置
            </button>
            <button
              class="flex-1 px-4 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors"
              @click="handleConfirm"
            >
              重新规划任务
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
