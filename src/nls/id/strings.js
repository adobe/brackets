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
    "GENERIC_ERROR"                     : "(error {0})",
    "NOT_FOUND_ERR"                     : "Berkas/direktori tidak ditemukan.",
    "NOT_READABLE_ERR"                  : "Berkas/direktori tidak dapat dibuka.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Direktori tujuan tidak dapat dimodifikasi.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Status anda tidak mengijinkan untuk melakukan perubahan berkas.",
    "CONTENTS_MODIFIED_ERR"             : "Berkas telah diubah di luar dari {APP_NAME}.",
    "FILE_EXISTS_ERR"                   : "Berkas atau direktori sudah ada.",
    "FILE"                              : "berkas",
    "FILE_TITLE"                        : "Berkas",
    "DIRECTORY"                         : "direktori",
    "DIRECTORY_TITLE"                   : "Direktori",
    "DIRECTORY_NAMES_LEDE"              : "Nama direktori",
    "FILENAMES_LEDE"                    : "Nama berkas",
    "FILENAME"                          : "Nama beraks",
    "DIRECTORY_NAME"                    : "Nama direktori",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Gagal Memuat Proyek",
    "OPEN_DIALOG_ERROR"                 : "Terjadi kesalahan saat menampilkan jendela buka berkas. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Terjadi kesalahan saat akan membuka direktori <span class='dialog-filename'>{0}</span>. (error {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Terjadi kesalahan saat akan membaca isi dari direktori <span class='dialog-filename'>{0}</span>. (error {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Gagal Membuka Berkas",
    "ERROR_OPENING_FILE"                : "Terjadi kesalahan saat akan membuka berkas <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Terjadi kesalahan saat akan membuka berkas berikut:",
    "ERROR_RELOADING_FILE_TITLE"        : "Gagal Memuat Ulang Perubahan dari Disk",
    "ERROR_RELOADING_FILE"              : "Terjadi kesalahan saat akan memuat ulang berkas <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Gagal Menyimpan Berkas",
    "ERROR_SAVING_FILE"                 : "Terjadi kesalahan saat akan menyimpan berkas <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Gagal Mengubah Nama {0}",
    "ERROR_RENAMING_FILE"               : "Terjadi kesalahan saat mencoba mengubah nama {2} <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Gagal Menghapus {0}",
    "ERROR_DELETING_FILE"               : "Terjadi kesalahan saat akan menghapus {2} <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Nama {0} Tidak Valid",
    "INVALID_FILENAME_MESSAGE"          : "Nama berkas {0} tidak boleh mengandung nama-nama yang telah digunakan pada sistem, berakhir dengan tanda titik (.), atau mengandung karakter-karakter berikut: <code class='emphasized'>{1}</code>.",
    "ENTRY_WITH_SAME_NAME_EXISTS"       : "Berkas atau direktori dengan nama <span class='dialog-filename'>{0}</span> sudah ada.",
    "ERROR_CREATING_FILE_TITLE"         : "Gagal Membuat {0}",
    "ERROR_CREATING_FILE"               : "Terjadi kesalahan saat akan membuat berkas {0} <span class='dialog-filename'>{1}</span>. {2}",
    "ERROR_MIXED_DRAGDROP"              : "Tidak dapat membuka berkas dalam waktu yang bersamaan dengan membuka berkas yang lain.",
    
    // User key map error strings
    "ERROR_KEYMAP_TITLE"                : "Gagal Membaca Alokasi Tombol",
    "ERROR_KEYMAP_CORRUPT"              : "Berkas alokasi tombol Anda bukanlah berkas JSON yang valid. Berkas akan dibuka sehingga Anda dapat memperbaiki formatnya.",
    "ERROR_LOADING_KEYMAP"              : "Berkas alokasi tombol Anda bukan berkas teks dengan encoding UTF-8 oleh karena itu tidak dapat dimuat.",
    "ERROR_RESTRICTED_COMMANDS"         : "Anda tidak dapat mengeset shortcut untuk perintah berikut: {0}",
    "ERROR_RESTRICTED_SHORTCUTS"        : "Anda tidak mengeset shortcut berikut: {0}",
    "ERROR_MULTIPLE_SHORTCUTS"          : "Anda mengeset beberapa shortcut untuk perintah berikut: {0}",
    "ERROR_DUPLICATE_SHORTCUTS"         : "Anda memiliki binding ganda untuk shortcut berikut: {0}",
    "ERROR_INVALID_SHORTCUTS"           : "Shortcut berikut tiidak valid: {0}",
    "ERROR_NONEXISTENT_COMMANDS"        : "Anda mengeset shortcut untuk perintah yang tidak tersedia: {0}",
    
    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"         : "Gagal membaca Preferensi",
    "ERROR_PREFS_CORRUPT"               : "Berkas preferensi Anda bukanlah berkas JSON yang valid. Berkas akan dibuka sehingga Anda dapat memperbaiki formatnya. Anda harus menjalankan ulang {APP_NAME} untuk mengaplikasikan perubahan.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Ups! {APP_NAME} Belum Dapat Dijalankan di Browser.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} memang dikembangkan menggunakan HTML, tapi saat ini hanya dapat dijalankan sebagai aplikasi desktop, jadi Anda dapat menggunakannya untuk mengedit berkas lokal. Gunakan repositori application shell di <b>github.com/adobe/brackets-shell</b> untuk menjalankan {APP_NAME}.",

    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "Gagal Mengindeks Berkas",
    "ERROR_MAX_FILES"                   : "Proyek ini berisi lebih dari 30.000 berkas. Fitur yang beroperasi di beberapa file mungkin dinonaktifkan atau akan bertingkah seakan proyek ini kosong. <a href='https://github.com/adobe/brackets/wiki/Large-Projects'>Baca lebih lanjut mengenai bekerja dengan proyek besar.</a>.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Gagal Menjalankan Browser",
    "ERROR_CANT_FIND_CHROME"            : "Tidak dapat menemukan aplikasi Google Chrome. Pastikan aplikasi tersebut telah diinstal di komputer Anda.",
    "ERROR_LAUNCHING_BROWSER"           : "Terjadi kesalahan pada saat menjalankan browser. (error {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Preview Langsung Gagal",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Menjalankan Koneksi ke Browser",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Agar Preview Langsung dapat dijalankan, Chrome harus dijalankan ulang dengan Mode Remote Debugging.<br /><br />Apakah Anda ingin menjalankan ulang Chrome dan mengaktifkan Remote Debugging?<br /><br />",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Tidak dapat membuka halaman Preview Langsung.",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Buka sebuah berkas HTML atau pastikan ada berkas index.html di dalam struktur folder Anda untuk menggunakan Preview Langsung.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Untuk menjalankan server-side preview, sebaiknya Anda melakukan pengaturan Base URL.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Gagal menjalankan HTTP Server untuk melakukan Preview Langsung. Coba lagi.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Selamat Datang di Preview Langsung!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Preview Langsung menghubungkan {APP_NAME} dengan browser Anda. Menjalankan berkas HTML Anda di browser, dan mengubah tampilannya selagi Anda mengubah kode.<br /><br />Dalam versi awal dari {APP_NAME} ini, Preview Langsung hanya dapat digunakan menggunakan <strong>Google Chrome</strong> dan di-update secara langsung selagi Anda melakukan perubahan pada <strong>berkas CSS atau HTML</strong>. Perubahan pada berkas JavaScript secara otomatis akan di-load ulang setelah Anda menyimpannya.<br /><br />(Anda hanya melihat pesan ini sekali saja.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Untuk informasi lebih lanjut, lihat <a href='{0}' title='{0}'>Troubleshooting Live Development connection errors</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Preview Langsung",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Preview Langsung: Melakukan Koneksi\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Preview Langsung: Inisialisasi\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Putuskan koneksi Preview Langsung",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Preview Langsung (simpan berkas untuk melakukan refresh)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Preview Langsung (gagal meng-update karena kesalahan sintaks)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Preview Langsung dibatalkan karena Developer Tools pada browser sedang dibuka",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Preview Langsung dibatalkan karena halaman telah ditutup",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Preview Langsung dibatalkan karena browser membuka halaman yang bukan dari proyek",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Preview Langsung dibatalkan karena sebab yang belum diketahui ({0})",

    "SAVE_CLOSE_TITLE"                  : "Simpan Perubahan",
    "SAVE_CLOSE_MESSAGE"                : "Apakah anda akan menyimpan semua perubahan pada dokumen <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Apakah anda akan menyimpan berkas berikut?",
    "EXT_MODIFIED_TITLE"                : "Perubahan Dari Luar",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Hapus?",
    "CONFIRM_FOLDER_DELETE"             : "Apakah anda yakin akan menghapus folder <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Berkas Dihapus",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> telah dirubah di dalam disk.<br /><br />Apakah Anda ingin menyimpannya dan menimpa perubahan tersebut?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> telah dirubah, tapi ada perubahan yang belum disimpan pada {APP_NAME}.<br /><br />Versi yang mana yang ingin Anda simpan?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> telah dihapus di luar {APP_NAME}, tapi ada perubahan pada {APP_NAME} yang belum disimpan.<br /><br />Apakah anda ingin menyimpan perubahan tersebut?",

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
    "FIND_NO_RESULTS"                   : "Tidak ditemukan",
    "FIND_QUERY_PLACEHOLDER"            : "Temukan\u2026",
    "REPLACE_PLACEHOLDER"               : "Ganti dengan\u2026",
    "BUTTON_REPLACE_ALL"                : "Semua\u2026",
    "BUTTON_REPLACE"                    : "Ganti",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Berikutnya",
    "BUTTON_PREV_HINT"                  : "Sebelumnya",
    "BUTTON_CASESENSITIVE_HINT"         : "Sesuai dengan huruf",
    "BUTTON_REGEXP_HINT"                : "Regular Expression",
    "REPLACE_WITHOUT_UNDO_WARNING_TITLE": "Ganti Tanpa Pembatalan",
    "REPLACE_WITHOUT_UNDO_WARNING"      : "Karena ada lebih dari {0} berkas yang harus diganti, {APP_NAME} akan memodifikas berkas yang tidak terbuka pada disk.<br />Anda tidak dapat membatalkan perubahan pada berkas tersebut.",
    "BUTTON_REPLACE_WITHOUT_UNDO"       : "Ganti Tanpa Pembatalan",

    "OPEN_FILE"                         : "Buka Berkas",
    "SAVE_FILE_AS"                      : "Simpan Berkas",
    "CHOOSE_FOLDER"                     : "Pilih folder",

    "RELEASE_NOTES"                     : "Catatan rilis",
    "NO_UPDATE_TITLE"                   : "Versi Terbaru!",
    "NO_UPDATE_MESSAGE"                 : "Anda menggunakan versi terbaru dari {APP_NAME}.",
    
    // Find and Replace
    "FIND_REPLACE_TITLE_LABEL"          : "Ganti",
    "FIND_REPLACE_TITLE_WITH"           : "dengan",
    "FIND_TITLE_LABEL"                  : "Ditemukan",
    "FIND_TITLE_SUMMARY"                : "&mdash; {0} {1} {2} di {3}",

    // Find in Files
    "FIND_NUM_FILES"                    : "{0} {1}",
    "FIND_IN_FILES_SCOPED"              : "di <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "dalam proyek",
    "FIND_IN_FILES_ZERO_FILES"          : "Filter mengabaikan semua berkas {0}",
    "FIND_IN_FILES_FILE"                : "berkas",
    "FIND_IN_FILES_FILES"               : "berkas",
    "FIND_IN_FILES_MATCH"               : "sesuai",
    "FIND_IN_FILES_MATCHES"             : "sesuai",
    "FIND_IN_FILES_MORE_THAN"           : "Lebih dari ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We shoudl use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "Ctrl/Cmd click untuk expand/collapse semua",
    "REPLACE_IN_FILES_ERRORS_TITLE"     : "Gagal Mengganti",
    "REPLACE_IN_FILES_ERRORS"           : "Berkas berikut tidak dapat dimodifikasi because berkas tersebut berubah setelah pencarian atau tidak dapat ditulis.",

    
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Gagal Mendapatkan Informasi Update",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Ada masalah saat meminta informasi update terbaru dari server. Pastikan anda terkoneksi ke internet dan kemudian coba lagi.",
    
    // File exclusion filters
    "NEW_FILE_FILTER"                   : "Set Pengabaian Baru\u2026",
    "CLEAR_FILE_FILTER"                 : "Jangan Mengabaikan Berkas",
    "NO_FILE_FILTER"                    : "Tak Ada Berkas Yang Diabaikan",
    "EXCLUDE_FILE_FILTER"               : "Abaikan {0}",
    "EDIT_FILE_FILTER"                  : "Ubah\u2026",
    "FILE_FILTER_DIALOG"                : "Ubah Set Pengabaian",
    "FILE_FILTER_INSTRUCTIONS"          : "Abaikan berkas dan folder yang memiliki kecocokan dengan string / substring berikut atau <a href='{0}' title='{0}'>wildcard</a>. Masukkan setiap string pada baris baru.",
    "FILTER_NAME_PLACEHOLDER"           : "Beri nama set pengabaian ini (opsional)",
    "FILE_FILTER_CLIPPED_SUFFIX"        : "dan {0} lagi",
    "FILTER_COUNTING_FILES"             : "Menghitung berkas\u2026",
    "FILTER_FILE_COUNT"                 : "Mengijinkan {0} dari {1} berkas {2}",
    "FILTER_FILE_COUNT_ALL"             : "Mengijinkan semua {0} berkas {1}",
    
    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"   : "Tidak ada Edit Cepat tersedia untuk posisi kursor saat ini",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES"     : "Edit Cepat CSS: tempatkan kursor pada nama class tunggal",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"      : "Edit Cepat CSS: atribut class tidak lengkap",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"         : "Edit Cepat CSS: atribut id tidak lengkap",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"    : "Edit Cepat CSS: tempatkan kursor pada tag, class, atau id",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"   : "Edit Cepat Timing Function CSS: sintaks tidak valid",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"    : "Edit Cepat JS: tempatkan kursor pada nama fungsi",
    
    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"   : "Tidak ada Dokumentasi Cepat tersedia untuk posisi kursor saat ini",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Memuat\u2026",
    "UNTITLED"          : "Tanpa Judul",
    "WORKING_FILES"     : "Berkas Aktif",
    
    /**
     * MainViewManager
     */
    "TOP"               : "Atas",
    "BOTTOM"            : "Bawah",
    "LEFT"              : "Kiri",
    "RIGHT"             : "Kanan",

    "CMD_SPLITVIEW_NONE"        : "Jangan Dipisah",
    "CMD_SPLITVIEW_VERTICAL"    : "Pisah Secara Vertikal",
    "CMD_SPLITVIEW_HORIZONTAL"  : "Pisah Secara Horizontal",
    "SPLITVIEW_MENU_TOOLTIP"    : "Pisahkan editor secara vertikal atau horizontal",
    "GEAR_MENU_TOOLTIP"         : "Pengaturan Working Set",

    "SPLITVIEW_INFO_TITLE"              : "Sudah Terbuka",
    "SPLITVIEW_MULTIPANE_WARNING"       : "Berkas ini sudah terbuka di panel yang lain. Di masa yang akan datang {APP_NAME} akan mendukung pembukaan berkas yang sama di lebih dari satu panel. Saat ini, berkas akan ditampilkan di panel yang sidah terbuka.<br /><br />(Anda hanya melihat pesan ini sekali saja.)",

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
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 Memilih {0} kolom",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 Memilih {0} kolom",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 Memilih {0} baris",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 Memilih {0} baris",
    "STATUSBAR_SELECTION_MULTIPLE"          : " \u2014 {0} pilihan",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Klik untuk mengubah indentasi menggunakan spasi",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Klik untuk mengubah indentasi menggunakan tab",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Klik untuk mengubah jumlah spasi yang digunakan untuk indentasi",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Klik untuk mengubah jumlah karakter dalam satu tab",
    "STATUSBAR_SPACES"                      : "Spasi:",
    "STATUSBAR_TAB_SIZE"                    : "Ukuran Tab:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} baris",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} baris",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Ekstensi dinonaktifkan",
    "STATUSBAR_INSERT"                      : "INS",
    "STATUSBAR_OVERWRITE"                   : "OVR",
    "STATUSBAR_INSOVR_TOOLTIP"              : "Klik untuk beralih antara mode Insert (INS) dan mode Overwrite (OVR)",
    "STATUSBAR_LANG_TOOLTIP"                : "Klik untuk merubah tipe berkas",
    "STATUSBAR_CODE_INSPECTION_TOOLTIP"     : "{0}. Klik untuk menampilkan panel inspeksi.",
    "STATUSBAR_DEFAULT_LANG"                : "(default)",
    "STATUSBAR_SET_DEFAULT_LANG"            : "Set Sebagai Default Untuk Berkas .{0}",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} kesalahan",
    "SINGLE_ERROR"                          : "1 kesalahan {0}",
    "MULTIPLE_ERRORS"                       : "{1} kesalahan {0}",
    "NO_ERRORS"                             : "Tidak ditemukan kesalahan {0} - kerja bagus!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Tidak ditemukan kesalahan - kerja bagus!",
    "LINT_DISABLED"                         : "Lint dinonaktifkan",
    "NO_LINT_AVAILABLE"                     : "Tidak ada linter tersedia untuk {0}",
    "NOTHING_TO_LINT"                       : "Tidak ada yang di-lint",


    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Berkas",
    "CMD_FILE_NEW_UNTITLED"               : "Baru",
    "CMD_FILE_NEW"                        : "Berkas Baru",
    "CMD_FILE_NEW_FOLDER"                 : "Folder Baru",
    "CMD_FILE_OPEN"                       : "Buka\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Tambahkan Ke Working Set",
    "CMD_OPEN_DROPPED_FILES"              : "Buka Berkas Yang Di-drop",
    "CMD_OPEN_FOLDER"                     : "Buka Folder\u2026",
    "CMD_FILE_CLOSE"                      : "Tutup",
    "CMD_FILE_CLOSE_ALL"                  : "Tutup Semua",
    "CMD_FILE_CLOSE_LIST"                 : "Daftar Tutup",
    "CMD_FILE_CLOSE_OTHERS"               : "Tutup Yang Lain",
    "CMD_FILE_CLOSE_ABOVE"                : "Tutup Semua Yang di Atas",
    "CMD_FILE_CLOSE_BELOW"                : "Tutup Semua Yang di Bawah",
    "CMD_FILE_SAVE"                       : "Simpan",
    "CMD_FILE_SAVE_ALL"                   : "Simpan Semua",
    "CMD_FILE_SAVE_AS"                    : "Simpan Sebagai\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Preview Langsung",
    "CMD_PROJECT_SETTINGS"                : "Pengaturan Proyek\u2026",
    "CMD_FILE_RENAME"                     : "Ubah Nama",
    "CMD_FILE_DELETE"                     : "Hapus",
    "CMD_INSTALL_EXTENSION"               : "Instal Ekstensi\u2026",
    "CMD_EXTENSION_MANAGER"               : "Pengaturan Ekstensi\u2026",
    "CMD_FILE_REFRESH"                    : "Muat Ulang Daftar Berkas",
    "CMD_QUIT"                            : "Keluar",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Keluar",

    // Edit menu commands
    "EDIT_MENU"                           : "Ubah",
    "CMD_UNDO"                            : "Batal",
    "CMD_REDO"                            : "Ulang",
    "CMD_CUT"                             : "Potong",
    "CMD_COPY"                            : "Salin",
    "CMD_PASTE"                           : "Tempel",
    "CMD_SELECT_ALL"                      : "Pilih Semua",
    "CMD_SELECT_LINE"                     : "Pilih Baris",
    "CMD_SPLIT_SEL_INTO_LINES"            : "Pisahkan Pilihan ke Baris Berbeda",
    "CMD_ADD_CUR_TO_NEXT_LINE"            : "Tambahkan Kursor ke Baris Berikutnya",
    "CMD_ADD_CUR_TO_PREV_LINE"            : "Tambahkan Kursor ke Baris Sebelumnya",
    "CMD_INDENT"                          : "Indentasi",
    "CMD_UNINDENT"                        : "Batalkan Indentasi",
    "CMD_DUPLICATE"                       : "Duplikat",
    "CMD_DELETE_LINES"                    : "Hapus Baris",
    "CMD_COMMENT"                         : "Ganti Line Comment",
    "CMD_BLOCK_COMMENT"                   : "Ganti Block Comment",
    "CMD_LINE_UP"                         : "Pindahkan Baris ke Bawah",
    "CMD_LINE_DOWN"                       : "Pindahkan Baris ke Atas",
    "CMD_OPEN_LINE_ABOVE"                 : "Baris Baru di Atas",
    "CMD_OPEN_LINE_BELOW"                 : "Baris Baru di Bawah",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Tutup Tanda Kurung Secara Otomatis",
    "CMD_SHOW_CODE_HINTS"                 : "Tunjukkan Hint Kode",
    
    // Search menu commands
    "FIND_MENU"                           : "Cari",
    "CMD_FIND"                            : "Cari",
    "CMD_FIND_NEXT"                       : "Cari Berikutnya",
    "CMD_FIND_PREVIOUS"                   : "Cari Sebelumnya",
    "CMD_FIND_ALL_AND_SELECT"             : "Cari Semua dan Pilih",
    "CMD_ADD_NEXT_MATCH"                  : "Tambahkan Kesamaan Berikutnya ke Pilihan",
    "CMD_SKIP_CURRENT_MATCH"              : "Lewatkan dan Tambahkan Kesamaan Berikutnya",
    "CMD_FIND_IN_FILES"                   : "Cari dalam Berkas",
    "CMD_FIND_IN_SELECTED"                : "Cari Dalam Berkas/Folder Yang Dipilih",
    "CMD_FIND_IN_SUBTREE"                 : "Cari di\u2026",
    "CMD_REPLACE"                         : "Ganti",
    "CMD_REPLACE_IN_FILES"                : "Ganti dalam Berkas",
    "CMD_REPLACE_IN_SELECTED"             : "Ganti dalam Berkas/Folder Yang Dipilih",
    "CMD_REPLACE_IN_SUBTREE"              : "Ganti di\u2026",

    // View menu commands
    "VIEW_MENU"                           : "Tampilan",
    "CMD_HIDE_SIDEBAR"                    : "Sembunyikan Sidebar",
    "CMD_SHOW_SIDEBAR"                    : "Tampilkan Sidebar",
    "CMD_INCREASE_FONT_SIZE"              : "Perbesar Huruf",
    "CMD_DECREASE_FONT_SIZE"              : "Perkecil Huruf",
    "CMD_RESTORE_FONT_SIZE"               : "Kembalikan Huruf ke Ukuran Awal",
    "CMD_SCROLL_LINE_UP"                  : "Scroll Baris ke Atas",
    "CMD_SCROLL_LINE_DOWN"                : "Scroll Baris ke Bawah",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Nomor Baris",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Tandai Baris Yang Aktif",
    "CMD_TOGGLE_WORD_WRAP"                : "Word Wrap",
    "CMD_LIVE_HIGHLIGHT"                  : "Tandai Preview Langsung",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Lint Berkas Saat Disimpan",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Urutkan Berdasarkan Waktu",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Urutkan Berdasarkan Nama",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Urutkan Berdasarkan Jenis",
    "CMD_WORKING_SORT_TOGGLE_AUTO"        : "Urutkan Secara Otomatis",
    "CMD_THEMES"                          : "Tema\u2026",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigasi",
    "CMD_QUICK_OPEN"                      : "Buka Cepat",
    "CMD_GOTO_LINE"                       : "Ke Baris",
    "CMD_GOTO_DEFINITION"                 : "Cari Cepat Definisi",
    "CMD_GOTO_FIRST_PROBLEM"              : "Ke Kesalahan/Peringatan Pertama",
    "CMD_TOGGLE_QUICK_EDIT"               : "Ubah Cepat",
    "CMD_TOGGLE_QUICK_DOCS"               : "Dokumentasi Cepat",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Kesamaan Sebelumnya",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Kesamaan Berikutnya",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Atribut Baru",
    "CMD_NEXT_DOC"                        : "Dokumen Berikutnya",
    "CMD_PREV_DOC"                        : "Dokumen Sebelumnya",
    "CMD_SHOW_IN_TREE"                    : "Tambahkan ke Daftar Berkas",
    "CMD_SHOW_IN_EXPLORER"                : "Tampilkan di Explorer",
    "CMD_SHOW_IN_FINDER"                  : "Tampilkan di Finder",
    "CMD_SHOW_IN_OS"                      : "Tampilkan di OS",

    // Help menu commands
    "HELP_MENU"                           : "Bantuan",
    "CMD_CHECK_FOR_UPDATE"                : "Cari Versi Terbaru",
    "CMD_HOW_TO_USE_BRACKETS"             : "Cara Menggunakan {APP_NAME}",
    "CMD_SUPPORT"                         : "Dukungan {APP_NAME}",
    "CMD_SUGGEST"                         : "Berikan Saran Fitur",
    "CMD_RELEASE_NOTES"                   : "Catatan Rilis",
    "CMD_GET_INVOLVED"                    : "Ikut Terlibat Dalam Pengembangan",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Tampilkan Folder Ekstensi",
    "CMD_HOMEPAGE"                        : "Homepage {APP_TITLE}",
    "CMD_TWITTER"                         : "{TWITTER_NAME} di Twitter",
    "CMD_ABOUT"                           : "Tentang {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "Buka Berkas Pengaturan",
    "CMD_OPEN_KEYMAP"                     : "Buka Berkas Alokasi Tombol",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "rilis eksperimental",
    "RELEASE_BUILD"                        : "rilis",
    "DEVELOPMENT_BUILD"                    : "rilis pengembangan",
    "RELOAD_FROM_DISK"                     : "Muat Ulang dari Disk",
    "KEEP_CHANGES_IN_EDITOR"               : "Simpan Perubahan di Editor",
    "CLOSE_DONT_SAVE"                      : "Tutup (Jangan Disimpan)",
    "RELAUNCH_CHROME"                      : "Jalankan Ulang Chrome",
    "ABOUT"                                : "Tentang",
    "CLOSE"                                : "Tutup",
    "ABOUT_TEXT_LINE1"                     : "Revisi {VERSION_MAJOR}.{VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_BUILD_TIMESTAMP"           : "build timestamp: ",
    "ABOUT_TEXT_LINE3"                     : "Catatan, syarat dan ketentuan mengenai perangkat lunak pihak ketiga terdapat pada <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> dan sebagai referensi.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentasi dan kode sumber pada <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Dibuat dengan \u2764 dan JavaScript oleh:",
    "ABOUT_TEXT_LINE6"                     : "Banyak orang (tapi ada masalah dalam menampilkan daftarnya).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Dokumentasi dan logo grafis Web Platform dirilis dibawah lisensi Creative Commons Attribution, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Ada versi terbaru dari {APP_NAME}! Klik di sini untuk info lebih lanjut.",
    "UPDATE_AVAILABLE_TITLE"               : "Update Tersedia",
    "UPDATE_MESSAGE"                       : "Hai, ada update terbaru dari {APP_NAME}. Beberapa fitur terbaru:",
    "GET_IT_NOW"                           : "Dapatkan sekarang!",
    "PROJECT_SETTINGS_TITLE"               : "Pengaturan proyek untuk: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Base URL Preview Langsung",
    "PROJECT_SETTING_BASE_URL_HINT"        : "Untuk menggunakan server lokal, masukkan url seperti contoh berikut: http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Protokol {0} tidak didukung oleh Preview Langsung&mdash;gunakan http: atau https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Base URL tidak boleh mengandung kriteria pencarian seperti \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Base URL tidak boleh mengandung tanda atau simbol \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Karakter spesial seperti '{0}' harus di-encode ke format %.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Gagal membuka URL",
    "EMPTY_VIEW_HEADER"                    : "<em>Open a file while this pane has focus</em>",
    
    // Strings for themes-settings.html and themes-general.html
    "CURRENT_THEME"                        : "Tema Yang Sedang Digunakan",
    "USE_THEME_SCROLLBARS"                 : "Gunakan Scrollbar Tema",
    "FONT_SIZE"                            : "Ukuran Huruf",
    "FONT_FAMILY"                          : "Jenis Huruf",
    "THEMES_SETTINGS"                      : "Pengaturan Tema",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Atribut Baru",

    // Extension Management strings    
    "INSTALL"                              : "Instal",
    "UPDATE"                               : "Update",
    "REMOVE"                               : "Hapus",
    "OVERWRITE"                            : "Timpa",
    "CANT_REMOVE_DEV"                      : "Ekstensi pada folder \"dev\" harus dihapus secara manual.",
    "CANT_UPDATE"                          : "Update tidak kompatibel dengan {APP_NAME} versi ini.",
    "CANT_UPDATE_DEV"                      : "Ekstensi pada folder \"dev\" tidak dapat di-update secara otomatis.",
    "INSTALL_EXTENSION_TITLE"              : "Instal Ekstensi",
    "UPDATE_EXTENSION_TITLE"               : "Update Ekstensi",
    "INSTALL_EXTENSION_LABEL"              : "URL Ekstensi",
    "INSTALL_EXTENSION_HINT"               : "URL berkas zip atau repositori GitHub dari ekstensi",
    "INSTALLING_FROM"                      : "Menginstal ekstensi dari {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Sukses!",
    "INSTALL_FAILED"                       : "Gagal.",
    "CANCELING_INSTALL"                    : "Membatalkan\u2026",
    "CANCELING_HUNG"                       : "Pembatalan memakan waktu terlalu lama. Mungkin telah terjadi kesalahan internal.",
    "INSTALL_CANCELED"                     : "Instalasi dibatalkan.",
    "VIEW_COMPLETE_DESCRIPTION"            : "View complete description",
    "VIEW_TRUNCATED_DESCRIPTION"           : "View truncated description",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Konten yang terunduh bukan berkas zip yang valid.",
    "INVALID_PACKAGE_JSON"                 : "Berkas package.json tidak valid (error was: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Berkas package.json tidak menyebutkan nama paket.",
    "BAD_PACKAGE_NAME"                     : "{0} bukan nama paket yang valid.",
    "MISSING_PACKAGE_VERSION"              : "package.json tidak menyebutkan versi paket.",
    "INVALID_VERSION_NUMBER"               : "Versi ({0}) untuk paket ini tidak valid.",
    "INVALID_BRACKETS_VERSION"             : "Kompatibilitas {APP_NAME} dengan ({0}) tidak valid.",
    "DISALLOWED_WORDS"                     : "Kata ({1}) tidak diijinkan pada {0}.",
    "API_NOT_COMPATIBLE"                   : "Ekstensi tidak cocok dengan versi {APP_NAME} ini. Ekstensi akan diinstal pada folder ekstensi dinonaktifkan.",
    "MISSING_MAIN"                         : "Paket ini tidak memiliki berkas main.js.",
    "EXTENSION_ALREADY_INSTALLED"          : "Menginstal paket ini akan menimpa ekstensi yang lama. Timpa ekstensi yang lama?",
    "EXTENSION_SAME_VERSION"               : "Versi ekstensi ini sama dengan yang telah terinstal. Timpa ekstensi yang telah ada?",
    "EXTENSION_OLDER_VERSION"              : "Versi paket ini {0} lebih lama dari versi yang telah terinstal ({1}). Timpa instalasi yang telah ada?",
    "DOWNLOAD_ID_IN_USE"                   : "Kesalahan internal: download ID sedang digunakan.",
    "NO_SERVER_RESPONSE"                   : "Tidak dapat melakukan koneksi ke server.",
    "BAD_HTTP_STATUS"                      : "Berkas tidak ditemukan pada server (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Gagal menyimpan hasil download ke berkas temp.",
    "ERROR_LOADING"                        : "Gagal memuat ekstensi.",
    "MALFORMED_URL"                        : "URL tidak valid. Periksa kembali.",
    "UNSUPPORTED_PROTOCOL"                 : "URL harus berupa http atau https.",
    "UNKNOWN_ERROR"                        : "Permasalahan tidak diketahui.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Pengaturan Ekstensi",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Gagal membuka daftar ekstensi. Silakan coba lagi.",
    "INSTALL_EXTENSION_DRAG"               : "Geser berkas .zip ke sini atau",
    "INSTALL_EXTENSION_DROP"               : "Tempatkan berkas .zip di sini untuk menginstal",
    "INSTALL_EXTENSION_DROP_ERROR"         : "Instalasi/Update terhenti karena kesalahan berikut:",
    "INSTALL_FROM_URL"                     : "Instal dari URL\u2026",
    "INSTALL_EXTENSION_VALIDATING"         : "Validsi\u2026",
    "EXTENSION_AUTHOR"                     : "Pembuat",
    "EXTENSION_DATE"                       : "Tanggal",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Ekstensi ini membutuhkan versi terbaru dari {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Ekstensi ini hanya dapat digunakan pada versi {APP_NAME} yang lama.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "Versi {0} dari ekstensi ini meminta versi terbaru dari {APP_NAME}. Tapi Anda tetap dapat menginstal versi sebelumnya {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "Versi {0} hanya dapat digunakan pada versi {APP_NAME} yang lama. Tapi Anda tetap dapat menggunakan versi sebelumnya {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "Tidak ada keterangan",
    "EXTENSION_MORE_INFO"                  : "Info selengkapnya\u2026",
    "EXTENSION_ERROR"                      : "Kesalahan ekstensi",
    "EXTENSION_KEYWORDS"                   : "Kata kunci",
    "EXTENSION_TRANSLATED_USER_LANG"       : "Diterjemahkan ke {0} bahasa, termasuk bahasa Anda",
    "EXTENSION_TRANSLATED_GENERAL"         : "Diterjemahkan ke {0} bahasa",
    "EXTENSION_TRANSLATED_LANGS"           : "Ekstensi ini telah diterjemahkan ke bahasa berikut: {0}",
    "EXTENSION_INSTALLED"                  : "Terinstal",
    "EXTENSION_UPDATE_INSTALLED"           : "Update untuk ekstensi ini telah diinstal dan akan diaplikasikan setelah {APP_NAME} dijalankan ulang.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Cari",
    "EXTENSION_MORE_INFO_LINK"             : "Selengkapnya",
    "BROWSE_EXTENSIONS"                    : "Cari Ekstensi",
    "EXTENSION_MANAGER_REMOVE"             : "Hapus Ekstensi",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Gagal menghapus extensi: {0}. {APP_NAME} akan tetap dijalankan ulang.",
    "EXTENSION_MANAGER_UPDATE"             : "Update Ekstensi",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Gagal melakukan update terhadap ekstensi: {0}. {APP_NAME} akan tetap dijalankan ulang.",
    "MARKED_FOR_REMOVAL"                   : "Ditandai untuk dihapus",
    "UNDO_REMOVE"                          : "Batal",
    "MARKED_FOR_UPDATE"                    : "Ditandai untuk di-update",
    "UNDO_UPDATE"                          : "Batal",
    "CHANGE_AND_RELOAD_TITLE"              : "Ganti Ekstensi",
    "CHANGE_AND_RELOAD_MESSAGE"            : "Untuk meng-update atau menghapus ekstensi yang ditandai, {APP_NAME} akan dijalankan ulang. Anda akan diminta untuk menyimpan pekerjaan Anda.",
    "REMOVE_AND_RELOAD"                    : "Hapus Ekstensi dan Jalankan Ulang",
    "CHANGE_AND_RELOAD"                    : "Ganti Ekstensi dan Jalankan Ulang",
    "UPDATE_AND_RELOAD"                    : "Update Ekstensi dan Jalankan Ulang",
    "PROCESSING_EXTENSIONS"                : "Memproses perubahan ekstensi\u2026",
    "EXTENSION_NOT_INSTALLED"              : "Tidak dapat menghapus extensi {0} karena tidak terinstall.",
    "NO_EXTENSIONS"                        : "Belum ada ekstensi yang diinstal.<br />Klik pada tab Tersedia untuk menginstal ekstensi.",
    "NO_EXTENSION_MATCHES"                 : "Tidak ditemukan ekstensi yang sesuai dengan kriteria pencarian.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "CATATAN: Ekstensi ini memiliki kemungkinan dikembangkan oleh orang-orang yang berbeda dari pengembang {APP_NAME}. Ekstensi yang masuk ke dafter ini tidak di-review dan memiliki akses lokal sepenuhya. Hati-hati ketika menginstal ekstensi dari sumber yang tidak dipercaya.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Terinstal",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Tersedia",
    "EXTENSIONS_THEMES_TITLE"              : "Tema",
    "EXTENSIONS_UPDATES_TITLE"             : "Update",

    "INLINE_EDITOR_NO_MATCHES"             : "Tidak ditemukan kesamaan.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Tidak ditemukan kesamaan dengan atribut CSS yang ada.<br> Klik \"Atribut Baru\" untuk membuat atribut baru.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Tidak ada berkas CSS di dalam proyek Anda.<br>Buat berkas CSS untuk menambahkan atribut.",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "piksel",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Debug",
    "ERRORS"                                    : "Errors",
    "CMD_SHOW_DEV_TOOLS"                        : "Tampilkan Developer Tools",
    "CMD_REFRESH_WINDOW"                        : "Jalankan Ulang Dengan Ekstensi",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Jalankan Ulang Tanpa Ekstensi",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Jendela {APP_NAME} Baru",
    "CMD_SWITCH_LANGUAGE"                       : "Ganti Bahasa",
    "CMD_RUN_UNIT_TESTS"                        : "Jalankan Tes",
    "CMD_SHOW_PERF_DATA"                        : "Tampilkan Data Performa",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Aktifkan Node Debugger",
    "CMD_LOG_NODE_STATE"                        : "Tampilkan Log Node di Konsol",
    "CMD_RESTART_NODE"                          : "Jalankan Ulang Node",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"             : "Tempilkan Kesalahan di Status Bar",
    "CMD_OPEN_BRACKETS_SOURCE"                  : "Kode Sumber Brackets",

    "LANGUAGE_TITLE"                            : "Ganti Bahasa",
    "LANGUAGE_MESSAGE"                          : "Bahasa:",
    "LANGUAGE_SUBMIT"                           : "Jalankan ulang {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Batal",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Default Sistem",

    // Locales (used by Debug > Switch Language)


    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Waktu",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Progres",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Pindahkan poin yang dipilih<br><kbd class='text'>Shift</kbd> Pindahkan 10 unit<br><kbd class='text'>Tab</kbd> Pindah poin",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Tambah atau kurangi langkah<br><kbd>←</kbd><kbd>→</kbd> 'Mulai' atau 'Akhir'",
    "INLINE_TIMING_EDITOR_INVALID"              : "Nilai lama <code>{0}</code> tidak valid, jadi fungsi yang ditampilkan telah diubah ke <code>{1}</code>. Tokumen akan di-update setelah edit pertama.",

    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Warna Sekarang",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Warna Aslinya",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "Format RGBa",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Format Hex",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "Format HSLa",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Digunakan {1} kali)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Digunakan {1} kali)",

    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Pindah ke Definisi",
    "CMD_SHOW_PARAMETER_HINT"                   : "Tampilkan Hint untuk Parameter",
    "NO_ARGUMENTS"                              : "<tidak ada parameter>",
    "DETECTED_EXCLUSION_TITLE"                  : "JavaScript File Inference Problem",
    "DETECTED_EXCLUSION_INFO"                   : "Terjadi masalah saat akan memproses <span class='dialog-filename'>{0}</span>.<br><br>Berkas ini tidak akan lagi diproses untuk Hint Kode, Pindah ke Definisi atau Edit Cepat. Untuk mengaktifkan kembali berkas ini, buka <code>.brackets.json</code> di proyek Anda dan ubah <code>jscodehints.detectedExclusions</code>.<br><br>Kemungkinan ini adalah bug dari Brackets. Jika Anda dapat menyediakan salinan berkas ini, silakan <a href='https://github.com/adobe/brackets/wiki/How-to-Report-an-Issue'>isi laporan bug</a> dengan tautan menuju berkas yang disebutkan disini.",

    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Tampilkan Perubahan Saat Hover",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Proyek Yang Dibuka Sebelumnya",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Baca selengkapnya"
});
