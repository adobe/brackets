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
	"FILE_EXISTS_ERR": "Le fichier ou le répertoire existe déjà.",

    // Project error strings
	"ERROR_LOADING_PROJECT": "Erreur lors du chargement du projet",
	"OPEN_DIALOG_ERROR": "Une erreur s’est produite lors de l’affichage de la boîte de dialogue Ouvrir. (Erreur {0})",
	"REQUEST_NATIVE_FILE_SYSTEM_ERROR": "Une erreur s’est produite lors de la tentative de chargement du répertoire <span class='dialog-filename'>{0}</span>. (Erreur {1})",
	"READ_DIRECTORY_ENTRIES_ERROR": "Une erreur s’est produite lors de la lecture du contenu du répertoire <span class='dialog-filename'>{0}</span>. (Erreur {1})",

    // File open/save error string
	"ERROR_OPENING_FILE_TITLE": "Erreur lors de l’ouverture du fichier",
	"ERROR_OPENING_FILE": "Une erreur s’est produite lors de la tentative d’ouverture du fichier <span class='dialog-filename'>{0}</span>. {1}",
	"ERROR_RELOADING_FILE_TITLE": "Erreur lors du rechargement des modifications à partir du disque",
	"ERROR_RELOADING_FILE": "Une erreur s’est produite lors de la tentative de rechargement du fichier <span class='dialog-filename'>{0}</span>. {1}",
	"ERROR_SAVING_FILE_TITLE": "Erreur lors de l’enregistrement du fichier",
	"ERROR_SAVING_FILE": "Une erreur s’est produite lors de la tentative d’enregistrement du fichier <span class='dialog-filename'>{0}</span>. {1}",
	"ERROR_RENAMING_FILE_TITLE": "Erreur lors du changement de nom du fichier",
	"ERROR_RENAMING_FILE": "Une erreur s’est produite lorsque vous avez tenté de renommer le fichier <span class='dialog-filename'>{0}</span>. {1}",
	"ERROR_DELETING_FILE_TITLE": "Erreur lors de la suppression du fichier",
	"ERROR_DELETING_FILE": "Une erreur s’est produite lors de la tentative de suppression du fichier <span class='dialog-filename'>{0}</span>. {1}",
	"INVALID_FILENAME_TITLE": "Nom de fichier non valide",
	"INVALID_FILENAME_MESSAGE": "Les noms de fichier ne peuvent pas contenir les caractères suivants : /?*:;{}<>\\|",
	"FILE_ALREADY_EXISTS": "Le fichier <span class='dialog-filename'>{0}</span> existe déjà.",
	"ERROR_CREATING_FILE_TITLE": "Erreur lors de la création du fichier",
	"ERROR_CREATING_FILE": "Une erreur s’est produite lors de la tentative de création du fichier <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
	"ERROR_IN_BROWSER_TITLE": "Malheureusement, {APP_NAME} n’est pas encore compatible avec les navigateurs.",
	"ERROR_IN_BROWSER": "{APP_NAME} est défini en HTML, mais il s’exécute actuellement en tant qu’application de bureau, vous pouvez donc l’utiliser afin de modifier des fichiers locaux. Utilisez l’interpréteur de commandes d’application situé dans le référentiel <b>github.com/adobe/brackets-shell</b> afin d’exécuter {APP_NAME}.",

    // FileIndexManager error string
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
	"LIVE_DEV_NEED_HTML_MESSAGE": "Ouvrez un fichier HTML pour lancer l’aperçu en direct.",
	"LIVE_DEV_NEED_BASEURL_MESSAGE": "Pour lancer l’Aperçu en direct avec un fichier de serveur, vous devez indiquer une URL de base pour ce projet.",
	"LIVE_DEV_SERVER_NOT_READY_MESSAGE": "Une erreur s’est produite au démarrage du serveur HTTP pour les fichiers de développement en direct. Veuillez réessayer.",
	"LIVE_DEVELOPMENT_INFO_TITLE": "Bienvenue dans le module Aperçu en direct !",
	"LIVE_DEVELOPMENT_INFO_MESSAGE": "Le module Aperçu en direct connecte {APP_NAME} à votre navigateur. Il ouvre un aperçu de votre fichier HTML dans le navigateur, puis le met à jour instantanément dès que vous modifiez le code.<br /><br />Dans cette première version du logiciel {APP_NAME}, le module Aperçu en direct ne fonctionne qu’avec <strong>Google Chrome</strong> et affiche les mises à jour en direct, dès que vous modifiez des <strong>fichiers CSS</strong>. Les modifications apportées aux fichiers HTML et JavaScript sont automatiquement rechargées lorsque vous enregistrez.<br /><br />(Ce message ne s’affichera qu’une seule fois.)",
	"LIVE_DEVELOPMENT_TROUBLESHOOTING": "Pour en savoir plus, reportez-vous à la rubrique <a class=\"clickable-link\" data-href=\"{0}\">Dépannage des erreurs de connexion Live Development</a>.",
    
	"LIVE_DEV_STATUS_TIP_NOT_CONNECTED": "Aperçu en direct",
	"LIVE_DEV_STATUS_TIP_PROGRESS1": "Aperçu en direct : Connexion\u2026",
	"LIVE_DEV_STATUS_TIP_PROGRESS2": "Aperçu en direct : Initialisation\u2026",
	"LIVE_DEV_STATUS_TIP_CONNECTED": "Déconnecter le module Aperçu en direct",
	"LIVE_DEV_STATUS_TIP_OUT_OF_SYNC": "Aperçu en direct : cliquez ici pour déconnecter (enregistrez le fichier pour lancer la mise à jour).",

	"LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS": "Aperçu en direct a été annulé car les outils de développeur du navigateur étaient ouverts",
	"LIVE_DEV_DETACHED_TARGET_CLOSED": "Aperçu en direct a été annulé car la page était fermée dans le navigateur",
	"LIVE_DEV_NAVIGATED_AWAY": "Aperçu en direct a été annulé car le navigateur a accédé à une page qui ne fait pas partie du projet actuel",
	"LIVE_DEV_CLOSED_UNKNOWN_REASON": "Aperçu en direct a été annulé pour une raison inconnue ({0})",
    
	"SAVE_CLOSE_TITLE": "Enregistrer les modifications",
	"SAVE_CLOSE_MESSAGE": "Souhaitez-vous enregistrer les modifications apportées au document <span class='dialog-filename'>{0}</span> ?",
	"SAVE_CLOSE_MULTI_MESSAGE": "Souhaitez-vous enregistrer les modifications apportées aux fichiers suivants ?",
	"EXT_MODIFIED_TITLE": "Modifications externes",
	"EXT_MODIFIED_MESSAGE": "Le fichier <span class='dialog-filename'>{0}</span> a été modifié sur le disque mais présente également des modifications non enregistrées dans {APP_NAME}.<br /><br />Quelle version souhaitez-vous conserver ?",
	"EXT_DELETED_MESSAGE": "Le fichier <span class='dialog-filename'>{0}</span> a été supprimé sur le disque mais présente des modifications non enregistrées dans {APP_NAME}.<br /><br />Souhaitez-vous conserver vos modifications ?",
    
    // Find, Replace, Find in Files
	"SEARCH_REGEXP_INFO": "Utiliser la syntaxe /re/ pour la recherche regexp",
	"FIND_RESULT_COUNT": "{0} résultats",
	"WITH": "Avec",
	"BUTTON_YES": "Oui",
	"BUTTON_NO": "Non",
	"BUTTON_STOP": "Arrêter",

	"OPEN_FILE": "Ouvrir le fichier",
	"CHOOSE_FOLDER": "Choisir un dossier",

	"RELEASE_NOTES": "Notes de mise à jour",
	"NO_UPDATE_TITLE": "Votre logiciel est à jour.",
	"NO_UPDATE_MESSAGE": "Vous utilisez la dernière version de {APP_NAME}.",
    
	"FIND_IN_FILES_TITLE": "\"{4}\" {5} - {0} {1} dans {2} {3}",
	"FIND_IN_FILES_SCOPED": "dans <span class='dialog-filename'>{0}</span>",
	"FIND_IN_FILES_NO_SCOPE": "dans le projet",
	"FIND_IN_FILES_FILE": "fichier",
	"FIND_IN_FILES_FILES": "fichiers",
	"FIND_IN_FILES_MATCH": "résultat",
	"FIND_IN_FILES_MATCHES": "résultats",
	"FIND_IN_FILES_MORE_THAN": "Plus de ",
	"FIND_IN_FILES_MAX": " (affichage des {0} premiers résultats)",
	"FIND_IN_FILES_FILE_PATH": "Fichier : <span class='dialog-filename'>{0}</span>",
	"FIND_IN_FILES_LINE": "Ligne :&nbsp;{0}",

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
	"STATUSBAR_INDENT_TOOLTIP_SPACES": "Cliquez ici pour remplacer la mise en retrait par des espaces.",
	"STATUSBAR_INDENT_TOOLTIP_TABS": "Cliquez ici pour remplacer la mise en retrait par des tabulations.",
	"STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES": "Cliquez ici pour changer le nombre d’espaces utilisés lors de la mise en retrait.",
	"STATUSBAR_INDENT_SIZE_TOOLTIP_TABS": "Cliquez ici pour modifier la largeur du caractère de tabulation.",
	"STATUSBAR_SPACES": "Espaces",
	"STATUSBAR_TAB_SIZE": "Taille de tabulation",
	"STATUSBAR_LINE_COUNT_SINGULAR": "{0} ligne",
	"STATUSBAR_LINE_COUNT_PLURAL": "{0} lignes",

    /**
     * Command Name Constants
     */

    // File menu commands
	"FILE_MENU": "Fichier",
	"CMD_FILE_NEW": "Nouveau fichier",
	"CMD_FILE_NEW_FOLDER": "Nouveau dossier",
	"CMD_FILE_OPEN": "Ouvrir\u2026",
	"CMD_ADD_TO_WORKING_SET": "Ajouter à l’ensemble de travail",
	"CMD_OPEN_FOLDER": "Ouvrir un dossier\u2026",
	"CMD_FILE_CLOSE": "Fermer",
	"CMD_FILE_CLOSE_ALL": "Tout fermer",
	"CMD_FILE_SAVE": "Enregistrer",
	"CMD_FILE_SAVE_ALL": "Enregistrer tout",
	"CMD_LIVE_FILE_PREVIEW": "Aperçu en direct",
	"CMD_LIVE_HIGHLIGHT": "Surlignage en direct",
	"CMD_PROJECT_SETTINGS": "Paramètres du projet\u2026",
	"CMD_FILE_RENAME": "Renommer",
	"CMD_FILE_DELETE": "Supprimer",
	"CMD_INSTALL_EXTENSION": "Installer une extension\u2026",
	"CMD_EXTENSION_MANAGER": "Extension Manager\u2026",
	"CMD_FILE_REFRESH": "Actualiser",
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
	"CMD_SORT_WORKINGSET_BY_ADDED": "Trier par date d’ajout",
	"CMD_SORT_WORKINGSET_BY_NAME": "Trier par nom",
	"CMD_SORT_WORKINGSET_BY_TYPE": "Trier par type",
	"CMD_SORT_WORKINGSET_AUTO": "Tri automatique",

    // Navigate menu Commands
	"NAVIGATE_MENU": "Naviguer",
	"CMD_QUICK_OPEN": "Ouverture rapide",
	"CMD_GOTO_LINE": "Atteindre la ligne",
	"CMD_GOTO_DEFINITION": "Accès rapide à la définition",
	"CMD_TOGGLE_QUICK_EDIT": "Edition rapide",
	"CMD_TOGGLE_QUICK_DOCS": "Documentation rapide",
	"CMD_QUICK_EDIT_PREV_MATCH": "Correspondance précédente",
	"CMD_QUICK_EDIT_NEXT_MATCH": "Correspondance suivante",
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


    // Special commands invoked by the native shell
	"CMD_CLOSE_WINDOW": "Fermer la fenêtre",
	"CMD_ABORT_QUIT": "Annuler la fermeture",

    // Strings for main-view.html
	"EXPERIMENTAL_BUILD": "version expérimentale",
	"DEVELOPMENT_BUILD": "version de développement",
	"SEARCH_RESULTS": "Résultats de la recherche",
	"OK": "OK",
	"DONT_SAVE": "Ne pas enregistrer",
	"SAVE": "Enregistrer",
	"CANCEL": "Annuler",
	"RELOAD_FROM_DISK": "Recharger à partir du disque",
	"KEEP_CHANGES_IN_EDITOR": "Conserver les modifications dans l’éditeur",
	"CLOSE_DONT_SAVE": "Fermer (sans enregistrer)",
	"RELAUNCH_CHROME": "Relancer Chrome",
	"ABOUT": "A propos",
	"CLOSE": "Fermer",
	"ABOUT_TEXT_LINE1": "Sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
	"ABOUT_TEXT_LINE3": "Notices, terms and conditions pertaining to third party software are located at <a class=\"clickable-link\" data-href=\"{ADOBE_THIRD_PARTY}\">{ADOBE_THIRD_PARTY}</a> and incorporated by reference herein.",
	"ABOUT_TEXT_LINE4": "La documentation et la source sont disponibles à l’adresse <a class=\"clickable-link\" data-href=\"https://github.com/adobe/brackets/\">https://github.com/adobe/brackets/</a>.",
	"ABOUT_TEXT_LINE5": "Développé avec \u2764 et JavaScript par :",
	"ABOUT_TEXT_LINE6": "De nombreux contributeurs (information indisponible pour le moment).",
	"ABOUT_TEXT_WEB_PLATFORM_DOCS": "Web Platform Docs and the Web Platform graphical logo are licensed under a Creative Commons Attribution license, <a class=\"clickable-link\" data-href=\"{WEB_PLATFORM_DOCS_LICENSE}\">CC-BY 3.0 Unported</a>.",
	"UPDATE_NOTIFICATION_TOOLTIP": "Une nouvelle version de {APP_NAME} est disponible. Cliquez ici pour plus de détails.",
	"UPDATE_AVAILABLE_TITLE": "Mise à jour disponible",
	"UPDATE_MESSAGE": "Une nouvelle version de {APP_NAME} est disponible. Voici quelques-unes des nouvelles fonctionnalités proposées :",
	"GET_IT_NOW": "Télécharger",
	"PROJECT_SETTINGS_TITLE": "Paramètres de projet pour : {0}",
	"PROJECT_SETTING_BASE_URL": "URL de base de l’Aperçu en direct ",
	"PROJECT_SETTING_BASE_URL_HINT": "Pour utiliser un serveur local, indiquez une URL telle que http://localhost:8000/",
	"BASEURL_ERROR_INVALID_PROTOCOL": "Le protocole {0} n’est pas pris en charge par l’Aperçu en direct. Veuillez utiliser une adresse de type http ou https.",
	"BASEURL_ERROR_SEARCH_DISALLOWED": "L’URL de base ne peut pas contenir de paramètres de recherche tels que \"{0}\".",
	"BASEURL_ERROR_HASH_DISALLOWED": "L’URL de base ne peut pas contenir de signe dièse (\"{0}\").",
	"BASEURL_ERROR_INVALID_CHAR": "Les caractères spéciaux tels que '{0}' doivent être codés en %.",
	"BASEURL_ERROR_UNKOWN_ERROR": "Erreur inconnue lors de l’analyse de l’URL de base",
    
    // Extension Management strings
	"INSTALL": "Installer",
	"REMOVE": "Supprimer",
	"CANT_REMOVE_DEV": "Les extensions du dossier \"dev\" doivent être supprimées manuellement.",
	"INSTALL_EXTENSION_TITLE": "Installer l’extension",
	"INSTALL_EXTENSION_LABEL": "URL de l’extension ",
	"INSTALL_EXTENSION_HINT": "URL du fichier zip de l’extension ou du référentiel GitHub",
	"INSTALLING_FROM": "Installation de l’extension depuis·{0}\u2026",
	"INSTALL_SUCCEEDED": "Installation réussie.",
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
	"INVALID_BRACKETS_VERSION": "La chaîne de compatibilité Brackets {{0}} n’est pas valide.",
	"DISALLOWED_WORDS": "Le champ {{0}} ne peut pas contenir les mots {{1}}.",
	"API_NOT_COMPATIBLE": "L’extension n’est pas compatible avec cette version de l’application {APP_NAME}. Elle a été installée dans le dossier contenant les extensions désactivées.",
	"MISSING_MAIN": "Le pack ne contient pas de fichier main.js.",
	"ALREADY_INSTALLED": "Une extension portant le même nom est déjà installée. La nouvelle extension a été installée dans le dossier contenant les extensions désactivées.",
	"DOWNLOAD_ID_IN_USE": "Erreur interne : l’ID de téléchargement est déjà utilisé.",
	"NO_SERVER_RESPONSE": "Impossible de se connecter au serveur.",
	"BAD_HTTP_STATUS": "Fichier introuvable sur le serveur (HTTP {0}).",
	"CANNOT_WRITE_TEMP": "Impossible d’enregistrer le téléchargement vers le fichier temporaire.",
	"ERROR_LOADING": "Une erreur s’est produite au démarrage de l’extension.",
	"MALFORMED_URL": "URL non valide. Veuillez vérifier l’URL saisie.",
	"UNSUPPORTED_PROTOCOL": "L’URL doit commencer par http ou https.",
	"UNKNOWN_ERROR": "Erreur interne inconnue.",
    // For NOT_FOUND_ERR, see generic strings above
	"EXTENSION_MANAGER_TITLE": "Extension Manager",
	"EXTENSION_MANAGER_ERROR_LOAD": "Impossible d’accéder au registre de l’extension. Réessayez ultérieurement.",
	"INSTALL_FROM_URL": "Installer à partir de l’URL\u2026",
	"EXTENSION_AUTHOR": "Auteur",
	"EXTENSION_DATE": "Date",
	"EXTENSION_INCOMPATIBLE_NEWER": "Cette extension nécessite une version plus récente de l’application {APP_NAME}.",
	"EXTENSION_INCOMPATIBLE_OLDER": "Cette extension n’est actuellement compatible qu’avec les versions antérieures de l’application {APP_NAME}.",
	"EXTENSION_NO_DESCRIPTION": "Aucune description",
	"EXTENSION_MORE_INFO": "Plus d’infos...",
	"EXTENSION_ERROR": "Erreur d’extension",
	"EXTENSION_KEYWORDS": "Mots-clés",
	"EXTENSION_INSTALLED": "Installée",
	"EXTENSION_SEARCH_PLACEHOLDER": "Rechercher",
	"EXTENSION_MORE_INFO_LINK": "Plus",
	"BROWSE_EXTENSIONS": "Parcourir les extensions",
	"EXTENSION_MANAGER_REMOVE": "Supprimer l’extension",
	"EXTENSION_MANAGER_REMOVE_ERROR": "Impossible de supprimer une ou plusieurs extensions : {{0}}. Brackets va être fermé malgré tout.",
	"MARKED_FOR_REMOVAL": "Marquée pour suppression",
	"UNDO_REMOVE": "Annuler",
	"REMOVE_AND_QUIT_TITLE": "Supprimer les extensions",
	"REMOVE_AND_QUIT_MESSAGE": "Pour supprimer les extensions marquées, vous devez quitter puis relancer Brackets. Vous serez invité à enregistrer vos modifications.",
	"REMOVE_AND_QUIT": "Supprimer les extensions et quitter",
	"EXTENSION_NOT_INSTALLED": "Impossible de supprimer l’extension {{0}} car elle n’est pas installée.",
	"NO_EXTENSIONS": "Aucune extension installée pour le moment.<br />Cliquez sur le bouton Installer à partir de l’URL se trouvant ci-dessous pour démarrer.",
    
    /**
     * Unit names
     */

	"UNIT_PIXELS": "pixels",
    
    // extensions/default/DebugCommands
	"DEBUG_MENU": "Déboguer",
	"CMD_SHOW_DEV_TOOLS": "Afficher les outils de développement",
	"CMD_REFRESH_WINDOW": "Recharger {APP_NAME}",
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
    
    /**
     * Locales
     */
	"LOCALE_CS": "Tchèque",
	"LOCALE_DE": "Allemand",
	"LOCALE_EN": "Anglais",
	"LOCALE_ES": "Espagnol",
	"LOCALE_FR": "Français",
	"LOCALE_IT": "Italien",
	"LOCALE_JA": "Japonais",
	"LOCALE_NB": "Norvégien",
	"LOCALE_PL": "Polonais",
	"LOCALE_PT_BR": "Portugais (Brésil)",
	"LOCALE_PT_PT": "Portugais",
	"LOCALE_RU": "Russe",
	"LOCALE_SV": "Suédois",
	"LOCALE_TR": "Turc",
	"LOCALE_ZH_CN": "Chinois (simplifié)",
    
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
    
    // extensions/default/JSLint
	"CMD_JSLINT": "Activer JSLint",
	"CMD_JSLINT_FIRST_ERROR": "Aller à la première erreur JSLint",
	"JSLINT_ERRORS": "Erreurs JSLint",
	"JSLINT_ERROR_INFORMATION": "1 erreur JSLint",
	"JSLINT_ERRORS_INFORMATION": "{0} erreurs JSLint",
	"JSLINT_NO_ERRORS": "Aucune erreur JSLint - Félicitations !",
	"JSLINT_DISABLED": "JSLint est désactivé ou ne fonctionne pas pour le fichier en cours.",
    
    // extensions/default/QuickView 
	"CMD_ENABLE_QUICK_VIEW": "Affichage rapide au survol",
    
    // extensions/default/WebPlatformDocs
	"DOCS_MORE_LINK": "En savoir plus"
});
