<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal-card">

        <div class="modal-header">
          <span class="modal-title">{{ isEdit ? 'Modifier le type' : 'Nouveau type d\'absence' }}</span>
          <button class="modal-close" @click="close"><i class="ti ti-x"></i></button>
        </div>

        <div class="modal-body">

          <div class="field-row">
            <div class="field">
              <label class="field-label">Nom *</label>
              <input v-model="form.name" class="field-input" placeholder="ex: Congé sans solde" @input="autoCode" />
              <div v-if="errors.name" class="field-error">{{ errors.name }}</div>
            </div>
            <div class="field">
              <label class="field-label">Code *</label>
              <input v-model="form.code" class="field-input" style="text-transform:uppercase" placeholder="ex: UNPAID" />
              <div v-if="errors.code" class="field-error">{{ errors.code }}</div>
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label class="field-label">Jours alloués / an</label>
              <input type="number" min="0" v-model.number="form.daysPerYear" class="field-input" />
            </div>
            <div class="field">
              <label class="field-label">Accumulation mensuelle (j/mois)</label>
              <input type="number" min="0" step="0.5" v-model.number="form.daysPerMonth" class="field-input" />
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label class="field-label">Préavis minimum (jours)</label>
              <input type="number" min="0" v-model.number="form.noticeDays" class="field-input" />
            </div>
            <div class="field">
              <label class="field-label">Workflow</label>
              <select v-model="form.workflow" class="field-input">
                <option value="standard">Standard (approbation)</option>
                <option value="medical">Médical (enregistrement)</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label class="field-label">Couleur dans le calendrier</label>
            <div class="color-grid">
              <button
                v-for="c in COLOR_OPTIONS" :key="c"
                type="button"
                class="color-swatch"
                :style="{ background: c }"
                :class="{ selected: form.color === c }"
                @click="form.color = c"
              >
                <i v-if="form.color === c" class="ti ti-check" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <div class="field">
            <label class="field-label">Icône</label>
            <div class="icon-grid">
              <button
                v-for="ic in ICON_OPTIONS" :key="ic"
                type="button"
                class="icon-swatch"
                :class="{ selected: form.icon === ic }"
                @click="form.icon = ic"
              >
                <i :class="`ti ${ic}`" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <div class="toggle-row">
            <span class="field-label">Justificatif obligatoire</span>
            <label class="toggle-wrap">
              <input type="checkbox" class="toggle-input" v-model="form.requiresDocument" />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>

        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" @click="close">Annuler</button>
          <button class="btn btn-primary" @click="handleSave">
            <i class="ti ti-check" aria-hidden="true"></i>
            {{ isEdit ? 'Enregistrer' : 'Ajouter' }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import type { LeaveTypeConfig } from '../../stores/leaveTypes'

const props = defineProps<{
  modelValue: boolean
  editId?:    string
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  'saved': []
}>()

const store  = useLeaveTypesStore()
const isEdit = computed(() => !!props.editId)

const COLOR_OPTIONS = [
  '#006B3C','#C8102E','#993556','#185FA5',
  '#854F0B','#8A5A0A','#2D7A3F','#5C3B8A',
]
const ICON_OPTIONS = [
  'ti-calendar','ti-stethoscope','ti-heart','ti-clock-hour-3',
  'ti-users','ti-star','ti-home-2','ti-briefcase',
  'ti-beach','ti-baby-carriage','ti-globe','ti-sun',
]

const form = reactive({
  name:             '',
  code:             '',
  daysPerYear:      0,
  daysPerMonth:     undefined as number | undefined,
  noticeDays:       0,
  requiresDocument: false,
  workflow:         'standard' as 'standard' | 'medical',
  isActive:         true,
  isSystem:         false,
  color:            '#006B3C',
  icon:             'ti-calendar',
})

const errors = reactive({ name: '', code: '' })

function autoCode() {
  if (!isEdit.value) {
    form.code = form.name
      .toUpperCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Z0-9]/g, '_')
      .slice(0, 12)
  }
}

