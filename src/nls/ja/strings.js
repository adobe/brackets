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
	"GENERIC_ERROR": "(エラー {0})",
	"NOT_FOUND_ERR": "ファイルが見つかりません。",
	"NOT_READABLE_ERR": "ファイルを読み取れません。",
	"NO_MODIFICATION_ALLOWED_ERR": "対象ディレクトリは変更できません。",
	"NO_MODIFICATION_ALLOWED_ERR_FILE": "ファイルを変更する権限がありません。",
	"FILE_EXISTS_ERR": "ファイルまたはディレクトリは既に存在しています。",
	"FILE": "ファイル",
	"DIRECTORY": "ディレクトリ",

    // Project error strings
	"ERROR_LOADING_PROJECT": "プロジェクトの読み込みに失敗しました。",
	"OPEN_DIALOG_ERROR": "「ファイルを開く」ダイアログを表示する際にエラーが発生しました。(エラー {0})",
	"REQUEST_NATIVE_FILE_SYSTEM_ERROR": "ディレクトリ <span class='dialog-filename'>{0}</span> を読み込む際にエラーが発生しました。(エラー {1})",
	"READ_DIRECTORY_ENTRIES_ERROR": "ディレクトリ <span class='dialog-filename'>{0}</span> の内容を読み込む際にエラーが発生しました。(エラー {1})",

    // File open/save error string
	"ERROR_OPENING_FILE_TITLE": "ファイルを開く際にエラーが発生しました。",
	"ERROR_OPENING_FILE": "ファイル <span class='dialog-filename'>{0}</span> を開く際にエラーが発生しました。{1}",
	"ERROR_OPENING_FILES": "次のファイルを開くときにエラーが発生しました :",
	"ERROR_RELOADING_FILE_TITLE": "ディスクから変更を再読み込みする際にエラーが発生しました。",
	"ERROR_RELOADING_FILE": "ファイル <span class='dialog-filename'>{0}</span> を再読込する際にエラーが発生しました。{1}",
	"ERROR_SAVING_FILE_TITLE": "ファイルを保存する際にエラーが発生しました。",
	"ERROR_SAVING_FILE": "ファイル <span class='dialog-filename'>{0}</span> を保存する際にエラーが発生しました。{1}",
	"ERROR_RENAMING_FILE_TITLE": "ファイルの名前を変更する際にエラーが発生しました。",
	"ERROR_RENAMING_FILE": "ファイル <span class='dialog-filename'>{0}</span> の名前を変更する際にエラーが発生しました。{1}",
	"ERROR_DELETING_FILE_TITLE": "ファイル削除のエラー",
	"ERROR_DELETING_FILE": "ファイルを削除する際にエラーが発生しました <span class='dialog-filename'>{0}</span>。{1}",
	"INVALID_FILENAME_TITLE": "無効な{0}名",
	"INVALID_FILENAME_MESSAGE": "ファイル名には、次の文字を含めることはできません : /?*:;{}<>\\| またはシステムのすべての予約語",
	"FILE_ALREADY_EXISTS": "{0} <span class='dialog-filename'>{1}</span> は既に存在しています。",
	"ERROR_CREATING_FILE_TITLE": "{0}を作成する際にエラーが発生しました",
	"ERROR_CREATING_FILE": "{0} <span class='dialog-filename'>{1}</span> を作成する際にエラーが発生しました。{2}",

    // Application error strings
	"ERROR_IN_BROWSER_TITLE": "{APP_NAME} は、まだブラウザー上で実行されていません。",
	"ERROR_IN_BROWSER": "{APP_NAME} は HTML で構築されていますが、デスクトップアプリとして実行することで、ローカルファイルを編集することができます。{APP_NAME} を実行するために、<b>github.com/adobe/brackets-shell</b> リポジトリのアプリケーションシェルを使用してください。",

    // FileIndexManager error string
	"ERROR_MAX_FILES_TITLE": "ファイルのインデックス時にエラーが発生しました。",
	"ERROR_MAX_FILES": "インデックス化できるファイルの最大数に達しました。インデックス内でファイルを見つける機能は正しく動作しないことがあります。",

    // Live Development error strings
	"ERROR_LAUNCHING_BROWSER_TITLE": "ブラウザーの起動時にエラーが発生しました。",
	"ERROR_CANT_FIND_CHROME": "Google Chrome ブラウザーが見つかりません。インストールされていることを確認してください。",
	"ERROR_LAUNCHING_BROWSER": "ブラウザーの起動時にエラーが発生しました。(エラー {0})",
    
	"LIVE_DEVELOPMENT_ERROR_TITLE": "ライブプレビューのエラーが発生しました。",
	"LIVE_DEVELOPMENT_RELAUNCH_TITLE": "ブラウザーに接続しています",
	"LIVE_DEVELOPMENT_ERROR_MESSAGE": "ライブプレビューに接続するには、リモートデバッグを有効にして Chrome を再起動する必要があります。<br /><br />Chrome を再起動してリモートデバッグを有効にしますか？",
	"LIVE_DEV_LOADING_ERROR_MESSAGE": "ライブ開発ページを読み込めません。",
	"LIVE_DEV_NEED_HTML_MESSAGE": "ライブプレビューを起動するには、HTML ファイルを開いてください。",
	"LIVE_DEV_NEED_BASEURL_MESSAGE": "サーバー側ファイルでライブプレビューを起動するには、このプロジェクトのベース URL を指定する必要があります。",
	"LIVE_DEV_SERVER_NOT_READY_MESSAGE": "ライブ開発ファイルで使用する HTTP サーバーの起動時にエラーが発生しました。もう一度実行してください。",
	"LIVE_DEVELOPMENT_INFO_TITLE": "ライブプレビューへようこそ",
	"LIVE_DEVELOPMENT_INFO_MESSAGE": "ライブプレビューにより {APP_NAME} がブラウザーに接続しました。ブラウザーで HTML ファイルのプレビューが起動し、コードを編集すると直ちにプレビューが更新されます。<br /><br />この初期バージョンの {APP_NAME} では、<strong>Google Chrome</strong> でのみライブプレビューが機能し、<strong>CSS または HTML ファイル</strong>の編集時にのみライブ更新が行われます。 JavaScript ファイルへの変更は、保存時に自動的にリロードされます。<br /><br />(このメッセージは一度しか表示されません。)",
	"LIVE_DEVELOPMENT_TROUBLESHOOTING": "詳しくは、<a href='{0}' title='{0}'>Live Development の接続エラーに関するトラブルシューティング</a>を参照してください。",
    
	"LIVE_DEV_STATUS_TIP_NOT_CONNECTED": "ライブプレビュー",
	"LIVE_DEV_STATUS_TIP_PROGRESS1": "ライブプレビュー : 接続中\u2026",
	"LIVE_DEV_STATUS_TIP_PROGRESS2": "ライブプレビュー : 初期化中\u2026",
	"LIVE_DEV_STATUS_TIP_CONNECTED": "ライブプレビューの接続を切断します",
	"LIVE_DEV_STATUS_TIP_OUT_OF_SYNC": "ライブプレビュー (ファイルを保存して更新)",
	"LIVE_DEV_STATUS_TIP_SYNC_ERROR": "ライブプレビュー (シンタックスエラーのため更新されません)",

	"LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS": "ブラウザーの開発ツールが開いているため、ライブプレビューはキャンセルされました",
	"LIVE_DEV_DETACHED_TARGET_CLOSED": "ブラウザーでページが閉じられたため、ライブプレビューはキャンセルされました",
	"LIVE_DEV_NAVIGATED_AWAY": "ブラウザーで現在のプロジェクトに含まれないページに移動したため、ライブプレビューはキャンセルされました",
	"LIVE_DEV_CLOSED_UNKNOWN_REASON": "不明な原因 ({0}) によってライブプレビューはキャンセルされました",
    
	"SAVE_CLOSE_TITLE": "変更を保存",
	"SAVE_CLOSE_MESSAGE": "文書 <span class='dialog-filename'>{0}</span> に加えた変更を保存しますか？",
	"SAVE_CLOSE_MULTI_MESSAGE": "以下のファイルに対する変更を保存しますか？",
	"EXT_MODIFIED_TITLE": "外部で変更されました。",
	"CONFIRM_FOLDER_DELETE_TITLE": "削除の確認",
	"CONFIRM_FOLDER_DELETE": "<span class='dialog-filename'>{0}</span> フォルダーを削除してもよろしいですか？",
	"FILE_DELETED_TITLE": "ファイルは削除されました",
	"EXT_MODIFIED_MESSAGE": "<span class='dialog-filename'>{0}</span> はディスク上で変更されていますが、{APP_NAME} 内にも保存されていない変更があります。<br /><br />どちらのバージョンを保持しますか？",
	"EXT_DELETED_MESSAGE": "<span class='dialog-filename'>{0}</span> はディスク上で削除されていますが、{APP_NAME} 内に保存されていない変更があります。<br /><br />変更を保持しますか？",
    
    // Find, Replace, Find in Files
	"SEARCH_REGEXP_INFO": "正規表現による検索には /re/ シンタックスを使用してください",
	"FIND_RESULT_COUNT": "{0} 件",
	"FIND_RESULT_COUNT_SINGLE": "1 件",
	"FIND_NO_RESULTS": "該当なし",
	"WITH": "置換後の文字列",
	"BUTTON_YES": "はい",
	"BUTTON_NO": "いいえ",
	"BUTTON_REPLACE_ALL": "すべて\u2026",
	"BUTTON_STOP": "終了",
	"BUTTON_REPLACE": "置換",
            
	"BUTTON_NEXT": "\u25B6",
	"BUTTON_PREV": "\u25C0",
	"BUTTON_NEXT_HINT": "次の候補に移動",
	"BUTTON_PREV_HINT": "前の候補に移動",

	"OPEN_FILE": "ファイルを開く",
	"SAVE_FILE_AS": "ファイルを保存",
	"CHOOSE_FOLDER": "フォルダーを選択",

	"RELEASE_NOTES": "リリースノート",
	"NO_UPDATE_TITLE": "最新バージョンです",
	"NO_UPDATE_MESSAGE": "{APP_NAME} の最新バージョンを実行中です。",

	"FIND_REPLACE_TITLE_PART1": "「",
	"FIND_REPLACE_TITLE_PART2": "」を「",
	"FIND_REPLACE_TITLE_PART3": "」に置き換え &mdash; {2} {0} {1}",

	"FIND_IN_FILES_TITLE_PART1": "「",
	"FIND_IN_FILES_TITLE_PART2": "」の検索結果",
	"FIND_IN_FILES_TITLE_PART3": "&mdash;  {3}  {4}で  {1}件 {0}{2}",
	"FIND_IN_FILES_SCOPED": "<span class='dialog-filename'>{0}</span> 内",
	"FIND_IN_FILES_NO_SCOPE": "プロジェクト内",
	"FIND_IN_FILES_FILE": "ファイル",
	"FIND_IN_FILES_FILES": "ファイル",
	"FIND_IN_FILES_MATCH": "が見つかりました",
	"FIND_IN_FILES_MATCHES": "が見つかりました",
	"FIND_IN_FILES_MORE_THAN": "以上",
	"FIND_IN_FILES_PAGING": "{0}&mdash;{1}",
	"FIND_IN_FILES_FILE_PATH": "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>",
	"ERROR_FETCHING_UPDATE_INFO_TITLE": "更新情報を取得する際にエラーが発生しました。",
	"ERROR_FETCHING_UPDATE_INFO_MSG": "サーバーから最新の更新情報を取得する際にエラーが発生しました。インターネット接続を確認してリトライしてください。",

    /**
     * ProjectManager
     */
	"PROJECT_LOADING": "読み込んでいます\u2026",
	"UNTITLED": "名称未設定",
	"WORKING_FILES": "作業中ファイル",

    /**
     * Keyboard modifier names
     */
	"KEYBOARD_CTRL": "Ctrl",
	"KEYBOARD_SHIFT": "Shift",
	"KEYBOARD_SPACE": "Space",
    
    /**
     * StatusBar strings
     */
	"STATUSBAR_CURSOR_POSITION": "行 {0}, 列 {1}",
	"STATUSBAR_SELECTION_CH_SINGULAR": " \u2014 {0} 列を選択",
	"STATUSBAR_SELECTION_CH_PLURAL": " \u2014 {0} 列を選択",
	"STATUSBAR_SELECTION_LINE_SINGULAR": " \u2014 {0} 行を選択",
	"STATUSBAR_SELECTION_LINE_PLURAL": " \u2014 {0} 行を選択",
	"STATUSBAR_INDENT_TOOLTIP_SPACES": "インデントをスペースに変換する",
	"STATUSBAR_INDENT_TOOLTIP_TABS": "インデントをタブに変換する",
	"STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES": "インデントに用いるスペースの数を変更",
	"STATUSBAR_INDENT_SIZE_TOOLTIP_TABS": "タブ幅を変更",
	"STATUSBAR_SPACES": "スペース :",
	"STATUSBAR_TAB_SIZE": "タブ幅 :",
	"STATUSBAR_LINE_COUNT_SINGULAR": "\u2014 {0} 行",
	"STATUSBAR_LINE_COUNT_PLURAL": "\u2014 {0} 行",

    // CodeInspection: errors/warnings
	"ERRORS_PANEL_TITLE": "{0} のエラー",
	"SINGLE_ERROR": "1 個の {0} エラー",
	"MULTIPLE_ERRORS": "{1} 個の {0} エラー",
	"NO_ERRORS": "{0} エラーはありません - Good job!",
	"LINT_DISABLED": "Lint チェックは使用できません",
	"NO_LINT_AVAILABLE": "{0} に使用できる Lint チェッカーがありません",
	"NOTHING_TO_LINT": "Lint チェックするファイルがありません",
    
    
    /**
     * Command Name Constants
     */

    // File menu commands
	"FILE_MENU": "ファイル",
	"CMD_FILE_NEW_UNTITLED": "新規作成",
	"CMD_FILE_NEW": "新しいファイル",
	"CMD_FILE_NEW_FOLDER": "新しいフォルダー",
	"CMD_FILE_OPEN": "開く\u2026",
	"CMD_ADD_TO_WORKING_SET": "ワーキングセットに追加する",
	"CMD_OPEN_FOLDER": "フォルダーを開く\u2026",
	"CMD_FILE_CLOSE": "閉じる",
	"CMD_FILE_CLOSE_ALL": "すべて閉じる",
	"CMD_FILE_SAVE": "保存",
	"CMD_FILE_SAVE_ALL": "すべて保存",
	"CMD_FILE_SAVE_AS": "名前を付けて保存\u2026",
	"CMD_LIVE_FILE_PREVIEW": "ライブプレビュー",
	"CMD_PROJECT_SETTINGS": "プロジェクト設定\u2026",
	"CMD_FILE_RENAME": "ファイル名変更",
	"CMD_FILE_DELETE": "削除",
	"CMD_INSTALL_EXTENSION": "拡張機能をインストール\u2026",
	"CMD_EXTENSION_MANAGER": "拡張機能マネージャー\u2026",
	"CMD_FILE_REFRESH": "ファイルツリーを更新",
	"CMD_QUIT": "終了する",
    // Used in native File menu on Windows
	"CMD_EXIT": "終了",

    // Edit menu commands
	"EDIT_MENU": "編集",
	"CMD_UNDO": "取り消し",
	"CMD_REDO": "やり直し",
	"CMD_CUT": "カット",
	"CMD_COPY": "コピー",
	"CMD_PASTE": "ペースト",
	"CMD_SELECT_ALL": "すべて選択",
	"CMD_SELECT_LINE": "行の選択",
	"CMD_FIND": "検索",
	"CMD_FIND_IN_FILES": "ファイルを横断して検索",
	"CMD_FIND_IN_SUBTREE": "検索先\u2026",
	"CMD_FIND_NEXT": "次を検索",
	"CMD_FIND_PREVIOUS": "前を検索",
	"CMD_REPLACE": "置換",
	"CMD_INDENT": "インデント",
	"CMD_UNINDENT": "インデント解除",
	"CMD_DUPLICATE": "行を複製",
	"CMD_DELETE_LINES": "行を削除",
	"CMD_COMMENT": "行コメントの切り替え",
	"CMD_BLOCK_COMMENT": "ブロックコメントの切り替え",
	"CMD_LINE_UP": "行を上に移動",
	"CMD_LINE_DOWN": "行を下に移動",
	"CMD_OPEN_LINE_ABOVE": "上の行を開く",
	"CMD_OPEN_LINE_BELOW": "下の行を開く",
	"CMD_TOGGLE_CLOSE_BRACKETS": "自動閉じカッコ",
	"CMD_SHOW_CODE_HINTS": "コードヒントを表示",
    
    // View menu commands
	"VIEW_MENU": "表示",
	"CMD_HIDE_SIDEBAR": "サイドバーを隠す",
	"CMD_SHOW_SIDEBAR": "サイドバーを表示する",
	"CMD_INCREASE_FONT_SIZE": "フォントサイズを大きく",
	"CMD_DECREASE_FONT_SIZE": "フォントサイズを小さく",
	"CMD_RESTORE_FONT_SIZE": "フォントサイズを元に戻す",
	"CMD_SCROLL_LINE_UP": "1 行上にスクロール",
	"CMD_SCROLL_LINE_DOWN": "1 行下にスクロール",
	"CMD_TOGGLE_LINE_NUMBERS": "行番号",
	"CMD_TOGGLE_ACTIVE_LINE": "アクティブな行をハイライト",
	"CMD_TOGGLE_WORD_WRAP": "折り返し",
	"CMD_LIVE_HIGHLIGHT": "ライブプレビューハイライト",
	"CMD_VIEW_TOGGLE_INSPECTION": "保存時にファイルを Lint チェック",
	"CMD_SORT_WORKINGSET_BY_ADDED": "追加日時順",
	"CMD_SORT_WORKINGSET_BY_NAME": "名前順",
	"CMD_SORT_WORKINGSET_BY_TYPE": "種類順",
	"CMD_SORT_WORKINGSET_AUTO": "自動ソート",

    // Navigate menu Commands
	"NAVIGATE_MENU": "ナビゲート",
	"CMD_QUICK_OPEN": "クイックオープン",
	"CMD_GOTO_LINE": "行に移動",
	"CMD_GOTO_DEFINITION": "定義をクイック検索",
	"CMD_GOTO_FIRST_PROBLEM": "最初のエラーまたは警告に移動",
	"CMD_TOGGLE_QUICK_EDIT": "クイック編集",
	"CMD_TOGGLE_QUICK_DOCS": "クイックドキュメント",
	"CMD_QUICK_EDIT_PREV_MATCH": "前の候補に移動",
	"CMD_QUICK_EDIT_NEXT_MATCH": "次の候補に移動",
	"CMD_NEXT_DOC": "次の文書",
	"CMD_PREV_DOC": "前の文書",
	"CMD_SHOW_IN_TREE": "ファイルツリー内で表示",
	"CMD_SHOW_IN_OS": "OS で表示",
    
    // Help menu commands
	"HELP_MENU": "ヘルプ",
	"CMD_CHECK_FOR_UPDATE": "更新をチェックする",
	"CMD_HOW_TO_USE_BRACKETS": "{APP_NAME} の使用方法",
	"CMD_FORUM": "{APP_NAME} フォーラム",
	"CMD_RELEASE_NOTES": "リリースノート",
	"CMD_REPORT_AN_ISSUE": "問題を報告",
	"CMD_SHOW_EXTENSIONS_FOLDER": "拡張機能のフォルダーを開く",
	"CMD_TWITTER": "Twitter で {TWITTER_NAME} をフォロー",
	"CMD_ABOUT": "{APP_TITLE} について",

    // Strings for main-view.html
	"EXPERIMENTAL_BUILD": "試験ビルド",
	"DEVELOPMENT_BUILD": "開発ビルド",
	"OK": "OK",
	"DONT_SAVE": "保存しない",
	"SAVE": "保存",
	"CANCEL": "キャンセル",
	"DELETE": "削除",
	"RELOAD_FROM_DISK": "ディスクから再読み込み",
	"KEEP_CHANGES_IN_EDITOR": "エディター内の変更を保持する",
	"CLOSE_DONT_SAVE": "保存せずに閉じる",
	"RELAUNCH_CHROME": "Chrome を再起動",
	"ABOUT": "このソフトウェアについて",
	"CLOSE": "閉じる",
	"ABOUT_TEXT_LINE1": "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
	"ABOUT_TEXT_LINE3": "Notices, terms and conditions pertaining to third party software are located at <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> and incorporated by reference herein.",
	"ABOUT_TEXT_LINE4": "ドキュメントとソースコードは <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a> から入手できます。",
	"ABOUT_TEXT_LINE5": "\u2764 および JavaScript を使用して次の人によって作成されました :",
	"ABOUT_TEXT_LINE6": "多くの人々 (ただし、人物データの読み込みに問題が発生しています)。",
	"ABOUT_TEXT_WEB_PLATFORM_DOCS": "Web Platform Docs and the Web Platform graphical logo are licensed under a Creative Commons Attribution license, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
	"UPDATE_NOTIFICATION_TOOLTIP": "{APP_NAME} の新しいビルドを利用できます。詳細はここをクリックしてください。",
	"UPDATE_AVAILABLE_TITLE": "利用可能なアップデートがあります",
	"UPDATE_MESSAGE": "{APP_NAME} の新しいビルドが利用できます。新機能の一部を以下にご紹介します :",
	"GET_IT_NOW": "すぐに入手する",
	"PROJECT_SETTINGS_TITLE": "プロジェクト設定 : {0}",
	"PROJECT_SETTING_BASE_URL": "ライブプレビューのベース URL",
	"PROJECT_SETTING_BASE_URL_HINT": "http://localhost:8000/ 等のURLを入力してローカルサーバーを使用",
	"BASEURL_ERROR_INVALID_PROTOCOL": "{0} プロトコルはライブプレビューではサポートされていません。http: または https: を使用してください。",
	"BASEURL_ERROR_SEARCH_DISALLOWED": "ベース URL には、「{0}」のような検索パラメーターは使用できません。",
	"BASEURL_ERROR_HASH_DISALLOWED": "ベース URL には、「{0}」のようなハッシュ記号は使用できません。",
	"BASEURL_ERROR_INVALID_CHAR": "「{0}」のような特殊文字は、パーセントエンコーディングする必要があります。",
	"BASEURL_ERROR_UNKNOWN_ERROR": "ベース URL の解析中に不明なエラーが発生しました",
    
    // Extension Management strings
	"INSTALL": "インストール",
	"UPDATE": "更新",
	"REMOVE": "削除",
	"OVERWRITE": "上書き",
	"CANT_REMOVE_DEV": "dev フォルダーの拡張機能は手動で削除する必要があります。",
	"CANT_UPDATE": "アップデートはこのバージョンの {APP_NAME} と互換性がありません。",
	"INSTALL_EXTENSION_TITLE": "拡張機能をインストール",
	"UPDATE_EXTENSION_TITLE": "拡張機能を更新",
	"INSTALL_EXTENSION_LABEL": "拡張機能の URL",
	"INSTALL_EXTENSION_HINT": "拡張機能 zip ファイルまたは GitHub レポジトリの URL",
	"INSTALLING_FROM": "{0} から拡張機能をインストールしています\u2026",
	"INSTALL_SUCCEEDED": "インストールは成功しました。",
	"INSTALL_FAILED": "インストールは失敗しました。",
	"CANCELING_INSTALL": "キャンセルしています\u2026",
	"CANCELING_HUNG": "インストールのキャンセルに時間がかかっています。内部エラーが発生した可能性があります。",
	"INSTALL_CANCELED": "インストールはキャンセルされました。",
    // These must match the error codes in ExtensionsDomain.Errors.* :
	"INVALID_ZIP_FILE": "ダウンロードされたコンテンツは有効な zip ファイルではありません。",
	"INVALID_PACKAGE_JSON": "package.json ファイルは有効ではありません (エラーは {0} です)。",
	"MISSING_PACKAGE_NAME": "package.json ファイルはパッケージ名を指定していません。",
	"BAD_PACKAGE_NAME": "{0} は無効なパッケージ名です。",
	"MISSING_PACKAGE_VERSION": "package.json ファイルはパッケージバージョンを指定していません。",
	"INVALID_VERSION_NUMBER": "パッケージバージョン番号 ({0}) は無効です。",
	"INVALID_BRACKETS_VERSION": "{APP_NAME} 互換文字列 {0} は無効です。",
	"DISALLOWED_WORDS": "{1} は {0} フィールドでは使用できません。",
	"API_NOT_COMPATIBLE": "拡張機能はこのバージョンの {APP_NAME} と互換性がありません。無効な拡張機能フォルダーにインストールされます。",
	"MISSING_MAIN": "パッケージに main.js ファイルが含まれていません。",
	"EXTENSION_ALREADY_INSTALLED": "このパッケージをインストールすると以前にインストールした拡張機能が上書きされます。古い拡張機能を上書きしますか？",
	"EXTENSION_SAME_VERSION": "このパッケージのバージョンは現在インストールされているバージョンと同じです。既存のインストールを上書きしますか？",
	"EXTENSION_OLDER_VERSION": "このパッケージのバージョン ({0}) は、現在インストールされているバージョン ({1}) よりも古いバージョンです。既存のインストールを上書きしますか？",
	"DOWNLOAD_ID_IN_USE": "内部エラー : ダウンロード ID は既に使用されています。",
	"NO_SERVER_RESPONSE": "サーバーに接続できません。",
	"BAD_HTTP_STATUS": "ファイルがサーバー (HTTP {0}) に見つかりません。",
	"CANNOT_WRITE_TEMP": "一時ダウンロードファイルを保存できません。",
	"ERROR_LOADING": "拡張機能の起動時にエラーが発生しました。",
	"MALFORMED_URL": "URL が無効です。正しく入力されているか確認してください。",
	"UNSUPPORTED_PROTOCOL": "URL は http または https URL である必要があります。",
	"UNKNOWN_ERROR": "不明な内部エラー。",
    // For NOT_FOUND_ERR, see generic strings above
	"EXTENSION_MANAGER_TITLE": "拡張機能マネージャー",
	"EXTENSION_MANAGER_ERROR_LOAD": "拡張機能レジストリにアクセスできません。後でもう一度試してください。",
	"INSTALL_FROM_URL": "URL からインストール\u2026",
	"EXTENSION_AUTHOR": "作成者",
	"EXTENSION_DATE": "日付",
	"EXTENSION_INCOMPATIBLE_NEWER": "この拡張機能には新しいバージョンの {APP_NAME} が必要です。",
	"EXTENSION_INCOMPATIBLE_OLDER": "この拡張機能は現在、古いバージョンの {APP_NAME} でしか動作しません。",
	"EXTENSION_NO_DESCRIPTION": "説明なし",
	"EXTENSION_MORE_INFO": "詳細情報...",
	"EXTENSION_ERROR": "拡張機能のエラー",
	"EXTENSION_KEYWORDS": "キーワード",
	"EXTENSION_INSTALLED": "インストール完了",
	"EXTENSION_UPDATE_INSTALLED": "この拡張機能のアップデートがダウンロードされました。{APP_NAME} を終了したときにインストールされます。",
	"EXTENSION_SEARCH_PLACEHOLDER": "検索",
	"EXTENSION_MORE_INFO_LINK": "詳細",
	"BROWSE_EXTENSIONS": "拡張機能を探す",
	"EXTENSION_MANAGER_REMOVE": "拡張機能を削除",
	"EXTENSION_MANAGER_REMOVE_ERROR": "1 つ以上の拡張機能 ({0}) を削除できません。{APP_NAME} が終了中です。",
	"EXTENSION_MANAGER_UPDATE": "拡張機能を更新",
	"EXTENSION_MANAGER_UPDATE_ERROR": "1 つ以上の拡張機能 ({0}) を更新できません。{APP_NAME} が終了中です。",
	"MARKED_FOR_REMOVAL": "削除予定",
	"UNDO_REMOVE": "取り消し",
	"MARKED_FOR_UPDATE": "更新予定",
	"UNDO_UPDATE": "取り消し",
	"CHANGE_AND_QUIT_TITLE": "拡張機能を変更",
	"CHANGE_AND_QUIT_MESSAGE": "更新予定または削除予定の拡張機能を更新または削除するには、{APP_NAME} を一度終了して再起動する必要があります。未保存の変更を保存するかどうか確認されます。",
	"REMOVE_AND_QUIT": "拡張機能を削除して終了",
	"CHANGE_AND_QUIT": "拡張機能を変更して終了",
	"UPDATE_AND_QUIT": "拡張機能を更新して終了",
	"EXTENSION_NOT_INSTALLED": "インストールされていなかったため、拡張機能 {0} を削除できませんでした。",
	"NO_EXTENSIONS": "インストールされている拡張機能はまだありません。<br>上の「入手可能」タブをクリックしてインストールしてください。",
	"NO_EXTENSION_MATCHES": "検索条件に一致する拡張機能がありません。",
	"REGISTRY_SANITY_CHECK_WARNING": "不明なソースから拡張機能をインストールするときは十分に注意してください。",
	"EXTENSIONS_INSTALLED_TITLE": "インストール済み",
	"EXTENSIONS_AVAILABLE_TITLE": "入手可能",
	"EXTENSIONS_UPDATES_TITLE": "アップデート",
    
    /**
     * Unit names
     */

	"UNIT_PIXELS": "ピクセル",
    
    
    // extensions/default/DebugCommands
	"DEBUG_MENU": "デバッグ",
	"CMD_SHOW_DEV_TOOLS": "開発者ツールを表示",
	"CMD_REFRESH_WINDOW": "{APP_NAME} をリロード",
	"CMD_NEW_BRACKETS_WINDOW": "新しい {APP_NAME} ウィンドウ",
	"CMD_SWITCH_LANGUAGE": "言語を切り替える",
	"CMD_RUN_UNIT_TESTS": "テストを実行",
	"CMD_SHOW_PERF_DATA": "パフォーマンスデータを表示",
	"CMD_ENABLE_NODE_DEBUGGER": "Node Debugger を有効にする",
	"CMD_LOG_NODE_STATE": "Node の状態をコンソールに記録",
	"CMD_RESTART_NODE": "Node を再起動",
    
	"LANGUAGE_TITLE": "言語を切り替える",
	"LANGUAGE_MESSAGE": "言語 :",
	"LANGUAGE_SUBMIT": "{APP_NAME} をリロード",
	"LANGUAGE_CANCEL": "キャンセル",
	"LANGUAGE_SYSTEM_DEFAULT": "システムのデフォルト",
    
    // Locales (used by Debug > Switch Language)
	"LOCALE_CS": "チェコ語",
	"LOCALE_DE": "ドイツ語",
	"LOCALE_EN": "英語",
	"LOCALE_ES": "スペイン語",
	"LOCALE_FI": "フィンランド語",
	"LOCALE_FR": "フランス語",
	"LOCALE_IT": "イタリア語",
	"LOCALE_JA": "日本語",
	"LOCALE_NB": "ノルウェー語",
	"LOCALE_PL": "ポーランド語",
	"LOCALE_PT_BR": "ポルトガル語 (ブラジル)",
	"LOCALE_PT_PT": "ポルトガル語",
	"LOCALE_RU": "ロシア語",
	"LOCALE_SK": "スロバキア語",
	"LOCALE_SV": "スウェーデン語",
	"LOCALE_TR": "トルコ語",
	"LOCALE_ZH_CN": "中国語 (簡体字)",
	"LOCALE_HU": "ハンガリー語",
    
    // extensions/default/InlineColorEditor
	"COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP": "現在の色",
	"COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP": "元の色",
	"COLOR_EDITOR_RGBA_BUTTON_TIP": "RGBa 形式",
	"COLOR_EDITOR_HEX_BUTTON_TIP": "16 進形式",
	"COLOR_EDITOR_HSLA_BUTTON_TIP": "HSLa 形式",
	"COLOR_EDITOR_USED_COLOR_TIP_SINGULAR": "{0} ({1} 回使用)",
	"COLOR_EDITOR_USED_COLOR_TIP_PLURAL": "{0} ({1} 回使用)",
    
    // extensions/default/JavaScriptCodeHints
	"CMD_JUMPTO_DEFINITION": "定義にジャンプ",
	"CMD_SHOW_PARAMETER_HINT": "パラメーターヒントを表示",
	"NO_ARGUMENTS": "<パラメーターがありません>",
    
    // extensions/default/JSLint
	"JSLINT_NAME": "JSLint",
    
    // extensions/default/QuickView
	"CMD_ENABLE_QUICK_VIEW": "ホバー・クイックビュー",
    
    // extensions/default/RecentProjects
	"CMD_TOGGLE_RECENT_PROJECTS": "最近使用したプロジェクト",
    
    // extensions/default/WebPlatformDocs
	"DOCS_MORE_LINK": "詳細"
});
