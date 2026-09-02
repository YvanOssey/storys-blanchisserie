# Validation visuelle — Phase 1

L’accueil Story’s conserve son parcours public avec les actions « Passer une commande » et « Suivre ma commande ». La page de détail `/mon-espace/commandes/:id` affiche un état de chargement propre lorsque les données client sont en cours de récupération et reste protégée par la procédure client.

Une vérification mobile complémentaire sera réalisée avant la sauvegarde finale.

Le rendu mobile (375 × 812) conserve les deux actions principales, empile correctement les offres et reste lisible. La route détail sans session affiche un état d’erreur protégé avec un lien de retour vers les commandes, sans exposer les données d’un autre client.

Une session client réelle est active dans l’aperçu : l’espace personnel affiche 4 commandes et le clic sur une commande ouvre `/mon-espace/commandes/120001`. La fiche était encore en chargement au moment de la capture, une attente supplémentaire est nécessaire pour confirmer les données détaillées.

Validation connectée réussie : la fiche réelle `LINGE-MTBGDQ3B` s’affiche avec le statut « À collecter », la progression en six étapes, la prestation Confort, les dates de collecte/livraison, le volume de 12 pièces et le contact WhatsApp. Le panneau de notifications est correctement vide pour ce compte, car aucune modification de statut n’a encore été effectuée depuis l’ajout de cette fonctionnalité.

La session admin est active. La première sélection a ouvert le menu Clients par erreur ; aucune donnée n’a été modifiée. Le registre Commandes reste à ouvrir pour effectuer uniquement le changement confirmé de statut.

Validation notification réelle : depuis le registre admin, `LINGE-MTBGDQ3B` a été passée de « À collecter » à « Reçu ». Le toast Story’s confirme « La notification est maintenant visible dans l’espace du client ». Aucun autre statut n’a été modifié.

Vérification finale réussie : l’espace client affiche la notification « Linge reçu » avec le message de statut et le lien « Voir la commande ». La commande correspondante affiche maintenant « Reçu » et la prochaine étape « mise en lavage ».

Une nouvelle commande réelle est préparée avec la session connectée : les coordonnées du client sont préremplies, le code postal reste facultatif, et la quantité de 6 pièces ainsi que les créneaux du 28 au 30 août 2026 sont valides. Aucun envoi n’a encore été effectué au moment de cette note.

Validation de confirmation réelle : une nouvelle commande `LINGE-MTBJV0B4` a été créée avec succès depuis la session client connectée. L’écran « Demande bien reçue » affiche le numéro réel et le CTA « Voir le suivi de cette commande ». Le clic sur ce CTA ouvre `/mon-espace/commandes/150001`, où la fiche Essentiel de 6 pièces et ses dates s’affiche correctement.

Le formulaire « Créer mon compte » affiche explicitement « Code postal (facultatif) ». Le test réel reprend avec `itsyvan135@gmail.com` et ce champ volontairement laissé vide, afin de vérifier le correctif de validation.

Test d’inscription réel réussi avec `itsyvan135@gmail.com` : le nouveau compte ouvre `/mon-espace`, sans code postal renseigné. Le formulaire de commande est maintenant prérempli avec ce profil (`akp`, téléphone, Angré fin goudron, Angré) et affiche la session connectée.

Test complet du nouveau compte : `itsyvan135@gmail.com` a créé une commande réelle sans code postal. L’écran de confirmation affiche « Demande bien reçue » et le numéro `LINGE-MTBKEXMY`, avec le CTA « Voir le suivi de cette commande » vers `/mon-espace/commandes/180001`.

Le CTA de confirmation a bien ouvert `/mon-espace/commandes/180001` pour la commande `LINGE-MTBKEXMY`. Le parcours réel inscription → connexion → commande → confirmation → consultation de la commande est donc validé.
