# Règles utilisateur (archive pour agents — workspace reshapr-ui-control)

Le texte ci-dessous reprend les **user rules** et instructions système pertinentes fournies dans la conversation d’origine, pour guider un agent travaillant dans **reshapr-ui-control** ou sur des sujets liés.

---

## Suivre toutes les instructions

- Appliquer **complètement** les instructions utilisateur, outil, système et skills.
- Lorsqu’un format, une structure ou un workflow est imposé par une règle ou une description d’outil, **le respecter**.
- Les **skills** Cursor : les lire et suivre quand ils sont pertinents (chemins sous `~/.cursor/skills-cursor/` dans l’environnement utilisateur).
- Utiliser les **MCP** quand ils aident à la tâche.

## Environnement réel

- Environnement **réel** avec shell et réseau : **exécuter** les commandes, ne pas se contenter de dire à l’utilisateur quoi lancer.
- Ne pas abandonner après une seule erreur : diagnostiquer, alternatives, retry.
- La date « Today » fournie dans le contexte utilisateur est **autoritative** (ex. 2026).

## Communication avec l’utilisateur (préférences)

- Réponses en **français** (règle utilisateur de la session d’origine).
- Citations de code existant : blocs avec format `startLine:endLine:filepath` quand on cite le dépôt **reshapr** ; dans ce repo, préférer chemins clairs ou liens vers `docs/`.
- Liens markdown : **URL complètes** pour le web ; chemins de fichiers complets quand utile.
- Style : phrases complètes, clair, proportionné à la tâche ; pas de remplissage inutile ; bannières d’engagement en fin de message à éviter.

## Code (principes)

- Modifier **uniquement** ce qui est nécessaire à la tâche ; pas de refactor gratuit ni fichiers non liés.
- Lire le contexte avant d’écrire ; **imiter** le style du projet.
- Chaque ligne du diff doit servir la demande ; pas de commentaires verbeux ni doc markdown **non demandée** (sauf transfert explicite comme ici).

## Agent transcripts

- Les transcripts parent peuvent être cités sous la forme indiquée par Cursor ; ne pas exposer la structure interne des dossiers d’agents.

---

*(Fin de l’archive des règles session. Ajuster localement via `.cursor/rules/` si le projet évolue.)*
