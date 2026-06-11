<template>
  <div :class="L.shell">
    <AppTopNav :user="auth.user" />
    <div :class="L.mainLayout">
      <AppSidebar />
      <main :class="L.content" class="flex flex-col gap-4">

        <!-- En-tête -->
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 class="text-xl font-bold text-foreground">Perdiems</h1>
            <p class="text-[13px] text-muted-foreground mt-0.5">Taux de per diem par catégorie d'employé</p>
          </div>
          <button :class="L.btnPrimary" @click="openAdd">
            <Plus class="w-4 h-4" />
            Ajouter un taux
          </button>
        </div>

        <!-- Banner avertissement -->
        <div class="flex items-start gap-2.5 bg-warning-bg border-l-4 border-warning rounded-md px-4 py-3 text-[13px] text-foreground leading-relaxed">
          <TriangleAlert class="w-4 h-4 text-warning shrink-0 mt-px" />
          <span>
            Les montants affichés sont <strong>provisoires</strong>.
            Ils doivent être validés avec la direction avant la mise en production.
          </span>
        </div>

        <!-- Table perdiems -->
        <div :class="L.tableCard">
          <table class="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th :class="thUpper">Catégorie</th>
                <th :class="thUpper">Description</th>
                <th :class="thUpper">Taux / jour</th>
                <th :class="thUpper">Devise</th>
                <th :class="thUpper">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pd in calendar.perdiemRates ?? []" :key="pd.id" class="hover:bg-background">
                <td :class="[tdCell, 'font-semibold text-foreground']">{{ pd.category }}</td>
                <td :class="[tdCell, 'text-muted-foreground text-xs']">{{ pd.description }}</td>
                <td :class="[tdCell, 'font-semibold text-foreground']">{{ pd.ratePerDay.toLocaleString('fr-FR') }}</td>
                <td :class="[tdCell, 'text-muted-foreground']">{{ pd.currency }}</td>
                <td :class="tdCell">
                  <div class="flex gap-1">
                    <button :class="iconBtn" @click="openEdit(pd.id)">
                      <Pencil class="w-3.5 h-3.5" />
                    </button>
                    <button :class="[iconBtn, 'hover:!bg-danger-bg hover:!text-danger']" @click="calStore.removePerdiemRate(pd.id)">
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!calendar.perdiemRates?.length">
                <td colspan="5" class="text-center p-6 text-muted-foreground italic">Aucun taux configuré</td>
              </tr>
            </tbody>
          </table>
        </div>

      </main>
    </div>
  </div>

  <!-- Modal perdiem -->
  <ModalShell :open="showModal" :title="editingId ? 'Modifier le taux' : 'Nouveau taux perdiem'" max-width="max-w-[420px]" @close="showModal = false">
    <div :class="cls.field">
      <label :class="cls.fieldLabel">Catégorie *</label>
      <input type="text" :class="cls.fieldInput" v-model="pdForm.category" placeholder="Ex: Cadre supérieur" />
    </div>
    <div :class="cls.field">
      <label :class="cls.fieldLabel">Description</label>
      <input type="text" :class="cls.fieldInput" v-model="pdForm.description" placeholder="Ex: Direction / Cadres A — valeur provisoire" />
    </div>
    <div :class="cls.field">
      <label :class="cls.fieldLabel">Taux / jour *</label>
      <input type="number" min="0" :class="cls.fieldInput" v-model.number="pdForm.ratePerDay" />
    </div>
    <div :class="cls.field">
      <label :class="cls.fieldLabel">Devise</label>
      <select :class="cls.fieldSelect" v-model="pdForm.currency">
        <option value="MGA">MGA (Ariary)</option>
        <option value="MUR">MUR (Roupie mauricienne)</option>
        <option value="EUR">EUR (Euro)</option>
      </select>
    </div>
    <template #footer>
      <button :class="cls.btnOutline" @click="showModal = false">Annuler</button>
      <button :class="cls.btnPrimary" @click="savePerdiem">Enregistrer</button>
    </template>
  </ModalShell>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { Plus, TriangleAlert, Pencil, Trash2 } from 'lucide-vue-next'
import AppTopNav  from '../../components/AppTopNav.vue'
import AppSidebar from '../../components/AppSidebar.vue'
import ModalShell from '../../components/ui/ModalShell.vue'
import * as cls from '../../lib/formClasses'
import * as L from '../../lib/listClasses'
import { useAuthStore }     from '../../stores/auth'
import { useCalendarStore } from '../../stores/calendar'

const auth      = useAuthStore()
const calStore  = useCalendarStore()
const { calendar } = storeToRefs(calStore)

// ── Classes du design system ─────────────────────────────────
const thUpper = 'px-4 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-[0.05em] bg-background border-b border-border'
const tdCell = 'px-4 py-3 border-b border-border'
const iconBtn = 'w-7 h-7 flex items-center justify-center border-0 rounded-md bg-background text-muted-foreground cursor-pointer transition-colors hover:bg-primary/10 hover:text-primary'

const showModal  = ref(false)
const editingId  = ref<string | null>(null)
const pdForm     = reactive({ category: '', description: '', ratePerDay: 0, currency: 'MGA' })

function openAdd() {
  editingId.value      = null
  pdForm.category      = ''
  pdForm.description   = ''
  pdForm.ratePerDay    = 0
  pdForm.currency      = 'MGA'
  showModal.value      = true
}

function openEdit(id: string) {
  editingId.value = id
  const pd = (calendar.value.perdiemRates ?? []).find(r => r.id === id)
  if (pd) {
    pdForm.category    = pd.category
    pdForm.description = pd.description
    pdForm.ratePerDay  = pd.ratePerDay
    pdForm.currency    = pd.currency
  }
  showModal.value = true
}

function savePerdiem() {
  if (!pdForm.category.trim()) return
  if (editingId.value) {
    calStore.updatePerdiemRate(editingId.value, { category: pdForm.category, description: pdForm.description, ratePerDay: pdForm.ratePerDay, currency: pdForm.currency })
  } else {
    calStore.addPerdiemRate({ category: pdForm.category, description: pdForm.description, ratePerDay: pdForm.ratePerDay, currency: pdForm.currency })
  }
  showModal.value = false
}
</script>
