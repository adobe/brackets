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
    "NO_MODIFICATION_ALLOWED_ERR"       : "Klasörde değişiklik yapılamıyor.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Dosya değişikliği için izniniz yok.",
    "CONTENTS_MODIFIED_ERR"             : "Dosya {APP_NAME} dışında modifiye edilmiştir.",
    "UNSUPPORTED_ENCODING_ERR"          : "{APP_NAME} şu anda sadece UTF-8 ile kodlanmış metin dosyaları destekler.",
    "FILE_EXISTS_ERR"                   : "Dosya bulunmaktadır.",
    "FILE"                              : "dosya",
    "DIRECTORY"                         : "klasör",
    "DIRECTORY_NAMES_LEDE"              : "Klasör adları",
    "FILENAMES_LEDE"                    : "Dosyaadları",
    "FILENAME"                          : "dosyadı",
    "DIRECTORY_NAME"                    : "klasör adı",
    
    
    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Proje yüklenirken hata",
    "OPEN_DIALOG_ERROR"                 : "Dosya dialogu gösterilirken hata meydana geldi. (hata {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "<span class='dialog-filename'>{0}</span> klasörü yüklenirken hata meydana geldi. (hata {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "<span class='dialog-filename'>{0}</span> klasörü okunurken hata meydana geldi. (hata {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Dosya açılırken hata",
    "ERROR_OPENING_FILE"                : "<span class='dialog-filename'>{0}</span> dosyası açılırken hata meydana geldi. {1}",
    "ERROR_OPENING_FILES"               : "An error occurred when trying to open the following files:",
    "ERROR_RELOADING_FILE_TITLE"        : "Değişiklikler hafızadan okunurken hata oluştu.",
    "ERROR_RELOADING_FILE"              : "<span class='dialog-filename'>{0}</span> dosyası yenilenirken hata meydana geldi. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Dosya kaydedilirken hata",
    "ERROR_SAVING_FILE"                 : "<span class='dialog-filename'>{0}</span> dosyası kaydedilirken hata meydana geldi. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Dosya ismi değiştirilirken hata",
    "ERROR_RENAMING_FILE"               : "<span class='dialog-filename'>{0}</span> dosyasının ismi değiştirilirken hata meydana geldi. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Error Deleting File",
    "ERROR_DELETING_FILE"               : "An error occurred when trying to delete the file <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Hatalı dosya ismi",
    "INVALID_FILENAME_MESSAGE"          : "Dosya isimleri yandaki karakterleri bulunduramaz: {0}",
    "ENTRY_WITH_SAME_NAME_EXISTS"       : "A file or directory with the name <span class='dialog-filename'>{0}</span> already exists.",
    "ERROR_CREATING_FILE_TITLE"         : "Dosya yaratılırken hata",
    "ERROR_CREATING_FILE"               : "<span class='dialog-filename'>{0}</span> dosyası yaratılırken hata meydana geldi. {1}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"         : "Tercihleri okuma hatası",
    "ERROR_PREFS_CORRUPT"               : "JSON tercih dosyası geçerli değil. Dosya biçimini düzelttiğinde açılacaktır. {APP_NAME} değişikliklerin geçerli olabilmesi için uygulamayı yeniden başlatın.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Hoop! {APP_NAME} programı şuan tarayıcıda açılmadı.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} HTML olarak hazırlandı, ancak şuan için masaüstünde çalışabilmekte. Bu nedenle makinanızda bulunan dosyalarda değişiklik için kullanabilirsiniz. {APP_NAME} programını çalıştırabilmek için lütfen <b>github.com/adobe/brackets-shell</b> adresindeki 'application shell'i kullanınız.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Dosyalar indekslenirken hata",
    "ERROR_MAX_FILES"                   : "Maksimum sayıda dosya indekslendi. Indekslenen dosyalardaki işlemler düzgün çalışmayabilir.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Tarayıcı çalıştırılırken hata",
    "ERROR_CANT_FIND_CHROME"            : "Google Chrome tarayıcısı bulunamadı. Lütfen kurulu olduğundan emin olun.",
    "ERROR_LAUNCHING_BROWSER"           : "Tarayıcı açılırken hata meydana geldi. (hata {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Canlı Önizleme Hatası",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Tarayıcıya bağlanılıyor",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Canlı önizleme özelliğini kullanabilmek için uzaktan hata ayıklayıcı ile Chrome'un tekrardan açılması gerekiyor.<br /><br />Chrome'u uzaktan hata ayıklayıcı ile tekrardan açılmasını ister misiniz?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Unable to load Live Preview page",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Canlı önizlemeyi çalıştırabilmeniz için html dosyası açmanız gerekiyor",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Canlı Önizlemeyi server-side dosyalarınız ile açmak istiyorsanız, lütfen bu proje için kullanılabilir bir link belirtiniz.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Canlı önizleme için HTTP sunucusu başlatılamıyor. Lütfen tekrar deneyiniz.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Canlı Önizlemeye Hoşgeldiniz!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Canlı önizleme için {APP_NAME} programı tarayıcınıza bağlanıyor ve sizin HTML dosyanızın örnek görüntüsünü tarayıcınızda açıyor. Sonrasında ise değişiklik yaptığınız sayfayı anında tarayıcıda yenileyerek gösteriyor.<br /><br />{APP_NAME} programının bu versiyonunda, Canlı önizleme özelliği sadece <strong>CSS dosyaları</strong> değişikliğine izin veriyor ve sadece <strong>Google Chrome</strong> üzerinde çalışıyor. Yakında HTML ve Javascript değişikliğini de ekleyeceğiz!<br /><br />(Bu mesaj sadece tek sefer gösterilecektir.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Detaylı bilgi için lütfen <a href='{0}' title='{0}'>Troubleshooting Live Development connection errors</a> sayfasına bakınız.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Canlı Önizleme",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Canlı Önizleme: Bağlanılıyor\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Canlı Önizleme: Başlıyor\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Canlı Önizleme'den Çık",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Canlı Önizleme: Kapatmak için tıklayın (Yenilemek için dosyayı kaydedin)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Live Preview (not updating due to syntax error)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Geliştirici araçları açıldığı için canlı önizleme iptal edildi",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Tarayıcı sayfası kapatıldğı için canlı önizleme iptal edildi",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Projede yer almayan bir dosya açıldığı için canlı önizleme iptal edildi",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Bilinmeyen bir denenden dolayı canlı önizleme iptal edildi ({0})",
    
    "SAVE_CLOSE_TITLE"                  : "Değişiklikleri kaydet",
    "SAVE_CLOSE_MESSAGE"                : "<span class='dialog-filename'>{0}</span> dosyasında yaptığınız değişiklikleri kaydetmek istiyor musunuz?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Dosyalardaki değişiklikleri kaydetmek istiyor musunuz?",
    "EXT_MODIFIED_TITLE"                : "Harici değişiklikler",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Silmeyi Onayla",
    "CONFIRM_FOLDER_DELETE"             : "<span class='dialog-filename'>{0}</span> klasörü silmek istediğinizden emin misiniz??",
    "FILE_DELETED_TITLE"                : "Dosya Silindi",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> değiştirildi.<br /><br />Bu değişikliklerin üzerine yazmak istiyor musunuz?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> dosyası dışarıdan değiştirildi ama {APP_NAME} programında kaydetmediğiniz değişiklikler bulunmakta.<br /><br />Hangi versiyonun kalmasını istiyorsunuz?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> dosyası hafızadan silindi ama {APP_NAME} programında kaydetmediğiniz değişiklikler bulunmakta.<br /><br />Değişikliklerin kalmasını istiyor musunuz?",
    
    // Generic dialog/button labels
    "DONE"                              : "Bitti",
    "OK"                                : "TAMAM",
    "CANCEL"                            : "Vazgeç",
    "DONT_SAVE"                         : "Kaydetme",
    "SAVE"                              : "Kaydet",
    "SAVE_AS"                           : "Farklı kaydet\u2026",
    "SAVE_AND_OVERWRITE"                : "Üstüne yaz",
    "DELETE"                            : "Sil",
    "BUTTON_YES"                        : "Evet",
    "BUTTON_NO"                         : "Hayır",
    
    // Find, Replace, Find in Files
    "FIND_RESULT_COUNT"                 : "{0} sonuçlar",
    "FIND_RESULT_COUNT_SINGLE"          : "1 sonuç",
    "FIND_NO_RESULTS"                   : "Sonuç Yok",
    "FIND_QUERY_PLACEHOLDER"            : "Bul\u2026",
    "REPLACE_PLACEHOLDER"               : "ile değiştir\u2026",
    "BUTTON_REPLACE_ALL"                : "Toplu\u2026",
    "BUTTON_REPLACE_ALL_IN_FILES"       : "Değiştir\u2026",
    "BUTTON_REPLACE"                    : "Değiştir",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Sonraki",
    "BUTTON_PREV_HINT"                  : "Önceki",
    "BUTTON_CASESENSITIVE_HINT"         : "Büyük/Küçük Harf Duyarlı",
    "BUTTON_REGEXP_HINT"                : "Düzenli İfade(Regex)",
    "REPLACE_WITHOUT_UNDO_WARNING_TITLE": "Geri al",
    "REPLACE_WITHOUT_UNDO_WARNING"      : "Because more than {0} files need to be changed, {APP_NAME} will modify unopened files on disk.<br />You won't be able to undo replacements in those files.",
    "BUTTON_REPLACE_WITHOUT_UNDO"       : "Geri al",

    "OPEN_FILE"                         : "Dosya Aç",
    "SAVE_FILE_AS"                      : "Dosyayı kaydet",
    "CHOOSE_FOLDER"                     : "Klasör Seç",

    "RELEASE_NOTES"                     : "Sürüm Notları",
    "NO_UPDATE_TITLE"                   : "Güncel",
    "NO_UPDATE_MESSAGE"                 : "{APP_NAME}'ın en son sürümünü çalıştırıyorsunuz.",

    // Find and Replace
    "FIND_REPLACE_TITLE_LABEL"          : "Değiştir",
    "FIND_REPLACE_TITLE_WITH"           : "İle",
    "FIND_TITLE_LABEL"                  : "Bulundu",
    "FIND_TITLE_SUMMARY"                : " &mdash; {0} {1} {2} içinde {3}",

    // Find in Files
    "FIND_NUM_FILES"                    : "{0} {1}",
    "FIND_IN_FILES_SCOPED"              : "<span class='dialog-filename'>{0}</span> dosyası içinde",
    "FIND_IN_FILES_NO_SCOPE"            : "in project",
    "FIND_IN_FILES_ZERO_FILES"          : "Filtre hariç tüm dosyalar {0}",
    "FIND_IN_FILES_FILE"                : "dosya",
    "FIND_IN_FILES_FILES"               : "dosyalar",
    "FIND_IN_FILES_MATCH"               : "bulunan",
    "FIND_IN_FILES_MATCHES"             : "bulunanlar",
    "FIND_IN_FILES_MORE_THAN"           : "Daha fazla ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "Tümünü genişletmek/daraltmak için Ctrl/Cmd tıklayın",
    "REPLACE_IN_FILES_ERRORS_TITLE"     : "Hataları değiştir",
    "REPLACE_IN_FILES_ERRORS"           : "TheAşağıdaki dosyalar aramadan sonra değişti.",
    
    "RELEASE_NOTES"                     : "Yeni Versiyon Bilgileri",
    "NO_UPDATE_TITLE"                   : "En son versiyon!",
    "NO_UPDATE_MESSAGE"                 : "{APP_NAME} programının en son versiyonunu kullanıyorsunuz.",
    
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Versiyon bilgisi alınırken hata",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Sunucudan yeni versiyon bilgisi alınırken hata oluştu. Lütfen internete bağlı olduğunuzdan emin olun ve tekrar deneyin.",
    
    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Proje Yükleniyor\u2026",
    "UNTITLED" : "Adsız",
    "WORKING_FILES"     : "Çalışılan Dosyalar",

    /**
     * Keyboard modifier names
     */

    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Boşluk",

    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Satır {0}, Kolon {1}",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Girintiyi boşluk karakterleriyle değiştirmek için tıklayın",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Girintiyi tab karakterleriyle değiştirmek için tıklayın",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Girintide kullanılacak boşluk sayısını değiştirmek için tıklayın",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Tab karakter genişliğini değiştirmek için tıklayın",
    "STATUSBAR_SPACES"                      : "Boşluk",
    "STATUSBAR_TAB_SIZE"                    : "Tab Boyutu",
    "STATUSBAR_LINE_COUNT"                  : "{0} Satır",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Dosya",
    "CMD_FILE_NEW"                        : "Yeni Dosya",
    "CMD_FILE_NEW_FOLDER"                 : "Yeni Klasör",
    "CMD_FILE_OPEN"                       : "Aç\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Çalışma Ekranına Ekle",
    "CMD_OPEN_FOLDER"                     : "Klasörü Aç\u2026",
    "CMD_FILE_CLOSE"                      : "Kapat",
    "CMD_FILE_CLOSE_ALL"                  : "Hepsini Kapat",
    "CMD_FILE_SAVE"                       : "Kaydet",
    "CMD_FILE_SAVE_AS"                    : "Farklı Kaydet\u2026",
    "CMD_FILE_SAVE_ALL"                   : "Hepsini Kaydet",
    "CMD_LIVE_FILE_PREVIEW"               : "Canlı Önizleme",
    "CMD_PROJECT_SETTINGS"                : "Proje Ayarları\u2026",
    "CMD_FILE_RENAME"                     : "Yeniden Adlandır",
    "CMD_EXTENSION_MANAGER"               : "Eklenti Yöneticisi\u2026",
    "CMD_FILE_DELETE"                     : "Sil",
    "CMD_QUIT"                            : "Çık",

    // Edit menu commands
    "EDIT_MENU"                           : "Düzenle",
    "CMD_UNDO"                            : "Geri Al",
    "CMD_REDO"                            : "Yinele",
    "CMD_CUT"                             : "Kes",
    "CMD_COPY"                            : "Kopyala",
    "CMD_PASTE"                           : "Yapıştır",
    "CMD_SELECT_ALL"                      : "Hepsini Seç",
    "CMD_SELECT_LINE"                     : "Satırı Seç",
    "CMD_SPLIT_SEL_INTO_LINES"            : "Seçileni Satırlara Böl",
    "CMD_ADD_CUR_TO_NEXT_LINE"            : "Sonraki Satıra İmleç Ekle",
    "CMD_ADD_CUR_TO_PREV_LINE"            : "Önceki Satıra İmleç Ekle",
    "CMD_FIND"                            : "Bul",
    "CMD_FIND_IN_FILES"                   : "Dosyalarda Bul",
    "CMD_FIND_IN_SUBTREE"                 : "\u2026içinde bul",
    "CMD_FIND_NEXT"                       : "Sonrakini Bul",
    "CMD_FIND_PREVIOUS"                   : "Öncekini Bul",
    "CMD_FIND_ALL_AND_SELECT"             : "Hepsini Bul ve Seç",
    "CMD_ADD_NEXT_MATCH"                  : "Sonraki Eşleşmeyi Seçime Ekle",
    "CMD_SKIP_CURRENT_MATCH"              : "Atla ve Sonraki Eşleşmeyi Ekle",
    "CMD_REPLACE"                         : "Değiştir",
    "CMD_INDENT"                          : "Girinti Ekle",
    "CMD_UNINDENT"                        : "Girintiyi Geri Al",
    "CMD_DUPLICATE"                       : "Çoğalt",
    "CMD_DELETE_LINES"                    : "Satırı Sil",
    "CMD_COMMENT"                         : "Yorum Satırını Aç / Kapat",
    "CMD_BLOCK_COMMENT"                   : "Yorum Bloğunu Aç / Kapat",
    "CMD_LINE_UP"                         : "Satırı Yukarı Taşı",
    "CMD_LINE_DOWN"                       : "Satırı Aşağıya Taşı",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Parantezleri Otomatik Tamamla",
    "CMD_SHOW_CODE_HINTS"                 : "Kod İpuçlarını Göster",
     
    // View menu commands
    "VIEW_MENU"                           : "Göster",
    "CMD_HIDE_SIDEBAR"                    : "Kenar Çubuğunu Gizle",
    "CMD_SHOW_SIDEBAR"                    : "Kenar Çubuğunu Göster",
    "CMD_INCREASE_FONT_SIZE"              : "Font Boyutunu Büyült",
    "CMD_DECREASE_FONT_SIZE"              : "Font Boyutunu Küçült",
    "CMD_RESTORE_FONT_SIZE"               : "Font Boyutunu Sıfırla",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Eklenmeye Göre Sırala",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "İsme Göre Sırala",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Türüne Göre Sırala",
    "CMD_SORT_WORKINGSET_AUTO"            : "Otomatik Sırala",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Git",
    "CMD_QUICK_OPEN"                      : "Hızlı Aç",
    "CMD_GOTO_LINE"                       : "Satıra Git",
    "CMD_GOTO_DEFINITION"                 : "Tanıma Git",
    "CMD_TOGGLE_QUICK_EDIT"               : "Hızlı Düzenle",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Önceki Eşleşme",
    "CMD_GOTO_FIRST_PROBLEM"              : "İlk Hata veya Uyarıya Git",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Sonraki Eşleşme",
    "CMD_TOGGLE_QUICK_DOCS"               : "Hızlı Erişim Dökümanları",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Yeni Kural",
    "CMD_NEXT_DOC"                        : "Sonraki Dosya",
    "CMD_PREV_DOC"                        : "Önceki Dosya",
    "CMD_SHOW_IN_TREE"                    : "Dosya Listesinde Göster",
    "CMD_SHOW_IN_OS"                      : "Bulunduğu Konumu Aç",
    
    // Help menu commands
    "HELP_MENU"                           : "Yardım",
    "CMD_HOW_TO_USE_BRACKETS"             : "{APP_NAME} Nasıl Kullanılır",
    "CMD_SUPPORT"                         : "{APP_NAME} Desteği",
    "CMD_SUGGEST"                         : "Yeni Özellik Öner",
    "CMD_RELEASE_NOTES"                   : "Sürüm Notları",
    "CMD_GET_INVOLVED"                    : "Projeye Dahil Ol",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Eklentiler Klasörünü Göster",
    "CMD_TWITTER"                         : "{TWITTER_NAME} Twitter'da...",
    "CMD_CHECK_FOR_UPDATE"                : "Yeni Versiyon Kontrol Et",
    "CMD_ABOUT"                           : "{APP_TITLE} Hakkında",
    "CMD_FORUM"                           : "{APP_NAME} Forum",
    "CMD_OPEN_PREFERENCES"                : "Ayarlar Dosyasını Aç",

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
    "CMD_RELOAD_WITHOUT_USER_EXTS"         : "Eklentiler Olmadan Yeniden Yükle",
    "CMD_REFRESH_WINDOW"                   : "{APP_NAME} Ekranını Yenile",
    "CMD_NEW_BRACKETS_WINDOW"              : "Yeni {APP_NAME} Ekranı",
    "CMD_SWITCH_LANGUAGE"                  : "Dili Değiştir",
    "CMD_RUN_UNIT_TESTS"                   : "Testleri Çalıştır",
    "CMD_SHOW_PERF_DATA"                   : "Performans Bilgisini Göster",
    "CMD_ENABLE_NODE_DEBUGGER"             : "Node Hata Ayıklayıcısını Etkinleştir",
    "CMD_LOG_NODE_STATE"                   : "Node Durumunu Konsola Yaz",
    "CMD_RESTART_NODE"                     : "Node'u Yeniden Başlat",
    
    "LANGUAGE_TITLE"                       : "Dili değiştir",
    "LANGUAGE_MESSAGE"                     : "Lütfen aşağıdaki dillerden istediğiniz dili seçin:",
    "LANGUAGE_SUBMIT"                      : "{APP_NAME} Yenile",
    "LANGUAGE_CANCEL"                      : "İptal",
    
    // extensions/default/JSLint
    "CMD_JSLINT"                           : "JSLint Aç",
    "JSLINT_ERRORS"                        : "JSLint Hataları",
    "JSLINT_ERROR_INFORMATION"             : "1 JSLint Hatası",
    "JSLINT_ERRORS_INFORMATION"            : "{0} JSLint Hatası",
    "JSLINT_NO_ERRORS"                     : "JSLint hatası bulunamadı - Mükemmel!",
    "JSLINT_DISABLED"                      : "JSLint kapalı veya şuan ki dosyada kullanılamıyor",

    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Tanıma Atla",
    "CMD_SHOW_PARAMETER_HINT"                   : "Parametre İpuçlarını Göster",
    "NO_ARGUMENTS"                              : "<parametre yok>"

});
