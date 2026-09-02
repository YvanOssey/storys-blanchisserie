# Validation visuelle finale — parcours `/commander`

Date : 27 août 2026.

La capture desktop (1280 × 720) confirme l’affichage Story’s, la progression en trois étapes, la hiérarchie du formulaire et le libellé explicite « Code postal (facultatif) ». La capture mobile (375 × 812) confirme l’adaptation responsive de la présentation et la lisibilité des informations de service ; le formulaire se poursuit sous le panneau introductif sans débordement horizontal observé.

Les validations fonctionnelles associées sont passées avec 20 tests Vitest, `pnpm check` et `pnpm build`. Le parcours de soumission reste réservé à une session client authentifiée ; le serveur refuse les visiteurs anonymes. Le scénario client connecté avec commande valide sans code postal est couvert explicitement dans `server/laundry.test.ts`.
