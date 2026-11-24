# Pixel Pause

Site de mini-jeux dans le navigateur, solo ou entre potes. Aucun compte, aucun serveur à installer.

## Les jeux

**Entre potes**
- **Mot imposteur** : tout le monde reçoit le même mot sauf l'imposteur, et Mr White n'en a aucun. Sur un seul PC (on se passe l'écran) ou en ligne (chacun son téléphone).
- **Le plus probable** : « Qui est le plus susceptible de… ». Chacun vote sur son téléphone, les résultats s'affichent chez l'hôte.
- **Sumo Arena (3D, three.js)** : 1 à 4 joueurs sur un clavier (ZQSD+Espace, flèches+Entrée, IJKL+O, pavé 8456+0), bots pour compléter. Pousse les autres hors d'une plateforme qui rétrécit, premier à 3 manches.
- **Foot 2v2 (3D, three.js)** : bleus contre rouges, 2 minutes, 1 à 4 joueurs sur un clavier, bots pour compléter.
- **Paquet Snake** : solo, duel sur le même clavier (flèches contre ZQSD), ou 2 à 4 serpents en ligne.

**En solo**
- **Bunker 3D** : FPS en raycasting sur une grande carte générée. 3 modes : deathmatch (3 min), zombies (vagues) et battle royale (zone qui rétrécit, dernier debout). Visée souris haut/bas/côtés, ou au doigt sur téléphone.
- **Pixel Kart** : course en vue arrière, boosts, flaques d'huile, 3 tours. Solo contre 5 karts, ou à 2 en écran partagé (J1 ZQSD, J2 flèches).
- **Néon Rush** : course à 3 couloirs, saute et glisse sous les obstacles.
- **Devine où** : tu es lâché dans une ville en 3D (MapLibre + OpenFreeMap, bâtiments en volume, aucun nom affiché), tu te déplaces, puis tu poses ton point sur la mini-carte. Solo ou en salon : le plus proche gagne.

## Salons en ligne

L'hôte crée un salon et obtient un **code à 3 chiffres** (ou un lien `?salon=123`). Les autres le rejoignent sur leur téléphone ou leur PC. Tout passe en pair à pair (WebRTC via PeerJS) : il n'y a pas de serveur de jeu, seulement le petit service public de PeerJS qui met les navigateurs en relation. L'hôte doit garder sa page ouverte pendant la partie.

## Fichiers

- `index.html` : la page et toutes les vues
- `style.css` : le style (interface sombre type lanceur de jeux, police Inter)
- `core.js` : navigation, stockage des records, icônes pixel art
- `net.js` : salons (PeerJS), `room.js` : écran du salon
- `imposteur.js`, `probable.js`, `snake.js`, `fps.js`, `sumo.js`, `foot.js`, `kart.js`, `rush.js`, `geo.js` : un fichier par jeu
- Bibliothèques (CDN) : MapLibre GL + OpenFreeMap (cartes), three.js (jeux 3D), PeerJS (salons)

Pour tester en local : ouvrir le dossier avec un petit serveur (`python3 -m http.server`) plutôt qu'en double-cliquant sur `index.html`, sinon les salons et certaines cartes ne marchent pas. Après une mise à jour, recharger avec Cmd+Maj+R. Sur GitHub Pages, tout fonctionne directement.
