# Validation du bouton de suivi

Le 27 août 2026, l’accueil public a été ouvert sans session client. Le bouton « Suivre ma commande » exposait `/connexion` comme destination et un clic réel a navigué vers `/connexion`.

La destination est désormais calculée avec `getCustomerTrackingPath`: un visiteur est envoyé vers `/connexion`, tandis qu’un client authentifié est envoyé vers `/mon-espace`. La page `/mon-espace` charge les commandes du client connecté, affiche le nombre de commandes, leur statut, la prochaine étape et une frise des six statuts.

La logique de destination est couverte par un test Vitest dédié.

## Confirmation utilisateur

L’utilisateur a confirmé que le parcours connecté fonctionne : après connexion, le bouton « Suivre ma commande » ouvre l’espace personnel de suivi.
