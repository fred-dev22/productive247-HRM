<script setup lang="ts">
/**
 * Assistant d'import CSV generique en 3 etapes (recommandations + fichier ->
 * apercu editable -> import + recapitulatif), utilise par les 7 domaines du
 * Lot D (voir configs/*.ts). Le wizard ne connait aucune logique metier —
 * tout est pilote par la config passee en prop.
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Papa from 'papaparse'
import {
  X, Upload, Download, FileWarning, CheckCircle2, AlertTriangle, Loader2, ArrowLeft, ArrowRight,
} from 'lucide-vue-next'
import { api, getApiErrorMessage } from '../../../lib/api'
import * as cls from '../../../lib/formClasses'
import type { ImportConfig, ImportColumn, ParsedRow, ImportRowResult } from './importTypes'

const props = defineProps<{ open: boolean; config: ImportConfig }>()
const emit = defineEmits<{ close: []; imported: [] }>()

const router = useRouter()

const step = ref<1 | 2 | 3>(1)
const fileError = ref('')
const fileName = ref('')
const dragOver = ref(false)
const rows = ref<ParsedRow[]>([])

const blockingDependency = computed(() => props.config.dependencies.find(d => d.required && !d.ok()))

/* ── Étape 1 : recommandations + fichier ─────────────────────── */
function downloadSample() {
  const headers = props.config.columns.map(c => c.csvHeader)
  const csv = Papa.unparse({ fields: headers, data: props.config.sampleRows.map(r => headers.map(h => r[h] ?? '')) })
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `exemple-${props.config.title.toLowerCase().replace(/\s+/g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function resolveSelect(col: ImportColumn, rawValue: string): string {
  if (!col.options) return rawValue
  const norm = rawValue.trim().toLowerCase()
  if (!norm) return ''
  const match = col.options().find(o => (o.code && o.code.toLowerCase() === norm) || o.label.toLowerCase() === norm)
  return match ? match.value : ''
}

function isTruthy(v: string): boolean {
  return ['1', 'true', 'oui', 'yes', 'x'].includes(v.trim().toLowerCase())
}

function buildRows(parsed: Record<string, string>[]) {
  rows.value = parsed.map((raw) => {
    const values: Record<string, string> = {}
    const rawValues: Record<string, string> = {}
    for (const col of props.config.columns) {
      const cell = (raw[col.csvHeader] ?? '').trim()
      rawValues[col.key] = cell
      values[col.key] = col.type === 'select' ? resolveSelect(col, cell) : cell
    }
    const extra: Record<string, unknown> = {}
    for (const col of props.config.extraColumns ?? []) {
      const cell = (raw[col.csvHeader] ?? '').trim()
      extra[col.key] = col.type === 'boolean' ? isTruthy(cell) : cell
    }
    return { values, raw: rawValues, extra }
  })
}

function handleFile(file: File | undefined) {
  fileError.value = ''
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.csv')) {
    fileError.value = 'Le fichier doit être au format CSV (.csv).'
    return
  }
  fileName.value = file.name
  Papa.parse<Record<string, string>>(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      if (results.data.length === 0) {
        fileError.value = 'Le fichier est vide ou illisible.'
        return
      }
      const headers = results.meta.fields ?? []
      const missing = props.config.columns.filter(c => c.required && !headers.includes(c.csvHeader))
      if (missing.length > 0) {
        fileError.value = `Colonne(s) manquante(s) dans le fichier : ${missing.map(c => c.csvHeader).join(', ')}`
        return
      }
      buildRows(results.data)
      step.value = 2
    },
    error: (err) => { fileError.value = err.message },
  })
}

function onFileInput(e: Event) {
  handleFile((e.target as HTMLInputElement).files?.[0])
}
function onDrop(e: DragEvent) {
  dragOver.value = false
  handleFile(e.dataTransfer?.files?.[0])
}

/* ── Étape 2 : aperçu éditable ────────────────────────────────── */
function rowHasIssue(row: ParsedRow): boolean {
  return props.config.columns.some(c => c.required && !row.values[c.key])
}
const issueCount = computed(() => rows.value.filter(rowHasIssue).length)

function removeRow(index: number) {
  rows.value.splice(index, 1)
}

/* ── Étape 3 : import + récapitulatif ────────────────────────── */
const importing = ref(false)
const progress = ref({ current: 0, total: 0 })
const results = ref<ImportRowResult[]>([])
const done = ref(false)

function buildPayload(row: ParsedRow): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  for (const col of props.config.columns) {
    const v = row.values[col.key]
    if (!v) continue
    if (col.type === 'boolean') body[col.key] = isTruthy(v)
    else if (col.type === 'number') body[col.key] = Number(v)
    else body[col.key] = v
  }
  return body
}

async function startImport() {
  step.value = 3
  importing.value = true
  done.value = false
  results.value = []
  progress.value = { current: 0, total: rows.value.length }

  for (let i = 0; i < rows.value.length; i++) {
    const row = rows.value[i]!
    try {
      const { data } = await api.post(props.config.createEndpoint, buildPayload(row))
      if (props.config.onRowCreated) {
        await props.config.onRowCreated(data, row.extra).catch(() => {
          // Effet de bord (ex: creation de compte) — ne fait pas echouer la
          // ligne elle-meme, l'entite principale a bien ete creee.
        })
      }
      results.value.push({ index: i, success: true })
    } catch (err) {
      results.value.push({ index: i, success: false, error: getApiErrorMessage(err, 'Échec de la création') })
    }
    progress.value.current = i + 1
  }

  importing.value = false
  done.value = true
  emit('imported')
}

const succeededCount = computed(() => results.value.filter(r => r.success).length)
const failedResults = computed(() => results.value.filter(r => !r.success))

/* ── Navigation générale ──────────────────────────────────────── */
function goToDependency(dep: { routeTo: import('vue-router').RouteLocationRaw }) {
  emit('close')
  router.push(dep.routeTo)
}
function reset() {
  step.value = 1
  fileError.value = ''
  fileName.value = ''
  rows.value = []
  results.value = []
  progress.value = { current: 0, total: 0 }
  done.value = false
}
function handleClose() {
  reset()
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[1000] p-4">
      <div class="relative bg-card text-card-foreground rounded-xl w-full max-w-[1000px] max-h-[92vh] shadow-[0_8px_32px_rgba(0,0,0,0.16)] flex flex-col overflow-hidden">

        <!-- En-tête -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <div class="text-[15px] font-semibold text-foreground">Importer — {{ config.title }}</div>
            <div class="text-[11px] text-muted-foreground mt-0.5">
              Étape {{ step }}/3 · {{ step === 1 ? 'Fichier' : step === 2 ? 'Aperçu' : 'Import' }}
            </div>
          </div>
          <button
            class="w-7 h-7 bg-background rounded-md cursor-pointer flex items-center justify-center text-muted-foreground shrink-0 transition-colors hover:bg-border hover:text-foreground"
            :disabled="importing"
            @click="handleClose"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="overflow-y-auto flex-1 px-6 py-5">

          <!-- ═══ ÉTAPE 1 ═══ -->
          <template v-if="step === 1">
            <p class="text-[13px] text-muted-foreground mb-4">{{ config.intro }}</p>

            <div v-if="config.dependencies.length" class="mb-5 flex flex-col gap-2">
              <div
                v-for="(dep, i) in config.dependencies" :key="i"
                class="flex items-center justify-between gap-3 rounded-md px-3 py-2.5 text-[12px]"
                :class="dep.ok() ? 'bg-success-bg text-success' : dep.required ? 'bg-danger-bg text-danger' : 'bg-warning-bg text-warning'"
              >
                <div class="flex items-center gap-2">
                  <CheckCircle2 v-if="dep.ok()" class="w-4 h-4 shrink-0" />
                  <AlertTriangle v-else class="w-4 h-4 shrink-0" />
                  <span>{{ dep.label }}</span>
                </div>
                <button v-if="!dep.ok()" type="button" class="underline font-medium shrink-0 cursor-pointer" @click="goToDependency(dep)">
                  Aller créer
                </button>
              </div>
              <p v-if="blockingDependency" class="text-[11px] text-danger">
                Assurez-vous d'avoir déjà importé ou créé ces éléments avant de continuer.
              </p>
            </div>

            <template v-if="!blockingDependency">
              <button type="button" :class="[cls.btnOutline, 'mb-4']" @click="downloadSample">
                <Download class="w-3.5 h-3.5" /> Télécharger un exemple CSV
              </button>

              <label
                class="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-10 px-4 text-center cursor-pointer transition-colors"
                :class="dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'"
                @dragover.prevent="dragOver = true"
                @dragleave.prevent="dragOver = false"
                @drop.prevent="onDrop"
              >
                <Upload class="w-6 h-6 text-muted-foreground" />
                <span class="text-[13px] text-foreground font-medium">Glissez un fichier CSV ici, ou cliquez pour parcourir</span>
                <span v-if="fileName" class="text-[11px] text-primary">{{ fileName }}</span>
                <input type="file" accept=".csv" class="hidden" @change="onFileInput" />
              </label>

              <p v-if="fileError" :class="[cls.fieldErrorBlock, 'mt-3']">
                <FileWarning class="w-3.5 h-3.5 shrink-0" /> {{ fileError }}
              </p>
            </template>
          </template>

          <!-- ═══ ÉTAPE 2 ═══ -->
          <template v-else-if="step === 2">
            <div class="flex items-center justify-between mb-3">
              <span class="text-[13px] text-foreground">{{ rows.length }} ligne(s) détectée(s)</span>
              <span v-if="issueCount > 0" class="text-[12px] text-warning flex items-center gap-1">
                <AlertTriangle class="w-3.5 h-3.5" /> {{ issueCount }} ligne(s) à corriger
              </span>
            </div>

            <div class="overflow-x-auto border border-border rounded-lg">
              <table class="w-full text-[12px] border-collapse">
                <thead>
                  <tr class="bg-background">
                    <th class="px-2 py-2 text-left font-semibold text-muted-foreground w-8"></th>
                    <th v-for="col in config.columns" :key="col.key" class="px-2 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">
                      {{ col.label }}<span v-if="col.required" class="text-danger">*</span>
                    </th>
                    <th v-for="col in config.extraColumns ?? []" :key="col.key" class="px-2 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">
                      {{ col.label }}
                    </th>
                    <th class="px-2 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in rows" :key="i" class="border-t border-border" :class="rowHasIssue(row) ? 'bg-danger-bg/30' : ''">
                    <td class="px-2 py-1.5 text-center">
                      <AlertTriangle v-if="rowHasIssue(row)" class="w-3.5 h-3.5 text-danger inline" />
                      <CheckCircle2 v-else class="w-3.5 h-3.5 text-success inline" />
                    </td>
                    <td v-for="col in config.columns" :key="col.key" class="px-2 py-1.5">
                      <select
                        v-if="col.type === 'select'"
                        v-model="row.values[col.key]"
                        class="h-7 px-1.5 border border-border rounded text-[12px] bg-background outline-none w-full min-w-[130px]"
                        :class="{ '!border-danger': col.required && !row.values[col.key] }"
                      >
                        <option value="">{{ row.raw[col.key] ? `« ${row.raw[col.key]} » introuvable` : '—' }}</option>
                        <option v-for="opt in col.options!()" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                      </select>
                      <input
                        v-else-if="col.type === 'boolean'"
                        type="checkbox"
                        class="accent-primary"
                        :checked="isTruthy(row.values[col.key])"
                        @change="row.values[col.key] = ($event.target as HTMLInputElement).checked ? 'true' : 'false'"
                      />
                      <input
                        v-else
                        :type="col.type === 'date' ? 'date' : col.type === 'number' ? 'number' : 'text'"
                        v-model="row.values[col.key]"
                        class="h-7 px-1.5 border border-border rounded text-[12px] bg-background outline-none w-full min-w-[100px]"
                        :class="{ '!border-danger': col.required && !row.values[col.key] }"
                      />
                    </td>
                    <td v-for="col in config.extraColumns ?? []" :key="col.key" class="px-2 py-1.5">
                      <input
                        v-if="col.type === 'boolean'"
                        type="checkbox"
                        class="accent-primary"
                        :checked="!!row.extra[col.key]"
                        @change="row.extra[col.key] = ($event.target as HTMLInputElement).checked"
                      />
                    </td>
                    <td class="px-2 py-1.5 text-center">
                      <button type="button" class="text-muted-foreground hover:text-danger cursor-pointer" title="Retirer cette ligne" @click="removeRow(i)">
                        <X class="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <!-- ═══ ÉTAPE 3 ═══ -->
          <template v-else>
            <div v-if="!done" class="flex flex-col items-center justify-center gap-4 py-10">
              <Loader2 class="w-8 h-8 text-primary animate-spin" />
              <div class="text-[13px] text-foreground">
                Import en cours — élément {{ progress.current }} sur {{ progress.total }}
              </div>
              <div class="w-full max-w-md h-2 bg-background rounded-full overflow-hidden border border-border">
                <div class="h-full bg-primary transition-all" :style="{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }"></div>
              </div>
            </div>

            <div v-else class="flex flex-col gap-4">
              <div class="flex items-center gap-4">
                <div class="flex-1 bg-success-bg rounded-lg px-4 py-3 text-center">
                  <div class="text-[22px] font-semibold text-success">{{ succeededCount }}</div>
                  <div class="text-[11px] text-success">Réussi(s)</div>
                </div>
                <div class="flex-1 bg-danger-bg rounded-lg px-4 py-3 text-center">
                  <div class="text-[22px] font-semibold text-danger">{{ failedResults.length }}</div>
                  <div class="text-[11px] text-danger">Échoué(s)</div>
                </div>
              </div>

              <div v-if="failedResults.length > 0" class="border border-border rounded-lg overflow-hidden">
                <div class="bg-background px-3 py-2 text-[11px] font-semibold text-muted-foreground">Détail des erreurs</div>
                <div class="max-h-56 overflow-y-auto">
                  <div v-for="r in failedResults" :key="r.index" class="px-3 py-2 text-[12px] border-t border-border flex items-start gap-2">
                    <span class="text-muted-foreground shrink-0">Ligne {{ r.index + 1 }}</span>
                    <span class="text-danger">{{ r.error }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

        </div>

        <!-- Pied -->
        <div class="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
          <button v-if="step === 2" type="button" :class="cls.btnOutline" @click="step = 1">
            <ArrowLeft class="w-3.5 h-3.5" /> Retour
          </button>
          <span v-else></span>

          <div class="flex gap-2">
            <button v-if="step < 3 || done" type="button" :class="cls.btnOutline" @click="handleClose">
              {{ done ? 'Fermer' : 'Annuler' }}
            </button>
            <button v-if="step === 2" type="button" :class="cls.btnPrimary" :disabled="rows.length === 0" @click="startImport">
              Importer {{ rows.length }} élément(s) <ArrowRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>
