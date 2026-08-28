<template>
  <div class="min-h-screen bg-primary/10 flex flex-col items-center py-10 px-4">
    <img src="/galana.webp" alt="Galana" class="h-12 w-auto mb-6" />

    <!-- Offre introuvable / non publiee -->
    <div v-if="!offer" class="bg-card rounded-xl p-8 w-full max-w-[520px] shadow-[0_2px_16px_rgba(0,0,0,0.08)] text-center">
      <div class="flex justify-center mb-4">
        <div class="w-14 h-14 rounded-full bg-danger-bg flex items-center justify-center">
          <CircleAlert class="w-7 h-7 text-danger" />
        </div>
      </div>
      <h1 class="text-[18px] font-bold text-foreground mb-2">Offre introuvable</h1>
      <p class="text-[13px] text-muted-foreground mb-5">Cette offre n'existe plus ou n'est plus ouverte aux candidatures.</p>
      <router-link :to="{ name: 'public-careers' }" class="text-[13px] font-medium text-primary no-underline hover:underline">← Voir toutes les offres</router-link>
    </div>

    <!-- Candidature envoyee -->
    <div v-else-if="done" class="bg-card rounded-xl p-8 w-full max-w-[520px] shadow-[0_2px_16px_rgba(0,0,0,0.08)] text-center">
      <div class="flex justify-center mb-4">
        <div class="w-14 h-14 rounded-full bg-success-bg flex items-center justify-center">
          <CheckCircle2 class="w-7 h-7 text-success" />
        </div>
      </div>
      <h1 class="text-[18px] font-bold text-foreground mb-2">Candidature envoyée</h1>
      <p class="text-[13px] text-muted-foreground mb-5">
        Merci {{ form.candidateName }}, votre candidature pour <strong class="text-foreground">{{ offer.title }}</strong> a bien été reçue.
        Notre équipe recrutement reviendra vers vous si votre profil correspond.
      </p>
      <router-link :to="{ name: 'public-careers' }" class="text-[13px] font-medium text-primary no-underline hover:underline">← Voir toutes les offres</router-link>
    </div>

    <!-- Offre + formulaire -->
    <div v-else class="w-full max-w-[560px] flex flex-col gap-4">
      <router-link :to="{ name: 'public-careers' }" class="text-[13px] font-medium text-primary no-underline hover:underline self-start">← Voir toutes les offres</router-link>

      <div class="bg-card rounded-xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
        <div class="flex items-start justify-between gap-3">
          <h1 class="text-[19px] font-bold text-foreground">{{ offer.title }}</h1>
          <span class="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary whitespace-nowrap">{{ offer.contractType }}</span>
        </div>
        <p class="text-[13px] text-muted-foreground mt-1">{{ offer.entityName }} · {{ offer.location }}</p>
        <p class="text-[13px] text-foreground whitespace-pre-line mt-4">{{ offer.description }}</p>
      </div>

      <div class="bg-card rounded-xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
        <h2 class="text-[15px] font-semibold text-foreground mb-4">Postuler à cette offre</h2>

        <div class="flex flex-col gap-3.5">
          <div>
            <label :class="labelClass">Nom complet <span class="text-danger">*</span></label>
            <input v-model="form.candidateName" :class="inputClass" placeholder="Prénom et nom" />
          </div>
          <div>
            <label :class="labelClass">Email <span class="text-danger">*</span></label>
            <input v-model="form.candidateEmail" type="email" :class="inputClass" placeholder="vous@exemple.com" />
          </div>
          <div>
            <label :class="labelClass">Téléphone <span class="text-danger">*</span></label>
            <input v-model="form.candidatePhone" :class="inputClass" placeholder="034 00 000 00" />
          </div>
          <div>
            <label :class="labelClass">CV <span class="text-danger">*</span></label>
            <input type="file" accept=".pdf,.doc,.docx" class="text-[13px] text-foreground" @change="onFileChange" />
            <p class="text-[11px] text-muted-foreground mt-1">Formats acceptés : PDF, Word.</p>
          </div>
        </div>

        <p v-if="error" class="text-xs text-danger bg-danger-bg px-3 py-2 rounded-md mt-4">{{ error }}</p>

        <button
          class="w-full h-12 bg-primary text-primary-foreground rounded-lg text-sm font-semibold cursor-pointer transition-colors hover:bg-primary/90 mt-5"
          @click="submit"
        >
          Envoyer ma candidature
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Fiche d'une offre + formulaire de candidature, portail carriere public
 * (sans connexion, voir router/index.ts). N'affiche l'offre que si elle est
 * au statut Published — memes raisons que PublicCareersView.vue. Design
 * uniquement : le depot de CV ne fait que retenir le nom du fichier
 * (applicationStore.apply), pas d'upload reel (pas de backend sur ce
 * module).
 */
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { CircleAlert, CheckCircle2 } from 'lucide-vue-next'
import { useJobOfferStore, useApplicationStore } from '../../stores/recruitment'

const route = useRoute()
const jobOfferStore = useJobOfferStore()
const applicationStore = useApplicationStore()

const offer = computed(() => jobOfferStore.items.find(o => o.id === route.params.id && o.status === 'Published') ?? null)

const labelClass = 'block text-[13px] font-medium text-foreground mb-1.5'
const inputClass = 'w-full h-11 px-3 border border-border rounded-lg text-sm bg-background text-foreground outline-none transition-colors focus:border-primary'

const form = reactive({ candidateName: '', candidateEmail: '', candidatePhone: '', cvFileName: '' })
const error = ref('')
const done = ref(false)

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  form.cvFileName = file?.name ?? ''
}

function submit() {
  if (!form.candidateName.trim() || !form.candidateEmail.trim() || !form.candidatePhone.trim()) {
    error.value = 'Merci de remplir tous les champs obligatoires.'
    return
  }
  if (!form.cvFileName) {
    error.value = 'Merci de joindre votre CV.'
    return
  }
  if (!offer.value) return
  error.value = ''
  applicationStore.apply({
    jobOfferId: offer.value.id, jobOfferTitle: offer.value.title,
    candidateName: form.candidateName.trim(), candidateEmail: form.candidateEmail.trim(),
    candidatePhone: form.candidatePhone.trim(), cvFileName: form.cvFileName,
  })
  done.value = true
}
</script>
