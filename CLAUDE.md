# pseudo_interpreteur

Interpréteur pédagogique en JavaScript pour un langage de programmation à mots-clés
français, destiné à des élèves de lycée (NSI / SNT). Architecture calquée sur le Lox de
*Crafting Interpreters* (Bob Nystrom) : scanner → parser → AST → interpréteur
tree-walking avec pattern visiteur.

> Ce fichier a été rédigé à partir de l'historique des conversations, pas du code.
> Les points marqués « à vérifier » doivent être confrontés au code réel.

## Lancer le projet

- `python3 -m http.server 8000` dans ce dossier, puis http://localhost:8000/index.html
- Obligatoire : `ui.js` est un module ES qui importe CodeMirror 6 depuis esm.sh,
  bloqué par le navigateur en `file://` (CORS).
- Connexion Internet nécessaire (esm.sh). Piste future : embarquer CodeMirror en local
  pour les réseaux de lycée filtrés.

## Architecture

Fichiers chargés depuis `index.html` dans l'ordre des dépendances
(dossier `js/` — à vérifier) :
`tokens.js`, `scanner.js`, `ast.js`, `errors.js`, `parser.js`, `environment.js`,
`callable.js`, `interpreter.js`, `examples.js`, `ui.js`.

- Tous en `<script src>` classiques (variables globales), sauf `ui.js` qui est un module.
- CodeMirror 6 : pas de `basicSetup` ; extensions assemblées à la main (`lineNumbers`,
  `history`, `syntaxHighlighting`, `defaultKeymap`, `historyKeymap`). `EditorView` et
  `keymap` importés depuis `@codemirror/view` (le paquet `codemirror` sur esm.sh ne les
  réexporte pas de façon fiable). Importmap dans `index.html`.
- Coloration via un `StreamLanguage` personnalisé (mots-clés français).
- Auto-indentation : keymap personnalisée sur Entrée, qui examine le **début** de la
  ligne courante (mot-clé ouvrant un bloc), indépendamment des mots optionnels en fin
  de ligne (`alors`, `faire`).

## Le langage (état actuel)

- Affectation `x <- 3` ; la variable est créée automatiquement à la première affectation
  (`Environment.assign()` appelle `define()`). `=` n'est pas un opérateur d'affectation.
- `afficher`, `si` / `sinon`, `tant que`, `pour i de a à b [par pas]`,
  `pour [chaque] x dans liste`, `fonction`.
- Listes `[4, 5, 23]`, accès indexé `L[0]`, imbriqué `L[0][1]`.
- Dictionnaires `{"cle": valeur}`, accès `D["cle"]`.
- Séparateur décimal : **le point**. La virgule décimale a été retirée du scanner
  (elle transformait `[4, 5, 23]` en `[4.5, 23]`).
- Mots-clés insensibles à la casse (`Tant que` = `tant que`).

## Deux syntaxes de blocs, maintenues en parallèle

1. Délimiteurs : `fin si`, `fin tant que`, `fin pour`, `fin fonction`.
2. Accolades `{ ... }` ou instruction unique sans délimiteur.

Emplacement exact des deux variantes de parser : à vérifier.
**Chantier en attente :** bouton de bascule entre les deux syntaxes dans l'interface,
avec renommage des classes pour éviter les collisions entre les deux versions.

## Décisions de conception

- `pour x de ... à ...` et `pour x dans ...` se distinguent par le jeton `DE` / `DANS`,
  jamais par lookahead sur `chaque`.
- `chaque`, `alors`, `faire`, `:` sont cosmétiques et optionnels → `match()`, pas `consume()`.
- Dans la syntaxe à délimiteurs, le mot-clé après `fin` est **obligatoire** (`consume()`),
  sinon ambiguïté quand plusieurs `si` s'enchaînent.
- L'accès indexé est parsé dans une méthode `index()` placée entre `call()` et
  `primary()` dans la chaîne de précédence (pas dans `call()`).
- `par` : défaut 1 ; prévoir des gardes contre un pas nul ou non numérique.
- Écartés : syntaxe par indentation (trop complexe et risquée pédagogiquement avec deux
  syntaxes) ; débogueur pas à pas (abandonné, pas assez de valeur pédagogique).

## Pièges connus

- `declaration()` avec `try/catch` + `synchronize()` avale les erreurs de parsing
  silencieusement (`statements` vaut alors `[null]`) : logger dans le `catch` pour déboguer.
- Les noms de paramètres des constructeurs AST doivent correspondre exactement à ceux
  utilisés dans les `visitXxx` (bug passé : `step` non passé à `new For(...)`).
- Un mot-clé oublié dans la table du scanner produit un `ExpressionStatement` au lieu
  de l'instruction attendue.
- Ne pas mettre de mot courant comme `a` dans la table des mots réservés.

## Conventions de code

- Utiliser `this.evaluate(expr)` plutôt que `expr.accept(this)` dans l'interpréteur.
- Débogage par `console.log` couche par couche (interpréteur → parser → AST), avec
  `expr.constructor.name` pour limiter la verbosité.

## Façon de travailler avec Olivier

- Corrections ciblées et itératives ; pas de réécriture complète de fichiers.
- Expliquer **quoi** changer et **pourquoi** ; proposer un plan avant toute modification
  touchant plusieurs fichiers.
- Ne pas modifier l'interface sans demande explicite.
- Éviter la sur-ingénierie : une fonctionnalité doit avoir une valeur pédagogique claire.
- Réponses en français, concises.
