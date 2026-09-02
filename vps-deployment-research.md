
## Évaluation Vercel

Vercel documente le déploiement d’applications Express et peut transformer l’application en une seule Vercel Function. L’application doit exporter l’app Express depuis un point d’entrée reconnu ou utiliser un serveur Node détecté. Les fichiers statiques ne doivent pas dépendre de `express.static()` et doivent être servis depuis le répertoire public prévu par Vercel.

La base MySQL reste externe à Vercel. La documentation Vercel recommande une gestion attentive du pool de connexions dans les Functions, avec un pool global et une fermeture correcte des connexions inactives. Story’s doit donc conserver une base MySQL externe et adapter la couche de connexion pour le runtime serverless.

Le frontend et l’API peuvent être déployés dans un même projet Vercel, mais les services Manus, l’authentification OAuth Manus et les variables intégrées ne deviennent pas indépendants automatiquement. Pour une sortie réelle de Manus, il faut remplacer ou supprimer le fallback Manus OAuth et fournir les secrets dans les variables Vercel.

Conclusion provisoire : Vercel est techniquement possible et peut être adapté à Story’s, mais il ne fournit pas seul la base MySQL. Il impose aussi un fonctionnement serverless et une adaptation du point d’entrée Express, des fichiers statiques et du pool de connexions. Il convient mieux si l’on accepte une base externe et un backend serverless ; un VPS reste plus simple pour conserver l’architecture actuelle et héberger tous les composants soi-même.

Sources :
- https://vercel.com/docs/frameworks/backend/express
- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/kb/guide/connection-pooling-with-functions
