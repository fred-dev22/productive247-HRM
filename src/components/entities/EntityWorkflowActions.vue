<script setup lang="ts">
/**
 * Boutons d'action métier d'une entité (Soumettre / Approuver / Rejeter /
 * Désactiver). Réutilisé dans la toolbar de la liste (actions contextuelles)
 * ET dans la barre d'actions de la fiche (EntityCard).
 */
import { Check, X, Send, Ban, RotateCcw } from 'lucide-vue-next'
import { useEntityStore } from '../../stores/entities'
import { useAuthStore } from '../../stores/auth'
import type { Entity } from '../../types'

const props = defineProps<{ entity: Entity }>()
const store = useEntityStore()
const auth = useAuthStore()

const btn = 'px-2.5 py-[5px] rounded text-xs font-medium cursor-pointer whitespace-nowrap inline-flex items-center gap-1 transition-colors'
const approveCls = btn + ' bg-success-bg text-success hover:brightness-95'
const rejectCls  = btn + ' bg-danger-bg text-danger hover:brightness-95'
</script>

<template>
  <div class="flex items-center gap-1.5">
    <template v-if="entity.status === 'Draft' && auth.hasPermission('ENTITE_SOUMETTRE')">
      <button :class="approveCls" @click="store.submitEntity(entity.id)"><Send class="w-3.5 h-3.5" /> Soumettre</button>
    </template>
    <template v-else-if="entity.status === 'PendingApproval' && auth.hasPermission('ENTITE_APPROUVER')">
      <button :class="approveCls" @click="store.approveEntity(entity.id)"><Check class="w-3.5 h-3.5" /> Approuver</button>
      <button :class="rejectCls" @click="store.rejectEntity(entity.id)"><X class="w-3.5 h-3.5" /> Rejeter</button>
    </template>
    <template v-else-if="entity.status === 'Active' && auth.hasPermission('ENTITE_DESACTIVER')">
      <button :class="rejectCls" @click="store.deactivateEntity(entity.id)"><Ban class="w-3.5 h-3.5" /> Désactiver</button>
    </template>
    <template v-else-if="entity.status === 'Inactive' && auth.hasPermission('ENTITE_DESACTIVER')">
      <button :class="approveCls" @click="store.reactivateEntity(entity.id)"><RotateCcw class="w-3.5 h-3.5" /> Réactiver</button>
    </template>
    <span v-else class="text-xs text-muted-foreground italic">Aucune action disponible</span>
  </div>
</template>
