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
	"FILE_EXISTS_ERR": "ファイルは既に存在しています。",

    // Project error strings
	"ERROR_LOADING_PROJECT": "プロジェクトの読み込みに失敗しました。",
	"OPEN_DIALOG_ERROR": "「ファイルを開く」ダイアログを表示する際にエラーが発生しました。(エラー {0})",
	"REQUEST_NATIVE_FILE_SYSTEM_ERROR": "ディレクトリ <span class='dialog-filename'>{0}</span> を読み込む際にエラーが発生しました。(エラー {1})",
	"READ_DIRECTORY_ENTRIES_ERROR": "ディレクトリ <span class='dialog-filename'>{0}</span> の内容を読み込む際にエラーが発生しました。(エラー {1})",

    // File open/save error string
	"ERROR_OPENING_FILE_TITLE": "ファイルを開く際にエラーが発生しました。",
	"ERROR_OPENING_FILE": "ファイル <span class='dialog-filename'>{0}</span> を開く際にエラーが発生しました。{1}",
	"ERROR_RELOADING_FILE_TITLE": "ディスクから変更を再読み込みする際にエラーが発生しました。",
	"ERROR_RELOADING_FILE": "ファイル <span class='dialog-filename'>{0}</span> を再読込する際にエラーが発生しました。{1}",
	"ERROR_SAVING_FILE_TITLE": "ファイルを保存する際にエラーが発生しました。",
	"ERROR_SAVING_FILE": "ファイル <span class='dialog-filename'>{0}</span> を保存する際にエラーが発生しました。{1}",
	"ERROR_RENAMING_FILE_TITLE": "ファイルの名前を変更する際にエラーが発生しました。",
	"ERROR_RENAMING_FILE": "ファイル <span class='dialog-filename'>{0}</span> の名前を変更する際にエラーが発生しました。{1}",
	"INVALID_FILENAME_TITLE": "ファイル名が不正です。",
	"INVALID_FILENAME_MESSAGE": "ファイル名には、次の文字を含めることはできません : /?*:;{}<>\\|",
	"FILE_ALREADY_EXISTS": "ファイル <span class='dialog-filename'>{0}</span> は既に存在しています。",
	"ERROR_CREATING_FILE_TITLE": "ファイルを作成する際にエラーが発生しました。",
	"ERROR_CREATING_FILE": "ファイル <span class='dialog-filename'>{0}</span> を作成する際にエラーが発生しました。{1}",

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
	"LIVE_DEV_NEED_HTML_MESSAGE": "ライブプレビューを起動するには、HTML ファイルを開いてください。",
	"LIVE_DEV_NEED_BASEURL_MESSAGE": "サーバー側ファイルでライブプレビューを起動するには、このプロジェクトのベース URL を指定する必要があります。",
	"LIVE_DEV_SERVER_NOT_READY_MESSAGE": "ライブ開発ファイルで使用する HTTP サーバーの起動時にエラーが発生しました。もう一度実行してください。",
	"LIVE_DEVELOPMENT_INFO_TITLE": "ライブプレビューへようこそ",
	"LIVE_DEVELOPMENT_INFO_MESSAGE": "ライブプレビューにより {APP_NAME} がブラウザーに接続しました。ブラウザーで HTML ファイルのプレビューが起動し、コードを編集すると直ちにプレビューが更新されます。<br /><br />この初期バージョンの {APP_NAME} では、<strong>Google Chrome</strong> でのみライブプレビューが機能し、<strong>CSS ファイル</strong>の編集時にのみライブ更新が行われます。HTML または JavaScript ファイルへの変更は、保存時に自動的にリロードされます。<br /><br />(このメッセージは一度しか表示されません。)",
	"LIVE_DEVELOPMENT_TROUBLESHOOTING": "詳しくは、<a class=\"clickable-link\" data-href=\"{0}\">Live Development の接続エラーに関するトラブルシューティング</a>を参照してください。",
    
	"LIVE_DEV_STATUS_TIP_NOT_CONNECTED": "ライブプレビュー",
	"LIVE_DEV_STATUS_TIP_PROGRESS1": "ライブプレビュー : 接続中\u2026",
	"LIVE_DEV_STATUS_TIP_PROGRESS2": "ライブプレビュー : 初期化中\u2026",
	"LIVE_DEV_STATUS_TIP_CONNECTED": "ライブプレビューの接続を切断します",
	"LIVE_DEV_STATUS_TIP_OUT_OF_SYNC": "ライブプレビュー : クリックして切断 (ファイルを保存して更新)",
    
	"SAVE_CLOSE_TITLE": "変更を保存",
	"SAVE_CLOSE_MESSAGE": "文書 <span class='dialog-filename'>{0}</span> に加えた変更を保存しますか？",
	"SAVE_CLOSE_MULTI_MESSAGE": "以下のファイルに対する変更を保存しますか？",
	"EXT_MODIFIED_TITLE": "外部で変更されました。",
	"EXT_MODIFIED_MESSAGE": "<span class='dialog-filename'>{0}</span> はディスク上で変更されていますが、{APP_NAME} 内にも保存されていない変更があります。<br /><br />どちらのバージョンを保持しますか？",
	"EXT_DELETED_MESSAGE": "<span class='dialog-filename'>{0}</span> はディスク上で削除されていますが、{APP_NAME} 内に保存されていない変更があります。<br /><br />変更を保持しますか？",
    
    // Find, Replace, Find in Files
	"SEARCH_REGEXP_INFO": "正規表現による検索には /re/ シンタックスを使用してください",
	"FIND_RESULT_COUNT": "{0} 件",
	"WITH": "置換後の文字列",
	"BUTTON_YES": "はい",
	"BUTTON_NO": "いいえ",
	"BUTTON_STOP": "終了",

	"OPEN_FILE": "ファイルを開く",
	"CHOOSE_FOLDER": "フォルダーを選択",

	"RELEASE_NOTES": "リリースノート",
	"NO_UPDATE_TITLE": "最新バージョンです",
	"NO_UPDATE_MESSAGE": "{APP_NAME} の最新バージョンを実行中です。",
    
	"FIND_IN_FILES_TITLE": "「{4}」{5}  - {2} {3} 中 {0} 件の {1} ",
	"FIND_IN_FILES_SCOPED": "<span class='dialog-filename'>{0}</span> 内",
	"FIND_IN_FILES_NO_SCOPE": "プロジェクト内",
	"FIND_IN_FILES_FILE": "ファイル",
	"FIND_IN_FILES_FILES": "ファイル",
	"FIND_IN_FILES_MATCH": "一致",
	"FIND_IN_FILES_MATCHES": "一致",
	"FIND_IN_FILES_MORE_THAN": "少なくとも ",
	"FIND_IN_FILES_MAX": " (先頭 {0} 件を表示しています)",
	"FIND_IN_FILES_FILE_PATH": "ファイル : <span class='dialog-filename'>{0}</span>",
	"FIND_IN_FILES_LINE": "行 :&nbsp;{0}",

	"ERROR_FETCHING_UPDATE_INFO_TITLE": "更新情報を取得する際にエラーが発生しました。",
	"ERROR_FETCHING_UPDATE_INFO_MSG": "サーバーから最新の更新情報を取得する際にエラーが発生しました。インターネット接続を確認してリトライしてください。",
    
    // Switch language
	"LANGUAGE_TITLE": "言語を切り替える",
	"LANGUAGE_MESSAGE": "以下のリストから言語を選択してください :",
	"LANGUAGE_SUBMIT": "{APP_NAME} をリロード",
	"LANGUAGE_CANCEL": "キャンセル",

    /**
     * ProjectManager
     */
	"PROJECT_LOADING": "読み込んでいます\u2026",
	"UNTITLED": "名称未設定",

    /**
     * Keyboard modifier names
     */

	"KEYBOARD_CTRL": "Ctrl",
	"KEYBOARD_SHIFT": "Shift",
	"KEYBOARD_SPACE": "スペース",
    
    /**
     * StatusBar strings
     */
	"STATUSBAR_CURSOR_POSITION": "行 {0}, 列 {1}",
	"STATUSBAR_INDENT_TOOLTIP_SPACES": "インデントをスペースに変換する",
	"STATUSBAR_INDENT_TOOLTIP_TABS": "インデントをタブに変換する",
	"STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES": "インデントに用いるスペースの数を変更",
	"STATUSBAR_INDENT_SIZE_TOOLTIP_TABS": "タブ幅を変更",
	"STATUSBAR_SPACES": "スペース",
	"STATUSBAR_TAB_SIZE": "タブ幅",
	"STATUSBAR_LINE_COUNT": "{0} 行",

    /**
     * Command Name Constants
     */

    // File menu commands
	"FILE_MENU": "ファイル",
	"CMD_FILE_NEW": "新しいファイル",
	"CMD_FILE_NEW_FOLDER": "新しいフォルダー",
	"CMD_FILE_OPEN": "開く\u2026",
	"CMD_ADD_TO_WORKING_SET": "ワーキングセットに追加する",
	"CMD_OPEN_FOLDER": "フォルダーを開く\u2026",
	"CMD_FILE_CLOSE": "閉じる",
	"CMD_FILE_CLOSE_ALL": "すべて閉じる",
	"CMD_FILE_SAVE": "保存",
	"CMD_FILE_SAVE_ALL": "すべて保存",
	"CMD_LIVE_FILE_PREVIEW": "ライブプレビュー",
	"CMD_LIVE_HIGHLIGHT": "ライブハイライト",
	"CMD_PROJECT_SETTINGS": "プロジェクト設定\u2026",
	"CMD_FILE_RENAME": "ファイル名変更",
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
	"CMD_TOGGLE_CLOSE_BRACKETS": "!能=[6734352] Auto Close Braces_=!",
    
    // View menu commands
	"VIEW_MENU": "表示",
	"CMD_HIDE_SIDEBAR": "サイドバーを隠す",
	"CMD_SHOW_SIDEBAR": "サイドバーを表示する",
	"CMD_INCREASE_FONT_SIZE": "フォントサイズを大きく",
	"CMD_DECREASE_FONT_SIZE": "フォントサイズを小さく",
	"CMD_RESTORE_FONT_SIZE": "フォントサイズを元に戻す",
	"CMD_SCROLL_LINE_UP": "!能=[6735595] Scroll Line Up_=!",
	"CMD_SCROLL_LINE_DOWN": "!能=[6735594] Scroll Line Down_=!",
	"CMD_SORT_WORKINGSET_BY_ADDED": "追加日時順",
	"CMD_SORT_WORKINGSET_BY_NAME": "名前順",
	"CMD_SORT_WORKINGSET_BY_TYPE": "種類順",
	"CMD_SORT_WORKINGSET_AUTO": "自動ソート",

    // Navigate menu Commands
	"NAVIGATE_MENU": "ナビゲート",
	"CMD_QUICK_OPEN": "クイックオープン",
	"CMD_GOTO_LINE": "行に移動",
	"CMD_GOTO_DEFINITION": "定義に移動",
	"CMD_JSLINT_FIRST_ERROR": "最初の JSLint エラーに移動",
	"CMD_TOGGLE_QUICK_EDIT": "クイック編集",
	"CMD_QUICK_EDIT_PREV_MATCH": "前の候補に移動",
	"CMD_QUICK_EDIT_NEXT_MATCH": "次の候補に移動",
	"CMD_NEXT_DOC": "次の文書",
	"CMD_PREV_DOC": "前の文書",
	"CMD_SHOW_IN_TREE": "ファイルツリー内で表示",
    
    // Debug menu commands
	"DEBUG_MENU": "デバッグ",
	"CMD_REFRESH_WINDOW": "{APP_NAME} をリロード",
	"CMD_SHOW_DEV_TOOLS": "開発者ツールを表示",
	"CMD_RUN_UNIT_TESTS": "テストを実行",
	"CMD_JSLINT": "JSLint を有効にする",
	"CMD_SHOW_PERF_DATA": "パフォーマンスデータを表示",
	"CMD_NEW_BRACKETS_WINDOW": "新しい {APP_NAME} ウィンドウ",
	"CMD_SHOW_EXTENSIONS_FOLDER": "拡張機能のフォルダーを開く",
	"CMD_SWITCH_LANGUAGE": "言語を切り替える",
	"CMD_ENABLE_NODE_DEBUGGER": "ノードデバッガーを有効にする",
	"CMD_LOG_NODE_STATE": "ノードの状態をコンソールに記録",
	"CMD_RESTART_NODE": "ノードを再起動",

    // Help menu commands
	"HELP_MENU": "ヘルプ",
	"CMD_CHECK_FOR_UPDATE": "更新をチェックする",
	"CMD_HOW_TO_USE_BRACKETS": "{APP_NAME} の使用方法",
	"CMD_FORUM": "{APP_NAME} フォーラム",
	"CMD_RELEASE_NOTES": "リリースノート",
	"CMD_REPORT_AN_ISSUE": "問題を報告",
	"CMD_TWITTER": "Twitter で {TWITTER_NAME} をフォロー",
	"CMD_ABOUT": "{APP_TITLE} について",


    // Special commands invoked by the native shell
	"CMD_CLOSE_WINDOW": "ウィンドウを閉じる",
	"CMD_ABORT_QUIT": "強制終了する",

    // Strings for main-view.html
	"EXPERIMENTAL_BUILD": "試験ビルド",
	"DEVELOPMENT_BUILD": "開発ビルド",
	"JSLINT_ERRORS": "JSLint エラー",
	"JSLINT_ERROR_INFORMATION": "1 個の JSLint エラーがあります",
	"JSLINT_ERRORS_INFORMATION": "{0} 個の JSLint エラーがあります",
	"JSLINT_NO_ERRORS": "JSLint エラーはありません - Good job!",
	"JSLINT_DISABLED": "JSLint は無効か、現在のファイルには実行されません",
	"SEARCH_RESULTS": "検索結果",
	"OK": "OK",
	"DONT_SAVE": "保存しない",
	"SAVE": "保存",
	"CANCEL": "キャンセル",
	"RELOAD_FROM_DISK": "ディスクから再読み込み",
	"KEEP_CHANGES_IN_EDITOR": "エディター内の変更を保持する",
	"CLOSE_DONT_SAVE": "保存せずに閉じる",
	"RELAUNCH_CHROME": "Chrome を再起動",
	"ABOUT": "このソフトウェアについて",
	"APP_NAME": "Brackets",
	"CLOSE": "閉じる",
	"ABOUT_TEXT_LINE1": "スプリント {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
	"ABOUT_TEXT_LINE3": "注意 - サードパーティソフトウェアに関する契約条件は <a class=\"clickable-link\" data-href=\"http://www.adobe.com/go/thirdparty_jp/\">http://www.adobe.com/go/thirdparty_jp/</a> を参照してください。またリンク先の内容を本契約条件の一部と見なします。",
	"ABOUT_TEXT_LINE4": "ドキュメントとソースコードは <a class=\"clickable-link\" data-href=\"https://github.com/adobe/brackets/\">https://github.com/adobe/brackets/</a> から入手できます。",
	"ABOUT_TEXT_LINE5": "\u2764 および JavaScript を使用して次の人によって作成されました :",
	"ABOUT_TEXT_LINE6": "多くの人々 (ただし、人物データの読み込みに問題が発生しています)。",
	"UPDATE_NOTIFICATION_TOOLTIP": "{APP_NAME} の新しいビルドを利用できます。詳細はここをクリックしてください。",
	"UPDATE_AVAILABLE_TITLE": "利用可能なアップデートがあります",
	"UPDATE_MESSAGE": "{APP_NAME} の新しいビルドが利用できます。新機能の一部を以下にご紹介します :",
	"GET_IT_NOW": "すぐに入手する",
	"PROJECT_SETTINGS_TITLE": "プロジェクト設定 : {0}",
	"PROJECT_SETTING_BASE_URL": "ライブプレビューのベース URL",
	"PROJECT_SETTING_BASE_URL_HINT": "(ローカルサーバーを使用するには、URL を指定してください)",
	"BASEURL_ERROR_INVALID_PROTOCOL": "{0} プロトコルはライブプレビューではサポートされていません。http: または https: を使用してください。",
	"BASEURL_ERROR_SEARCH_DISALLOWED": "ベース URL には、「{0}」のような検索パラメーターは使用できません。",
	"BASEURL_ERROR_HASH_DISALLOWED": "ベース URL には、「{0}」のようなハッシュ記号は使用できません。",
	"BASEURL_ERROR_INVALID_CHAR": "「{0}」のような特殊文字は、パーセントエンコーディングする必要があります。",
	"BASEURL_ERROR_UNKOWN_ERROR": "ベース URL の解析中に不明なエラーが発生しました",
    
    // extensions/default/InlineColorEditor
	"COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP": "現在の色",
	"COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP": "元の色",
	"COLOR_EDITOR_RGBA_BUTTON_TIP": "RGBa 形式",
	"COLOR_EDITOR_HEX_BUTTON_TIP": "16 進形式",
	"COLOR_EDITOR_HSLA_BUTTON_TIP": "HSLa 形式",
	"COLOR_EDITOR_USED_COLOR_TIP_SINGULAR": "{0} ({1} 回使用)",
	"COLOR_EDITOR_USED_COLOR_TIP_PLURAL": "{0} ({1} 回使用)"
});
