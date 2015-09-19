/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define({
    // HEAD
    TITLE: "PREMIERS PAS AVEC BRACKETS",
    DESCRIPTION: "An interactive getting started guide for Brackets.",

    // BODY
    GETTING_STARTED: "PREMIERS PAS AVEC BRACKETS",
    GETTING_STARTED_GUIDE: "Suivez le guide !",

    // MADE WITH <3 AND JAVASCRIPT
    WELCOME_COMMENT: "MADE WITH <3 AND JAVASCRIPT",
    WELCOME:
        "Bienvenue dans Brackets, un éditeur de code open source qui comprend et facilite la conception de sites web. Il s’agit d’un éditeur à la fois léger et puissant qui intègre des outils visuels directement dans son interface, de sorte que chaque opération peut devenir un véritable jeu d’enfant.",

    // WHAT IS BRACKETS?
    EDITOR_COMMENT: "WHAT IS BRACKETS?",
    EDITOR: "Brackets se distingue des éditeurs traditionnels,",
    EDITOR_DESCRIPTION:
        "notamment par ses fonctionnalités uniques, comme l’Edition rapide ou l’Aperçu en direct, que vous ne trouverez pas forcément dans d’autres éditeurs. Cerise sur le gâteau, Brackets est écrit en JavaScript, en HTML et en CSS. Autrement dit, la grande majorité des utilisateurs de Brackets est capable de modifier et d’étendre l’éditeur. En fait, nous utilisons Brackets tous les jours pour son propre développement. Pour en savoir plus sur l’utilisation de ses fonctionnalités centrales, poursuivez votre lecture.",

    // GET STARTED WITH YOUR OWN FILES
    PROJECTS_COMMENT: "GET STARTED WITH YOUR OWN FILES",
    PROJECTS: "Projets Brackets",
    PROJECTS_DESCRIPTION:
        "Pour éditer votre propre code à l’aide de l’application Brackets, il vous suffit d’ouvrir le dossier contenant vos fichiers.\n" +
        "Brackets traite le dossier ouvert en tant que « projet » ; ainsi, les fonctionnalités Indicateurs de code, Aperçu en direct ou encore Edition rapide s’appliquent uniquement aux fichiers du dossier ouvert.",
    PROJECTS_SAMP:
        "Si vous vous sentez prêt à franchir le cap et à éditer votre propre code, fermez cet exemple de projet et utilisez la liste déroulante de la barre latérale de gauche pour changer de dossier. Pour le moment, la liste déroulante s’intitule « Prise en main », ce qui correspond au dossier dans lequel se trouve le fichier fictif sur lequel vous vous exercez actuellement. Cliquez sur la liste déroulante et sélectionnez « Ouvrir un dossier… » pour accéder à votre propre dossier.\n" +
        "Par la suite, vous pourrez tout à fait revenir aux dossiers précédemment ouverts, y compris cet exemple de projet, grâce à cette même liste déroulante.",

    // THE RELATIONSHIP BETWEEN HTML, CSS AND JAVASCRIPT
    QUICK_EDIT_COMMENT: "THE RELATIONSHIP BETWEEN HTML, CSS AND JAVASCRIPT",
    QUICK_EDIT: "Edition rapide des codes CSS et JavaScript",
    QUICK_EDIT_DESCRIPTION:
        "Vous ne risquez plus de perdre de vue le contexte en passant d’un document à un autre. Lorsque vous modifiez un fichier HTML, utilisez le raccourci <kbd>Cmd/Ctrl + E</kbd> pour ouvrir un éditeur rapide intégré qui affiche l’ensemble du code CSS associé.\n" +
        "Peaufinez votre CSS, puis appuyez sur <kbd>Echap</kbd> pour revenir au format HTML, ou laissez simplement les règles CSS ouvertes afin qu’elles deviennent partie intégrante de l’éditeur HTML. Si vous appuyez sur <kbd>Echap</kbd> en dehors d’un éditeur intégré rapide, tous les éditeurs sont réduits. La fonction Edition rapide détecte également les règles définies dans les fichiers LESS et SCSS, y compris les règles imbriquées.",
    QUICK_EDIT_SAMP:
        "Une petite démonstration ? Placez le curseur de la souris sur la balise <!-- <samp> --> et tapez <kbd>Cmd/Ctrl + E</kbd>. Un éditeur rapide CSS apparaît en superposition, avec la règle CSS applicable. La fonction Edition rapide est également utilisable pour les attributs de classe et d’ID. Vous pouvez aussi vous en servir sur vos fichiers LESS et SCSS.\n" +
        "\n" +
        "Vous pouvez créer de nouvelles règles en procédant de la même manière. Cliquez sur l’une des balises <!-- <p> --> en haut du document et appuyez sur <kbd>Cmd/Ctrl + E</kbd>. Il n’existe aucune règle associée pour le moment, mais vous pouvez cliquer sur le bouton Nouvelle règle afin d’ajouter une règle pour <!-- <p> -->.",
    QUICK_EDIT_SCREENSHOT: "Capture d’écran de la fonction Edition rapide CSS",
    QUICK_EDIT_OTHERS:
        "Vous pouvez utiliser le même raccourci pour éditer d’autres éléments, comme les fonctions dans JavaScript, les couleurs ou les fonctions de temporisation d’animation ; nous ajoutons sans cesse des nouveautés.",
    QUICK_EDIT_NOTE:
        "Les éditeurs intégrés ne peuvent pas encore être imbriqués. Vous ne pouvez donc utiliser la fonction Edition rapide que lorsque le curseur se trouve dans un éditeur « plein écran ».",

    // LIVE PREVIEW
    LIVE_PREVIEW_COMMENT: "LIVE PREVIEW",
    LIVE_PREVIEW: "Affichage des modifications HTML et CSS en direct dans le navigateur",
    LIVE_PREVIEW_INTRO:
        "Depuis des années, nous pratiquons tous la fameuse technique « Enregistrer/Actualiser » : apporter des modifications dans l’éditeur, enregistrer, basculer vers le navigateur, puis actualiser la page pour voir le résultat.\n" +
        "Avec Brackets, cette longue procédure appartient au passé.",
    LIVE_PREVIEW_DESCRIPTION:
        "Brackets se connecte <em>en direct</em> à votre navigateur local et transmet vos mises à jour au fur et à mesure que vous les appliquez au code HTML et CSS. Certes, il existe des outils accessibles directement depuis le navigateur qui permettent d’obtenir un résultat similaire mais, avec Brackets, vous n’avez pas besoin de copier et coller à nouveau le code final dans l’éditeur. Le navigateur lit votre code, mais c’est l’éditeur qui le fait vivre !",
    LIVE_PREVIEW_HIGHLIGHT: "Mise en surbrillance en direct des éléments HTML et règles CSS",
    LIVE_PREVIEW_HIGHLIGHT_DESCRIPTION:
        "Avec Brackets, vous pouvez facilement visualiser les effets des modifications du code HTML et CSS sur la page. Lorsque vous placez le curseur sur une règle CSS, Brackets surligne tous les éléments concernés dans le navigateur. De même, lorsque vous éditez un fichier HTML, Brackets surligne les éléments HTML correspondants dans le navigateur.",
    LIVE_PREVIEW_HIGHLIGHT_SAMP:
        "Si vous avez installé Google Chrome, vous pouvez dès maintenant tester cette fonctionnalité. Cliquez sur l’icône représentant un éclair en haut à droite de la fenêtre Brackets ou utilisez la combinaison <kbd>Cmd/Ctrl + Alt + P</kbd>. Lorsque le module Aperçu en direct est activé sur un document HTML, tous les documents CSS associés peuvent être modifiés en temps réel.\n" +
        "L’icône passe du gris au doré une fois que Brackets a établi la connexion à votre navigateur.\n" +
        "\n" +
        "Placez maintenant le curseur sur la balise <!-- <img> -->. Vous constatez qu’une surbrillance bleue apparaît tout autour de l’image dans Chrome. Utilisez ensuite la combinaison <kbd>Cmd/Ctrl + E</kbd> pour ouvrir les règles CSS définies.\n" +
        "Essayez de faire passer l’épaisseur de la bordure de 10 px à 20 px, ou de remplacer la couleur d’arrière-plan « transparent » par « hotpink ». Si Brackets et votre navigateur s’exécutent côte à côte, ce dernier affiche immédiatement les modifications. Plutôt sympathique, non ?",
    LIVE_PREVIEW_NOTE:
        "A l’heure actuelle, le module Aperçu en direct de Brackets ne fonctionne que pour le code HTML et CSS. Cependant, dans cette version, les modifications apportées aux fichiers JavaScript sont automatiquement rechargées lorsque vous enregistrez. Nous travaillons activement à la prise en charge du module Aperçu en direct pour le langage JavaScript. La fonctionnalité Aperçu en direct n’est disponible qu’avec Google Chrome, mais nous souhaitons à l’avenir la déployer sur l’ensemble des navigateurs.",

    // QUICK VIEW
    QUICK_VIEW: "Affichage rapide",
    QUICK_VIEW_DESCRIPTION:
        "Pour ceux d’entre nous qui n’ont pas encore mémorisé les équivalents en couleur des valeurs HEX ou RVB, Brackets permet d’afficher rapidement et facilement la couleur utilisée. Dans le code CSS ou HTML, placez simplement le curseur sur une valeur colorimétrique ou un dégradé, et Brackets affiche automatiquement un aperçu de la couleur ou du dégradé en question. Procédez de même pour les images : placez simplement le curseur sur le lien d’une image dans l’éditeur Brackets pour en afficher une miniature.",
    QUICK_VIEW_SAMP:
        "Testez la fonction Affichage rapide par vous-même : placez le curseur sur la balise <!-- <body> --> en haut du document et appuyez sur <kbd>Cmd/Ctrl + E</kbd> pour ouvrir un éditeur rapide CSS. A présent, placez le curseur sur l’une des valeurs de couleur dans le code CSS. Vous pouvez également tester cette fonctionnalité sur un dégradé : ouvrez un éditeur rapide CSS sur la balise <!-- <html> -->, puis passez le curseur sur l’une des valeurs de l’image d’arrière-plan. Pour essayer l’aperçu avec une image, placez le curseur sur la capture d’écran insérée plus haut dans le document.",

    // EXTENSIONS
    EXTENSIONS: "Vous en voulez plus ? Jetez un œil du côté des extensions !",
    EXTENSIONS_DESCRIPTION:
        "En plus de tous les atouts déjà intégrés à Brackets, notre communauté de développeurs, qui ne cesse de s’agrandir, a mis au point des centaines d’extensions qui offrent des fonctionnalités très pratiques. Si vous avez besoin d’une fonction qui ne se trouve pas dans Brackets, il est fort probable qu’un utilisateur ait créé l’extension qu’il vous faut. Pour parcourir la liste des extensions disponibles ou en rechercher une en particulier, cliquez sur <strong>Fichier &gt; Gestionnaire d’extensions</strong>, puis ouvrez l’onglet « Disponible ». Lorsque vous trouvez l’extension qui vous convient, il vous suffit de cliquer sur le bouton Installer correspondant.",

    // LET US KNOW WHAT YOU THINK
    GET_INVOLVED_COMMENT: "LET US KNOW WHAT YOU THINK",
    GET_INVOLVED: "Participer",
    GET_INVOLVED_DESCRIPTION:
        "Brackets est un projet open source. Des développeurs web du monde entier participent à l’amélioration de l’éditeur de code. Nombreux sont ceux qui créent des extensions afin de développer les possibilités de Brackets.\n" +
        "Donnez-nous votre avis, partagez vos idées ou participez directement au projet.",

    URLNAME_BRACKETS: "Brackets.io",
    URLNAME_BRACKETS_BLOG: "Blog de l’équipe Brackets",
    URLNAME_BRACKETS_GITHUB: "Brackets sur GitHub",
    URLNAME_BRACKETS_EXTENSIONS_REGISTRY: "Registre des extensions Brackets",
    URLNAME_BRACKETS_WIKI: "Wiki Brackets",
    URLNAME_BRACKETS_MAILING_LIST: "Liste de diffusion des développeurs Brackets",
    URLNAME_BRACKETS_TWITTER: "@brackets on Twitter",
    BRACKETS_CHAT_INFO_BEFORE: "Discutez avec les développeurs de Brackets via IRC sur",
    BRACKETS_CHAT_FREENODE: "#brackets on Freenode",
    BRACKETS_CHAT_INFO_AFTER: ""
});
