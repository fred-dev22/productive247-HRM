<template>
  <div class="px-7 py-6">
    <div :class="L.pageHeader">
      <div>
        <div :class="L.pageTitle">Grilles d'évaluation d'entretien</div>
        <div :class="L.pageSub">{{ store.items.length }} grille(s) · rattachables à une offre d'emploi</div>
      </div>
      <button :class="L.btnPrimary" @click="openNew">
        <Plus class="w-4 h-4" /> Nouvelle grille
      </button>
    </div>

    <div v-if="store.loading" :class="L.emptyState">
      <ClipboardCheck class="w-8 h-8" />
      <p class="text-[13px]">Chargement…</p>
    </div>
    <div v-else-if="store.items.length > 0" class="grid grid-cols-3 gap-3.5 max-lg:grid-cols-2 max-sm:grid-cols-1">
      <div v-for="t in store.items" :key="t.id" :class="[L.card, 'flex flex-col gap-2.5']">
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-semibold text-foreground truncate">{{ t.name }}</span>
          <span class="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap bg-primary/10 text-primary shrink-0">
            {{ t.criteria.length }} critère(s)
          </span>
        </div>
        <ul class="text-[12px] text-muted-foreground list-disc pl-4 space-y-0.5">
          <li v-for="(c, i) in t.criteria.slice(0, 5)" :key="i">{{ c }}</li>
          <li v-if="t.criteria.length > 5" class="list-none text-[11px]">+ {{ t.criteria.length - 5 }} autres</li>
        </ul>
        <div class="flex items-center gap-2 mt-auto pt-1">
          <button :class="L.btnOutline" @click="openEdit(t)"><Pencil class="w-3.5 h-3.5" /> Modifier</button>
          <button :class="[L.btnOutline, 'text-danger']" :disabled="!!t.jobOffersCount" @click="remove(t)">
            <Trash2 class="w-3.5 h-3.5" /> Supprimer
          </button>
        </div>
        <p v-if="t.jobOffersCount" class="text-[11px] text-muted-foreground">Rattachée à {{ t.jobOffersCount }} offre(s).</p>
      </div>
    </div>
    <div v-else :class="L.emptyState">
      <ClipboardCheck class="w-8 h-8" />
      <p class="text-[13px]">Aucune grille d'évaluation. Créez-en une pour standardiser vos entretiens.</p>
    </div>

    <!-- Modale création / édition -->
    <ModalShell :open="modal.open" :title="modal.id ? 'Modifier la grille' : 'Nouvelle grille d\'évaluation'" max-width="max-w-[520px]" @close="modal.open = false">
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Nom de la grille *</label>
        <input v-model="modal.name" :class="cls.fieldInput" placeholder="ex : Grille poste terrain" />
      </div>
      <div :class="cls.field" class="mt-3">
        <label :class="cls.fieldLabel">Critères (un par ligne) *</label>
        <textarea
          v-model="modal.criteriaText"
          :class="cls.fieldTextarea"
          rows="6"
          placeholder="Compétences techniques&#10;Communication&#10;Motivation&#10;Adéquation culturelle"
        ></textarea>
        <p class="text-[11px] text-muted-foreground mt-1">Chaque critère sera noté de 0 à 5 lors de l'évaluation ; la note globale est la moyenne.</p>
      </div>
      <div v-if="modal.error" :class="cls.fieldError">{{ modal.error }}</div>
      <template #footer>
        <button :class="cls.btnPrimary" @click="save">{{ modal.id ? 'Enregistrer' : 'Créer' }}</button>
        <button :class="cls.btnOutline" @click="modal.open = false">Annuler</button>
      </template>
    </ModalShell>
  </div>
</template>

<script setup lang="ts">
/**
 * Gestion des grilles d'évaluation d'entretien (US15) — le RH crée des jeux
 * de critères réutilisables, rattachables à une offre d'emploi (voir
 * JobOffersView.vue). Proposées par défaut lors de l'évaluation des
 * entretiens de cette offre (voir InterviewWorkflowActions.vue).
 */
import { reactive, onMounted } from 'vue'
import { Plus, Pencil, Trash2, ClipboardCheck } from 'lucide-vue-next'
import ModalShell from '../../components/ui/ModalShell.vue'
import * as cls from '../../lib/formClasses'
import * as L from '../../lib/listClasses'
import { confirmDialog } from '../../lib/confirm'
import { withToast } from '../../lib/withToast'
import { getApiErrorMessage } from '../../lib/api'
import { useEvalTemplateStore } from '../../stores/recruitment'
import type { InterviewEvaluationTemplate } from '../../stores/recruitment'

const store = useEvalTemplateStore()
onMounted(() => store.fetchAll())

const modal = reactive({ open: false, id: '' as string, name: '', criteriaText: '', error: '' })

function openNew() {
  Object.assign(modal, { open: true, id: '', name: '', criteriaText: '', error: '' })
}
function openEdit(t: InterviewEvaluationTemplate) {
  Object.assign(modal, { open: true, id: t.id, name: t.name, criteriaText: t.criteria.join('\n'), error: '' })
}

async function save() {
  const name = modal.name.trim()
  const criteria = modal.criteriaText.split('\n').map(c => c.trim()).filter(Boolean)
  if (!name) { modal.error = 'Le nom est requis'; return }
  if (criteria.length === 0) { modal.error = 'Ajoutez au moins un critère'; return }
  try {
    if (modal.id) await store.update(modal.id, { name, criteria })
    else await store.create({ name, criteria })
    modal.open = false
  } catch (e) {
    modal.error = getApiErrorMessage(e, 'Enregistrement impossible')
  }
}

async function remove(t: InterviewEvaluationTemplate) {
  if (t.jobOffersCount) return
  if (await confirmDialog(`Supprimer la grille « ${t.name} » ?`)) {
    await withToast('Suppression…', () => store.remove(t.id), () => 'Suppression impossible')
  }
}
</script>
