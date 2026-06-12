<template>
  <ListPageLayout
    title="Notes de frais"
    :subtitle="`${totalCount} note(s) · ${pendingCount} en attente`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} note(s)`"
    search-placeholder="Rechercher une note…"
    scope-label="Notes :"
    :scope-options="scopeOptions"
    v-model:scope="activeScope"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @open-card="openCard"
  >
    <template #header-actions>
      <button :class="L.btnPrimary" @click="showCreate = true">
        <Plus class="w-4 h-4" /> Nouvelle note
      </button>
    </template>

    <template #row-actions="{ item }">
      <ExpenseWorkflowActions :report="item" />
    </template>

    <template #cell-code="{ item }">
      <span class="font-mono text-xs font-semibold text-primary">{{ item.code }}</span>
    </template>
    <template #cell-employeeName="{ item }">
      <div class="flex items-center gap-2">
        <UserAvatar :name="item.employeeName" size="sm" />
        <span class="truncate">{{ item.employeeName }}</span>
      </div>
    </template>
    <template #cell-title="{ item }">
      <span class="truncate">{{ item.title }}</span>
    </template>
    <template #cell-linesCount="{ item }">
      <span class="text-center block">{{ item.lines.length }}</span>
    </template>
    <template #cell-totalAmount="{ item }">
      <span class="font-semibold whitespace-nowrap tabular-nums">{{ fmtNum(item.totalAmount) }} {{ item.currency }}</span>
    </template>
    <template #cell-submittedAt="{ item }">
      <span class="text-muted-foreground whitespace-nowrap text-[11px]">{{ item.submittedAt ?? '—' }}</span>
    </template>
    <template #cell-status="{ item }">
      <StatusPill :status="item.status" />
    </template>

    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3.5">
        <div class="flex items-center gap-2.5">
          <UserAvatar :name="item.employeeName" size="md" />
          <div class="min-w-0">
            <div class="text-sm font-semibold text-foreground truncate">{{ item.employeeName }}</div>
            <div class="text-[11px] text-muted-foreground font-mono">{{ item.code }}</div>
          </div>
        </div>
        <div><StatusPill :status="item.status" /></div>
        <div class="text-[12px]">
          <div class="text-muted-foreground text-[11px]">Titre</div>{{ item.title }}
        </div>
        <div class="grid grid-cols-2 gap-2 text-[12px]">
          <div><div class="text-muted-foreground text-[11px]">Lignes</div>{{ item.lines.length }}</div>
          <div><div class="text-muted-foreground text-[11px]">Total</div><span class="font-semibold text-primary">{{ fmtNum(item.totalAmount) }} {{ item.currency }}</span></div>
        </div>
        <button :class="L.btnPrimary" class="w-full justify-center" @click="openCard(item)">Ouvrir la fiche</button>
        <ExpenseWorkflowActions :report="item" />
      </div>
    </template>

    <template #empty>
      <ReceiptText class="w-8 h-8" />
      <p class="text-[13px]">Aucune note de frais</p>
    </template>

    <ExpenseCard v-if="openCardId !== null" :reports="filtered" :report-id="openCardId" @close="openCardId = null" />
    <ExpenseCreate v-if="showCreate" :mode="isRh ? 'for-employee' : 'self'" @close="showCreate = false" />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, ReceiptText } from 'lucide-vue-next'
import { StatusPill, UserAvatar, ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import ExpenseCard from '../../components/expenses/ExpenseCard.vue'
import ExpenseCreate from '../../components/expenses/ExpenseCreate.vue'
import ExpenseWorkflowActions from '../../components/expenses/ExpenseWorkflowActions.vue'
import * as L from '../../lib/listClasses'
import { useAuthStore } from '../../stores/auth'
import { useExpenseStore } from '../../stores/expenses'
import type { ExpenseReport } from '../../types'

const auth = useAuthStore()
const expenseStore = useExpenseStore()
const route = useRoute()

const isRh = computed(() =>
  route.path.startsWith('/hr') || auth.user?.role === 'hr_admin' || auth.user?.role === 'hr_director',
)

const showCreate = ref(false)
const openCardId = ref<string | null>(null)
function openCard(item: ExpenseReport) { openCardId.value = item.id }
function fmtNum(n: number) { return n.toLocaleString('fr-FR') }

const columns = computed<ListColumn[]>(() => {
  const base: ListColumn[] = [{ key: 'code', label: 'Code', sortable: true, hideable: false, width: 130 }]
  if (isRh.value) base.push({ key: 'employeeName', label: 'Employé', sortable: true, width: 200 })
  base.push(
    { key: 'title', label: 'Titre', sortable: true, width: 220 },
    { key: 'linesCount', label: 'Lignes', align: 'center', width: 90 },
    { key: 'totalAmount', label: 'Montant total', sortable: true, align: 'right', width: 150 },
    { key: 'submittedAt', label: 'Soumis le', width: 120 },
    { key: 'status', label: 'Statut', width: 130 },
  )
  return base
})

const scopeOptions = [
  { value: '', label: 'Toutes' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuvée' },
  { value: 'rejected', label: 'Refusée' },
]
const activeScope = ref('')

const searchQuery = ref('')
const sortKey = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')
const page = ref(1)
const pageSize = ref(10)
watch([activeScope, searchQuery, pageSize], () => { page.value = 1 })

const sortFieldMap: Record<string, keyof ExpenseReport> = {
  code: 'code', employeeName: 'employeeName', title: 'title', totalAmount: 'totalAmount',
}

const filtered = computed(() => {
  let rows = isRh.value ? expenseStore.reports : expenseStore.myReports(auth.user?.id ?? '')
  if (activeScope.value) rows = rows.filter(r => r.status === activeScope.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    rows = rows.filter(r => r.code.toLowerCase().includes(q) || r.employeeName.toLowerCase().includes(q) || r.title.toLowerCase().includes(q))
  }
  if (sortKey.value && sortFieldMap[sortKey.value]) {
    const f = sortFieldMap[sortKey.value]!
    rows = [...rows].sort((a, b) => {
      const va = a[f] ?? '', vb = b[f] ?? ''
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))
      return sortDir.value === 'asc' ? cmp : -cmp
    })
  }
  return rows
})

const totalCount = computed(() => filtered.value.length)
const pendingCount = computed(() => filtered.value.filter(r => r.status === 'pending').length)
const pageItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})
</script>
