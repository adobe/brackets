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
    "GENERIC_ERROR"                     : "(エラー {0})",
    "NOT_FOUND_ERR"                     : "指定ファイルは見つかりませんでした。",
    "NOT_READABLE_ERR"                  : "指定ファイルは読取できません。",
    "NO_MODIFICATION_ALLOWED_ERR"       : "指定ディレクトリは変更できません。",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "ファイル変更のパーミッションがありません。",
    "FILE_EXISTS_ERR"                   : "ファイルは既に存在します。",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "プロジェクト読込エラー",
    "OPEN_DIALOG_ERROR"                 : "ファイルを開くダイアログを表示する際にエラーが発生しました。 (エラー {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "次のディレクトリを読込時にエラーが発生しました: <span class='dialog-filename'>{0}</span> (エラー {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "次のディレクトリ内を読取時にエラーが発生しました: <span class='dialog-filename'>{0}</span> (エラー {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "ファイル読込エラー",
    "ERROR_OPENING_FILE"                : "次のファイルを開く際にエラーが発生しました: <span class='dialog-filename'>{0}</span> {1}",
    "ERROR_RELOADING_FILE_TITLE"        : "ディスクのリロードエラー",
    "ERROR_RELOADING_FILE"              : "次のファイルを再読込時にエラーが発生しました: <span class='dialog-filename'>{0}</span> {1}",
    "ERROR_SAVING_FILE_TITLE"           : "ファイル保存エラー",
    "ERROR_SAVING_FILE"                 : "次のファイル保存時にエラーが発生しました: <span class='dialog-filename'>{0}</span> {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "ファイル名変更エラー",
    "ERROR_RENAMING_FILE"               : "次のファイルを名前変更時にエラーが発生しました: <span class='dialog-filename'>{0}</span> {1}",
    "INVALID_FILENAME_TITLE"            : "不正なファイル名",
    "INVALID_FILENAME_MESSAGE"          : "ファイル名に次の文字は使用できません: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "<span class='dialog-filename'>{0}</span> は既に存在しています。",
    "ERROR_CREATING_FILE_TITLE"         : "ファイル作成エラー",
    "ERROR_CREATING_FILE"               : "次のファイル作成時にエラーが発生しました: <span class='dialog-filename'>{0}</span> {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "残念! {APP_NAME} は現在ブラウザ上では動作しません。",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} は HTML 技術の元に作成されていますが、現在はデスクトップアプリケーションとして動作する事で、ローカルファイルへのアクセス制限を回避しています。{APP_NAME} アプリケーションシェルのご利用は次の URL からどうぞ: <b>github.com/adobe/brackets-shell</b>",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "ファイルインデックスエラー",
    "ERROR_MAX_FILES"                   : "ファイルインデックスが限界に達しました。インデックス内ファイルの参照に問題が生じる可能性があります。",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "ブラウザ起動エラー",
    "ERROR_CANT_FIND_CHROME"            : "Google Chrome が見つかりませんでした。インストールされている事をご確認下さい。",
    "ERROR_LAUNCHING_BROWSER"           : "ブラウザ起動時にエラーが発生しました。 (エラー {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "ライヴプレビューエラー",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "ブラウザへ接続",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "ライヴプレビューとの接続には Chrome のリモートデバッグを有効にて再起動する必要があります。<br /><br />リモートデバッグを有効にして Chrome を再起動しますか。",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "ライヴプレビューの実行には HTML ファイルを開く必要があります。",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "ライヴプレビューへようこそ!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "ライヴプレビューは {APP_NAME} とお使いのブラウザを接続します。編集中の HTML ファイルのプレビューをブラウザで行います。プレビューの更新はコードの変更に合わせて自動実行されます。<br /><br />お使いの {APP_NAME} では現在のところ、ライヴプレビュー <strong>CSS ファイル</strong>のみに対応しブラウザは <strong>Google Chrome</strong> にのみ対応します。HTML と JavaScript への対応は近日公開です!<br /><br />(このメッセージは一度だけ表示されます。)",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "ライヴプレビュー",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "ライヴプレビュー: 接続中...",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "ライヴプレビュー: 初期化中...",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "ライヴプレビューの切断",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "ライヴプレビュー: クリックで切断 (更新ファイル保存)",
    
    "SAVE_CLOSE_TITLE"                  : "変更の保存",
    "SAVE_CLOSE_MESSAGE"                : "次のドキュメントの変更を保存しますか。 <span class='dialog-filename'>{0}</span>",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "変更を次のファイルに保存しますか。",
    "EXT_MODIFIED_TITLE"                : "外部の変更",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> のディスク上の変更を検知しました。{APP_NAME} 上では変更が反映されていません。<br /><br />どちらを保存しますか。",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> はディスク上から削除されました。{APP_NAME} に未保存のデータが保持されています。<br /><br />保存しますか。",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "/re/ 構文による正規表現検索が可能です",
    "WITH"                              : "置換",
    "BUTTON_YES"                        : "はい",
    "BUTTON_NO"                         : "いいえ",
    "BUTTON_STOP"                       : "停止",

    "OPEN_FILE"                         : "ファイルを開く",
    "CHOOSE_FOLDER"                     : "フォルダを選択",

    "RELEASE_NOTES"                     : "リリースノート",
    "NO_UPDATE_TITLE"                   : "最新版です!",
    "NO_UPDATE_MESSAGE"                 : "最新版の {APP_NAME} を使用中です。",
    
    "FIND_IN_FILES_TITLE"               : ": \"{4}\" - {2} {3} 中 {0} {1}",
    "FIND_IN_FILES_FILE"                : "ファイル",
    "FIND_IN_FILES_FILES"               : "ファイル",
    "FIND_IN_FILES_MATCH"               : "件該当",
    "FIND_IN_FILES_MATCHES"             : "件該当",
    "FIND_IN_FILES_MORE_THAN"           : "More Than ",
    "FIND_IN_FILES_MAX"                 : " (最初にマッチした {0} 件のみ表示)",
    "FIND_IN_FILES_FILE_PATH"           : "ファイル: <b>{0}</b>",
    "FIND_IN_FILES_LINE"                : "行:&nbsp;{0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "アップデート情報取得エラー",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "サーバーからのアップデート情報取得で問題が発生しました。インターネットの接続を確認し、再度お試し下さい。",
    
    // Switch language
    "LANGUAGE_TITLE"                    : "言語を選択",
    "LANGUAGE_MESSAGE"                  : "使用したい言語を以下リストよりお選び下さい:",
    "LANGUAGE_SUBMIT"                   : "{APP_NAME} をリロード",
    "LANGUAGE_CANCEL"                   : "キャンセル",

    /**
     * ProjectManager
     */

    "UNTITLED" : "Untitled",

    /**
     * Keyboard modifier names
     */

    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "スペース",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "{0} 行目, {1} カラム目",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "クリックでインデント文字をスペースに変更",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "クリックでインデント文字をタブに変更",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "クリックでインデントに使用するスペース字数を変更",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "クリックでインデントに使用するタブ幅を変更",
    "STATUSBAR_SPACES"                      : "スペース",
    "STATUSBAR_TAB_SIZE"                    : "タブ幅",
    "STATUSBAR_LINE_COUNT"                  : "{0} 行",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "ファイル",
    "CMD_FILE_NEW"                        : "新規ファイル",
    "CMD_FILE_NEW_FOLDER"                 : "新規フォルダ",
    "CMD_FILE_OPEN"                       : "開く\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Working Set に追加",
    "CMD_OPEN_FOLDER"                     : "フォルダを開く\u2026",
    "CMD_FILE_CLOSE"                      : "閉じる",
    "CMD_FILE_CLOSE_ALL"                  : "全て閉じる",
    "CMD_FILE_SAVE"                       : "保存",
    "CMD_FILE_SAVE_ALL"                   : "全て保存",
    "CMD_LIVE_FILE_PREVIEW"               : "ライヴプレビュー",
    "CMD_FILE_RENAME"                     : "名前変更",
    "CMD_QUIT"                            : "終了",

    // Edit menu commands
    "EDIT_MENU"                           : "編集",
    "CMD_SELECT_ALL"                      : "全て選択",
    "CMD_FIND"                            : "検索",
    "CMD_FIND_IN_FILES"                   : "全文検索",
    "CMD_FIND_NEXT"                       : "次を検索",
    "CMD_FIND_PREVIOUS"                   : "前を検索",
    "CMD_REPLACE"                         : "置換",
    "CMD_INDENT"                          : "インデント",
    "CMD_UNINDENT"                        : "インデント取消",
    "CMD_DUPLICATE"                       : "重複",
    "CMD_DELETE_LINES"                    : "行を削除",
    "CMD_COMMENT"                         : "行コメントの挿入/削除",
    "CMD_LINE_UP"                         : "行を上に移動",
    "CMD_LINE_DOWN"                       : "行を下に移動",
     
    // View menu commands
    "VIEW_MENU"                           : "表示",
    "CMD_HIDE_SIDEBAR"                    : "サイドバーを隠す",
    "CMD_SHOW_SIDEBAR"                    : "サイドバーを表示",
    "CMD_INCREASE_FONT_SIZE"              : "文字サイズを拡大",
    "CMD_DECREASE_FONT_SIZE"              : "文字サイズを縮小",
    "CMD_RESTORE_FONT_SIZE"               : "文字サイズを元に戻す",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "ナビゲート",
    "CMD_QUICK_OPEN"                      : "Quick Open",
    "CMD_GOTO_LINE"                       : "行へ移動",
    "CMD_GOTO_DEFINITION"                 : "定義へ移動",
    "CMD_TOGGLE_QUICK_EDIT"               : "Quick Edit",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "前のマッチ",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "次のマッチ",
    "CMD_NEXT_DOC"                        : "次のファイル",
    "CMD_PREV_DOC"                        : "前のファイル",
    "CMD_SHOW_IN_TREE"                    : "ファイルツリーで表示",
    
    // Debug menu commands
    "DEBUG_MENU"                          : "デバッグ",
    "CMD_REFRESH_WINDOW"                  : "{APP_NAME} をリロード",
    "CMD_SHOW_DEV_TOOLS"                  : "Developer Tools を表示",
    "CMD_RUN_UNIT_TESTS"                  : "テストを実行",
    "CMD_JSLINT"                          : "JSLint を有効",
    "CMD_SHOW_PERF_DATA"                  : "パフォーマンスデータを表示",
    "CMD_NEW_BRACKETS_WINDOW"             : "新規ウィンドウで {APP_NAME} を開く",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "拡張フォルダを表示",
    "CMD_SWITCH_LANGUAGE"                 : "言語を選択",
    "CMD_CHECK_FOR_UPDATE"                : "更新の確認",

    // Help menu commands
    "HELP_MENU"                           : "ヘルプ",
    "CMD_ABOUT"                           : "{APP_TITLE} について",
    "CMD_FORUM"                           : "{APP_NAME} フォーラム",

    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "ウィンドウを閉じる",
    "CMD_ABORT_QUIT"                      : "終了を中断",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "試験ビルド",
    "JSLINT_ERRORS"                        : "JSLint エラー",
    "JSLINT_ERROR_INFORMATION"             : "1 個の JSLint エラー",
    "JSLINT_ERRORS_INFORMATION"            : "{0} 個の JSLint エラー",
    "JSLINT_NO_ERRORS"                     : "JSLint でエラーは検出されませんでした - いい仕事してますね!",
    "JSLINT_DISABLED"                      : "JSLint は無効か現在のファイルには使用できません。",
    "SEARCH_RESULTS"                       : "検索結果",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "保存しない",
    "SAVE"                                 : "保存",
    "CANCEL"                               : "キャンセル",
    "RELOAD_FROM_DISK"                     : "ディスクからリロード",
    "KEEP_CHANGES_IN_EDITOR"               : "エディタ内の変更を保存",
    "CLOSE_DONT_SAVE"                      : "閉じる (保存しない)",
    "RELAUNCH_CHROME"                      : "Chrome の再起動",
    "ABOUT"                                : "ソフトウェアについて",
    "APP_NAME"                             : "Brackets",
    "CLOSE"                                : "閉じる",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} experimental build {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "注意 - サードパーティソフトウェアに関する契約条件は次に示す URL の通りです。またリンク先の内容を本契約条件の一部と見なすものとします: <a class=\"clickable-link\" data-href=\"http://www.adobe.com/go/thirdparty/\">http://www.adobe.com/go/thirdparty/</a>",
    "ABOUT_TEXT_LINE4"                     : "ドキュメント及びソース: <a class=\"clickable-link\" data-href=\"https://github.com/adobe/brackets/\">https://github.com/adobe/brackets/</a>",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "新しいビルドの {APP_NAME} が利用可能です! 詳細はこちらをクリックしてご確認下さい。",
    "UPDATE_AVAILABLE_TITLE"               : "アップデートが利用可能です",
    "UPDATE_MESSAGE"                       : "新しいビルドの {APP_NAME} が利用可能になりました。こちらが新機能のハイライトです:",
    "GET_IT_NOW"                           : "今すぐ入手!"
});
