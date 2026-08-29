/**
 * Generation de liens/fichier calendrier pour un entretien (Recrutement).
 * Aucun backend ni connexion OAuth necessaire : Google Calendar et Outlook
 * exposent tous les deux une URL publique "ajouter un evenement" prete a
 * l'emploi, et un fichier .ics genere cote client s'ouvre dans n'importe
 * quelle application de calendrier (Outlook de bureau, Apple Calendar…).
 * C'est fonctionnel des maintenant, sans attendre le backend du module.
 */

export interface CalendarEventInput {
  title: string
  description?: string
  location?: string
  /** Date/heure de debut, format local naif 'YYYY-MM-DDTHH:mm:ss' (comme Interview.scheduledAt) */
  startIso: string
}

// Duree non suivie sur Interview (pas de champ dedie) — 1h par defaut,
// coherent avec la duree usuelle d'un entretien de recrutement.
const DEFAULT_DURATION_MS = 60 * 60 * 1000

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function getRange(startIso: string): { start: Date; end: Date } {
  const start = new Date(startIso)
  const end = new Date(start.getTime() + DEFAULT_DURATION_MS)
  return { start, end }
}

// Format flottant AAAAMMJJTHHmmss (sans Z) : interprete comme heure locale
// par Google/Outlook/la plupart des lecteurs .ics, suffisant ici puisqu'on
// ne suit pas de fuseau horaire particulier sur Interview.
function toCompact(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

export function googleCalendarUrl(e: CalendarEventInput): string {
  const { start, end } = getRange(e.startIso)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${toCompact(start)}/${toCompact(end)}`,
    details: e.description ?? '',
    location: e.location ?? '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function outlookCalendarUrl(e: CalendarEventInput): string {
  const { start, end } = getRange(e.startIso)
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: e.title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: e.description ?? '',
    location: e.location ?? '',
  })
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function icsContent(e: CalendarEventInput): string {
  const { start, end } = getRange(e.startIso)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Productive247 HRM//Recrutement//FR',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@productive247hrm`,
    `DTSTAMP:${toCompact(new Date())}`,
    `DTSTART:${toCompact(start)}`,
    `DTEND:${toCompact(end)}`,
    `SUMMARY:${icsEscape(e.title)}`,
    e.description ? `DESCRIPTION:${icsEscape(e.description)}` : '',
    e.location ? `LOCATION:${icsEscape(e.location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)
  return lines.join('\r\n')
}

export function downloadIcs(e: CalendarEventInput, filename: string): void {
  const blob = new Blob([icsContent(e)], { type: 'text/calendar;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
