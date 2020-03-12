/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

define(function (require, exports, module) {
    "use strict";


    var PreferencesManager   = brackets.getModule("preferences/PreferencesManager"),
        Strings              = brackets.getModule("strings"),
        ProjectManager       = brackets.getModule("project/ProjectManager"),
        Dialogs              = brackets.getModule("widgets/Dialogs"),
        DefaultDialogs       = brackets.getModule("widgets/DefaultDialogs");


    var _requestID = 0,
        _initialized = false;

    var _graphicsFileTypes = ["jpg", "jpeg", "png", "svg", "xd", "psd", "ai"];
    //var _graphicsFileTypes = [ "psd"];

    var _nodeDomain;

    function init(nodeDomain) {

        if(_initialized) {
            return;
        }
        _initialized = true;

        _nodeDomain = nodeDomain;

        _nodeDomain.on('checkFileTypesInFolderResponse', function (event, response) {
            if(response.id !== _requestID) {
                return;
            }
            _graphicsFilePresentInProject(response.present);
        });

        ProjectManager.on("projectOpen", function () {
            _checkForGraphicsFileInPrjct();
        });

        _checkForGraphicsFileInPrjct();

    }


    function _checkForGraphicsFileInPrjct() {

        if(PreferencesManager.getViewState("AssociateGraphicsFileDialogShown")) {
            return;
        }

        _nodeDomain.exec("checkFileTypesInFolder", {
            extensions: _graphicsFileTypes.join(),
            folder: ProjectManager.getProjectRoot().fullPath,
            reqId: ++_requestID
        });

    }

    function _graphicsFilePresentInProject(isPresent) {

        if(!isPresent) {
            return;
        }

        Dialogs.showModalDialog(
            DefaultDialogs.DIALOG_ID_INFO,
            Strings.ASSOCIATE_GRAPHICS_FILE_TO_DEFAULT_APP_TITLE,
            Strings.ASSOCIATE_GRAPHICS_FILE_TO_DEFAULT_APP_MSG,
            [
                { className: Dialogs.DIALOG_BTN_CLASS_NORMAL, id: Dialogs.DIALOG_BTN_CANCEL,
                    text: Strings.BUTTON_NO
                },
                { className: Dialogs.DIALOG_BTN_CLASS_PRIMARY, id: Dialogs.DIALOG_BTN_OK,
                    text: Strings.BUTTON_YES
                }
            ]
        ).done(function (id) {
            
            if(id !== Dialogs.DIALOG_BTN_OK) {
                return;
            }

            brackets.app.getSystemDefaultApp(_graphicsFileTypes.join(), function (err, out) {
                var associateApp = out.split(','),
                    fileTypeToAppMap = {};

                associateApp.forEach(function(item) {
                    fileTypeToAppMap[item.split(':')[0]] = item.split(':')[1];
                });
                Dialogs.showModalDialog(
                    DefaultDialogs.DIALOG_ID_INFO,
                    Strings.ASSOCIATE_GRAPHICS_FILE_TO_DEFAULT_APP_TITLE,
                    out,
                    [
                        { className: Dialogs.DIALOG_BTN_CLASS_NORMAL, id: Dialogs.DIALOG_BTN_CANCEL,
                            text: Strings.BUTTON_NO
                        },
                        { className: Dialogs.DIALOG_BTN_CLASS_PRIMARY, id: Dialogs.DIALOG_BTN_OK,
                            text: Strings.BUTTON_YES
                        }
                    ]
                );
            });
        });
        PreferencesManager.setViewState("AssociateGraphicsFileDialogShown", true);

    }

    exports.init = init;

});
