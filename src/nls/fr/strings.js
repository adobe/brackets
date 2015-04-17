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

    /**
     * Errors
     */

    // General file io error strings
	"GENERIC_ERROR": "(Erreur {0})",
	"NOT_FOUND_ERR": "Fichier/répertoire introuvable.",
	"NOT_READABLE_ERR": "Impossible de lire le fichier/répertoire.",
	"EXCEEDS_MAX_FILE_SIZE": "Les fichiers dont la taille excède {0} Mo ne peuvent pas être ouverts dans {APP_NAME}.",
	"NO_MODIFICATION_ALLOWED_ERR": "Le répertoire cible ne peut pas être modifié.",
	"NO_MODIFICATION_ALLOWED_ERR_FILE": "Vous n’êtes pas autorisé à effectuer des modifications.",
	"CONTENTS_MODIFIED_ERR": "Le fichier a été modifié dans une application autre que {APP_NAME}.",
	"UNSUPPORTED_ENCODING_ERR": "Pour le moment, {APP_NAME} ne prend en charge que les fichiers texte avec encodage UTF-8.",
	"FILE_EXISTS_ERR": "Le fichier ou le répertoire existe déjà.",
	"FILE": "fichier",
	"FILE_TITLE": "Fichier",
	"DIRECTORY": "répertoire",
	"DIRECTORY_TITLE": "Répertoire",
	"DIRECTORY_NAMES_LEDE": "noms de répertoires",
	"FILENAMES_LEDE": "noms de fichiers",
	"FILENAME": "Nom de fichier",
	"DIRECTORY_NAME": "Nom du répertoire",

    // Project error strings
	"ERROR_LOADING_PROJECT": "Erreur lors du chargement du projet",
	"OPEN_DIALOG_ERROR": "Une erreur s’est produite lors de l’affichage de la boîte de dialogue Ouvrir. (Erreur {0})",
	"REQUEST_NATIVE_FILE_SYSTEM_ERROR": "Une erreur s’est produite lors de la tentative de chargement du répertoire <span class='dialog-filename'>{0}</span>. (Erreur {1})",
	"READ_DIRECTORY_ENTRIES_ERROR": "Une erreur s’est produite lors de la lecture du contenu du répertoire <span class='dialog-filename'>{0}</span>. (Erreur {1})",

    // File open/save error string
	"ERROR_OPENING_FILE_TITLE": "Erreur lors de l’ouverture du fichier",
	"ERROR_OPENING_FILE": "Une erreur s’est produite lors de la tentative d’ouverture du fichier <span class='dialog-filename'>{0}</span>. {1}",
	"ERROR_OPENING_FILES": "Une erreur s’est produite en tentant d’ouvrir les fichiers suivants :",
	"ERROR_RELOADING_FILE_TITLE": "Erreur lors du rechargement des modifications à partir du disque",
	"ERROR_RELOADING_FILE": "Une erreur s’est produite lors de la tentative de rechargement du fichier <span class='dialog-filename'>{0}</span>. {1}",
	"ERROR_SAVING_FILE_TITLE": "Erreur lors de l’enregistrement du fichier",
	"ERROR_SAVING_FILE": "Une erreur s’est produite lors de la tentative d’enregistrement du fichier <span class='dialog-filename'>{0}</span>. {1}",
	"ERROR_RENAMING_FILE_TITLE": "Erreur lors du changement de nom du {0}",
	"ERROR_RENAMING_FILE": "Une erreur s’est produite lors de la tentative de changement de nom du {2} <span class='dialog-filename'>{0}</span>. {1}",
	"ERROR_DELETING_FILE_TITLE": "Erreur lors de la suppression du {0}",
	"ERROR_DELETING_FILE": "Une erreur s’est produite lors de la tentative de suppression du {2} <span class='dialog-filename'>{0}</span>. {1}",
	"INVALID_FILENAME_TITLE": "{0} non valide",
	"INVALID_FILENAME_MESSAGE": "Les {0} ne peuvent pas utiliser de termes réservés au système, finir par un point (.) ou contenir l’un des caractères suivants : <code class='emphasized'>{1}</code>",
	"ENTRY_WITH_SAME_NAME_EXISTS": "Il existe déjà un fichier ou un répertoire portant le nom <span class='dialog-filename'>{0}</span>.",
	"ERROR_CREATING_FILE_TITLE": "Erreur lors de la création de l’élément {0}",
	"ERROR_CREATING_FILE": "Une erreur s’est produite lors de la tentative de création du {0} <span class='dialog-filename'>{1}</span>. {2}",
	"ERROR_MIXED_DRAGDROP": "Impossible d’ouvrir un dossier en même temps que d’autres fichiers.",

    // User key map error strings
	"ERROR_KEYMAP_TITLE": "Erreur lors de la lecture du mappage de touches utilisateur",
	"ERROR_KEYMAP_CORRUPT": "Votre fichier de mappage de touches n’est pas un fichier JSON valide. Il va s’ouvrir afin que vous puissiez corriger le format.",
	"ERROR_LOADING_KEYMAP": "Votre fichier de mappage de touches n’étant pas un fichier texte codé en UTF-8 valide, il ne peut pas être chargé.",
	"ERROR_RESTRICTED_COMMANDS": "Vous ne pouvez pas réaffecter de raccourcis à ces commandes : {0}",
	"ERROR_RESTRICTED_SHORTCUTS": "Vous ne pouvez pas réaffecter ces raccourcis : {0}",
	"ERROR_MULTIPLE_SHORTCUTS": "Vous réaffectez plusieurs raccourcis à ces commandes : {0}",
	"ERROR_DUPLICATE_SHORTCUTS": "Plusieurs liaisons ont été définies pour les raccourcis suivants : {0}",
	"ERROR_INVALID_SHORTCUTS": "Ces raccourcis ne sont pas valides : {0}",
	"ERROR_NONEXISTENT_COMMANDS": "Vous affectez des raccourcis à des commandes qui n'existent pas : {0}",

    // Application preferences corrupt error strings
	"ERROR_PREFS_CORRUPT_TITLE": "Erreur lors de la lecture des préférences",
	"ERROR_PREFS_CORRUPT": "Votre fichier de préférences n’est pas un fichier JSON valide, il va donc être ouvert afin que vous puissiez corriger le format. Vous devrez ensuite redémarrer {APP_NAME} pour que les modifications prennent effet.",
	"ERROR_PROJ_PREFS_CORRUPT": "[8036824] !é=Your project preferences file is not valid JSON. The file will be opened so that you can correct the format. You will need to reload the project for the changes to take effect.=!",

    // Application error strings
	"ERROR_IN_BROWSER_TITLE": "Malheureusement, {APP_NAME} n’est pas encore compatible avec les navigateurs.",
	"ERROR_IN_BROWSER": "{APP_NAME} est défini en HTML, mais il s’exécute actuellement en tant qu’application de bureau, vous pouvez donc l’utiliser afin de modifier des fichiers locaux. Utilisez l’interpréteur de commandes d’application situé dans le référentiel <b>github.com/adobe/brackets-shell</b> afin d’exécuter {APP_NAME}.",

    // ProjectManager max files error string
	"ERROR_MAX_FILES_TITLE": "Erreur lors de l’indexation des fichiers",
	"ERROR_MAX_FILES": "Ce projet contient plus de 30 000 fichiers. Les fonctionnalités qui s’appliquent de manière globale à plusieurs fichiers peuvent être désactivées ou se comporter comme si le projet était vide. <a href='https://github.com/adobe/brackets/wiki/Large-Projects'>En savoir plus sur l’utilisation de projets volumineux</a>.",

    // Live Preview error strings
	"ERROR_LAUNCHING_BROWSER_TITLE": "Erreur lors du lancement du navigateur",
	"ERROR_CANT_FIND_CHROME": "Le navigateur Google Chrome est introuvable. Assurez-vous qu’il est installé.",
	"ERROR_LAUNCHING_BROWSER": "Une erreur s’est produite lors du lancement du navigateur. (Erreur {0})",

	"LIVE_DEVELOPMENT_ERROR_TITLE": "Erreur du module Aperçu en direct",
	"LIVE_DEVELOPMENT_RELAUNCH_TITLE": "Connexion au navigateur",
	"LIVE_DEVELOPMENT_ERROR_MESSAGE": "Pour que le module Aperçu en direct puisse se connecter, vous devez relancer Chrome en activant la fonction de débogage à distance.<br /><br />Voulez-vous relancer Chrome et activer le débogage à distance ?<br /><br />",
	"LIVE_DEV_LOADING_ERROR_MESSAGE": "Impossible de charger la page Aperçu en direct.",
	"LIVE_DEV_NEED_HTML_MESSAGE": "Ouvrez un fichier HTML ou vérifiez qu’il y a un fichier index.html dans votre projet pour pouvoir lancer l’aperçu en direct.",
	"LIVE_DEV_NEED_BASEURL_MESSAGE": "Pour lancer l’Aperçu en direct avec un fichier de serveur, vous devez indiquer une URL de base pour ce projet.",
	"LIVE_DEV_SERVER_NOT_READY_MESSAGE": "Une erreur s’est produite au démarrage du serveur HTTP pour les fichiers d’aperçu en direct. Veuillez réessayer.",
	"LIVE_DEVELOPMENT_INFO_TITLE": "Bienvenue dans le module Aperçu en direct !",
	"LIVE_DEVELOPMENT_INFO_MESSAGE": "Le module Aperçu en direct connecte {APP_NAME} à votre navigateur. Il ouvre un aperçu de votre fichier HTML dans le navigateur, puis le met à jour instantanément dès que vous modifiez le code.<br /><br />Dans cette première version du logiciel {APP_NAME}, le module Aperçu en direct ne fonctionne qu’avec <strong>Google Chrome</strong> et affiche les mises à jour en direct, dès que vous modifiez des <strong>fichiers CSS ou HTML</strong>. Les modifications apportées aux fichiers JavaScript sont automatiquement rechargées lorsque vous enregistrez.<br /><br />(Ce message ne s’affichera qu’une seule fois.)",
	"LIVE_DEVELOPMENT_TROUBLESHOOTING": "Pour plus d’informations, consultez la page <a href='{0}' title='{0}'>Résolution des erreurs de connexion à l’Aperçu en direct</a>.",

	"LIVE_DEV_STATUS_TIP_NOT_CONNECTED": "Aperçu en direct",
	"LIVE_DEV_STATUS_TIP_PROGRESS1": "Aperçu en direct : Connexion\u2026",
	"LIVE_DEV_STATUS_TIP_PROGRESS2": "Aperçu en direct : Initialisation\u2026",
	"LIVE_DEV_STATUS_TIP_CONNECTED": "Déconnecter le module Aperçu en direct",
	"LIVE_DEV_STATUS_TIP_OUT_OF_SYNC": "Aperçu en direct (enregistrez le fichier pour actualiser)",
	"LIVE_DEV_STATUS_TIP_SYNC_ERROR": "Aperçu en direct (échec de la mise à jour en raison d’une erreur de syntaxe)",

	"LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS": "Aperçu en direct a été annulé car les outils de développeur du navigateur étaient ouverts",
	"LIVE_DEV_DETACHED_TARGET_CLOSED": "Aperçu en direct a été annulé car la page était fermée dans le navigateur",
	"LIVE_DEV_NAVIGATED_AWAY": "Aperçu en direct a été annulé car le navigateur a accédé à une page qui ne fait pas partie du projet actuel",
	"LIVE_DEV_CLOSED_UNKNOWN_REASON": "Aperçu en direct a été annulé pour une raison inconnue ({0})",

	"SAVE_CLOSE_TITLE": "Enregistrer les modifications",
	"SAVE_CLOSE_MESSAGE": "Souhaitez-vous enregistrer les modifications apportées au document <span class='dialog-filename'>{0}</span> ?",
	"SAVE_CLOSE_MULTI_MESSAGE": "Souhaitez-vous enregistrer les modifications apportées aux fichiers suivants ?",
	"EXT_MODIFIED_TITLE": "Modifications externes",
	"CONFIRM_FOLDER_DELETE_TITLE": "Confirmer la suppression",
	"CONFIRM_FOLDER_DELETE": "Voulez-vous vraiment supprimer le dossier <span class='dialog-filename'>{0}</span> ?",
	"FILE_DELETED_TITLE": "Fichier supprimé",
	"EXT_MODIFIED_WARNING": "<span class='dialog-filename'>{0}</span> a été modifié sur le disque, dans une application autre que {APP_NAME}.<br /><br />Voulez-vous enregistrer le fichier et remplacer ces modifications ?",
	"EXT_MODIFIED_MESSAGE": "Le fichier <span class='dialog-filename'>{0}</span> a été modifié sur le disque dans une autre application que {APP_NAME} mais présente également des modifications non enregistrées dans {APP_NAME}.<br /><br />Quelle version souhaitez-vous conserver ?",
	"EXT_DELETED_MESSAGE": "Le fichier <span class='dialog-filename'>{0}</span> a été supprimé du disque dans une autre application que {APP_NAME} mais présente également des modifications non enregistrées dans {APP_NAME}.<br /><br />Souhaitez-vous conserver vos modifications ?",

    // Generic dialog/button labels
	"DONE": "Terminé",
	"OK": "OK",
	"CANCEL": "Annuler",
	"DONT_SAVE": "Ne pas enregistrer",
	"SAVE": "Enregistrer",
	"SAVE_AS": "Enregistrer sous\u2026",
	"SAVE_AND_OVERWRITE": "Remplacer",
	"DELETE": "Supprimer",
	"BUTTON_YES": "Oui",
	"BUTTON_NO": "Non",

    // Find, Replace, Find in Files
	"FIND_MATCH_INDEX": "{0} sur {1}",
	"FIND_NO_RESULTS": "Aucun résultat",
	"FIND_QUERY_PLACEHOLDER": "Rechercher\u2026",
	"REPLACE_PLACEHOLDER": "Remplacer par\u2026",
	"BUTTON_REPLACE_ALL": "Traiter par lots\u2026",
	"BUTTON_REPLACE_ALL_IN_FILES": "Remplacer\u2026",
	"BUTTON_REPLACE": "Remplacer",
	"BUTTON_NEXT": "\u25B6",
	"BUTTON_PREV": "\u25C0",
	"BUTTON_NEXT_HINT": "Résultat suivant",
	"BUTTON_PREV_HINT": "Résultat précédent",
	"BUTTON_CASESENSITIVE_HINT": "Respecter la casse",
	"BUTTON_REGEXP_HINT": "Expression régulière",
	"REPLACE_WITHOUT_UNDO_WARNING_TITLE": "Remplacer sans possibilité d’annuler",
	"REPLACE_WITHOUT_UNDO_WARNING": "Dans la mesure où le nombre de fichiers à modifier excède {0}, {APP_NAME} va modifier des fichiers non ouverts sur le disque.<br />Vous ne pourrez pas annuler les remplacements effectués dans ces fichiers.",
	"BUTTON_REPLACE_WITHOUT_UNDO": "Remplacer sans possibilité d’annuler",

	"OPEN_FILE": "Ouvrir le fichier",
	"SAVE_FILE_AS": "Enregistrer le fichier",
	"CHOOSE_FOLDER": "Choisir un dossier",

	"RELEASE_NOTES": "Notes de mise à jour",
	"NO_UPDATE_TITLE": "Vos logiciels sont à jour !",
	"NO_UPDATE_MESSAGE": "Vous utilisez la dernière version de {APP_NAME}.",

    // Find and Replace
	"FIND_REPLACE_TITLE_LABEL": "Remplacer",
	"FIND_REPLACE_TITLE_WITH": "par",
	"FIND_TITLE_LABEL": "Occurrences trouvées pour",
	"FIND_TITLE_SUMMARY": "&mdash; {0} {1} {2} dans {3}",

    // Find in Files
	"FIND_NUM_FILES": "{0} {1}",
	"FIND_IN_FILES_SCOPED": "dans <span class='dialog-filename'>{0}</span>",
	"FIND_IN_FILES_NO_SCOPE": "dans le projet",
	"FIND_IN_FILES_ZERO_FILES": "Le filtre exclut tous les fichiers {0}",
	"FIND_IN_FILES_FILE": "fichier",
	"FIND_IN_FILES_FILES": "fichiers",
	"FIND_IN_FILES_MATCH": "résultat",
	"FIND_IN_FILES_MATCHES": "résultats",
	"FIND_IN_FILES_MORE_THAN": "Plus de ",
	"FIND_IN_FILES_PAGING": "{0}&mdash;{1}",
	"FIND_IN_FILES_FILE_PATH": "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>",
	"FIND_IN_FILES_EXPAND_COLLAPSE": "Cliquer tout en appuyant sur Ctrl/Cmd pour tout développer/tout réduire",
	"REPLACE_IN_FILES_ERRORS_TITLE": "Erreurs de remplacement",
	"REPLACE_IN_FILES_ERRORS": "Les fichiers suivants n’ont pas été traités car ils ont été modifiés après l’opération de recherche ou ne sont pas accessibles en écriture.",

	"ERROR_FETCHING_UPDATE_INFO_TITLE": "Erreur de récupération des informations de mise à jour",
	"ERROR_FETCHING_UPDATE_INFO_MSG": "Un problème est survenu lors de la récupération des dernières informations de mise à jour sur le serveur. Vérifiez que vous êtes connecté à Internet et réessayez.",

    // File exclusion filters
	"NEW_FILE_FILTER": "Nouveau jeu d’exclusion\u2026",
	"CLEAR_FILE_FILTER": "Ne pas exclure les fichiers",
	"NO_FILE_FILTER": "Aucun fichier exclu",
	"EXCLUDE_FILE_FILTER": "Exclure {0}",
	"EDIT_FILE_FILTER": "Modifier\u2026",
	"FILE_FILTER_DIALOG": "Modifier le jeu d’exclusion",
	"FILE_FILTER_INSTRUCTIONS": "Exclure les fichiers et dossiers correspondant à l’une des chaînes/sous-chaînes ou aux <a href='{0}' title='{0}'>caractères génériques</a> suivants. Entrez chaque chaîne sur une ligne différente.",
	"FILTER_NAME_PLACEHOLDER": "Nommer ce jeu d’exclusion (facultatif)",
	"FILE_FILTER_CLIPPED_SUFFIX": "et {0} autre(s)",
	"FILTER_COUNTING_FILES": "Comptage des fichiers\u2026",
	"FILTER_FILE_COUNT": "Autorise {0} fichier(s) sur les {1} {2}",
	"FILTER_FILE_COUNT_ALL": "Autorise les {0} fichiers {1}",

    // Quick Edit
	"ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND": "Fonction Edition rapide non disponible pour la position actuelle du curseur",
	"ERROR_CSSQUICKEDIT_BETWEENCLASSES": "Edition rapide CSS : placez le curseur sur un seul nom de classe",
	"ERROR_CSSQUICKEDIT_CLASSNOTFOUND": "Edition rapide CSS : attribut de classe incomplet",
	"ERROR_CSSQUICKEDIT_IDNOTFOUND": "Edition rapide CSS : attribut d’ID incomplet",
	"ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR": "Edition rapide CSS : placez le curseur dans la balise, la classe ou l’ID",
	"ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX": "Edition rapide des fonctions de temporisation CSS : syntaxe incorrecte",
	"ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND": "Edition rapide JS : placez le curseur dans le nom de fonction",

    // Quick Docs
	"ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND": "Fonction Documentation rapide non disponible pour la position actuelle du curseur",

    /**
     * ProjectManager
     */
	"PROJECT_LOADING": "Chargement\u2026",
	"UNTITLED": "Sans titre",
	"WORKING_FILES": "Fichiers de travail",

    /**
     * MainViewManager
     */
	"TOP": "Haut",
	"BOTTOM": "Bas",
	"LEFT": "Gauche",
	"RIGHT": "Droite",

	"CMD_SPLITVIEW_NONE": "Pas de fractionnement",
	"CMD_SPLITVIEW_VERTICAL": "Fractionnement vertical",
	"CMD_SPLITVIEW_HORIZONTAL": "Fractionnement horizontal",
	"SPLITVIEW_MENU_TOOLTIP": "Fractionner l’éditeur horizontalement ou verticalement",
	"GEAR_MENU_TOOLTIP": "Configurer l’ensemble de travail",

	"SPLITVIEW_INFO_TITLE": "Déjà ouvert",
	"SPLITVIEW_MULTIPANE_WARNING": "Ce fichier est déjà ouvert dans un autre volet. Il sera bientôt possible d’ouvrir un même fichier dans plusieurs volets de l’application {APP_NAME}, mais en attendant, vous ne pouvez consulter le fichier que dans le volet dans lequel il est déjà ouvert.<br /><br />(Ce message ne s’affichera qu’une fois.)",

    /**
     * Keyboard modifier names
     */
	"KEYBOARD_CTRL": "Ctrl",
	"KEYBOARD_SHIFT": "Maj",
	"KEYBOARD_SPACE": "Espace",

    /**
     * StatusBar strings
     */
	"STATUSBAR_CURSOR_POSITION": "Ligne {0}, colonne {1}",
	"STATUSBAR_SELECTION_CH_SINGULAR": " \u2014 {0} colonne sélectionnée",
	"STATUSBAR_SELECTION_CH_PLURAL": " \u2014 {0} colonnes sélectionnées",
	"STATUSBAR_SELECTION_LINE_SINGULAR": " \u2014 {0} ligne sélectionnée",
	"STATUSBAR_SELECTION_LINE_PLURAL": " \u2014 {0} lignes sélectionnées",
	"STATUSBAR_SELECTION_MULTIPLE": " \u2014 {0} sélections",
	"STATUSBAR_INDENT_TOOLTIP_SPACES": "Cliquez ici pour remplacer la mise en retrait par des espaces.",
	"STATUSBAR_INDENT_TOOLTIP_TABS": "Cliquez ici pour remplacer la mise en retrait par des tabulations.",
	"STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES": "Cliquez ici pour changer le nombre d’espaces utilisés lors de la mise en retrait.",
	"STATUSBAR_INDENT_SIZE_TOOLTIP_TABS": "Cliquez ici pour modifier la largeur du caractère de tabulation.",
	"STATUSBAR_SPACES": "Espaces :",
	"STATUSBAR_TAB_SIZE": "Taille de tabulation :",
	"STATUSBAR_LINE_COUNT_SINGULAR": "\u2014 {0} ligne",
	"STATUSBAR_LINE_COUNT_PLURAL": "\u2014 {0} lignes",
	"STATUSBAR_USER_EXTENSIONS_DISABLED": "Extensions désactivées",
	"STATUSBAR_INSERT": "INS",
	"STATUSBAR_OVERWRITE": "RFP",
	"STATUSBAR_INSOVR_TOOLTIP": "Cliquez pour faire passer le curseur du mode Insertion (INS) au mode Remplacement (RFP) ou inversement",
	"STATUSBAR_LANG_TOOLTIP": "Cliquez pour modifier le type de fichier",
	"STATUSBAR_CODE_INSPECTION_TOOLTIP": "{0}. Cliquez pour afficher/masquer le panneau des rapports.",
	"STATUSBAR_DEFAULT_LANG": "(par défaut)",
	"STATUSBAR_SET_DEFAULT_LANG": "Utiliser par défaut pour les fichiers .{0}",

    // CodeInspection: errors/warnings
	"ERRORS_PANEL_TITLE_MULTIPLE": "{0} problèmes",
	"SINGLE_ERROR": "1 problème {0}",
	"MULTIPLE_ERRORS": "{1} problèmes {0}",
	"NO_ERRORS": "Aucun problème {0} détecté, félicitations !",
	"NO_ERRORS_MULTIPLE_PROVIDER": "Aucun problème détecté, félicitations !",
	"LINT_DISABLED": "L’analyse lint est désactivée",
	"NO_LINT_AVAILABLE": "Aucun programme lint disponible pour {0}",
	"NOTHING_TO_LINT": "Rien à analyser",
	"LINTER_TIMED_OUT": "Délai dépassé pour {0} après une attente de {1} ms",
	"LINTER_FAILED": "{0} arrêté avec l’erreur suivante : {1}",

    /**
     * Command Name Constants
     */

    // File menu commands
	"FILE_MENU": "Fichier",
	"CMD_FILE_NEW_UNTITLED": "Nouveau",
	"CMD_FILE_NEW": "Nouveau fichier",
	"CMD_FILE_NEW_FOLDER": "Nouveau dossier",
	"CMD_FILE_OPEN": "Ouvrir\u2026",
	"CMD_ADD_TO_WORKING_SET": "Ouvrir dans l’ensemble de travail",
	"CMD_OPEN_DROPPED_FILES": "Ouvrir les fichiers déposés",
	"CMD_OPEN_FOLDER": "Ouvrir un dossier\u2026",
	"CMD_FILE_CLOSE": "Fermer",
	"CMD_FILE_CLOSE_ALL": "Tout fermer",
	"CMD_FILE_CLOSE_LIST": "Fermer la liste",
	"CMD_FILE_CLOSE_OTHERS": "Fermer tous les autres",
	"CMD_FILE_CLOSE_ABOVE": "Fermer les autres au-dessus",
	"CMD_FILE_CLOSE_BELOW": "Fermer les autres en dessous",
	"CMD_FILE_SAVE": "Enregistrer",
	"CMD_FILE_SAVE_ALL": "Enregistrer tout",
	"CMD_FILE_SAVE_AS": "Enregistrer sous\u2026",
	"CMD_LIVE_FILE_PREVIEW": "Aperçu en direct",
	"CMD_TOGGLE_LIVE_PREVIEW_MB_MODE": "Activer la version expérimentale de l’Aperçu en direct",
	"CMD_RELOAD_LIVE_PREVIEW": "Forcer le rechargement de l’aperçu en direct",
	"CMD_PROJECT_SETTINGS": "Paramètres du projet\u2026",
	"CMD_FILE_RENAME": "Renommer",
	"CMD_FILE_DELETE": "Supprimer",
	"CMD_INSTALL_EXTENSION": "Installer une extension\u2026",
	"CMD_EXTENSION_MANAGER": "Gestionnaire d'extensions\u2026",
	"CMD_FILE_REFRESH": "Actualiser l’arborescence de fichiers",
	"CMD_QUIT": "Quitter",
    // Used in native File menu on Windows
	"CMD_EXIT": "Quitter",

    // Edit menu commands
	"EDIT_MENU": "Modifier",
	"CMD_UNDO": "Annuler",
	"CMD_REDO": "Répéter",
	"CMD_CUT": "Couper",
	"CMD_COPY": "Copier",
	"CMD_PASTE": "Coller",
	"CMD_SELECT_ALL": "Sélectionner tout",
	"CMD_SELECT_LINE": "Sélectionner la ligne",
	"CMD_SPLIT_SEL_INTO_LINES": "Scinder la sélection en lignes",
	"CMD_ADD_CUR_TO_NEXT_LINE": "Ajouter un curseur à la ligne suivante",
	"CMD_ADD_CUR_TO_PREV_LINE": "Ajouter un curseur à la ligne précédente",
	"CMD_INDENT": "Retrait",
	"CMD_UNINDENT": "Annuler le retrait",
	"CMD_DUPLICATE": "Dupliquer",
	"CMD_DELETE_LINES": "Supprimer la ligne",
	"CMD_COMMENT": "Activer/Désactiver le commentaire de ligne",
	"CMD_BLOCK_COMMENT": "Commenter les blocs/Annuler les commentaires",
	"CMD_LINE_UP": "Déplacer la ligne vers le haut",
	"CMD_LINE_DOWN": "Déplacer la ligne vers le bas",
	"CMD_OPEN_LINE_ABOVE": "Ouvrir une ligne au-dessus",
	"CMD_OPEN_LINE_BELOW": "Ouvrir une ligne en dessous",
	"CMD_TOGGLE_CLOSE_BRACKETS": "Fermeture automatique des accolades",
	"CMD_SHOW_CODE_HINTS": "Afficher les indicateurs de code",

    // Search menu commands
	"FIND_MENU": "Rechercher",
	"CMD_FIND": "Rechercher",
	"CMD_FIND_NEXT": "Rechercher suivant",
	"CMD_FIND_PREVIOUS": "Rechercher précédent",
	"CMD_FIND_ALL_AND_SELECT": "Rechercher et sélectionner tout",
	"CMD_ADD_NEXT_MATCH": "Ajouter l’occurrence suivante à la sélection",
	"CMD_SKIP_CURRENT_MATCH": "Ignorer et ajouter l’occurrence suivante",
	"CMD_FIND_IN_FILES": "Rechercher dans les fichiers",
	"CMD_FIND_IN_SUBTREE": "Rechercher dans\u2026",
	"CMD_REPLACE": "Remplacer",
	"CMD_REPLACE_IN_FILES": "Remplacer dans les fichiers",
	"CMD_REPLACE_IN_SUBTREE": "Remplacer dans\u2026",

    // View menu commands
	"VIEW_MENU": "Affichage",
	"CMD_HIDE_SIDEBAR": "Masquer la barre latérale",
	"CMD_SHOW_SIDEBAR": "Afficher la barre latérale",
	"CMD_INCREASE_FONT_SIZE": "Augmenter la taille de la police",
	"CMD_DECREASE_FONT_SIZE": "Diminuer la taille de la police",
	"CMD_RESTORE_FONT_SIZE": "Restaurer la taille de la police",
	"CMD_SCROLL_LINE_UP": "Faire défiler d’une ligne vers le haut",
	"CMD_SCROLL_LINE_DOWN": "Faire défiler d’une ligne vers le bas",
	"CMD_TOGGLE_LINE_NUMBERS": "Numéros de ligne",
	"CMD_TOGGLE_ACTIVE_LINE": "Surligner la ligne active",
	"CMD_TOGGLE_WORD_WRAP": "Renvoi à la ligne",
	"CMD_LIVE_HIGHLIGHT": "Surlignement dans l’Aperçu en direct",
	"CMD_VIEW_TOGGLE_INSPECTION": "Effectuer une analyse lint des fichiers à l’enregistrement",
	"CMD_WORKINGSET_SORT_BY_ADDED": "Trier par date d’ajout",
	"CMD_WORKINGSET_SORT_BY_NAME": "Trier par nom",
	"CMD_WORKINGSET_SORT_BY_TYPE": "Trier par type",
	"CMD_WORKING_SORT_TOGGLE_AUTO": "Tri automatique",
	"CMD_THEMES": "Thèmes\u2026",

    // Navigate menu Commands
	"NAVIGATE_MENU": "Naviguer",
	"CMD_QUICK_OPEN": "Ouverture rapide",
	"CMD_GOTO_LINE": "Atteindre la ligne",
	"CMD_GOTO_DEFINITION": "Accès rapide à la définition",
	"CMD_GOTO_FIRST_PROBLEM": "Accéder au premier problème",
	"CMD_TOGGLE_QUICK_EDIT": "Edition rapide",
	"CMD_TOGGLE_QUICK_DOCS": "Documentation rapide",
	"CMD_QUICK_EDIT_PREV_MATCH": "Correspondance précédente",
	"CMD_QUICK_EDIT_NEXT_MATCH": "Correspondance suivante",
	"CMD_CSS_QUICK_EDIT_NEW_RULE": "Nouvelle règle",
	"CMD_NEXT_DOC": "Document suivant",
	"CMD_PREV_DOC": "Document précédent",
	"CMD_SHOW_IN_TREE": "Afficher dans l’arborescence de fichiers",
	"CMD_SHOW_IN_EXPLORER": "Afficher dans l’Explorateur",
	"CMD_SHOW_IN_FINDER": "Afficher dans le Finder",
	"CMD_SHOW_IN_OS": "Afficher dans le SE",

    // Help menu commands
	"HELP_MENU": "Aide",
	"CMD_CHECK_FOR_UPDATE": "Rechercher les mises à jour",
	"CMD_HOW_TO_USE_BRACKETS": "Comment utiliser {APP_NAME}",
	"CMD_SUPPORT": "Assistance {APP_NAME}",
	"CMD_SUGGEST": "Suggérer une fonctionnalité",
	"CMD_RELEASE_NOTES": "Notes de mise à jour",
	"CMD_GET_INVOLVED": "Participer",
	"CMD_SHOW_EXTENSIONS_FOLDER": "Afficher le dossier d’extensions",
	"CMD_HEALTH_DATA_STATISTICS": "[8033837] !é=Health Report=!",
	"CMD_HOMEPAGE": "Page d’accueil de {APP_TITLE}",
	"CMD_TWITTER": "{TWITTER_NAME} sur Twitter",
	"CMD_ABOUT": "A propos de {APP_TITLE}",
	"CMD_OPEN_PREFERENCES": "Ouvrir le fichier de préférences",
	"CMD_OPEN_KEYMAP": "Ouvrir le mappage de touches utilisateur",

    // Strings for main-view.html
	"EXPERIMENTAL_BUILD": "version expérimentale",
	"RELEASE_BUILD": "édition",
	"DEVELOPMENT_BUILD": "version de développement",
	"RELOAD_FROM_DISK": "Recharger à partir du disque",
	"KEEP_CHANGES_IN_EDITOR": "Conserver les modifications dans l’éditeur",
	"CLOSE_DONT_SAVE": "Fermer (sans enregistrer)",
	"RELAUNCH_CHROME": "Relancer Chrome",
	"ABOUT": "A propos",
	"CLOSE": "Fermer",
	"ABOUT_TEXT_LINE1": "Version {VERSION_MAJOR}.{VERSION_MINOR} {BUILD_TYPE} {VERSION}",
	"ABOUT_TEXT_BUILD_TIMESTAMP": "Horodatage de la version : ",
	"ABOUT_TEXT_LINE3": "Les mentions légales et conditions générales relatives aux logiciels tiers sont disponibles à l’adresse <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> et sont incluses dans le présent document à titre de référence.",
	"ABOUT_TEXT_LINE4": "La documentation et le code source sont disponibles à l’adresse <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
	"ABOUT_TEXT_LINE5": "Développé avec \u2764 et JavaScript par :",
	"ABOUT_TEXT_LINE6": "De nombreux contributeurs (information indisponible pour le moment).",
	"ABOUT_TEXT_WEB_PLATFORM_DOCS": "Web Platform Docs et le logo Web Platform font l’objet d’une licence Creative Commons Attribution, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
	"UPDATE_NOTIFICATION_TOOLTIP": "Une nouvelle version de {APP_NAME} est disponible. Cliquez ici pour plus de détails.",
	"UPDATE_AVAILABLE_TITLE": "Mise à jour disponible",
	"UPDATE_MESSAGE": "Une nouvelle version de {APP_NAME} est disponible. Voici quelques-unes des nouvelles fonctionnalités proposées :",
	"GET_IT_NOW": "Télécharger",
	"PROJECT_SETTINGS_TITLE": "Paramètres de projet pour : {0}",
	"PROJECT_SETTING_BASE_URL": "URL de base de l’Aperçu en direct ",
	"PROJECT_SETTING_BASE_URL_HINT": "Serveur local : entrez une URL du type http://localhost:8000/",
	"BASEURL_ERROR_INVALID_PROTOCOL": "Le protocole {0} n’est pas pris en charge par l’Aperçu en direct. Veuillez utiliser une adresse de type http: ou https: .",
	"BASEURL_ERROR_SEARCH_DISALLOWED": "L’URL de base ne peut pas contenir de paramètres de recherche tels que \"{0}\".",
	"BASEURL_ERROR_HASH_DISALLOWED": "L’URL de base ne peut pas contenir de signe dièse (\"{0}\").",
	"BASEURL_ERROR_INVALID_CHAR": "Les caractères spéciaux tels que '{0}' doivent être codés en %.",
	"BASEURL_ERROR_UNKNOWN_ERROR": "Erreur inconnue lors de l’analyse de l’URL de base",
	"EMPTY_VIEW_HEADER": "<em>Ouvrir un fichier quand ce panneau est actif</em>",

    // Strings for themes-settings.html and themes-general.html
	"CURRENT_THEME": "Thème actuel ",
	"USE_THEME_SCROLLBARS": "Utiliser les barres de défilement du thème ",
	"FONT_SIZE": "Taille de la police ",
	"FONT_FAMILY": "Famille de polices ",
	"THEMES_SETTINGS": "Paramètres des thèmes",

    // CSS Quick Edit
	"BUTTON_NEW_RULE": "Nouvelle règle",

    // Extension Management strings
	"INSTALL": "Installer",
	"UPDATE": "Mettre à jour",
	"REMOVE": "Supprimer",
	"OVERWRITE": "Remplacer",
	"CANT_REMOVE_DEV": "Les extensions du dossier \"dev\" doivent être supprimées manuellement.",
	"CANT_UPDATE": "La mise à jour n’est pas disponible avec cette version de l’application {APP_NAME}.",
	"CANT_UPDATE_DEV": "Les extensions du dossier « dev » ne peuvent pas être mises à jour automatiquement.",
	"INSTALL_EXTENSION_TITLE": "Installer l’extension",
	"UPDATE_EXTENSION_TITLE": "Mettre à jour l’extension",
	"INSTALL_EXTENSION_LABEL": "URL de l’extension ",
	"INSTALL_EXTENSION_HINT": "URL du fichier zip de l’extension ou du référentiel GitHub",
	"INSTALLING_FROM": "Installation de l’extension depuis·{0}\u2026",
	"INSTALL_SUCCEEDED": "Installation réussie !",
	"INSTALL_FAILED": "Echec de l’installation.",
	"CANCELING_INSTALL": "Annulation en cours\u2026",
	"CANCELING_HUNG": "L’annulation de l’installation prend beaucoup de temps. Il est possible qu’une erreur interne se soit produite.",
	"INSTALL_CANCELED": "Installation annulée.",
	"VIEW_COMPLETE_DESCRIPTION": "Voir la description complète",
	"VIEW_TRUNCATED_DESCRIPTION": "Voir la description tronquée",
    // These must match the error codes in ExtensionsDomain.Errors.* :
	"INVALID_ZIP_FILE": "Le contenu téléchargé n’est pas un fichier zip valide.",
	"INVALID_PACKAGE_JSON": "Le fichier package.json n’est pas valide (erreur : {0}).",
	"MISSING_PACKAGE_NAME": "Le fichier package.json n’indique pas le nom du pack.",
	"BAD_PACKAGE_NAME": "{0} n’est pas un nom de pack valide.",
	"MISSING_PACKAGE_VERSION": "Le fichier package.json n’indique pas la version du pack.",
	"INVALID_VERSION_NUMBER": "Le numéro de version du pack ({0}) n’est pas valide.",
	"INVALID_BRACKETS_VERSION": "La chaîne de compatibilité {APP_NAME} ({0}) n’est pas valide.",
	"DISALLOWED_WORDS": "Le champ {0} ne peut pas contenir les mots ({1}).",
	"API_NOT_COMPATIBLE": "L’extension n’est pas compatible avec cette version de l’application {APP_NAME}. Elle a été installée dans le dossier contenant les extensions désactivées.",
	"MISSING_MAIN": "Le pack ne contient pas de fichier main.js.",
	"EXTENSION_ALREADY_INSTALLED": "L’installation de ce pack remplacera une extension installée précédemment. Voulez-vous remplacer l’extension installée ?",
	"EXTENSION_SAME_VERSION": "Ce pack correspond à la même version que celle installée actuellement. Voulez-vous remplacer l’installation actuelle ?",
	"EXTENSION_OLDER_VERSION": "Ce pack correspond à la version {0}, qui est antérieure à la version actuellement installée ({1}). Voulez-vous remplacer l’installation actuelle ?",
	"DOWNLOAD_ID_IN_USE": "Erreur interne : l’ID de téléchargement est déjà utilisé.",
	"NO_SERVER_RESPONSE": "Impossible de se connecter au serveur.",
	"BAD_HTTP_STATUS": "Fichier introuvable sur le serveur (HTTP {0}).",
	"CANNOT_WRITE_TEMP": "Impossible d’enregistrer le téléchargement vers le fichier temporaire.",
	"ERROR_LOADING": "Une erreur s’est produite au démarrage de l’extension.",
	"MALFORMED_URL": "URL non valide. Veuillez vérifier l’URL saisie.",
	"UNSUPPORTED_PROTOCOL": "L’URL doit commencer par http ou https.",
	"UNKNOWN_ERROR": "Erreur interne inconnue.",
    // For NOT_FOUND_ERR, see generic strings above
	"EXTENSION_MANAGER_TITLE": "Gestionnaire d’extensions",
	"EXTENSION_MANAGER_ERROR_LOAD": "Impossible d’accéder au registre de l’extension. Réessayez ultérieurement.",
	"INSTALL_EXTENSION_DRAG": "Faire glisser le fichier .zip ici ou",
	"INSTALL_EXTENSION_DROP": "Déposer le fichier .zip pour lancer l’installation",
	"INSTALL_EXTENSION_DROP_ERROR": "Installation/Mise à jour interrompue en raison des erreurs suivantes :",
	"INSTALL_FROM_URL": "Installer à partir de l’URL\u2026",
	"INSTALL_EXTENSION_VALIDATING": "Validation en cours\u2026",
	"EXTENSION_AUTHOR": "Auteur",
	"EXTENSION_DATE": "Date",
	"EXTENSION_INCOMPATIBLE_NEWER": "Cette extension nécessite une version plus récente de l’application {APP_NAME}.",
	"EXTENSION_INCOMPATIBLE_OLDER": "Cette extension n’est actuellement compatible qu’avec les versions antérieures de l’application {APP_NAME}.",
	"EXTENSION_LATEST_INCOMPATIBLE_NEWER": "La version {0} de cette extension nécessite une version plus récente de {APP_NAME}. Mais vous pouvez installer la version antérieure {1}.",
	"EXTENSION_LATEST_INCOMPATIBLE_OLDER": "La version {0} de cette extension n’est compatible qu’avec les anciennes versions de {APP_NAME}. Mais vous pouvez installer la version antérieure {1}.",
	"EXTENSION_NO_DESCRIPTION": "Aucune description",
	"EXTENSION_MORE_INFO": "Plus d’infos...",
	"EXTENSION_ERROR": "Erreur d’extension",
	"EXTENSION_KEYWORDS": "Mots-clés",
	"EXTENSION_TRANSLATED_USER_LANG": "Traduit en {0} langues, y compris la vôtre",
	"EXTENSION_TRANSLATED_GENERAL": "Traduit en {0} langues",
	"EXTENSION_TRANSLATED_LANGS": "Cette extension a été traduite dans les langues suivantes : {0}",
	"EXTENSION_INSTALLED": "Installée",
	"EXTENSION_UPDATE_INSTALLED": "Cette mise à jour d’extension a été téléchargée et va être installée une fois le rechargement de {APP_NAME} effectué.",
	"EXTENSION_SEARCH_PLACEHOLDER": "Rechercher",
	"EXTENSION_MORE_INFO_LINK": "Plus",
	"BROWSE_EXTENSIONS": "Parcourir les extensions",
	"EXTENSION_MANAGER_REMOVE": "Supprimer l’extension",
	"EXTENSION_MANAGER_REMOVE_ERROR": "Impossible de supprimer une ou plusieurs extensions : {0}. {APP_NAME} va être rechargé malgré tout.",
	"EXTENSION_MANAGER_UPDATE": "Mettre à jour l’extension",
	"EXTENSION_MANAGER_UPDATE_ERROR": "Impossible de mettre à jour une ou plusieurs extensions : {0}. {APP_NAME} va être rechargé malgré tout.",
	"MARKED_FOR_REMOVAL": "Marquée pour suppression",
	"UNDO_REMOVE": "Annuler",
	"MARKED_FOR_UPDATE": "Marquée pour mise à jour",
	"UNDO_UPDATE": "Annuler",
	"CHANGE_AND_RELOAD_TITLE": "Modifier les extensions",
	"CHANGE_AND_RELOAD_MESSAGE": "Pour mettre à jour ou supprimer les extensions marquées, {APP_NAME} va devoir être rechargé. Vous serez invité à enregistrer vos modifications.",
	"REMOVE_AND_RELOAD": "Supprimer les extensions et recharger",
	"CHANGE_AND_RELOAD": "Modifier les extensions et recharger",
	"UPDATE_AND_RELOAD": "Mettre à jour les extensions et recharger",
	"PROCESSING_EXTENSIONS": "Traitement des changements d’extension\u2026",
	"EXTENSION_NOT_INSTALLED": "Impossible de supprimer l’extension {0} car elle n’est pas installée.",
	"NO_EXTENSIONS": "Aucune extension installée pour le moment.<br>Cliquez sur l’onglet Disponibles ci-dessus pour vous lancer.",
	"NO_EXTENSION_MATCHES": "Aucune extension ne correspond à votre recherche.",
	"REGISTRY_SANITY_CHECK_WARNING": "REMARQUE : ces extensions peuvent provenir d’autres sources que l’application {APP_NAME} elle-même. Les extensions ne sont pas contrôlées et disposent de privilèges locaux complets. Soyez prudents lorsque vous installez des extensions provenant d’une source inconnue.",
	"EXTENSIONS_INSTALLED_TITLE": "Installées",
	"EXTENSIONS_AVAILABLE_TITLE": "Disponibles",
	"EXTENSIONS_THEMES_TITLE": "Thèmes",
	"EXTENSIONS_UPDATES_TITLE": "Mises à jour",

	"INLINE_EDITOR_NO_MATCHES": "Aucun résultat.",
	"INLINE_EDITOR_HIDDEN_MATCHES": "Tous les résultats sont réduits. Développez les fichiers dans la liste de droite pour voir le détail.",
	"CSS_QUICK_EDIT_NO_MATCHES": "Aucune règle CSS existante ne correspond à votre sélection.<br> Cliquez sur « Nouvelle règle » pour en créer une.",
	"CSS_QUICK_EDIT_NO_STYLESHEETS": "Votre projet ne contient aucune feuille de style.<br>Créez-en une pour pouvoir ajouter des règles CSS.",

    // Custom Viewers
	"IMAGE_VIEWER_LARGEST_ICON": "maximum",

    /**
     * Unit names
     */
	"UNIT_PIXELS": "pixels",

    // extensions/default/DebugCommands
	"DEBUG_MENU": "Déboguer",
	"ERRORS": "Erreurs",
	"CMD_SHOW_DEV_TOOLS": "Afficher les outils de développement",
	"CMD_REFRESH_WINDOW": "Recharger avec les extensions",
	"CMD_RELOAD_WITHOUT_USER_EXTS": "Recharger sans les extensions",
	"CMD_NEW_BRACKETS_WINDOW": "Nouvelle fenêtre {APP_NAME}",
	"CMD_LAUNCH_SCRIPT_MAC": "[8035458] !é=Install Command Line Shortcut=!",
	"CMD_SWITCH_LANGUAGE": "Changer de langue",
	"CMD_RUN_UNIT_TESTS": "Exécuter des tests",
	"CMD_SHOW_PERF_DATA": "Afficher les données de performances",
	"CMD_ENABLE_NODE_DEBUGGER": "Activer le débogage de nœud",
	"CMD_LOG_NODE_STATE": "Noter l’état du nœud dans la console",
	"CMD_RESTART_NODE": "Redémarrer le nœud",
	"CMD_SHOW_ERRORS_IN_STATUS_BAR": "Afficher les erreurs dans la barre d’état",
	"CMD_OPEN_BRACKETS_SOURCE": "Ouvrir la source de {APP_NAME}",
    
	"CREATING_LAUNCH_SCRIPT_TITLE": "[8035459] !é={APP_NAME} Command Line Shortcut=!",
	"ERROR_CREATING_LAUNCH_SCRIPT": "[8035465] !é=An error occured while installing the command line shortcut. Please try <a href='https://github.com/adobe/brackets/wiki/Command-Line-Arguments#troubleshooting'>these troubleshooting suggestions</a>.<br/><br/>Reason: {0}=!",
	"ERROR_CLTOOLS_RMFAILED": "[8035463] !é=Unable to remove existing <code>/usr/local/bin/brackets</code> symlink.=!",
	"ERROR_CLTOOLS_MKDIRFAILED": "[8035461] !é=Unable to create <code>/usr/local/bin</code> directory.=!",
	"ERROR_CLTOOLS_LNFAILED": "[8035460] !é=Unable to create <code>/usr/local/bin/brackets</code> symlink.=!",
	"ERROR_CLTOOLS_SERVFAILED": "Erreur interne.",
	"ERROR_CLTOOLS_NOTSUPPORTED": "[8035462] !é=Command line shortcut is not supported on this OS.=!",
	"LAUNCH_SCRIPT_CREATE_SUCCESS": "[8035467] !é=Success! Now you can easily launch {APP_NAME} from the command line: <code>brackets myFile.txt</code> to open a file or <code>brackets myFolder</code> to switch projects. <br/><br/><a href='https://github.com/adobe/brackets/wiki/Command-Line-Arguments'>Learn more</a> about using {APP_NAME} from the command line.=!",

	"LANGUAGE_TITLE": "Changer de langue",
	"LANGUAGE_MESSAGE": "Langue :",
	"LANGUAGE_SUBMIT": "Recharger {APP_NAME}",
	"LANGUAGE_CANCEL": "Annuler",
	"LANGUAGE_SYSTEM_DEFAULT": "Langue par défaut du système",

    // extensions/default/HealthData
	"HEALTH_DATA_NOTIFICATION": "[8033839] !é=Health Report Preferences=!",
	"HEALTH_FIRST_POPUP_TITLE": "Rapport sur l’état de santé de Brackets",
	"HEALTH_DATA_DO_TRACK": "[8033838] !é=Share anonymous information on how I use Brackets=!",
	"HEALTH_DATA_NOTIFICATION_MESSAGE": "[8033840] !é=In order to improve Brackets, we periodically send limited, <strong>anonymous</strong> statistics to Adobe about how you use Brackets. This information helps prioritize features, find bugs, and spot usability issues.<br><br>You can see your data or choose not to share data by selecting <strong>Help > Health Report</strong>.<br><br><a href='https://github.com/adobe/brackets/wiki/Health-Data'>Learn more about Brackets Health Report</a>=!",
	"HEALTH_DATA_PREVIEW": "Rapport sur l’état de santé de Brackets",
	"HEALTH_DATA_PREVIEW_INTRO": "[8073104] !é=<p>In order to improve Brackets, we periodically send limited, <strong>anonymous</strong> statistics to Adobe about how you use Brackets. This information helps prioritize features, find bugs, and spot usability issues. <a href='https://github.com/adobe/brackets/wiki/Health-Data'>Learn more about Brackets Health Report</a> and how it benefits the Brackets community while protecting your privacy.</p><p>Below is a preview of the data that will be sent in your next Health Report <em>if</em> it is enabled.</p>=!",

    // extensions/default/InlineTimingFunctionEditor
	"INLINE_TIMING_EDITOR_TIME": "Temps",
	"INLINE_TIMING_EDITOR_PROGRESSION": "Progression",
	"BEZIER_EDITOR_INFO": "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Déplacer le point sélectionné<br><kbd class='text'>Maj</kbd> Déplacer de dix unités<br><kbd class='text'>Tabulation</kbd> Permuter les points",
	"STEPS_EDITOR_INFO": "<kbd>↑</kbd><kbd>↓</kbd> Augmenter ou réduire les pas<br><kbd>←</kbd><kbd>→</kbd> 'Démarrer' ou 'Arrêter'",
	"INLINE_TIMING_EDITOR_INVALID": "L’ancienne valeur <code>{0}</code> n’est pas valide et a donc été remplacée par <code>{1}</code> pour la fonction affichée. Le document sera mis à jour à la première modification.",

    // extensions/default/InlineColorEditor
	"COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP": "Couleur actuelle",
	"COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP": "Couleur d’origine",
	"COLOR_EDITOR_RGBA_BUTTON_TIP": "Format RGBa",
	"COLOR_EDITOR_HEX_BUTTON_TIP": "Format Hex",
	"COLOR_EDITOR_HSLA_BUTTON_TIP": "Format HSLa",
	"COLOR_EDITOR_USED_COLOR_TIP_SINGULAR": "{0} (utilisé {1} fois)",
	"COLOR_EDITOR_USED_COLOR_TIP_PLURAL": "{0} (utilisé {1} fois)",

    // extensions/default/JavaScriptCodeHints
	"CMD_JUMPTO_DEFINITION": "Accéder à la définition",
	"CMD_SHOW_PARAMETER_HINT": "Afficher l’indicateur de paramètre",
	"NO_ARGUMENTS": "<aucun paramètre>",
	"DETECTED_EXCLUSION_TITLE": "Problème d’inférence de fichier Javascript",
	"DETECTED_EXCLUSION_INFO": "{APP_NAME} a rencontré des problèmes lors du traitement du fichier <span class='dialog-filename'>{0}</span>.<br><br>La fonction d’accès aux définitions, les indicateurs de code et la fonction Edition rapide de ce fichier ne seront plus traités. Pour réactiver ce fichier, ouvrez <code>.brackets.json</code> dans votre projet et éditez la section <code>jscodehints.detectedExclusions</code>.<br><br>Il s’agit vraisemblablement d’un bug au niveau de l’application {APP_NAME}. Si vous pouvez nous transmettre une copie de ce fichier, merci de <a href='https://github.com/adobe/brackets/wiki/How-to-Report-an-Issue'>consigner un bug</a> en fournissant un lien vers le fichier en question.",

    // extensions/default/JSLint
	"JSLINT_NAME": "JSLint",

    // extensions/default/QuickView
	"CMD_ENABLE_QUICK_VIEW": "Affichage rapide au survol",

    // extensions/default/RecentProjects
	"CMD_TOGGLE_RECENT_PROJECTS": "Projets récents",

    // extensions/default/WebPlatformDocs
	"DOCS_MORE_LINK": "En savoir plus",

    // extensions/default/CodeFolding
	"COLLAPSE_ALL": "Réduire tout",
	"EXPAND_ALL": "Développer tout",
	"COLLAPSE_CURRENT": "Réduire l’élément actif",
	"EXPAND_CURRENT": "Développer l’élément actif"
});
