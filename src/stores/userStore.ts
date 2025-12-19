import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useUserStore = defineStore('user', () => {
  // State
  const role = ref(localStorage.getItem('user_role') || '')
  const experience = ref(localStorage.getItem('user_experience') || '')
  const jd = ref(localStorage.getItem('user_jd') || '')

  // Actions
  function saveProfile(newRole: string, newExperience: string, newJd: string) {
    role.value = newRole
    experience.value = newExperience
    jd.value = newJd

    localStorage.setItem('user_role', newRole)
    localStorage.setItem('user_experience', newExperience)
    localStorage.setItem('user_jd', newJd)
  }

  // Watchers
  watch(role, (val) => localStorage.setItem('user_role', val))
  watch(experience, (val) => localStorage.setItem('user_experience', val))
  watch(jd, (val) => localStorage.setItem('user_jd', val))

  return {
    role,
    experience,
    jd,
    saveProfile
  }
})
