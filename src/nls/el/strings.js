/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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
    "GENERIC_ERROR"                     : "(error {0})",
    "NOT_FOUND_ERR"                     : "Το αρχείο δεν βρέθηκε.",
    "NOT_READABLE_ERR"                  : "Το αρχείο δεν μπορεί να διαβαστεί.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Ο φάκελος δεν μπορεί να τροποποιηθεί.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Δεν επιτρέπεται να κάνεις τροποποιήσεις.",
    "FILE_EXISTS_ERR"                   : "Αυτό το αρχείο ή ο φάκελος υπάρχουν ήδη.",
    "FILE"                              : "αρχείο",
    "DIRECTORY"                         : "φάκελος",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Σφάλμα φόρτωσης project",
    "OPEN_DIALOG_ERROR"                 : "Σφάλμα προέκυψε κατά τη διαδικασία εμφάνισης του παραθύρου ανοίγματος αρχείου. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Σφάλμα προέκυψε κατά τη διαδικασία φόρτωσης του φακέλου <span class='dialog-filename'>{0}</span>. (error {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Σφάλμα προέκυψε κατά τη διαδικασία διαβάσματος των περιεχομένων του φακέλου <span class='dialog-filename'>{0}</span>. (error {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Σφάλμα ανοίγματος αρχείου",
    "ERROR_OPENING_FILE"                : "Σφάλμα προέκυψε κατά τη διαδικασία ανοίγματος του αρχείου <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Σφάλμα προέκυψε κατά τη διαδικασία ανοίγματος των παρακάτω αρχείων:",
    "ERROR_RELOADING_FILE_TITLE"        : "Σφάλμα επαναφόρτωσης αλλαγών από το δίσκο",
    "ERROR_RELOADING_FILE"              : "Σφάλμα προέκυψε κατά τη διαδικασία επαναφόρτωσης του αρχείου <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Σφάλμα αποθήκευσης αρχείου",
    "ERROR_SAVING_FILE"                 : "Σφάλμα προέκυψε κατά τη διαδικασία αποθήκευσης του αρχείου <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Σφάλμα μετονομασίας αρχείου",
    "ERROR_RENAMING_FILE"               : "Σφάλμα προέκυψε κατά τη διαδικασία μετονομασίας αρχείου <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Σφάλμα διαγραφής αρχείου",
    "ERROR_DELETING_FILE"               : "Σφάλμα προέκυψε κατά τη διαδικασία διαγραφής του αρχείου <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Μη έγκυρο {0} όνομα",
    "INVALID_FILENAME_MESSAGE"          : "Τα όνομα αρχείων δεν μπορούν να περιέχουν τους ακόλουθους χαρακτήρες: {0} ή οποιεσδήποτε system reserved λέξεις.",
    "ERROR_CREATING_FILE_TITLE"         : "Σφάλμα δημιουργίας {0}",
    "ERROR_CREATING_FILE"               : "Σφάλμα προέκυψε κατά τη διαδικασία δημιουργίας του {0} <span class='dialog-filename'>{1}</span>. {2}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Ουπς! Το {APP_NAME} δεν τρέχει ακόμα σε browsers.",
    "ERROR_IN_BROWSER"                  : "To {APP_NAME} είναι γραμμένο σε HTML, αλλά αυτή τη στιγμή τρέχει σαν native εφαρμογή έτσι ώστε να μπορείτε να επεξεργαστείτε τοπικά αρχεία. Παρακαλούμε να χρησιμοποιήσετε το application shell στο <b>github.com/adobe/brackets-shell</b> repo για να τρέξετε το {APP_NAME}.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Σφάλμα κατά τη διαδικασία indexing των αρχείων",
    "ERROR_MAX_FILES"                   : "Ο μέγιστος αριθμός αρχείων έχει καταχωρηθεί index. Λειτουργίες που ψάχνουν αρχεία στο index μπορεί να μην δουλεύουν σωστά.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Σφάλμα ανοίγματος browser",
    "ERROR_CANT_FIND_CHROME"            : "Ο Google Chrome browser δεν βρέθηκε. Παρακαλούμε σιγουρευτείτε ότι είναι εγκατεστημένος.",
    "ERROR_LAUNCHING_BROWSER"           : "Σφάλμα προέκυψε κατά τη διαδικασία ανοίγματος του browser. (error {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Σφάλμα Live Preview",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Σύνδεση στον Browser",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Για να συνδεθεί το Live Preview, ο Chrome πρέπει να επανεκκινηθεί με το remote debugging (απομακρυσμένη αποσφαλμάτωση) ενεργοποιημένο.<br /><br />Θέλετε να επανεκκινήσετε τον Chrome και να ενεργοποιήσετε το remote debugging;",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Αδυναμία φόρτωσης της σελίδας Live Development",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Ανοίξτε ένα αρχείο HTML έτσι ώστε να ξεκινήσει η άμεση προεπισκόπηση (Live Preview).",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Για να ανοίξετε το Live Preview με ένα αρχείο από κάποιον server, πρέπει να προσδιορίσετε μια διεύθυνση (Base URL) για αυτό το project.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Σφάλμα κατά τη διαδικασία εκκίνησης του HTTP server για την άμεση επεξεργασία αρχείων. Παρακαλούμε προσπαθήστε ξανά.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Καλώς ήρθατε στο Live Preview!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Το Live Preview συνδέει το {APP_NAME} με τον browser σας. Ανοίγει μια προεπισκόπηση του HTML αρχείου σας στον browser, και την ανανεώνει στιγμιαία ενώ επεξεργάζεστε τον κώδικα.<br /><br />Σε τούτη την πρώιμη έκδοση του {APP_NAME}, το Live Preview δουλεύει μόνο με <strong>Google Chrome</strong> και ανανεώνει άμεσα την σελίδα ενώ επεξεργάζεστε <strong>αρχεία CSS ή HTML</strong>. Αλλαγές σε αρχεία JavaScript ανανεώνονται αυτόματα όταν κάνετε αποθήκευση.<br /><br />(Το μήνυμα αυτό θα αυτοκαταστραφεί μετά την πρώτη εμφάνιση του.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Για περισσότερες πληροφορίες δείτε εδώ: <a href='{0}' title='{0}'>Troubleshooting Live Development connection errors</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live Preview",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Live Preview: Σύνδεση\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Live Preview: Εκκίνηση\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Αποσύνδεση Live Preview",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Live Preview (κάντε αποθήκευση για να ανανεωθεί)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Live Preview (αδυναμία ανανέωσης λόγο συντακτικού λάθους)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Το Live Preview ακυρώθηκε επειδή τα developer tools του browser ανοίχτηκαν",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Το Live Preview ακυρώθηκε επειδή η σελίδα στον browser έκλεισε",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Το Live Preview ακυρώθηκε επειδή ο browser πήγε σε μια σελίδα που δεν είναι μέρος του τρέχων project",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Το Live Preview ακυρώθηκε. Δεν ξέρουμε γιατί. ({0})",

    "SAVE_CLOSE_TITLE"                  : "Αποθήκευση Αλλαγών",
    "SAVE_CLOSE_MESSAGE"                : "Θέλετε να αποθηκεύσετε τις αλλαγές που κάνατε στο έγγραφο <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Θέλετε να αποθηκεύσετε τις αλλαγές σας στα παρακάτω αρχεία;",
    "EXT_MODIFIED_TITLE"                : "Εξωτερικές Αλλαγές",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Επιβεβαίωση Διαγραφής",
    "CONFIRM_FOLDER_DELETE"             : "Είστε σίγουρος ότι θέλετε να διαγράψετε τον φάκελο <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Το Αρχείο Διαγράφηκε",
    "EXT_MODIFIED_MESSAGE"              : "Το <span class='dialog-filename'>{0}</span> έχει τροποποιηθεί στο δίσκο, αλλά υπάρχουν και μη αποθηκευμένες αλλαγές στο {APP_NAME}.<br /><br />Ποια έκδοση θέλετε να κρατήσετε;",
    "EXT_DELETED_MESSAGE"               : "Το <span class='dialog-filename'>{0}</span> έχει διαγραφεί στον δίσκο, αλλά έχει μη αποθηκευμένες αλλαγές στο {APP_NAME}.<br /><br />Θέλετε να κρατήσετε τις αλλαγές σας;",

    // Find, Replace, Find in Files
    "FIND_NO_RESULTS"                   : "Δεν βρέθηκαν αποτελέσματα",
    "BUTTON_YES"                        : "Ναι",
    "BUTTON_NO"                         : "Όχι",
    "BUTTON_REPLACE_ALL"                : "Όλα\u2026",
    "BUTTON_REPLACE"                    : "Αντικατάσταση",

    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Επόμενη Αντιστοιχία",
    "BUTTON_PREV_HINT"                  : "Προηγούμενη Αντιστοιχία",

    "OPEN_FILE"                         : "Άνοιγμα Αρχείου",
    "SAVE_FILE_AS"                      : "Αποθήκευση Αρχείου",
    "CHOOSE_FOLDER"                     : "Επίλεξε ένα φάκελο",

    "RELEASE_NOTES"                     : "Release Notes",
    "NO_UPDATE_TITLE"                   : "Έχετε την τελευταία έκδοση!",
    "NO_UPDATE_MESSAGE"                 : "Τρέχετε την τελευταία έκδοση του {APP_NAME}.",

    "FIND_IN_FILES_SCOPED"              : "στο <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "στο project",
    "FIND_IN_FILES_FILE"                : "αρχείο",
    "FIND_IN_FILES_FILES"               : "αρχεία",
    "FIND_IN_FILES_MATCH"               : "αντιστοιχία",
    "FIND_IN_FILES_MATCHES"             : "αντιστοιχίες",
    "FIND_IN_FILES_MORE_THAN"           : "Πάνω από ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We shoudl use normal dashes on Windows instead of em dash eventually
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Σφάλμα λήψης πληροφοριών αναβάθμισης",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Προέκυψε σφάλμα κατά τη διαδικασία λήψης πληροφοριών της τελευταίας αναβάθμισης από τον server. Παρακαλούμε βεβαιωθείτε ότι είστε συνδεδεμένος στο internet και προσπαθήστε ξανά.",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Φόρτωση\u2026",
    "UNTITLED"          : "Άτιτλο",
    "WORKING_FILES"     : "Αρχεία Εργασίας",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Space",

    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Σειρά {0}, Στήλη {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 επιλεγμένη {0} στήλη",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 επιλεγμένες {0} στήλες",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 επιλεγμένη {0} γραμμή",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 επιλεγμένες {0} γραμμές",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Κάντε κλικ για να αλλάξετε τις εσοχές (indentation) σε κενά",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Κάντε κλικ για να αλλάξετε τις εσοχές (indentation) σε tabs",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Κάντε κλικ για να αλλάξετε τον αριθμό των κενών στις εσοχές",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Κάντε κλικ για να αλλάξετε το πλάτος του tab",
    "STATUSBAR_SPACES"                      : "Κενά:",
    "STATUSBAR_TAB_SIZE"                    : "Μέγεθος Tab:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} Γραμμή",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} Γραμμές",

    // CodeInspection: errors/warnings
    "SINGLE_ERROR"                          : "1 {0} Σφάλμα",
    "MULTIPLE_ERRORS"                       : "{1} {0} Σφάλματα",
    "NO_ERRORS"                             : "Καθόλου {0} σφάλματα - καλή δουλειά!",
    "LINT_DISABLED"                         : "Το Linting είναι απενεργοποιημένο",
    "NO_LINT_AVAILABLE"                     : "Δεν υπάρχει linter διαθέσιμος για {0}",
    "NOTHING_TO_LINT"                       : "Δεν υπάρχει κάτι για να γίνει lint",


    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Αρχείο",
    "CMD_FILE_NEW_UNTITLED"               : "Νέο",
    "CMD_FILE_NEW"                        : "Νέο Αρχείο",
    "CMD_FILE_NEW_FOLDER"                 : "Νέος Φάκελος",
    "CMD_FILE_OPEN"                       : "Άνοιγμα\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Πρόσθεση στα Αρχεία Εργασίας",
    "CMD_OPEN_DROPPED_FILES"              : "Άνοιγμα Αρχείων που ρίχτηκαν",
    "CMD_OPEN_FOLDER"                     : "Άνοιγμα Φακέλου\u2026",
    "CMD_FILE_CLOSE"                      : "Κλείσιμο",
    "CMD_FILE_CLOSE_ALL"                  : "Κλείσιμο Όλων",
    "CMD_FILE_CLOSE_LIST"                 : "Κλείσιμο Λίστας",
    "CMD_FILE_CLOSE_OTHERS"               : "Κλείσιμο Άλλων",
    "CMD_FILE_CLOSE_ABOVE"                : "Κλείσιμο Άλλων απο πάνω",
    "CMD_FILE_CLOSE_BELOW"                : "Κλείσιμο Άλλων από κάτων",
    "CMD_FILE_SAVE"                       : "Αποθήκευση",
    "CMD_FILE_SAVE_ALL"                   : "Αποθήκευση Όλων",
    "CMD_FILE_SAVE_AS"                    : "Αποθήκευση Ως\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Live Preview",
    "CMD_PROJECT_SETTINGS"                : "Ρυθμίσεις Project\u2026",
    "CMD_FILE_RENAME"                     : "Μετονομασία",
    "CMD_FILE_DELETE"                     : "Διαγραφή",
    "CMD_INSTALL_EXTENSION"               : "Εγκατάσταση Επέκτασης (Extension)\u2026",
    "CMD_EXTENSION_MANAGER"               : "Διαχείρηση Επεκτάσεων\u2026",
    "CMD_FILE_REFRESH"                    : "Ανανέωση Δέντρου Αρχείων",
    "CMD_QUIT"                            : "Κλείσιμο",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "΄Εξοδος",

    // Edit menu commands
    "EDIT_MENU"                           : "Επεξεργασία",
    "CMD_UNDO"                            : "Αναίρεση",
    "CMD_REDO"                            : "Επανάληψη",
    "CMD_CUT"                             : "Αποκοπή",
    "CMD_COPY"                            : "Αντιγραφή",
    "CMD_PASTE"                           : "Επικόλληση",
    "CMD_SELECT_ALL"                      : "Επιλογή Όλων",
    "CMD_SELECT_LINE"                     : "Επιλογή Γραμμής",
    "CMD_FIND"                            : "Εύρεση",
    "CMD_FIND_IN_FILES"                   : "Εύρεση σε Αρχεία",
    "CMD_FIND_IN_SUBTREE"                 : "Εύρεση σε\u2026",
    "CMD_FIND_NEXT"                       : "Εύρεση Επόμενου",
    "CMD_FIND_PREVIOUS"                   : "Εύρεση Προηγούμενου",
    "CMD_REPLACE"                         : "Αντικατάσταση",
    "CMD_INDENT"                          : "Εσοχή",
    "CMD_UNINDENT"                        : "Αφαίρεση Εσοχής",
    "CMD_DUPLICATE"                       : "Δημιουργία Αντιγράφου",
    "CMD_DELETE_LINES"                    : "Διαγραφή Γραμμής",
    "CMD_COMMENT"                         : "Εναλλαγή Σχολίου Γραμμής",
    "CMD_BLOCK_COMMENT"                   : "Εναλλαγή Σχολίου Block",
    "CMD_LINE_UP"                         : "Μετακίνηση Γραμμής Πάνω",
    "CMD_LINE_DOWN"                       : "Μετακίνηση Γραμμής Κάτω",
    "CMD_OPEN_LINE_ABOVE"                 : "Δημιουργία Γραμμής από πάνω",
    "CMD_OPEN_LINE_BELOW"                 : "Δημιουργία Γραμμής από κάτω",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Αυτόματο Κλείσιμο Αγκίστρων",
    "CMD_SHOW_CODE_HINTS"                 : "Προβολή Υποδείξεων Κώδικα",

    // View menu commands
    "VIEW_MENU"                           : "Προβολή",
    "CMD_HIDE_SIDEBAR"                    : "Απόκρυψη Πλευρικής Εργαλειοθήκης",
    "CMD_SHOW_SIDEBAR"                    : "Προβολή Πλευρικής Εργαλειοθήκης",
    "CMD_INCREASE_FONT_SIZE"              : "Αύξηση Μεγέθους Γραμματοσειράς",
    "CMD_DECREASE_FONT_SIZE"              : "Μείωση Μεγέθους Γραμματοσειράς",
    "CMD_RESTORE_FONT_SIZE"               : "Επαναφορά Μεγέθους Γραμματοσειράς",
    "CMD_SCROLL_LINE_UP"                  : "Κύλιση Γραμμής Πάνω",
    "CMD_SCROLL_LINE_DOWN"                : "Κύλιση Γραμμής Κάτω",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Αριθμοί Γραμμών",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Επισήμανση Ενεργής Γραμμής",
    "CMD_TOGGLE_WORD_WRAP"                : "Αναδίπλωση Λέξης",
    "CMD_LIVE_HIGHLIGHT"                  : "Επισήμανση Live Preview",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Lint Αρχείων κατά την Αποθήκευση",
    "CMD_WORKINGSET_SORT_BY_ADDED"        : "Ταξινόμηση κατά Σειρά Προσθήκης",
    "CMD_WORKINGSET_SORT_BY_NAME"         : "Ταξινόμηση κατά Όνομα",
    "CMD_WORKINGSET_SORT_BY_TYPE"         : "Ταξινόμηση κατά Τύπο",
    "CMD_WORKING_SORT_TOGGLE_AUTO"        : "Αυτόματη Ταξινόμηση",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Πλοήγηση",
    "CMD_QUICK_OPEN"                      : "Γρήγορο Άνοιγμα",
    "CMD_GOTO_LINE"                       : "Πήγαινε στη γραμμή",
    "CMD_GOTO_DEFINITION"                 : "Γρήγορη Αναζήτηση Ορισμού",
    "CMD_GOTO_FIRST_PROBLEM"              : "Πήγαινε στο Πρώτο Σφάλμα/Προειδοποίηση",
    "CMD_TOGGLE_QUICK_EDIT"               : "Γρήγορη Επεξεργασία",
    "CMD_TOGGLE_QUICK_DOCS"               : "Γρήγορα Έγγραφα",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Προηγούμενη Αντιστοιχία",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Επόμενη Αντιστοιχία",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Νέος Κανόνας",
    "CMD_NEXT_DOC"                        : "Επόμενο Έγγραφο",
    "CMD_PREV_DOC"                        : "Προηγούμενο Έγγραφο",
    "CMD_SHOW_IN_TREE"                    : "Προβολή στο Δέντρο Αρχείων",
    "CMD_SHOW_IN_OS"                      : "Προβολή στο Λειτουργικό Σύστημα",

    // Help menu commands
    "HELP_MENU"                           : "Βοήθεια",
    "CMD_CHECK_FOR_UPDATE"                : "Έλεγχος για Αναβαθμίσεις",
    "CMD_HOW_TO_USE_BRACKETS"             : "Πώς να Χρησιμοποιήσετε το {APP_NAME}",
    "CMD_RELEASE_NOTES"                   : "Release Notes",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Προβολή Φακέλου Επεκτάσεων",
    "CMD_TWITTER"                         : "{TWITTER_NAME} στο Twitter",
    "CMD_ABOUT"                           : "Σχετικά με το {APP_TITLE}",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "experimental build",
    "DEVELOPMENT_BUILD"                    : "development build",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Να Μην Αποθηκευτεί",
    "SAVE"                                 : "Αποθήκευση",
    "CANCEL"                               : "Ακύρωση",
    "DELETE"                               : "Διαγραφή",
    "RELOAD_FROM_DISK"                     : "Επαναφόρτωση από τον Δίσκο",
    "KEEP_CHANGES_IN_EDITOR"               : "Διατήρηση Αλλαγών στον Επεξεργαστή",
    "CLOSE_DONT_SAVE"                      : "Κλείσιμο (Να Μην Αποθηκευτεί)",
    "RELAUNCH_CHROME"                      : "Επανεκκίνηση Chrome",
    "ABOUT"                                : "Σχετικά",
    "CLOSE"                                : "Κλείσιμο",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Πληροφορίες, όροι και οι προϋποθέσεις που αφορούν λογισμικό τρίτων κατασκευαστών βρίσκονται στο <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> και ενσωματώνονται εδώ με αναφορά.",
    "ABOUT_TEXT_LINE4"                     : "Documentation και πηγαίος κώδικας στο <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Φτιαγμένο με \u2764 και JavaScript από:",
    "ABOUT_TEXT_LINE6"                     : "Πολλούς ανθρώπους (απλά αντιμετωπίζουμε ένα πρόβλημα με την φόρτωση των δεδομένων αυτήν την στιγμή).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Τα Web Platform Docs και το Web Platform γραφικό logo είναι αδειοδοτημένα κάτω από την άδεια Creative Commons Attribution, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Υπάρχει ένα νέο build του {APP_NAME} διαθέσιμο! Πατήστε εδώ για λεπτομέρειες.",
    "UPDATE_AVAILABLE_TITLE"               : "Διαθέσιμη Αναβάθμιση",
    "UPDATE_MESSAGE"                       : "Ψιτ, υπάρχει ένα νέο build του {APP_NAME} διαθέσιμο. Μερικές από τις καινούργιες λειτουργίες:",
    "GET_IT_NOW"                           : "Κατέβασε το τώρα!",
    "PROJECT_SETTINGS_TITLE"               : "Ρυθμίσεις Project για: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Live Preview Base URL",
    "PROJECT_SETTING_BASE_URL_HINT"        : "Για να χρησιμοποιήσετε τοπικό server, εισάγετε μια διεύθυνση σαν και αυτή http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Το πρωτόκολλο {0} δεν υποστηρίζεται από το Live Preview&mdash;παρακαλούμε χρησιμοποιήστε http: ή https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Η διεύθυνση URL δεν μπορεί να περιέχει παραμέτρους αναζήτησης όπως \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Η διεύθυνση URL δεν μπορεί να περιέχει hashes σαν και αυτά \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Οι ειδικοί χαρακτήρες όπως '{0}' πρέπει να είναι %-encoded.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Άγνωστο σφάλμα κατά την προσπέλαση της διεύθυνσης URL",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Νέος Κανόνας",

    // Extension Management strings
    "INSTALL"                              : "Εγκατάσταση",
    "UPDATE"                               : "Αναβάθμιση",
    "REMOVE"                               : "Κατάργηση",
    "OVERWRITE"                            : "Αντικατάσταση",
    "CANT_REMOVE_DEV"                      : "Οι επεκτάσεις στο φάκελο \"dev\" πρέπει να διαγραφούν χειροκίνητα.",
    "CANT_UPDATE"                          : "Η αναβάθμιση δεν είναι συμβατή με αυτήν την έκδοση του {APP_NAME}.",
    "INSTALL_EXTENSION_TITLE"              : "Εγκατάσταση Επέκτασης",
    "UPDATE_EXTENSION_TITLE"               : "Αναβάθμιση Επέκτασης",
    "INSTALL_EXTENSION_LABEL"              : "URL Επέκτασης",
    "INSTALL_EXTENSION_HINT"               : "URL αρχείου zip ή GitHub repo της επέκτασης",
    "INSTALLING_FROM"                      : "Εγκατάσταση επέκτασης από {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Εγκατάσταση επιτυχής!",
    "INSTALL_FAILED"                       : "Εγκατάσταση ανεπιτυχής.",
    "CANCELING_INSTALL"                    : "Ακύρωση\u2026",
    "CANCELING_HUNG"                       : "Η ακύρωση της εγκατάστασης παίρνει πολύ ώρα. Κάποιο εσωτερικό σφάλμα μπορεί να έχει προκληθεί.",
    "INSTALL_CANCELED"                     : "Η εγκατάσταση ακυρώθηκε.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Το περιεχόμενο που κατέβηκε δεν είναι έγκυρο αρχείο zip.",
    "INVALID_PACKAGE_JSON"                 : "Το αρχείο package.json δεν είναι έγκυρο (error was: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Το αρχείο package.json δεν καθορίζει όνομα πακέτου.",
    "BAD_PACKAGE_NAME"                     : "Το {0} δεν είναι έγκυρο όνομα αρχείου.",
    "MISSING_PACKAGE_VERSION"              : "Το αρχείο package.json δεν καθορίζει έκδοση πακέτου.",
    "INVALID_VERSION_NUMBER"               : "Ο αριθμός έκδοσης του πακέτου ({0}) δεν είναι έγκυρος.",
    "INVALID_BRACKETS_VERSION"             : "Η συμβολοσειρά συμβατότητας (compatibility string) ({0}) του {APP_NAME} δεν είναι έγκυρη.",
    "DISALLOWED_WORDS"                     : "Οι λέξεις ({1}) δεν επιτρέπονται στο πεδίο {0}.",
    "API_NOT_COMPATIBLE"                   : "Η επέκταση δεν είναι συμβατή με αυτήν την έκδοση του {APP_NAME}. Εγκαταστάθηκε στον φάκελο των απενεργοποιημένων επεκτάσεων.",
    "MISSING_MAIN"                         : "Το πακέτο δεν έχει main.js αρχείο.",
    "EXTENSION_ALREADY_INSTALLED"          : "Η εγκατάσταση αυτού του πακέτου θα αντικαταστήσει μια προηγούμενη εγκατάσταση επέκτασης. Να αντικατασταθεί η παλιά επέκταση;",
    "EXTENSION_SAME_VERSION"               : "Αυτό το πακέτο είναι η ίδια έκδοση με αυτό που είναι ήδη εγκατεστημένο. Να αντικατασταθεί η υπάρχουσα εγκατάσταση;",
    "EXTENSION_OLDER_VERSION"              : "Αυτό το πακέτο είναι στην έκδοση {0} η οποία είναι παλιότερη από την τρέχουσα εγκατάσταση ({1}). Να αντικατασταθεί η υπάρχουσα εγκατάσταση;",
    "DOWNLOAD_ID_IN_USE"                   : "Εσωτερικό σφάλμα: το ID που κατέβηκε χρησιμοποιείται ήδη.",
    "NO_SERVER_RESPONSE"                   : "Αδυναμία σύνδεσης στον server.",
    "BAD_HTTP_STATUS"                      : "Το αρχείο δεν βρέθηκε στον server (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Αδυναμία αποθήκευσης του ληφθέντος αρχείου στο temp.",
    "ERROR_LOADING"                        : "Η επέκταση αντιμετώπισε ένα σφάλμα κατά την εκκίνηση.",
    "MALFORMED_URL"                        : "Η διεύθυνση URL δεν είναι έγκυρη is invalid. Please check that you entered it correctly.",
    "UNSUPPORTED_PROTOCOL"                 : "Η διεύθυνση URL πρέπει να είναι http ή https.",
    "UNKNOWN_ERROR"                        : "Άγνωστο εσωτερικό σφάλμα.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Διαχειριστής Επεκτάσεων",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Αδυναμία πρόσβασης στο μητρώο επεκτάσεων. Παρακαλώ προσπαθήστε αργότερα.",
    "INSTALL_FROM_URL"                     : "Εγκατάσταση από διεύθυνση URL\u2026",
    "EXTENSION_AUTHOR"                     : "Δημιουργός",
    "EXTENSION_DATE"                       : "Ημερομηνία",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Αυτή η επέκταση απαιτεί νεότερη έκδοση του {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Αυτή η επέκταση προς το παρόν δουλεύει μόνο με παλαιότερες εκδόσεις του {APP_NAME}.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "Η έκδοση {0} αυτής της επέκτασης απαιτεί μια νεότερη έκδοση του {APP_NAME}. Αλλά μπορείτε να εγκαταστήσετε την προηγούμενη έκδοση {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "Η έκδοση {0} αυτής της επέκτασης λειτουργεί μόνο με παλαιότερες εκδόσεις του {APP_NAME}. Αλλά μπορείτε να εγκαταστήσετε την προηγούμενη έκδοση {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "Δεν υπάρχει περιγραφή",
    "EXTENSION_MORE_INFO"                  : "Περισσότερες Πληροφορίες...",
    "EXTENSION_ERROR"                      : "Σφάλμα επέκτασης",
    "EXTENSION_KEYWORDS"                   : "Λέξεις κλειδιά",
    "EXTENSION_INSTALLED"                  : "Εγκατεστημένο",
    "EXTENSION_UPDATE_INSTALLED"           : "Αυτή η αναβάθμιση επέκτασης έχει κατέβει και θα εγκατασταθεί όταν κλείσει το {APP_NAME}.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Αναζήτηση",
    "EXTENSION_MORE_INFO_LINK"             : "Περισσότερα",
    "BROWSE_EXTENSIONS"                    : "Περιήγηση Επεκτάσεων",
    "EXTENSION_MANAGER_REMOVE"             : "Κατάργηση Επέκτασης",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Αδυναμία κατάργησης μίας ή περισσότερων επεκτάσεων: {0}. Το {APP_NAME} θα κλείσει.",
    "EXTENSION_MANAGER_UPDATE"             : "Αναβάθμιση Επέκτασης",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Αδυναμία αναβάθμισης μίας η περισσότερων επεκτάσεων: {0}. Το {APP_NAME} θα κλείσει.",
    "MARKED_FOR_REMOVAL"                   : "Επιλεγμένο για κατάργηση",
    "UNDO_REMOVE"                          : "Αναίρεση",
    "MARKED_FOR_UPDATE"                    : "Επιλεγμένο για αναβάθμιση",
    "UNDO_UPDATE"                          : "Αναίρεση",
    "EXTENSION_NOT_INSTALLED"              : "Αδυναμία κατάργησης της επέκτασης {0} αφού δεν ήταν εγκατεστημένη.",
    "NO_EXTENSIONS"                        : "Δεν υπάρχουν επεκτάσεις εγκατεστημένες ακόμα.<br>Κάντε κλικ στην καρτέλα Διαθέσιμα για να ξεκινήσετε.",
    "NO_EXTENSION_MATCHES"                 : "Δεν βρέθηκαν επεκτάσεις που να ικανοποιούν τα κριτήρια αναζήτησης σας.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Να είστε προσεκτικοί όταν εγκαθιστάτε επεκτάσεις από άγνωστες πηγές.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Εγκατεστημένες",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Διαθέσιμες",
    "EXTENSIONS_UPDATES_TITLE"             : "Αναβαθμίσεις",

    "INLINE_EDITOR_NO_MATCHES"             : "Δεν υπάρχουν διαθέσιμες αντιστοιχίες.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Δεν υπάρχουν κανόνες CSS που να ταιριάζουν με την επιλογή σας.<br> Κάντε κλικ στο \"Νέος Κανόνας\" για να δημιουργήσετε ένα νέο.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Δεν υπάρχουν stylesheets στο project σας.<br>Δημιουργήστε ένα για να προσθέσετε κανόνες CSS.",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "pixels",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Debug",
    "CMD_SHOW_DEV_TOOLS"                        : "Προβολή Developer Tools",
    "CMD_REFRESH_WINDOW"                        : "Επαναφόρτωση {APP_NAME}",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Νέο Παράθυρο {APP_NAME}",
    "CMD_SWITCH_LANGUAGE"                       : "Αλλαγή Γλώσσας",
    "CMD_RUN_UNIT_TESTS"                        : "Τρέξε Tests",
    "CMD_SHOW_PERF_DATA"                        : "Προβολή Δεδομένων Επίδοσης",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Ενεργοποίηση του Node Debugger",
    "CMD_LOG_NODE_STATE"                        : "Καταγραφή Node State στη Console",
    "CMD_RESTART_NODE"                          : "Επανεκκίνηση του Node",

    "LANGUAGE_TITLE"                            : "Αλλαγή Γλώσσας",
    "LANGUAGE_MESSAGE"                          : "Γλώσσες:",
    "LANGUAGE_SUBMIT"                           : "Επανεκκίνηση του {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Ακύρωση",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Προεπιλογή Συστήματος",

    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Χρόνος",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Πρόοδος",

    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Τρέχων Χρώμα",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Αρχικό Χρώμα",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "Μορφή RGBa",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Μορφή Hex",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "Μορφή HSLa",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Χρησιμοποιήθηκε {1} φορά)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Χρησιμοποιήθηκε {1} φορές)",

    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Πήγαινε στον Ορισμό",
    "CMD_SHOW_PARAMETER_HINT"                   : "Προβολή Υποδείξεων Παραμέτρων",
    "NO_ARGUMENTS"                              : "<χωρίς παραμέτρους>",

    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Γρήγορη Προβολή στο Hover",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Πρόσφατα Project",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Διαβάστε Περισσότερα"
});
