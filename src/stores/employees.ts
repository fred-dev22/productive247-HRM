import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Employee, EmployeeStatus, ContractType, UserRole } from '../types'

const PALETTE = [
  { bg: '#B5D4F4', text: '#0C447C' },
  { bg: '#C0DD97', text: '#3B6D11' },
  { bg: '#F4C0D1', text: '#72243E' },
  { bg: '#FAC775', text: '#633806' },
  { bg: '#AFA9EC', text: '#3C3489' },
  { bg: '#B8E8D8', text: '#1A6B4B' },
  { bg: '#FAD9B0', text: '#7A3B09' },
]

function p(i: number) { return PALETTE[i % PALETTE.length]! }

function mk(
  id: string, code: string,
  firstName: string, lastName: string,
  role: UserRole, jobTitle: string,
  entityId: string | null, entityName: string,
  contractType: ContractType, hireDate: string,
  status: EmployeeStatus, pi: number,
  email?: string, phone?: string, managerId?: string,
): Employee {
  return {
    id, code, firstName, lastName,
    name: `${firstName} ${lastName}`,
    initials: (firstName.charAt(0) + lastName.charAt(0)).toUpperCase(),
    avatarBg: p(pi).bg, avatarText: p(pi).text,
    role, jobTitle, entityId, entityName,
    contractType, hireDate, status,
    email, phone, managerId,
  }
}

