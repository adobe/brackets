/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
    "GENERIC_ERROR": "(에러 {0})",
    "NOT_FOUND_ERR": "파일을 찾을 수 없습니다.",
    "NOT_READABLE_ERR": "파일을 읽을 수 없습니다.",
    "NO_MODIFICATION_ALLOWED_ERR": "대상 디렉토리를 변경할 수 없습니다.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE": "파일을 수정할 수있는 권한이 없습니다.",
    "FILE_EXISTS_ERR": "파일 또는 디렉터리가 이미 있습니다.",
    "FILE": "파일",
    "DIRECTORY": "디렉토리",

    // Project error strings
    "ERROR_LOADING_PROJECT": "프로젝트 로드에 실패했습니다",
    "OPEN_DIALOG_ERROR": "'파일 열기' 대화 상자를 표시 하는 중 에러가 발생했습니다. (에러 {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR": "디렉토리 <span class='dialog-filename'>{0}</span>을 읽는 중 에러가 발생했습니다. (에러{1})",
    "READ_DIRECTORY_ENTRIES_ERROR": "디렉토리 <span class='dialog-filename'>{0}</span>의 내용을 읽는 중 에러가 발생했습니다. (에러{1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE": "파일을 열 때 에러가 발생했습니다.",
    "ERROR_OPENING_FILE": "파일 <span class='dialog-filename'>{0}</span>을 열 때 에러가 발생했습니다. {1}",
    "ERROR_OPENING_FILES": "다음의 파일을 열 때 에러가 발생했습니다 :",
    "ERROR_RELOADING_FILE_TITLE": "디스크에서 변경 내용을 다시로드 할 때 에러가 발생했습니다.",
    "ERROR_RELOADING_FILE": "파일 <span class='dialog-filename'>{0}</span>을 다시 읽어 때 에러가 발생했습니다. {1}",
    "ERROR_SAVING_FILE_TITLE": "파일을 저장할 때 에러가 발생했습니다.",
    "ERROR_SAVING_FILE": "파일 <span class='dialog-filename'>{0}</span>을 저장할 때 에러가 발생했습니다. {1}",
    "ERROR_RENAMING_FILE_TITLE": "파일의 이름을 변경하는 동안 에러가 발생했습니다.",
    "ERROR_RENAMING_FILE": "파일 <span class='dialog-filename'>{0}</span>의 이름을 변경할 때 에러가 발생했습니다. {1}",
    "ERROR_DELETING_FILE_TITLE": "파일 삭제 에러",
    "ERROR_DELETING_FILE": "파일을 삭제할 때 에러가 발생했습니다 <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE": "잘못된 {0}이름",
    "INVALID_FILENAME_MESSAGE": "파일 이름에는 다음 문자를 포함 할 수 없습니다: {0} 또는 시스템의 모든 예약어",
    "FILE_ALREADY_EXISTS": "{0} <span class='dialog-filename'>{1}</span>은 이미 존재 합니다.",
    "ERROR_CREATING_FILE_TITLE": "{0}를 만들 때 에러가 발생했습니다",
    "ERROR_CREATING_FILE": "{0} <span class='dialog-filename'>{1}</span>를 만들 때 에러가 발생했습니다.{2}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE": "{APP_NAME} 아직 브라우저에서 실행되지 않습니다.",
    "ERROR_IN_BROWSER": "{APP_NAME}는 HTML로 구축되어 있지만 데스크톱 응용 프로그램으로 실행하여 로컬 파일을 편집 할 수 있습니다. {APP_NAME}을 실행하기 위해 <b>github.com / adobe / brackets-shell</b> 저장소 응용 프로그램 셸을 사용하십시오.",
    
    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE": "파일을 인덱스 하는 동안 에러가 발생했습니다.",
    "ERROR_MAX_FILES": "인덱싱 할 수있는 파일의 최대 수에 도달했습니다. 인덱스에서 파일 검색 기능이 제대로 작동하지 않을 수 있습니다.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE": "브라우저를 시작할 때 에러가 발생했습니다.",
    "ERROR_CANT_FIND_CHROME": "Google Chrome 브라우저를 찾을 수 없습니다. 설치되어 있는지 확인하십시오.",
    "ERROR_LAUNCHING_BROWSER": "브라우저를 시작할 때 에러가 발생했습니다. (에러 {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE": "실시간 미리보기 에러가 발생했습니다.",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE": "브라우저에 연결합니다",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE": "실시간 미리보기에 연결하려면 원격 디버깅을 사용하여 Chrome을 다시 시작해야합니다. <br /> Chrome을 다시 시작하고 원격 디버깅을 사용 하시겠습니까?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE": "실시간 미리보기 페이지를 읽을 수 없습니다.",
    "LIVE_DEV_NEED_HTML_MESSAGE": "실시간 미리보기를 시작하려면 HTML 파일을 열거 나 index.html 파일이 프로젝트에 포함되어 있는지 확인하십시오.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE": "서버 측 파일 실시간 미리보기를 시작하려면이 프로젝트의 기본 URL을 지정해야합니다.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE": "실시간 미리보기에 사용되는 HTTP 서버를 시작할 때 에러가 발생했습니다. 잠시 후 다시 시도하세요.",
    "LIVE_DEVELOPMENT_INFO_TITLE": "실시간 미리보기에 오신 것을 환영합니다",
    "LIVE_DEVELOPMENT_INFO_MESSAGE": "실시간 미리보기에 의해 {APP_NAME}가 브라우저에 연결했습니다. 브라우저에서 HTML 파일이 수정되면 미리보기가 즉시 업데이트됩니다. <br />이 초기 버전의 {APP_NAME}는 <strong> Google Chrome </strong>에서만 실시간 미리보기 기능하고 <strong> CSS 또는 HTML 파일 </strong>의 편집시에만 라이브 업데이트가 이루어집니다. JavaScript 파일에 대한 변경 사항은 저장시 자동으로 다시로드됩니다. <br /> (이 메시지는 한 번만 표시되지 않습니다.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING": "자세한 내용은 <a href='{0}' title='{0}'> Live Development 연결 오류 문제 해결 </a>를 참조하세요.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED": "실시간 미리보기",
    "LIVE_DEV_STATUS_TIP_PROGRESS1": "실시간 미리보기: 연결 중 \u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2": "실시간 미리보기: 초기화 중\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED": "실시간 미리보기가 연결되었습니다.",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC": "실시간 미리보기 (파일을 저장하고 업데이트)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR": "실시간 프리 (구문 오류로 인해 업데이트되지 않습니다)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS": "브라우저의 개발 도구가 열려 있기 때문에 실시간 미리보기가 취소되었습니다뷰.",
    "LIVE_DEV_DETACHED_TARGET_CLOSED": "브라우저에서 페이지가 닫혀 있으므로 실시간 미리보기가 취소되었습니다.",
    "LIVE_DEV_NAVIGATED_AWAY": "브라우저에서 현재 프로젝트에 포함되지 않은 페이지로 이동했기 때문에 실시간 미리보기가 취소되었습니다.",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON": "알 수없는 원인 ({0})에 의해 실시간 미리보기가 취소되었습니다.",
    
    "SAVE_CLOSE_TITLE": "변경 사항을 저장",
    "SAVE_CLOSE_MESSAGE": "문서 <span class='dialog-filename'>{0}</span> 변경 내용을 저장 하시겠습니까?",
    "SAVE_CLOSE_MULTI_MESSAGE": "다음 파일에 대한 변경 사항을 저장 하시겠습니까?",
    "EXT_MODIFIED_TITLE": "외부에서 변경되었습니다.",
    "CONFIRM_FOLDER_DELETE_TITLE": "삭제 확인",
    "CONFIRM_FOLDER_DELETE": "<span class='dialog-filename'>{0}</span> 폴더를 삭제 하시겠습니까?",
    "FILE_DELETED_TITLE": "파일이 삭제되었습니다",
    "EXT_MODIFIED_MESSAGE": "<span class='dialog-filename'>{0}</span>파일에 저장되지 않은 변경 사항이 있습니다. <br /> 두 버전을 유지 하시겠습니까?",
    "EXT_DELETED_MESSAGE": "<span class='dialog-filename'>{0}</span>파일은 삭제되었지만 저장되지 않은 변경 사항이 있습니다. <br /> 변경을 유지 하시겠습니까?",
    
    // Generic dialog/button labels
    "OK": "확인",
    "CANCEL": "취소",
    "DONT_SAVE": "저장하지 않",
    "SAVE": "저장",
    "DELETE": "삭제",
    "BUTTON_YES": "예",
    "BUTTON_NO": "아니오",
    
    // Find, Replace, Find in Files
    "FIND_RESULT_COUNT": "{0} 건",
    "FIND_RESULT_COUNT_SINGLE": "1 건",
    "FIND_NO_RESULTS": "결과 없음",
    "REPLACE_PLACEHOLDER": "\u2026로 치환",
    "BUTTON_REPLACE_ALL": "모두\u2026",
    "BUTTON_REPLACE": "치환",
    "BUTTON_NEXT": "\u25B6",
    "BUTTON_PREV": "\u25C0",
    "BUTTON_NEXT_HINT": "다음 항목으로 이동",
    "BUTTON_PREV_HINT": "이전 항목으로 이동",
    "BUTTON_CASESENSITIVE_HINT": "대소문자 구별",
    "BUTTON_REGEXP_HINT": "정규식",

    "OPEN_FILE": "파일 열기",
    "SAVE_FILE_AS": "다른이름으로 저장",
    "CHOOSE_FOLDER": "폴더 선택",

    "RELEASE_NOTES": "릴리즈 노트",
    "NO_UPDATE_TITLE": "최신버전입니다.",
    "NO_UPDATE_MESSAGE": "{APP_NAME} 최신 버전을 사용중입니다.",

    // Replace All (in single file)
    "FIND_REPLACE_TITLE_PART1": "「",
    "FIND_REPLACE_TITLE_PART2": "」을「",
    "FIND_REPLACE_TITLE_PART3": "」로 치환 &mdash; {2} {0} {1}",

    // Find in Files
    "FIND_IN_FILES_TITLE_PART1": "「",
    "FIND_IN_FILES_TITLE_PART2": "」검색결과",
    "FIND_IN_FILES_TITLE_PART3": "&mdash; {3}개의{4}에서 {1}건{0}{2}",
    "FIND_IN_FILES_SCOPED": "<span class='dialog-filename'>{0}</span> 의",
    "FIND_IN_FILES_NO_SCOPE": "프로젝트",
    "FIND_IN_FILES_FILE": "파일",
    "FIND_IN_FILES_FILES": "파일",
    "FIND_IN_FILES_MATCH": "을 찾았습니다",
    "FIND_IN_FILES_MATCHES": "을 찾았습니다",
    "FIND_IN_FILES_MORE_THAN": "이상",
    "FIND_IN_FILES_PAGING": "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH": "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>",
    "ERROR_FETCHING_UPDATE_INFO_TITLE": "업데이트 정보를 검색하는 중 오류가 발생했습니다.",
    "ERROR_FETCHING_UPDATE_INFO_MSG": "서버에서 최신 업데이트를 검색하는 중 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도하세요.",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING": "프로젝트 여는중\u2026",
    "UNTITLED": "제목없음",
    "WORKING_FILES": "현재 파일",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL": "Ctrl",
    "KEYBOARD_SHIFT": "Shift",
    "KEYBOARD_SPACE": "Space",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION": "행 {0}, 열 {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR": " \u2014 {0} 열을 선택",
    "STATUSBAR_SELECTION_CH_PLURAL": " \u2014 {0} 열을 선택",
    "STATUSBAR_SELECTION_LINE_SINGULAR": " \u2014 {0} 행을 선택",
    "STATUSBAR_SELECTION_LINE_PLURAL": " \u2014 {0} 행을 선택",
    "STATUSBAR_INDENT_TOOLTIP_SPACES": "들여 쓰기를 공백으로 변환",
    "STATUSBAR_INDENT_TOOLTIP_TABS": "들여 쓰기를 탭으로 변환",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES": "들여 쓰기에 사용할 스페이스 수를 변경",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS": "탭 너비를 변경",
    "STATUSBAR_SPACES": "스페이스 :",
    "STATUSBAR_TAB_SIZE": "탭 폭 :",
    "STATUSBAR_LINE_COUNT_SINGULAR": "\u2014 {0} 행",
    "STATUSBAR_LINE_COUNT_PLURAL": "\u2014 {0} 행",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE": "{0} 에러",
    "ERRORS_PANEL_TITLE_SINGLE": "{0} 건의 에러",
    "ERRORS_PANEL_TITLE_MULTI": "Lint 에러",
    "SINGLE_ERROR": "1 개의 {0} 에러",
    "MULTIPLE_ERRORS": "{1} 개의 {0} 에러",
    "NO_ERRORS": "{0} 에러가 없습니다.",
    "LINT_DISABLED": "Lint 검사를 사용할 수 없습니다.",
    "NO_LINT_AVAILABLE": "{0} 사용할 수 있는 Lint 검사기가 없습니다.",
    "NOTHING_TO_LINT": "Lint 검사기로 확인할 파일이 없습니다.",
    
    
    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU": "파일",
    "CMD_FILE_NEW_UNTITLED": "새 파일",
    "CMD_FILE_NEW": "파일 만들기",
    "CMD_FILE_NEW_FOLDER": "폴더 만들기",
    "CMD_FILE_OPEN": "파일 열기\u2026",
    "CMD_ADD_TO_WORKING_SET": "작업세트에 추가",
    "CMD_OPEN_DROPPED_FILES": "드롭한 파일들 열기",
    "CMD_OPEN_FOLDER": "폴더 열기\u2026",
    "CMD_FILE_CLOSE": "닫기",
    "CMD_FILE_CLOSE_ALL": "모두 닫기",
    "CMD_FILE_CLOSE_LIST": "목록 닫기",
    "CMD_FILE_CLOSE_OTHERS": "다른 파일 닫기",
    "CMD_FILE_CLOSE_ABOVE": "위의 목록 닫기",
    "CMD_FILE_CLOSE_BELOW": "아래 목록 닫기",
    "CMD_FILE_SAVE": "저장",
    "CMD_FILE_SAVE_ALL": "모두 저장",
    "CMD_FILE_SAVE_AS": "다른이름으로 저장\u2026",
    "CMD_LIVE_FILE_PREVIEW": "실시간 프리뷰",
    "CMD_PROJECT_SETTINGS": "프로젝트 설정\u2026",
    "CMD_FILE_RENAME": "파일명 변경",
    "CMD_FILE_DELETE": "삭제",
    "CMD_INSTALL_EXTENSION": "확장기능 설치\u2026",
    "CMD_EXTENSION_MANAGER": "확장기능 관리자\u2026",
    "CMD_FILE_REFRESH": "파일트리 업데이트",
    "CMD_QUIT": "종료",
    // Used in native File menu on Windows
    "CMD_EXIT": "종료",

    // Edit menu commands
    "EDIT_MENU": "편집",
    "CMD_UNDO": "되돌리기",
    "CMD_REDO": "재실행",
    "CMD_CUT": "오려두기",
    "CMD_COPY": "복사하기",
    "CMD_PASTE": "붙여넣기",
    "CMD_SELECT_ALL": "전체 선택",
    "CMD_SELECT_LINE": "라인 선택",
    "CMD_FIND": "검색",
    "CMD_FIND_IN_FILES": "파일에서 검색",
    "CMD_FIND_IN_SUBTREE": "검색 대상\u2026",
    "CMD_FIND_NEXT": "다음 검색",
    "CMD_FIND_PREVIOUS": "이건 검색",
    "CMD_REPLACE": "치환",
    "CMD_INDENT": "들여쓰기",
    "CMD_UNINDENT": "내어쓰기",
    "CMD_DUPLICATE": "행 복사",
    "CMD_DELETE_LINES": "행 삭제",
    "CMD_COMMENT": "행 주석처리",
    "CMD_BLOCK_COMMENT": "블록 주석처리",
    "CMD_LINE_UP": "행을 위로 이동",
    "CMD_LINE_DOWN": "행을 아래로 이동",
    "CMD_OPEN_LINE_ABOVE": "상단에 라인 열기",
    "CMD_OPEN_LINE_BELOW": "하단에 라인 열기",
    "CMD_TOGGLE_CLOSE_BRACKETS": "자동 괄호",
    "CMD_SHOW_CODE_HINTS": "코드 힌트를 표시",
    
    // View menu commands
    "VIEW_MENU": "보기",
    "CMD_HIDE_SIDEBAR": "사이드 바 숨기기",
    "CMD_SHOW_SIDEBAR": "사이드 바 표시",
    "CMD_INCREASE_FONT_SIZE": "폰트 크기 키우기",
    "CMD_DECREASE_FONT_SIZE": "폰트 크기 줄이기",
    "CMD_RESTORE_FONT_SIZE": "폰트 크기 초기화",
    "CMD_SCROLL_LINE_UP": "한줄 위로 스크롤",
    "CMD_SCROLL_LINE_DOWN": "한줄 아래로 스크롤",
    "CMD_TOGGLE_LINE_NUMBERS": "행 번호 보이기",
    "CMD_TOGGLE_ACTIVE_LINE": "활성 행 하이라이트",
    "CMD_TOGGLE_WORD_WRAP": "자동 줄내림",
    "CMD_LIVE_HIGHLIGHT": "실시간 프리뷰 하이라이트",
    "CMD_VIEW_TOGGLE_INSPECTION": "저장시 파일 Lint표시",
    "CMD_SORT_WORKINGSET_BY_ADDED": "추가순으로 워킹셋 정렬",
    "CMD_SORT_WORKINGSET_BY_NAME": "이름순으로 워킹셋 정렬",
    "CMD_SORT_WORKINGSET_BY_TYPE": "타입별로 워킹셋 정렬",
    "CMD_SORT_WORKINGSET_AUTO": "자동으로 워킹셋 정렬",

    // Navigate menu Commands
    "NAVIGATE_MENU": "탐색",
    "CMD_QUICK_OPEN": "빠른 열기",
    "CMD_GOTO_LINE": "행으로 이동",
    "CMD_GOTO_DEFINITION": "빠른 정의 검색",
    "CMD_GOTO_FIRST_PROBLEM": "최초의 에러 또는 경고로 이동",
    "CMD_TOGGLE_QUICK_EDIT": "빠른 편집",
    "CMD_TOGGLE_QUICK_DOCS": "빠른 문서",
    "CMD_QUICK_EDIT_PREV_MATCH": "이전 결과로 이동",
    "CMD_QUICK_EDIT_NEXT_MATCH": "다음 결과로 이동",
    "CMD_CSS_QUICK_EDIT_NEW_RULE": "새 규칙",
    "CMD_NEXT_DOC": "다음 문서",
    "CMD_PREV_DOC": "이전 문서",
    "CMD_SHOW_IN_TREE": "파일트리에서 보기",
    "CMD_SHOW_IN_OS": "파일 위치 열기",
    
    // Help menu commands
    "HELP_MENU": "도움말",
    "CMD_CHECK_FOR_UPDATE": "업데이트 확인",
    "CMD_HOW_TO_USE_BRACKETS": "{APP_NAME} 사용 방법",
    "CMD_FORUM": "{APP_NAME} 포럼",
    "CMD_RELEASE_NOTES": "릴리즈 노트",
    "CMD_REPORT_AN_ISSUE": "문제 신고",
    "CMD_SHOW_EXTENSIONS_FOLDER": "확장 기능 폴더 열기",
    "CMD_TWITTER": "Twitter에서 {TWITTER_NAME} 팔로우하기",
    "CMD_ABOUT": "{APP_TITLE} 정보",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD": "시험 빌드",
    "DEVELOPMENT_BUILD": "개발 빌드",
    "RELOAD_FROM_DISK": "디스크에서 다시읽기",
    "KEEP_CHANGES_IN_EDITOR": "편집기에서 변경 내용을 유지",
    "CLOSE_DONT_SAVE": "저장하지 않고 닫기",
    "RELAUNCH_CHROME": "Chrome 재시작",
    "ABOUT": "이 소프트웨어에 대해",
    "CLOSE": "닫기",
    "ABOUT_TEXT_LINE1": "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3": "Notices, terms and conditions pertaining to third party software are located at <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> and incorporated by reference herein.",
    "ABOUT_TEXT_LINE4": "문서와 소스 코드는 <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>에서 구할 수 있습니다.",
    "ABOUT_TEXT_LINE5": "\u2764 및 JavaScript를 사용하여 다음의 사람에 의해 작성되었습니다 :",
    "ABOUT_TEXT_LINE6": "많은 사람들 (단, 인물 데이터 로딩에 문제가 발생하고 있습니다).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS": "Web Platform Docs and the Web Platform graphical logo are licensed under a Creative Commons Attribution license, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP": "{APP_NAME} 새로운 빌드를 사용할 수 있습니다. 자세한 내용은 여기를 클릭하세요.",
    "UPDATE_AVAILABLE_TITLE": "사용 가능한 업데이트가 있습니다",
    "UPDATE_MESSAGE": "{APP_NAME} 새로운 빌드를 사용할 수 있습니다. 새로운 기능의 일부를 다음에 소개합니다 :",
    "GET_IT_NOW": "지금 다운로드",
    "PROJECT_SETTINGS_TITLE": "프로젝트 설정 : {0}",
    "PROJECT_SETTING_BASE_URL": "실시간 프리뷰에 대한 기본 URL",
    "PROJECT_SETTING_BASE_URL_HINT": "http://localhost:8000/ 등의 URL을 입력하여 로컬 서버를 사용",
    "BASEURL_ERROR_INVALID_PROTOCOL": "{0} 프로토콜이 실시간 미리보기가 지원되지 않습니다. http: 또는 https:를 사용하세요.",
    "BASEURL_ERROR_SEARCH_DISALLOWED": "기본 URL에는 「{0}」과 같은 검색어를 사용할 수 없습니다.",
    "BASEURL_ERROR_HASH_DISALLOWED": "기본 URL에는 「{0}」와 같은 해시 기호는 사용할 수 없습니다.",
    "BASEURL_ERROR_INVALID_CHAR": "「{0}」와 같은 특수 문자는 퍼센트로 인코딩해야합니다.",
    "BASEURL_ERROR_UNKNOWN_ERROR": "기본 URL 구문 분석하는 동안 알 수없는 오류가 발생했습니다",
    
    // CSS Quick Edit
    "BUTTON_NEW_RULE": "새 규칙",
    
    // Extension Management strings
    "INSTALL": "설치",
    "UPDATE": "업데이트",
    "REMOVE": "삭제",
    "OVERWRITE": "덮어쓰기",
    "CANT_REMOVE_DEV": "dev 폴더 기능은 수동으로 제거해야합니다.",
    "CANT_UPDATE": "업데이트가 이 버전의 {APP_NAME}과 호환되지 않습니다.",
    "INSTALL_EXTENSION_TITLE": "확장 기능 설치",
    "UPDATE_EXTENSION_TITLE": "확장 기능 업데이트",
    "INSTALL_EXTENSION_LABEL": "확장 기능 URL",
    "INSTALL_EXTENSION_HINT": "확장 기능 zip 파일 또는 GitHub 저장소의 URL",
    "INSTALLING_FROM": "{0}에서 확장 기능을 설치합니다",
    "INSTALL_SUCCEEDED": "설치에 성공했습니다.",
    "INSTALL_FAILED": "설치에 실패했습니다.",
    "CANCELING_INSTALL": "설치 취소중\u2026",
    "CANCELING_HUNG": "설치 취소에 시간이 지연되고 있습니다. 내부 에러가 발생했을 수 있습니다.",
    "INSTALL_CANCELED": "설치가 취소되었습니다.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE": "다운로드 한 콘텐츠가 유효한 zip 파일이 아닙니다.",
    "INVALID_PACKAGE_JSON": "package.json 파일이 유효하지 않습니다 (에러: {0})",
    "MISSING_PACKAGE_NAME": "package.json 파일에 패키지 이름을 지정하지 않았습니다.",
    "BAD_PACKAGE_NAME": "{0} 잘못된 패키지 이름입니다.",
    "MISSING_PACKAGE_VERSION": "package.json 파일에 패키지 버전을 지정하지 않습니다.",
    "INVALID_VERSION_NUMBER": "패키지 버전 번호 ({0})가 잘못되었습니다.",
    "INVALID_BRACKETS_VERSION": "{APP_NAME} 호환 문자열 {0}이 잘못되었습니다.",
    "DISALLOWED_WORDS": "{1} {0} 필드에서는 사용할 수 없습니다.",
    "API_NOT_COMPATIBLE": "확장 기능은이 버전의 {APP_NAME}과 호환되지 않습니다. 잘못된 확장 기능 폴더에 설치됩니다.",
    "MISSING_MAIN": "패키지에 main.js 파일이 포함되어 있지 않습니다.",
    "EXTENSION_ALREADY_INSTALLED": "이 패키지를 설치하면 이전에 설치한 확장 기능이 무시됩니다. 이전 확장을 덮어 쓰시겠습니까?",
    "EXTENSION_SAME_VERSION": "이 패키지 버전은 현재 설치되어있는 버전과 동일합니다. 기존 설치를 겹쳐 쓰시겠습니까?",
    "EXTENSION_OLDER_VERSION": "이 패키지 버전 ({0})는 현재 설치되어있는 버전 ({1})보다 이전 버전입니다. 기존 설치를 겹쳐 쓰시겠습니까?",
    "DOWNLOAD_ID_IN_USE": "내부 에러: 이미 사용 중인 다운로드 ID 입니다.",
    "NO_SERVER_RESPONSE": "서버에 연결할 수 없습니다.",
    "BAD_HTTP_STATUS": "파일 서버 (HTTP {0})에 찾을 수 없습니다.",
    "CANNOT_WRITE_TEMP": "임시 다운로드 파일을 저장할 수 없습니다.",
    "ERROR_LOADING": "확장 기능 시작 중 오류가 발생했습니다",
    "MALFORMED_URL": "URL이 잘못되었습니다. 제대로 입력되어 있는지 확인하세요.",
    "UNSUPPORTED_PROTOCOL": "URL은 http 또는 https URL이어야합니다.",
    "UNKNOWN_ERROR": "알 수 없는 내부 에러.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE": "확장기능 관리자",
    "EXTENSION_MANAGER_ERROR_LOAD": "확장 기능 레지스트리에 액세스 할 수 없습니다. 나중에 다시 시도하십시오.",
    "INSTALL_FROM_URL": "URL에서 설치\u2026",
    "EXTENSION_AUTHOR": "제작자",
    "EXTENSION_DATE": "제작일",
    "EXTENSION_INCOMPATIBLE_NEWER": "이 확장 기능은 새 버전의 {APP_NAME}이 필요합니다.",
    "EXTENSION_INCOMPATIBLE_OLDER": "이 확장 기능은 현재 이전 버전의 {APP_NAME}에서 작동하지 않습니다.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER": "이 확장 기능 버전 {0}에는 {APP_NAME}의 새 버전이 필요합니다. 그러나 이전 버전 {1}을 설치할 수 있습니다.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER": "이 확장 기능 버전 {0} {APP_NAME}의 이전 버전에서만 작동합니다. 그러나 이전 버전 {1}을 설치할 수 있습니다.",
    "EXTENSION_NO_DESCRIPTION": "설명 없음",
    "EXTENSION_MORE_INFO": "추가정보...",
    "EXTENSION_ERROR": "확장기능 에러",
    "EXTENSION_KEYWORDS": "키워드",
    "EXTENSION_INSTALLED": "설치 완료",
    "EXTENSION_UPDATE_INSTALLED": "이 확장 기능 업데이트가 다운로드되었습니다. {APP_NAME}를 종료 할 때 설치합니다.",
    "EXTENSION_SEARCH_PLACEHOLDER": "검색",
    "EXTENSION_MORE_INFO_LINK": "상세정보",
    "BROWSE_EXTENSIONS": "확장기능 찾기",
    "EXTENSION_MANAGER_REMOVE": "확장기능 제거",
    "EXTENSION_MANAGER_REMOVE_ERROR": "하나 이상의 확장 기능을 ({0})를 제거 할 수 없습니다. {APP_NAME}가 종료 중입니다.",
    "EXTENSION_MANAGER_UPDATE": "확장기능 업데이트",
    "EXTENSION_MANAGER_UPDATE_ERROR": "하나 이상의 확장 기능을 ({0})를 업데이트 할 수 없습니다. {APP_NAME}가 종료 중입니다.",
    "MARKED_FOR_REMOVAL": "삭제 예정",
    "UNDO_REMOVE": "삭제 취소",
    "MARKED_FOR_UPDATE": "업데이트 예정",
    "UNDO_UPDATE": "취소",
    "CHANGE_AND_QUIT_TITLE": "확장기능 변경",
    "CHANGE_AND_QUIT_MESSAGE": "업데이트 예정 또는 삭제 예정 확장 기능을 업데이트하거나 삭제하려면 {APP_NAME}를 재시작해야합니다. 저장되지 않은 변경 내용은 저장여부를 확인합니다.",
    "REMOVE_AND_QUIT": "확장기능을 제거하고 종료",
    "CHANGE_AND_QUIT": "확장기능을 변경하고 종료",
    "UPDATE_AND_QUIT": "확장기능을 업데이트하고 종료",
    "EXTENSION_NOT_INSTALLED": "설치되지 않았기 때문에 확장 {0}을 삭제할 수 없습니다.",
    "NO_EXTENSIONS": "설치되어있는 확장 기능이 아직 없습니다. <br>에서 「설치가능」탭을 클릭하여 설치하세요.",
    "NO_EXTENSION_MATCHES": "검색 조건에 일치하는 확장 기능이 없습니다.",
    "REGISTRY_SANITY_CHECK_WARNING": "알 수없는 소스에서 확장 기능을 설치할 때 주의하세요.",
    "EXTENSIONS_INSTALLED_TITLE": "설치됨",
    "EXTENSIONS_AVAILABLE_TITLE": "설치가능",
    "EXTENSIONS_UPDATES_TITLE": "업데이트",
    
    "INLINE_EDITOR_NO_MATCHES": "일치하는 항목이 없습니다.",
    "CSS_QUICK_EDIT_NO_MATCHES": "선택 일치하는 기존 CSS 규칙이 없습니다. <br> 「새 규칙」을 클릭하여 규칙을 작성하세요.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS": "프로젝트에는 스타일 시트가 없습니다. <br> 스타일 시트를 작성하여 CSS 규칙에 추가하세요.",
    
    /**
     * Unit names
     */

    "UNIT_PIXELS": "픽셀",

    // extensions/default/DebugCommands
    "DEBUG_MENU": "디버깅",
    "CMD_SHOW_DEV_TOOLS": "개발자 도구 보기",
    "CMD_REFRESH_WINDOW": "{APP_NAME} 재시작",
    "CMD_NEW_BRACKETS_WINDOW": "새로운 {APP_NAME}창",
    "CMD_SWITCH_LANGUAGE": "프로그래밍 언어 변경",
    "CMD_RUN_UNIT_TESTS": "테스트 실행",
    "CMD_SHOW_PERF_DATA": "성능 데이터를 표시",
    "CMD_ENABLE_NODE_DEBUGGER": "Node Debugger 사용",
    "CMD_LOG_NODE_STATE": "Node 상태를 콘솔에 기록",
    "CMD_RESTART_NODE": "Node를 다시 시작",
    
    "LANGUAGE_TITLE": "언어 변경",
    "LANGUAGE_MESSAGE": "언어 :",
    "LANGUAGE_SUBMIT": "{APP_NAME} 재시작",
    "LANGUAGE_CANCEL": "취소",
    "LANGUAGE_SYSTEM_DEFAULT": "시스템 언어",
    
    // Locales (used by Debug > Switch Language)
    "LOCALE_CS": "체코어",
    "LOCALE_DE": "독일어",
    "LOCALE_EN": "영어",
    "LOCALE_ES": "스페인어",
    "LOCALE_FI": "핀란드어",
    "LOCALE_FR": "프랑스어",
    "LOCALE_IT": "이탈리아어",
    "LOCALE_JA": "일본어",
    "LOCALE_NB": "노르웨이어",
    "LOCALE_NL": "네덜란드어",
    "LOCALE_FA_IR": "페르시아어-파르어",
    "LOCALE_PL": "폴란드어",
    "LOCALE_PT_BR": "포르투갈어(브라질)",
    "LOCALE_PT_PT": "포르투갈어",
    "LOCALE_RO": "루마니아어",
    "LOCALE_RU": "러시아어",
    "LOCALE_SK": "슬로바키아어",
    "LOCALE_SR": "세르비아어",
    "LOCALE_SV": "스웨덴어",
    "LOCALE_TR": "터키어",
    "LOCALE_ZH_CN": "중국어 (간체)",
    "LOCALE_HU": "헝가리어",
    "LOCALE_KO": "한국어",

    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME": "시간",
    "INLINE_TIMING_EDITOR_PROGRESSION": "진행",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP": "현재색",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP": "원본색",
    "COLOR_EDITOR_RGBA_BUTTON_TIP": "RGBa 형식",
    "COLOR_EDITOR_HEX_BUTTON_TIP": "16 진수",
    "COLOR_EDITOR_HSLA_BUTTON_TIP": "HSLa 형식",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR": "{0} ({1} 시간 사용)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL": "{0} ({1} 시간 사용)",
    
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION": "정의로 이동",
    "CMD_SHOW_PARAMETER_HINT": "파라메터 정보를 표시",
    "NO_ARGUMENTS": "<매개변수가 없습니다>",
    
    // extensions/default/JSLint
    "JSLINT_NAME": "JSLint",
    
    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW": "QuickView 사용",
    
    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS": "최근에 사용한 프로젝트",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK": "상세정보"
});
