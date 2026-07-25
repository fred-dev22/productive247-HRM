import { useToastStore } from '../stores/toast'

// Enrobe un appel backend : affiche le snackbar pendant l'attente, bascule
// sur un message d'erreur simple si l'API échoue. Dès que la réponse arrive,
// le résultat est rendu à l'appelant IMMÉDIATEMENT (rien n'attend le
// snackbar) — seul l'affichage visuel de la barre s'attarde SUCCESS_HOLD_MS
// de plus en arrière-plan (le temps d'être lue même sur un appel quasi
// instantané), sans retarder la fermeture du popup ni la mise à jour de la
// liste. getErrorMessage est appelé APRÈS le catch interne de l'appelant
// (donc après que error.value a été renseigné côté store) pour réutiliser
// son message.
const SUCCESS_HOLD_MS = 1500

export async function withToast<T>(
  loadingMessage: string,
  action: () => Promise<T>,
  getErrorMessage: () => string,
): Promise<T> {
  const toast = useToastStore()
  toast.loading(loadingMessage)
  try {
    const result = await action()
    toast.hideAfter(SUCCESS_HOLD_MS)
    return result
  } catch (err) {
    toast.error(getErrorMessage())
    throw err
  }
}
