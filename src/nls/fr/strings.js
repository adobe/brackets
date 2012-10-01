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
	"LIVE_DEV_NEED_HTML_MESSAGE": "Ouvrez un fichier HTML pour lancer l’aperçu en direct.",
	"LIVE_DEVELOPMENT_INFO_TITLE": "Bienvenue dans le module Aperçu en direct !",
	"LIVE_DEVELOPMENT_INFO_MESSAGE": "Le module Aperçu en direct connecte {APP_NAME} à votre navigateur. Il ouvre un aperçu de votre fichier HTML dans le navigateur, puis le met à jour instantanément dès que vous modifiez le code.<br /><br />Dans cette première version de {APP_NAME}, le module Aperçu en direct ne fonctionne qu’avec les modifications apportées aux <strong>fichiers CSS</strong> et uniquement dans <strong>Google Chrome</strong>. Nous prévoyons de le rendre bientôt compatible avec les fichiers HTML et JavaScript.<br /><br />(Ce message ne s’affichera qu’une seule fois.)",
    
	"LIVE_DEV_STATUS_TIP_NOT_CONNECTED": "Aperçu en direct",
	"LIVE_DEV_STATUS_TIP_PROGRESS1": "Aperçu en direct : Connexion...",
	"LIVE_DEV_STATUS_TIP_PROGRESS2": "Aperçu en direct : Initialisation...",
	"LIVE_DEV_STATUS_TIP_CONNECTED": "Déconnecter le module Aperçu en direct",
    
	"SAVE_CLOSE_TITLE": "Enregistrer les modifications",
	"SAVE_CLOSE_MESSAGE": "Souhaitez-vous enregistrer les modifications apportées au document <span class='dialog-filename'>{0}</span> ?",
	"SAVE_CLOSE_MULTI_MESSAGE": "Souhaitez-vous enregistrer les modifications apportées aux fichiers suivants ?",
	"EXT_MODIFIED_TITLE": "Modifications externes",
	"EXT_MODIFIED_MESSAGE": "Le fichier <span class='dialog-filename'>{0}</span> a été modifié sur le disque mais présente également des modifications non enregistrées dans {APP_NAME}.<br /><br />Quelle version souhaitez-vous conserver ?",
	"EXT_DELETED_MESSAGE": "Le fichier <span class='dialog-filename'>{0}</span> a été supprimé sur le disque mais présente des modifications non enregistrées dans {APP_NAME}.<br /><br />Souhaitez-vous conserver vos modifications ?",
    
    // Find, Replace, Find in Files
	"SEARCH_REGEXP_INFO": "Utiliser la syntaxe /re/ pour la recherche regexp",
	"WITH": "Avec",
	"BUTTON_YES": "Oui",
	"BUTTON_NO": "Non",
	"BUTTON_STOP": "Arrêter",

	"OPEN_FILE": "Ouvrir le fichier",
	"CHOOSE_FOLDER": "Choisir un dossier",

	"RELEASE_NOTES": "Notes de mise à jour",
	"NO_UPDATE_TITLE": "Votre logiciel est à jour.",
	"NO_UPDATE_MESSAGE": "Vous utilisez la dernière version de {APP_NAME}.",
    
	"FIND_IN_FILES_TITLE": "- {0} {1} sur {2} {3}",
	"FIND_IN_FILES_FILE": "fichier",
	"FIND_IN_FILES_FILES": "fichiers",
	"FIND_IN_FILES_MATCH": "résultat",
	"FIND_IN_FILES_MATCHES": "résultats",
	"FIND_IN_FILES_MAX": " (affichage des {0} premiers résultats)",
	"FIND_IN_FILES_FILE_PATH": "Fichier : <b>{0}</b>",
	"FIND_IN_FILES_LINE": "Ligne :&nbsp;{0}",

	"ERROR_FETCHING_UPDATE_INFO_TITLE": "Erreur de récupération des informations de mise à jour",
	"ERROR_FETCHING_UPDATE_INFO_MSG": "Un problème est survenu lors de la récupération des dernières informations de mise à jour sur le serveur. Vérifiez que vous êtes connecté à Internet et réessayez.",
    
    // Switch language
	"LANGUAGE_TITLE": "Changer de langue",
	"LANGUAGE_MESSAGE": "Sélectionnez la langue souhaitée dans la liste ci-dessous :",
	"LANGUAGE_SUBMIT": "Recharger {APP_NAME}",
	"LANGUAGE_CANCEL": "Annuler",

    /**
     * ProjectManager
     */

	"UNTITLED": "Sans titre",

    /**
     * Keyboard modifier names
     */

	"KEYBOARD_CTRL": "Ctrl",
	"KEYBOARD_SHIFT": "Maj",
	"KEYBOARD_SPACE": "Espace",

    /**
     * Command Name Constants
     */

    // File menu commands
	"FILE_MENU": "Fichier",
	"CMD_FILE_NEW": "Nouveau",
	"CMD_FILE_OPEN": "Ouvrir\u2026",
	"CMD_ADD_TO_WORKING_SET": "Ajouter à l’ensemble de travail",
	"CMD_OPEN_FOLDER": "Ouvrir un dossier\u2026",
	"CMD_FILE_CLOSE": "Fermer",
	"CMD_FILE_CLOSE_ALL": "Tout fermer",
	"CMD_FILE_SAVE": "Enregistrer",
	"CMD_FILE_SAVE_ALL": "Enregistrer tout",
	"CMD_LIVE_FILE_PREVIEW": "Aperçu en direct",
	"CMD_QUIT": "Quitter",

    // Edit menu commands
	"EDIT_MENU": "Modifier",
	"CMD_SELECT_ALL": "Sélectionner tout",
	"CMD_FIND": "Rechercher",
	"CMD_FIND_IN_FILES": "Rechercher dans les fichiers",
	"CMD_FIND_NEXT": "Rechercher suivant",
	"CMD_FIND_PREVIOUS": "Rechercher précédent",
	"CMD_REPLACE": "Remplacer",
	"CMD_INDENT": "Retrait",
	"CMD_UNINDENT": "Annuler le retrait",
	"CMD_DUPLICATE": "Dupliquer",
	"CMD_COMMENT": "Commenter les lignes/Annuler les commentaires",
	"CMD_LINE_UP": "Déplacer les lignes vers le haut",
	"CMD_LINE_DOWN": "Déplacer les lignes vers le bas",
     
    // View menu commands
	"VIEW_MENU": "Affichage",
	"CMD_HIDE_SIDEBAR": "Masquer la barre latérale",
	"CMD_SHOW_SIDEBAR": "Afficher la barre latérale",
	"CMD_INCREASE_FONT_SIZE": "Augmenter la taille de la police",
	"CMD_DECREASE_FONT_SIZE": "Diminuer la taille de la police",
	"CMD_RESTORE_FONT_SIZE": "Restaurer la taille de la police",

    // Navigate menu Commands
	"NAVIGATE_MENU": "Naviguer",
	"CMD_QUICK_OPEN": "Ouverture rapide",
	"CMD_GOTO_LINE": "Atteindre la ligne",
	"CMD_GOTO_DEFINITION": "Atteindre la définition",
	"CMD_TOGGLE_QUICK_EDIT": "Edition rapide",
	"CMD_QUICK_EDIT_PREV_MATCH": "Correspondance précédente",
	"CMD_QUICK_EDIT_NEXT_MATCH": "Correspondance suivante",
	"CMD_NEXT_DOC": "Document suivant",
	"CMD_PREV_DOC": "Document précédent",
    
    // Debug menu commands
	"DEBUG_MENU": "Déboguer",
	"CMD_REFRESH_WINDOW": "Recharger {APP_NAME}",
	"CMD_SHOW_DEV_TOOLS": "Afficher les outils de développement",
	"CMD_RUN_UNIT_TESTS": "Exécuter des tests",
	"CMD_JSLINT": "Activer JSLint",
	"CMD_SHOW_PERF_DATA": "Afficher les données de performances",
	"CMD_NEW_BRACKETS_WINDOW": "Nouvelle fenêtre {APP_NAME}",
	"CMD_SHOW_EXTENSIONS_FOLDER": "Afficher le dossier d’extensions",
	"CMD_USE_TAB_CHARS": "Utiliser les caractères de tabulation",
	"CMD_SWITCH_LANGUAGE": "Changer de langue",
	"CMD_CHECK_FOR_UPDATE": "Rechercher les mises à jour",

    // Help menu commands
	"HELP_MENU": "Aide",
	"CMD_ABOUT": "Á propos de {APP_TITLE}",
	"CMD_FORUM": "Forum {APP_NAME}",

    // Special commands invoked by the native shell
	"CMD_CLOSE_WINDOW": "Fermer la fenêtre",
	"CMD_ABORT_QUIT": "Annuler la fermeture",

    // Strings for main-view.html
	"EXPERIMENTAL_BUILD": "Version expérimentale",
	"JSLINT_ERRORS": "Erreurs JSLint",
	"JSLINT_NO_ERRORS": "Aucune erreur JSLint - Félicitations !",
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
	"APP_NAME": "Brackets",
	"CLOSE": "Fermer",
	"ABOUT_TEXT_LINE1": "version expérimentale sprint 14 ",
	"ABOUT_TEXT_LINE3": "Les mentions légales et conditions générales relatives aux logiciels tiers sont disponibles (en anglais) à l’adresse <span class=\"non-clickble-link\">http://www.adobe.com/go/thirdparty_fr/</span> et sont incluses dans le présent document à titre de référence.",
	"ABOUT_TEXT_LINE4": "La documentation et le code source sont disponibles à l’adresse <span class=\"non-clickble-link\">https://github.com/adobe/brackets/</span>",
	"UPDATE_NOTIFICATION_TOOLTIP": "Une nouvelle version de {APP_NAME} est disponible. Cliquez ici pour plus de détails.",
	"UPDATE_AVAILABLE_TITLE": "Mise à jour disponible",
	"UPDATE_MESSAGE": "Une nouvelle version de {APP_NAME} est disponible. Voici quelques-unes des nouvelles fonctionnalités proposées :",
	"GET_IT_NOW": "Télécharger"
});