function populate() {
  if (isEdit.value && props.editId) {
    const lt = store.leaveTypes.find(l => l.id === props.editId)
    if (lt) {
      form.name             = lt.name
      form.code             = lt.code
      form.daysPerYear      = lt.daysPerYear
      form.daysPerMonth     = lt.daysPerMonth
      form.noticeDays       = lt.noticeDays
      form.requiresDocument = lt.requiresDocument
      form.workflow         = lt.workflow
      form.isActive         = lt.isActive
      form.isSystem         = lt.isSystem
      form.color            = lt.color
      form.icon             = lt.icon
    }
  } else {
    Object.assign(form, {
      name:'', code:'', daysPerYear:0, daysPerMonth:undefined,
      noticeDays:0, requiresDocument:false, workflow:'standard',
      isActive:true, isSystem:false, color:'#006B3C', icon:'ti-calendar',
    })
  }
  errors.name = ''
  errors.code = ''
}

watch(() => props.modelValue, v => { if (v) populate() })

function validate(): boolean {
  errors.name = ''
  errors.code = ''
  let ok = true
  if (!form.name.trim()) { errors.name = 'Nom requis'; ok = false }
  if (!form.code.trim()) { errors.code = 'Code requis'; ok = false }
  return ok
}

function close() { emit('update:modelValue', false) }

function handleSave() {
  if (!validate()) return
  const payload: Omit<LeaveTypeConfig, 'id'> = {
    name:             form.name,
    code:             form.code.toUpperCase(),
    daysPerYear:      form.daysPerYear,
    daysPerMonth:     form.daysPerMonth,
    noticeDays:       form.noticeDays,
    requiresDocument: form.requiresDocument,
    workflow:         form.workflow,
    isActive:         form.isActive,
    isSystem:         form.isSystem,
    color:            form.color,
    icon:             form.icon,
  }
  if (isEdit.value && props.editId) {
    store.updateLeaveType(props.editId, payload)
  } else {
    store.addLeaveType(payload)
  }
  emit('saved')
  close()
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card    { background: var(--color-surface); border-radius: 12px; padding: 24px; max-width: 500px; width: 95%; box-shadow: 0 8px 32px rgba(0,0,0,.18); max-height: 90vh; overflow-y: auto; }
.modal-header  { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.modal-title   { font-size: 15px; font-weight: 600; color: var(--color-text); }
.modal-close   { width: 28px; height: 28px; border: none; background: var(--color-bg); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-size: 14px; }
.modal-close:hover { background: var(--color-border); }
.modal-body    { display: flex; flex-direction: column; gap: 14px; }
.modal-footer  { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 0.5px solid var(--color-border); }

.field      { display: flex; flex-direction: column; gap: 4px; }
.field-row  { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field-label { font-size: 12px; font-weight: 500; color: var(--color-text); }
.field-input { height: 38px; padding: 0 10px; border: 0.5px solid var(--color-border); border-radius: 6px; background: var(--color-bg); font-size: 13px; color: var(--color-text); outline: none; width: 100%; box-sizing: border-box; }
.field-input:focus { border-color: var(--color-primary); }
.field-error { font-size: 11px; color: var(--color-danger); }

.color-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.color-swatch {
  width: 32px; height: 32px; border-radius: 6px; border: 2px solid transparent;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: transform .1s;
}
.color-swatch.selected { border-color: var(--color-text); transform: scale(1.1); }
.color-swatch i { color: #fff; font-size: 14px; }

.icon-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.icon-swatch {
  width: 36px; height: 36px; border-radius: 6px;
  border: 0.5px solid var(--color-border);
  background: var(--color-bg); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: var(--color-text-muted);
  transition: all .1s;
}
.icon-swatch.selected { background: var(--color-primary-light); color: var(--color-primary); border-color: var(--color-primary); }
.icon-swatch:hover:not(.selected) { background: var(--color-surface); color: var(--color-text); }

.toggle-row { display: flex; align-items: center; justify-content: space-between; }
.toggle-wrap  { position: relative; display: inline-flex; align-items: center; }
.toggle-input { position: absolute; opacity: 0; width: 0; height: 0; }
.toggle-track { width: 36px; height: 20px; background: var(--color-border-strong); border-radius: 10px; position: relative; cursor: pointer; transition: background .2s; }
.toggle-input:checked + .toggle-track { background: var(--color-primary); }
.toggle-thumb { position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; background: #fff; border-radius: 50%; transition: left .2s; box-shadow: 0 1px 3px rgba(0,0,0,.25); }
.toggle-input:checked + .toggle-track .toggle-thumb { left: 19px; }

.btn { padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; transition: all .12s; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { opacity: .88; }
.btn-outline { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg); }

@media (max-width: 500px) { .field-row { grid-template-columns: 1fr; } }
</style>
