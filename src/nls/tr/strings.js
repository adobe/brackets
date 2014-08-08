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
    "GENERIC_ERROR"                             : "(hata {0})",
    "NOT_FOUND_ERR"                             : "Dosya bulunamadı.",
    "NOT_READABLE_ERR"                          : "Dosya okunamadı.",
    "NO_MODIFICATION_ALLOWED_ERR"               : "Klasörde değişiklik yapılamıyor.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"          : "Dosya değişikliği için izniniz yok.",
    "CONTENTS_MODIFIED_ERR"                     : "Dosya {APP_NAME} dışında modifiye edilmiştir.",
    "UNSUPPORTED_ENCODING_ERR"                  : "{APP_NAME} şu anda sadece UTF-8 ile kodlanmış metin dosyaları destekler.",
    "FILE_EXISTS_ERR"                           : "Dosya bulunmaktadır.",
    "FILE"                                      : "dosya",
    "FILE_TITLE"                                : "Dosya",
    "DIRECTORY"                                 : "klasör",
    "DIRECTORY_TITLE"                           : "Klasör",
    "DIRECTORY_NAMES_LEDE"                      : "Klasör adları",
    "FILENAMES_LEDE"                            : "Dosya adları",
    "FILENAME"                                  : "Dosyadı",
    "DIRECTORY_NAME"                            : "Klasör Adı",


    // Project error strings
    "ERROR_LOADING_PROJECT"                     : "Proje yüklenirken hata",
    "OPEN_DIALOG_ERROR"                         : "Dosya dialogu gösterilirken hata meydana geldi. (hata {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"          : "<span class='dialog-filename'>{0}</span> klasörü yüklenirken hata meydana geldi. (hata {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"              : "<span class='dialog-filename'>{0}</span> klasörü okunurken hata meydana geldi. (hata {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"                  : "Dosya açılırken hata",
    "ERROR_OPENING_FILE"                        : "<span class='dialog-filename'>{0}</span> dosyası açılırken hata meydana geldi. {1}",
    "ERROR_OPENING_FILES"                       : "Aşağıdaki dosyaları açmaya çalışırken bir hata oluştu:",
    "ERROR_RELOADING_FILE_TITLE"                : "Değişiklikler hafızadan okunurken hata oluştu.",
    "ERROR_RELOADING_FILE"                      : "<span class='dialog-filename'>{0}</span> dosyası yenilenirken hata meydana geldi. {1}",
    "ERROR_SAVING_FILE_TITLE"                   : "Dosya kaydedilirken hata",
    "ERROR_SAVING_FILE"                         : "<span class='dialog-filename'>{0}</span> dosyası kaydedilirken hata meydana geldi. {1}",
    "ERROR_RENAMING_FILE_TITLE"                 : "Dosya ismi değiştirilirken hata",
    "ERROR_RENAMING_FILE"                       : "<span class='dialog-filename'>{0}</span> dosyasının ismi değiştirilirken hata meydana geldi. {1}",
    "ERROR_DELETING_FILE_TITLE"                 : "Dosya silme hatası",
    "ERROR_DELETING_FILE"                       : "<span class='dialog-filename'>{0}</span> dosyayı silmeyi denerken bir hata oluştu. {1}",
    "INVALID_FILENAME_TITLE"                    : "Hatalı dosya ismi",
    "INVALID_FILENAME_MESSAGE"                  : "Dosya isimleri yandaki karakterleri bulunduramaz: {0}",
    "ENTRY_WITH_SAME_NAME_EXISTS"               : "Bir dosya veya dizin adı <span class='dialog-filename'>{0}</span> zaten var.",
    "ERROR_CREATING_FILE_TITLE"                 : "Dosya yaratılırken hata",
    "ERROR_CREATING_FILE"                       : "<span class='dialog-filename'>{0}</span> dosyası yaratılırken hata meydana geldi. {1}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"                 : "Tercihleri okuma hatası",
    "ERROR_PREFS_CORRUPT"                       : "JSON tercih dosyası geçerli değil. Dosya biçimini düzelttiğinde açılacaktır. {APP_NAME} değişikliklerin geçerli olabilmesi için uygulamayı yeniden başlatın.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"                    : "Hoop! {APP_NAME} programı şuan tarayıcıda açılmadı.",
    "ERROR_IN_BROWSER"                          : "{APP_NAME} HTML olarak hazırlandı, ancak şuan için masaüstünde çalışabilmekte. Bu nedenle makinanızda bulunan dosyalarda değişiklik için kullanabilirsiniz. {APP_NAME} programını çalıştırabilmek için lütfen <b>github.com/adobe/brackets-shell</b> adresindeki 'application shell'i kullanınız.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"                     : "Dosyalar indekslenirken hata",
    "ERROR_MAX_FILES"                           : "Maksimum sayıda dosya indekslendi. Indekslenen dosyalardaki işlemler düzgün çalışmayabilir.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"             : "Tarayıcı çalıştırılırken hata",
    "ERROR_CANT_FIND_CHROME"                    : "Google Chrome tarayıcısı bulunamadı. Lütfen kurulu olduğundan emin olun.",
    "ERROR_LAUNCHING_BROWSER"                   : "Tarayıcı açılırken hata meydana geldi. (hata {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"              : "Canlı Önizleme Hatası",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"           : "Tarayıcıya bağlanılıyor",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"            : "Canlı önizleme özelliğini kullanabilmek için uzaktan hata ayıklayıcı ile Chrome'un tekrardan açılması gerekiyor.<br /><br />Chrome'u uzaktan hata ayıklayıcı ile tekrardan açılmasını ister misiniz?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"            : "Canlı önizleme sayfası yüklenemiyor",
    "LIVE_DEV_NEED_HTML_MESSAGE"                : "Canlı önizlemeyi çalıştırabilmeniz için html dosyası açmanız gerekiyor",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"             : "Canlı Önizlemeyi server-side dosyalarınız ile açmak istiyorsanız, lütfen bu proje için kullanılabilir bir link belirtiniz.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE"         : "Canlı önizleme için HTTP sunucusu başlatılamıyor. Lütfen tekrar deneyiniz.",
    "LIVE_DEVELOPMENT_INFO_TITLE"               : "Canlı Önizlemeye Hoşgeldiniz!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"             : "Canlı önizleme için {APP_NAME} programı tarayıcınıza bağlanıyor ve sizin HTML dosyanızın örnek görüntüsünü tarayıcınızda açıyor. Sonrasında ise değişiklik yaptığınız sayfayı anında tarayıcıda yenileyerek gösteriyor.<br /><br />{APP_NAME} programının bu versiyonunda, Canlı önizleme özelliği sadece <strong>CSS dosyaları</strong> değişikliğine izin veriyor ve sadece <strong>Google Chrome</strong> üzerinde çalışıyor. Yakında HTML ve Javascript değişikliğini de ekleyeceğiz!<br /><br />(Bu mesaj sadece tek sefer gösterilecektir.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"          : "Detaylı bilgi için lütfen <a href='{0}' title='{0}'>Troubleshooting Live Development connection errors</a> sayfasına bakınız.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED"         : "Canlı Önizleme",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"             : "Canlı Önizleme: Bağlanılıyor\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"             : "Canlı Önizleme: Başlıyor\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"             : "Canlı Önizleme'den Çık",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"           : "Canlı Önizleme: Kapatmak için tıklayın (yenilemek için dosyayı kaydedin)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"            : "Canlı Önizleme (sözdizimi hatası nedeniyle güncellenemedi)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS"  : "Geliştirici araçları açıldığı için canlı önizleme iptal edildi",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"           : "Tarayıcı sayfası kapatıldğı için canlı önizleme iptal edildi",
    "LIVE_DEV_NAVIGATED_AWAY"                   : "Projede yer almayan bir dosya açıldığı için canlı önizleme iptal edildi",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"            : "Bilinmeyen bir denenden dolayı canlı önizleme iptal edildi ({0})",

    "SAVE_CLOSE_TITLE"                          : "Değişiklikleri kaydet",
    "SAVE_CLOSE_MESSAGE"                        : "<span class='dialog-filename'>{0}</span> dosyasında yaptığınız değişiklikleri kaydetmek istiyor musunuz?",
    "SAVE_CLOSE_MULTI_MESSAGE"                  : "Dosyalardaki değişiklikleri kaydetmek istiyor musunuz?",
    "EXT_MODIFIED_TITLE"                        : "Harici değişiklikler",
    "CONFIRM_FOLDER_DELETE_TITLE"               : "Silmeyi Onayla",
    "CONFIRM_FOLDER_DELETE"                     : "<span class='dialog-filename'>{0}</span> klasörü silmek istediğinizden emin misiniz??",
    "FILE_DELETED_TITLE"                        : "Dosya Silindi",
    "EXT_MODIFIED_WARNING"                      : "<span class='dialog-filename'>{0}</span> değiştirildi.<br /><br />Bu değişikliklerin üzerine yazmak istiyor musunuz?",
    "EXT_MODIFIED_MESSAGE"                      : "<span class='dialog-filename'>{0}</span> dosyası dışarıdan değiştirildi ama {APP_NAME} programında kaydetmediğiniz değişiklikler bulunmakta.<br /><br />Hangi versiyonun kalmasını istiyorsunuz?",
    "EXT_DELETED_MESSAGE"                       : "<span class='dialog-filename'>{0}</span> dosyası hafızadan silindi ama {APP_NAME} programında kaydetmediğiniz değişiklikler bulunmakta.<br /><br />Değişikliklerin kalmasını istiyor musunuz?",

    // Generic dialog/button labels
    "DONE"                                      : "Bitti",
    "OK"                                        : "TAMAM",
    "CANCEL"                                    : "Vazgeç",
    "DONT_SAVE"                                 : "Kaydetme",
    "SAVE"                                      : "Kaydet",
    "SAVE_AS"                                   : "Farklı kaydet\u2026",
    "SAVE_AND_OVERWRITE"                        : "Üstüne yaz",
    "DELETE"                                    : "Sil",
    "BUTTON_YES"                                : "Evet",
    "BUTTON_NO"                                 : "Hayır",

    // Find, Replace, Find in Files
    "FIND_RESULT_COUNT"                         : "{0} sonuçlar",
    "FIND_RESULT_COUNT_SINGLE"                  : "1 sonuç",
    "FIND_NO_RESULTS"                           : "Sonuç Yok",
    "FIND_QUERY_PLACEHOLDER"                    : "Bul\u2026",
    "REPLACE_PLACEHOLDER"                       : "ile değiştir\u2026",
    "BUTTON_REPLACE_ALL"                        : "Toplu\u2026",
    "BUTTON_REPLACE_ALL_IN_FILES"               : "Değiştir\u2026",
    "BUTTON_REPLACE"                            : "Değiştir",
    "BUTTON_NEXT"                               : "\u25B6",
    "BUTTON_PREV"                               : "\u25C0",
    "BUTTON_NEXT_HINT"                          : "Sonraki",
    "BUTTON_PREV_HINT"                          : "Önceki",
    "BUTTON_CASESENSITIVE_HINT"                 : "Büyük/Küçük Harf Duyarlı",
    "BUTTON_REGEXP_HINT"                        : "Düzenli İfade(Regex)",
    "REPLACE_WITHOUT_UNDO_WARNING_TITLE"        : "Geri al",
    "REPLACE_WITHOUT_UNDO_WARNING"              : "Because more than {0} files need to be changed, {APP_NAME} will modify unopened files on disk.<br />You won't be able to undo replacements in those files.",
    "BUTTON_REPLACE_WITHOUT_UNDO"               : "Geri al",

    "OPEN_FILE"                                 : "Dosya Aç",
    "SAVE_FILE_AS"                              : "Dosyayı kaydet",
    "CHOOSE_FOLDER"                             : "Klasör Seç",

    "RELEASE_NOTES"                             : "Yeni Versiyon Bilgileri",
    "NO_UPDATE_TITLE"                           : "En son versiyon!",
    "NO_UPDATE_MESSAGE"                         : "{APP_NAME} programının en son versiyonunu kullanıyorsunuz.",

    // Find and Replace
    "FIND_REPLACE_TITLE_LABEL"                  : "Değiştir",
    "FIND_REPLACE_TITLE_WITH"                   : "İle",
    "FIND_TITLE_LABEL"                          : "Bulundu",
    "FIND_TITLE_SUMMARY"                        : " &mdash; {0} {1} {2} içinde {3}",

    // Find in Files
    "FIND_NUM_FILES"                            : "{0} {1}",
    "FIND_IN_FILES_SCOPED"                      : "<span class='dialog-filename'>{0}</span> dosyası içinde",
    "FIND_IN_FILES_NO_SCOPE"                    : "projede",
    "FIND_IN_FILES_ZERO_FILES"                  : "Filtre hariç tüm dosyalar {0}",
    "FIND_IN_FILES_FILE"                        : "dosya",
    "FIND_IN_FILES_FILES"                       : "dosyalar",
    "FIND_IN_FILES_MATCH"                       : "bulunan",
    "FIND_IN_FILES_MATCHES"                     : "bulunanlar",
    "FIND_IN_FILES_MORE_THAN"                   : "Daha fazla ",
    "FIND_IN_FILES_PAGING"                      : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"                   : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"             : "Tümünü genişletmek/daraltmak için Ctrl/Cmd tıklayın",
    "REPLACE_IN_FILES_ERRORS_TITLE"             : "Hataları değiştir",
    "REPLACE_IN_FILES_ERRORS"                   : "Aşağıdaki dosyalar aramadan sonra değişti.",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"          : "Versiyon bilgisi alınırken hata",
    "ERROR_FETCHING_UPDATE_INFO_MSG"            : "Sunucudan yeni versiyon bilgisi alınırken hata oluştu. Lütfen internete bağlı olduğunuzdan emin olun ve tekrar deneyin.",

    // File exclusion filters
    "NEW_FILE_FILTER"                           : "Yeni hariç bırakma seti\u2026",
    "CLEAR_FILE_FILTER"                         : "Dosyaları hariç bırakma",
    "NO_FILE_FILTER"                            : "Hariç Tutulan Dosya",
    "EXCLUDE_FILE_FILTER"                       : "Hariç tut {0}",
    "EDIT_FILE_FILTER"                          : "Düzenle\u2026",
    "FILE_FILTER_DIALOG"                        : "Hariç Bırakma Setini Düzenle",
    "FILE_FILTER_INSTRUCTIONS"                  : "Exclude files and folders matching any of the following strings / substrings or <a href='{0}' title='{0}'>wildcards</a>. Enter each string on a new line.",
    "FILTER_NAME_PLACEHOLDER"                   : "Name this exclusion set (optional)",
    "FILE_FILTER_CLIPPED_SUFFIX"                : "and {0} more",
    "FILTER_COUNTING_FILES"                     : "Counting files\u2026",
    "FILTER_FILE_COUNT"                         : "Allows {0} of {1} files {2}",
    "FILTER_FILE_COUNT_ALL"                     : "Allows all {0} files {1}",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"       : "No Quick Edit available for current cursor position",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES"         : "CSS Quick Edit: place cursor on a single class name",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"          : "CSS Quick Edit: incomplete class attribute",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"             : "CSS Quick Edit: incomplete id attribute",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"        : "CSS Quick Edit: place cursor in tag, class, or id",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"       : "CSS Timing Function Quick Edit: invalid syntax",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"        : "JS Quick Edit: place cursor in function name",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"       : "No Quick Docs available for current cursor position",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"                           : "Proje Yükleniyor\u2026",
    "UNTITLED"                                  : "Adsız",
    "WORKING_FILES"                             : "Çalışılan Dosyalar",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"                             : "Ctrl",
    "KEYBOARD_SHIFT"                            : "Shift",
    "KEYBOARD_SPACE"                            : "Boşluk",

    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Satır {0}, Kolon {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 Seçilen {0} sütun",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 Seçilen {0} sütunlar",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 Seçilen {0} satır",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 Seçilen {0} satırlar",
    "STATUSBAR_SELECTION_MULTIPLE"          : " \u2014 {0} seçimler",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Girintiyi boşluk karakterleriyle değiştirmek için tıklayın",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Girintiyi tab karakterleriyle değiştirmek için tıklayın",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Girintide kullanılacak boşluk sayısını değiştirmek için tıklayın",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Tab karakter genişliğini değiştirmek için tıklayın",
    "STATUSBAR_SPACES"                      : "Boşluk",
    "STATUSBAR_TAB_SIZE"                    : "Tab Boyutu",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} Line",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} Lines",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Uzantı Pasif",
    "STATUSBAR_INSERT"                      : "EKL",
    "STATUSBAR_OVERWRITE"                   : "ÜSY",
    "STATUSBAR_INSOVR_TOOLTIP"              : "Click to toggle cursor between Insert (INS) and Overwrite (OVR) modes",
    "STATUSBAR_LANG_TOOLTIP"                : "Click to change file type",
    "STATUSBAR_CODE_INSPECTION_TOOLTIP"     : "{0}. Click to toggle report panel.",
    "STATUSBAR_DEFAULT_LANG"                : "(default)",
    "STATUSBAR_SET_DEFAULT_LANG"            : "Set as Default for .{0} Files",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} Sorun",
    "SINGLE_ERROR"                          : "1 {0} Sorun",
    "MULTIPLE_ERRORS"                       : "{1} {0} Sorun",
    "NO_ERRORS"                             : "{0} sorun bulunamadı - iyi iş!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Sorun bulunamadı - iyi iş!",
    "LINT_DISABLED"                         : "Lintleme pasif",
    "NO_LINT_AVAILABLE"                     : "{0} için lint yok.",
    "NOTHING_TO_LINT"                       : "Lint yok",
    "LINTER_TIMED_OUT"                      : "{0} {1} ms bekledikten sonra zaman aşımına uğradı",
    "LINTER_FAILED"                         : "{0} hatayla sonlandırıldı: {1}",
                

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                             : "Dosya",
    "CMD_FILE_NEW_UNTITLED"                 : "Yeni",
    "CMD_FILE_NEW"                          : "Yeni Dosya",
    "CMD_FILE_NEW_FOLDER"                   : "Yeni Klasör",
    "CMD_FILE_OPEN"                         : "Aç\u2026",
    "CMD_ADD_TO_WORKING_SET"                : "Çalışma Ekranına Ekle",
    "CMD_OPEN_DROPPED_FILES"                : "Sürüklenen Dosyaları Aç",
    "CMD_OPEN_FOLDER"                       : "Klasörü Aç\u2026",
    "CMD_FILE_CLOSE"                        : "Kapat",
    "CMD_FILE_CLOSE_ALL"                    : "Hepsini Kapat",
    "CMD_FILE_CLOSE_LIST"                   : "Listeyi Kapat",
    "CMD_FILE_CLOSE_OTHERS"                 : "Diğerlerini Kapat",
    "CMD_FILE_CLOSE_ABOVE"                  : "Yıkarıdakileri Kapat",
    "CMD_FILE_CLOSE_BELOW"                  : "Aşağıdakileri Kapat",
    "CMD_FILE_SAVE"                         : "Kaydet",
    "CMD_FILE_SAVE_ALL"                     : "Hepsini Kaydet",
    "CMD_FILE_SAVE_AS"                      : "Farklı Kaydet\u2026",
    "CMD_LIVE_FILE_PREVIEW"                 : "Canlı Önizleme",
    "CMD_RELOAD_LIVE_PREVIEW"               : "Canlı Önizlemeyi Yeniden Başlamaya Zorla",
    "CMD_PROJECT_SETTINGS"                  : "Proje Ayarları\u2026",
    "CMD_FILE_RENAME"                       : "Yeniden Adlandır",
    "CMD_FILE_DELETE"                       : "Sil",
    "CMD_INSTALL_EXTENSION"                 : "Uzantı Yükle\u2026",
    "CMD_EXTENSION_MANAGER"                 : "Uzantı Yöneticisi\u2026",
    "CMD_FILE_REFRESH"                      : "Dosya Ağacını Yenile",
    "CMD_QUIT"                              : "Çık",
    // Used in native File menu on Windows
    "CMD_EXIT"                              : "Exit",
       
    // Edit menu commands
    "EDIT_MENU"                             : "Düzen",
    "CMD_UNDO"                              : "Geri al",
    "CMD_REDO"                              : "İleri al",
    "CMD_CUT"                               : "Kes",
    "CMD_COPY"                              : "Kopyala",
    "CMD_PASTE"                             : "Yapıştır",
    "CMD_SELECT_ALL"                        : "Tümünü Seç",
    "CMD_SELECT_LINE"                       : "Satır seç",
    "CMD_SPLIT_SEL_INTO_LINES"              : "Split Selection into Lines",
    "CMD_ADD_CUR_TO_NEXT_LINE"              : "Add Cursor to Next Line",
    "CMD_ADD_CUR_TO_PREV_LINE"              : "Add Cursor to Previous Line",
    "CMD_INDENT"                            : "Girinti",
    "CMD_UNINDENT"                          : "Girinti Kaldır",
    "CMD_DUPLICATE"                         : "Çoğalt",
    "CMD_DELETE_LINES"                      : "Satır Sil",
    "CMD_COMMENT"                           : "Toggle Line Comment",
    "CMD_BLOCK_COMMENT"                     : "Blok Yorumu Genişlet",
    "CMD_LINE_UP"                           : "Yukarı Taşı",
    "CMD_LINE_DOWN"                         : "Aşağıya Taşı",
    "CMD_OPEN_LINE_ABOVE"                   : "Open Line Above",
    "CMD_OPEN_LINE_BELOW"                   : "Open Line Below",
    "CMD_TOGGLE_CLOSE_BRACKETS"             : "Parantezi Otomatik Kapat",
    "CMD_SHOW_CODE_HINTS"                   : "Kod İpuçlarını Göster",
    
    // Search menu commands
    "FIND_MENU"                             : "Bul",
    "CMD_FIND"                              : "Bul",
    "CMD_FIND_NEXT"                         : "Sonrakini Bul",
    "CMD_FIND_PREVIOUS"                     : "Öncekini Bul",
    "CMD_FIND_ALL_AND_SELECT"               : "Hepsini Bul ve Seç",
    "CMD_ADD_NEXT_MATCH"                    : "Sonraki Eşleşmeyi Seçime Ekle",
    "CMD_SKIP_CURRENT_MATCH"                : "Atla ve Sonraki Eşleşmeyi Ekle",
    "CMD_FIND_IN_FILES"                     : "Dosyalarda Bul",
    "CMD_FIND_IN_SELECTED"                  : "Seçili dosya/klasörlerde bul",
    "CMD_FIND_IN_SUBTREE"                   : "Bul\u2026",
    "CMD_REPLACE"                           : "Kaldır",
    "CMD_REPLACE_IN_FILES"                  : "Dosyalarda Değiştir",
    "CMD_REPLACE_IN_SELECTED"               : "Dosya/Klasörlerde Değiştir",
    "CMD_REPLACE_IN_SUBTREE"                : "Değiştir\u2026",

    // View menu commands
    "VIEW_MENU"                             : "Göster",
    "CMD_HIDE_SIDEBAR"                      : "Kenar Çubuğunu Gizle",
    "CMD_SHOW_SIDEBAR"                      : "Kenar Çubuğunu Göster",
    "CMD_INCREASE_FONT_SIZE"                : "Font Boyutunu Büyült",
    "CMD_DECREASE_FONT_SIZE"                : "Font Boyutunu Küçült",
    "CMD_RESTORE_FONT_SIZE"                 : "Font Boyutunu Sıfırla",
    "CMD_SCROLL_LINE_UP"                    : "Yukarı Kaydır",
    "CMD_SCROLL_LINE_DOWN"                  : "Aşağıya Kaydır",
    "CMD_TOGGLE_LINE_NUMBERS"               : "Satır Numaraları",
    "CMD_TOGGLE_ACTIVE_LINE"                : "Aktif Satırı Vurgula",
    "CMD_TOGGLE_WORD_WRAP"                  : "Sözcük Kaydırma",
    "CMD_LIVE_HIGHLIGHT"                    : "Canlı Önizleme Vurgulayın",
    "CMD_VIEW_TOGGLE_INSPECTION"            : "Lint Dosyalarını Kaydet",
    "CMD_SORT_WORKINGSET_BY_ADDED"          : "Eklenmeye Göre Sırala",
    "CMD_SORT_WORKINGSET_BY_NAME"           : "İsme Göre Sırala",
    "CMD_SORT_WORKINGSET_BY_TYPE"           : "Türüne Göre Sırala",
    "CMD_SORT_WORKINGSET_AUTO"              : "Otomatik Sırala",
    "CMD_THEMES"                            : "Temalar\u2026",

    // Navigate menu Commands
    "NAVIGATE_MENU"                         : "Git",
    "CMD_QUICK_OPEN"                        : "Hızlı Aç",
    "CMD_GOTO_LINE"                         : "Satıra Git",
    "CMD_GOTO_DEFINITION"                   : "Tanıma Git",
    "CMD_TOGGLE_QUICK_EDIT"                 : "Hızlı Düzenle",
    "CMD_QUICK_EDIT_PREV_MATCH"             : "Önceki Eşleşme",
    "CMD_GOTO_FIRST_PROBLEM"                : "İlk Hata veya Uyarıya Git",
    "CMD_QUICK_EDIT_NEXT_MATCH"             : "Sonraki Eşleşme",
    "CMD_TOGGLE_QUICK_DOCS"                 : "Hızlı Erişim Dökümanları",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"           : "Yeni Kural",
    "CMD_NEXT_DOC"                          : "Sonraki Dosya",
    "CMD_PREV_DOC"                          : "Önceki Dosya",
    "CMD_SHOW_IN_TREE"                      : "Dosya Listesinde Göster",
    "CMD_SHOW_IN_EXPLORER"                  : "Explorer'da göster",
    "CMD_SHOW_IN_FINDER"                    : "Aramada göster",
    "CMD_SHOW_IN_OS"                        : "Bulunduğu Konumu Aç",

    // Help menu commands
    "HELP_MENU"                             : "Yardım",
    "CMD_HOW_TO_USE_BRACKETS"               : "{APP_NAME} Nasıl Kullanılır",
    "CMD_SUPPORT"                           : "{APP_NAME} Desteği",
    "CMD_SUGGEST"                           : "Yeni Özellik Öner",
    "CMD_RELEASE_NOTES"                     : "Sürüm Notları",
    "CMD_GET_INVOLVED"                      : "Projeye Dahil Ol",
    "CMD_SHOW_EXTENSIONS_FOLDER"            : "Uzantı Klasörünü Göster",
    "CMD_TWITTER"                           : "{TWITTER_NAME} Twitter'da...",
    "CMD_CHECK_FOR_UPDATE"                  : "Yeni Versiyon Kontrol Et",
    "CMD_ABOUT"                             : "{APP_TITLE} Hakkında",
    "CMD_FORUM"                             : "{APP_NAME} Forum",
    "CMD_OPEN_PREFERENCES"                  : "Ayarlar Dosyasını Aç",
            
    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                    : "Deneysel Sürüm",
    "DEVELOPMENT_BUILD"                     : "geliştirme derlemesi",
    "RELOAD_FROM_DISK"                      : "Hafızadan Yenile",
    "KEEP_CHANGES_IN_EDITOR"                : "Değişiklikleri Editörde Tut",
    "CLOSE_DONT_SAVE"                       : "Kapat (Kaydetme)",
    "RELAUNCH_CHROME"                       : "Chrome'u Tekrar Aç",
    "ABOUT"                                 : "Hakkında",
    "CLOSE"                                 : "Kapat",
    "ABOUT_TEXT_LINE1"                      : "sprint 14 test sürümü",
    "ABOUT_TEXT_BUILD_TIMESTAMP"            : "derleme zamandamgası: ",
    "ABOUT_TEXT_LINE3"                      : "Üçüncü parti yazılımlara ilişkin bildirimler, şartlar ve koşullar <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> adresinde bulunmaktadır ve bu adreste referans olarak dahil edilmiştir",
    "ABOUT_TEXT_LINE4"                      : "Döküman ve kodlar için <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a> adresine bakabilirsiniz.",
    "ABOUT_TEXT_LINE5"                      : "Made with \u2764 and JavaScript by:",
    "ABOUT_TEXT_LINE6"                      : "Lots of people (but we're having trouble loading that data right now).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"          : "Web Platform Docs and the Web Platform graphical logo are licensed under a Creative Commons Attribution license, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"           : "{APP_NAME} programının yeni versiyonu bulunmakta! Detaylar için tıklayın.",
    "UPDATE_AVAILABLE_TITLE"                : "Yeni versiyon hazır",
    "UPDATE_MESSAGE"                        : "Hey, {APP_NAME} programının yeni versiyonu hazır. İşte bazı yeni özellikler:",
    "GET_IT_NOW"                            : "Şimdi Yükle!",
    "PROJECT_SETTINGS_TITLE"                : "{0} için Proje Ayarları",
    "PROJECT_SETTING_BASE_URL"              : "Ana URL'den Canlı Önizleme",
    "PROJECT_SETTING_BASE_URL_HINT"         : "(dosya urlsi için boş bırakın)",
    "BASEURL_ERROR_INVALID_PROTOCOL"        : "{0} protokolü canlı önizlemeyi desteklemiyor.&mdash;lütfen http: or https: kullanın.",
    "BASEURL_ERROR_SEARCH_DISALLOWED"       : "Ana URL \"{0}\" gibi arama karakterleri bulunduramaz.",
    "BASEURL_ERROR_HASH_DISALLOWED"         : "Ana URL \"{0}\" gibi karakterler bulunduramaz.",
    "BASEURL_ERROR_INVALID_CHAR"            : "'{0}' gibi özel karakterler %-kodlanması gerekiyor.",
    "BASEURL_ERROR_UNKNOWN_ERROR"           : "Ana URL'yi işlerken bilinmeyen hata",
    
    // Strings for themes-settings.html and themes-general.html
    "CURRENT_THEME"                        : "Kullanılan Tema",
    "USE_THEME_SCROLLBARS"                 : "Temada kaydırma çubuklarını kullan",
    "FONT_SIZE"                            : "Yazı tipi Boyutu",
    "FONT_FAMILY"                          : "Yazı tipi Ailesi",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                       : "Yeni Kural",
 
    // Extension Management strings
    "INSTALL"                               : "Yükle",
    "UPDATE"                                : "Güncelle",
    "REMOVE"                                : "Kaldır",
    "OVERWRITE"                             : "Üstüne yaz",
    "CANT_REMOVE_DEV"                       : "\"dev\" klasöründeki uzantıların manuel silinmesi gerekiyor.",
    "CANT_UPDATE"                           : "Güncelleştirme {APP_NAME} bu sürümü ile uyumlu değildir.",
    "CANT_UPDATE_DEV"                       : "\"dev\" klasöründeki uzantılar güncelleştirilemedi.",
    "INSTALL_EXTENSION_TITLE"               : "Uzantı Yükle",
    "UPDATE_EXTENSION_TITLE"                : "Uzantı Güncelle",
    "INSTALL_EXTENSION_LABEL"               : "Uzantı URL'si",
    "INSTALL_EXTENSION_HINT"                : "Uzantısının zip dosyası ya da GitHub repo URL'si",
    "INSTALLING_FROM"                       : "{0} uzantısı yükleme\u2026",
    "INSTALL_SUCCEEDED"                     : "Yükleme başarılı!",
    "INSTALL_FAILED"                        : "Yükleme başarısız",
    "CANCELING_INSTALL"                     : "İptal\u2026",
    "CANCELING_HUNG"                        : "Uzun zaman aldığı için yükleme iptal ediliyor. Bir iç hata oluşmuş olabilir.",
    "INSTALL_CANCELED"                      : "Kurulum iptal edildi.",
    "VIEW_COMPLETE_DESCRIPTION"             : "Tam açıklamasını görüntüleyin",
    "VIEW_TRUNCATED_DESCRIPTION"            : "Özet açıklamayı görüntüleyin",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                      : "İndirilen içerik geçerli bir zip dosyası değil.",
    "INVALID_PACKAGE_JSON"                  : "package.json dosyası geçerli değil (hata oldu: {0}).",
    "MISSING_PACKAGE_NAME"                  : "package.json dosyasında paket adı geçerli değil.",
    "BAD_PACKAGE_NAME"                      : "{0} geçersiz paket adı.",
    "MISSING_PACKAGE_VERSION"               : "package.json dosyasında sürüm numarası geçerli değil.",
    "INVALID_VERSION_NUMBER"                : "({0}) paket sürüm numarası geçersiz.",
    "INVALID_BRACKETS_VERSION"              : "{APP_NAME} uyumluluk dize ({0}) geçersiz.",
    "DISALLOWED_WORDS"                      : "{0} alanı kelimeler ({1}) izin verilmez.",
    "API_NOT_COMPATIBLE"                    : "The extension isn't compatible with this version of {APP_NAME}. It's installed in your disabled extensions folder.",
    "MISSING_MAIN"                          : "main.js dosyası paket içinde bulunmuyor.",
    "EXTENSION_ALREADY_INSTALLED"           : "Installing this package will overwrite a previously installed extension. Overwrite the old extension?",
    "EXTENSION_SAME_VERSION"                : "This package is the same version as the one that is currently installed. Overwrite the existing installation?",
    "EXTENSION_OLDER_VERSION"               : "This package is version {0} which is older than the currently installed ({1}). Overwrite the existing installation?",
    "DOWNLOAD_ID_IN_USE"                    : "İç hata: indirme kimliği zaten kullanımda.",
    "NO_SERVER_RESPONSE"                    : "Sunucuya bağlanamıyor.",
    "BAD_HTTP_STATUS"                       : "Dosya (HTTP {0}) sunucuda bulunamadı.",
    "CANNOT_WRITE_TEMP"                     : "İndirililen geçici dosya kaydedilemedi.",
    "ERROR_LOADING"                         : "Uzantı başlatılırken bir hatayla karşılaşıldı.",
    "MALFORMED_URL"                         : "URL geçersiz. Doğru girdiğinizden emin olun.",
    "UNSUPPORTED_PROTOCOL"                  : "URL http veya https URL olmalıdır.",
    "UNKNOWN_ERROR"                         : "Bilinmeyen iç hata.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"               : "Uzantı Yöneticisi",
    "EXTENSION_MANAGER_ERROR_LOAD"          : "Uzantı kayıtlarına erişilemiyor. Daha sonra tekrar deneyin.",
    "INSTALL_EXTENSION_DRAG"                : ".zip dosyasını buraya sürükle",
    "INSTALL_EXTENSION_DROP"                : "yüklemek için .zip dosyasını buraya bırak",
    "INSTALL_EXTENSION_DROP_ERROR"          : "Aşağıdaki hatalar nedeniyle yüklenemedi/güncellenemedi",
    "INSTALL_FROM_URL"                      : "URL'den yükleyin\u2026",
    "INSTALL_EXTENSION_VALIDATING"          : "Doğrulanıyor\u2026",
    "EXTENSION_AUTHOR"                      : "Geliştirici",
    "EXTENSION_DATE"                        : "Tarih",
    "EXTENSION_INCOMPATIBLE_NEWER"          : "Bu uzantı {APP_NAME} yeni bir sürümünü gerektiriyor.",
    "EXTENSION_INCOMPATIBLE_OLDER"          : "Bu uzantı şu anda sadece {APP_NAME} eski sürümleri ile çalışır.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"   : "Version {0} of this extension requires a newer version of {APP_NAME}. But you can install the earlier version {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"   : "Version {0} of this extension only works with older versions of {APP_NAME}. But you can install the earlier version {1}.",
    "EXTENSION_NO_DESCRIPTION"              : "Açıklama yok",
    "EXTENSION_MORE_INFO"                   : "Daha fazla bilgi...",
    "EXTENSION_ERROR"                       : "Uzantı Hatası",
    "EXTENSION_KEYWORDS"                    : "Anahtar kelimeler",
    "EXTENSION_TRANSLATED_USER_LANG"        : "{0} dilleri dahil, seninki çevrilmiştir.",
    "EXTENSION_TRANSLATED_GENERAL"          : "{0} dile çevrilmiş",
    "EXTENSION_TRANSLATED_LANGS"            : "Bu uzantı, bu dilde tercüme edilmiştir: {0}",
    "EXTENSION_INSTALLED"                   : "Yüklendi",
    "EXTENSION_UPDATE_INSTALLED"            : "Bu uzantı güncellemesi indirildi. {APP_NAME} yeniden başlatıldığında etkinleştirilecek.",
    "EXTENSION_SEARCH_PLACEHOLDER"          : "Ara",
    "EXTENSION_MORE_INFO_LINK"              : "Devamı",
    "BROWSE_EXTENSIONS"                     : "Uzantılara Gözat",
    "EXTENSION_MANAGER_REMOVE"              : "Uzantıyı Kaldır",
    "EXTENSION_MANAGER_REMOVE_ERROR"        : "Bir veya daha fazla uzantılar kaldırmak için açılamıyor: {0}. {APP_NAME} yeniden başlatın.",
    "EXTENSION_MANAGER_UPDATE"              : "Uzantıyı Güncelle",
    "EXTENSION_MANAGER_UPDATE_ERROR"        : "Bir veya daha fazla uzantılar güncelleştirilemiyor: {0}. {APP_NAME} yeniden başlatın.",
    "MARKED_FOR_REMOVAL"                    : "Kaldırma için işaretlenmiş",
    "UNDO_REMOVE"                           : "Geri al",
    "MARKED_FOR_UPDATE"                     : "Güncelleme için işaretlenmiş",
    "UNDO_UPDATE"                           : "Geri al",
    "CHANGE_AND_RELOAD_TITLE"               : "Uzantıları değiştirin",
    "CHANGE_AND_RELOAD_MESSAGE"             : "To update or remove the marked extensions, {APP_NAME} will need to reload. You'll be prompted to save unsaved changes.",
    "REMOVE_AND_RELOAD"                     : "Uzantıları kaldır ve yeniden başlat",
    "CHANGE_AND_RELOAD"                     : "Uzantıları değiştir ve yeniden başlat",
    "UPDATE_AND_RELOAD"                     : "Uzantıları güncelle ve yeniden başlat",
    "PROCESSING_EXTENSIONS"                 : "Uzantı değiştirme devam ediyor\u2026",
    "EXTENSION_NOT_INSTALLED"               : "{0} uzantı yüklü olmadığı için kaldıralamadı.",
    "NO_EXTENSIONS"                         : "Yüklü uzantı bulunmuyor. <br> Uzantıları görmek için Mevcut tabına tıklayın.",
    "NO_EXTENSION_MATCHES"                  : "Aramayla eşleşen uzantı yok",
    "REGISTRY_SANITY_CHECK_WARNING"         : "Bilinmeyen bir kaynaktan uzantı yüklerken dikkali olun.",
    "EXTENSIONS_INSTALLED_TITLE"            : "Yüklendi",
    "EXTENSIONS_AVAILABLE_TITLE"            : "Mevcut",
    "EXTENSIONS_UPDATES_TITLE"              : "Güncellemeler",

    "INLINE_EDITOR_NO_MATCHES"              : "Eşleşme yok.",
    "CSS_QUICK_EDIT_NO_MATCHES"             : "Seçiminizle eşleşen CSS kuralları mevcut.<br> \"Yeni kural\" oluştura tıklayın.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"         : "Projenizde stil dosyası yok.<br>CSS eklemek için stil dosyası oluşturun.",

    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON"             : "büyük",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                           : "pixels",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                            : "Hata Ayıkla",
    "ERRORS"                                : "Hatalar",
    "CMD_SHOW_DEV_TOOLS"                    : "Geliştirici Araçlarını Göster",
    "CMD_RELOAD_WITHOUT_USER_EXTS"          : "Uzantılar Olmadan Yeniden Başlat",
    "CMD_REFRESH_WINDOW"                    : "{APP_NAME} Yeniden Başlat",
    "CMD_NEW_BRACKETS_WINDOW"               : "Yeni {APP_NAME} Ekranı",
    "CMD_SWITCH_LANGUAGE"                   : "Dili Değiştir",
    "CMD_RUN_UNIT_TESTS"                    : "Testleri Çalıştır",
    "CMD_SHOW_PERF_DATA"                    : "Performans Bilgisini Göster",
    "CMD_ENABLE_NODE_DEBUGGER"              : "Node Hata Ayıklayıcısını Etkinleştir",
    "CMD_LOG_NODE_STATE"                    : "Node Durumunu Konsola Yaz",
    "CMD_RESTART_NODE"                      : "Node'u Yeniden Başlat",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"         : "Hataları Durum Çubuğunda Görüntüle",

    "LANGUAGE_TITLE"                        : "Dili değiştir",
    "LANGUAGE_MESSAGE"                      : "Lütfen aşağıdaki dillerden istediğiniz dili seçin:",
    "LANGUAGE_SUBMIT"                       : "{APP_NAME} Yenile",
    "LANGUAGE_CANCEL"                       : "İptal",
    "LANGUAGE_SYSTEM_DEFAULT"               : "Sistem Varsayılanları",
             
    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"             : "Zaman",
    "INLINE_TIMING_EDITOR_PROGRESSION"      : "İlerleme",
    "BEZIER_EDITOR_INFO"                    : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Seçili noktayı taşıyın<br><kbd class='text'>Shift</kbd> Tarafından on adet taşıma<br><kbd class='text'>Tab</kbd> Geçiş noktaları",
    "STEPS_EDITOR_INFO"                     : "<kbd>↑</kbd><kbd>↓</kbd> Adımları azaltabilir veya artırabilirsiniz<br><kbd>←</kbd><kbd>→</kbd> 'Başlangıç' or 'Bitiş'",
    "INLINE_TIMING_EDITOR_INVALID"          : "Eski <code>{0}</code> değeri geçerli değil, bu nedenle görüntülenen fonksiyon <code>{1}</code> ile değiştirildi. Belge ilk düzenleme ile güncellenecektir.",

    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP" : "Geçerli Renk",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP": "Orjinal Renk",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"          : "RGBa Formatı",
    "COLOR_EDITOR_HEX_BUTTON_TIP"           : "Hex Formatı",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"          : "HSLa Formatı",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"  : "{0} (Kullanılan {1} kez)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"    : "{0} (Kullanılan {1} kez)",
            
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                 : "Tanıma Atla",
    "CMD_SHOW_PARAMETER_HINT"               : "Parametre İpuçlarını Göster",
    "NO_ARGUMENTS"                          : "<parametre yok>",
    "DETECTED_EXCLUSION_TITLE"              : "JavaScript Doya Çıkarım Sorunu",
    "DETECTED_EXCLUSION_INFO"               : "Brackets ran into trouble processing:<br><br>{0}<br><br>This file will no longer be processed for code hints and jump to definition. To turn this back on, open <code>.brackets.json</code> in your project and remove the file from jscodehints.detectedExclusions.",
 
    // extensions/default/JSLint
    "JSLINT_NAME"                           : "JSLint",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                 : "Hızlı görünüm etkin",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"            : "Son Projeler",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                        : "Devamını oku"
});
