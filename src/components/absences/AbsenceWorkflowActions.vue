<script setup lang="ts">
/**
 * Boutons d'action métier d'une demande d'absence (Approuver / Retourner /
 * Refuser / Soumettre / Annuler / Marquer effectué / Régulariser), avec les
 * modales de commentaire nécessaires. Réutilisé dans la toolbar de la liste
 * (actions contextuelles) ET dans la barre d'actions de la fiche (AbsenceCard).
 *
 * Le serveur reste la seule autorité sur qui peut valider quoi (voir
 * leave-request.service.ts assertIsCurrentApprover) — les gates ci-dessous
 * n'évitent que les clics manifestement hors sujet (ex : approuver sa propre
 * demande), pas de logique de permission dupliquée côté client.
 */
import { reactive } from 'vue'
import { Undo2, Check, X, Send, CheckCheck, RotateCcw, Ban, Trash2 } from 'lucide-vue-next'
import ModalShell from '../ui/ModalShell.vue'
import * as cls from '../../lib/formClasses'
import { confirmDialog } from '../../lib/confirm'
import { useLeaveRequestStore } from '../../stores/leaveRequests'
import { useAuthStore } from '../../stores/auth'
import type { LeaveRequest } from '../../types'

const props = defineProps<{ leave: LeaveRequest }>()
const emit = defineEmits<{ deleted: [] }>()
const store = useLeaveRequestStore()
const auth  = useAuthStore()

const btn = 'px-2.5 py-[5px] rounded text-xs font-medium cursor-pointer whitespace-nowrap inline-flex items-center gap-1 transition-colors'
const approveCls = btn + ' bg-success-bg text-success hover:brightness-95'
const returnCls  = btn + ' bg-info-bg text-info hover:brightness-95'
const rejectCls  = btn + ' bg-danger-bg text-danger hover:brightness-95'
const cancelCls  = btn + ' bg-neutral-bg text-neutral hover:brightness-95'
const deleteCls  = btn + ' bg-danger-bg text-danger hover:brightness-95'

const IN_APPROVAL: LeaveRequest['status'][] = ['Pending', 'InApprovalN1', 'InApprovalN2', 'InApprovalN3', 'InApprovalN4']
// Une fois Approved/Registered, seule une action administrative peut encore
// annuler (voir LeaveRequestService.cancel côté backend) — le demandeur lui-
// même ne peut plus revenir en arrière depuis ce bouton self-service.
const CANCELLABLE: LeaveRequest['status'][] = ['Draft', 'Pending', 'InApprovalN1', 'InApprovalN2', 'InApprovalN3', 'InApprovalN4']

const isOwner   = () => props.leave.employeeId === auth.user?.id
const canValidate = () => auth.hasPermission('CONGE_VALIDER') && !isOwner() && IN_APPROVAL.includes(props.leave.status)

function approve() { store.approve(props.leave.id) }
function submit()  { store.submit(props.leave.id) }
function markDone() { store.markDone(props.leave.id) }
function regularize() { store.regularize(props.leave.id) }
async function cancel() {
  if (await confirmDialog('Annuler cette demande ?')) store.cancel(props.leave.id)
}
// Suppression definitive — distincte d'Annuler (qui garde la trace, statut
// Cancelled). Reservee au createur et aux brouillons (le serveur refait la
// meme verification, voir LeaveRequestService.remove) : rien n'a encore ete
// soumis, aucune trace d'audit a preserver.
async function remove() {
  if (await confirmDialog('Supprimer définitivement cette demande ? Cette action est irréversible.', { danger: true })) {
    await store.remove(props.leave.id)
    emit('deleted')
  }
}

/* ── Modale Retourner ───────────────────────────────────────── */
const returnModal = reactive({ open: false, comment: '', error: '' })
function openReturn() { Object.assign(returnModal, { open: true, comment: '', error: '' }) }
function confirmReturn() {
  if (returnModal.comment.trim().length < 10) { returnModal.error = 'Le commentaire doit comporter au moins 10 caractères'; return }
  store.returnLeave(props.leave.id, returnModal.comment.trim())
  returnModal.open = false
}

/* ── Modale Refuser ─────────────────────────────────────────── */
const rejectModal = reactive({ open: false, reason: '', error: '' })
function openReject() { Object.assign(rejectModal, { open: true, reason: '', error: '' }) }
function confirmReject() {
  if (rejectModal.reason.trim().length < 10) { rejectModal.error = 'Le motif doit comporter au moins 10 caractères'; return }
  store.reject(props.leave.id, rejectModal.reason.trim())
  rejectModal.open = false
}
</script>

<template>
  <div class="flex items-center gap-1.5 flex-wrap">
    <template v-if="canValidate()">
      <button :class="approveCls" @click="approve"><Check class="w-3.5 h-3.5" /> Approuver</button>
      <button :class="returnCls" @click="openReturn"><Undo2 class="w-3.5 h-3.5" /> Retourner</button>
      <button :class="rejectCls" @click="openReject"><X class="w-3.5 h-3.5" /> Refuser</button>
    </template>
    <template v-else-if="isOwner() && (leave.status === 'Draft' || leave.status === 'Returned')">
      <button :class="approveCls" @click="submit"><Send class="w-3.5 h-3.5" /> Soumettre</button>
    </template>
    <template v-else-if="isOwner() && leave.status === 'Registered'">
      <button :class="approveCls" @click="markDone"><CheckCheck class="w-3.5 h-3.5" /> Marquer effectué</button>
    </template>
    <template v-else-if="isOwner() && leave.status === 'Done'">
      <button :class="approveCls" @click="regularize"><RotateCcw class="w-3.5 h-3.5" /> Régulariser</button>
    </template>
    <span v-else-if="!isOwner() || !CANCELLABLE.includes(leave.status)" class="text-xs text-muted-foreground italic">Aucune action disponible</span>

    <button v-if="isOwner() && CANCELLABLE.includes(leave.status) && !canValidate()" :class="cancelCls" @click="cancel">
      <Ban class="w-3.5 h-3.5" /> Annuler
    </button>
    <button v-if="isOwner() && leave.status === 'Draft'" :class="deleteCls" @click="remove">
      <Trash2 class="w-3.5 h-3.5" /> Supprimer
    </button>
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
