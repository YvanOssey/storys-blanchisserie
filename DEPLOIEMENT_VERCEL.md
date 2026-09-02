# Déploiement autonome sur Vercel

Cette version n’utilise plus Manus pour l’authentification, le runtime, le stockage, les notifications ou les analytics. Le frontend Vite est servi comme site statique et l’API tRPC est exposée par `api/index.ts` comme Function Vercel.

## Pré-requis

Le projet nécessite une base **MySQL ou TiDB accessible publiquement depuis Vercel**. Il faut également définir un secret long et aléatoire pour `JWT_SECRET`. Les variables indispensables sont :

| Variable | Utilisation |
|---|---|
| `DATABASE_URL` | Connexion à la base MySQL/TiDB de production |
| `JWT_SECRET` | Signature des sessions client et administrateur |

## Déploiement depuis GitHub

Importer le dépôt dans Vercel, conserver `pnpm build` comme commande de build et `dist/public` comme répertoire de sortie. Le fichier `vercel.json` configure automatiquement le routage des requêtes `/api/*` vers la Function et le fallback des routes SPA vers `index.html`.

Dans les paramètres **Environment Variables** du projet Vercel, renseigner `DATABASE_URL` et `JWT_SECRET` pour les environnements Preview et Production. Ne jamais committer un fichier `.env` contenant des valeurs réelles.

## Déploiement avec la CLI

Depuis la racine du projet :

```bash
pnpm install
npx vercel
npx vercel --prod
```

La CLI demandera de lier le dossier à un compte et à un projet Vercel. Les secrets peuvent ensuite être ajoutés dans le tableau de bord Vercel ou avec `vercel env add`.

## Après déploiement

Vérifier `/` et `/commander`, puis tester une inscription client, une connexion client, une connexion administrateur et une création de commande. Vérifier aussi que la base de production contient les migrations Drizzle avant d’utiliser l’application en conditions réelles.

## Limites connues

Le code conserve les anciens fichiers de test et certains textes historiques du projet d’origine, mais ils ne sont pas importés par l’application déployée. La fonction Vercel dépend toujours d’un fournisseur MySQL/TiDB externe : Vercel héberge le code, pas la base de données.
