<script setup lang="ts">
/**
 * Boutons d'action métier d'un ordre de mission (Approuver / Retourner /
 * Refuser / Soumettre / Annuler) + modales de commentaire. Réutilisé dans la
 * toolbar de la liste (actions contextuelles) ET dans la barre d'actions de la
 * fiche (MissionCard). Calqué sur AbsenceWorkflowActions.
 *
 * Le serveur reste la seule autorité sur qui peut valider quoi (voir
 * mission-order.service.ts assertIsCurrentApprover) — les gates ci-dessous
 * n'évitent que les clics manifestement hors sujet, pas de logique de
 * permission dupliquée côté client.
 */
import { reactive } from 'vue'
import { Undo2, Check, X, Send, Ban, Trash2 } from 'lucide-vue-next'
import ModalShell from '../ui/ModalShell.vue'
import * as cls from '../../lib/formClasses'
import { confirmDialog } from '../../lib/confirm'
import { useMissionStore } from '../../stores/missions'
import { useAuthStore } from '../../stores/auth'
import type { MissionOrder } from '../../types'

const props = defineProps<{ mission: MissionOrder }>()
const emit = defineEmits<{ deleted: [] }>()
const missionStore = useMissionStore()
const auth = useAuthStore()

const btn = 'px-2.5 py-[5px] rounded text-xs font-medium cursor-pointer whitespace-nowrap inline-flex items-center gap-1 transition-colors'
const approveCls = btn + ' bg-success-bg text-success hover:brightness-95'
const returnCls  = btn + ' bg-info-bg text-info hover:brightness-95'
const rejectCls  = btn + ' bg-danger-bg text-danger hover:brightness-95'
const cancelCls  = btn + ' bg-neutral-bg text-neutral hover:brightness-95'
const deleteCls  = btn + ' bg-danger-bg text-danger hover:brightness-95'

const IN_APPROVAL: MissionOrder['status'][] = ['Pending', 'InApprovalN1', 'InApprovalN2', 'InApprovalN3', 'InApprovalN4']
const CANCELLABLE: MissionOrder['status'][] = ['Draft', 'InApprovalN1', 'InApprovalN2', 'InApprovalN3', 'InApprovalN4', 'Approved']

const isOwner   = () => props.mission.employeeId === auth.user?.id
const canValidate = () => auth.hasPermission('MISSION_VALIDER') && !isOwner() && IN_APPROVAL.includes(props.mission.status)

function approve() { missionStore.approve(props.mission.id) }
function submit()  { missionStore.submit(props.mission.id) }
async function cancel() {
  if (await confirmDialog('Annuler cet ordre de mission ?')) missionStore.cancel(props.mission.id)
}
async function remove() {
  if (await confirmDialog('Supprimer définitivement cet ordre de mission ? Cette action est irréversible.', { danger: true })) {
    await missionStore.remove(props.mission.id)
    emit('deleted')
  }
}

/* ── Modale Retourner ───────────────────────────────────────── */
const returnModal = reactive({ open: false, comment: '', error: '' })
function openReturn() { Object.assign(returnModal, { open: true, comment: '', error: '' }) }
function confirmReturn() {
  if (returnModal.comment.trim().length < 10) { returnModal.error = 'Le commentaire doit comporter au moins 10 caractères'; return }
  missionStore.returnMission(props.mission.id, returnModal.comment.trim())
  returnModal.open = false
}

/* ── Modale Refuser ─────────────────────────────────────────── */
const rejectModal = reactive({ open: false, reason: '', error: '' })
function openReject() { Object.assign(rejectModal, { open: true, reason: '', error: '' }) }
function confirmReject() {
  if (rejectModal.reason.trim().length < 10) { rejectModal.error = 'Le motif doit comporter au moins 10 caractères'; return }
  missionStore.reject(props.mission.id, rejectModal.reason.trim())
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
    <template v-else-if="isOwner() && (mission.status === 'Draft' || mission.status === 'Returned')">
      <button :class="approveCls" @click="submit"><Send class="w-3.5 h-3.5" /> Soumettre</button>
    </template>
    <span v-else-if="!isOwner() || !CANCELLABLE.includes(mission.status)" class="text-xs text-muted-foreground italic">Aucune action disponible</span>

    <button v-if="isOwner() && CANCELLABLE.includes(mission.status) && !canValidate()" :class="cancelCls" @click="cancel">
      <Ban class="w-3.5 h-3.5" /> Annuler
    </button>
    <button v-if="isOwner() && mission.status === 'Draft'" :class="deleteCls" @click="remove">
      <Trash2 class="w-3.5 h-3.5" /> Supprimer
    </button>
  </div>

  <!-- Modale Retourner -->
  <ModalShell :open="returnModal.open" :title="`Retourner la mission de ${mission.employeeName}`" max-width="max-w-[420px]" @close="returnModal.open = false">
    <label :class="cls.fieldLabel">Commentaire *</label>
    <textarea v-model="returnModal.comment" :class="cls.fieldTextarea" placeholder="Expliquez les corrections requises…" rows="4"></textarea>
    <div v-if="returnModal.error" :class="cls.fieldError">{{ returnModal.error }}</div>
    <template #footer>
      <button :class="cls.btnPrimary" @click="confirmReturn"><Undo2 class="w-4 h-4" /> Retourner</button>
      <button :class="cls.btnOutline" @click="returnModal.open = false">Annuler</button>
    </template>
  </ModalShell>

  <!-- Modale Refuser -->
  <ModalShell :open="rejectModal.open" :title="`Refuser la mission de ${mission.employeeName}`" max-width="max-w-[420px]" @close="rejectModal.open = false">
    <label :class="cls.fieldLabel">Motif du refus *</label>
    <textarea v-model="rejectModal.reason" :class="cls.fieldTextarea" placeholder="Indiquez le motif du refus…" rows="4"></textarea>
    <div v-if="rejectModal.error" :class="cls.fieldError">{{ rejectModal.error }}</div>
    <template #footer>
      <button :class="cls.btnPrimary" @click="confirmReject">Confirmer le refus</button>
      <button :class="cls.btnOutline" @click="rejectModal.open = false">Annuler</button>
    </template>
  </ModalShell>
</template>
