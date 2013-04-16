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

/*
 * N.B.: This file was copied from `lib/registry_utils.js` in `https://github.com/adobe/brackets-registry`.
 * We can't use the exact same file currently because Brackets uses AMD-style modules, so this version has
 * the AMD wrapper added (and is reindented to avoid JSLint complaints).. If changes are made here, the 
 * version in the registry app should be kept in sync.
 * In the future, we should have a better mechanism for sharing code between the two.
 */

/*jslint vars: true, plusplus: true, nomen: true, indent: 4, maxerr: 50 */
/*global define*/

define(function (require, exports, module) {
    "use strict";
    
    /**
     * Gets the last version from the given object and returns the short form of its date.
     * Assumes "this" is the current template context.
     * @return {string} The formatted date.
     */
    exports.lastVersionDate = function () {
        var result;
        if (this.versions && this.versions.length) {
            result = this.versions[this.versions.length - 1].published;
            if (result) {
                // Just return the ISO-formatted date, which is the portion up to the "T".
                var dateEnd = result.indexOf("T");
                if (dateEnd !== -1) {
                    result = result.substr(0, dateEnd);
                }
            }
        }
        return result || "";
    };
    
    /**
     * Returns a more friendly display form of the owner's internal user id.
     * Assumes "this" is the current template context.
     * @return {string} A display version in the form "id (service)".
     */
    exports.formatUserId = function () {
        var friendlyName;
        if (this.owner) {
            var nameComponents = this.owner.split(":");
            friendlyName = nameComponents[1] + " (" + nameComponents[0] + ")";
        }
        return friendlyName;
    };
    
    /**
     * Given a registry item, returns a URL that represents its owner's page on the auth service.
     * Currently only handles GitHub.
     * Assumes "this" is the current template context.
     * @return {string} A link to that user's page on the service.
     */
    exports.ownerLink = function () {
        var url;
        if (this.owner) {
            var nameComponents = this.owner.split(":");
            if (nameComponents[0] === "github") {
                url = "https://github.com/" + nameComponents[1];
            }
        }
        return url;
    };
    
    /**
     * Returns an array of current registry entries, sorted by the publish date of the latest version of each entry.
     * @param {object} registry The unsorted registry.
     * @return {Array} Sorted array of registry entries.
     */
    exports.sortRegistry = function (registry) {
        function getPublishTime(entry) {
            return new Date(entry.versions[entry.versions.length - 1].published).getTime();
        }
        
        var sortedEntries = [];
    
        // Sort the registry by last published date (newest first).
        Object.keys(registry).forEach(function (key) {
            sortedEntries.push(registry[key]);
        });
        sortedEntries.sort(function (entry1, entry2) {
            return getPublishTime(entry2) - getPublishTime(entry1);
        });
        
        return sortedEntries;
    };
});