<script setup lang="ts">
/**
 * Bouton d'action du vivier de talents (Retirer du vivier). Réutilisé dans le
 * volet d'aperçu de la liste ET dans la barre d'actions de la fiche
 * (TalentPoolCard). Calqué sur MissionWorkflowActions.vue.
 *
 * TalentPoolEntry n'a pas de statut ni de workflow d'approbation : une seule
 * action métier existe côté store (talentPoolStore.remove).
 */
import { Trash2 } from 'lucide-vue-next'
import { confirmDialog } from '../../lib/confirm'
import { useTalentPoolStore } from '../../stores/recruitment'
import type { TalentPoolEntry } from '../../stores/recruitment'

const props = defineProps<{ item: TalentPoolEntry }>()
const emit = defineEmits<{ removed: [] }>()
const talentPoolStore = useTalentPoolStore()

const btn = 'px-2.5 py-[5px] rounded text-xs font-medium cursor-pointer whitespace-nowrap inline-flex items-center gap-1 transition-colors'
const removeCls = btn + ' bg-danger-bg text-danger hover:brightness-95'

async function remove() {
  if (await confirmDialog('Retirer ce profil du vivier de talents ?')) {
    talentPoolStore.remove(props.item.id)
    emit('removed')
  }
}
</script>

<template>
  <button :class="removeCls" @click="remove">
    <Trash2 class="w-3.5 h-3.5" /> Retirer du vivier
  </button>
</template>
