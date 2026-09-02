# Validation du verrouillage de commande

La page `/commander` affiche un bouton de validation désactivé lorsque la session client est absente ou en cours de chargement. Un encart visible propose « Se connecter ou créer un compte » et redirige vers `/connexion`.

La page `/connexion` présente séparément la connexion et la création de compte. Le compte client est le préalable permettant ensuite d’accéder à l’espace personnel et de commander. Le code postal de l’inscription est explicitement facultatif.

Contrôle desktop réalisé le 27 août 2026 à 1280 × 720. Les tests serveur couvrent le refus de `publicOrders.submit` et de `customer.createOrder` sans session, ainsi que la création valide avec une session client.
