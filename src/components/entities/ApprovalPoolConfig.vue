<script setup lang="ts">
/**
 * Configuration des pools de validation d'une entité — un pool distinct par
 * type de demande (Congés/Missions/Notes de frais), chacun avec ses
 * validateurs N+1 à N+4 et gestion de l'intérim par niveau.
 * Nécessite une entité déjà créée (OrganizationUnitId réel) — voir
 * EntityCreate.vue qui redirige vers la fiche après création pour ça.
 */
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, Trash2, UserRoundCog } from 'lucide-vue-next'
import * as cls from '../../lib/formClasses'
import { useApprovalPoolStore } from '../../stores/approvalPools'
import type { ApprovalObjectType } from '../../stores/approvalPools'
import { useEmployeeStore } from '../../stores/employees'

const props = defineProps<{ entityId: string }>()

const store = useApprovalPoolStore()
const empStore = useEmployeeStore()

function load() { store.fetchByUnit(props.entityId) }
onMounted(load)
watch(() => props.entityId, load)

const OBJECT_TYPES: { key: ApprovalObjectType; label: string }[] = [
  { key: 'Leave', label: 'Congés' },
  { key: 'Mission', label: 'Missions' },
  { key: 'ExpenseReport', label: 'Notes de frais' },
]
const activeType = ref<ApprovalObjectType>('Leave')
const activePool = computed(() => store.poolFor(activeType.value))

function memberAt(level: 1 | 2 | 3 | 4) {
  return activePool.value?.members.find(m => m.stepOrder === level)
}

async function ensurePool(): Promise<string | undefined> {
  if (activePool.value) return activePool.value.id
  const label = OBJECT_TYPES.find(t => t.key === activeType.value)!.label
  const created = await store.createPool(props.entityId, activeType.value, `Validation ${label}`)
  return created.id
}

const pendingLevel = ref<number | null>(null)
async function addValidator(level: 1 | 2 | 3 | 4, employeeId: string) {
  if (!employeeId) return
  const poolId = await ensurePool()
  if (!poolId) return
  await store.addMember({ approvalPoolId: poolId, stepOrder: level, employeeId })
  pendingLevel.value = null
}

async function removeValidator(memberId: string) {
  if (!confirm('Retirer ce validateur ?')) return
  await store.removeMember(memberId)
}

// ── Intérim ─────────────────────────────────────────────────────
const interimOpenFor = ref<string | null>(null)
const interimForm = ref({ interimEmployeeId: '', interimStartDate: '', interimEndDate: '' })

function openInterim(memberId: string) {
  const m = activePool.value?.members.find(x => x.id === memberId)
  interimForm.value = {
    interimEmployeeId: m?.interimEmployeeId ?? '',
    interimStartDate: m?.interimStartDate?.slice(0, 10) ?? '',
    interimEndDate: m?.interimEndDate?.slice(0, 10) ?? '',
  }
  interimOpenFor.value = memberId
}
async function saveInterim(memberId: string) {
  await store.updateMember(memberId, {
    interimEmployeeId: interimForm.value.interimEmployeeId || undefined,
    interimStartDate: interimForm.value.interimStartDate || undefined,
    interimEndDate: interimForm.value.interimEndDate || undefined,
  })
  interimOpenFor.value = null
}
async function clearInterim(memberId: string) {
  await store.updateMember(memberId, { interimEmployeeId: undefined, interimStartDate: undefined, interimEndDate: undefined })
  interimOpenFor.value = null
}

