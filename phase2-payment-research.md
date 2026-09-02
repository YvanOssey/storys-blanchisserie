# Cadrage Phase 2 — Paiements Story’s

## Recommandation

Pour Story’s, basée en Côte d’Ivoire, CinetPay est le choix initial le plus cohérent : sa page officielle mentionne explicitement Orange Money Côte d’Ivoire, MTN Money Côte d’Ivoire, Moov Money Côte d’Ivoire, Wave Côte d’Ivoire ainsi que Visa et Mastercard. Son offre propose une Checkout API, une API directe et des options d’intégration adaptées à une application web.

Stripe indique la Côte d’Ivoire comme « Réseau étendu » sur sa page de disponibilité mondiale. Cette mention ne constitue pas, à elle seule, une confirmation que toutes les fonctionnalités et tous les moyens de paiement nécessaires à Story’s sont disponibles dans les mêmes conditions qu’un pays Stripe pleinement supporté. Stripe ne répond donc pas au besoin prioritaire de Mobile Money local sans vérification commerciale supplémentaire.

## Décision de cadrage proposée

Commencer par **CinetPay Checkout API** pour accepter Mobile Money et carte bancaire via une page de paiement hébergée ou intégrée, puis enregistrer côté serveur la référence de transaction et le statut confirmé après vérification serveur. Les clés privées ne devront jamais être exposées dans le navigateur. Le parcours devra conserver une commande en attente tant que CinetPay n’a pas confirmé le paiement.

## Sources officielles consultées

1. Stripe, « Disponibilité mondiale de Stripe » : https://stripe.com/fr/global
2. CinetPay, « Your all-in-one payment solution for Africa » : https://cinetpay.com/products/payments
3. Documentation CinetPay Checkout API référencée par la page officielle : https://docs.cinetpay.com/api/1.0-fr/introduction/overview

## Pré-requis bloquants pour une intégration réelle

L’intégration CinetPay nécessitera les identifiants fournis par le compte marchand Story’s, notamment l’API key et le site ID, ainsi que la validation du compte marchand/KYC par CinetPay. Tant que ces éléments ne sont pas disponibles, l’interface et le modèle de suivi peuvent être préparés, mais aucun paiement réel ne doit être simulé ou marqué comme confirmé.
# Cadrage Phase 2 — Paiements Story’s

## Recommandation
Pour Story’s en Côte d’Ivoire, CinetPay est le choix initial le plus cohérent : sa page officielle mentionne Orange Money, MTN Money, Moov Money et Wave Côte d’Ivoire, ainsi que Visa et Mastercard. Elle référence une Checkout API et une API directe adaptées à une application web.

Stripe affiche la Côte d’Ivoire comme « Réseau étendu » sur sa page de disponibilité mondiale. Cette mention ne confirme pas à elle seule que toutes les fonctionnalités utiles sont disponibles dans les mêmes conditions qu’un pays pleinement supporté, et Stripe ne couvre pas directement le besoin prioritaire de Mobile Money local sans vérification supplémentaire.

## Décision proposée
Commencer par **CinetPay Checkout API** : le client paie via Mobile Money ou carte, l’application enregistre une transaction en attente, puis le serveur vérifie la référence auprès de CinetPay avant de passer le paiement à confirmé. Les clés privées restent exclusivement côté serveur.

## Sources officielles
1. Stripe — Disponibilité mondiale : https://stripe.com/fr/global
2. CinetPay — Paiements en Afrique : https://cinetpay.com/products/payments
3. CinetPay — Documentation Checkout API : https://docs.cinetpay.com/api/1.0-fr/introduction/overview

## Pré-requis
Une intégration réelle nécessitera le compte marchand Story’s, l’API key et le site ID fournis par CinetPay, ainsi que la validation KYC. Sans ces éléments, l’interface et le suivi peuvent être préparés, mais aucun paiement ne doit être simulé ni marqué confirmé.

## Vérification technique complémentaire

Le SDK Go publié par l’organisation CinetPay sur GitHub confirme les opérations d’initialisation d’un paiement, de consultation de statut et de vérification de notification. L’exemple utilise la devise XOF, une référence marchand, un montant, des URLs de succès/échec/notification et un canal de paiement optionnel. Le SDK indique également une authentification par API key et mot de passe et une vérification du token de notification avec comparaison résistante au timing.

Source technique consultée : https://github.com/cinetpay/cinetpay-go

## Parcours d’ouverture observé

Le back-office officiel CinetPay est accessible via https://panel.cinetpay.net. L’écran « Open an account » ouvre https://panel.cinetpay.net/demande-compte, en mode Sandbox, avec un parcours en quatre étapes. La première étape demande le nom complet et l’adresse e-mail qui servira à se connecter. Les informations personnelles et les éventuelles pièces de validation doivent être saisies directement par le propriétaire du compte.
