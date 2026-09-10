import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { financialService } from '@/services/financialService'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('flux_auth_token'))
  const activeWorkspaceId = ref<string | null>(localStorage.getItem('flux_active_workspace_id'))
  const user = ref<{ id: number; name: string; email: string } | null>(null)
  const workspaces = ref<any[]>([])
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  const setAuth = (authToken: string, userData: any, workspaceList: any[] = []) => {
    token.value = authToken
    user.value = userData
    workspaces.value = workspaceList

    localStorage.setItem('flux_auth_token', authToken)

    if (workspaceList.length > 0 && !activeWorkspaceId.value) {
      activeWorkspaceId.value = String(workspaceList[0].id)
      localStorage.setItem('flux_active_workspace_id', String(workspaceList[0].id))
    }
  }

  const clearAuth = () => {
    token.value = null
    user.value = null
    workspaces.value = []
    activeWorkspaceId.value = null
    localStorage.removeItem('flux_auth_token')
    localStorage.removeItem('flux_active_workspace_id')
    localStorage.removeItem('flux_dashboard_state_v1')
    localStorage.removeItem('flux_dashboard_state_v2')
  }

  const login = async (email: string, password: string) => {
    isLoading.value = true
    try {
      const response = await financialService.login({ email, password })
      setAuth(response.token, response.user, response.workspaces)
      return response
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      if (token.value) {
        await financialService.logout()
      }
    } catch (e) {
      console.warn('Erro no logout da API', e)
    } finally {
      clearAuth()
    }
  }

  const ensureAuthenticated = async (): Promise<boolean> => {
    if (!token.value) {
      return false
    }

    try {
      const response = await financialService.getMe()
      user.value = response.user
      workspaces.value = response.workspaces
      if (!activeWorkspaceId.value && response.workspaces?.length > 0) {
        activeWorkspaceId.value = String(response.workspaces[0].id)
        localStorage.setItem('flux_active_workspace_id', activeWorkspaceId.value)
      }
      return true
    } catch (err: any) {
      // Token might be expired or invalid
      if (err.status === 401) {
        clearAuth()
      }
      return false
    }
  }

  const changePassword = async (payload: {
    current_password: string
    password: string
    password_confirmation: string
  }) => {
    return financialService.changePassword(payload)
  }

  return {
    token,
    user,
    workspaces,
    activeWorkspaceId,
    isLoading,
    isAuthenticated,
    login,
    logout,
    changePassword,
    ensureAuthenticated,
    setAuth,
    clearAuth,
  }
})
