<script setup lang="ts">
/**
 * Boutons d'action métier d'une demande d'absence (Approuver / Retourner /
 * Refuser / Soumettre / Marquer effectué / Régulariser), avec les modales de
 * commentaire nécessaires. Réutilisé dans la toolbar de la liste (actions
 * contextuelles) ET dans la barre d'actions de la fiche (AbsenceCard).
 */
import { reactive } from 'vue'
import { Undo2, Check, X, Send, CheckCheck, RotateCcw } from 'lucide-vue-next'
import ModalShell from '../ui/ModalShell.vue'
import * as cls from '../../lib/formClasses'
import { useAbsenceStore } from '../../stores/absences'
import type { LeaveRequest } from '../../types'

const props = defineProps<{ leave: LeaveRequest }>()
const absenceStore = useAbsenceStore()

const btn = 'px-2.5 py-[5px] rounded text-xs font-medium cursor-pointer whitespace-nowrap inline-flex items-center gap-1 transition-colors'
const approveCls = btn + ' bg-success-bg text-success hover:brightness-95'
const returnCls  = btn + ' bg-info-bg text-info hover:brightness-95'
const rejectCls  = btn + ' bg-danger-bg text-danger hover:brightness-95'

function approve() { absenceStore.approveLeave(props.leave.id) }
function submit()  { absenceStore.submitDraft(props.leave.id) }
function markDone() { absenceStore.markDone(props.leave.id) }
function regularize() { absenceStore.markRegularized(props.leave.id) }

/* ── Modale Retourner ───────────────────────────────────────── */
const returnModal = reactive({ open: false, comment: '', error: '' })
function openReturn() { Object.assign(returnModal, { open: true, comment: '', error: '' }) }
function confirmReturn() {
  if (returnModal.comment.trim().length < 10) { returnModal.error = 'Le commentaire doit comporter au moins 10 caractères'; return }
  absenceStore.returnLeave(props.leave.id, returnModal.comment.trim())
  returnModal.open = false
}

/* ── Modale Refuser ─────────────────────────────────────────── */
const rejectModal = reactive({ open: false, reason: '', error: '' })
function openReject() { Object.assign(rejectModal, { open: true, reason: '', error: '' }) }
function confirmReject() {
  if (rejectModal.reason.trim().length < 10) { rejectModal.error = 'Le motif doit comporter au moins 10 caractères'; return }
  absenceStore.rejectLeave(props.leave.id, rejectModal.reason.trim())
  rejectModal.open = false
}
</script>

<template>
  <div class="flex items-center gap-1.5">
    <template v-if="leave.status === 'pending'">
      <button :class="approveCls" @click="approve"><Check class="w-3.5 h-3.5" /> Approuver</button>
      <button :class="returnCls" @click="openReturn"><Undo2 class="w-3.5 h-3.5" /> Retourner</button>
      <button :class="rejectCls" @click="openReject"><X class="w-3.5 h-3.5" /> Refuser</button>
    </template>
    <template v-else-if="leave.status === 'draft' || leave.status === 'returned'">
      <button :class="approveCls" @click="submit"><Send class="w-3.5 h-3.5" /> Soumettre</button>
    </template>
    <template v-else-if="leave.status === 'registered'">
      <button :class="approveCls" @click="markDone"><CheckCheck class="w-3.5 h-3.5" /> Marquer effectué</button>
    </template>
    <template v-else-if="leave.status === 'done'">
      <button :class="approveCls" @click="regularize"><RotateCcw class="w-3.5 h-3.5" /> Régulariser</button>
    </template>
    <span v-else class="text-xs text-muted-foreground italic">Aucune action disponible</span>
  </div>

  <!-- Modale Retourner -->
  <ModalShell :open="returnModal.open" :title="`Retourner la demande de ${leave.employeeName}`" max-width="max-w-[420px]" @close="returnModal.open = false">
    <label :class="cls.fieldLabel">Commentaire *</label>
    <textarea v-model="returnModal.comment" :class="cls.fieldTextarea" placeholder="Expliquez ce qui doit être corrigé…" rows="4"></textarea>
    <div v-if="returnModal.error" :class="cls.fieldError">{{ returnModal.error }}</div>
    <template #footer>
      <button :class="cls.btnPrimary" @click="confirmReturn"><Undo2 class="w-4 h-4" /> Retourner</button>
      <button :class="cls.btnOutline" @click="returnModal.open = false">Annuler</button>
    </template>
  </ModalShell>

  <!-- Modale Refuser -->
  <ModalShell :open="rejectModal.open" :title="`Refuser la demande de ${leave.employeeName}`" max-width="max-w-[420px]" @close="rejectModal.open = false">
    <label :class="cls.fieldLabel">Motif du refus *</label>
    <textarea v-model="rejectModal.reason" :class="cls.fieldTextarea" placeholder="Indiquez le motif du refus…" rows="4"></textarea>
    <div v-if="rejectModal.error" :class="cls.fieldError">{{ rejectModal.error }}</div>
    <template #footer>
      <button :class="cls.btnPrimary" @click="confirmReject">Confirmer le refus</button>
      <button :class="cls.btnOutline" @click="rejectModal.open = false">Annuler</button>
    </template>
  </ModalShell>
</template>
