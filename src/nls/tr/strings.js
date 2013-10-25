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
    "GENERIC_ERROR"                     : "(hata {0})",
    "NOT_FOUND_ERR"                     : "Dosya bulunamadı.",
    "NOT_READABLE_ERR"                  : "Dosya okunamadı.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Klasör değişikliği için izniniz yok.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Dosya değişikliği için izniniz yok.",
    "FILE_EXISTS_ERR"                   : "Dosya bulunmaktadır.",
    "FILE"                              : "Dosya",
    "DIRECTORY"                         : "Klasör",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Proje yüklenemedi",
    "OPEN_DIALOG_ERROR"                 : "Dosya dialogu gösterilemedi. (hata {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "<span class='dialog-filename'>{0}</span> klasörü yüklenirken hata oluştu. (hata {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "<span class='dialog-filename'>{0}</span> klasörü okunurken hata oluştu. (hata {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Dosya açılamadı",
    "ERROR_OPENING_FILE"                : "<span class='dialog-filename'>{0}</span> dosyası açılırken hata oluştu. {1}",
    "ERROR_OPENING_FILES"               : "Şu dosyalar açılamadı:",
    "ERROR_RELOADING_FILE_TITLE"        : "Değişiklikler hafızadan okunurken hata oluştu.",
    "ERROR_RELOADING_FILE"              : "<span class='dialog-filename'>{0}</span> dosyası yenilenirken hata oluştu. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Dosya kaydedilirken hata",
    "ERROR_SAVING_FILE"                 : "<span class='dialog-filename'>{0}</span> dosyası kaydedilirken hata oluştu. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Dosya ismi değiştirilirken hata",
    "ERROR_RENAMING_FILE"               : "<span class='dialog-filename'>{0}</span> dosyasının ismi değiştirilirken hata oluştu. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Dosya silinemedi",
    "ERROR_DELETING_FILE"               : "<span class='dialog-filename'>{0}</span> dosyası silinirken hata oluştu. {1}",
    "INVALID_FILENAME_TITLE"            : "Geçersiz dosya ismi",
    "INVALID_FILENAME_MESSAGE"          : "Dosya isimleri yandaki karakterleri içeremez: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "<span class='dialog-filename'>{0}</span> dosyası zaten bulunmakta",
    "ERROR_CREATING_FILE_TITLE"         : "Dosya oluşturlamadı",
    "ERROR_CREATING_FILE"               : "<span class='dialog-filename'>{0}</span> dosyası yaratılırken hata oluştu. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Ups! {APP_NAME} programı henüz tarayıcıda açılmadı.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} HTML olarak hazırlandı, ancak şuan için masaüstünde çalışabilmekte. Bu nedenle makinanızda bulunan dosyalarda değişiklik için kullanabilirsiniz. {APP_NAME} programını çalıştırabilmek için lütfen <b>github.com/adobe/brackets-shell</b> adresindeki 'application shell'i kullanınız.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Dosyalar indekslenirken hata",
    "ERROR_MAX_FILES"                   : "Maksimum sayıda dosya indekslendi. Indekslenen dosyalardaki işlemler düzgün çalışmayabilir.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Tarayıcı çalıştırılırken hata",
    "ERROR_CANT_FIND_CHROME"            : "Google Chrome tarayıcısı bulunamadı. Lütfen kurulu olduğundan emin olun.",
    "ERROR_LAUNCHING_BROWSER"           : "Tarayıcı açılırken hata oluştu. (hata {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Canlı Önizleme Hatası",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Tarayıcıya bağlanılıyor",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Canlı Önizleme özelliğini kullanabilmek için uzaktan hata ayıklayıcı ile Chrome'un tekrardan açılması gerekiyor.<br /><br />Chrome'u uzaktan hata ayıklayıcı ile tekrardan açılmasını ister misiniz?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Unable to load Live Development page",   
	"LIVE_DEV_NEED_HTML_MESSAGE"        : "Canlı Önizlemeyi çalıştırabilmeniz için html dosyası açmanız gerekiyor",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Canlı Önizlemeyi server-side dosyalarınız ile açmak istiyorsanız, lütfen bu proje için kullanılabilir bir link belirtiniz.",
	"LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Error starting up the HTTP server for live development files. Please try again.", 
	"LIVE_DEVELOPMENT_INFO_TITLE"       : "Canlı Önizlemeye Hoşgeldiniz!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Canlı Önizleme için {APP_NAME} programı tarayıcınıza bağlanıyor ve sizin HTML dosyanızın örnek görüntüsünü tarayıcınızda açıyor. Sonrasında ise değişiklik yaptığınız sayfayı anında tarayıcıda yenileyerek gösteriyor.<br /><br />{APP_NAME} programının bu versiyonunda, Canlı Önizleme özelliği sadece <strong>CSS dosyaları</strong> değişikliğine izin veriyor ve sadece <strong>Google Chrome</strong> üzerinde çalışıyor. Yakında HTML ve Javascript değişikliğini de ekleyeceğiz!<br /><br />(Bu mesaj sadece tek sefer gösterilecektir.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Detaylı bilgi için lütfen <a href='{0}' title='{0}'>Troubleshooting Live Development connection errors</a> sayfasına bakınız.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Canlı Önizleme",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Canlı Önizleme: Bağlanılıyor\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Canlı Önizleme: Başlıyor\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Canlı Önizleme'den Çık",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Canlı Önizleme: Kapatmak için tıklayın (Yenilemek için dosyayı kaydedin)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Live Preview (not updating due to syntax error)",
	
    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Live Preview was cancelled because the browser's developer tools were opened",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Live Preview was cancelled because the page was closed in the browser",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Live Preview was cancelled because the browser navigated to a page that is not part of the current project",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Live Preview was cancelled for an unknown reason ({0})",
      
    "SAVE_CLOSE_TITLE"                  : "Değişiklikleri kaydet",
    "SAVE_CLOSE_MESSAGE"                : "<span class='dialog-filename'>{0}</span> dosyasında yaptığınız değişiklikleri kaydetmek istiyor musunuz?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Dosyalardaki değişiklikleri kaydetmek istiyor musunuz?",
    "EXT_MODIFIED_TITLE"                : "Harici değişiklikler",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Confirm Delete",
    "CONFIRM_FOLDER_DELETE"             : "Are you sure you want to delete the folder <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "File Deleted",
	"EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> dosyası dışarıdan değiştirildi ama {APP_NAME} programında kaydetmediğiniz değişiklikler bulunmakta.<br /><br />Hangi versiyonun kalmasını istiyorsunuz?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> dosyası hafızadan silind ama {APP_NAME} programında kaydetmediğiniz değişiklikler bulunmakta.<br /><br />Değişikliklerin kalmasını istiyor musunuz?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Regexp arama yapmak için /re/ sözdizimini kullanın",
	"FIND_RESULT_COUNT"                 : "{0} results",
    "FIND_RESULT_COUNT_SINGLE"          : "1 result",
    "FIND_NO_RESULTS"                   : "No results",
    "WITH"                              : "İle",
    "BUTTON_YES"                        : "Evet",
    "BUTTON_NO"                         : "Hayır",
	"BUTTON_REPLACE_ALL"                : "All\u2026",
    "BUTTON_STOP"                       : "Durdur",
	"BUTTON_REPLACE"                    : "Replace",

	"BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Next Match",
    "BUTTON_PREV_HINT"                  : "Previous Match",

    "OPEN_FILE"                         : "Dosya Aç",
	"SAVE_FILE_AS"                      : "Save File",
    "CHOOSE_FOLDER"                     : "Klasör Seç",

    "RELEASE_NOTES"                     : "Sürün Notları",
    "NO_UPDATE_TITLE"                   : "Bracket güncel!",
    "NO_UPDATE_MESSAGE"                 : "{APP_NAME} programının en son versiyonunu kullanıyorsunuz.",
    
    "FIND_REPLACE_TITLE_PART1"          : "Replace \"",
    "FIND_REPLACE_TITLE_PART2"          : "\" with \"",
    "FIND_REPLACE_TITLE_PART3"          : "\" &mdash; {2} {0} {1}",
	
    "FIND_IN_FILES_TITLE_PART1"         : "\"",
    "FIND_IN_FILES_TITLE_PART2"         : "\" found",
    "FIND_IN_FILES_TITLE_PART3"         : "&mdash; {0} {1} {2} in {3} {4}",
    "FIND_IN_FILES_SCOPED"              : "<span class='dialog-filename'>{0}</span> dosyası içinde",
    "FIND_IN_FILES_NO_SCOPE"            : "proje içinde",
    "FIND_IN_FILES_FILE"                : "dosya",
    "FIND_IN_FILES_FILES"               : "dosyalar",
    "FIND_IN_FILES_MATCH"               : "eşlesen",
    "FIND_IN_FILES_MATCHES"             : "eşlesenler",
    "FIND_IN_FILES_MORE_THAN"           : "Daha fazla ",
	"FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "Dosya: <b>{0}</b>",
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Versiyon bilgisi alınırken hata",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Sunucudan yeni versiyon bilgisi alınırken hata oluştu. Lütfen internete bağlı olduğunuzdan emin olun ve tekrar deneyin.",
    
    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Yükleniyor\u2026",
    "UNTITLED"          : "Adsız",
    "WORKING_FILES"     : "Çalışılan Dosyalar",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Space",

	    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Satır {0}, Kolon {1}"
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 Selected {0} kolon",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 Selected {0} kolonlar",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 Selected {0} satır",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 Selected {0} satırlar",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Girintiyi boşluk karakterleriyle değiştirmek için tıklayın",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Girintiyi tab karakterleriyle değiştirmek için tıklayın",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Girintide kullanılacak boşluk sayısını değiştirmek için tıklayın",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Tab karakter genişliğini değiştirmek için tıklayın",
    "STATUSBAR_SPACES"                      : "Boşluk:",
    "STATUSBAR_TAB_SIZE"                    : "Tab Boyutu:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} Satır",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} Satırlar",

        // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE"                    : "{0} Errors",
    "SINGLE_ERROR"                          : "1 {0} Error",
    "MULTIPLE_ERRORS"                       : "{1} {0} Errors",
    "NO_ERRORS"                             : "No {0} errors - good job!",
    "LINT_DISABLED"                         : "Linting is disabled",
    "NO_LINT_AVAILABLE"                     : "No linter available for {0}",
    "NOTHING_TO_LINT"                       : "Nothing to lint",
    
	
	/**
     * Command Name Constants
     */
    // File menu commands
    
    "FILE_MENU"                           : "Dosya",
    "CMD_FILE_NEW_UNTITLED"               : "Yeni",
    "CMD_FILE_NEW"                        : "Yeni Dosya",
    "CMD_FILE_NEW_FOLDER"                 : "Yeni Klasör",
    "CMD_FILE_OPEN"                       : "Aç\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Calışılan Dosyalarıma Ekle",
    "CMD_OPEN_DROPPED_FILES"              : "Sürüklenen Dosyaları Ekle",
	"CMD_OPEN_FOLDER"					  : "Klasörü aç:\u2026",
    "CMD_FILE_CLOSE"                      : "Kapat",
    "CMD_FILE_CLOSE_ALL"                  : "Tümünü Kapat",
    "CMD_FILE_CLOSE_LIST"                 : "Listeyi Kapat",
    "CMD_FILE_CLOSE_OTHERS"               : "Diğerlerini Kapat",
    "CMD_FILE_CLOSE_ABOVE"                : "Yukarıdakileri kapat",
    "CMD_FILE_CLOSE_BELOW"                : "Aşağıdakileri Kapat",
    "CMD_FILE_SAVE"                       : "Kaydet",
    "CMD_FILE_SAVE_ALL"                   : "Tümünü Kaydet",
    "CMD_FILE_SAVE_AS"                    : "Farklı Kaydet\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Canlı Önizleme",
    "CMD_PROJECT_SETTINGS"                : "Proje Ayarları\u2026",
    "CMD_FILE_RENAME"                     : "Yeniden Adlandır",
    "CMD_FILE_DELETE"                     : "Sil",
    "CMD_INSTALL_EXTENSION"               : "Uzantı Yükle\u2026",
    "CMD_EXTENSION_MANAGER"               : "Uzantı Yönetimi\u2026",
    "CMD_FILE_REFRESH"                    : "Yenile",
    "CMD_QUIT"                            : "Çık",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Çıkış",
   
    // Edit menu commands
    "EDIT_MENU"                           : "Düzenle",
    "CMD_UNDO"                            : "Geri Al",
    "CMD_REDO"                            : "Tekrar yap",
    "CMD_CUT"                             : "Kes",
    "CMD_COPY"                            : "Kopyala",
    "CMD_PASTE"                           : "Yapıştır",
    "CMD_SELECT_ALL"                      : "Tümünü Seç",
    "CMD_SELECT_LINE"                     : "Satırı Seç",
    "CMD_FIND"                            : "Bul",
    "CMD_FIND_IN_FILES"                   : "Dosyalarda Bul",
    "CMD_FIND_IN_SUBTREE"                 : "\u2026 klasöründe bul",
    "CMD_FIND_NEXT"                       : "Sonrakini Bul",
    "CMD_FIND_PREVIOUS"                   : "Öncekini Bul",
    "CMD_REPLACE"                         : "Değiştir",
    "CMD_INDENT"                          : "Girinti Ekle",
    "CMD_UNINDENT"                        : "Girintiyi Geri Al",
    "CMD_DUPLICATE"                       : "Eşini Oluştur",
    "CMD_DELETE_LINES"                    : "Satır Sil",
    "CMD_COMMENT"                         : "Satır yorum etiketi ekle/kaldır",
    "CMD_BLOCK_COMMENT"                   : "Blok yorum etiketi ekle/kaldır",
    "CMD_LINE_UP"                         : "Satırı Yukarı Taşı",
    "CMD_LINE_DOWN"                       : "Satırı Aşağı Taşı",
    "CMD_OPEN_LINE_ABOVE"                 : "Open Line Above",
    "CMD_OPEN_LINE_BELOW"                 : "Open Line Below",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Auto Close Braces",
    "CMD_SHOW_CODE_HINTS"                 : "Show Code Hints",
    
    // View menu commands
    "VIEW_MENU"                           : "Göster",
    "CMD_HIDE_SIDEBAR"                    : "Kenar Çubuğu Gizle",
    "CMD_SHOW_SIDEBAR"                    : "Kenar Çubuğu Göster",
    "CMD_INCREASE_FONT_SIZE"              : "Font Boyutunu Büyült",
    "CMD_DECREASE_FONT_SIZE"              : "Font Boyutunu Küçült",
    "CMD_RESTORE_FONT_SIZE"               : "Font Boyutunu Sıfırla",
    "CMD_SCROLL_LINE_UP"                  : "Scroll Line Up",
    "CMD_SCROLL_LINE_DOWN"                : "Scroll Line Down",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Line Numbers",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Highlight Active Line",
    "CMD_TOGGLE_WORD_WRAP"                : "Word Wrap",
    "CMD_LIVE_HIGHLIGHT"                  : "Live Preview Highlight",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Lint Files on Save",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Eklenmeye Göre Sırala",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "İsme Göre Sırala",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Türüne Göre Sırala",
    "CMD_SORT_WORKINGSET_AUTO"            : "Otomatik Sırala",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Git",
    "CMD_QUICK_OPEN"                      : "Hızlı Aç",
    "CMD_GOTO_LINE"                       : "Satıra Git",
    "CMD_GOTO_DEFINITION"                 : "Tanıma Git",
    "CMD_GOTO_FIRST_PROBLEM"              : "Go to First Error/Warning",
    "CMD_TOGGLE_QUICK_EDIT"               : "Quick Edit",
    "CMD_TOGGLE_QUICK_DOCS"               : "Quick Docs",
    "CMD_TOGGLE_QUICK_EDIT"               : "Hızlı Düzenle",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Önceki Eşleşme",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Sonraki Eşleşme",
    "CMD_NEXT_DOC"                        : "Sonraki Dosya",
    "CMD_PREV_DOC"                        : "Önceki Dosya",
    "CMD_SHOW_IN_TREE"                    : "Dosya Listesinde Göster",
    "CMD_SHOW_IN_OS"                      : "Bulunduğu Konumu Aç",
    
    // Help menu commands
    "HELP_MENU"                           : "Yardım",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Eklentiler Klasörünü Göster",
    "CMD_CHECK_FOR_UPDATE"                : "Yeni Versiyon Kontrol Et",
    "CMD_ABOUT"                           : "{APP_TITLE} Hakkında",
    "CMD_FORUM"                           : "{APP_NAME} Forum",

    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Ekranı Kapat",
    "CMD_ABORT_QUIT"                      : "Çıkışı İptal Et",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Deneysel Sürüm",
    "SEARCH_RESULTS"                       : "Arama sonuçları",
    "OK"                                   : "Tamam",
    "DONT_SAVE"                            : "Kaydetme",
    "SAVE"                                 : "Kaydet",
    "CANCEL"                               : "İptal",
    "RELOAD_FROM_DISK"                     : "Hafızadan Yenile",
    "KEEP_CHANGES_IN_EDITOR"               : "Değişiklikleri Editörde Tut",
    "CLOSE_DONT_SAVE"                      : "Kapat (Kaydetme)",
    "RELAUNCH_CHROME"                      : "Chrome'u Tekrar Aç",
    "ABOUT"                                : "Hakkında",
    "CLOSE"                                : "Kapat",
    "ABOUT_TEXT_LINE1"                     : "sprint 14 test sürümü",
    "ABOUT_TEXT_LINE3"                     : "Üçüncü parti yazılımlara ilişkin bildirimler, şartlar ve koşullar <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> adresinde bulunmaktadır ve bu adreste referans olarak dahil edilmiştir",
    "ABOUT_TEXT_LINE4"                     : "Döküman ve kodlar için <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a> adresine bakabilirsiniz.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "{APP_NAME} programının yeni versiyonu bulunmakta! Detaylar için tıklayın.",
    "UPDATE_AVAILABLE_TITLE"               : "Yeni versiyon hazır",
    "UPDATE_MESSAGE"                       : "Hey, {APP_NAME} programının yeni versiyonu hazır. İşte bazı yeni özellikler:",
    "GET_IT_NOW"                           : "Şimdi Yükle!",
    "PROJECT_SETTINGS_TITLE"               : "{0} için Proje Ayarları",
    "PROJECT_SETTING_BASE_URL"             : "Ana URL'den Canlı Önizleme",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(dosya urlsi için boş bırakın)",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "{0} protokolü canlı önizlemeyi desteklemiyor.&mdash;lütfen http: or https: kullanın.",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Ana URL \"{0}\" gibi arama karakterleri bulunduramaz.",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Ana URL \"{0}\" gibi karakterler bulunduramaz.",
    "BASEURL_ERROR_INVALID_CHAR"           : "'{0}' gibi özel karakterler %-kodlanması gerekiyor.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Ana URL'yi işlerken bilinmeyen hata",
    
    
    // extensions/default/DebugCommands
    "DEBUG_MENU"                           : "Ayıkla",
    "CMD_SHOW_DEV_TOOLS"                   : "Geliştirici Araçlarını Göster",
    "CMD_REFRESH_WINDOW"                   : "{APP_NAME} Ekranını Yenile",
    "CMD_NEW_BRACKETS_WINDOW"              : "Yeni {APP_NAME} Ekranı",
    "CMD_SWITCH_LANGUAGE"                  : "Dili Değiştir",
    "CMD_RUN_UNIT_TESTS"                   : "Testleri Çalıştır",
    "CMD_SHOW_PERF_DATA"                   : "Performans Bilgisini Göster",
    
    "LANGUAGE_TITLE"                       : "Dili değiştir",
    "LANGUAGE_MESSAGE"                     : "Lütfen aşağıdaki dillerden istediğiniz dili seçin:",
    "LANGUAGE_SUBMIT"                      : "{APP_NAME} Yenile",
    "LANGUAGE_CANCEL"                      : "İptal",
    
    /**
     * Locales
     */
    "LOCALE_DE"                                 : "Almanca",
    "LOCALE_EN"                                 : "Ingilizce",
    "LOCALE_FR"                                 : "Fransizca",
    "LOCALE_CS"                                 : "Çekçe",
    "LOCALE_ES"                                 : "İspanyolca",
    "LOCALE_IT"                                 : "İtalyanca",
    "LOCALE_JA"                                 : "Japonca",
    "LOCALE_NB"                                 : "Norveççe",
    "LOCALE_PL"                                 : "Polonyaca",
    "LOCALE_PT_BR"                              : "Portekizce, Brezilya",
    "LOCALE_PT_PT"                              : "Portekizce",
    "LOCALE_RU"                                 : "Rusça",
    "LOCALE_SV"                                 : "İsveççe",
    "LOCALE_TR"                                 : "Türkçe",
    "LOCALE_ZH_CN"                              : "Çince, basitleştirilmiş",
    "LOCALE_HU"                                 : "Macarca",
    
    // extensions/default/JSLint
    "CMD_JSLINT"                           : "JSLint Aç",
    "JSLINT_ERRORS"                        : "JSLint Hataları",
    "JSLINT_ERROR_INFORMATION"             : "1 JSLint Hatası",
    "JSLINT_ERRORS_INFORMATION"            : "{0} JSLint Hatası",
    "JSLINT_NO_ERRORS"                     : "JSLint hatası bulunamadı - Mükemmel!",
    "JSLINT_DISABLED"                      : "JSLint kapalı veya şuan ki dosyada kullanılamıyor"
});
