import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

export interface AppNotification {
  id:      string
  type:    'leave' | 'mission' | 'expense' | 'system'
  title:   string
  message: string
  href?:   string
  read:    boolean
  date:    string
  forRoles: string[]
}

export const useNotificationStore = defineStore('notifications', () => {
  const auth = useAuthStore()

  const all = ref<AppNotification[]>([
    { id: 'n1', type: 'leave',   title: 'Nouvelle demande',      message: 'Priya Ramlugun a soumis un congé annuel',       href: '/hr/absences',        read: false, date: '2026-06-06', forRoles: ['hr_admin', 'hr_director', 'validator'] },
    { id: 'n2', type: 'leave',   title: 'Nouvelle demande',      message: 'Jean-Claude Rakotomalala a soumis un télétravail', href: '/hr/absences',     read: false, date: '2026-06-05', forRoles: ['hr_admin', 'hr_director', 'validator'] },
    { id: 'n3', type: 'mission', title: 'Ordre de mission',       message: 'Thierry Randriamanga — OM-2026-004 soumis',    href: '/hr/missions',        read: false, date: '2026-06-04', forRoles: ['hr_admin', 'hr_director'] },
    { id: 'n4', type: 'system',  title: 'Rappel',                 message: '3 demandes en attente depuis plus de 48h',                                  read: true,  date: '2026-06-03', forRoles: ['hr_admin', 'hr_director'] },
    { id: 'n5', type: 'leave',   title: 'Demande approuvée',      message: 'Votre congé du 10 juillet a été approuvé',                                  read: false, date: '2026-06-06', forRoles: ['employee', 'validator'] },
    { id: 'n6', type: 'mission', title: 'OM validé',              message: 'Votre ordre de mission OM-2026-001 est approuvé',                           read: true,  date: '2026-06-04', forRoles: ['employee', 'validator'] },
    { id: 'n7', type: 'expense', title: 'Note de frais',          message: 'Votre note de frais NF-2026-001 est en cours de traitement',                read: false, date: '2026-06-03', forRoles: ['employee', 'validator'] },
  ])

  const notifications = computed(() => {
    const role = auth.user?.role ?? ''
    return all.value.filter(n => n.forRoles.includes(role))
  })

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  function markAsRead(id: string) {
    const n = all.value.find(n => n.id === id)
    if (n) n.read = true
  }

  function markAllAsRead() {
    const role = auth.user?.role ?? ''
    all.value.filter(n => n.forRoles.includes(role)).forEach(n => { n.read = true })
  }

  return { notifications, unreadCount, markAsRead, markAllAsRead }
})
