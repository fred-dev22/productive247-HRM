<script setup lang="ts">
/**
 * Configuration des pools de validation d'une entité — un pool distinct par
 * type de demande (Congés/Missions/Notes de frais), chacun avec ses
 * validateurs N+1 à N+4 et gestion de l'intérim par niveau.
 * Nécessite une entité déjà créée (OrganizationUnitId réel) — voir
 * EntityCreate.vue qui redirige vers la fiche après création pour ça.
 *
 * Mode "même pool pour les 3 types" (voir linked ci-dessous) : pas de champ
 * dédié en base — on maintient 3 ApprovalPool physiquement synchronisés
 * (mêmes validateurs/intérims à chaque niveau) plutôt que d'ajouter un
 * schéma de pool partagé, pour ne pas complexifier le modèle pour un simple
 * raccourci d'édition. Décocher n'efface rien, les 3 pools divergent ensuite
 * librement depuis leur état synchronisé.
 */
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, Trash2, UserRoundCog } from 'lucide-vue-next'
import * as cls from '../../lib/formClasses'
import { useApprovalPoolStore } from '../../stores/approvalPools'
import type { ApprovalObjectType, ApprovalPoolMember } from '../../stores/approvalPools'
import { useEmployeeStore } from '../../stores/employees'
import { useEmployeeCategoryStore } from '../../stores/employeeCategories'
import { confirmDialog } from '../../lib/confirm'

const props = defineProps<{ entityId: string }>()

const store = useApprovalPoolStore()
const empStore = useEmployeeStore()
const categoryStore = useEmployeeCategoryStore()
if (categoryStore.categories.length === 0) categoryStore.fetchAll()

// Regroupement par catégorie réelle (voir stores/employeeCategories.ts) —
// remplace les 3 optgroups figés par rôle (Directeur RH/Admin RH/
// Validateur), qui n'existent plus (voir decision du 29/07). Tout le monde
// est listé (pas seulement ceux avec un compte) — voir hasAccount sur
// chaque option pour le grisage côté template (decision du 30/07 : mieux
// vaut montrer pourquoi une option est indisponible que la cacher).
const validatorsByCategory = computed(() => {
  const groups = new Map<string, typeof empStore.employees>()
  for (const e of empStore.employees) {
    const label = categoryStore.categories.find(c => c.id === e.employeeCategoryId)?.name ?? 'Sans catégorie'
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(e)
  }
  return [...groups.entries()].map(([label, employees]) => ({ label, employees }))
})

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

// Permission requise pour qu'un validateur puisse effectivement voir/traiter
// la file "À valider" de ce type de demande (voir router/index.ts
// ROUTE_PERMISSIONS['employee-to-validate']) — avoir un compte ne suffit pas,
// bug trouvé lors du test du 30/07 (un N+2 avec compte mais sans cette
// permission ne peut jamais approuver).
const VALIDER_PERMISSION: Record<ApprovalObjectType, string> = {
  Leave: 'CONGE_VALIDER',
  Mission: 'MISSION_VALIDER',
  ExpenseReport: 'FRAIS_VALIDER',
}
function canValidate(e: { employeeCategoryId?: string }): boolean {
  const code = VALIDER_PERMISSION[activeType.value]
  const category = categoryStore.categories.find(c => c.id === e.employeeCategoryId)
  return !!category?.permissions.some(p => p.code === code)
}

function memberAt(level: 1 | 2 | 3 | 4, type: ApprovalObjectType = activeType.value) {
  return store.poolFor(type)?.members.find(m => m.stepOrder === level)
}

async function ensurePoolFor(type: ApprovalObjectType): Promise<string | undefined> {
  const existing = store.poolFor(type)
  if (existing) return existing.id
  const label = OBJECT_TYPES.find(t => t.key === type)!.label
  const created = await store.createPool(props.entityId, type, `Validation ${label}`)
  return created.id
}

// ── Mode "même pool pour les 3 types" ──────────────────────────────
const linked = ref(false)
const typesToSync = computed<ApprovalObjectType[]>(() => linked.value ? OBJECT_TYPES.map(t => t.key) : [activeType.value])

