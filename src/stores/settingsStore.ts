import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const supabaseUrl = ref(localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL || '')
  const supabaseKey = ref(localStorage.getItem('supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '')
  const llmApiKey = ref(localStorage.getItem('llm_api_key') || import.meta.env.VITE_LLM_API_KEY || '')
  const llmBaseUrl = ref(localStorage.getItem('llm_base_url') || import.meta.env.VITE_LLM_BASE_URL || 'https://api.deepseek.com')
  
  // Learning Plan Config
  const planDurationWeeks = ref(parseInt(localStorage.getItem('plan_duration_weeks') || '12'))

  // Actions
  function saveSettings(url: string, key: string, apiKey: string, baseUrl: string, weeks: number = 12) {
    supabaseUrl.value = url
    supabaseKey.value = key
    llmApiKey.value = apiKey
    llmBaseUrl.value = baseUrl
    planDurationWeeks.value = weeks

    localStorage.setItem('supabase_url', url)
    localStorage.setItem('supabase_key', key)
    localStorage.setItem('llm_api_key', apiKey)
    localStorage.setItem('llm_base_url', baseUrl)
    localStorage.setItem('plan_duration_weeks', weeks.toString())
  }

  // Watchers to ensure persistence if changed directly
  watch(supabaseUrl, (val) => localStorage.setItem('supabase_url', val))
  watch(supabaseKey, (val) => localStorage.setItem('supabase_key', val))
  watch(llmApiKey, (val) => localStorage.setItem('llm_api_key', val))
  watch(llmBaseUrl, (val) => localStorage.setItem('llm_base_url', val))
  watch(planDurationWeeks, (val) => localStorage.setItem('plan_duration_weeks', val.toString()))

  return {
    supabaseUrl,
    supabaseKey,
    llmApiKey,
    llmBaseUrl,
    planDurationWeeks,
    saveSettings
  }
})
