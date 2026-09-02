# Comparaison GeniusPay vs CinetPay pour Story’s (Côte d’Ivoire)

## Synthèse des offres

| Critère | CinetPay | GeniusPay |
| :--- | :--- | :--- |
| **Positionnement** | Passerelle de paiement directe (PSP) | Orchestrateur de gateways (agrégateur) |
| **Moyens CI** | Orange, MTN, Moov, Wave, Visa, Mastercard | Wave (direct), Orange, MTN, Moov (via CinetPay/PAL) |
| **Frais (Mobile)** | ~2% à 3% (selon volume et opérateur) | 1% + 100 XOF + Frais opérateur (ex: 2.5% + 100 XOF pour Wave) |
| **Frais (Cartes)** | 3,5% | 6% + 100 XOF (via Paystack/CinetPay) |
| **Intégration** | Checkout API, SDKs, API Directe | API REST unifiée, Smart Routing |
| **Reversement** | 72 heures (Virement ou Mobile Money) | Variable selon le gateway utilisé |
| **Fiabilité** | Acteur historique, certifié PCI-DSS | Orchestrateur récent, dépend des gateways tiers |

## Analyse pour Story’s

### CinetPay : La solution directe et robuste
CinetPay est un prestataire de services de paiement (PSP) établi qui gère directement les relations avec les opérateurs. Pour une entreprise comme Story’s, c’est la garantie d’une **traceabilité directe** et de frais potentiellement plus bas sur les cartes bancaires (3,5% contre 6% chez GeniusPay). L’intégration est standardisée et éprouvée.

### GeniusPay : La flexibilité et le "Smart Routing"
GeniusPay agit comme une surcouche. Son avantage majeur est de proposer **Wave en direct** avec des frais très compétitifs (2.5% + 100 XOF) et de pouvoir basculer entre plusieurs gateways (CinetPay, PAL, Paystack) si l’un d’eux est indisponible. Cependant, cela ajoute une couche technique et des frais fixes (100 XOF par transaction) qui peuvent peser sur les petits montants.

## Recommandation finale

Pour Story’s, **CinetPay reste le choix le plus solide** pour démarrer la Phase 2 :
1. **Frais plus bas sur les cartes** (3,5%), ce qui est crucial pour les offres "Prestige".
2. **Relation directe** avec le prestataire sans intermédiaire technique supplémentaire.
3. **Certification PCI-DSS** et historique de fiabilité en Afrique francophone.

GeniusPay est une excellente alternative si Story’s souhaite privilégier Wave ou avoir une redondance multi-gateways à l’avenir.

## Références
- CinetPay Tarifs : https://cinetpay.com/pricing
- GeniusPay Tarifs : https://geniuspay.ci/pricing
- GeniusPay Gateways : https://geniuspay.ci/docs/api
