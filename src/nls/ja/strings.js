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
	"CONTENTS_MODIFIED_ERR": "このファイルは {APP_NAME} 以外で変更されています。",
	"UNSUPPORTED_ENCODING_ERR": "{APP_NAME} は現在 UTF-8 でエンコードされたテキストファイルのみをサポートしています。",
	"UNSUPPORTED_FILE_TYPE_ERR": "ファイルはサポートされているファイルタイプではありません。",
	"FILE_EXISTS_ERR": "ファイルまたはディレクトリは既に存在しています。",
	"FILE": "ファイル",
	"FILE_TITLE": "ファイル",
	"DIRECTORY": "ディレクトリ",
	"DIRECTORY_TITLE": "ディレクトリ",
	"DIRECTORY_NAMES_LEDE": "ディレクトリ名",
	"FILENAMES_LEDE": "ファイル名",
	"FILENAME": "ファイル名",
	"DIRECTORY_NAME": "ディレクトリ名",
    

    // Project error strings
	"ERROR_LOADING_PROJECT": "プロジェクトを読み込む際にエラーが発生しました。",
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
	"ERROR_RENAMING_FILE_TITLE": "{0} の名前を変更する際にエラーが発生しました。",
	"ERROR_RENAMING_FILE": "{2} <span class='dialog-filename'>{0}</span> の名前を変更する際にエラーが発生しました。{1}",
	"ERROR_DELETING_FILE_TITLE": "{0} を削除する際にエラーが発生しました。",
	"ERROR_DELETING_FILE": "{2} <span class='dialog-filename'>{0}</span> を削除する際にエラーが発生しました。{1}",
	"INVALID_FILENAME_TITLE": "無効な{0}",
	"INVALID_FILENAME_MESSAGE": "{0}にはシステムのすべての予約語、末尾のピリオド (.)、および次の文字を含めることはできません : <code class='emphasized'>{1}</code>",
	"ENTRY_WITH_SAME_NAME_EXISTS": "<span class='dialog-filename'>{0}</span> という名前のファイルまたはディレクトリは既に存在します。",
	"ERROR_CREATING_FILE_TITLE": "{0} を作成する際にエラーが発生しました。",
	"ERROR_CREATING_FILE": "{0} <span class='dialog-filename'>{1}</span> を作成する際にエラーが発生しました。{2}",

    // Application preferences corrupt error strings
	"ERROR_PREFS_CORRUPT_TITLE": "環境設定を読み込む際にエラーが発生しました。",
	"ERROR_PREFS_CORRUPT": "環境設定ファイルが有効な JSON ではありません。ファイルが開かれます。フォーマットを修正してください。変更を反映するには、{APP_NAME} を再起動する必要があります。",

    // Application error strings
	"ERROR_IN_BROWSER_TITLE": "{APP_NAME} は、まだブラウザー上で実行されていません。",
	"ERROR_IN_BROWSER": "{APP_NAME} は HTML で構築されていますが、デスクトップアプリとして実行することで、ローカルファイルを編集することができます。{APP_NAME} を実行するために、<b>github.com/adobe/brackets-shell</b> リポジトリのアプリケーションシェルを使用してください。",
    
    // ProjectManager max files error string
	"ERROR_MAX_FILES_TITLE": "ファイルのインデックス時にエラーが発生しました。",
	"ERROR_MAX_FILES": "このプロジェクトには 30,000 個以上のファイルが含まれています。複数のファイルを操作する機能が無効になるか、プロジェクトが空であるかのように動作します。<a href='https://github.com/adobe/brackets/wiki/Large-Projects'>大きいプロジェクトの操作方法の詳細を表示</a>。",

    // Live Preview error strings
	"ERROR_LAUNCHING_BROWSER_TITLE": "ブラウザーの起動時にエラーが発生しました。",
	"ERROR_CANT_FIND_CHROME": "Google Chrome ブラウザーが見つかりません。インストールされていることを確認してください。",
	"ERROR_LAUNCHING_BROWSER": "ブラウザーの起動時にエラーが発生しました。(エラー {0})",
    
	"LIVE_DEVELOPMENT_ERROR_TITLE": "ライブプレビューのエラーが発生しました。",
	"LIVE_DEVELOPMENT_RELAUNCH_TITLE": "ブラウザーに接続しています",
	"LIVE_DEVELOPMENT_ERROR_MESSAGE": "ライブプレビューに接続するには、リモートデバッグを有効にして Chrome を再起動する必要があります。<br /><br />Chrome を再起動してリモートデバッグを有効にしますか？",
	"LIVE_DEV_LOADING_ERROR_MESSAGE": "ライブプレビューページを読み込めません",
	"LIVE_DEV_NEED_HTML_MESSAGE": "ライブプレビューを起動するには、HTML ファイルを開くか、index.html ファイルがプロジェクトに含まれていることを確認してください。",
	"LIVE_DEV_NEED_BASEURL_MESSAGE": "サーバー側ファイルでライブプレビューを起動するには、このプロジェクトのベース URL を指定する必要があります。",
	"LIVE_DEV_SERVER_NOT_READY_MESSAGE": "ファイルのライブプレビューで使用する HTTP サーバーの起動時にエラーが発生しました。もう一度実行してください。",
	"LIVE_DEVELOPMENT_INFO_TITLE": "ライブプレビューへようこそ",
	"LIVE_DEVELOPMENT_INFO_MESSAGE": "ライブプレビューにより {APP_NAME} がブラウザーに接続しました。ブラウザーで HTML ファイルのプレビューが起動し、コードを編集すると直ちにプレビューが更新されます。<br /><br />この初期バージョンの {APP_NAME} では、<strong>Google Chrome</strong> でのみライブプレビューが機能し、<strong>CSS または HTML ファイル</strong>の編集時にのみライブ更新が行われます。 JavaScript ファイルへの変更は、保存時に自動的にリロードされます。<br /><br />(このメッセージは一度しか表示されません。)",
	"LIVE_DEVELOPMENT_TROUBLESHOOTING": "詳しくは、<a href='{0}' title='{0}'>ライブプレビューの接続エラーに関するトラブルシューティング</a>を参照してください。",
    
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
	"EXT_MODIFIED_WARNING": "<span class='dialog-filename'>{0}</span> はディスク上で変更されています。<br /><br />ファイルを保存し、これらの変更を上書きしますか。",
	"EXT_MODIFIED_MESSAGE": "<span class='dialog-filename'>{0}</span> はディスク上で変更されていますが、{APP_NAME} 内にも保存されていない変更があります。<br /><br />どちらのバージョンを保持しますか？",
	"EXT_DELETED_MESSAGE": "<span class='dialog-filename'>{0}</span> はディスク上で削除されていますが、{APP_NAME} 内に保存されていない変更があります。<br /><br />変更を保持しますか？",
    
    // Generic dialog/button labels
	"DONE": "完了",
	"OK": "OK",
	"CANCEL": "キャンセル",
	"DONT_SAVE": "保存しない",
	"SAVE": "保存",
	"SAVE_AS": "名前を付けて保存\u2026",
	"SAVE_AND_OVERWRITE": "上書き",
	"DELETE": "削除",
	"BUTTON_YES": "はい",
	"BUTTON_NO": "いいえ",
    
    // Find, Replace, Find in Files
	"FIND_MATCH_INDEX": "{0} / {1}",
	"FIND_NO_RESULTS": "該当なし",
	"FIND_QUERY_PLACEHOLDER": "検索\u2026",
	"REPLACE_PLACEHOLDER": "\u2026 に置換",
	"BUTTON_REPLACE_ALL": "バッチ\u2026",
	"BUTTON_REPLACE_ALL_IN_FILES": "置換\u2026",
	"BUTTON_REPLACE": "置換",
	"BUTTON_NEXT": "\u25B6",
	"BUTTON_PREV": "\u25C0",
	"BUTTON_NEXT_HINT": "次の候補に移動",
	"BUTTON_PREV_HINT": "前の候補に移動",
	"BUTTON_CASESENSITIVE_HINT": "大文字と小文字を区別",
	"BUTTON_REGEXP_HINT": "正規表現",
	"REPLACE_WITHOUT_UNDO_WARNING_TITLE": "取り消し情報を保存せずに置換",
	"REPLACE_WITHOUT_UNDO_WARNING": "{0} 個を超えるファイルを変更する必要があるため、{APP_NAME} によってディスク上の開かれていないファイルが変更されます。<br />これらのファイルで行った置換は取り消しできません。",
	"BUTTON_REPLACE_WITHOUT_UNDO": "取り消し情報を保存せずに置換",

	"OPEN_FILE": "ファイルを開く",
	"SAVE_FILE_AS": "ファイルを保存",
	"CHOOSE_FOLDER": "フォルダーを選択",

	"RELEASE_NOTES": "リリースノート",
	"NO_UPDATE_TITLE": "最新バージョンです。",
	"NO_UPDATE_MESSAGE": "{APP_NAME} の最新バージョンを実行中です。",

    // Find and Replace
	"FIND_REPLACE_TITLE_LABEL": "置換対象",
	"FIND_REPLACE_TITLE_WITH": "置換後の文字列",
	"FIND_TITLE_LABEL": "検索結果",
	"FIND_TITLE_SUMMARY": "&mdash; {0} {1} {2} ({3})",

    // Find in Files
	"FIND_NUM_FILES": "{0} {1}",
	"FIND_IN_FILES_SCOPED": "<span class='dialog-filename'>{0}</span> 内",
	"FIND_IN_FILES_NO_SCOPE": "プロジェクト内",
	"FIND_IN_FILES_ZERO_FILES": "フィルターは {0}の全ファイルを除外します",
	"FIND_IN_FILES_FILE": "ファイル",
	"FIND_IN_FILES_FILES": "ファイル",
	"FIND_IN_FILES_MATCH": "が見つかりました",
	"FIND_IN_FILES_MATCHES": "件見つかりました",
	"FIND_IN_FILES_MORE_THAN": "以上",
	"FIND_IN_FILES_PAGING": "{0}&mdash;{1}",
	"FIND_IN_FILES_FILE_PATH": "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>",
	"FIND_IN_FILES_EXPAND_COLLAPSE": "Ctrl / Command キーをクリックしてすべて展開 / 折りたたみ",
	"REPLACE_IN_FILES_ERRORS_TITLE": "置換エラー",
	"REPLACE_IN_FILES_ERRORS": "次のファイルは検索の後で変更されているか、書き込むことができないため、変更されていません。",
    
	"ERROR_FETCHING_UPDATE_INFO_TITLE": "更新情報を取得する際にエラーが発生しました。",
	"ERROR_FETCHING_UPDATE_INFO_MSG": "サーバーから最新の更新情報を取得する際にエラーが発生しました。インターネット接続を確認してリトライしてください。",
    
    // File exclusion filters
	"NEW_FILE_FILTER": "新規除外セット\u2026",
	"CLEAR_FILE_FILTER": "ファイルを除外しない",
	"NO_FILE_FILTER": "除外されたファイルはありません",
	"EXCLUDE_FILE_FILTER": "{0} を除外",
	"EDIT_FILE_FILTER": "編集\u2026",
	"FILE_FILTER_DIALOG": "除外セットを編集",
	"FILE_FILTER_INSTRUCTIONS": "次の文字列やサブストリング、または<a href='{0}' title='{0}'>ワイルドカード</a>のいずれかに一致するファイルおよびフォルダーを除外します。各文字列を新しい行に入力してください。",
	"FILTER_NAME_PLACEHOLDER": "この除外セットに名前を付ける (オプション)",
	"FILE_FILTER_CLIPPED_SUFFIX": "さらに {0} 件",
	"FILTER_COUNTING_FILES": "ファイル数を確認中\u2026",
	"FILTER_FILE_COUNT": "{2}の {1} ファイル中 {0} ファイルを許可",
	"FILTER_FILE_COUNT_ALL": "{1}の全 {0} ファイルを許可",

    // Quick Edit
	"ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND": "現在のカーソル位置で行えるクイック編集はありません",
	"ERROR_CSSQUICKEDIT_BETWEENCLASSES": "CSS クイック編集 : カーソルを単一のクラス名に置いてください",
	"ERROR_CSSQUICKEDIT_CLASSNOTFOUND": "CSS クイック編集 : 不完全なクラス属性",
	"ERROR_CSSQUICKEDIT_IDNOTFOUND": "CSS クイック編集 : 不完全な ID 属性",
	"ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR": "CSS クイック編集 : カーソルをタグ、クラスまたは ID に置いてください",
	"ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX": "CSS タイミング機能のクイック編集 : 無効なシンタックス",
	"ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND": "JS クイック編集 : カーソルを関数名に置いてください",

    // Quick Docs
	"ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND": "現在のカーソル位置で使用できるクイックドキュメントはありません",

    /**
     * ProjectManager
     */
	"PROJECT_LOADING": "読み込んでいます\u2026",
	"UNTITLED": "名称未設定",
	"WORKING_FILES": "作業中ファイル",

    /**
     * MainViewManager
     */
	"TOP": "上",
	"BOTTOM": "下",
	"LEFT": "左",
	"RIGHT": "右",

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
	"STATUSBAR_SELECTION_MULTIPLE": " \u2014 選択範囲 {0}",
	"STATUSBAR_INDENT_TOOLTIP_SPACES": "インデントをスペースに変換する",
	"STATUSBAR_INDENT_TOOLTIP_TABS": "インデントをタブに変換する",
	"STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES": "インデントに用いるスペースの数を変更",
	"STATUSBAR_INDENT_SIZE_TOOLTIP_TABS": "タブ幅を変更",
	"STATUSBAR_SPACES": "スペース :",
	"STATUSBAR_TAB_SIZE": "タブ幅 :",
	"STATUSBAR_LINE_COUNT_SINGULAR": "\u2014 {0} 行",
	"STATUSBAR_LINE_COUNT_PLURAL": "\u2014 {0} 行",
	"STATUSBAR_USER_EXTENSIONS_DISABLED": "拡張機能無効",
	"STATUSBAR_INSERT": "INS",
	"STATUSBAR_OVERWRITE": "OVR",
	"STATUSBAR_INSOVR_TOOLTIP": "クリックして挿入 (INS) モードと上書き (OVR) モード間のカーソルを切り替え",
	"STATUSBAR_LANG_TOOLTIP": "クリックしてファイルタイプを変更",
	"STATUSBAR_CODE_INSPECTION_TOOLTIP": "{0}。クリックしてレポートパネルを切り替えます。",
	"STATUSBAR_DEFAULT_LANG": "(指定なし)",
	"STATUSBAR_SET_DEFAULT_LANG": ".{0} ファイルのデフォルトとして設定",

    // CodeInspection: errors/warnings
	"ERRORS_PANEL_TITLE_MULTIPLE": "{0} 個の問題",
	"SINGLE_ERROR": "1 個の {0} の問題",
	"MULTIPLE_ERRORS": "{1} 個の {0} の問題",
	"NO_ERRORS": "{0} の問題は検出されませんでした - Good job!",
	"NO_ERRORS_MULTIPLE_PROVIDER": "問題は検出されませんでした - Good job!",
	"LINT_DISABLED": "Lint チェックは使用できません",
	"NO_LINT_AVAILABLE": "{0} に使用できる Lint チェッカーがありません",
	"NOTHING_TO_LINT": "Lint チェックするファイルがありません",
	"LINTER_TIMED_OUT": "{0} は {1} ミリ秒待機した後でタイムアウトしました",
	"LINTER_FAILED": "{0} は次のエラーにより終了しました : {1}",
    
    
    /**
     * Command Name Constants
     */

    // File menu commands
	"FILE_MENU": "ファイル",
	"CMD_FILE_NEW_UNTITLED": "新規作成",
	"CMD_FILE_NEW": "新しいファイル",
	"CMD_FILE_NEW_FOLDER": "新しいフォルダー",
	"CMD_FILE_OPEN": "開く\u2026",
	"CMD_ADD_TO_WORKINGSET_AND_OPEN": "ワーキングセットに追加して開く",
	"CMD_OPEN_DROPPED_FILES": "ドロップしたファイルを開く",
	"CMD_OPEN_FOLDER": "フォルダーを開く\u2026",
	"CMD_FILE_CLOSE": "閉じる",
	"CMD_FILE_CLOSE_ALL": "すべて閉じる",
	"CMD_FILE_CLOSE_LIST": "リストを閉じる",
	"CMD_FILE_CLOSE_OTHERS": "他をすべて閉じる",
	"CMD_FILE_CLOSE_ABOVE": "上をすべて閉じる",
	"CMD_FILE_CLOSE_BELOW": "下をすべて閉じる",
	"CMD_FILE_SAVE": "保存",
	"CMD_FILE_SAVE_ALL": "すべて保存",
	"CMD_FILE_SAVE_AS": "名前を付けて保存\u2026",
	"CMD_LIVE_FILE_PREVIEW": "ライブプレビュー",
	"CMD_RELOAD_LIVE_PREVIEW": "ライブプレビューを強制的に再読込み",
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
	"CMD_SPLIT_SEL_INTO_LINES": "選択範囲を行に分ける",
	"CMD_ADD_CUR_TO_NEXT_LINE": "次の行にカーソルを追加",
	"CMD_ADD_CUR_TO_PREV_LINE": "前の行にカーソルを追加",
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
    
    // Search menu commands
	"FIND_MENU": "検索",
	"CMD_FIND": "検索",
	"CMD_FIND_NEXT": "次を検索",
	"CMD_FIND_PREVIOUS": "前を検索",
	"CMD_FIND_ALL_AND_SELECT": "すべて検索して選択",
	"CMD_ADD_NEXT_MATCH": "選択範囲に次の候補を追加",
	"CMD_SKIP_CURRENT_MATCH": "スキップして次の候補を追加",
	"CMD_FIND_IN_FILES": "ファイルを横断して検索",
	"CMD_FIND_IN_SELECTED": "選択したファイルまたはフォルダーを検索",
	"CMD_FIND_IN_SUBTREE": "検索先\u2026",
	"CMD_REPLACE": "置換",
	"CMD_REPLACE_IN_FILES": "ファイルを横断して置換",
	"CMD_REPLACE_IN_SELECTED": "選択したファイルまたはフォルダーで置換",
	"CMD_REPLACE_IN_SUBTREE": "置換対象\u2026",
    
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
	"CMD_WORKINGSET_SORT_BY_ADDED": "追加日時順",
	"CMD_WORKINGSET_SORT_BY_NAME": "名前順",
	"CMD_WORKINGSET_SORT_BY_TYPE": "種類順",
	"CMD_WORKING_SORT_TOGGLE_AUTO": "自動ソート",
	"CMD_THEMES": "テーマ\u2026",

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
	"CMD_CSS_QUICK_EDIT_NEW_RULE": "新規ルール",
	"CMD_NEXT_DOC": "次の文書",
	"CMD_PREV_DOC": "前の文書",
	"CMD_SHOW_IN_TREE": "ファイルツリー内で表示",
	"CMD_SHOW_IN_EXPLORER": "エクスプローラーで表示",
	"CMD_SHOW_IN_FINDER": "Finder で表示",
	"CMD_SHOW_IN_OS": "OS で表示",
    
    // Help menu commands
	"HELP_MENU": "ヘルプ",
	"CMD_CHECK_FOR_UPDATE": "更新をチェックする",
	"CMD_HOW_TO_USE_BRACKETS": "{APP_NAME} の使用方法",
	"CMD_SUPPORT": "{APP_NAME} サポート",
	"CMD_SUGGEST": "機能改善の提案",
	"CMD_RELEASE_NOTES": "リリースノート",
	"CMD_GET_INVOLVED": "コミュニティに参加",
	"CMD_SHOW_EXTENSIONS_FOLDER": "拡張機能のフォルダーを開く",
	"CMD_HOMEPAGE": "{APP_TITLE} ホームページ",
	"CMD_TWITTER": "Twitter で {TWITTER_NAME} をフォロー",
	"CMD_ABOUT": "{APP_TITLE} について",
	"CMD_OPEN_PREFERENCES": "環境設定ファイルを開く",

    // Strings for main-view.html
	"EXPERIMENTAL_BUILD": "試験ビルド",
	"DEVELOPMENT_BUILD": "開発ビルド",
	"RELOAD_FROM_DISK": "ディスクから再読み込み",
	"KEEP_CHANGES_IN_EDITOR": "エディター内の変更を保持する",
	"CLOSE_DONT_SAVE": "保存せずに閉じる",
	"RELAUNCH_CHROME": "Chrome を再起動",
	"ABOUT": "このソフトウェアについて",
	"CLOSE": "閉じる",
	"ABOUT_TEXT_LINE1": "リリース {VERSION_MAJOR}.{VERSION_MINOR} {BUILD_TYPE} {VERSION}",
	"ABOUT_TEXT_BUILD_TIMESTAMP": "ビルドのタイムスタンプ : ",
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
	"EMPTY_VIEW_HEADER": "<em>このビューにフォーカスがあるときにファイルを選択</em>",
    
    // Strings for themes-settings.html and themes-general.html
	"CURRENT_THEME": "現在のテーマ",
	"USE_THEME_SCROLLBARS": "テーマスクロールバーを使用",
	"FONT_SIZE": "フォントサイズ",
	"FONT_FAMILY": "フォントファミリー",
	"THEMES_SETTINGS": "テーマ設定",

    // CSS Quick Edit
	"BUTTON_NEW_RULE": "新規ルール",
    
    // Extension Management strings
	"INSTALL": "インストール",
	"UPDATE": "更新",
	"REMOVE": "削除",
	"OVERWRITE": "上書き",
	"CANT_REMOVE_DEV": "dev フォルダーの拡張機能は手動で削除する必要があります。",
	"CANT_UPDATE": "アップデートはこのバージョンの {APP_NAME} と互換性がありません。",
	"CANT_UPDATE_DEV": "dev フォルダーの拡張機能は自動的に更新されません。",
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
	"VIEW_COMPLETE_DESCRIPTION": "詳細な説明を表示",
	"VIEW_TRUNCATED_DESCRIPTION": "省略された説明を表示",
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
	"INSTALL_EXTENSION_DRAG": ".zip をここにドラッグするか、",
	"INSTALL_EXTENSION_DROP": ".zip をドロップしてインストール",
	"INSTALL_EXTENSION_DROP_ERROR": "次のエラーのため、インストール / アンインストールが中止されました :",
	"INSTALL_FROM_URL": "URL からインストール\u2026",
	"INSTALL_EXTENSION_VALIDATING": "検証中\u2026",
	"EXTENSION_AUTHOR": "作成者",
	"EXTENSION_DATE": "日付",
	"EXTENSION_INCOMPATIBLE_NEWER": "この拡張機能には新しいバージョンの {APP_NAME} が必要です。",
	"EXTENSION_INCOMPATIBLE_OLDER": "この拡張機能は現在、古いバージョンの {APP_NAME} でしか動作しません。",
	"EXTENSION_LATEST_INCOMPATIBLE_NEWER": "この拡張機能のバージョン {0} には {APP_NAME} の新しいバージョンが必要です。ただし、以前のバージョン {1} をインストールすることができます。",
	"EXTENSION_LATEST_INCOMPATIBLE_OLDER": "この拡張機能のバージョン {0} は {APP_NAME} の古いバージョンでのみ動作します。ただし、以前のバージョン {1} をインストールすることができます。",
	"EXTENSION_NO_DESCRIPTION": "説明なし",
	"EXTENSION_MORE_INFO": "詳細情報...",
	"EXTENSION_ERROR": "拡張機能のエラー",
	"EXTENSION_KEYWORDS": "キーワード",
	"EXTENSION_TRANSLATED_USER_LANG": "ご使用の言語を含む {0} 言語に翻訳されました",
	"EXTENSION_TRANSLATED_GENERAL": "{0} 言語に翻訳されました",
	"EXTENSION_TRANSLATED_LANGS": "この拡張機能はこれらの言語に翻訳されています : {0}",
	"EXTENSION_INSTALLED": "インストール完了",
	"EXTENSION_UPDATE_INSTALLED": "この拡張機能のアップデートがダウンロードされました。{APP_NAME} のリロード後にインストールされます。",
	"EXTENSION_SEARCH_PLACEHOLDER": "検索",
	"EXTENSION_MORE_INFO_LINK": "詳細",
	"BROWSE_EXTENSIONS": "拡張機能を探す",
	"EXTENSION_MANAGER_REMOVE": "拡張機能を削除",
	"EXTENSION_MANAGER_REMOVE_ERROR": "1 つ以上の拡張機能 ({0}) を削除できません。{APP_NAME} がリロード中です。",
	"EXTENSION_MANAGER_UPDATE": "拡張機能を更新",
	"EXTENSION_MANAGER_UPDATE_ERROR": "1 つ以上の拡張機能 ({0}) を更新できません。{APP_NAME} がリロード中です。",
	"MARKED_FOR_REMOVAL": "削除予定",
	"UNDO_REMOVE": "取り消し",
	"MARKED_FOR_UPDATE": "更新予定",
	"UNDO_UPDATE": "取り消し",
	"CHANGE_AND_RELOAD_TITLE": "拡張機能を変更",
	"CHANGE_AND_RELOAD_MESSAGE": "更新予定または削除予定の拡張機能を更新または削除するには、{APP_NAME} をリロードする必要があります。未保存の変更を保存するかどうか確認されます。",
	"REMOVE_AND_RELOAD": "拡張機能を削除してリロード",
	"CHANGE_AND_RELOAD": "拡張機能を変更してリロード",
	"UPDATE_AND_RELOAD": "拡張機能を更新してリロード",
	"PROCESSING_EXTENSIONS": "拡張機能の変更を処理中\u2026",
	"EXTENSION_NOT_INSTALLED": "インストールされていなかったため、拡張機能 {0} を削除できませんでした。",
	"NO_EXTENSIONS": "インストールされている拡張機能はまだありません。<br>上の「入手可能」タブをクリックしてインストールしてください。",
	"NO_EXTENSION_MATCHES": "検索条件に一致する拡張機能がありません。",
	"REGISTRY_SANITY_CHECK_WARNING": "注意 : これらの拡張機能の作成元が {APP_NAME} 以外である可能性があります。拡張機能はレビューされず、ローカルアクセス権が一杯です。不明なソースから拡張機能をインストールするときは十分に注意してください。",
	"EXTENSIONS_INSTALLED_TITLE": "インストール済み",
	"EXTENSIONS_AVAILABLE_TITLE": "入手可能",
	"EXTENSIONS_THEMES_TITLE": "テーマ",
	"EXTENSIONS_UPDATES_TITLE": "アップデート",
    
	"INLINE_EDITOR_NO_MATCHES": "一致するものがありません。",
	"CSS_QUICK_EDIT_NO_MATCHES": "選択に一致する既存の CSS ルールがありません。<br>「新規ルール」をクリックしてルールを作成してください。",
	"CSS_QUICK_EDIT_NO_STYLESHEETS": "プロジェクトにはスタイルシートがありません。<br>スタイルシートを作成して CSS ルールに追加してください。",

    // Custom Viewers
	"IMAGE_VIEWER_LARGEST_ICON": "最大",
    
    /**
     * Unit names
     */

	"UNIT_PIXELS": "ピクセル",

    // extensions/default/DebugCommands
	"DEBUG_MENU": "デバッグ",
	"ERRORS": "エラー",
	"CMD_SHOW_DEV_TOOLS": "開発者ツールを表示",
	"CMD_REFRESH_WINDOW": "拡張機能付きでリロード",
	"CMD_RELOAD_WITHOUT_USER_EXTS": "拡張機能なしでリロード",
	"CMD_NEW_BRACKETS_WINDOW": "新しい {APP_NAME} ウィンドウ",
	"CMD_SWITCH_LANGUAGE": "言語を切り替える",
	"CMD_RUN_UNIT_TESTS": "テストを実行",
	"CMD_SHOW_PERF_DATA": "パフォーマンスデータを表示",
	"CMD_ENABLE_NODE_DEBUGGER": "Node Debugger を有効にする",
	"CMD_LOG_NODE_STATE": "Node の状態をコンソールに記録",
	"CMD_RESTART_NODE": "Node を再起動",
	"CMD_SHOW_ERRORS_IN_STATUS_BAR": "ステータスバーにエラーを表示",
	"CMD_OPEN_BRACKETS_SOURCE": "オープン Brackets ソース",
    
	"LANGUAGE_TITLE": "言語を切り替える",
	"LANGUAGE_MESSAGE": "言語 :",
	"LANGUAGE_SUBMIT": "{APP_NAME} をリロード",
	"LANGUAGE_CANCEL": "キャンセル",
	"LANGUAGE_SYSTEM_DEFAULT": "システムのデフォルト",
    
    // extensions/default/InlineTimingFunctionEditor
	"INLINE_TIMING_EDITOR_TIME": "時間",
	"INLINE_TIMING_EDITOR_PROGRESSION": "進行",
	"BEZIER_EDITOR_INFO": "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> 選択したポイントを移動<br><kbd class='text'>Shift</kbd> 10 単位ずつ移動<br><kbd class='text'>Tab</kbd> ポイントを切り替え",
	"STEPS_EDITOR_INFO": "<kbd>↑</kbd><kbd>↓</kbd> 手順を増減<br><kbd>←</kbd><kbd>→</kbd> 「開始」または「終了」",
	"INLINE_TIMING_EDITOR_INVALID": "古い値 <code>{0}</code> が無効なため、表示されている関数は <code>{1}</code> に変更されました。ドキュメントは最初の編集内容で更新されます。",
    
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
	"DETECTED_EXCLUSION_TITLE": "JavaScript ファイルの推論問題",
	"DETECTED_EXCLUSION_INFO": "Brackets で処理中に問題が発生しました : <br><br>{0}<br><br>このファイルはコードヒントとしては処理されず、定義に移動します。これを戻すには、プロジェクトで <code>.brackets.json</code> を開いて jscodehints.detectedExclusions からファイルを削除してください。",
    
    // extensions/default/JSLint
	"JSLINT_NAME": "JSLint",
    
    // extensions/default/QuickView
	"CMD_ENABLE_QUICK_VIEW": "ホバー・クイックビュー",
    
    // extensions/default/RecentProjects
	"CMD_TOGGLE_RECENT_PROJECTS": "最近使用したプロジェクト",
    
    // extensions/default/WebPlatformDocs
	"DOCS_MORE_LINK": "詳細"
});
