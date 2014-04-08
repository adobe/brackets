/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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
/*global define, $, PathUtils, Mustache */

/**
 * PreferencesViewer
 *
 */
define(function (require, exports, module) {
    "use strict";

    var _                               = require("thirdparty/lodash"),
        CommandManager                  = require("command/CommandManager"),
        Commands                        = require("command/Commands"),
        Dialogs                         = require("widgets/Dialogs"),
        DefaultDialogs                  = require("widgets/DefaultDialogs"),
        EditorManager                   = require("editor/EditorManager"),
        PreferencesManager              = require("preferences/PreferencesManager"),
        Strings                         = require("strings"),
        PreferencesViewerTemplate       = require("text!htmlContent/preferences-viewer.html"),
        PreferencesViewerPartsTemplate  = require("text!htmlContent/preferences-viewer-parts.html"),
        PreferencesViewerDialogTemplate = require("text!htmlContent/preferences-viewer-dialog.html");

    var extensions,
        mainPrefs;

    // convienience method to display a name even for those who don't have it defined
    function _getPreferenceName(pref, includeExtInfo) {
        var name = pref.name || (pref.idPrefix ? pref.id.substring(pref.idPrefix.length) : pref.id);
        if (includeExtInfo && pref.idPrefix) {
            name = pref.idPrefix.slice(0, -1) + " \u2014 " + name;
        }
        return name;
    }

    function _toggleValid($el, validBool, message) {
        $el.toggleClass("validation-error", !validBool);
        if (validBool) {
            $el.removeAttr("title");
        } else {
            $el.attr("title", message);
        }
    }

    function _validateElement($el, pref) {
        var val = $el.val(),
            valid = true;

        if (pref.validator) {
            valid = pref.validator(val);
        }

        var msg = "Value invalid!";
        if (pref.description) {
            msg += " (" + pref.description + ")";
        }
        if (typeof valid !== "boolean") {
            msg = valid;
            valid = false;
        }

        _toggleValid($el, valid, msg);
        return valid;
    }

    function openDialog(pref) {
        var compiledTemplate = Mustache.render(PreferencesViewerDialogTemplate, {
            title: _getPreferenceName(pref, true),
            template: pref.template,
            Strings: Strings
        });

        var dialog = Dialogs.showModalDialogUsingTemplate(compiledTemplate),
            $dialog = dialog.getElement(),
            $textarea = $dialog.find("textarea"),
            $okBtn = $dialog.find("button[data-button-id='ok']");

        $okBtn.on("click", function (event) {
            if (!pref.template) {

                var newVal = $textarea.val();
                try {
                    JSON.parse(newVal);
                } catch (e) {
                    _toggleValid($textarea, false, e);
                    event.stopPropagation();
                    return;
                }
                var valid = _validateElement($textarea, pref);
                if (!valid) {
                    event.stopPropagation();
                    return;
                }

            } else {
                // TODO:
            }

        });

        dialog.done(function (buttonId) {
            if (buttonId === "ok") {
                // TODO: validated successfully
            }
        });

        if (!pref.template) {
            $textarea.val(JSON.stringify(PreferencesManager.get(pref.id), null, 4));
        } else {
            // TODO:
        }
    }

    function initVars() {
        // get all extensions that called getExtensionPrefs
        extensions = PreferencesManager.getExtensions();

        // setup an array for brackets preferences
        mainPrefs = {preferences: [], groups: {}};
        function pushToPrefObj(pref, prefObj) {
            var group = pref.group;
            if (group) {
                if (!prefObj.groups[group]) { prefObj.groups[group] = []; }
                prefObj.groups[group].push(pref);
            } else {
                prefObj.preferences.push(pref);
            }
        }

        // iterate all defined preferences
        PreferencesManager.getKnownPreferences().forEach(function (id) {

            // we should take care not to modify anything on pref
            var pref = PreferencesManager.getPreference(id);

            var ext;
            if (pref.idPrefix) {
                // find if this preference starts with an extension id
                ext = _.find(extensions, function (ext) {
                    return id.indexOf(ext.id + ".") === 0;
                });
            }

            // assign preference to appropriate extension or global
            if (!ext) {
                pushToPrefObj(pref, mainPrefs);
            } else {
                ext.prefsObj = ext.prefsObj || {preferences: [], groups: {}};
                pushToPrefObj(pref, ext.prefsObj);
            }

        });

        // prepare for Mustache
        var convertGroup = function (group, groupName) {
            return { name: groupName, preferences: group };
        };
        mainPrefs.groups = _.map(mainPrefs.groups, convertGroup);
        _.each(extensions, function (ext) {
            if (ext.prefsObj) {
                ext.prefsObj.groups = _.map(ext.prefsObj.groups, convertGroup);
            }
        });

        // sort extensions by name and mark those who have been uninstalled
        extensions = _.sortBy(_.compact(_.map(extensions, function (extensionInfo, id) {
            if (extensionInfo.active) {

                if (!extensionInfo.prefsObj) {
                    return;
                }
                return {
                    id: id,
                    name: extensionInfo.name || id,
                    prefsObj: extensionInfo.prefsObj
                };

            } else {

                return {
                    id: id,
                    name: extensionInfo.name || id,
                    removed: true
                };

            }
        })), "name");
    }

    function attachEvents($view) {
        // activate tabs
        $view.find(".nav-tabs a").on("click", function (e) {
            e.preventDefault();
            $(this).tab("show");
        });

        // set values and attach validators
        $view.find("*[name]").each(function () {
            var $this = $(this),
                id = $this.attr("name"),
                value = PreferencesManager.get(id);

            var pref = PreferencesManager.getPreference(id);
            $this.off("change.validator").removeClass("validation-error");
            if (pref.validator) {
                $this.on("change.validator", function () {
                    _validateElement($(this), pref);
                });
            }

            if ($this.attr("type") === "checkbox") {
                $this.prop("checked", value);
            } else {
                $this.val(value);
            }
        });

        $view.on("click", "button.object-editor", function (e) {
            e.preventDefault();

            var id = $(e.target).attr("name"),
                pref = PreferencesManager.getPreference(id);
            openDialog(pref);
        });

        $view.on("click", "button[data-button-id='save']", function (e) {
            e.preventDefault();
            alert("save!");
        });

        $view.on("click", "button[data-button-id='cancel']", function (e) {
            e.preventDefault();
            CommandManager.execute(Commands.NAVIGATE_PREV_DOC);
        });
    }

    function renderView() {
        var parts = PreferencesViewerPartsTemplate.split("======").reduce(function (obj, part) {
            if (part.trim().length === 0) {
                return obj;
            }
            var m = part.match(/\S+/);
            if (m) {
                var key = m[0];
                part = part.substring(key.length).trim();
                obj[key] = part;
            }
            return obj;
        }, {});

        var templateVars = {
            MainPrefs       : mainPrefs,
            Extensions      : extensions,
            Strings         : Strings,
            getPrefTemplate : function () {
                var template = parts[this.type];
                if (!template) { template = parts.other; }
                return Mustache.render(template, {
                    id: this.id,
                    name: _getPreferenceName(this),
                    description: this.description || ""
                });
            }
        };

        var compiledTemplate = Mustache.render(PreferencesViewerTemplate, templateVars);
        var $view = $(compiledTemplate);
        attachEvents($view);
        return $view;
    }

    function render(fullPath, $editorHolder) {
        initVars();
        return renderView().appendTo($editorHolder);
    }

    function onRemove() {
        return;
    }

    function showPreferencesViewer() {
        EditorManager._showCustomViewer(exports, Strings.SETTINGS);
    }

    // Command
    CommandManager.register(Strings.CMD_SETTINGS, Commands.FILE_SETTINGS, showPreferencesViewer);

    // Public API
    exports.render = render;
    exports.onRemove = onRemove;
});