function employeeLabel(id?: string): string {
  if (!id) return '—'
  const e = empStore.getById(id)
  return e ? `${e.name} · ${e.jobTitle || 'Employé'}` : '—'
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex gap-1.5 border-b border-border">
      <button
        v-for="t in OBJECT_TYPES" :key="t.key"
        class="px-3 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors"
        :class="activeType === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="activeType = t.key"
      >{{ t.label }}</button>
    </div>

    <p class="text-xs text-muted-foreground -mt-1">
      Définit qui approuve les demandes de ce type pour cette entité. Les niveaux non configurés sont ignorés dans le circuit de validation.
    </p>

    <div v-if="store.loading" class="text-xs text-muted-foreground italic">Chargement…</div>
    <div v-else class="flex flex-col gap-2">
      <div v-for="level in ([1, 2, 3, 4] as const)" :key="level" class="flex flex-col gap-1.5 px-3 py-2 bg-background rounded-lg border border-border">
        <div class="flex items-center gap-2.5">
          <span class="text-[11px] font-bold px-2.5 py-[3px] rounded-full bg-primary/10 text-primary shrink-0">N+{{ level }}</span>

          <template v-if="memberAt(level)">
            <span class="flex-1 text-[13px]">{{ employeeLabel(memberAt(level)!.employeeId) }}</span>
            <button type="button" :class="[cls.btnOutline, '!px-2 !py-1 !text-xs']" title="Intérim" @click="openInterim(memberAt(level)!.id)">
              <UserRoundCog class="w-3.5 h-3.5" />
            </button>
            <button type="button" class="w-7 h-7 rounded-md flex items-center justify-center bg-danger-bg text-danger shrink-0 hover:opacity-75" title="Retirer" @click="removeValidator(memberAt(level)!.id)">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </template>
          <template v-else>
            <select
              :class="[cls.fieldSelect, 'flex-1']"
              :value="pendingLevel === level ? '' : ''"
              @change="addValidator(level, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">-- Choisir un validateur --</option>
              <optgroup label="Directeurs RH">
                <option v-for="e in empStore.employees.filter(x => x.role === 'hr_director' && x.hasAccount)" :key="e.id" :value="e.id">{{ e.name }} · {{ e.jobTitle }}</option>
              </optgroup>
              <optgroup label="Admins RH">
                <option v-for="e in empStore.employees.filter(x => x.role === 'hr_admin' && x.hasAccount)" :key="e.id" :value="e.id">{{ e.name }} · {{ e.jobTitle }}</option>
              </optgroup>
              <optgroup label="Validateurs">
                <option v-for="e in empStore.employees.filter(x => x.role === 'validator' && x.hasAccount)" :key="e.id" :value="e.id">{{ e.name }} · {{ e.jobTitle }}</option>
              </optgroup>
            </select>
          </template>
        </div>

        <!-- Intérim -->
        <div v-if="interimOpenFor === memberAt(level)?.id" class="flex flex-col gap-2 mt-1 pt-2 border-t border-border">
          <div class="grid grid-cols-3 gap-2">
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Intérimaire</label>
              <select v-model="interimForm.interimEmployeeId" :class="cls.fieldSelect">
                <option value="">-- Aucun --</option>
                <option v-for="e in empStore.employees.filter(x => x.hasAccount && x.id !== memberAt(level)!.employeeId)" :key="e.id" :value="e.id">{{ e.name }}</option>
              </select>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Du</label>
              <input type="date" v-model="interimForm.interimStartDate" :class="cls.fieldInput" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Au</label>
              <input type="date" v-model="interimForm.interimEndDate" :class="cls.fieldInput" />
            </div>
          </div>
          <div class="flex gap-2 justify-end">
            <button type="button" :class="[cls.btnOutline, '!px-2.5 !py-1 !text-xs']" @click="clearInterim(memberAt(level)!.id)">Retirer l'intérim</button>
            <button type="button" :class="[cls.btnPrimary, '!px-2.5 !py-1 !text-xs']" @click="saveInterim(memberAt(level)!.id)">Enregistrer</button>
          </div>
        </div>
        <div v-else-if="memberAt(level)?.interimEmployeeId" class="text-[11px] text-muted-foreground pl-[calc(2.5rem+8px)]">
          Intérim : {{ employeeLabel(memberAt(level)!.interimEmployeeId) }}
          ({{ memberAt(level)!.interimStartDate?.slice(0,10) }} → {{ memberAt(level)!.interimEndDate?.slice(0,10) }})
        </div>
      </div>
    </div>
  </div>
</template>
