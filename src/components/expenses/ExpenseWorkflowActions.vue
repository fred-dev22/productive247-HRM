<script setup lang="ts">
/**
 * Boutons d'action métier d'une note de frais (Soumettre / Approuver / Refuser)
 * + modale de refus. Réutilisé dans la toolbar de la liste (actions
 * contextuelles) ET dans la barre d'actions de la fiche (ExpenseCard).
 */
import { reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Check, X, Send } from 'lucide-vue-next'
import ModalShell from '../ui/ModalShell.vue'
import * as cls from '../../lib/formClasses'
import { useAuthStore } from '../../stores/auth'
import { useExpenseStore } from '../../stores/expenses'
import type { ExpenseReport } from '../../types'

const props = defineProps<{ report: ExpenseReport }>()
const expenseStore = useExpenseStore()
const auth = useAuthStore()
const route = useRoute()

const isRh = computed(() =>
  route.path.startsWith('/hr') || auth.user?.role === 'hr_admin' || auth.user?.role === 'hr_director',
)

const btn = 'px-2.5 py-[5px] rounded text-xs font-medium cursor-pointer whitespace-nowrap inline-flex items-center gap-1 transition-colors'
const approveCls = btn + ' bg-success-bg text-success hover:brightness-95'
const rejectCls  = btn + ' bg-danger-bg text-danger hover:brightness-95'

function submit() { expenseStore.submitReport(props.report.id) }
function approve() { expenseStore.approveReport(props.report.id) }

const rejectModal = reactive({ open: false, reason: '', error: '' })
function openReject() { Object.assign(rejectModal, { open: true, reason: '', error: '' }) }
function confirmReject() {
  if (rejectModal.reason.trim().length < 3) { rejectModal.error = 'Le motif est obligatoire'; return }
  expenseStore.rejectReport(props.report.id, rejectModal.reason.trim())
  rejectModal.open = false
}
</script>

<template>
  <div class="flex items-center gap-1.5">
    <template v-if="report.status === 'draft' && !isRh">
      <button :class="approveCls" @click="submit"><Send class="w-3.5 h-3.5" /> Soumettre</button>
    </template>
    <template v-else-if="report.status === 'pending' && isRh">
      <button :class="approveCls" @click="approve"><Check class="w-3.5 h-3.5" /> Approuver</button>
      <button :class="rejectCls" @click="openReject"><X class="w-3.5 h-3.5" /> Refuser</button>
    </template>
    <span v-else class="text-xs text-muted-foreground italic">Aucune action disponible</span>
  </div>

  <ModalShell :open="rejectModal.open" :title="`Refuser la note ${report.code}`" max-width="max-w-[420px]" @close="rejectModal.open = false">
    <label :class="cls.fieldLabel">Motif du refus *</label>
    <textarea v-model="rejectModal.reason" :class="cls.fieldTextarea" placeholder="Indiquez le motif du refus…" rows="4"></textarea>
    <div v-if="rejectModal.error" :class="cls.fieldError">{{ rejectModal.error }}</div>
    <template #footer>
      <button :class="cls.btnPrimary" @click="confirmReject">Confirmer le refus</button>
      <button :class="cls.btnOutline" @click="rejectModal.open = false">Annuler</button>
    </template>
  </ModalShell>
</template>
