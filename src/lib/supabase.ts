import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// 优先从 localStorage 读取配置（用户自定义设置）
const localUrl = localStorage.getItem('supabase_url')
const localKey = localStorage.getItem('supabase_key')

// 降级使用环境变量
const envUrl = import.meta.env.VITE_SUPABASE_URL
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseUrl = localUrl || envUrl
const supabaseKey = localKey || envKey

// 如果没有配置，使用占位符防止应用崩溃，但在使用时会报错
// UI 层应该检查配置状态并引导用户去设置页
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co'
const finalKey = supabaseKey || 'placeholder'

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. Please configure them in Settings.')
}

export const supabase = createClient<Database>(finalUrl, finalKey)