async function toggleLinked(next: boolean) {
  if (next) {
    const ok = await confirmDialog(
      `Appliquer les validateurs actuels de « ${OBJECT_TYPES.find(t => t.key === activeType.value)!.label} » aux 3 types ? Les pools des 2 autres types seront remplacés.`,
      { confirmLabel: 'Appliquer' },
    )
    if (!ok) return
    await syncAllLevelsFrom(activeType.value)
  }
  linked.value = next
}

// Réplique, pour chaque niveau N+1..N+4, le validateur (+ intérim) du pool
// source vers les pools des 2 autres types.
async function syncAllLevelsFrom(sourceType: ApprovalObjectType) {
  for (const level of [1, 2, 3, 4] as const) {
    const source = memberAt(level, sourceType)
    for (const type of OBJECT_TYPES.map(t => t.key).filter(t => t !== sourceType)) {
      const poolId = await ensurePoolFor(type)
      if (!poolId) continue
      const existing = memberAt(level, type)
      if (!source) {
        if (existing) await store.removeMember(existing.id)
        continue
      }
      if (existing && existing.employeeId === source.employeeId) {
        await store.updateMember(existing.id, {
          interimEmployeeId: source.interimEmployeeId, interimStartDate: source.interimStartDate, interimEndDate: source.interimEndDate,
        })
      } else {
        if (existing) await store.removeMember(existing.id)
        const created = await store.addMember({ approvalPoolId: poolId, stepOrder: level, employeeId: source.employeeId })
        if (source.interimEmployeeId) {
          await store.updateMember(created.id, {
            interimEmployeeId: source.interimEmployeeId, interimStartDate: source.interimStartDate, interimEndDate: source.interimEndDate,
          })
        }
      }
    }
  }
}

async function addValidator(level: 1 | 2 | 3 | 4, employeeId: string) {
  if (!employeeId) return
  for (const type of typesToSync.value) {
    const poolId = await ensurePoolFor(type)
    if (!poolId) continue
    await store.addMember({ approvalPoolId: poolId, stepOrder: level, employeeId })
  }
}

async function removeValidator(level: 1 | 2 | 3 | 4) {
  if (!(await confirmDialog('Retirer ce validateur ?', { danger: false }))) return
  for (const type of typesToSync.value) {
    const member = memberAt(level, type)
    if (member) await store.removeMember(member.id)
  }
}

// ── Intérim ─────────────────────────────────────────────────────
const interimOpenFor = ref<number | null>(null)
const interimForm = ref({ interimEmployeeId: '', interimStartDate: '', interimEndDate: '' })

function openInterim(level: 1 | 2 | 3 | 4) {
  const m = memberAt(level)
  interimForm.value = {
    interimEmployeeId: m?.interimEmployeeId ?? '',
    interimStartDate: m?.interimStartDate?.slice(0, 10) ?? '',
    interimEndDate: m?.interimEndDate?.slice(0, 10) ?? '',
  }
  interimOpenFor.value = level
}
async function saveInterim(level: 1 | 2 | 3 | 4) {
  for (const type of typesToSync.value) {
    const member = memberAt(level, type)
    if (!member) continue
    await store.updateMember(member.id, {
      interimEmployeeId: interimForm.value.interimEmployeeId || undefined,
      interimStartDate: interimForm.value.interimStartDate || undefined,
      interimEndDate: interimForm.value.interimEndDate || undefined,
    })
  }
  interimOpenFor.value = null
}
async function clearInterim(level: 1 | 2 | 3 | 4) {
  for (const type of typesToSync.value) {
    const member = memberAt(level, type)
    if (member) await store.updateMember(member.id, { interimEmployeeId: undefined, interimStartDate: undefined, interimEndDate: undefined })
  }
  interimOpenFor.value = null
}

function employeeLabel(id?: string): string {
  if (!id) return '—'
  const e = empStore.getById(id)
  return e ? `${e.name} · ${e.jobTitle || 'Employé'}` : '—'
}

