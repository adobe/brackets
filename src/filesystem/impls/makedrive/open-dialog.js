/*global define, $, brackets, Mustache, console */
define(function (require, exports, module) {
  "use strict";

  var _ = require("thirdparty/lodash");
  var Dialogs = require("widgets/Dialogs");
  var FileSystem = require("filesystem/FileSystem");
  var ViewUtils = brackets.getModule("utils/ViewUtils");
  var openDialog = require("text!filesystem/impls/makedrive/open-dialog.html");

  var nodeId = 0;

  function fileToTreeJSON(file) {
    var json = {
      data: file.name,
      attr: { id: "node" + nodeId++ },
      metadata: {
        file: file
      }
    };

    if (file.isDirectory) {
      json.children = [];
      json.state = "closed";
      json.data = _.escape(json.data);
    } else {
      json.data = ViewUtils.getFileEntryDisplay(file);
    }

    return json;
  }

  // TODO: support all args here
  function showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {

    function initializeEventHandlers($dialog) {
      $dialog.find(".dialog-button[data-button-id='cancel']")
        .on("click", closeModal);

      $(window).on('keydown.makedrive', function (event) {
        if (event.keyCode === 27) {
          closeModal();
        }
      });

      $dialog.find(".dialog-button[data-button-id='open']").on("click", function () {
        var paths = $dialog.find('.jstree-clicked')
          .closest('li')
          .map(function() {
            return $(this).data().file.fullPath;
          })
          .get();

        if (!paths.length) { return; }

        closeModal();
        callback(null, paths);
      });
    }

    function fileTreeDataProvider($tree, callback) {
      var directory;

      // $tree is -1 when requesting the root
      if ($tree === -1) {
        directory = FileSystem.getDirectoryForPath(initialPath);
      } else {
        directory = $tree.data('file');
      }

      directory.getContents(function(err, files) {
        var json = files.map(fileToTreeJSON);
        callback(json);
      });
    }

    function handleFileDoubleClick(event) {
      var file = $(event.target).closest('li').data('file');

      if (file && file.isFile) {
        callback(null, [file.fullPath]);
        closeModal();
      }
    }

    function closeModal() {
      if(dialog) {
        dialog.close();
      }
    }

    var data = {
      title: title,
      cancel: "Cancel",
      open: "Open"
    };

    var dialog = Dialogs.showModalDialogUsingTemplate(Mustache.render(openDialog, data), false);

    var $dialog = $(".makedrive.instance");

    initializeEventHandlers($dialog);

    var $container = $dialog.find('.open-files-container');

    var jstree = $container.jstree({
      plugins: ["ui", "themes", "json_data", "crrm"],
      json_data: {
        data: fileTreeDataProvider,
        correct_state: false },
      core: {
        html_titles: true,
        animation: 0,
        strings : {
          loading : "Loading",
          new_node : "New node"
        }
      },
      themes: {
        theme: "brackets",
        url: "styles/jsTreeTheme.css",
        dots: false,
        icons: false
      }
    });

    jstree.on('dblclick.jstree', handleFileDoubleClick);
  }

  exports.showOpenDialog = showOpenDialog;

});
