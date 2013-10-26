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
    "NO_MODIFICATION_ALLOWED_ERR"       : "Klasör değişikliği için yetkiniz yok.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Dosya değişikliği için yetkiniz yok.",
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
    "ERROR_CREATING_FILE_TITLE"         : "Dosya oluşturulamadı",
    "ERROR_CREATING_FILE"               : "<span class='dialog-filename'>{0}</span> dosyası oluşturulurken hata oluştu. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Ups! {APP_NAME} programı henüz tarayıcıda açılmadı.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} HTML olarak hazırlandı, ancak şuan için masaüstünde çalışabilmekte. Bu nedenle makinanızda bulunan dosyalarda değişiklik için kullanabilirsiniz. {APP_NAME} programını çalıştırabilmek için lütfen <b>github.com/adobe/brackets-shell</b> adresindeki 'application shell'i kullanınız.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Dosyalar indekslenirken hata",
    "ERROR_MAX_FILES"                   : "Maksimum sayıda dosya indekslendi. İndekslenen dosyalardaki işlemler düzgün çalışmayabilir.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Tarayıcı çalıştırılırken hata",
    "ERROR_CANT_FIND_CHROME"            : "Google Chrome tarayıcısı bulunamadı. Lütfen kurulu olduğundan emin olun.",
    "ERROR_LAUNCHING_BROWSER"           : "Tarayıcı açılırken hata oluştu. (hata {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Canlı Önizleme Hatası",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Tarayıcıya bağlanılıyor",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Canlı Önizleme özelliğini kullanabilmek için Chrome'un uzaktan hata ayıklayıcı ile tekrardan açılması gerekiyor.<br /><br />Chrome'u uzaktan hata ayıklayıcı ile tekrardan açılmasını ister misiniz?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Canlı Geliştirme Sayfası Yüklenemedi",   
	"LIVE_DEV_NEED_HTML_MESSAGE"        : "Canlı Önizlemeyi çalıştırabilmeniz için html dosyası açmanız gerekiyor",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Canlı Önizlemeyi sunucu taraflı dosyalarınız ile açmak istiyorsanız, lütfen bu proje için kullanılabilir bir yol belirtiniz.",
	"LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Error starting up the HTTP server for live development files. Lütfen tekrar deneyin.", 
	"LIVE_DEVELOPMENT_INFO_TITLE"       : "Canlı Önizlemeye Hoşgeldiniz!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "{APP_NAME} Canlı Önizleme için tarayıcınıza bağlanarak projenizin örnek görüntüsünü açıyor. Değişiklik yaptığınız sayfayı kaydettiğiniz anda tarayıcı otomatik yenileme yapar.<br /><br />{APP_NAME} programının bu versiyonunda, Canlı Önizleme özelliği sndece <strong>CSS dosyaları</strong> değişikliğine izin veriyor yakında HTML ve Javascript değişikliğini de ekleyeceğiz!<br /><br />Canlı Önizleme sadece <strong>Google Chrome</strong> üzerinde çalışır.<br /><br />(Bu mesaj sadece bir defa gösterilecektir.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Detaylı bilgi için lütfen <a href='{0}' title='{0}'>Troubleshooting Live Development connection errors</a> sayfasına bakınız.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Canlı Önizleme",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Canlı Önizleme: Bağlanılıyor\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Canlı Önizleme: Başlıyor\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Canlı Önizleme'den Çık",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Canlı Önizleme: Kapatmak için tıklayın (Yenilemek için dosyayı kaydedin)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Canlı Önizleme (sözdizi hatasından dolayı güncellenemiyor)",
	
    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Live Preview was cancelled because the browser's developer tools were opened",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Canlı Önizleme tarayıcı sekmesi kapatıldığı için iptal edildi",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Canlı Önizleme tarayıcı sekmesinde projeye ait olmayan bir sayfa açıldığı için iptel edildi",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Canlı Önizleme bilinmeyen bir sebepten dolayı iptal edildi ({0})",
      
    "SAVE_CLOSE_TITLE"                  : "Değişiklikleri kaydet",
    "SAVE_CLOSE_MESSAGE"                : "<span class='dialog-filename'>{0}</span> dosyasında yaptığınız değişiklikleri kaydetmek istiyor musunuz?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Dosyalardaki değişiklikleri kaydetmek istiyor musunuz?",
    "EXT_MODIFIED_TITLE"                : "Harici değişiklikler",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Silmeyi onayla",
    "CONFIRM_FOLDER_DELETE"             : " <span class='dialog-filename'>{0}</span> klasörünü silmek istediğinizden eminmisiniz?",
    "FILE_DELETED_TITLE"                : "Dosya Silindi",
	"EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> dosyası dışarıdan değiştirildi ama {APP_NAME} programında kaydetmediğiniz değişiklikler bulunmakta.<br /><br />Hangi versiyonun kalmasını istiyorsunuz?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> dosyası hafızadan silind ama {APP_NAME} programında kaydetmediğiniz değişiklikler bulunmakta.<br /><br />Değişikliklerin kalmasını istiyor musunuz?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Regexp arama yapmak için /re/ sözdizimini kullanın",
	"FIND_RESULT_COUNT"                 : "{0} sonuç",
    "FIND_RESULT_COUNT_SINGLE"          : "1 sonuç",
    "FIND_NO_RESULTS"                   : "Eşleşme yok",
    "WITH"                              : "İle",
    "BUTTON_YES"                        : "Evet",
    "BUTTON_NO"                         : "Hayır",
	"BUTTON_REPLACE_ALL"                : "All\u2026",
    "BUTTON_STOP"                       : "Durdur",
	"BUTTON_REPLACE"                    : "Değiştir",

	"BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Sonraki",
    "BUTTON_PREV_HINT"                  : "Önceki",

    "OPEN_FILE"                         : "Dosya Aç",
	"SAVE_FILE_AS"                      : "Farklı Kaydet",
    "CHOOSE_FOLDER"                     : "Klasör Seç",

    "RELEASE_NOTES"                     : "Sürün Notları",
    "NO_UPDATE_TITLE"                   : "{APP_NAME} güncel!",
    "NO_UPDATE_MESSAGE"                 : "{APP_NAME}'in en son versiyonunu kullanıyorsunuz.",
    
    "FIND_REPLACE_TITLE_PART1"          : "Depiştir \"",
    "FIND_REPLACE_TITLE_PART2"          : "\" ile \"",
    "FIND_REPLACE_TITLE_PART3"          : "\" &mdash; {2} {0} {1}",
	
    "FIND_IN_FILES_TITLE_PART1"         : "\"",
    "FIND_IN_FILES_TITLE_PART2"         : "\" bulundu",
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
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Versiyon bilgisi alınamadı",
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
    "ERRORS_PANEL_TITLE"                    : "{0} Hatalar",
    "SINGLE_ERROR"                          : "1 {0} Hata",
    "MULTIPLE_ERRORS"                       : "{1} {0} Hatalar",
    "NO_ERRORS"                             : "{0} hata - Tebrikler!",
    "LINT_DISABLED"                         : "Linting devre dışı",
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
    "EDIT_MENU"                           : "Düzen",
    "CMD_UNDO"                            : "Geri Al",
    "CMD_REDO"                            : "Tekrar Yap",
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
    "CMD_COMMENT"                         : "Satıra yorum etiketi ekle/kaldır",
    "CMD_BLOCK_COMMENT"                   : "Bloğa yorum etiketi ekle/kaldır",
    "CMD_LINE_UP"                         : "Satırı Yukarı Taşı",
    "CMD_LINE_DOWN"                       : "Satırı Aşağı Taşı",
    "CMD_OPEN_LINE_ABOVE"                 : "Üste Yeni Satır",
    "CMD_OPEN_LINE_BELOW"                 : "Alta Yeni Satır",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Auto Close Braces",
    "CMD_SHOW_CODE_HINTS"                 : "Kod İpuçlarını Göster",
    
    // View menu commands
    "VIEW_MENU"                           : "Görünüm",
    "CMD_HIDE_SIDEBAR"                    : "Kenar Çubuğu Gizle",
    "CMD_SHOW_SIDEBAR"                    : "Kenar Çubuğu Göster",
    "CMD_INCREASE_FONT_SIZE"              : "Font Boyutunu Büyült",
    "CMD_DECREASE_FONT_SIZE"              : "Font Boyutunu Küçült",
    "CMD_RESTORE_FONT_SIZE"               : "Font Boyutunu Sıfırla",
    "CMD_SCROLL_LINE_UP"                  : "Scroll Line Up",
    "CMD_SCROLL_LINE_DOWN"                : "Scroll Line Down",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Satır Numaraları",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Aktif Satırı Vurgula",
    "CMD_TOGGLE_WORD_WRAP"                : "Sözcük Kaydır",
    "CMD_LIVE_HIGHLIGHT"                  : "Canlı Önizlemede Vurgula",
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
    "CMD_TOGGLE_QUICK_EDIT"               : "Hızlı Düzenle",
    "CMD_TOGGLE_QUICK_DOCS"               : "Hızlı Yardım",
    "CMD_TOGGLE_QUICK_EDIT"               : "Hızlı Düzenle",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Önceki Eşleşme",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Sonraki Eşleşme",
    "CMD_NEXT_DOC"                        : "Sonraki Dosya",
    "CMD_PREV_DOC"                        : "Önceki Dosya",
    "CMD_SHOW_IN_TREE"                    : "Dosya Listesinde Göster",
    "CMD_SHOW_IN_OS"                      : "Bulunduğu Konumu Aç",
    
    // Help menu commands
    "HELP_MENU"                           : "Yardım",
    "CMD_CHECK_FOR_UPDATE"                : "Güncellemeleri Kontrol Et",
    "CMD_HOW_TO_USE_BRACKETS"             : "{APP_NAME} Nasıl Kullanılır",
    "CMD_FORUM"                           : "{APP_NAME} Forumu",
    "CMD_RELEASE_NOTES"                   : "Sürüm Notları",
    "CMD_REPORT_AN_ISSUE"                 : "Hata Bildir",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Eklentiler Klasörünü Göster",
    "CMD_TWITTER"                         : "{TWITTER_NAME} Twitter'da",
    "CMD_ABOUT"                           : "{APP_TITLE} Hakkında","ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform Docs and the Web Platform graphical logo are licensed under a Creative Commons Attribution license, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
   

    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Pencereyi Kapat",
    "CMD_ABORT_QUIT"                      : "Çıkışı İptal Et",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "deneysel sürüm",
    "DEVELOPMENT_BUILD"                    : "geliştime sürümü",
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
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Notices, terms and conditions pertaining to third party software are located at <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> and incorporated by reference herein.",
    "ABOUT_TEXT_LINE4"                     : "Documentation and source at <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Made with \u2764 and JavaScript by:",
    "ABOUT_TEXT_LINE6"                     : "Lots of people (but we're having trouble loading that data right now).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform Docs and the Web Platform graphical logo are licensed under a Creative Commons Attribution license, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "{APP_NAME} programının yeni versiyonu bulunmakta! Detaylar için tıklayın.",
    "UPDATE_AVAILABLE_TITLE"               : "Yeni versiyon hazır",
    "UPDATE_MESSAGE"                       : "Hey, {APP_NAME} programının yeni versiyonu hazır. İşte bazı yeni özellikler:",
    "GET_IT_NOW"                           : "Şimdi Yükle!",
    "PROJECT_SETTINGS_TITLE"               : "{0} İçin Proje Ayarları",
    "PROJECT_SETTING_BASE_URL"             : "Ana URL'den Canlı Önizleme"<br />,
    "PROJECT_SETTING_BASE_URL_HINT"        : "Dosya urlsi için boş bırakın",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "{0} protokolü canlı önizlemeyi desteklemiyor.&mdash;lütfen http: yada https: kullanın.",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Ana URL \"{0}\" gibi arama karakterleri bulunduramaz.",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Ana URL \"{0}\" gibi karakterler bulunduramaz.",
    "BASEURL_ERROR_INVALID_CHAR"           : "'{0}' gibi özel karakterler %-kodlanması gerekiyor.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Ana URL'yi işlerken bilinmeyen hata",
    
       // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Yeni Kural",
      
    // Extension Management strings
    "INSTALL"                              : "Yükle",
    "UPDATE"                               : "Güncelle",
    "REMOVE"                               : "Kaldır",
    "OVERWRITE"                            : "Üzerine Yaz",
    "CANT_REMOVE_DEV"                      : "\"dev\" kladöründeki uzantılar elle silinmelidir.",
    "CANT_UPDATE"                          : "Bu güncelleme {APP_NAME}'in bu sürümüyle uyumlu değil.",
    "INSTALL_EXTENSION_TITLE"              : "Uzantı Yükle",
    "UPDATE_EXTENSION_TITLE"               : "Uzantı Güncelle",
    "INSTALL_EXTENSION_LABEL"              : "Uzantı URL'si",
    "INSTALL_EXTENSION_HINT"               : "Uzantını sıkıştırlmış dosya yada GitHub repo URL'si",
    "INSTALLING_FROM"                      : "Installing extension from {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Kurulum Başarılı!",
    "INSTALL_FAILED"                       : "Kurulum Başarısız.",
    "CANCELING_INSTALL"                    : "İptal edilior\u2026",
    "CANCELING_HUNG"                       : "Kurulum gerekenden fazla zaman aldığı için iptal ediliyor. Bir iç hata oluşmuş olabilir.",
    "INSTALL_CANCELED"                     : "Kurulum İptal Edildi.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "İndirilen arşiv dosyası geçersiz.",
    "INVALID_PACKAGE_JSON"                 : "package.json dosyası geçersiz (error was: {0}).",
    "MISSING_PACKAGE_NAME"                 : "package.json dosyasında paket ismi belirtilmemiş.",
    "BAD_PACKAGE_NAME"                     : "{0} geçersiz bir paket ismi.",
    "MISSING_PACKAGE_VERSION"              : "package.json dosyasında paket sürümü belirtilmemiş.",
    "INVALID_VERSION_NUMBER"               : "({0}) geçersiz bir paket sürüm numarası.",
    "INVALID_BRACKETS_VERSION"             : "The {APP_NAME} compatibility string ({0}) is invalid.",
    "DISALLOWED_WORDS"                     : "The words ({1}) are not allowed in the {0} field.",
    "API_NOT_COMPATIBLE"                   : "The extension isn't compatible with this version of {APP_NAME}. It's installed in your disabled extensions folder.",
    "MISSING_MAIN"                         : "The package has no main.js file.",
    "EXTENSION_ALREADY_INSTALLED"          : "Installing this package will overwrite a previously installed extension. Overwrite the old extension?",
    "EXTENSION_SAME_VERSION"               : "This package is the same version as the one that is currently installed. Overwrite the existing installation?",
    "EXTENSION_OLDER_VERSION"              : "This package is version {0} which is older than the currently installed ({1}). Overwrite the existing installation?",
    "DOWNLOAD_ID_IN_USE"                   : "Internal error: download ID already in use.",
    "NO_SERVER_RESPONSE"                   : "Cannot connect to server.",
    "BAD_HTTP_STATUS"                      : "File not found on server (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Unable to save download to temp file.",
    "ERROR_LOADING"                        : "The extension encountered an error while starting up.",
    "MALFORMED_URL"                        : "The URL is invalid. Please check that you entered it correctly.",
    "UNSUPPORTED_PROTOCOL"                 : "The URL must be an http or https URL.",
    "UNKNOWN_ERROR"                        : "Unknown internal error.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Extension Manager",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Unable to access the extension registry. Please try again later.",
    "INSTALL_FROM_URL"                     : "Install from URL\u2026",
    "EXTENSION_AUTHOR"                     : "Author",
    "EXTENSION_DATE"                       : "Date",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "This extension requires a newer version of {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "This extension currently only works with older versions of {APP_NAME}.",
    "EXTENSION_NO_DESCRIPTION"             : "No description",
    "EXTENSION_MORE_INFO"                  : "More info...",
    "EXTENSION_ERROR"                      : "Extension error",
    "EXTENSION_KEYWORDS"                   : "Keywords",
    "EXTENSION_INSTALLED"                  : "Installed",
    "EXTENSION_UPDATE_INSTALLED"           : "This extension update has been downloaded and will be installed when you quit {APP_NAME}.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Search",
    "EXTENSION_MORE_INFO_LINK"             : "More",
    "BROWSE_EXTENSIONS"                    : "Browse Extensions",
    "EXTENSION_MANAGER_REMOVE"             : "Remove Extension",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Unable to remove one or more extensions: {0}. {APP_NAME} will still quit.",
    "EXTENSION_MANAGER_UPDATE"             : "Update Extension",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Unable to update one or more extensions: {0}. {APP_NAME} will still quit.",
    "MARKED_FOR_REMOVAL"                   : "Kaldırma  İçin İşaretlendi",
    "UNDO_REMOVE"                          : "Geri Al",
    "MARKED_FOR_UPDATE"                    : "Güncelleme İçin İşaretlendi",
    "UNDO_UPDATE"                          : "Geri Al",
    "CHANGE_AND_QUIT_TITLE"                : "Uzantıları Değiştir",
    "CHANGE_AND_QUIT_MESSAGE"              : "Seçili uzantıları kaldırmak yada güncellemek için {APP_NAME} yeniden başlatılmalı. Kaydedilmemiş dosyaları kaydetmeniz istenecektir.",
    "REMOVE_AND_QUIT"                      : "Uzantıları Kaldır ve Çık",
    "CHANGE_AND_QUIT"                      : "Uzantıları Değiştir ve Çık",
    "UPDATE_AND_QUIT"                      : "Uzantıları Güncelle ve Çık",
    "EXTENSION_NOT_INSTALLED"              : "Uzantı kaldırılamıyor {0} çünkü yüklenmedi.",
    "NO_EXTENSIONS"                        : "Henüz yüklenmiş uzantı yok.<br>Başlamak için Mevcut butonuna basın.",
    "NO_EXTENSION_MATCHES"                 : "Aramanızla eşlenşen uzantı bulunamadı.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Bilinmeyen kaynaklardan uzantı yüklerken dikkatli olmalısınız.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Kurulu",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Mevcut",
    "EXTENSIONS_UPDATES_TITLE"             : "Güncellemeler",
    
    "INLINE_EDITOR_NO_MATCHES"             : "Eşleşme yok.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Seçiminize uygun CSS kuralı yok.<br> Yeni oluşturmak için \"Yeni Kural\"' butonuna tıklayın.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Projenizde stilsayfası(CSS)bulunmuyor.<br>CSS kuralları eklemek için bir tene oluşturmalısınız.",
    
    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "pixeller",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                           : "Hata Ayıkla",
    "CMD_SHOW_DEV_TOOLS"                   : "Geliştirici Araçlarını Göster",
    "CMD_REFRESH_WINDOW"                   : "{APP_NAME} Penceresini Yenile",
    "CMD_NEW_BRACKETS_WINDOW"              : "Yeni {APP_NAME} Penceresi",
    "CMD_SWITCH_LANGUAGE"                  : "Dili Değiştir",
    "CMD_RUN_UNIT_TESTS"                   : "Testleri Çalıştır",
    "CMD_SHOW_PERF_DATA"                   : "Performans Bilgisini Göster",
    "CMD_ENABLE_NODE_DEBUGGER"             : "Node Ayıklayıcısını Etkinleştir",
    "CMD_LOG_NODE_STATE"                   : "Node Durum Konsolunu Kaydet",
    "CMD_RESTART_NODE"                     : "Node'u Yeniden Başlat",
    
    "LANGUAGE_TITLE"                       : "Dili değiştir",
    "LANGUAGE_MESSAGE"                     : "Lütfen aşağıdan istediğiniz dili seçin:",
    "LANGUAGE_SUBMIT"                      : "{APP_NAME}'i Yenile",
    "LANGUAGE_CANCEL"                      : "İptal",
    "LANGUAGE_SYSTEM_DEFAULT"              : "Sistem Varsayılanı",
    
    // Locales (used by Debug > Switch Language)
    "LOCALE_CS"                                 : "Czech",
    "LOCALE_DE"                                 : "German",
    "LOCALE_EN"                                 : "English",
    "LOCALE_ES"                                 : "Spanish",
    "LOCALE_FI"                                 : "Finnish",
    "LOCALE_FR"                                 : "French",
    "LOCALE_IT"                                 : "Italian",
    "LOCALE_JA"                                 : "Japanese",
    "LOCALE_NB"                                 : "Norwegian",
    "LOCALE_PL"                                 : "Polish",
    "LOCALE_PT_BR"                              : "Portuguese, Brazil",
    "LOCALE_PT_PT"                              : "Portuguese",
    "LOCALE_RU"                                 : "Russian",
    "LOCALE_SK"                                 : "Slovak",
    "LOCALE_SV"                                 : "Swedish",
    "LOCALE_TR"                                 : "Türkçe",
    "LOCALE_ZH_CN"                              : "Chinese, simplified",
    "LOCALE_HU"                                 : "Hungarian",
    
    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Süre",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "İlerleme",
  
     
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Şuanki Renk",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Gerçek REnk",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa Formatı",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex Formatı",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa Formatı",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} ( {1} defa kullanıldı)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} ( {1} defa kullanıldı)",
      
        // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Tanıma Atla",
    "CMD_SHOW_PARAMETER_HINT"                   : "Parametre ipucunu göster",
    "NO_ARGUMENTS"                              : "<parametre yok>",
    
    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",
   // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Quick View on Hover",
    
    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Geçmiş Projeler",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Daha fazla"
});
