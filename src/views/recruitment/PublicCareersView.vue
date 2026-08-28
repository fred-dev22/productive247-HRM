<template>
  <div class="min-h-screen bg-primary/10">
    <div class="bg-card border-b border-border px-6 py-8 flex flex-col items-center text-center">
      <img src="/galana.webp" alt="Galana" class="h-12 w-auto mb-4" />
      <h1 class="text-[22px] font-bold text-foreground">Rejoignez nos équipes</h1>
      <p class="text-[13px] text-muted-foreground mt-1 max-w-md">
        Découvrez les offres d'emploi actuellement ouvertes chez Galana et postulez en quelques clics.
      </p>
    </div>

    <div class="max-w-3xl mx-auto px-4 py-8">
      <div v-if="offers.length === 0" class="bg-card border border-dashed border-border rounded-xl p-10 text-center text-muted-foreground">
        <Briefcase class="w-8 h-8 mx-auto mb-2" />
        <p class="text-[13px]">Aucune offre n'est ouverte pour le moment. Revenez bientôt.</p>
      </div>

      <div v-else class="flex flex-col gap-3.5">
        <router-link
          v-for="offer in offers" :key="offer.id"
          :to="{ name: 'public-careers-offer', params: { id: offer.id } }"
          class="block bg-card border border-border rounded-xl p-5 no-underline text-inherit transition-shadow hover:shadow-[0_2px_16px_rgba(0,0,0,0.08)]"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 class="text-[15px] font-semibold text-foreground truncate">{{ offer.title }}</h2>
              <p class="text-[12px] text-muted-foreground mt-0.5">{{ offer.entityName }} · {{ offer.location }}</p>
            </div>
            <span class="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary whitespace-nowrap">{{ offer.contractType }}</span>
          </div>
          <p class="text-[13px] text-foreground mt-3 line-clamp-2">{{ offer.description }}</p>
          <div class="flex items-center gap-1 text-[13px] font-medium text-primary mt-3">
            Voir l'offre et postuler <ArrowRight class="w-3.5 h-3.5" />
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Portail carriere public (sans connexion, voir router/index.ts : ni
 * requiresAuth ni layout dashboard). Liste uniquement les offres au statut
 * Published — les autres statuts ne sont pas destines a un visiteur externe.
 * Design uniquement (donnees fictives, voir src/stores/recruitment), meme
 * pattern visuel que LoginView.vue / PublicApprovalView.vue (fond
 * bg-primary/10, logo Galana) pour rester coherent avec les autres pages
 * publiques deja dans l'app.
 */
import { computed } from 'vue'
import { Briefcase, ArrowRight } from 'lucide-vue-next'
import { useJobOfferStore } from '../../stores/recruitment'

const jobOfferStore = useJobOfferStore()
const offers = computed(() => jobOfferStore.published)
</script>
