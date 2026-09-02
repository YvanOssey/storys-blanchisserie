# Purge des données clients — 27 août 2026

La suppression a été exécutée après confirmation explicite de l’utilisateur.

Avant la purge, la base contenait 5 clients, 4 comptes clients, 10 commandes, 11 notifications client, 0 affectation, 0 livreur et 0 tournée. Les données administratives comptaient 2 comptes administrateurs et 1 entrée de whitelist.

La purge a supprimé les affectations liées, les notifications admin liées aux commandes, les notifications client, les comptes clients, les commandes et les coordonnées clients. La structure des tables n’a pas été modifiée.

Après la purge : clients 0, comptes clients 0, commandes 0, notifications client 0, notifications admin 0, affectations 0. Les 2 comptes administrateurs et l’unique entrée de whitelist ont été conservés. Les livreurs et tournées restent à 0.
