<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">

        <div class="page-header">
          <div>
            <div class="page-title">Mon Profil</div>
            <div class="page-sub">{{ employee?.jobTitle }} · {{ employee?.entityName }}</div>
          </div>
          <div class="header-actions">
            <button v-if="isHR" class="btn btn-outline">
              <i class="ti ti-file-export"></i> Exporter
            </button>
            <button class="btn btn-primary" @click="saveInfo">
              <i class="ti ti-device-floppy"></i> Enregistrer
            </button>
          </div>
        </div>

        <div class="profile-grid">

          <!-- ── Colonne gauche ── -->
          <div class="col-left">

            <!-- Avatar card -->
            <div class="card avatar-card">
              <div class="avatar-wrap">
                <div class="avatar-circle">
                  <span class="avatar-initials">{{ employee?.initials }}</span>
                </div>
                <button class="avatar-edit-btn">
                  <i class="ti ti-camera"></i>
                </button>
              </div>
              <div class="avatar-name">{{ employee?.name }}</div>
              <div class="avatar-code">{{ employee?.code }}</div>
              <StatusPill :status="employee?.status ?? 'active'" />
            </div>

            <!-- Soldes mini -->
            <div class="card">
              <div class="card-title"><i class="ti ti-chart-pie"></i> Soldes congés</div>
              <div class="balance-list">
                <div class="balance-item" v-for="b in myBalances" :key="b.label">
                  <div class="balance-top">
                    <span class="balance-label">{{ b.label }}</span>
                    <span class="balance-val">{{ b.remaining }}j</span>
                  </div>
                  <div class="balance-bar-bg">
                    <div class="balance-bar" :style="{ width: b.pct + '%', background: b.color }"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions rapides -->
            <div class="card">
              <div class="card-title"><i class="ti ti-bolt"></i> Actions rapides</div>
              <div class="quick-actions">
                <router-link :to="{ name: isHR ? 'rh' : 'employee-absences' }" class="quick-btn">
                  <i class="ti ti-calendar-plus"></i> Demande de congé
                </router-link>
                <router-link :to="{ name: isHR ? 'rh-missions' : 'employee-missions' }" class="quick-btn">
                  <i class="ti ti-plane"></i> Ordre de mission
                </router-link>
                <router-link :to="{ name: 'employee-planning' }" class="quick-btn">
                  <i class="ti ti-calendar"></i> Mon planning
                </router-link>
              </div>
            </div>

          </div>

          <!-- ── Colonne droite ── -->
          <div class="col-right">

            <!-- Infos personnelles (éditable) -->
            <div class="card">
              <div class="card-header">
                <div class="card-title"><i class="ti ti-user"></i> Informations personnelles</div>
              </div>
              <div class="form-grid">
                <div class="form-field">
                  <label class="field-label">Prénom</label>
                  <input v-model="form.firstName" class="field-input" type="text" />
                </div>
                <div class="form-field">
                  <label class="field-label">Nom</label>
                  <input v-model="form.lastName" class="field-input" type="text" />
                </div>
                <div class="form-field">
                  <label class="field-label">Email</label>
                  <input v-model="form.email" class="field-input" type="email" />
                </div>
                <div class="form-field">
                  <label class="field-label">Téléphone</label>
                  <input v-model="form.phone" class="field-input" type="tel" />
                </div>
              </div>
            </div>

            <!-- Infos professionnelles (lecture seule pour employé) -->
            <div class="card">
              <div class="card-header">
                <div class="card-title"><i class="ti ti-briefcase"></i> Informations professionnelles</div>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Matricule</span>
                  <span class="info-val">{{ employee?.code }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Poste</span>
                  <span class="info-val">{{ employee?.jobTitle }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Entité</span>
                  <span class="info-val">{{ employee?.entityName }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Type de contrat</span>
                  <span class="info-val">{{ employee?.contractType }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Date d'embauche</span>
                  <span class="info-val">{{ employee?.hireDate }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Rôle système</span>
                  <span class="info-val">{{ roleLabel }}</span>
                </div>
              </div>
            </div>

            <!-- Préférences -->
            <div class="card">
              <div class="card-header">
                <div class="card-title"><i class="ti ti-settings"></i> Préférences</div>
              </div>
              <div class="form-grid">
                <div class="form-field">
                  <label class="field-label">Langue</label>
                  <select v-model="form.lang" class="field-input">
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div class="form-field">
                  <label class="field-label">Notifications email</label>
                  <select v-model="form.emailNotifs" class="field-input">
                    <option value="all">Toutes</option>
                    <option value="important">Importantes uniquement</option>
                    <option value="none">Désactivées</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { AppSidebar, AppTopNav, StatusPill } from '../../components'
import { useAuthStore }    from '../../stores/auth'
import { useEmployeeStore } from '../../stores/employees'
import { useAbsenceStore }  from '../../stores/absences'
import { useRoute } from 'vue-router'

const auth         = useAuthStore()
const employeeStore = useEmployeeStore()
const absenceStore  = useAbsenceStore()
const route         = useRoute()

const isHR = computed(() => route.path.startsWith('/rh'))

const employee = computed(() => {
  return employeeStore.employees.find(e => e.id === auth.user?.id) ?? employeeStore.employees[0]
})

const form = reactive({
  firstName:    employee.value?.firstName ?? '',
  lastName:     employee.value?.lastName  ?? '',
  email:        employee.value?.email     ?? '',
  phone:        employee.value?.phone     ?? '',
  lang:         'fr',
  emailNotifs:  'all',
})

const roleLabel = computed(() => {
  const map: Record<string, string> = {
    hr_admin:    'RH Administrateur',
    hr_director: 'RH Directeur',
    validator:   'Manager / Validateur',
    employee:    'Employé',
  }
  return map[employee.value?.role ?? ''] ?? ''
})

const myBalances = computed(() => {
  const row = absenceStore.employeeBalances.find(b => b.employeeName === employee.value?.name)
  if (!row) return []
  return Object.entries(row.balances)
    .filter(([, b]) => b.total > 0)
    .slice(0, 4)
    .map(([type, b]) => {
      const pct   = b.total > 0 ? (b.remaining / b.total) * 100 : 0
      const color = pct > 50 ? 'var(--color-success)' : pct > 20 ? 'var(--color-warning)' : 'var(--color-danger)'
      return { label: type, remaining: b.remaining, pct, color }
    })
})

function saveInfo() {
  // In a real app, dispatch to store; here just UI feedback
}
</script>

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; padding: 24px 28px; background: var(--color-bg); overflow-y: auto; }

.page-header  { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; gap: 12px; flex-wrap: wrap; }
.page-title   { font-size: 20px; font-weight: 700; color: var(--color-text); }
.page-sub     { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
.header-actions { display: flex; gap: 8px; }

.btn { padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; transition: all .12s; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-primary-dark); }
.btn-outline { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg); }

.profile-grid { display: grid; grid-template-columns: 240px 1fr; gap: 16px; align-items: start; }
.col-left  { display: flex; flex-direction: column; gap: 14px; }
.col-right { display: flex; flex-direction: column; gap: 14px; }

.card { background: var(--color-surface); border: 0.5px solid var(--color-border); border-radius: 10px; padding: 16px; }
.card-header { margin-bottom: 14px; }
.card-title { font-size: 13px; font-weight: 600; color: var(--color-text); display: flex; align-items: center; gap: 6px; }
.card-title i { color: var(--color-primary); }

/* Avatar card */
.avatar-card { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; padding: 24px 16px; }
.avatar-wrap { position: relative; }
.avatar-circle { width: 80px; height: 80px; border-radius: 50%; background: var(--color-primary-light); display: flex; align-items: center; justify-content: center; }
.avatar-initials { font-size: 28px; font-weight: 700; color: var(--color-primary); }
.avatar-edit-btn { position: absolute; bottom: 0; right: 0; width: 26px; height: 26px; border-radius: 50%; background: var(--color-primary); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; }
.avatar-name { font-size: 15px; font-weight: 600; color: var(--color-text); }
.avatar-code { font-size: 12px; color: var(--color-text-muted); }

/* Balance mini */
.balance-list { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
.balance-item { display: flex; flex-direction: column; gap: 4px; }
.balance-top  { display: flex; justify-content: space-between; }
.balance-label { font-size: 11px; color: var(--color-text-muted); }
.balance-val   { font-size: 12px; font-weight: 600; color: var(--color-text); }
.balance-bar-bg { height: 4px; background: var(--color-border); border-radius: 2px; overflow: hidden; }
.balance-bar   { height: 100%; border-radius: 2px; transition: width .3s; }

/* Quick actions */
.quick-actions { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
.quick-btn { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; font-size: 13px; color: var(--color-text); text-decoration: none; background: var(--color-bg); border: 0.5px solid var(--color-border); transition: all .12s; }
.quick-btn:hover { background: var(--color-primary-light); color: var(--color-primary); }
.quick-btn i { font-size: 16px; }

/* Form */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-field { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 12px; font-weight: 500; color: var(--color-text-muted); }
.field-input { height: 36px; padding: 0 10px; border: 0.5px solid var(--color-border); border-radius: 6px; font-size: 13px; color: var(--color-text); background: var(--color-bg); outline: none; }
.field-input:focus { border-color: var(--color-primary); }

/* Info grid (read-only) */
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 4px; }
.info-item { display: flex; flex-direction: column; gap: 2px; }
.info-label { font-size: 11px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .04em; }
.info-val   { font-size: 13px; color: var(--color-text); }

@media (max-width: 900px) {
  .profile-grid { grid-template-columns: 1fr; }
  .form-grid, .info-grid { grid-template-columns: 1fr; }
  .content { padding: 16px; }
}
</style>
