import axios from 'axios'

export const TOKEN_STORAGE_KEY = 'p247-token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredToken()
      // Full reload rather than router.push: guarantees every in-memory
      // store (auth, and anything holding stale data from the expired
      // session) resets cleanly instead of leaking state across sessions.
      if (window.location.pathname !== '/') {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  },
)

// Extrait le message d'erreur renvoyé par le backend (ValidationPipe de
// Nest répond {message: string[] | string}) au lieu du message générique
// codé en dur côté front — sans ça l'utilisateur ne voit jamais la vraie
// cause (ex: "ManagerId must be a UUID").
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined
    const message = data?.message
    if (Array.isArray(message) && message.length > 0) return message.join(' ')
    if (typeof message === 'string' && message.trim()) return message
  }
  return fallback
}