// Employés éligibles comme intérimaire : même entité que celle configurée
// ici (decision du 30/07) — un intérimaire d'une autre entité n'a pas de
// sens dans ce contexte de validation.
const interimCandidates = computed(() => empStore.employees.filter(x => x.hasAccount && x.entityId === props.entityId))
</script>

<template>
  <div class="flex flex-col gap-3">
    <label class="flex items-center gap-2 text-[13px] text-foreground cursor-pointer select-none">
      <input type="checkbox" class="accent-primary" :checked="linked" @change="toggleLinked(($event.target as HTMLInputElement).checked)" />
      Utiliser le même pool de validation pour les 3 types
    </label>

    <div class="flex gap-1.5 border-b border-border">
      <button
        v-for="t in OBJECT_TYPES" :key="t.key"
        class="px-3 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors"
        :class="activeType === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="activeType = t.key"
      >{{ t.label }}</button>
    </div>

    <p class="text-xs text-muted-foreground -mt-1">
      <template v-if="linked">Même configuration appliquée aux 3 types — modifier un niveau ici le modifie partout.</template>
      <template v-else>Définit qui approuve les demandes de ce type pour cette entité. Les niveaux non configurés sont ignorés dans le circuit de validation.</template>
    </p>

    <div v-if="store.loading" class="text-xs text-muted-foreground italic">Chargement…</div>
    <div v-else class="flex flex-col gap-2">
      <div v-for="level in ([1, 2, 3, 4] as const)" :key="level" class="flex flex-col gap-1.5 px-3 py-2 bg-background rounded-lg border border-border">
        <div class="flex items-center gap-2.5">
          <span class="text-[11px] font-bold px-2.5 py-[3px] rounded-full bg-primary/10 text-primary shrink-0">N+{{ level }}</span>

          <template v-if="memberAt(level)">
            <span class="flex-1 text-[13px]">{{ employeeLabel(memberAt(level)!.employeeId) }}</span>
            <button type="button" :class="[cls.btnOutline, '!px-2 !py-1 !text-xs']" title="Intérim" @click="openInterim(level)">
              <UserRoundCog class="w-3.5 h-3.5" />
            </button>
            <button type="button" class="w-7 h-7 rounded-md flex items-center justify-center bg-danger-bg text-danger shrink-0 hover:opacity-75" title="Retirer" @click="removeValidator(level)">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </template>
          <template v-else>
            <select
              :class="[cls.fieldSelect, 'flex-1']"
              value=""
              @change="addValidator(level, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">-- Choisir un validateur --</option>
              <optgroup v-for="grp in validatorsByCategory" :key="grp.label" :label="grp.label">
                <option
                  v-for="e in grp.employees" :key="e.id" :value="e.id"
                  :disabled="!e.hasAccount || !canValidate(e)"
                  :title="!e.hasAccount ? 'Cet employé n\'a pas de compte utilisateur — il ne peut pas se connecter pour approuver.' : !canValidate(e) ? 'La catégorie de cet employé n\'a pas la permission de validation pour ce type de demande — il ne pourra pas voir ni traiter la file « À valider ».' : ''"
                >{{ e.name }} · {{ e.jobTitle }}{{ !e.hasAccount ? ' (pas de compte)' : !canValidate(e) ? ' (permission manquante)' : '' }}</option>
              </optgroup>
            </select>
          </template>
        </div>

        <!-- Intérim -->
        <div v-if="interimOpenFor === level" class="flex flex-col gap-2 mt-1 pt-2 border-t border-border">
          <div class="grid grid-cols-3 gap-2">
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Intérimaire</label>
              <select v-model="interimForm.interimEmployeeId" :class="cls.fieldSelect">
                <option value="">-- Aucun --</option>
                <option v-for="e in interimCandidates.filter(x => x.id !== memberAt(level)!.employeeId)" :key="e.id" :value="e.id">{{ e.name }}</option>
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
            <button type="button" :class="[cls.btnOutline, '!px-2.5 !py-1 !text-xs']" @click="clearInterim(level)">Retirer l'intérim</button>
            <button type="button" :class="[cls.btnPrimary, '!px-2.5 !py-1 !text-xs']" @click="saveInterim(level)">Enregistrer</button>
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
