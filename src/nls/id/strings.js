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
    "GENERIC_ERROR"                     : "(kesalahan {0})",
    "NOT_FOUND_ERR"                     : "Berkas tidak ditemukan.",
    "NOT_READABLE_ERR"                  : "Berkas tidak bisa dibuka.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Direktori tujuan tidak dapat di modifikasi.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Status anda tidak mengijinkan untuk melakukan perubahan berkas.",
    "CONTENTS_MODIFIED_ERR"             : "Berkas telah di ubah di luar dari {APP_NAME}.",
    "FILE_EXISTS_ERR"                   : "Berkas atau direktori telah ada.",
    "FILE"                              : "berkas",
    "DIRECTORY"                         : "directori",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Kesalahan membuka proyek",
    "OPEN_DIALOG_ERROR"                 : "Kesalahan terjadi saat menampilkan jendela buka berkas. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Ada kesalahan saat akan membuka direktori <span class='dialog-filename'>{0}</span>. (error {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Kesalahan terjadi saat akan membaca isi dari direktori <span class='dialog-filename'>{0}</span>. (error {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Gagal membuka berkas",
    "ERROR_OPENING_FILE"                : "Ada kesalahan terjadi saat akan membuka berkas <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Terjadi kesalahan saat akan membuka berkas berikut:",
    "ERROR_RELOADING_FILE_TITLE"        : "Gagal update perubahan dari disk",
    "ERROR_RELOADING_FILE"              : "Gagal membuka ulang berkas <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Gagal menyimpan berkas",
    "ERROR_SAVING_FILE"                 : "Gagal meyimpan berkas <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Gagal mengubah nama berkas",
    "ERROR_RENAMING_FILE"               : "Terjadi kesalahan saa mencoba mengubah nama berkas <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Gagal menghapus berkas",
    "ERROR_DELETING_FILE"               : "Terjadi kesalahan saat akan menghapus berkas <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Nama {0} tidak valid",
    "INVALID_FILENAME_MESSAGE"          : "Nama berkas tidak boleh berisi karakter: {0} atau menggunakan nama yang telah  digunakan pada sistem.",
    "FILE_ALREADY_EXISTS"               : "Berkas {0} <span class='dialog-filename'>{1}</span> sudah ada.",
    "ERROR_CREATING_FILE_TITLE"         : "Gagal membuat {0}",
    "ERROR_CREATING_FILE"               : "Kesalahan terjadi saat akan membuat berkas {0} <span class='dialog-filename'>{1}</span>. {2}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "ups! {APP_NAME} belum dijalankan di browser.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} menggunakan HTML, tpi sekarang di jalankan sebagai aplikasi desktop, jadi anda dapat menggunakannya untuk mengedit file lokal. Gunakan Application shell <b>github.com/adobe/brackets-shell</b> repo untuk menjalanakan {APP_NAME}.",

    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "Gagal Mendata Berkas",
    "ERROR_MAX_FILES"                   : "Jumlah maksimal berkas yang di index telah mencapai batas. Kemungkinan fungsi index tidak berjalan sebagai mana mestinya.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Gagal Menjalankan Browser",
    "ERROR_CANT_FIND_CHROME"            : "Tidak menemukan aplikasi google chrome harap di install terlebih dahula.",
    "ERROR_LAUNCHING_BROWSER"           : "Terjadi kesalahan dalam menjalankan browser. (error {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Gagal Preview Langsung",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Menjalankan koneksi ke browser",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Agar preview langsung dapat dijalankan, Chrome harus dijalankan ulang ulang dengan Mode Remote Debugging.<br /><br />Apakah anda akan menjalankan ulang Chrome dan mengijinkan remote debugging?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Tidak dapat membuka halaman",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Buka berkas HTML atau pastikan ada file index.html dalam struktur folder anda untuk menggunakan preview langsung.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Untuk menjalankan server-side preview, anda di harapkan untuk melakukan pengaturan url dasar.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Gagal menjalankan HTTP Server untuk melakukan preview kangsung. Coba lagi.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Preview Langsung!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Live Preview mengkoneksikan {APP_NAME} ke browser anda. Menjalankan berkas HTML anda di browser, dan mengubah tampilannya selagi anda mengubah kode.<br /><br />Dalam versi awal dari {APP_NAME} ini, Live Preview hanya dapat digunakan menggunakan <strong>Google Chrome</strong> dan di update langsung selagi anda melakukan perubahan pada <strong> berkas CSS atau HTML</strong>. Perubahan pada berkas JavaScript secara otomatis akan di load ulang saat anda menyimpan.<br /><br />(Anda hanya melihat pesan ini sekali saja.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Untuk informasi lebih lanjut, lihat <a href='{0}' title='{0}'>Troubleshooting Live Development connection errors</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Preview Langsung",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Preview Langsung: Melakukan Koneksi\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Preview Langsung: Inisialisasi\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Memutuskan koneksi",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Preview Langsung (simpan file untuk melakukan refresh)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Preview Langsung (gagal update karena penulisan salah)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Preview Langsung dibatalkan karena browser's developer tools sedang dibuka",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Preview Langsung dibatalakan karena halaman telah ditutup",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Preview Langsung dibatalakan karena browser membuka halaman yang bukan dari proyek",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Preview Langsung dibatalakan karena sebab yang belum diketahui ({0})",

    "SAVE_CLOSE_TITLE"                  : "Simpan perubahan",
    "SAVE_CLOSE_MESSAGE"                : "Apakah anda akan menyimpan setelah melakukan perubahan <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Apakah anda akan menyimpan file berikut?",
    "EXT_MODIFIED_TITLE"                : "Perubahan dari luar",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Hapus?",
    "CONFIRM_FOLDER_DELETE"             : "Apakah anda yakin akan menghapus folder <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Berkas telah dihapus",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> telah dirubah.<br /><br />Apakah anda akan menyimpan dan membatalkan perubahan?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> Telah di rubah, tapi belum disimpan pada {APP_NAME}.<br /><br />Versi yang mana yang ingin anda simpan?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> telah di hapus di luar brackets, tapi ada perubahan pada {APP_NAME} yang belum disimpan.<br /><br />Apakah anda akan menyimpan perubahan?",

    // Generic dialog/button labels
    "OK"                                : "Iya",
    "CANCEL"                            : "Batal",
    "DONT_SAVE"                         : "Jangan Disimpan",
    "SAVE"                              : "Simpan",
    "SAVE_AS"                           : "Simpan Sebagai\u2026",
    "SAVE_AND_OVERWRITE"                : "Timpa",
    "DELETE"                            : "Hapus",
    "BUTTON_YES"                        : "Ya",
    "BUTTON_NO"                         : "Tidak",

    // Find, Replace, Find in Files
    "FIND_RESULT_COUNT"                 : "{0} hasil",
    "FIND_RESULT_COUNT_SINGLE"          : "1 hasil",
    "FIND_NO_RESULTS"                   : "Tidak ditemukan",
    "REPLACE_PLACEHOLDER"               : "Ganti dengan\u2026",
    "BUTTON_REPLACE_ALL"                : "Semua\u2026",
    "BUTTON_REPLACE"                    : "Ganti",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Berikutnya",
    "BUTTON_PREV_HINT"                  : "Sebelumnya",
    "BUTTON_CASESENSITIVE_HINT"         : "Sesuai dengan huruf",
    "BUTTON_REGEXP_HINT"                : "Regular Expression",

    "OPEN_FILE"                         : "Buka Berkas",
    "SAVE_FILE_AS"                      : "Simpan Berkas",
    "CHOOSE_FOLDER"                     : "Pilih Folder",

    "RELEASE_NOTES"                     : "Catatan rilis",
    "NO_UPDATE_TITLE"                   : "Aplikasi terbaru!",
    "NO_UPDATE_MESSAGE"                 : "Anda menggunakan versi terkhir dari {APP_NAME}.",

    // Replace All (in single file)
    "FIND_REPLACE_TITLE_PART1"          : "Ganti \"",
    "FIND_REPLACE_TITLE_PART2"          : "\" dengan \"",
    "FIND_REPLACE_TITLE_PART3"          : "\" &mdash; {2} {0} {1}",

    // Find in Files
    "FIND_IN_FILES_TITLE_PART1"         : "\"",
    "FIND_IN_FILES_TITLE_PART2"         : "\" temukan",
    "FIND_IN_FILES_TITLE_PART3"         : "&mdash; {0} {1} {2} in {3} {4}",
    "FIND_IN_FILES_SCOPED"              : "di <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "dalam proyek",
    "FIND_IN_FILES_FILE"                : "Berkas",
    "FIND_IN_FILES_FILES"               : "Berkas",
    "FIND_IN_FILES_MATCH"               : "sesuai",
    "FIND_IN_FILES_MATCHES"             : "sesuai",
    "FIND_IN_FILES_MORE_THAN"           : "Lebih Dari ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We shoudl use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "Ctrl/Cmd click untuk expand/collapse semua",
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Gagal mendapatkan informasi update",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Ada permasalahan dalam meminta informasi terbaru dari server. Pastikan anda terkoneksi ke internet dan kemudian coba lagi.",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Loading\u2026",
    "UNTITLED"          : "Tanpa Judul",
    "WORKING_FILES"     : "Berkas aktif",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Space",

    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Line {0}, Column {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 kolom {0} dipilih",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 kolom {0} dipilih",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 baris {0} dipilih",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 baris {0} dipilih",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Klik untuk mengubah indentasi menggunakan spasi",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Klik untuk mengubah indentasi menggunakan tabs",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Klik untuk mengubah jumlah spasi yang digunakan untuk indentasi",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Klik untuk mengubah jumlah karakter dalam satu tabs",
    "STATUSBAR_SPACES"                      : "Spasi:",
    "STATUSBAR_TAB_SIZE"                    : "Ukuran Tab:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} baris",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} baris",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Ekstensi tidak diijinkan",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} Kesalahan",
    "SINGLE_ERROR"                          : "1 {0} Kesalahan",
    "MULTIPLE_ERRORS"                       : "{1} {0} Kesalahan",
    "NO_ERRORS"                             : "{0} Tidak ditemukan Kesalahan - kerja bagus!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Tidak ditemukan Kesalahan - kerja bagus!",
    "LINT_DISABLED"                         : "Linting tidak diijinkan",
    "NO_LINT_AVAILABLE"                     : "Tidak ada linter tersedia untuk {0}",
    "NOTHING_TO_LINT"                       : "Tudak ada yang di lint",


    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Berkas",
    "CMD_FILE_NEW_UNTITLED"               : "Baru",
    "CMD_FILE_NEW"                        : "Berkas Baru",
    "CMD_FILE_NEW_FOLDER"                 : "Folder Baru",
    "CMD_FILE_OPEN"                       : "Buka\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Tambahkan ke working set",
    "CMD_OPEN_DROPPED_FILES"              : "Buka file yang di drop",
    "CMD_OPEN_FOLDER"                     : "Buka Folder\u2026",
    "CMD_FILE_CLOSE"                      : "Tutup",
    "CMD_FILE_CLOSE_ALL"                  : "Tutup Semua",
    "CMD_FILE_CLOSE_LIST"                 : "Daftar Tutup",
    "CMD_FILE_CLOSE_OTHERS"               : "Tutup yang lain",
    "CMD_FILE_CLOSE_ABOVE"                : "Tutup semua yang diatas",
    "CMD_FILE_CLOSE_BELOW"                : "Tutup semua yang dibawah",
    "CMD_FILE_SAVE"                       : "Simpan",
    "CMD_FILE_SAVE_ALL"                   : "Simpan Semua",
    "CMD_FILE_SAVE_AS"                    : "Simpan Sebagai\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Live Preview",
    "CMD_PROJECT_SETTINGS"                : "Pengaturan Proyek\u2026",
    "CMD_FILE_RENAME"                     : "Ubah Nama",
    "CMD_FILE_DELETE"                     : "Hapus",
    "CMD_INSTALL_EXTENSION"               : "Install Ekstensi\u2026",
    "CMD_EXTENSION_MANAGER"               : "Pengaturan Ekstensi\u2026",
    "CMD_FILE_REFRESH"                    : "Refresh daftar berkas",
    "CMD_QUIT"                            : "Keluar",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Keluar",

    // Edit menu commands
    "EDIT_MENU"                           : "Ubah",
    "CMD_UNDO"                            : "Undo",
    "CMD_REDO"                            : "Redo",
    "CMD_CUT"                             : "Cut",
    "CMD_COPY"                            : "Copy",
    "CMD_PASTE"                           : "Paste",
    "CMD_SELECT_ALL"                      : "Pilih Semua",
    "CMD_SELECT_LINE"                     : "Pilih baris",
    "CMD_FIND"                            : "Cari",
    "CMD_FIND_FIELD_PLACEHOLDER"          : "Cari\u2026",
    "CMD_FIND_IN_FILES"                   : "Cari dalam Berkas",
    "CMD_FIND_IN_SUBTREE"                 : "Cari di\u2026",
    "CMD_FIND_NEXT"                       : "Cari Berikutnya",
    "CMD_FIND_PREVIOUS"                   : "Cari Sebelumnya",
    "CMD_REPLACE"                         : "Ganti",
    "CMD_INDENT"                          : "Indentasi",
    "CMD_UNINDENT"                        : "Batalkan Indentasi",
    "CMD_DUPLICATE"                       : "Duplikat",
    "CMD_DELETE_LINES"                    : "Hapus Baris",
    "CMD_COMMENT"                         : "Toggle Line Comment",
    "CMD_BLOCK_COMMENT"                   : "Toggle Block Comment",
    "CMD_LINE_UP"                         : "Pindahkan baris ke bawah",
    "CMD_LINE_DOWN"                       : "Pindahkan baris ke atas",
    "CMD_OPEN_LINE_ABOVE"                 : "Baris Baru diatas",
    "CMD_OPEN_LINE_BELOW"                 : "Baris Baru dibawah",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Tanda kurung tutup otomatis",
    "CMD_SHOW_CODE_HINTS"                 : "Tunjukkan code hints",

    // View menu commands
    "VIEW_MENU"                           : "Tampilan",
    "CMD_HIDE_SIDEBAR"                    : "Sembunyikan Sidebar",
    "CMD_SHOW_SIDEBAR"                    : "Tampilkan Sidebar",
    "CMD_INCREASE_FONT_SIZE"              : "Perbesar Huruf",
    "CMD_DECREASE_FONT_SIZE"              : "Perkecil Huruf",
    "CMD_RESTORE_FONT_SIZE"               : "Kembalikan Huruf ke Ukuran Awal",
    "CMD_SCROLL_LINE_UP"                  : "Scroll Baris Ke Atas",
    "CMD_SCROLL_LINE_DOWN"                : "Scroll Baris Ke Bawah",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Nomor Baris",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Tandai Baris Yang Aktif",
    "CMD_TOGGLE_WORD_WRAP"                : "Word Wrap",
    "CMD_LIVE_HIGHLIGHT"                  : "Tandai Live Preview",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Lint Berkas Saat Disimpan",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Urutkan berdasarkan Waktu",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Urutkan Berdasarkan Nama",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Urutkan Berdasarkan Jenis",
    "CMD_SORT_WORKINGSET_AUTO"            : "Urutkan Secara Otomatis",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigasi",
    "CMD_QUICK_OPEN"                      : "Buka Cepat",
    "CMD_GOTO_LINE"                       : "Ke Baris",
    "CMD_GOTO_DEFINITION"                 : "Cari Cepat Penjelasan",
    "CMD_GOTO_FIRST_PROBLEM"              : "Ke Kesalhan/Peringatan Pertama",
    "CMD_TOGGLE_QUICK_EDIT"               : "Ubah Cepat",
    "CMD_TOGGLE_QUICK_DOCS"               : "Dokumentasi Cepat",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Sesuai Dengan Sebelumnya",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Sesuai Dengan Berikutnya",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Atribut Baru",
    "CMD_NEXT_DOC"                        : "Dokumen Berikutnya",
    "CMD_PREV_DOC"                        : "Dokumen Sebelumnya",
    "CMD_SHOW_IN_TREE"                    : "Tambahkan Ke Daftar Berkas",
    "CMD_SHOW_IN_OS"                      : "Tampilkan DI OS",

    // Help menu commands
    "HELP_MENU"                           : "Bantuan",
    "CMD_CHECK_FOR_UPDATE"                : "Periksa Pembaruan",
    "CMD_HOW_TO_USE_BRACKETS"             : "Bagaimana menggunakan {APP_NAME}",
    "CMD_FORUM"                           : "{APP_NAME} Forum",
    "CMD_RELEASE_NOTES"                   : "Catatan Rilis",
    "CMD_REPORT_AN_ISSUE"                 : "Laporkan Isu",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Tampilkan Folder Ekstensi",
    "CMD_TWITTER"                         : "{TWITTER_NAME} pada Twitter",
    "CMD_ABOUT"                           : "Tentang {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "Buka Tentang Berkas",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Versi Experimen",
    "DEVELOPMENT_BUILD"                    : "Versi Pengembangan",
    "RELOAD_FROM_DISK"                     : "Muat Ulang",
    "KEEP_CHANGES_IN_EDITOR"               : "Simpan perubahan pada editor",
    "CLOSE_DONT_SAVE"                      : "Tutup (Jangan Disimpan)",
    "RELAUNCH_CHROME"                      : "Jalankan Ulang Chrome",
    "ABOUT"                                : "Tentang",
    "CLOSE"                                : "Tutup",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Catatan, Syarat dan ketentuan dengan pihak ketiga terdapat pada <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> dan secara korporat.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentasi dan kode sumber pada <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Dibuat menggunakan \u2764 dan JavaScript oleh:",
    "ABOUT_TEXT_LINE6"                     : "Banyak orang (Ada masalah untuk menampilkan daftarnya).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform Docs and the Web Platform graphical logo are licensed under a Creative Commons Attribution license, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Ada versi terbaru dari {APP_NAME} Klik disini untuk lebih detail.",
    "UPDATE_AVAILABLE_TITLE"               : "Update Tersedia",
    "UPDATE_MESSAGE"                       : "Hai, ada update terbaru dari {APP_NAME}. Beberapa fitur terbaru:",
    "GET_IT_NOW"                           : "Dapatkan Sekarang!",
    "PROJECT_SETTINGS_TITLE"               : "Pengaturan proyek untuk: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Url dari Live Preview",
    "PROJECT_SETTING_BASE_URL_HINT"        : "Untuk menggunakan server lokal, masukkan url seperti contoh http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Protokol {0} Tidak Didukung oleh Live Preview&mdash;gunakan http: atau https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Url dasar tidak boleh ada kriteria pencarian seperti \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Url tidak boleh ada tanda atau simbol \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Karakter Spesial Seperti '{0}' must be %-encoded.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Terjadi kegagalan membuka url",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Atribut Baru",

    // Extension Management strings
    "INSTALL"                              : "Install",
    "UPDATE"                               : "Update",
    "REMOVE"                               : "Hapus",
    "OVERWRITE"                            : "Timpa",
    "CANT_REMOVE_DEV"                      : "Ekstensi pada folder \"dev\" harus di hapus manual.",
    "CANT_UPDATE"                          : "Update tidak kompatibel dengan {APP_NAME}.",
    "CANT_UPDATE_DEV"                      : "Ekstensi pada folder \"dev\" tidak dapat melakukan update otomatis.",
    "INSTALL_EXTENSION_TITLE"              : "Install Ekstensi",
    "UPDATE_EXTENSION_TITLE"               : "Update Ekstensi",
    "INSTALL_EXTENSION_LABEL"              : "URL Ekstensi",
    "INSTALL_EXTENSION_HINT"               : "URL file zip extensi atau GitHub repo",
    "INSTALLING_FROM"                      : "Menginstal Ekstensi dari {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Sukses!",
    "INSTALL_FAILED"                       : "Gagal.",
    "CANCELING_INSTALL"                    : "Membatalkan\u2026",
    "CANCELING_HUNG"                       : "Pembatalan memakan waktu terlalu lama. Terjadi kesalahan internal.",
    "INSTALL_CANCELED"                     : "Instalasi Dibatalkan.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Bukan berkas zip yang valid.",
    "INVALID_PACKAGE_JSON"                 : "Berkas package.json tidak valid (error was: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Berkas package.json tidak menyebutkan nama paket.",
    "BAD_PACKAGE_NAME"                     : "{0} Paket tidak valid.",
    "MISSING_PACKAGE_VERSION"              : "package.json tidak menyebutkan versi paket.",
    "INVALID_VERSION_NUMBER"               : "Versi ({0}) tidak valid.",
    "INVALID_BRACKETS_VERSION"             : "Kompatibilitas {APP_NAME} dengan ({0}) tidak Valid.",
    "DISALLOWED_WORDS"                     : "Kata ({1}) tidak diijinkan pada {0} .",
    "API_NOT_COMPATIBLE"                   : "Ekstensi tidak cocok dengan versi {APP_NAME} ini. diinstal pada folder disabled extensions.",
    "MISSING_MAIN"                         : "Tidak menemukan berkas main.js.",
    "EXTENSION_ALREADY_INSTALLED"          : "Menginstal Paket ini akan menimpa ekstensi yang lama. Ganti ekstensi yan lama?",
    "EXTENSION_SAME_VERSION"               : "Versi ekstensi ini sama dengan yang telah terinstall. Timpa Ektensi yang telah ada?",
    "EXTENSION_OLDER_VERSION"              : "Versi paket ini {0} lebih lama dari versi yang telah terinstall ({1}). Timpa instalasi yang ada?",
    "DOWNLOAD_ID_IN_USE"                   : "Internal error: download ID sedang digunakan.",
    "NO_SERVER_RESPONSE"                   : "Tidak dapat melakukan koneksi ke server.",
    "BAD_HTTP_STATUS"                      : "Berkas tidak ditemukan pada server (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Gagal menyimpan hasil download ke temp file.",
    "ERROR_LOADING"                        : "Gagal meload ekstensi.",
    "MALFORMED_URL"                        : "URL tidak valid. Periksa kembali.",
    "UNSUPPORTED_PROTOCOL"                 : "URL harus HTTP atau HTTPS.",
    "UNKNOWN_ERROR"                        : "Permasalahan tidak diketahui.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Pengaturan Ekstensi",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Gagal membuka daftar ekstensi. Silahkan coba lagi.",
    "INSTALL_FROM_URL"                     : "Install dari URL\u2026",
    "EXTENSION_AUTHOR"                     : "Pembuat",
    "EXTENSION_DATE"                       : "Tanggal",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Aplikasi ini membutuhkan versi terbaru dari {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Ekstensi ini hanya  dapat digunakan pada versi {APP_NAME} yang lama.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "Versi {0} dari extensi ini meminta versi terbaru dari {APP_NAME}. Tapi anda tetap dapat menginstall versi sebelumnya {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "Versi {0} hanya dapa digunakan pada versi {APP_NAME} yang lama. Tapi tetap dapat menggunakan versi sebelumnya {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "Tanpa Keterangan",
    "EXTENSION_MORE_INFO"                  : "Info selengkapnya...",
    "EXTENSION_ERROR"                      : "Ekstensi Error",
    "EXTENSION_KEYWORDS"                   : "Kata Kunci",
    "EXTENSION_INSTALLED"                  : "Terinstall",
    "EXTENSION_UPDATE_INSTALLED"           : "Update untuk extensi ini telah diinstal dan akan dijalankan setelah {APP_NAME} di buka ulang.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Cari",
    "EXTENSION_MORE_INFO_LINK"             : "Selengkapnya",
    "BROWSE_EXTENSIONS"                    : "Browse Extensions",
    "EXTENSION_MANAGER_REMOVE"             : "Hapus Extensi",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Gagal menghapus extensi: {0}. {APP_NAME} akan tetap dijalankan ulang.",
    "EXTENSION_MANAGER_UPDATE"             : "Update Ekstensi",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "gagal melakukan update ekstensi: {0}. {APP_NAME} akan tetap di jalankan ulang.",
    "MARKED_FOR_REMOVAL"                   : "Ditandai untuk dihapus",
    "UNDO_REMOVE"                          : "Undo",
    "MARKED_FOR_UPDATE"                    : "Ditandai untuk diupdate",
    "UNDO_UPDATE"                          : "Undo",
    "CHANGE_AND_RELOAD_TITLE"              : "Ganti Ekstensi",
    "CHANGE_AND_RELOAD_MESSAGE"            : "Untuk update atau hapus ekstensi yang di tandai, {APP_NAME} akan dijalankan ulang. Anda akan diminta untuk menyimpan perubahan.",
    "REMOVE_AND_RELOAD"                    : "Hapus Ekstensi dan jalankan ulang",
    "CHANGE_AND_RELOAD"                    : "Ganti Ekstensi dan jalankan ulang",
    "UPDATE_AND_RELOAD"                    : "Update Ekstensi dan jalankan ulang",
    "PROCESSING_EXTENSIONS"                : "Memproses perubahan ekstensi\u2026",
    "EXTENSION_NOT_INSTALLED"              : "Tidak dapat menghapus extensi {0} because it wasn't installed.",
    "NO_EXTENSIONS"                        : "Belum ada Ekstensi yang diinstal.<br>Klik pada tab tersedia untuk mwnginstall EKstensi.",
    "NO_EXTENSION_MATCHES"                 : "Tidak ditemukan Ekstensi yang sesuai dengan kriteria pencarian.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Hati - hati dalam menginstall ekstensi dari sumber yang tidak di ketahui.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Terinstall",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Ditemukan",
    "EXTENSIONS_UPDATES_TITLE"             : "Update",

    "INLINE_EDITOR_NO_MATCHES"             : "Tidak ditemukan kesamaan.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "TIdak di temukan kesamaan dengan yang di pilih.<br> Click \"New Rule\" untuk membuat atribut baru.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Tidak ditemukan file css.<br>Buat file css untuk menambahkan atribut.",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "pixel",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Debug",
    "CMD_SHOW_DEV_TOOLS"                        : "Tampilkan Developer Tools",
    "CMD_REFRESH_WINDOW"                        : "Jalankan Ulang Dengan Ekstensi",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Jalankan Ulang Tanpa Ekstensi",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Jendela {APP_NAME} Baru",
    "CMD_SWITCH_LANGUAGE"                       : "Ganti Bahasa",
    "CMD_RUN_UNIT_TESTS"                        : "Jalankan Tes",
    "CMD_SHOW_PERF_DATA"                        : "Tampilkan Data Performa",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Ijinkan Node Debugger",
    "CMD_LOG_NODE_STATE"                        : "Tampilkan log Node di konsol",
    "CMD_RESTART_NODE"                          : "Jalankan Ulang Node",

    "LANGUAGE_TITLE"                            : "Ganti Bahasa",
    "LANGUAGE_MESSAGE"                          : "Bahasa:",
    "LANGUAGE_SUBMIT"                           : "Jalankan ulang {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Batal",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Sistem Default",

    // Locales (used by Debug > Switch Language)
    "LOCALE_CS"                                 : "Czech",
    "LOCALE_DE"                                 : "German",
    "LOCALE_EL"                                 : "Greek",
    "LOCALE_EN"                                 : "English",
    "LOCALE_ES"                                 : "Spanish",
    "LOCALE_FI"                                 : "Finnish",
    "LOCALE_FR"                                 : "French",
    "LOCALE_IT"                                 : "Italian",
    "LOCALE_JA"                                 : "Japanese",
    "LOCALE_NB"                                 : "Norwegian",
    "LOCALE_NL"                                 : "Dutch",
    "LOCALE_FA_IR"                              : "Persian-Farsi",
    "LOCALE_PL"                                 : "Polish",
    "LOCALE_PT_BR"                              : "Portuguese, Brazil",
    "LOCALE_PT_PT"                              : "Portuguese",
    "LOCALE_RO"                                 : "Romanian",
    "LOCALE_RU"                                 : "Russian",
    "LOCALE_SK"                                 : "Slovak",
    "LOCALE_SR"                                 : "Serbian",
    "LOCALE_SV"                                 : "Swedish",
    "LOCALE_TR"                                 : "Turkish",
    "LOCALE_ZH_CN"                              : "Chinese, simplified",
    "LOCALE_HU"                                 : "Hungarian",
    "LOCALE_KO"                                 : "Korean",
    "LOCALE_ID"                                 : "Indonesian",

    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Waktu",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Progres",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Pindahkan Poin Yang Dipilih<br><kbd class='text'>Shift</kbd> Pindahkan 10 unit<br><kbd class='text'>Tab</kbd> Pindah poin",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Tambah atau kurangi langkah<br><kbd>←</kbd><kbd>→</kbd> 'Mulai' or 'Selesai'",

    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Warna Sekarang",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Warna Aslinya",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "Format RGBa",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Format Hex",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "Format HSLa",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Digunakan {1} kali)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Digunakan {1} kali)",

    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Pindah ke definisi",
    "CMD_SHOW_PARAMETER_HINT"                   : "Tampilkan hint untuk parameter",
    "NO_ARGUMENTS"                              : "<tidak ada parameter>",

    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Tampilkan perubahan saat hover",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Proyek yang dibuka sebelumnya",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Baca selengkapnya"
});
