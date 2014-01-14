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
	"NOT_FOUND_ERR": "Fichier introuvable.",
	"NOT_READABLE_ERR": "Impossible de lire le fichier.",
	"NO_MODIFICATION_ALLOWED_ERR": "Le répertoire cible ne peut pas être modifié.",
	"NO_MODIFICATION_ALLOWED_ERR_FILE": "Vous n’êtes pas autorisé à effectuer des modifications.",
	"CONTENTS_MODIFIED_ERR": "Le fichier a été modifié dans une application autre que {APP_NAME}.",
	"FILE_EXISTS_ERR": "Le fichier ou le répertoire existe déjà.",
	"FILE": "fichier",
	"DIRECTORY": "répertoire",

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
	"ERROR_RENAMING_FILE_TITLE": "Erreur lors du changement de nom du fichier",
	"ERROR_RENAMING_FILE": "Une erreur s’est produite lorsque vous avez tenté de renommer le fichier <span class='dialog-filename'>{0}</span>. {1}",
	"ERROR_DELETING_FILE_TITLE": "Erreur lors de la suppression du fichier",
	"ERROR_DELETING_FILE": "Une erreur s’est produite lors de la tentative de suppression du fichier <span class='dialog-filename'>{0}</span>. {1}",
	"INVALID_FILENAME_TITLE": "Nom de {0} incorrect",
	"INVALID_FILENAME_MESSAGE": "Les noms de fichier ne peuvent pas contenir les caractères suivants : /?*:;{}<>\\| ou utiliser des termes réservés au système.",
	"FILE_ALREADY_EXISTS": "Le {0} <span class='dialog-filename'>{1}</span> existe déjà.",
	"ERROR_CREATING_FILE_TITLE": "Erreur lors de la création du {0}",
	"ERROR_CREATING_FILE": "Une erreur s’est produite lors de la tentative de création du {0} <span class='dialog-filename'>{1}</span>. {2}",

    // Application error strings
	"ERROR_IN_BROWSER_TITLE": "Malheureusement, {APP_NAME} n’est pas encore compatible avec les navigateurs.",
	"ERROR_IN_BROWSER": "{APP_NAME} est défini en HTML, mais il s’exécute actuellement en tant qu’application de bureau, vous pouvez donc l’utiliser afin de modifier des fichiers locaux. Utilisez l’interpréteur de commandes d’application situé dans le référentiel <b>github.com/adobe/brackets-shell</b> afin d’exécuter {APP_NAME}.",
    
    // ProjectManager max files error string
	"ERROR_MAX_FILES_TITLE": "Erreur lors de l’indexation des fichiers",
	"ERROR_MAX_FILES": "Vous avez atteint le nombre maximum de fichiers indexés. Il est possible que les actions impliquant une recherche des fichiers dans l’index ne fonctionnent pas correctement.",

    // Live Development error strings
	"ERROR_LAUNCHING_BROWSER_TITLE": "Erreur lors du lancement du navigateur",
	"ERROR_CANT_FIND_CHROME": "Le navigateur Google Chrome est introuvable. Assurez-vous qu’il est installé.",
	"ERROR_LAUNCHING_BROWSER": "Une erreur s’est produite lors du lancement du navigateur. (Erreur {0})",
    
	"LIVE_DEVELOPMENT_ERROR_TITLE": "Erreur du module Aperçu en direct",
	"LIVE_DEVELOPMENT_RELAUNCH_TITLE": "Connexion au navigateur",
	"LIVE_DEVELOPMENT_ERROR_MESSAGE": "Pour que le module Aperçu en direct puisse se connecter, vous devez relancer Chrome en activant la fonction de débogage à distance.<br /><br />Voulez-vous relancer Chrome et activer le débogage à distance ?",
	"LIVE_DEV_LOADING_ERROR_MESSAGE": "Impossible de charger la page Live Development",
	"LIVE_DEV_NEED_HTML_MESSAGE": "Ouvrez un fichier HTML ou vérifiez qu’il y a un fichier index.html dans votre projet pour pouvoir lancer l’aperçu en direct.",
	"LIVE_DEV_NEED_BASEURL_MESSAGE": "Pour lancer l’Aperçu en direct avec un fichier de serveur, vous devez indiquer une URL de base pour ce projet.",
	"LIVE_DEV_SERVER_NOT_READY_MESSAGE": "Une erreur s’est produite au démarrage du serveur HTTP pour les fichiers de développement en direct. Veuillez réessayer.",
	"LIVE_DEVELOPMENT_INFO_TITLE": "Bienvenue dans le module Aperçu en direct !",
	"LIVE_DEVELOPMENT_INFO_MESSAGE": "Le module Aperçu en direct connecte {APP_NAME} à votre navigateur. Il ouvre un aperçu de votre fichier HTML dans le navigateur, puis le met à jour instantanément dès que vous modifiez le code.<br /><br />Dans cette première version du logiciel {APP_NAME}, le module Aperçu en direct ne fonctionne qu’avec <strong>Google Chrome</strong> et affiche les mises à jour en direct, dès que vous modifiez des <strong>fichiers CSS ou HTML</strong>. Les modifications apportées aux fichiers JavaScript sont automatiquement rechargées lorsque vous enregistrez.<br /><br />(Ce message ne s’affichera qu’une seule fois.)",
	"LIVE_DEVELOPMENT_TROUBLESHOOTING": "Pour plus d’informations, consultez la page <a href='{0}' title='{0}'>Résolution des erreurs de connexion Live Development</a>.",
    
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
	"EXT_MODIFIED_WARNING": "<span class='dialog-filename'>{0}</span> a été modifié sur le disque.<br /><br />Voulez-vous enregistrer le fichier et remplacer ces modifications ?",
	"EXT_MODIFIED_MESSAGE": "Le fichier <span class='dialog-filename'>{0}</span> a été modifié sur le disque mais présente également des modifications non enregistrées dans {APP_NAME}.<br /><br />Quelle version souhaitez-vous conserver ?",
	"EXT_DELETED_MESSAGE": "Le fichier <span class='dialog-filename'>{0}</span> a été supprimé sur le disque mais présente des modifications non enregistrées dans {APP_NAME}.<br /><br />Souhaitez-vous conserver vos modifications ?",
    
    // Generic dialog/button labels
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
	"FIND_RESULT_COUNT": "{0} résultats",
	"FIND_RESULT_COUNT_SINGLE": "1 résultat",
	"FIND_NO_RESULTS": "Aucun résultat",
	"REPLACE_PLACEHOLDER": "Remplacer par\u2026",
	"BUTTON_REPLACE_ALL": "Tout\u2026",
	"BUTTON_REPLACE": "Remplacer",
	"BUTTON_NEXT": "\u25B6",
	"BUTTON_PREV": "\u25C0",
	"BUTTON_NEXT_HINT": "Résultat suivant",
	"BUTTON_PREV_HINT": "Résultat précédent",
	"BUTTON_CASESENSITIVE_HINT": "Respecter la casse",
	"BUTTON_REGEXP_HINT": "Expression régulière",

	"OPEN_FILE": "Ouvrir le fichier",
	"SAVE_FILE_AS": "Enregistrer le fichier",
	"CHOOSE_FOLDER": "Choisir un dossier",

	"RELEASE_NOTES": "Notes de mise à jour",
	"NO_UPDATE_TITLE": "Votre logiciel est à jour !",
	"NO_UPDATE_MESSAGE": "Vous utilisez la dernière version de {APP_NAME}.",

    // Replace All (in single file)
	"FIND_REPLACE_TITLE_PART1": "Remplacer « ",
	"FIND_REPLACE_TITLE_PART2": " » par « ",
	"FIND_REPLACE_TITLE_PART3": " » &mdash; {2} {0} {1}",

    // Find in Files
	"FIND_IN_FILES_TITLE_PART1": "« ",
	"FIND_IN_FILES_TITLE_PART2": " » trouvé",
	"FIND_IN_FILES_TITLE_PART3": "&mdash; {0} {1} {2} dans {3} {4}",
	"FIND_IN_FILES_SCOPED": "dans <span class='dialog-filename'>{0}</span>",
	"FIND_IN_FILES_NO_SCOPE": "dans le projet",
	"FIND_IN_FILES_FILE": "fichier",
	"FIND_IN_FILES_FILES": "fichiers",
	"FIND_IN_FILES_MATCH": "résultat",
	"FIND_IN_FILES_MATCHES": "résultats",
	"FIND_IN_FILES_MORE_THAN": "Plus de ",
	"FIND_IN_FILES_PAGING": "{0}&mdash;{1}",
	"FIND_IN_FILES_FILE_PATH": "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>",
	"ERROR_FETCHING_UPDATE_INFO_TITLE": "Erreur de récupération des informations de mise à jour",
	"ERROR_FETCHING_UPDATE_INFO_MSG": "Un problème est survenu lors de la récupération des dernières informations de mise à jour sur le serveur. Vérifiez que vous êtes connecté à Internet et réessayez.",

    /**
     * ProjectManager
     */
	"PROJECT_LOADING": "Chargement\u2026",
	"UNTITLED": "Sans titre",
	"WORKING_FILES": "Fichiers de travail",

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
	"STATUSBAR_INDENT_TOOLTIP_SPACES": "Cliquez ici pour remplacer la mise en retrait par des espaces.",
	"STATUSBAR_INDENT_TOOLTIP_TABS": "Cliquez ici pour remplacer la mise en retrait par des tabulations.",
	"STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES": "Cliquez ici pour changer le nombre d’espaces utilisés lors de la mise en retrait.",
	"STATUSBAR_INDENT_SIZE_TOOLTIP_TABS": "Cliquez ici pour modifier la largeur du caractère de tabulation.",
	"STATUSBAR_SPACES": "Espaces :",
	"STATUSBAR_TAB_SIZE": "Taille de tabulation :",
	"STATUSBAR_LINE_COUNT_SINGULAR": "\u2014 {0} ligne",
	"STATUSBAR_LINE_COUNT_PLURAL": "\u2014 {0} lignes",
	"STATUSBAR_USER_EXTENSIONS_DISABLED": "Extensions désactivées",

    // CodeInspection: errors/warnings
	"ERRORS_PANEL_TITLE_MULTIPLE": "{0} problèmes",
	"SINGLE_ERROR": "1 problème {0}",
	"MULTIPLE_ERRORS": "{1} problèmes {0}",
	"NO_ERRORS": "Aucun problème {0} détecté, félicitations !",
	"NO_ERRORS_MULTIPLE_PROVIDER": "Aucun problème détecté, félicitations !",
	"LINT_DISABLED": "L’analyse lint est désactivée",
	"NO_LINT_AVAILABLE": "Aucun programme lint disponible pour {0}",
	"NOTHING_TO_LINT": "Rien à analyser",
    
    
    /**
     * Command Name Constants
     */

    // File menu commands
	"FILE_MENU": "Fichier",
	"CMD_FILE_NEW_UNTITLED": "Nouveau",
	"CMD_FILE_NEW": "Nouveau fichier",
	"CMD_FILE_NEW_FOLDER": "Nouveau dossier",
	"CMD_FILE_OPEN": "Ouvrir\u2026",
	"CMD_ADD_TO_WORKING_SET": "Ajouter à l’ensemble de travail",
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
	"CMD_PROJECT_SETTINGS": "Paramètres du projet\u2026",
	"CMD_FILE_RENAME": "Renommer",
	"CMD_FILE_DELETE": "Supprimer",
	"CMD_INSTALL_EXTENSION": "Installer une extension\u2026",
	"CMD_EXTENSION_MANAGER": "Le gestionnaire d'extensions\u2026",
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
	"CMD_FIND": "Rechercher",
	"CMD_FIND_FIELD_PLACEHOLDER": "Rechercher\u2026",
	"CMD_FIND_IN_FILES": "Rechercher dans les fichiers",
	"CMD_FIND_IN_SUBTREE": "Rechercher dans\u2026",
	"CMD_FIND_NEXT": "Rechercher suivant",
	"CMD_FIND_PREVIOUS": "Rechercher précédent",
	"CMD_REPLACE": "Remplacer",
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
	"CMD_SORT_WORKINGSET_BY_ADDED": "Trier par date d’ajout",
	"CMD_SORT_WORKINGSET_BY_NAME": "Trier par nom",
	"CMD_SORT_WORKINGSET_BY_TYPE": "Trier par type",
	"CMD_SORT_WORKINGSET_AUTO": "Tri automatique",

    // Navigate menu Commands
	"NAVIGATE_MENU": "Naviguer",
	"CMD_QUICK_OPEN": "Ouverture rapide",
	"CMD_GOTO_LINE": "Atteindre la ligne",
	"CMD_GOTO_DEFINITION": "Accès rapide à la définition",
	"CMD_GOTO_FIRST_PROBLEM": "Aller à la première erreur/au premier avertissement",
	"CMD_TOGGLE_QUICK_EDIT": "Edition rapide",
	"CMD_TOGGLE_QUICK_DOCS": "Documentation rapide",
	"CMD_QUICK_EDIT_PREV_MATCH": "Correspondance précédente",
	"CMD_QUICK_EDIT_NEXT_MATCH": "Correspondance suivante",
	"CMD_CSS_QUICK_EDIT_NEW_RULE": "Nouvelle règle",
	"CMD_NEXT_DOC": "Document suivant",
	"CMD_PREV_DOC": "Document précédent",
	"CMD_SHOW_IN_TREE": "Afficher dans l’arborescence de fichiers",
	"CMD_SHOW_IN_OS": "Afficher dans le SE",
    
    // Help menu commands
	"HELP_MENU": "Aide",
	"CMD_CHECK_FOR_UPDATE": "Rechercher les mises à jour",
	"CMD_HOW_TO_USE_BRACKETS": "Comment utiliser {APP_NAME}",
	"CMD_FORUM": "Forum {APP_NAME}",
	"CMD_RELEASE_NOTES": "Notes de mise à jour",
	"CMD_REPORT_AN_ISSUE": "Signaler un problème",
	"CMD_SHOW_EXTENSIONS_FOLDER": "Afficher le dossier d’extensions",
	"CMD_TWITTER": "{TWITTER_NAME} sur Twitter",
	"CMD_ABOUT": "A propos de {APP_TITLE}",

    // Strings for main-view.html
	"EXPERIMENTAL_BUILD": "version expérimentale",
	"DEVELOPMENT_BUILD": "version de développement",
	"RELOAD_FROM_DISK": "Recharger à partir du disque",
	"KEEP_CHANGES_IN_EDITOR": "Conserver les modifications dans l’éditeur",
	"CLOSE_DONT_SAVE": "Fermer (sans enregistrer)",
	"RELAUNCH_CHROME": "Relancer Chrome",
	"ABOUT": "A propos",
	"CLOSE": "Fermer",
	"ABOUT_TEXT_LINE1": "Sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
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
    
    // CSS Quick Edit
	"BUTTON_NEW_RULE": "Nouvelle règle",
    
    // Extension Management strings
	"INSTALL": "Installer",
	"UPDATE": "Mettre à jour",
	"REMOVE": "Supprimer",
	"OVERWRITE": "Remplacer",
	"CANT_REMOVE_DEV": "Les extensions du dossier \"dev\" doivent être supprimées manuellement.",
	"CANT_UPDATE": "La mise à jour n’est pas disponible avec cette version de l’application {APP_NAME}.",
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
	"EXTENSION_MANAGER_TITLE": "Le gestionnaire d'extensions",
	"EXTENSION_MANAGER_ERROR_LOAD": "Impossible d’accéder au registre de l’extension. Réessayez ultérieurement.",
	"INSTALL_FROM_URL": "Installer à partir de l’URL\u2026",
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
	"EXTENSION_INSTALLED": "Installée",
	"EXTENSION_UPDATE_INSTALLED": "Cette mise à jour d’extension a été téléchargée et sera installée lorsque vous quitterez {APP_NAME}.",
	"EXTENSION_SEARCH_PLACEHOLDER": "Rechercher",
	"EXTENSION_MORE_INFO_LINK": "Plus",
	"BROWSE_EXTENSIONS": "Parcourir les extensions",
	"EXTENSION_MANAGER_REMOVE": "Supprimer l’extension",
	"EXTENSION_MANAGER_REMOVE_ERROR": "Impossible de supprimer une ou plusieurs extensions : {0}. {APP_NAME} va être fermé malgré tout.",
	"EXTENSION_MANAGER_UPDATE": "Mettre à jour l’extension",
	"EXTENSION_MANAGER_UPDATE_ERROR": "Impossible de mettre à jour une ou plusieurs extensions : {0}. {APP_NAME} va être fermé malgré tout.",
	"MARKED_FOR_REMOVAL": "Marquée pour suppression",
	"UNDO_REMOVE": "Annuler",
	"MARKED_FOR_UPDATE": "Marquée pour mise à jour",
	"UNDO_UPDATE": "Annuler",
	"CHANGE_AND_QUIT_TITLE": "Modifier les extensions",
	"CHANGE_AND_QUIT_MESSAGE": "Pour mettre à jour ou supprimer les extensions marquées, vous devez quitter puis relancer {APP_NAME}. Vous serez invité à enregistrer vos modifications.",
	"REMOVE_AND_QUIT": "Supprimer les extensions et quitter",
	"CHANGE_AND_QUIT": "Modifier les extensions et quitter",
	"UPDATE_AND_QUIT": "Mettre à jour les extensions et quitter",
	"PROCESSING_EXTENSIONS": "Traitement des changements d’extension\u2026",
	"EXTENSION_NOT_INSTALLED": "Impossible de supprimer l’extension {0} car elle n’est pas installée.",
	"NO_EXTENSIONS": "Aucune extension installée pour le moment.<br>Cliquez sur l’onglet Disponibles ci-dessus pour vous lancer.",
	"NO_EXTENSION_MATCHES": "Aucune extension ne correspond à votre recherche.",
	"REGISTRY_SANITY_CHECK_WARNING": "Soyez prudent lorsque vous installez des extensions provenant d’une source inconnue.",
	"EXTENSIONS_INSTALLED_TITLE": "Installées",
	"EXTENSIONS_AVAILABLE_TITLE": "Disponibles",
	"EXTENSIONS_UPDATES_TITLE": "Mises à jour",
    
	"INLINE_EDITOR_NO_MATCHES": "Aucun résultat.",
	"CSS_QUICK_EDIT_NO_MATCHES": "Aucune règle CSS existante ne correspond à votre sélection.<br> Cliquez sur « Nouvelle règle » pour en créer une.",
	"CSS_QUICK_EDIT_NO_STYLESHEETS": "Votre projet ne contient aucune feuille de style.<br>Créez-en une pour pouvoir ajouter des règles CSS.",
    
    /**
     * Unit names
     */

	"UNIT_PIXELS": "pixels",

    // extensions/default/DebugCommands
	"DEBUG_MENU": "Déboguer",
	"CMD_SHOW_DEV_TOOLS": "Afficher les outils de développement",
	"CMD_REFRESH_WINDOW": "Recharger avec les extensions",
	"CMD_RELOAD_WITHOUT_USER_EXTS": "Recharger sans les extensions",
	"CMD_NEW_BRACKETS_WINDOW": "Nouvelle fenêtre {APP_NAME}",
	"CMD_SWITCH_LANGUAGE": "Changer de langue",
	"CMD_RUN_UNIT_TESTS": "Exécuter des tests",
	"CMD_SHOW_PERF_DATA": "Afficher les données de performances",
	"CMD_ENABLE_NODE_DEBUGGER": "Activer le débogage de nœud",
	"CMD_LOG_NODE_STATE": "Noter l’état du nœud dans la console",
	"CMD_RESTART_NODE": "Redémarrer le nœud",
    
	"LANGUAGE_TITLE": "Changer de langue",
	"LANGUAGE_MESSAGE": "Langue :",
	"LANGUAGE_SUBMIT": "Recharger {APP_NAME}",
	"LANGUAGE_CANCEL": "Annuler",
	"LANGUAGE_SYSTEM_DEFAULT": "Langue par défaut du système",
    
    // Locales (used by Debug > Switch Language)
	"LOCALE_CS": "Tchèque",
	"LOCALE_DE": "Allemand",
	"LOCALE_EL": "Grec",
	"LOCALE_EN": "Anglais",
	"LOCALE_ES": "Espagnol",
	"LOCALE_FI": "Finnois",
	"LOCALE_FR": "Français",
	"LOCALE_IT": "Italien",
	"LOCALE_JA": "Japonais",
	"LOCALE_NB": "Norvégien",
	"LOCALE_NL": "Hollandais",
	"LOCALE_FA_IR": "Persan/Farsi",
	"LOCALE_PL": "Polonais",
	"LOCALE_PT_BR": "Portugais (Brésil)",
	"LOCALE_PT_PT": "Portugais",
	"LOCALE_RO": "Roumain",
	"LOCALE_RU": "Russe",
	"LOCALE_SK": "Slovaque",
	"LOCALE_SR": "Serbe",
	"LOCALE_SV": "Suédois",
	"LOCALE_TR": "Turc",
	"LOCALE_ZH_CN": "Chinois (simplifié)",
	"LOCALE_HU": "Hongrois",
	"LOCALE_KO": "Coréen",
    
    // extensions/default/InlineTimingFunctionEditor
	"INLINE_TIMING_EDITOR_TIME": "Temps",
	"INLINE_TIMING_EDITOR_PROGRESSION": "Progression",
	"BEZIER_EDITOR_INFO": "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Déplacer le point sélectionné<br><kbd class='text'>Décaler</kbd> Déplacer de dix unités",
	"STEPS_EDITOR_INFO": "<kbd>↑</kbd><kbd>↓</kbd> Augmenter ou réduire les pas<br><kbd>←</kbd><kbd>→</kbd> 'Démarrer' ou 'Arrêter'",
    
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
    
    // extensions/default/JSLint
	"JSLINT_NAME": "JSLint",
    
    // extensions/default/QuickView
	"CMD_ENABLE_QUICK_VIEW": "Affichage rapide au survol",
    
    // extensions/default/RecentProjects
	"CMD_TOGGLE_RECENT_PROJECTS": "Projets récents",
    
    // extensions/default/WebPlatformDocs
	"DOCS_MORE_LINK": "En savoir plus"
});
