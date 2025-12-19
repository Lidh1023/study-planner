<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useSettingsStore } from "@/stores/settingsStore";
import { useUserStore } from "@/stores/userStore";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { supabase } from "@/lib/supabase";
import { useRoute } from "vue-router";

const route = useRoute();
const settingsStore = useSettingsStore();
const userStore = useUserStore();

// Form State
const role = ref(userStore.role);
const experience = ref(userStore.experience);
const jd = ref(userStore.jd);
const duration = ref(settingsStore.planDurationWeeks); // Default to global setting
const shouldClearOldData = ref(true); // Default to clearing old data

// UI State
const loading = ref(false);
const generating = ref(false);
const progress = ref("");
const error = ref("");
const planResult = ref<any>(null);
const successMessage = ref("");

// Sync with store and query params on mount
onMounted(() => {
  duration.value = settingsStore.planDurationWeeks;

  // Handle Auto-Generation
  if (route.query.auto === "true") {
    if (role.value && jd.value && settingsStore.llmApiKey) {
      progress.value = "检测到学习周期变更，正在为您重新规划...";
      generatePlan();
    } else {
      error.value =
        "无法自动重新规划：缺少用户信息或 API Key。请手动补充信息。";
    }
  }
});

const showStreamDialog = ref(false);
const streamContent = ref("");

