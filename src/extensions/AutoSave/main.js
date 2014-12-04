/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

/** Simple extension that adds a "File > Hello World" menu item */
define(function (require, exports, module) {
    "use strict";

    var CommandManager = brackets.getModule("command/CommandManager");
    var Menus = brackets.getModule("command/Menus");
    var DocumentManager = brackets.getModule("document/DocumentManager");
    var PreferencesManager = brackets.getModule("preferences/PreferencesManager");
    var ProjectManager = brackets.getModule("project/ProjectManager");
    var FileSystem = brackets.getModule("filesystem/FileSystem");

    //Variables for AutoSaving

    function save(){
        var autoDir = ProjectManager.getFeature("autoDir");
        alert(autoDir);
        //Get Current Document's Text
        var name = DocumentManager.getCurrentDocument().file.fullPath.split("/").pop();
        alert(name);
        var text = DocumentManager.getCurrentDocument().getText();
        alert(text);

        //Create a new file
        var new_file = FileSystem.getFileForPath(autoDir + "/" + name);
        alert(new_file);
        new_file.write(text);
    }

    // Function to run when the menu item is clicked
    function startAutoSave() {
        var autoSave = ProjectManager.getFeature("autoSave");
        var autoInt = ProjectManager.getFeature("autoInt");
        //alert('hello');
        //alert(autoSave);
        //alert(autoInt);
        //alert(autoDir);
        if (autoSave && autoInt != null){
          save();
          setInterval(save, autoInt);
        } else {
          alert('AutoSave not enabled in project settings');
        }
    }




    // First, register a command - a UI-less object associating an id to a handler
    var MY_COMMAND_ID = "helloworld.sayhello";   // package-style naming to avoid collisions
    CommandManager.register("Auto Save", MY_COMMAND_ID, startAutoSave);

    // Then create a menu item bound to the command
    // The label of the menu item is the name we gave the command (see above)
    var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
    menu.addMenuItem(MY_COMMAND_ID);

    // We could also add a key binding at the same time:
    //menu.addMenuItem(MY_COMMAND_ID, "Ctrl-Alt-H");
    // (Note: "Ctrl" is automatically mapped to "Cmd" on Mac)
});
