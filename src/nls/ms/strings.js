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
    "GENERIC_ERROR"                     : "(ralat {0})",
    "NOT_FOUND_ERR"                     : "Fail tidak boleh dijumpai.",
    "NOT_READABLE_ERR"                  : "Fail tidak boleh dibaca.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Direktori sasaran tidak boleh diubah suai.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Keizinan tidak membenarkan anda untuk membuat pengubahsuaian.",
    "CONTENTS_MODIFIED_ERR"             : "Fail telah diubah suai di luar {APP_NAME}.",
    "UNSUPPORTED_ENCODING_ERR"          : "Fail adalah bukan teks terkod UTF-8.",
    "FILE_EXISTS_ERR"                   : "Fail atau direktori telah wujud.",
    "FILE"                              : "fail",
    "DIRECTORY"                         : "direktori",
    "DIRECTORY_NAMES_LEDE"              : "Nama direktori",
    "FILENAMES_LEDE"                    : "Nama fail",
    "FILENAME"                          : "nama fail",
    "DIRECTORY_NAME"                    : "nama direktori",
    

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Ralat memuat projek",
    "OPEN_DIALOG_ERROR"                 : "Satu ralat telah berlaku apabila menunjukkan dialog buka fail. (ralat {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Satu ralat telah berlaku apabila mencuba untuk memuat direktori <span class='dialog-filename'>{0}</span>. (ralat {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Satu ralat telah berlaku apabila membaca kandungan direktori <span class='dialog-filename'>{0}</span>. (ralat {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Ralat membuka fail",
    "ERROR_OPENING_FILE"                : "Satu ralat telah berlaku apabila mencuba untuk membuka fail <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Satu ralat telah berlaku apabila mencuba untuk membuka fail berikut:",
    "ERROR_RELOADING_FILE_TITLE"        : "Ralat memuat semula perubahan daripada cakera",
    "ERROR_RELOADING_FILE"              : "Satu ralat telah berlaku apabila mencuba untuk memuat semula fail <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Ralat menyimpan fail",
    "ERROR_SAVING_FILE"                 : "Satu ralat telah berlaku apabila mencuba untuk menyimpan the fail <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Ralat menamakan semula fail",
    "ERROR_RENAMING_FILE"               : "Satu ralat telah berlaku apabila mencuba untuk menamakan semula fail <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Ralat menghapus fail",
    "ERROR_DELETING_FILE"               : "Satu ralat telah berlaku apabila mencuba untuk menghapus fail <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Tidak sah {0}",
    "INVALID_FILENAME_MESSAGE"          : "{0} tidak boleh menggunakan sebarang perkataan simpanan sistem, berakhir dengan titik (.) atau menggunakan sebarang aksara berikut: <code class='emphasized'>{1}</code>",
    "ENTRY_WITH_SAME_NAME_EXISTS"       : "Satu fail atau direktori dengan nama <span class='dialog-filename'>{0}</span> telah wujud.",
    "ERROR_CREATING_FILE_TITLE"         : "Ralat mencipta {0}",
    "ERROR_CREATING_FILE"               : "Satu ralat telah berlaku apabila mencuba untuk mencipta {0} <span class='dialog-filename'>{1}</span>. {2}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"         : "Ralat membaca pilihan",
    "ERROR_PREFS_CORRUPT"               : "Fail pilihan anda adalah bukan JSON yang sah. Fail akan dibuka jadi anda boleh membetulkan format. Anda perlu memula semula {APP_NAME} untuk berkesan.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Op! {APP_NAME} tidak berjalan dalam pelayar.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} adalah terbina dalam HTML, namun kini ia berjalan sebagai aplikasi desktop jadi anda boleh menggunakannya untuk menyunting fail tempatan. Sila gunakan cangkerang aplikasi dalam <b>github.com/adobe/brackets-shell</b> repositori untuk berjalan {APP_NAME}.",
    
    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "Ralat Mengindeks Fail",
    "ERROR_MAX_FILES"                   : "Nombor maksimum fail telah diindeks. Fungsi yang mencari fail dalam indeks mungkin tidak berfungsi dengan betul.",

    // Live Preview error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Ralat melancarkan pelayar",
    "ERROR_CANT_FIND_CHROME"            : "Pelayar Google Chrome tidak boleh dijumpai. Sila pastikan ia dipasang.",
    "ERROR_LAUNCHING_BROWSER"           : "Satu ralat telah berlaku apabila melancarkan pelayar. (ralat {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Ralat Pratonton Langsung",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Berhubung ke Pelayar",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Untuk Pratonton Langsung dapat bersambung, Chrome perlu dilancarkan semula dengan penyahpepijatan jauh dibolehkan.<br /><br />Adakah anda ingin untuk melancarkan semula Chrome dan membolehkan penyahpepijatan jauh?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Tidak boleh untuk memuat laman Pratonton Langsung",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Buka satu fail HTML atau pastikan terdapat satu fail index.html dalam projek anda untuk melancarkan pratonton langsung.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Untuk melancarkan pratonton langsung dengan fail sebelah pelayan, anda perlu untuk menetapkan URL Dasar untuk projek ini.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Ralat memulakan pelayan HTTP untuk fail pratonton langsung. Sila cuba lagi.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Selamat datang ke Pratonton Langsung!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Pratonton Langsung menghubungkan {APP_NAME} ke pelayar anda. Ia melancarkan pratonton fail HTML anda dalam pelayar, kemudian kemas kini pratonton segera selagi anda menyunting kod anda.<br /><br />Dalam versi awal {APP_NAME}, Pratonton Langsung hanya berjalan dengan <strong>Google Chrome</strong> dan mengemas kini secara langsung selagi anda menyunting <strong>fail CSS atau HTML</strong>. Perubahan kepada fail JavaScript dimuat semula secara automatik apabila anda simpan.<br /><br />(Anda hanya akan melihat mesej ini sekali.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Untuk maklumat lebih lanjut, lihat <a href='{0}' title='{0}'>Troubleshooting Live Preview connection errors</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Pratonton Langsung",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Pratonton Langsung: Berhubung\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Pratonton Langsung: Mengasal\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Memutuskan Pratonton Langsung",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Pratonton Langsung (simpan fail untuk segar semula)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Pratonton Langsung (tidak mengemas kini kerana ralat sintaks)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Pratonton Langsung telah dibatalkan kerana alat pembangun pelayar telah dibuka",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Pratonton Langsung telah dibatalkan kerana laman telah ditutup dalam pelayar",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Pratonton Langsung telah dibatalkan kerana pelayar berlayar ke satu laman yang bukan sebahagian daripada projek terkini",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Pratonton Langsung telah dibatalkan kerana sebab yang tidak diketahui ({0})",
    
    "SAVE_CLOSE_TITLE"                  : "Simpan Perubahan",
    "SAVE_CLOSE_MESSAGE"                : "Adakah anda mahu untuk menyimpan perubahan yang anda buat dalam dokumen <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Adakah anda mahu untuk menyimpan perubahan anda kepada fail berikut?",
    "EXT_MODIFIED_TITLE"                : "Perubahan Luaran",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Sahkan Penghapusan?",
    "CONFIRM_FOLDER_DELETE"             : "Adakah anda pasti anda ingin untuk menghapuskan folder <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Fail Dihapuskan",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> telah diubah suai pada cakera.<br /><br />Adakah anda ingin untuk menyimpan fail dan tulis ganti perubahan itu?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> telah diubah suai pada cakera, namun juga mempunyai perubahan yang tidak disimpan dalam {APP_NAME}.<br /><br />Versi manakah yang anda ingin simpan?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> telah dihapuskan pada cakera, namun mempunyai perubahan yang tidak disimpan dalam {APP_NAME}.<br /><br />Adakah anda ingin simpan perubahan anda?",
    
    // Generic dialog/button labels
    "OK"                                : "OK",
    "CANCEL"                            : "Batal",
    "DONT_SAVE"                         : "Jangan Simpan",
    "SAVE"                              : "Simpan",
    "SAVE_AS"                           : "Simpan Sebagai\u2026",
    "SAVE_AND_OVERWRITE"                : "Tulis Ganti",
    "DELETE"                            : "Hapus",
    "BUTTON_YES"                        : "Ya",
    "BUTTON_NO"                         : "Tidak",
        
    // Find, Replace, Find in Files
    "FIND_RESULT_COUNT"                 : "{0} hasil",
    "FIND_RESULT_COUNT_SINGLE"          : "1 hasil",
    "FIND_NO_RESULTS"                   : "Tiada hasil",
    "REPLACE_PLACEHOLDER"               : "Ganti dengan\u2026",
    "BUTTON_REPLACE_ALL"                : "Semua\u2026",
    "BUTTON_REPLACE"                    : "Ganti",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Padanan Seterusnya",
    "BUTTON_PREV_HINT"                  : "Padanan Sebelumnya",
    "BUTTON_CASESENSITIVE_HINT"         : "Padan dengan Huruf",
    "BUTTON_REGEXP_HINT"                : "Ungkapan Biasa",

    "OPEN_FILE"                         : "Buka Fail",
    "SAVE_FILE_AS"                      : "Simpan Fail",
    "CHOOSE_FOLDER"                     : "Pilih satu folder",

    "RELEASE_NOTES"                     : "Nota Keluaran",
    "NO_UPDATE_TITLE"                   : "Anda menjalankan versi terkini!",
    "NO_UPDATE_MESSAGE"                 : "Anda menjalankan versi terkini {APP_NAME}.",

    // Replace All (in single file)
    "FIND_REPLACE_TITLE_PART1"          : "Gantikan \"",
    "FIND_REPLACE_TITLE_PART2"          : "\" dengan \"",
    "FIND_REPLACE_TITLE_PART3"          : "\" &mdash; {2} {0} {1}",

    // Find in Files
    "FIND_IN_FILES_TITLE_PART1"         : "\"",
    "FIND_IN_FILES_TITLE_PART2"         : "\" dijumpai",
    "FIND_IN_FILES_TITLE_PART3"         : "&mdash; {0} {1} {2} dalam {3} {4}",
    "FIND_IN_FILES_SCOPED"              : "dalam <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "dalam projek",
    "FIND_IN_FILES_ZERO_FILES"          : "Penapis mengecualikan semua fail {0}",
    "FIND_IN_FILES_FILE"                : "fail",
    "FIND_IN_FILES_FILES"               : "fail",
    "FIND_IN_FILES_MATCH"               : "padanan",
    "FIND_IN_FILES_MATCHES"             : "padanan",
    "FIND_IN_FILES_MORE_THAN"           : "Lebih ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "Ctrl/Cmd klik untuk kembang/runtuh semua",
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Ralat mendapatkan maklumat kemas kini",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Terdapat satu masalah mendapatkan maklumat kemas kini terkini daripada pelayan. Sila pastikan anda dihubungkan ke Internet dan cuba lagi.",
    
    // File exclusion filters
    "NO_FILE_FILTER"                    : "Kecualikan fail\u2026",
    "EDIT_FILE_FILTER"                  : "Sunting\u2026",
    "FILE_FILTER_DIALOG"                : "Sunting Penapis",
    "FILE_FILTER_INSTRUCTIONS"          : "Kecualikan fail dan folder yang padan dengan sebarang rentetan / subrentetan berikut atau <a href='{0}' title='{0}'>kad liar</a>. Masukkan setiap rentetan pada satu baris baru.",
    "FILE_FILTER_LIST_PREFIX"           : "kecuali",
    "FILE_FILTER_CLIPPED_SUFFIX"        : "dan {0} lagi",
    "FILTER_COUNTING_FILES"             : "Mengira fail\u2026",
    "FILTER_FILE_COUNT"                 : "Membenarkan {0} daripada {1} fail {2}",
    "FILTER_FILE_COUNT_ALL"             : "Membenarkan semua {0} fail {1}",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"   : "Tiada Penyuntingan Cepat untuk kedudukan kursor terkini",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES"     : "Penyuntingan Cepat CSS: letakkan kursor pada satu nama kelas tunggal",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"      : "Penyuntingan Cepat CSS: sifat kelas tidak lengkap",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"         : "Penyuntingan Cepat CSS: sifat id tidak lengkap",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"    : "Penyuntingan Cepat CSS: letakkan kursor dalam tag, kelas, atau id",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"   : "Penyuntingan Cepat Fungsi Pemasaan CSS : sintaks tidak sah",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"    : "Penyuntingan Cepat JS: letakkan kursor dalam nama fungsi",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"   : "Tiada Dokumen Cepat untuk kedudukan kursor terkini",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Memuat\u2026",
    "UNTITLED"          : "Tidak Bertajuk",
    "WORKING_FILES"     : "Fail Berjalan",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Jarak",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Baris {0}, Lajur {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 Telah memilih {0} lajur",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 Telah memilih {0} lajur",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 Telah memilih {0} baris",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 Telah memilih {0} baris",
    "STATUSBAR_SELECTION_MULTIPLE"          : " \u2014 {0} pilihan",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Klik untuk menukar jarak engsot kepada ruang",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Klik untuk menukar jarak engsot kepada tab",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Klik untuk mengubah nombor ruang digunakan apabila mengengsot",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Klik untuk mengubah lebar aksara tab",
    "STATUSBAR_SPACES"                      : "Ruang:",
    "STATUSBAR_TAB_SIZE"                    : "Saiz Tab:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} Baris",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} Baris",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Sambungan Lumpuh",
    "STATUSBAR_INSERT"                      : "INS",
    "STATUSBAR_OVERWRITE"                   : "OVR",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} Masalah",
    "SINGLE_ERROR"                          : "1 {0} Masalah",
    "MULTIPLE_ERRORS"                       : "{1} {0} Masalah",
    "NO_ERRORS"                             : "Tiada {0} masalah dijumpai - kerja yang baik!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Tiada masalah dijumpai - kerja yang baik!",
    "LINT_DISABLED"                         : "Linting adalah lumpuh",
    "NO_LINT_AVAILABLE"                     : "Tiada linter untuk {0}",
    "NOTHING_TO_LINT"                       : "Tiada apa-apa untuk lint",
    "LINTER_TIMED_OUT"                      : "{0} telah tamat masa selepas menunggu selama {1} ms",
    "LINTER_FAILED"                         : "{0} ditamatkan dengan ralat: {1}",
    
    
    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Fail",
    "CMD_FILE_NEW_UNTITLED"               : "Baru",
    "CMD_FILE_NEW"                        : "Fail Baru",
    "CMD_FILE_NEW_FOLDER"                 : "Folder Baru",
    "CMD_FILE_OPEN"                       : "Buka\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Tambahkan Ke Set Berjalan",
    "CMD_OPEN_DROPPED_FILES"              : "Buka Fail Yang Dilepaskan",
    "CMD_OPEN_FOLDER"                     : "Buka Folder\u2026",
    "CMD_FILE_CLOSE"                      : "Tutup",
    "CMD_FILE_CLOSE_ALL"                  : "Tutup Semua",
    "CMD_FILE_CLOSE_LIST"                 : "Tutup Senarai",
    "CMD_FILE_CLOSE_OTHERS"               : "Tutup Yang Lain",
    "CMD_FILE_CLOSE_ABOVE"                : "Tutup Yang Lain Di Atas",
    "CMD_FILE_CLOSE_BELOW"                : "Tutup Yang Lain Di Bawah",
    "CMD_FILE_SAVE"                       : "Simpan",
    "CMD_FILE_SAVE_ALL"                   : "Simpan Semua",
    "CMD_FILE_SAVE_AS"                    : "Simpan Sebagai\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Pratonton Langsung",
    "CMD_PROJECT_SETTINGS"                : "Tetapan Projek\u2026",
    "CMD_FILE_RENAME"                     : "Menamakan Semula",
    "CMD_FILE_DELETE"                     : "Hapus",
    "CMD_INSTALL_EXTENSION"               : "Pasang Sambungan\u2026",
    "CMD_EXTENSION_MANAGER"               : "Pengurus Sambungan\u2026",
    "CMD_FILE_REFRESH"                    : "Segar Semula Pokok Fail",
    "CMD_QUIT"                            : "Keluar",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Keluar",

    // Edit menu commands
    "EDIT_MENU"                           : "Sunting",
    "CMD_UNDO"                            : "Buat Asal",
    "CMD_REDO"                            : "Buat Semula",
    "CMD_CUT"                             : "Potong",
    "CMD_COPY"                            : "Salin",
    "CMD_PASTE"                           : "Tampal",
    "CMD_SELECT_ALL"                      : "Pilih Semua",
    "CMD_SELECT_LINE"                     : "Pilih Baris",
    "CMD_SPLIT_SEL_INTO_LINES"            : "Pisahkan Pilihan ke dalam Baris",
    "CMD_ADD_CUR_TO_NEXT_LINE"            : "Tambah Kursor ke Baris Seterusnya",
    "CMD_ADD_CUR_TO_PREV_LINE"            : "Tambah Kursor ke Baris Sebelumnya",
    "CMD_INDENT"                          : "Engsot",
    "CMD_UNINDENT"                        : "Tidak Engsot",
    "CMD_DUPLICATE"                       : "Menduplikasi",
    "CMD_DELETE_LINES"                    : "Hapus Baris",
    "CMD_COMMENT"                         : "Togol Ulasan Baris",
    "CMD_BLOCK_COMMENT"                   : "Togol Ulasan Blok",
    "CMD_LINE_UP"                         : "Alih Baris Ke Atas",
    "CMD_LINE_DOWN"                       : "Alih Baris Ke Bawah",
    "CMD_OPEN_LINE_ABOVE"                 : "Buka Baris Di Atas",
    "CMD_OPEN_LINE_BELOW"                 : "Buka Baris Di Bawah",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Auto Tutup Tanda Kurung",
    "CMD_SHOW_CODE_HINTS"                 : "Tunjuk Bayangan Kod",
    
    // Search menu commands
    "FIND_MENU"                           : "Cari",
    "CMD_FIND"                            : "Cari",
    "CMD_FIND_FIELD_PLACEHOLDER"          : "Cari\u2026",
    "CMD_FIND_NEXT"                       : "Cari Seterusnya",
    "CMD_FIND_PREVIOUS"                   : "Cari Sebelumnya",
    "CMD_FIND_ALL_AND_SELECT"             : "Cari Semua dan Pilih",
    "CMD_ADD_NEXT_MATCH"                  : "Tambah Padanan Seterusnya ke Pilihan",
    "CMD_SKIP_CURRENT_MATCH"              : "Langkau dan Tambah Padanan Seterusnya",
    "CMD_FIND_IN_FILES"                   : "Cari dalam Fail",
    "CMD_FIND_IN_SELECTED"                : "Cari dalam Fail/Folder Yang Dipilih",
    "CMD_FIND_IN_SUBTREE"                 : "Cari dalam\u2026",
    "CMD_REPLACE"                         : "Ganti",
    
    // View menu commands
    "VIEW_MENU"                           : "Lihat",
    "CMD_HIDE_SIDEBAR"                    : "Sembunyikan Batang Sisi",
    "CMD_SHOW_SIDEBAR"                    : "Tunjukkan Batang Sisi",
    "CMD_INCREASE_FONT_SIZE"              : "Menambah Saiz Fon",
    "CMD_DECREASE_FONT_SIZE"              : "Mengurangkan Saiz Fon",
    "CMD_RESTORE_FONT_SIZE"               : "Memulihkan Saiz Fon",
    "CMD_SCROLL_LINE_UP"                  : "Tatal Baris Ke Atas",
    "CMD_SCROLL_LINE_DOWN"                : "Tatal Baris Ke Bawah",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Nombor Baris",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Tonjolkan Baris Aktif",
    "CMD_TOGGLE_WORD_WRAP"                : "Balut Kata",
    "CMD_LIVE_HIGHLIGHT"                  : "Penonjol Pratonton Langsung",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Fail Lint sedang Disimpan",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Isih berdasarkan Waktu",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Isih berdasarkan Nama",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Isih berdasarkan Jenis",
    "CMD_SORT_WORKINGSET_AUTO"            : "Isih Automatik",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigasi",
    "CMD_QUICK_OPEN"                      : "Buka Cepat",
    "CMD_GOTO_LINE"                       : "Pergi ke Baris",
    "CMD_GOTO_DEFINITION"                 : "Cari Cepat Takrif",
    "CMD_GOTO_FIRST_PROBLEM"              : "Pergi ke Ralat Pertama/Amaran",
    "CMD_TOGGLE_QUICK_EDIT"               : "Sunting Cepat",
    "CMD_TOGGLE_QUICK_DOCS"               : "Dokumen Cepat",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Padanan Sebelumnya",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Padanan Seterusnya",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Peraturan Baru",
    "CMD_NEXT_DOC"                        : "Dokumen Seterusnya",
    "CMD_PREV_DOC"                        : "Dokumen Sebelumnya",
    "CMD_SHOW_IN_TREE"                    : "Tunjuk dalam Pokok Fail",
    "CMD_SHOW_IN_EXPLORER"                : "Tunjuk dalam Penjelajah",
    "CMD_SHOW_IN_FINDER"                  : "Tunjuk dalam Pencari",
    "CMD_SHOW_IN_OS"                      : "Tunjuk dalam OS",
    
    // Help menu commands
    "HELP_MENU"                           : "Bantuan",
    "CMD_CHECK_FOR_UPDATE"                : "Semak untuk Kemas Kini",
    "CMD_HOW_TO_USE_BRACKETS"             : "Bagaimana untuk Menggunakan {APP_NAME}",
    "CMD_SUPPORT"                         : "Sokongan {APP_NAME}",
    "CMD_SUGGEST"                         : "Cadangkan satu Sifat",
    "CMD_RELEASE_NOTES"                   : "Nota Keluaran",
    "CMD_GET_INVOLVED"                    : "Libatkan Diri",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Tunjuk Folder Sambungan",
    "CMD_HOMEPAGE"                        : "Laman Utama {APP_TITLE}",
    "CMD_TWITTER"                         : "{TWITTER_NAME} di Twitter",
    "CMD_ABOUT"                           : "Tentang {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "Buka Fail Pilihan",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "versi percubaan",
    "DEVELOPMENT_BUILD"                    : "versi pembangunan",
    "RELOAD_FROM_DISK"                     : "Memuat Semula daripada Cakera",
    "KEEP_CHANGES_IN_EDITOR"               : "Simpan Perubahan dalam Penyunting",
    "CLOSE_DONT_SAVE"                      : "Tutup (Jangan Simpan)",
    "RELAUNCH_CHROME"                      : "Lancar Semula Chrome",
    "ABOUT"                                : "Tentang",
    "CLOSE"                                : "Tutup",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Notis, terma dan syarat berhubung kepada perisian pihak ketiga berada di <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> dan digabungkan dengan rujukan di sini.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentasi dan sumber di <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Dibuat dengan \u2764 dan JavaScript oleh:",
    "ABOUT_TEXT_LINE6"                     : "Ramai orang (namun kami sedang mengalami masalah memuatkan data itu sekarang).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Dokumentasi Platform Web dan logo grafik Platform Web dilesenkan bawah lesen Atribusi Creative Commons, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Terdapat versi baru {APP_NAME}! Klik di sini untuk butiran.",
    "UPDATE_AVAILABLE_TITLE"               : "Kemas Kini Tersedia",
    "UPDATE_MESSAGE"                       : "Hei, terdapat versi baru {APP_NAME}. Di sini ialah sebahagian daripada sifat baru:",
    "GET_IT_NOW"                           : "Dapatkannya sekarang!",
    "PROJECT_SETTINGS_TITLE"               : "Tetapan Projek untuk: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Pratonton Langsung URL Dasar",
    "PROJECT_SETTING_BASE_URL_HINT"        : "Untuk menggunakan pelayan tempatan, masukkan url seperti http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Protokol {0} tidak disokong oleh Pratonton Langsung&mdash;sila gunakan http: atau https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "URL dasar tidak boleh mengandungi parameter carian seperti \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "URL dasar tidak boleh mengandungi hash seperti \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Aksara khas seperti '{0}' must be terkod-%.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Ralat tidak diketahui menghuraikan URL Dasar",
    
    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Peraturan Baru",
    
    // Extension Management strings
    "INSTALL"                              : "Pasang",
    "UPDATE"                               : "Kemas Kini",
    "REMOVE"                               : "Hapus",
    "OVERWRITE"                            : "Tulis Ganti",
    "CANT_REMOVE_DEV"                      : "Sambungan dalam folder \"dev\" harus dihapuskan secara manual.",
    "CANT_UPDATE"                          : "Kemas kini adalah tidak serasi dengan versi {APP_NAME} ini.",
    "CANT_UPDATE_DEV"                      : "Sambungan dalam folder \"dev\" tidak boleh dikemas kini secara automatik.",
    "INSTALL_EXTENSION_TITLE"              : "Pasang Sambungan",
    "UPDATE_EXTENSION_TITLE"               : "Kemas Kini Sambungan",
    "INSTALL_EXTENSION_LABEL"              : "URL Sambungan",
    "INSTALL_EXTENSION_HINT"               : "URL fail zip sambungan atau repositori GitHub",
    "INSTALLING_FROM"                      : "Memasang sambungan daripada {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Pemasangan berjaya!",
    "INSTALL_FAILED"                       : "Pemasangan gagal.",
    "CANCELING_INSTALL"                    : "Batalkan\u2026",
    "CANCELING_HUNG"                       : "Membatalkan pemasangan mengambil masa yang lama. Satu ralat dalaman mungkin telah berlaku.",
    "INSTALL_CANCELED"                     : "Pemasangan dibatalkan.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Kandungan yang dimuat turun adalah bukan fail zip sah.",
    "INVALID_PACKAGE_JSON"                 : "Fail package.json adalah tidak sah (ralat adalah: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Fail package.json tidak menetapkan nama pakej.",
    "BAD_PACKAGE_NAME"                     : "{0} adalah nama pakej yang tidak sah.",
    "MISSING_PACKAGE_VERSION"              : "Fail package.json tidak menetapkan versi pakej.",
    "INVALID_VERSION_NUMBER"               : "Nombor versi pakej ({0}) adalah tidak sah.",
    "INVALID_BRACKETS_VERSION"             : "Rentetan keserasian {APP_NAME} ({0}) adalah tidak sah.",
    "DISALLOWED_WORDS"                     : "Perkataan ({1}) adalah tidak dibenarkan dalam ruangan {0}.",
    "API_NOT_COMPATIBLE"                   : "Sambungan adalah tidak serasi dengan versi {APP_NAME} ini. Ia dipasang dalam folder sambungan lumpuh anda.",
    "MISSING_MAIN"                         : "Pakej tidak mempunyai fail main.js.",
    "EXTENSION_ALREADY_INSTALLED"          : "Memasang pakej ini akan menulis ganti sambungan yang telah dipasang sebelumnya. Tulis ganti sambungan lama?",
    "EXTENSION_SAME_VERSION"               : "Pakej ini ialah versi yang sama dengan sambungan yang dipasang sekarang. Tulis ganti pemasangan yang ada?",
    "EXTENSION_OLDER_VERSION"              : "Pakej ini ialah versi {0} di mana lebih lama berbanding sambungan yang dipasang sekarang ({1}). Tulis ganti pemasangan yang ada?",
    "DOWNLOAD_ID_IN_USE"                   : "Ralat dalaman: ID muat turun telah digunakan.",
    "NO_SERVER_RESPONSE"                   : "Tidak boleh berhubung kepada pelayan.",
    "BAD_HTTP_STATUS"                      : "Fail tidak dijumpai pada pelayan (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Tidak boleh untuk menyimpan muat turun ke fail sementara.",
    "ERROR_LOADING"                        : "Sambungan menghadapi satu ralat apabila mula.",
    "MALFORMED_URL"                        : "URL adalah tidak sah. Sila semak yang anda telah memasukkannya dengan betul.",
    "UNSUPPORTED_PROTOCOL"                 : "URL mesti URL http atau https.",
    "UNKNOWN_ERROR"                        : "Ralat dalaman yang tidak diketahui.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Pengurus Sambungan",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Tidak boleh untuk mencapai daftaran sambungan. Sila cuba lagi nanti.",
    "INSTALL_FROM_URL"                     : "Pasang daripada URL\u2026",
    "EXTENSION_AUTHOR"                     : "Penulis",
    "EXTENSION_DATE"                       : "Tarikh",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Sambungan ini memerlukan versi baru {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Sambungan ini kini hanya berjalan dengan versi lama {APP_NAME}.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "Versi {0} sambungan ini memerlukan versi baru {APP_NAME}. Namun anda boleh memasang versi yang lebih awal {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "Versi {0} sambungan ini hanya berjalan dengan versi lama {APP_NAME}. Namun anda boleh memasang versi yang lebih awal {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "Tiada huraian",
    "EXTENSION_MORE_INFO"                  : "Maklumat lebih lanjut...",
    "EXTENSION_ERROR"                      : "Ralat sambungan",
    "EXTENSION_KEYWORDS"                   : "Kata kunci",
    "EXTENSION_INSTALLED"                  : "Telah dipasang",
    "EXTENSION_UPDATE_INSTALLED"           : "Kemas kini sambungan ini telah dimuat turun dan akan dipasang selepas {APP_NAME} memuat semula.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Cari",
    "EXTENSION_MORE_INFO_LINK"             : "Lagi",
    "BROWSE_EXTENSIONS"                    : "Melayari Sambungan",
    "EXTENSION_MANAGER_REMOVE"             : "Buang Sambungan",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Tidak boleh untuk membuang satu atau lebih sambungan: {0}. {APP_NAME} akan tetap memuat semula.",
    "EXTENSION_MANAGER_UPDATE"             : "Kemas Kini Sambungan",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Tidak boleh untuk mengemas kini satu atau lebih sambungan: {0}. {APP_NAME} akan tetap memuat semula.",
    "MARKED_FOR_REMOVAL"                   : "Ditanda untuk pembuangan",
    "UNDO_REMOVE"                          : "Buat Asal",
    "MARKED_FOR_UPDATE"                    : "Ditanda untuk kemas kini",
    "UNDO_UPDATE"                          : "Buat Asal",
    "CHANGE_AND_RELOAD_TITLE"              : "Ubah Sambungan",
    "CHANGE_AND_RELOAD_MESSAGE"            : "Untuk mengemas kini atau membuang sambungan yang telah ditanda, {APP_NAME} akan perlu untuk memuat semula. Anda akan diingatkan untuk menyimpan perubahan yang tidak disimpan.",
    "REMOVE_AND_RELOAD"                    : "Buang Sambungan dan Muat Semula",
    "CHANGE_AND_RELOAD"                    : "Ubah Sambungan dan Muat Semula",
    "UPDATE_AND_RELOAD"                    : "Kemas Kini Sambungan dan Muat Semula",
    "PROCESSING_EXTENSIONS"                : "Memproses perubahan sambungan\u2026",
    "EXTENSION_NOT_INSTALLED"              : "Tidak boleh membuang sambungan {0} kerana ia tidak dipasang.",
    "NO_EXTENSIONS"                        : "Tiada sambungan dipasang lagi.<br>Klik pada tab Tersedia di atas untuk bermula.",
    "NO_EXTENSION_MATCHES"                 : "Tiada sambungan yang padan dengan carian anda.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Waspada apabila memasang sambungan daripada sumber ynag tidak diketahui.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Telah Dipasang",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Tersedia",
    "EXTENSIONS_UPDATES_TITLE"             : "Kemas Kini",
    
    "INLINE_EDITOR_NO_MATCHES"             : "Tiada padanan.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Tiada peraturan CSS yang wujud yang padan dengan pilihan anda.<br> Klik \"Peraturan Baru\" untuk cipta satu.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Tiada lembaran gaya dalam projek anda.<br>Cipta satu untuk menambah peraturan CSS.",

    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON"            : "terbesar",
    
    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "piksel",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Nyahpepijat",
    "ERRORS"                                    : "Errors",
    "CMD_SHOW_DEV_TOOLS"                        : "Tunjuk Alat Pembangun",
    "CMD_REFRESH_WINDOW"                        : "Muat Semula Dengan Sambungan",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Muat Semula Tanpa Sambungan",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Tetingkap {APP_NAME} Baru",
    "CMD_SWITCH_LANGUAGE"                       : "Ubah Bahasa",
    "CMD_RUN_UNIT_TESTS"                        : "Jalankan Ujian",
    "CMD_SHOW_PERF_DATA"                        : "Tunjuk Data Prestasi",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Membolehkan Penyahpepijat Nod",
    "CMD_LOG_NODE_STATE"                        : "Log Keadaan Nod ke Konsol",
    "CMD_RESTART_NODE"                          : "Mulakan Semula Nod",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"             : "Tunjuk Ralat dalam Bar Status",
    
    "LANGUAGE_TITLE"                            : "Ubah Bahasa",
    "LANGUAGE_MESSAGE"                          : "Bahasa:",
    "LANGUAGE_SUBMIT"                           : "Muat Semula {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Batal",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Pilihan Lalai Sistem",
    
    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Masa",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Pergerakan",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Alih titik yang dipilih<br><kbd class='text'>Shift</kbd> Bergerak sebanyak sepuluh unit<br><kbd class='text'>Tab</kbd> Ubah titik",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Menambah atau mengurangkan langkah<br><kbd>←</kbd><kbd>→</kbd> 'Mula' atau 'Tamat'",
    "INLINE_TIMING_EDITOR_INVALID"              : "Nilai lama <code>{0}</code> adalah tidak sah, jadi fungsi yang dipaparkan diubah kepada <code>{1}</code>. Dokumen akan dikemas kini dengan suntingan pertama.",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Warna Terkini",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Warna Asal",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "Format RGBa",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Format Heks",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "Format HSLa",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Digunakan {1} kali)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Digunakan {1} kali)",
    
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Lompat ke Takrif",
    "CMD_SHOW_PARAMETER_HINT"                   : "Tunjuk Bayangan Parameter",
    "NO_ARGUMENTS"                              : "<tiada parameter>",
    
    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",
    
    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Lihat Cepat pada Hover",
    
    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Projek Terkini",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Baca lagi"
});
