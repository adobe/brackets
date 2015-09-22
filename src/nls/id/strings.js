/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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
    "NOT_FOUND_ERR"                     : "File/direktori tidak dapat ditemukan.",
    "NOT_READABLE_ERR"                  : "File/direktori tidak dapat dibaca.",
    "EXCEEDS_MAX_FILE_SIZE"             : "File lebih besar dari {0} MB tidak dapat dibuka di {APP_NAME}.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Direktori tujuan tidak dapat dimodifikasi.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Anda tidak memiliki izin untuk melakukan perubahan.",
    "CONTENTS_MODIFIED_ERR"             : "File telah dimodifikasi di luar {APP_NAME}.",
    "UNSUPPORTED_ENCODING_ERR"          : "{APP_NAME} saat ini hanya mendukung file teks yang di-encode dengan UTF-8.",
    "FILE_EXISTS_ERR"                   : "File atau direktori sudah ada.",
    "FILE"                              : "file",
    "FILE_TITLE"                        : "File",
    "DIRECTORY"                         : "direktori",
    "DIRECTORY_TITLE"                   : "Direktori",
    "DIRECTORY_NAMES_LEDE"              : "Nama direktori",
    "FILENAMES_LEDE"                    : "Nama file",
    "FILENAME"                          : "Nama file",
    "DIRECTORY_NAME"                    : "Nama Direktori",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Gagal Memuat Proyek",
    "OPEN_DIALOG_ERROR"                 : "Terjadi kesalahan saat menampilkan dialog buka file. (kesalahan {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Terjadi kesalahan saat mencoba memuat direktori <span class='dialog-filename'>{0}</span>. (kesalahan {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Terjadi kesalahan saat membaca konten direktori <span class='dialog-filename'>{0}</span>. (kesalahan {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Gagal Membuka File",
    "ERROR_OPENING_FILE"                : "Terjadi kesalahan saat mencoba membuka file <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Terjadi kesalahan saat mencoba membuka file berikut:",
    "ERROR_RELOADING_FILE_TITLE"        : "Gagal Memuat Ulang Perubahan dari Disk",
    "ERROR_RELOADING_FILE"              : "Terjadi kesalahan saat mencoba memuat ulang file <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Gagal Menyimpan File",
    "ERROR_SAVING_FILE"                 : "Terjadi kesalahan saat mencoba menyimpan file <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Gagal Mengubah Nama {0}",
    "ERROR_RENAMING_FILE"               : "Terjadi kesalahan saat mencoba mengubah nama {2} <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Gagal Menghapus {0}",
    "ERROR_DELETING_FILE"               : "Terjadi kesalahan saat mencoba menghapus {2} <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "{0} Tidak Valid",
    "INVALID_FILENAME_MESSAGE"          : "{0} tidak boleh menggunakan istilah cadangan milik sistem, akhiri dengan titik (.) atau gunakan karakter berikut: <code class='emphasized'>{1}</code>",
    "ENTRY_WITH_SAME_NAME_EXISTS"       : "File atau direktori dengan nama <span class='dialog-filename'>{0}</span> sudah ada.",
    "ERROR_CREATING_FILE_TITLE"         : "Gagal Membuat {0}",
    "ERROR_CREATING_FILE"               : "Terjadi kesalahan saat mencoba membuat {0} <span class='dialog-filename'>{1}</span>. {2}",
    "ERROR_MIXED_DRAGDROP"              : "Tidak dapat membuka folder di saat yang sama sedang membuka file lain.",
    
    // User key map error strings
    "ERROR_KEYMAP_TITLE"                : "Gagal Membaca Peta Kunci Pengguna",
    "ERROR_KEYMAP_CORRUPT"              : "File kunci peta Anda bukan JSON yang valid. File akan dibuka agar Anda dapat memperbaikinya.",
    "ERROR_LOADING_KEYMAP"              : "File kunci peta Anda tidak ter-encode dengan UTF-8 secara valid dan tidak dapat dimuat",
    "ERROR_RESTRICTED_COMMANDS"         : "Anda tidak dapat menetapkan ulang pintasan untuk perintah ini: {0}",
    "ERROR_RESTRICTED_SHORTCUTS"        : "Anda tidak dapat menetapkan ulang pintasan ini: {0}",
    "ERROR_MULTIPLE_SHORTCUTS"          : "Anda sedang menetapkan ulang banyak pintasan untuk perintah ini: {0}",
    "ERROR_DUPLICATE_SHORTCUTS"         : "Anda mempunyai banyak kaitan untuk pintasan ini: {0}",
    "ERROR_INVALID_SHORTCUTS"           : "Pintasan ini tidak valid: {0}",
    "ERROR_NONEXISTENT_COMMANDS"        : "Anda sedang menetapkan pintasan untuk perintah yang tidak ada: {0}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"         : "Gagal Membaca Preferensi",
    "ERROR_PREFS_CORRUPT"               : "File preferensi Anda bukan merupakan JSON yang valid. File akan dibuka agar Anda dapat memperbaikinya. Anda perlu memulai ulang {APP_NAME} untuk memberlakukan perubahan.",
    
    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Ups! {APP_NAME} Belum Dapat Dijalankan di Peramban.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} dibuat menggunakan HTML, tetapi saat ini berjalan sebagai aplikasi desktop agar Anda dapat mengedit file lokal. Gunakan shell aplikasi di repositori <b>github.com/adobe/brackets-shell</b> untuk menjalankan {APP_NAME}.",

    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "Gagal Mengindeks File",
    "ERROR_MAX_FILES"                   : "Proyek ini mempunyai lebih dari 30,000 file. Fitur yang beroperasi di beberapa file mungkin dinonaktifkan atau bersikap seolah-olah proyek kosong. <a href='https://github.com/adobe/brackets/wiki/Large-Projects'>Baca selengkapnya tentang bekerja dengan proyek besar</a>.",

    // Live Preview error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Gagal Menjalankan Peramban",
    "ERROR_CANT_FIND_CHROME"            : "Peramban Google Chrome tidak dapat ditemukan. Pastikan Anda telah menginstalnya.",
    "ERROR_LAUNCHING_BROWSER"           : "Terjadi kesalahan saat menjalankan peramban. (kesalahan {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Tinjauan Langsung Gagal",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Menyambung ke Peramban",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Agar Tinjauan Langsung dapat tersambung, Chrome harus dijalankan ulang dengan mode Remote Debugging.<br /><br />Apakah Anda ingin menjalankan ulang Chrome dan mengaktifkan Remote Debugging?<br /><br />",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Tidak dapat memuat halaman Tinjauan Langsung",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Buka file HTML atau pastikan di dalam proyek Anda ada file index.html agar bisa menjalankan tinjauan langsung.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Untuk menjalankan tinjauan langsung dengan file sisi-server, Anda perlu mengatur URL Dasar untuk proyek ini.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Gagal menjalankan server HTTP untuk meninjau langsung file. Coba lagi.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Selamat Datang di Tinjauan Langsung!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Tinjauan Langsung menghubungkan {APP_NAME} ke peramban Anda, menjalankan file HTML Anda di peramban dan memperbarui tampilannya selagi Anda mengedit kode.<br /><br />Di versi awal {APP_NAME} ini, Tinjauan Langsung hanya bekerja pada <strong>Google Chrome</strong> dan memperbarui langsung selagi Anda mengedit <strong>file CSS atau HTML</strong>. Perubahan pada file JavaScript secara otomatis dimuat ulang saat Anda menyimpannya.<br /><br />(Anda hanya melihat pesan ini sekali.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Untuk informasi selengkapnya, lihat <a href='{0}' title='{0}'>Mengatasi masalah sambungan Tinjauan Langsung</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Tinjauan Langsung",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Tinjauan Langsung: Menyambung\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Tinjauan Langsung: Menginisialisasi\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Putuskan sambungan Tinjauan Langsung",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Tinjauan Langsung (simpan file untuk muat ulang)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Tinjauan Langsung (gagal memperbarui karena kesalahan sintaks)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Tinjauan Langsung dibatalkan karena Alat Pengembang pada peramban sedang dibuka",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Tinjauan Langsung dibatalkan karena halaman telah ditutup pada peramban",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Tinjauan Langsung dibatalkan karena peramban berpindah ke halaman yang bukan dari proyek",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Tinjauan Langsung dibatalkan karena alasan yang tidak diketahui ({0})",

    "SAVE_CLOSE_TITLE"                  : "Simpan Perubahan",
    "SAVE_CLOSE_MESSAGE"                : "Apakah Anda ingin menyimpan perubahan yang Anda buat di dokumen <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Apakah Anda ingin menyimpan perubahan pada file berikut?",
    "EXT_MODIFIED_TITLE"                : "Perubahan Eksternal",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Konfirmasi Hapus",
    "CONFIRM_FOLDER_DELETE"             : "Apakah Anda yakin ingin menghapus folder <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "File Dihapus",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> telah dimodifikasi di disk.<br /><br />Apakah Anda ingin menyimpan file dan menimpa perubahan tersebut?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> telah dimodifikasi, tetapi juga ada perubahan yang belum disimpan di {APP_NAME}.<br /><br />Versi mana yang ingin Anda simpan?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> telah dihapus di disk, tetapi ada perubahan yang belum disimpan di {APP_NAME}.<br /><br />Apakah Anda ingin menyimpan perubahan?",

    // Generic dialog/button labels
    "DONE"                              : "Selesai",
    "OK"                                : "OK",
    "CANCEL"                            : "Batal",
    "DONT_SAVE"                         : "Jangan Disimpan",
    "SAVE"                              : "Simpan",
    "SAVE_AS"                           : "Simpan Sebagai\u2026",
    "SAVE_AND_OVERWRITE"                : "Timpa",
    "DELETE"                            : "Hapus",
    "BUTTON_YES"                        : "Ya",
    "BUTTON_NO"                         : "Tidak",

    // Find, Replace, Find in Files
    "FIND_MATCH_INDEX"                  : "{0} dari {1}",
    "FIND_NO_RESULTS"                   : "Tidak ada hasil",
    "FIND_QUERY_PLACEHOLDER"            : "Temukan\u2026",
    "REPLACE_PLACEHOLDER"               : "Ganti dengan\u2026",
    "BUTTON_REPLACE_ALL"                : "Batch\u2026",
    "BUTTON_REPLACE_ALL_IN_FILES"       : "Ganti\u2026",
    "BUTTON_REPLACE"                    : "Ganti",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Kecocokan Berikutnya",
    "BUTTON_PREV_HINT"                  : "Kecocokan Sebelumnya",
    "BUTTON_CASESENSITIVE_HINT"         : "Cocokkan Huruf Besar/Kecil",
    "BUTTON_REGEXP_HINT"                : "Regular Expression",
    "REPLACE_WITHOUT_UNDO_WARNING_TITLE": "Ganti Tanpa Urung",
    "REPLACE_WITHOUT_UNDO_WARNING"      : "Karena lebih dari {0} file perlu diubah, {APP_NAME} akan memodifikasi file yang tidak dibuka di disk.<br />Anda tidak akan bisa membatalkan perubahan pada file tersebut.",
    "BUTTON_REPLACE_WITHOUT_UNDO"       : "Ganti Tanpa Urung",
    
    "OPEN_FILE"                         : "Buka File",
    "SAVE_FILE_AS"                      : "Simpan File",
    "CHOOSE_FOLDER"                     : "Pilih folder",

    "RELEASE_NOTES"                     : "Catatan Rilis",
    "NO_UPDATE_TITLE"                   : "Versi terbaru!",
    "NO_UPDATE_MESSAGE"                 : "Anda sedang menjalankan versi terbaru dari {APP_NAME}.",
    
    // Find and Replace
    "FIND_REPLACE_TITLE_LABEL"          : "Ganti",
    "FIND_REPLACE_TITLE_WITH"           : "dengan",
    "FIND_TITLE_LABEL"                  : "Ditemukan",
    "FIND_TITLE_SUMMARY"                : "&mdash; {0} {1} {2} di {3}",

    // Find in Files
    "FIND_NUM_FILES"                    : "{0} {1}",
    "FIND_IN_FILES_SCOPED"              : "di <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "pada proyek",
    "FIND_IN_FILES_ZERO_FILES"          : "Filter mengecualikan semua file {0}",
    "FIND_IN_FILES_FILE"                : "file",
    "FIND_IN_FILES_FILES"               : "file",
    "FIND_IN_FILES_MATCH"               : "hasil",
    "FIND_IN_FILES_MATCHES"             : "hasil",
    "FIND_IN_FILES_MORE_THAN"           : "Lebih dari ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "Ctrl/Cmd klik untuk melebarkan/melipat semua",
    "REPLACE_IN_FILES_ERRORS_TITLE"     : "Gagal Mengganti",
    "REPLACE_IN_FILES_ERRORS"           : "File berikut tidak termodifikasi karena berubah setelah pencarian atau tidak dapat ditulisi.",
    
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Gagal Mendapat Informasi Pembaruan",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Ada masalah saat mengambil data pembaruan dari server. Pastikan Anda terhubung ke internet dan coba lagi.",
    
    // File exclusion filters
    "NEW_FILE_FILTER"                   : "Daftar Pengecualian Baru\u2026",
    "CLEAR_FILE_FILTER"                 : "Jangan Kecualikan File",
    "NO_FILE_FILTER"                    : "Tidak Ada File yang Dikecualikan",
    "EXCLUDE_FILE_FILTER"               : "Kecualikan {0}",
    "EDIT_FILE_FILTER"                  : "Edit\u2026",
    "FILE_FILTER_DIALOG"                : "Edit Daftar Pengecualian",
    "FILE_FILTER_INSTRUCTIONS"          : "Kecualikan file dan folder yang cocok dengan kata atau <a href='{0}' title='{0}'>wildcard</a> berikut. Tulis tiap kata ke baris baru.",
    "FILTER_NAME_PLACEHOLDER"           : "Beri nama daftar pengecualian ini (opsional)",
    "FILE_FILTER_CLIPPED_SUFFIX"        : "dan {0} lagi",
    "FILTER_COUNTING_FILES"             : "Menghitung file\u2026",
    "FILTER_FILE_COUNT"                 : "Izinkan {0} dari {1} file {2}",
    "FILTER_FILE_COUNT_ALL"             : "Izinkan semua {0} file {1}",
    
    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"   : "Edit Cepat tidak tersedia untuk posisi kursor saat ini",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES"     : "Edit Cepat CSS: letakkan kursor pada satu nama class",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"      : "Edit Cepat CSS: atribut class tidak lengkap",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"         : "Edit Cepat CSS: atribut id tidak lengkap",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"    : "Edit Cepat CSS: letakkan kursor pada tag, class, atau id",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"   : "Edit Cepat Fungsi Waktu CSS: sintaks tidak valid",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"    : "Edit Cepat JS: letakkan kursor pada nama fungsi",
    
    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"   : "Dokumentasi Cepat tidak tersedia untuk posisi kursor saat ini",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Memuat\u2026",
    "UNTITLED"          : "Tanpa Judul",
    "WORKING_FILES"     : "File Kerja",
    
    /**
     * MainViewManager
     */
    "TOP"               : "Atas",
    "BOTTOM"            : "Bawah",
    "LEFT"              : "Kiri",
    "RIGHT"             : "Kanan",
    
    "CMD_SPLITVIEW_NONE"        : "Tanpa Sekat",
    "CMD_SPLITVIEW_VERTICAL"    : "Sekat Vertikal",
    "CMD_SPLITVIEW_HORIZONTAL"  : "Sekat Horisontal",
    "SPLITVIEW_MENU_TOOLTIP"    : "Beri sekat pada editor secara horisontal atau vertikal",
    "GEAR_MENU_TOOLTIP"         : "Atur Daftar Kerja",
    
    "SPLITVIEW_INFO_TITLE"              : "Sudah Terbuka",
    "SPLITVIEW_MULTIPANE_WARNING"       : "File telah terbuka di panel lain. {APP_NAME} akan segera mendukung pembukaan file yang sama pada lebih dari satu panel. Sementara itu, file akan ditampilkan di panel yang telah membukanya.<br /><br />(Anda hanya melihat pesan ini sekali.)",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Spasi",

    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Baris {0}, Kolom {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 {0} kolom dipilih",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 {0} kolom dipilih",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 {0} baris dipilih",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 {0} baris dipilih",
    "STATUSBAR_SELECTION_MULTIPLE"          : " \u2014 {0} pilihan",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Klik untuk mengganti inden menjadi spasi",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Klik untuk mengganti inden menjadi tab",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Klik untuk mengubah jumlah spasi yang digunakan untuk indentasi",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Klik untuk mengubah ukuran karakter tab",
    "STATUSBAR_SPACES"                      : "Spasi:",
    "STATUSBAR_TAB_SIZE"                    : "Ukuran Tab:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} Baris",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} Baris",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Ekstensi Tidak Aktif",
    "STATUSBAR_INSERT"                      : "INS",
    "STATUSBAR_OVERWRITE"                   : "OVR",
    "STATUSBAR_INSOVR_TOOLTIP"              : "Klik untuk beralih antara mode Sisipan (INS) dan Timpa (OVR)",
    "STATUSBAR_LANG_TOOLTIP"                : "Klik untuk mengubah tipe file",
    "STATUSBAR_CODE_INSPECTION_TOOLTIP"     : "{0}. Klik untuk menampilkan/menyembunyikan panel laporan.",
    "STATUSBAR_DEFAULT_LANG"                : "(default)",
    "STATUSBAR_SET_DEFAULT_LANG"            : "Simpan sebagai Default untuk File .{0}",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} Masalah",
    "SINGLE_ERROR"                          : "1 Masalah {0}",
    "MULTIPLE_ERRORS"                       : "{1} Masalah {0}",
    "NO_ERRORS"                             : "Tidak ditemukan masalah {0} - kerja bagus!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Tidak ditemukan masalah - kerja bagus!",
    "LINT_DISABLED"                         : "Analisa lint tidak aktif",
    "NO_LINT_AVAILABLE"                     : "Tidak ada program lint yang tersedia untuk {0}",
    "NOTHING_TO_LINT"                       : "Tidak ada yang dapat dianalisis",
    "LINTER_TIMED_OUT"                      : "{0} telah habis waktunya setelah menunggu selama {1} ms",
    "LINTER_FAILED"                         : "{0} dihentikan dengan kesalahan: {1}",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "File",
    "CMD_FILE_NEW_UNTITLED"               : "Baru",
    "CMD_FILE_NEW"                        : "File Baru",
    "CMD_FILE_NEW_FOLDER"                 : "Folder Baru",
    "CMD_FILE_OPEN"                       : "Buka\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Buka di Daftar Kerja",
    "CMD_OPEN_DROPPED_FILES"              : "Buka File yang Didrop",
    "CMD_OPEN_FOLDER"                     : "Buka Folder\u2026",
    "CMD_FILE_CLOSE"                      : "Tutup",
    "CMD_FILE_CLOSE_ALL"                  : "Tutup Semua",
    "CMD_FILE_CLOSE_LIST"                 : "Tutup Daftar",
    "CMD_FILE_CLOSE_OTHERS"               : "Tutup Lainnya",
    "CMD_FILE_CLOSE_ABOVE"                : "Tutup yang di Atas",
    "CMD_FILE_CLOSE_BELOW"                : "Tutup yang di Bawah",
    "CMD_FILE_SAVE"                       : "Simpan",
    "CMD_FILE_SAVE_ALL"                   : "Simpan Semua",
    "CMD_FILE_SAVE_AS"                    : "Simpan Sebagai\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Tinjauan Langsung",
    "CMD_TOGGLE_LIVE_PREVIEW_MB_MODE"     : "Aktifkan Tinjauan Langsung Eksperimental",
    "CMD_RELOAD_LIVE_PREVIEW"             : "Memaksa Muat Ulang Tinjauan Langsung",
    "CMD_PROJECT_SETTINGS"                : "Pengaturan Proyek\u2026",
    "CMD_FILE_RENAME"                     : "Ubah Nama",
    "CMD_FILE_DELETE"                     : "Hapus",
    "CMD_INSTALL_EXTENSION"               : "Instal Ekstensi\u2026",
    "CMD_EXTENSION_MANAGER"               : "Pengelola Ekstensi\u2026",
    "CMD_FILE_REFRESH"                    : "Muat Ulang Daftar File",
    "CMD_QUIT"                            : "Keluar",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Keluar",

    // Edit menu commands
    "EDIT_MENU"                           : "Edit",
    "CMD_UNDO"                            : "Urung",
    "CMD_REDO"                            : "Ulangi",
    "CMD_CUT"                             : "Potong",
    "CMD_COPY"                            : "Salin",
    "CMD_PASTE"                           : "Tempel",
    "CMD_SELECT_ALL"                      : "Pilih Semua",
    "CMD_SELECT_LINE"                     : "Pilih Baris",
    "CMD_SPLIT_SEL_INTO_LINES"            : "Pisahkan Pilihan menjadi Baris",
    "CMD_ADD_CUR_TO_NEXT_LINE"            : "Tambahkan Kursor ke Baris Selanjutnya",
    "CMD_ADD_CUR_TO_PREV_LINE"            : "Tambahkan Kursor ke Baris Sebelumnya",
    "CMD_INDENT"                          : "Inden",
    "CMD_UNINDENT"                        : "Batalkan Inden",
    "CMD_DUPLICATE"                       : "Gandakan",
    "CMD_DELETE_LINES"                    : "Hapus Baris",
    "CMD_COMMENT"                         : "Aktifkan/Nonaktifkan Komentar Baris",
    "CMD_BLOCK_COMMENT"                   : "Aktifkan/Nonaktifkan Komentar Blok",
    "CMD_LINE_UP"                         : "Pindahkan Baris ke Atas",
    "CMD_LINE_DOWN"                       : "Pindahkan Baris ke Bawah",
    "CMD_OPEN_LINE_ABOVE"                 : "Buka Baris di Atas",
    "CMD_OPEN_LINE_BELOW"                 : "Buka Baris di Bawah",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Tutup Kurung Otomatis",
    "CMD_SHOW_CODE_HINTS"                 : "Tampilkan Petunjuk Kode",
    
    // Search menu commands
    "FIND_MENU"                           : "Temukan",
    "CMD_FIND"                            : "Temukan",
    "CMD_FIND_NEXT"                       : "Temukan Berikutnya",
    "CMD_FIND_PREVIOUS"                   : "Temukan Sebelumnya",
    "CMD_FIND_ALL_AND_SELECT"             : "Temukan Semuanya dan Pilih",
    "CMD_ADD_NEXT_MATCH"                  : "Tambahkan Hasil Berikutnya ke Pilihan",
    "CMD_SKIP_CURRENT_MATCH"              : "Lewati dan Tambahkan Hasil Berikutnya",
    "CMD_FIND_IN_FILES"                   : "Temukan di File",
    "CMD_FIND_IN_SUBTREE"                 : "Temukan\u2026",
    "CMD_REPLACE"                         : "Ganti",
    "CMD_REPLACE_IN_FILES"                : "Ganti di File",
    "CMD_REPLACE_IN_SUBTREE"              : "Ganti di\u2026",

    // View menu commands
    "VIEW_MENU"                           : "Tampilan",
    "CMD_HIDE_SIDEBAR"                    : "Sembunyikan Sidebar",
    "CMD_SHOW_SIDEBAR"                    : "Tampilkan Sidebar",
    "CMD_INCREASE_FONT_SIZE"              : "Perbesar Ukuran Huruf",
    "CMD_DECREASE_FONT_SIZE"              : "Perkecil Ukuran Huruf",
    "CMD_RESTORE_FONT_SIZE"               : "Kembalikan Huruf ke Ukuran Awal",
    "CMD_SCROLL_LINE_UP"                  : "Scroll Baris ke Atas",
    "CMD_SCROLL_LINE_DOWN"                : "Scroll Baris ke Bawah",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Nomor Baris",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Sorot Baris yang Aktif",
    "CMD_TOGGLE_WORD_WRAP"                : "Word Wrap",
    "CMD_LIVE_HIGHLIGHT"                  : "Sorotan Tinjauan Langsung",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Analisa File saat Menyimpan",
    "CMD_WORKINGSET_SORT_BY_ADDED"        : "Urutkan Berdasarkan Waktu",
    "CMD_WORKINGSET_SORT_BY_NAME"         : "Urutkan Berdasarkan Nama",
    "CMD_WORKINGSET_SORT_BY_TYPE"         : "Urutkan Berdasarkan Jenis",
    "CMD_WORKING_SORT_TOGGLE_AUTO"        : "Urutkan Secara Otomatis",
    "CMD_THEMES"                          : "Tema\u2026",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigasi",
    "CMD_QUICK_OPEN"                      : "Buka Cepat",
    "CMD_GOTO_LINE"                       : "Pergi ke Baris",
    "CMD_GOTO_DEFINITION"                 : "Cari Cepat Definisi",
    "CMD_GOTO_FIRST_PROBLEM"              : "Pergi ke Masalah Pertama",
    "CMD_TOGGLE_QUICK_EDIT"               : "Edit Cepat",
    "CMD_TOGGLE_QUICK_DOCS"               : "Dokumentasi Cepat",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Hasil Sebelumnya",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Hasil Berikutnya",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Aturan Baru",
    "CMD_NEXT_DOC"                        : "Dokumen Berikutnya",
    "CMD_PREV_DOC"                        : "Dokumen Sebelumnya",
    "CMD_SHOW_IN_TREE"                    : "Tampilkan di Daftar File",
    "CMD_SHOW_IN_EXPLORER"                : "Tampilkan di Penelusur",
    "CMD_SHOW_IN_FINDER"                  : "Tampilkan di Pencari",
    "CMD_SHOW_IN_OS"                      : "Tampilkan di OS",

    // Help menu commands
    "HELP_MENU"                           : "Bantuan",
    "CMD_CHECK_FOR_UPDATE"                : "Periksa Pembaruan",
    "CMD_HOW_TO_USE_BRACKETS"             : "Bagaimana Menggunakan {APP_NAME}",
    "CMD_SUPPORT"                         : "Bantuan {APP_NAME}",
    "CMD_SUGGEST"                         : "Sarankan Fitur",
    "CMD_RELEASE_NOTES"                   : "Catatan Rilis",
    "CMD_GET_INVOLVED"                    : "Ikut Terlibat",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Tampilkan Folder Ekstensi",
    "CMD_HOMEPAGE"                        : "Beranda {APP_TITLE}",
    "CMD_TWITTER"                         : "{TWITTER_NAME} di Twitter",
    "CMD_ABOUT"                           : "Tentang {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "Buka File Preferensi",
    "CMD_OPEN_KEYMAP"                     : "Buka Peta Kunci Pengguna",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "versi eksperimental",
    "RELEASE_BUILD"                        : "versi",
    "DEVELOPMENT_BUILD"                    : "versi pengembangan",
    "RELOAD_FROM_DISK"                     : "Muat Ulang dari Disk",
    "KEEP_CHANGES_IN_EDITOR"               : "Simpan Perubahan di Editor",
    "CLOSE_DONT_SAVE"                      : "Tutup (Jangan Simpan)",
    "RELAUNCH_CHROME"                      : "Jalankan Ulang Chrome",
    "ABOUT"                                : "Tentang",
    "CLOSE"                                : "Tutup",
    "ABOUT_TEXT_LINE1"                     : "Rilis {VERSION_MAJOR}.{VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_BUILD_TIMESTAMP"           : "timestamp versi: ",
    "ABOUT_TEXT_LINE3"                     : "Catatan, syarat dan ketentuan mengenai perangkat lunak pihak ketiga ada di <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> dan digunakan di sini sebagai acuan.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentasi dan kode sumber di <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Dibuat dengan \u2764 dan JavaScript oleh:",
    "ABOUT_TEXT_LINE6"                     : "Banyak sekali orang (tetapi kami tidak dapat menampilkan daftarnya saat ini).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Dokumentasi dan logo grafis Web Platform berlisensi Creative Commons Attribution, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Versi terbaru dari {APP_NAME} telah tersedia! Klik disini untuk lebih detail.",
    "UPDATE_AVAILABLE_TITLE"               : "Pembaruan Tersedia",
    "UPDATE_MESSAGE"                       : "Hai, versi terbaru {APP_NAME} sudah ada. Ini fitur terbarunya:",
    "GET_IT_NOW"                           : "Dapatkan sekarang!",
    "PROJECT_SETTINGS_TITLE"               : "Pengaturan Proyek untuk: {0}",
    "PROJECT_SETTING_BASE_URL"             : "URL Dasar untuk Tinjauan Langsung",
    "PROJECT_SETTING_BASE_URL_HINT"        : "Untuk menggunakan server lokal, masukkan url seperti http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Protokol {0} tidak didukung oleh Tinjauan Langsung&mdash;gunakan http: atau https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "URL dasar tidak boleh mengandung parameter pencarian seperti \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "URL dasar tidak boleh mengandung tanda hash seperti \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Karakter spesial seperti '{0}' harus ter-encode dalam format %.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Gagal membuka URL Dasar",
    "EMPTY_VIEW_HEADER"                    : "<em>Buka file ketika panel ini mendapat fokus</em>",
    
    // Strings for themes-settings.html and themes-general.html
    "CURRENT_THEME"                        : "Tema Saat Ini",
    "USE_THEME_SCROLLBARS"                 : "Gunakan Scrollbar Tema",
    "FONT_SIZE"                            : "Ukuran Huruf",
    "FONT_FAMILY"                          : "Famili Huruf",
    "THEMES_SETTINGS"                      : "Pengaturan Tema",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Aturan Baru",

    // Extension Management strings
    "INSTALL"                              : "Instal",
    "UPDATE"                               : "Perbarui",
    "REMOVE"                               : "Buang",
    "OVERWRITE"                            : "Timpa",
    "CANT_REMOVE_DEV"                      : "Ekstensi pada folder \"dev\" harus dihapus secara manual.",
    "CANT_UPDATE"                          : "Pembaruan tidak kompatibel dengan {APP_NAME} versi ini.",
    "CANT_UPDATE_DEV"                      : "Ekstensi pada folder \"dev\" tidak dapat diperbarui secara otomatis.",
    "INSTALL_EXTENSION_TITLE"              : "Instal Ekstensi",
    "UPDATE_EXTENSION_TITLE"               : "Perbarui Ekstensi",
    "INSTALL_EXTENSION_LABEL"              : "URL Ekstensi",
    "INSTALL_EXTENSION_HINT"               : "URL file zip atau repositori GitHub dari ekstensi",
    "INSTALLING_FROM"                      : "Menginstal ekstensi dari {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Instalasi sukses!",
    "INSTALL_FAILED"                       : "Instalasi gagal.",
    "CANCELING_INSTALL"                    : "Membatalkan\u2026",
    "CANCELING_HUNG"                       : "Pembatalan memakan waktu terlalu lama. Mungkin telah terjadi kesalahan internal.",
    "INSTALL_CANCELED"                     : "Instalasi dibatalkan.",
    "VIEW_COMPLETE_DESCRIPTION"            : "Tampilkan deskripsi lengkap",
    "VIEW_TRUNCATED_DESCRIPTION"           : "Tampilkan deskripsi singkat",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Konten yang diunduh bukan file zip yang valid.",
    "INVALID_PACKAGE_JSON"                 : "File package.json tidak valid (kesalahan: {0}).",
    "MISSING_PACKAGE_NAME"                 : "File package.json tidak menyebutkan nama paket.",
    "BAD_PACKAGE_NAME"                     : "{0} adalah nama paket yang tidak valid.",
    "MISSING_PACKAGE_VERSION"              : "File package.json tidak menyebutkan versi paket.",
    "INVALID_VERSION_NUMBER"               : "Nomor versi paket ({0}) tidak valid.",
    "INVALID_BRACKETS_VERSION"             : "String kompatibilitas {APP_NAME} ({0}) tidak valid.",
    "DISALLOWED_WORDS"                     : "Kata ({1}) tidak diizinkan di kolom {0}.",
    "API_NOT_COMPATIBLE"                   : "Ekstensi tidak cocok dengan versi {APP_NAME} ini. Ekstensi diinstal pada folder ekstensi nonaktif.",
    "MISSING_MAIN"                         : "Paket ini tidak mempunyai file main.js.",
    "EXTENSION_ALREADY_INSTALLED"          : "Menginstal paket ini akan menimpa ekstensi yang lama. Timpa ekstensi?",
    "EXTENSION_SAME_VERSION"               : "Versi paket ini sama dengan yang terinstal saat ini. Timpa ekstensi yang ada?",
    "EXTENSION_OLDER_VERSION"              : "Paket ini adalah versi {0} yang lebih lama dari versi yang terinstal saat ini ({1}). Timpa instalasi yang ada?",
    "DOWNLOAD_ID_IN_USE"                   : "Kesalahan internal: ID unduh sedang digunakan.",
    "NO_SERVER_RESPONSE"                   : "Tidak dapat tersambung ke server.",
    "BAD_HTTP_STATUS"                      : "File tidak ditemukan pada server (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Gagal menyimpan unduhan ke file sementara.",
    "ERROR_LOADING"                        : "Ada masalah saat menjalankan ekstensi.",
    "MALFORMED_URL"                        : "URL tidak valid. Periksa kembali.",
    "UNSUPPORTED_PROTOCOL"                 : "URL harus HTTP atau HTTPS.",
    "UNKNOWN_ERROR"                        : "Kesalahan internal yang tidak diketahui.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Pengelola Ekstensi",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Gagal membuka daftar ekstensi. Coba lagi nanti.",
    "INSTALL_EXTENSION_DRAG"               : "Tarik .zip ke sini atau",
    "INSTALL_EXTENSION_DROP"               : "Jatuhkan .zip untuk menginstal",
    "INSTALL_EXTENSION_DROP_ERROR"         : "Instal/Pembaruan dibatalkan karena kesalahan berikut:",
    "INSTALL_FROM_URL"                     : "Instal dari URL\u2026",
    "INSTALL_EXTENSION_VALIDATING"         : "Memvalidasi\u2026",
    "EXTENSION_AUTHOR"                     : "Pembuat",
    "EXTENSION_DATE"                       : "Tanggal",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Ekstensi ini membutuhkan versi {APP_NAME} yang lebih baru.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Ekstensi ini hanya  kompatibel dengan versi {APP_NAME} yang lama.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "Versi {0} dari ekstensi ini membutuhkan versi terbaru dari {APP_NAME}. Tapi Anda dapat menginstal versi sebelumnya {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "Versi {0} hanya kompatibel dengan versi {APP_NAME} yang lama. Tapi Anda dapat menginstal versi sebelumnya {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "Tanpa keterangan",
    "EXTENSION_MORE_INFO"                  : "Info selengkapnya\u2026",
    "EXTENSION_ERROR"                      : "Kesalahan Ekstensi",
    "EXTENSION_KEYWORDS"                   : "Kata Kunci",
    "EXTENSION_TRANSLATED_USER_LANG"       : "Diterjemahkan ke {0} bahasa, termasuk bahasa Anda",
    "EXTENSION_TRANSLATED_GENERAL"         : "Diterjemahkan ke {0} bahasa",
    "EXTENSION_TRANSLATED_LANGS"           : "Ekstensi ini telah diterjemahkan ke bahasa berikut: {0}",
    "EXTENSION_INSTALLED"                  : "Terinstal",
    "EXTENSION_UPDATE_INSTALLED"           : "Pembaruan untuk ekstensi ini telah terunduh dan akan diinstal setelah {APP_NAME} dimuat ulang.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Cari",
    "EXTENSION_MORE_INFO_LINK"             : "Selengkapnya",
    "BROWSE_EXTENSIONS"                    : "Telusuri Ekstensi",
    "EXTENSION_MANAGER_REMOVE"             : "Buang Ekstensi",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Gagal membuang extensi: {0}. {APP_NAME} akan tetap dimuat ulang.",
    "EXTENSION_MANAGER_UPDATE"             : "Perbarui Ekstensi",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Gagal memperbarui ekstensi: {0}. {APP_NAME} akan tetap dimuat ulang.",
    "MARKED_FOR_REMOVAL"                   : "Ditandai untuk dibuang",
    "UNDO_REMOVE"                          : "Urungkan",
    "MARKED_FOR_UPDATE"                    : "Ditandai untuk diperbarui",
    "UNDO_UPDATE"                          : "Urungkan",
    "CHANGE_AND_RELOAD_TITLE"              : "Ganti Ekstensi",
    "CHANGE_AND_RELOAD_MESSAGE"            : "Untuk memperbarui atau membuang ekstensi yang ditandai, {APP_NAME} perlu dimuat ulang. Anda akan diminta untuk menyimpan perubahan.",
    "REMOVE_AND_RELOAD"                    : "Buang Ekstensi dan Muat Ulang",
    "CHANGE_AND_RELOAD"                    : "Ganti Ekstensi dan Muat Ulang",
    "UPDATE_AND_RELOAD"                    : "Perbarui Ekstensi dan Muat Ulang",
    "PROCESSING_EXTENSIONS"                : "Memproses perubahan ekstensi\u2026",
    "EXTENSION_NOT_INSTALLED"              : "Tidak dapat membuang extensi {0} karena tidak terinstal.",
    "NO_EXTENSIONS"                        : "Belum ada ekstensi yang terinstal.<br />Klik pada tab Tersedia di atas untuk memulai.",
    "NO_EXTENSION_MATCHES"                 : "Tidak ditemukan ekstensi yang sesuai dengan kriteria pencarian.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "CATATAN: Ekstensi ini bisa berasal dari pembuat yang berbeda dari {APP_NAME}. Ekstensi tidak ditinjau dan mempunyai akses lokal secara penuh. Hati-hati ketika menginstal ekstensi dari sumber yang tidak diketahui.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Terinstal",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Tersedia",
    "EXTENSIONS_THEMES_TITLE"              : "Tema",
    "EXTENSIONS_UPDATES_TITLE"             : "Pembaruan",

    "INLINE_EDITOR_NO_MATCHES"             : "Tidak ada hasil.",
    "INLINE_EDITOR_HIDDEN_MATCHES"         : "Semua hasil disembunyikan. Perbesar file yang ditampilkan di sebelah kanan untuk menampilkannya.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Tidak ada aturan CSS yang cocok dengan kriteria Anda.<br> Klik \"Aturan Baru\" untuk membuat baru.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Proyek Anda tidak mempunyai stylesheet.<br>Buat baru untuk menambahkan aturan CSS.",
    
    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON"            : "paling besar",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "piksel",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Debug",
    "ERRORS"                                    : "Kesalahan",
    "CMD_SHOW_DEV_TOOLS"                        : "Tampilkan Alat Pengembang",
    "CMD_REFRESH_WINDOW"                        : "Muat Ulang Dengan Ekstensi",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Muat Ulang Tanpa Ekstensi",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Jendela {APP_NAME} Baru",
    "CMD_SWITCH_LANGUAGE"                       : "Ganti Bahasa",
    "CMD_RUN_UNIT_TESTS"                        : "Jalankan Tes",
    "CMD_SHOW_PERF_DATA"                        : "Tampilkan Data Performa",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Aktifkan Node Debugger",
    "CMD_LOG_NODE_STATE"                        : "Log Status Node di konsol",
    "CMD_RESTART_NODE"                          : "Jalankan Ulang Node",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"             : "Tampilkan Kesalahan di Status Bar",
    "CMD_OPEN_BRACKETS_SOURCE"                  : "Buka Kode Sumber Brackets",

    "LANGUAGE_TITLE"                            : "Ganti Bahasa",
    "LANGUAGE_MESSAGE"                          : "Bahasa:",
    "LANGUAGE_SUBMIT"                           : "Muat ulang {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Batal",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Default Sistem",

    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Waktu",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Progres",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Pindahkan titik yang dipilih<br><kbd class='text'>Shift</kbd> Pindahkan 10 unit<br><kbd class='text'>Tab</kbd> Tukar titik",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Tambah atau kurangi langkah<br><kbd>←</kbd><kbd>→</kbd> 'Awal' atau 'Akhir'",
    "INLINE_TIMING_EDITOR_INVALID"              : "Nilai <code>{0}</code> yang lama tidak valid, sehingga fungsi yang ditampilkan diubah ke <code>{1}</code>. Dokumen akan diperbarui menggunakan editan pertama.",

    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Warna Saat ini",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Warna Awal",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "Format RGBa",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Format Hex",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "Format HSLa",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Digunakan {1} kali)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Digunakan {1} kali)",

    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Lompat ke Definisi",
    "CMD_SHOW_PARAMETER_HINT"                   : "Tampilkan Petunjuk Parameter",
    "NO_ARGUMENTS"                              : "<tidak ada parameter>",
    "DETECTED_EXCLUSION_TITLE"                  : "Masalah Inferensi File JavaScript",
    "DETECTED_EXCLUSION_INFO"                   : "Brackets mengalami masalah dalam memproses <span class='dialog-filename'>{0}</span>.<br><br>File ini tidak akan lagi diproses untuk Petunjuk Kode, Lompat ke Definisi atau Edit Cepat. Untuk mengaktifkan kembali file ini, buka <code>.brackets.json</code> pada proyek Anda dan ubah <code>jscodehints.detectedExclusions</code>.<br><br>Kemungkinan ini adalah bug pada Brackets. Jika Anda dapat memberikan salinan file ini, <a href='https://github.com/adobe/brackets/wiki/How-to-Report-an-Issue'>laporkan bug/a> dengan tautan ke file yang disebutkan di sini.",

    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Tampilkan Cepat Saat Hover",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Proyek Terkini",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Baca selengkapnya"
});
/* Last translated for eef9c68a1fdff372b9ea6352cacb5e2506e55be9 */
