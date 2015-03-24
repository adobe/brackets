/**
 * Browser shim for Brackets AppShell API.  See:
 *   https://github.com/adobe/brackets-shell
 *   https://github.com/adobe/brackets-shell/blob/adf27a65d501fae71cc6d8905d6dc3d9460208a9/appshell/appshell_extensions.js
 *   http://www.hyperlounge.com/blog/hacking-the-brackets-shell/
 */

(function(global, navigator) {

  var startupTime = Date.now();
  function getElapsedMilliseconds() {
    return (Date.now()) - startupTime;
  }

  function functionNotImplemented() {
    throw "Function not (yet) implemented in browser-appshell.";
  }

  // Provide an implementation of appshell.app as expected by src/utils/Global.js
  // and other parts of the code.
  var appshell = global.appshell = global.appshell || {};

  appshell.app = {
    ERR_NODE_FAILED: -3,
    ERR_NODE_NOT_YET_STARTED: -1,
    ERR_NODE_PORT_NOT_YET_SET: -2,
    NO_ERROR: 0,

    // TODO: deal with getter *and* setter
    language: navigator.language,

    abortQuit: function() {
      functionNotImplemented();
    },
    addMenu: function(title, id, position, relativeId, callback) {
      functionNotImplemented();
    },
    addMenuItem: function(parentId, title, id, key, displayStr, position, relativeId, callback) {
      functionNotImplemented();
    },
    closeLiveBrowser: function(callback) {
      functionNotImplemented();
    },
    dragWindow: function() {
      functionNotImplemented();
    },
    getApplicationSupportDirectory: function() {
      return '/ApplicationSupport';
    },
    getDroppedFiles: function(callback) {
      functionNotImplemented();
    },
    getElapsedMilliseconds: getElapsedMilliseconds,
    getMenuItemState: function(commandid, callback) {
      functionNotImplemented();
    },
    getMenuPosition: function(commandId, callback) {
      functionNotImplemented();
    },
    getMenuTitle: function(commandid, callback) {
      functionNotImplemented();
    },
    getPendingFilesToOpen: function(callback) {
      // No files are passed to the app on startup, unless we want to support
      // URL based params with a list. For now return an empty array.
      callback(null, []);
    },
    getRemoteDebuggingPort: function() {
      functionNotImplemented();
    },
    getUserDocumentsDirectory: function() {
      functionNotImplemented();
    },
    openLiveBrowser: function(url, enableRemoteDebugging, callback) {
      functionNotImplemented();
    },
    openURLInDefaultBrowser: function(url, callback) {
      global.open(url);
      callback();
    },
    quit: function() {
      functionNotImplemented();
    },
    removeMenu: function(commandId, callback) {
      functionNotImplemented();
    },
    removeMenuItem: function(commandId, callback) {
      functionNotImplemented();
    },
    setMenuItemShortcut: function(commandId, shortcut, displayStr, callback) {
      functionNotImplemented();
    },
    setMenuItemState: function(commandid, enabled, checked, callback) {
      functionNotImplemented();
    },
    setMenuTitle: function(commandid, title, callback) {
      functionNotImplemented();
    },
    showDeveloperTools: function() {
      functionNotImplemented();
    },
    showExtensionsFolder: function(appURL, callback) {
      functionNotImplemented();
    },
    showOSFolder: function(path, callback) {
      functionNotImplemented();
    },

    // https://github.com/adobe/brackets-shell/blob/959836be7a3097e2ea3298729ebd616247c83dce/appshell/appshell_node_process.h#L30
    getNodeState: function(callback) {
      callback(/* BRACKETS_NODE_FAILED = -3 */ -3);
    }
  };

  global.brackets = appshell;

}(window, window.navigator));
