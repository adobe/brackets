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

    var _                             = require("thirdparty/lodash"),
        CommandManager                = require("command/CommandManager"),
        Commands                      = require("command/Commands"),
        EditorManager                 = require("editor/EditorManager"),
        PreferencesManager            = require("preferences/PreferencesManager"),
        Strings                       = require("strings"),
        SettingsDialogTemplate        = require("text!htmlContent/preferences-viewer.html"),
        SettingsDialogTemplateParts   = require("text!htmlContent/preferences-viewer-parts.html");

    var extensions,
        mainPrefs;

    function initVars() {
        // get all extensions that called getExtensionPrefs
        extensions = PreferencesManager.getExtensions();

        // setup an array for brackets preferences
        mainPrefs = {preferences: [], groups: {}};
        function pushToPrefObj(what, which) {
            var group = what.group;
            if (group) {
                if (!which.groups[group]) { which.groups[group] = []; }
                which.groups[group].push(what);
            } else {
                which.preferences.push(what);
            }
        }

        // iterate all defined preferences
        PreferencesManager.getKnownPreferences().forEach(function (key) {
            var pref = PreferencesManager.getPreference(key);
            // find if this preference starts with an extension id
            var ext = _.find(extensions, function (ext) {
                return key.indexOf(ext.id + ".") === 0;
            });
            // assign preference to appropriate extension or global
            pref.fullKey = key;
            if (!ext) {
                pref.key = key;
                pushToPrefObj(pref, mainPrefs);
            } else {
                ext.prefsObj = ext.prefsObj || {preferences: [], groups: {}};
                pref.key = key.substring(ext.id.length + 1);
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
                key = $this.attr("name"),
                value = PreferencesManager.get(key);

            var pref = PreferencesManager.getPreference(key);
            $this.off("change.validator").removeClass("validation-error");
            if (pref.validator) {
                $this.on("change.validator", function () {
                    var $this = $(this),
                        val = $this.val(),
                        valid = pref.validator(val);

                    var msg = "Value invalid!";
                    if (typeof valid !== "boolean") {
                        msg = valid;
                        valid = false;
                    }

                    $this.toggleClass("validation-error", !valid);
                    if (valid) {
                        $this.removeAttr("title");
                    } else {
                        $this.attr("title", msg);
                    }
                });
            }

            if ($this.attr("type") === "checkbox") {
                $this.prop("checked", value);
            } else {
                $this.val(value);
            }
        });

        $view.find("button[data-button-id='save']").on("click", function (id) {
            alert("save!");
        });

        $view.find("button[data-button-id='cancel']").on("click", function (id) {
            EditorManager._closeCustomViewer();
        });
    }

    function renderView() {
        var parts = SettingsDialogTemplateParts.split("======").reduce(function (obj, part) {
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
                    key: this.fullKey,
                    name: this.name || this.key,
                    description: this.description || ""
                });
            }
        };

        var compiledTemplate = Mustache.render(SettingsDialogTemplate, templateVars);
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