export const useEmployeeStore = defineStore('employees', () => {
  const employees = ref<Employee[]>([
    mk('emp-001','EMP001','Gary','Ellis',       'hr_director','Directeur Général',            'e1','Direction Générale',             'CDI','2018-01-02','active',0,'g.ellis@galana.com',    '+230 501 0001'),
    mk('emp-002','EMP002','Sonia','Boodhun',    'hr_admin',   'DRH',                          'e2','Direction RH',                   'CDI','2019-03-15','active',1,'s.boodhun@galana.com', '+230 501 0002','emp-001'),
    mk('emp-003','EMP003','Ravi','Nundlall',    'validator',  'Resp. Administration Personnel','e3','Service Admin. Personnel',       'CDI','2020-06-01','active',2,'r.nundlall@galana.com','+230 501 0003','emp-002'),
    mk('emp-004','EMP004','Priya','Ramlugun',   'validator',  'Resp. Formation & Développement','e4','Service Formation',            'CDI','2020-09-01','active',3,'p.ramlugun@galana.com','+230 501 0004','emp-002'),
    mk('emp-005','EMP005','Ravi','Dhondoo',     'hr_admin',   'Directeur Administratif & Financier','e5','Direction Administrative & Financière','CDI','2018-04-01','active',4,'r.dhondoo@galana.com', '+230 501 0005','emp-001'),
    mk('emp-006','EMP006','Jean-Claude','Rakotomalala','validator','Chef Comptable',           'e6','Service Comptabilité',          'CDI','2019-07-15','active',5,'jc.rakotomalala@galana.com','+230 501 0006','emp-005'),
    mk('emp-007','EMP007','Hery','Andrianaivo', 'validator',  'Contrôleur de Gestion',        'e7','Service Contrôle de Gestion',   'CDI','2021-01-10','active',6,'h.andrianaivo@galana.com','+230 501 0007','emp-005'),
    mk('emp-008','EMP008','Kumar','Gunness',    'validator',  'Directeur des Opérations',     'e8','Direction des Opérations',      'CDI','2017-11-01','active',0,'k.gunness@galana.com',  '+230 501 0008','emp-001'),
    mk('emp-009','EMP009','Morad','Cassam',     'validator',  'Responsable Terminal',         'e9','Service Terminal Pétrolier',    'CDI','2019-02-01','active',1,'m.cassam@galana.com',   '+230 501 0009','emp-008'),
    mk('emp-010','EMP010','Thierry','Randriamanga','validator','Responsable Raffinerie',       'e10','Service Raffinerie',          'CDI','2020-03-01','active',2,'t.randriamanga@galana.com','+230 501 0010','emp-008'),
    mk('emp-011','EMP011','Fiona','Mungroo',    'validator',  'Responsable Logistique',       'e11','Service Logistique & Transport','CDI','2020-07-01','active',3,'f.mungroo@galana.com',  '+230 501 0011','emp-008'),
    mk('emp-012','EMP012','Nadia','Oozeer',     'hr_admin',   'Directrice Commerciale',       'e12','Direction Commerciale',        'CDI','2018-09-01','active',4,'n.oozeer@galana.com',   '+230 501 0012','emp-001'),
    mk('emp-013','EMP013','Ashvin','Pertab',    'validator',  'Responsable Stations-Service', 'e13','Service Stations-Service',     'CDI','2021-05-01','active',5,'a.pertab@galana.com',   '+230 501 0013','emp-012'),
    mk('emp-014','EMP014','Patrick','Boulle',   'hr_admin',   'Directeur Technique & HSE',    'e14','Direction Technique & HSE',    'CDI','2019-01-15','active',6,'p.boulle@galana.com',   '+230 501 0014','emp-001'),
    mk('emp-015','EMP015','Marie-France','Leclézio','validator','Directrice Juridique',       'e15','Direction Juridique',          'CDI','2022-04-01','active',0,'mf.leclezio@galana.com','+230 501 0015','emp-001'),
    mk('emp-016','EMP016','Aminata','Diallo',   'employee',   'Assistante RH',                'e3','Service Admin. Personnel',      'CDI','2022-09-01','active',1,'a.diallo@galana.com',   '+230 501 0016','emp-003'),
    mk('emp-017','EMP017','Kofi','Mensah',      'employee',   'Technicien Terminal',          'e9','Service Terminal Pétrolier',    'CDD','2023-01-15','active',2,'k.mensah@galana.com',   '+230 501 0017','emp-009'),
    mk('emp-018','EMP018','Fatou','Sow',        'employee',   'Comptable Auxiliaire',         'e6','Service Comptabilité',          'CDI','2022-06-01','active',3,'f.sow@galana.com',      '+230 501 0018','emp-006'),
    mk('emp-019','EMP019','Jean-Pierre','Mvondo','employee',  'Technicien Terminal',          'e9','Service Terminal Pétrolier',    'CDI','2021-11-01','active',4,'jp.mvondo@galana.com',  '+230 501 0019','emp-009'),
    mk('emp-020','EMP020','Rose','Nkeng',       'employee',   'Chargée Formation',            'e4','Service Formation',             'CDI','2023-03-01','onleave',5,'r.nkeng@galana.com',   '+230 501 0020','emp-004'),
    mk('emp-021','EMP021','Ibrahim','Touré',    'employee',   'Agent Logistique',             'e11','Service Logistique & Transport','CDD','2023-06-01','active',6,'i.toure@galana.com',   '+230 501 0021','emp-011'),
    mk('emp-022','EMP022','Nadia','Eze',        'employee',   'Analyste Financier',           'e5','Direction Administrative & Financière','CDI','2022-02-14','active',0,'n.eze@galana.com','+230 501 0022','emp-005'),
    mk('emp-023','EMP023','Samuel','Osei',      'employee',   'Technicien Logistique',        'e11','Service Logistique & Transport','CDI','2021-08-01','active',1,'s.osei@galana.com',    '+230 501 0023','emp-011'),
    mk('emp-024','EMP024','Mariama','Bah',      'employee',   'Assistante Formation',         'e4','Service Formation',             'Stage','2025-09-01','trial',2,'m.bah@galana.com',     '+230 501 0024','emp-004'),
    mk('emp-025','EMP025','Thierno','Baldé',    'employee',   'Commercial',                   'e12','Direction Commerciale',        'CDD','2024-01-10','active',3,'t.balde@galana.com',    '+230 501 0025','emp-012'),
    mk('emp-026','EMP026','David','Djouboui',   'hr_admin',   'Administrateur RH',            'e2','Direction RH',                  'CDI','2021-04-01','active',4,'d.djouboui@galana.com', '+230 501 0026','emp-002'),
  ])

  const activeEmployees   = computed(() => employees.value.filter(e => e.status === 'active'))
  const trialEmployees    = computed(() => employees.value.filter(e => e.status === 'trial'))
  const validatorEmployees = computed(() => employees.value.filter(e => e.role === 'validator' || e.role === 'hr_admin' || e.role === 'hr_director'))

  const nextCode = computed(() => {
    const max = employees.value.reduce((m, e) => {
      const n = parseInt(e.code.replace('EMP', '')) || 0
      return n > m ? n : m
    }, 0)
    return `EMP${String(max + 1).padStart(3, '0')}`
  })

  function getById(id: string): Employee | undefined {
    return employees.value.find(e => e.id === id)
  }

  function getByEntityId(entityId: string): Employee[] {
    return employees.value.filter(e => e.entityId === entityId)
  }

  function createEmployee(payload: Omit<Employee, 'id' | 'code' | 'name' | 'initials' | 'avatarBg' | 'avatarText'>) {
    const pi = employees.value.length % PALETTE.length
    const emp: Employee = {
      ...payload,
      id:         `emp-${Date.now()}`,
      code:       nextCode.value,
      name:       `${payload.firstName} ${payload.lastName}`,
      initials:   (payload.firstName.charAt(0) + payload.lastName.charAt(0)).toUpperCase(),
      avatarBg:   p(pi).bg,
      avatarText: p(pi).text,
    }
    employees.value.push(emp)
    return emp
  }

  function updateEmployee(id: string, payload: Partial<Employee>) {
    const idx = employees.value.findIndex(e => e.id === id)
    if (idx !== -1) {
      const emp = employees.value[idx]!
      const updated: Employee = { ...emp, ...payload }
      if (payload.firstName || payload.lastName) {
        updated.name     = `${updated.firstName} ${updated.lastName}`
        updated.initials = (updated.firstName.charAt(0) + updated.lastName.charAt(0)).toUpperCase()
      }
      employees.value[idx] = updated
    }
  }

  return {
    employees, activeEmployees, trialEmployees, validatorEmployees, nextCode,
    getById, getByEntityId, createEmployee, updateEmployee,
  }
})
