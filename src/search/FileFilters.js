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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, window, Mustache */

/**
 * Utilities for managing file-set filters, as used in Find in Files.
 * Includes both UI for selecting/editing filters, as well as the actual file-filtering implementation.
 */
define(function (require, exports, module) {
    "use strict";
    
    var _ = require("thirdparty/lodash"),
        DefaultDialogs = require("widgets/DefaultDialogs"),
        Dialogs = require("widgets/Dialogs"),
        StringUtils = require("utils/StringUtils"),
        Strings = require("strings");
    
    /**
     * Each filter is a single string composed of one or more \n-separated glob strings.
     * @return {!Array.<string>}
     */
    function getFilters() {
        // FIXME: hook up to preferences
        return [
            "node_modules",
            "node_modules\n*.ttf\njquery-ui"
        ];
    }
    
    
    function editFilter(filter) {
        var globInfoURL = "https://github.com/adobe/brackets/wiki/How-to-Use-Brackets";  // FIXME: link to a dedicated wiki page
        var html = StringUtils.format(Strings.FILE_FILTER_INSTRUCTIONS, globInfoURL) +
            "<textarea class='exclusions-editor'></textarea>";
        var buttons = [
            { className : Dialogs.DIALOG_BTN_CLASS_PRIMARY, id: Dialogs.DIALOG_BTN_OK, text: Strings.OK },
            { className : Dialogs.DIALOG_BTN_CLASS_NORMAL, id: Dialogs.DIALOG_BTN_CANCEL, text: Strings.CANCEL }
        ];
        var dialog = Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_INFO, "Edit Filter", html, buttons);
        
        dialog.getElement().find(".exclusions-editor").val(filter);
        
        return dialog.getPromise();
    }
    
    
    function populateDropdown($select) {
        $select.empty();
        
        function addOption(filter, label) {
            var $option = $("<option/>");
            $option.text(label);
            if (filter !== undefined) {
                $option.data("filter", filter);
            }
            
            $select.append($option);
        }
        
        addOption("", Strings.NO_FILE_FILTER);
        
        getFilters().forEach(function (filter) {
            var segments = filter.split("\n");
            
            if (segments.length > 2) {
                addOption(filter, Strings.FILE_FILTER_LIST_PREFIX + " " + segments[0] + ", " + segments[1] + " " +
                                  StringUtils.format(Strings.FILE_FILTER_CLIPPED_SUFFIX, segments.length - 2));
            } else {
                addOption(filter, Strings.FILE_FILTER_LIST_PREFIX + " " + segments.join(", "));
            }
        });
        
        addOption(undefined, Strings.EDIT_FILE_FILTER);
        
        function selectedOption() {
            return $($select[0].selectedOptions[0]);
        }
        
        var $lastSelected = selectedOption();
        
        $select.on("change", function () {
            var $selected = selectedOption();
            if ($selected.data("filter") === undefined) {
                editFilter($lastSelected.data("filter"));
            } else {
                $lastSelected = $selected;
            }
        });
    }
    
    
    exports.populateDropdown = populateDropdown;
    exports.getFilters = getFilters;
    exports.editFilter = editFilter;
});