// Generate Plan
const generatePlan = async () => {
  if (!settingsStore.llmApiKey) {
    error.value = "请先在设置中配置 AI API Key";
    return;
  }

  // Save profile for next time
  userStore.saveProfile(role.value, experience.value, jd.value);

  generating.value = true;
  error.value = "";
  progress.value = "正在连接 AI 模型...";
  planResult.value = null;
  streamContent.value = "";
  showStreamDialog.value = true;

  try {
    const chatModel = new ChatOpenAI({
      apiKey: settingsStore.llmApiKey,
      configuration: {
        baseURL: settingsStore.llmBaseUrl || "https://api.deepseek.com",
      },
      temperature: 0.7,
      modelName: "deepseek-chat",
      streaming: true,
      maxTokens: 8192, // Increase output limit to prevent truncation
    });

    const systemPrompt = `Role: 你是一位专业的学习路径规划师。
Task: 根据用户的个人情况和目标，制定一份详细的学习计划。
Output Requirement:
请输出一个标准的 JSON 对象，包含两个数组：\`milestones\` (里程碑) 和 \`tasks\` (每日任务)。
请严格遵守以下 Schema 定义，不要包含 JSON 以外的任何解释性文字。

Schema Definitions:
1. milestones:
{ "week": number, "title": string, "description": string, "target_date": string (YYYY-MM-DD), "completed": false }

2. tasks:
{ 
  "date": string (YYYY-MM-DD), 
  "week": number, 
  "day": number, 
  "type": "study"|"algorithm"|"project"|"other", 
  "title": string, 
  "description": string, 
  "difficulty": "easy"|"medium"|"hard"|null, 
  "completed": false,
  "resources": [
    { "title": string, "url": string, "type": "article"|"video"|"doc"|"other" }
  ]
}

Constraints:
1. 规划必须覆盖完整的 ${duration.value} 周。
2. date 和 target_date 请根据当前日期 (${
      new Date().toISOString().split("T")[0]
    }) 推算。
3. 为每个任务推荐 1-2 个高质量的学习资源（resources），如果没有特定 URL，URL 字段可留空或填搜索关键词链接。
`;

    const userPrompt = `
User Profile:
- 身份: ${role.value}
- 工作年限: ${experience.value}
- 心动岗位JD: ${jd.value}
- 学习周期: ${duration.value} 周
`;

    progress.value = "AI 正在思考并生成规划...";

    const response = await (chatModel as any).stream([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    for await (const chunk of response) {
      if (chunk.content) {
        streamContent.value += chunk.content;
        // Auto-scroll logic could go here
      }
    }

    const content = streamContent.value;

    // Robust JSON extraction
    // 1. Try to find the outermost JSON object
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");

    let jsonStr = "";
    if (start !== -1 && end !== -1 && end > start) {
      jsonStr = content.substring(start, end + 1);
    } else {
      // Fallback: use the original replace method if structure is weird
      jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
    }

    try {
      planResult.value = JSON.parse(jsonStr);
      progress.value = "规划生成成功！请预览并确认。";
      showStreamDialog.value = false; // Close dialog on success
    } catch (e) {
      console.error("JSON Parse Error:", e);
      error.value = "AI 返回的数据格式有误，请重试。";
      // Don't close dialog on error so user can see raw output
    }
  } catch (e: any) {
    console.error("Generation Error:", e);
    error.value = `生成失败: ${e.message || "未知错误"}`;
  } finally {
    generating.value = false;
  }
};

// Save to Database
const saveToDatabase = async () => {
  if (!planResult.value) return;

  loading.value = true;
  progress.value = "正在写入数据库...";

  try {
    // 0. Update global duration setting if different
    if (duration.value !== settingsStore.planDurationWeeks) {
      settingsStore.saveSettings(
        settingsStore.supabaseUrl,
        settingsStore.supabaseKey,
        settingsStore.llmApiKey,
        settingsStore.llmBaseUrl,
        duration.value
      );
    }

    // 1. Clear existing data if requested
    if (shouldClearOldData.value) {
      const { error: d1 } = await supabase
        .from("tasks")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all
      const { error: d2 } = await supabase
        .from("milestones")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (d1 || d2) console.warn("Error clearing old data:", d1, d2);
    }

    // 2. Prepare Data
    const { milestones, tasks } = planResult.value;
    const tasksToInsert: any[] = [];
    const resourcesToInsert: any[] = [];

    if (tasks && tasks.length) {
      tasks.forEach((t: any) => {
        // Generate UUID for task
        const taskId = crypto.randomUUID();
        const { resources, ...taskData } = t;

        tasksToInsert.push({
          ...taskData,
          id: taskId,
        });

        if (resources && Array.isArray(resources)) {
          resources.forEach((r: any) => {
            resourcesToInsert.push({
              task_id: taskId,
              title: r.title,
              url: r.url || null,
              type: r.type || "other",
            });
          });
        }
      });
    }

    // 3. Insert Data
    if (milestones && milestones.length) {
      const { error: mError } = await supabase
        .from("milestones")
        .insert(milestones);
      if (mError) throw mError;
    }

    if (tasksToInsert.length) {
      // Batch insert tasks in chunks
      const chunkSize = 50;
      for (let i = 0; i < tasksToInsert.length; i += chunkSize) {
        const chunk = tasksToInsert.slice(i, i + chunkSize);
        const { error: tError } = await supabase.from("tasks").insert(chunk);
        if (tError) throw tError;
      }
    }

    if (resourcesToInsert.length) {
      // Batch insert resources in chunks
      const chunkSize = 50;
      for (let i = 0; i < resourcesToInsert.length; i += chunkSize) {
        const chunk = resourcesToInsert.slice(i, i + chunkSize);
        const { error: rError } = await supabase
          .from("task_resources")
          .insert(chunk);
        if (rError) throw rError;
      }
    }

    successMessage.value = "🎉 学习规划已成功导入数据库！";
    setTimeout(() => {
      // Force reload to refresh stores
      window.location.href = "/";
    }, 2000);
  } catch (e: any) {
    console.error("Database Error:", e);
    error.value = `写入数据库失败: ${e.message}`;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="space-y-8 animate-fade-in max-w-4xl mx-auto">
    <!-- Header -->
    <div
      class="card bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-emerald-500/30"
    >
      <h2 class="text-2xl font-bold text-white mb-2">🤖 AI 智能规划</h2>
      <p class="text-dark-300">
        输入您的基本情况，让 AI 为您量身定制 {{ duration }} 周的学习路线。
      </p>
    </div>

    <!-- Input Form -->
    <div class="card" v-if="!planResult">
      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-dark-300 mb-1"
              >当前身份</label
            >
            <input
              v-model="role"
              type="text"
              placeholder="例如：大三学生、后端转全栈..."
              class="input w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-dark-300 mb-1"
              >工作/相关经验</label
            >
            <input
              v-model="experience"
              type="text"
              placeholder="例如：0年、1年React经验..."
              class="input w-full"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-dark-300 mb-1"
            >心动岗位 JD (职位描述/学习目标)</label
          >
          <textarea
            v-model="jd"
            rows="5"
            placeholder="请直接粘贴招聘要求..."
            class="input w-full resize-none"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-dark-300 mb-1"
            >学习周期 (周)</label
          >
          <input
            v-model="duration"
            type="number"
            min="1"
            max="52"
            class="input w-full"
          />
          <p class="text-xs text-dark-500 mt-1">* 将覆盖系统设置中的默认周期</p>
        </div>

        <div class="pt-4 flex justify-end">
          <button
            @click="generatePlan"
            :disabled="generating || !role || !jd"
            class="btn btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span
              v-if="generating"
              class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"
            ></span>
            <span>{{ generating ? "正在生成..." : "开始生成规划" }}</span>
          </button>
        </div>

        <div v-if="error" class="text-red-400 text-sm text-center">
          {{ error }}
        </div>
        <div
          v-if="generating"
          class="text-emerald-400 text-sm text-center animate-pulse"
        >
          {{ progress }}
        </div>
      </div>
    </div>

    <!-- Preview & Confirm -->
    <div v-else class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-xl font-bold text-white">📋 规划预览</h3>
        <button @click="planResult = null" class="btn btn-ghost text-sm">
          重新生成
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="p-4 rounded-lg bg-dark-800/50 text-center">
          <div class="text-2xl font-bold text-white">
            {{ planResult.milestones?.length || 0 }}
          </div>
          <div class="text-sm text-dark-400">里程碑</div>
        </div>
        <div class="p-4 rounded-lg bg-dark-800/50 text-center">
          <div class="text-2xl font-bold text-white">
            {{ planResult.tasks?.length || 0 }}
          </div>
          <div class="text-sm text-dark-400">总任务数</div>
        </div>
        <div class="p-4 rounded-lg bg-dark-800/50 text-center">
          <div class="text-2xl font-bold text-white">{{ duration }}</div>
          <div class="text-sm text-dark-400">周数</div>
        </div>
      </div>

      <!-- Milestone List Preview -->
      <div class="card max-h-[400px] overflow-y-auto custom-scrollbar">
        <div class="space-y-4">
          <div
            v-for="m in planResult.milestones"
            :key="m.week"
            class="p-3 rounded bg-dark-900/50 border border-dark-700"
          >
            <div class="flex justify-between items-start">
              <div>
                <span class="text-emerald-400 text-sm font-bold"
                  >Week {{ m.week }}</span
                >
                <h4 class="text-white font-medium">{{ m.title }}</h4>
                <p class="text-dark-400 text-sm mt-1">{{ m.description }}</p>
              </div>
              <span class="text-xs text-dark-500">{{ m.target_date }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col items-center gap-4 pt-4">
        <!-- Clear Data Option -->
        <div class="flex items-center gap-2 text-dark-300">
          <input
            type="checkbox"
            v-model="shouldClearOldData"
            id="clearData"
            class="checkbox"
          />
          <label for="clearData" class="cursor-pointer select-none">
            保存前清空现有数据库中的旧计划（推荐）
          </label>
        </div>

        <div v-if="error" class="text-red-400 text-sm">{{ error }}</div>
        <div
          v-if="successMessage"
          class="text-green-400 font-bold text-lg animate-bounce"
        >
          {{ successMessage }}
        </div>

        <button
          v-if="!successMessage"
          @click="saveToDatabase"
          :disabled="loading"
          class="btn btn-primary w-full max-w-md py-4 text-lg shadow-lg shadow-emerald-500/20 flex justify-center items-center gap-2"
        >
          <span
            v-if="loading"
            class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"
          ></span>
          <span>{{
            loading ? "正在写入数据库..." : "确认并初始化数据库"
          }}</span>
        </button>
      </div>
    </div>
    <!-- Streaming Dialog -->
    <Teleport to="body">
      <div
        v-if="showStreamDialog"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]"
      >
        <div
          class="bg-dark-800 rounded-2xl border border-dark-700 shadow-2xl w-full max-w-4xl mx-4 p-6 flex flex-col h-[80vh]"
        >
          <div
            class="flex items-center justify-between mb-4 border-b border-dark-700 pb-4"
          >
            <h3 class="text-xl font-bold text-white flex items-center gap-2">
              <span class="animate-spin">🤖</span> 正在生成规划...
            </h3>
            <button
              @click="showStreamDialog = false"
              class="text-dark-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div
            class="flex-1 overflow-y-auto custom-scrollbar bg-dark-900/50 p-4 rounded-xl font-mono text-sm text-emerald-400 leading-relaxed whitespace-pre-wrap"
          >
            {{ streamContent || "正在等待 AI 响应..." }}
            <span class="animate-pulse">_</span>
          </div>

          <div class="mt-4 text-center text-dark-400 text-sm">
            AI 输出完成后，弹窗将自动关闭并显示预览。
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
