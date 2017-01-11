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

/*
 * N.B.: This file was copied from `lib/registry_utils.js` in `https://github.com/adobe/brackets-registry`.
 * We can't use the exact same file currently because Brackets uses AMD-style modules, so this version has
 * the AMD wrapper added (and is reindented to avoid JSLint complaints).. If changes are made here, the
 * version in the registry app should be kept in sync.
 * In the future, we should have a better mechanism for sharing code between the two.
 */

define(function (require, exports, module) {
    "use strict";

    // From Brackets StringUtils
    function htmlEscape(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

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
                result = new Date(result);
                result = result.toLocaleDateString(brackets.getLocale(), {
                    "year": "numeric",
                    "month": "2-digit",
                    "day": "2-digit"
                });
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
            friendlyName = nameComponents[1];
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
     * Given a registry item, formats the author information, including a link to the owner's
     * github page (if available) and the author's name from the metadata.
     */
    exports.authorInfo = function () {
        var result = "",
            ownerLink = exports.ownerLink.call(this),
            userId = exports.formatUserId.call(this);
        if (this.metadata && this.metadata.author) {
            result = htmlEscape(this.metadata.author.name || this.metadata.author);
        } else if (userId) {
            result = htmlEscape(userId);
        }
        if (ownerLink) {
            result = "<a href='" + htmlEscape(ownerLink) + "' title='" + htmlEscape(ownerLink) + "'>" + result + "</a>";
        }
        return result;
    };

    /**
     * Returns an array of current registry entries, sorted by the publish date of the latest version of each entry.
     * @param {object} registry The unsorted registry.
     * @param {string} subkey The subkey to look for the registry metadata in. If unspecified, assumes
     *     we should look at the top level of the object.
     * @return {Array} Sorted array of registry entries.
     */
    exports.sortRegistry = function (registry, subkey) {
        function getPublishTime(entry) {
            if (entry.versions) {
                return new Date(entry.versions[entry.versions.length - 1].published).getTime();
            }

            return Number.NEGATIVE_INFINITY;
        }

        var sortedEntries = [];

        // Sort the registry by last published date (newest first).
        Object.keys(registry).forEach(function (key) {
            sortedEntries.push(registry[key]);
        });
        sortedEntries.sort(function (entry1, entry2) {
            return getPublishTime((subkey && entry2[subkey]) || entry2) -
                getPublishTime((subkey && entry1[subkey]) || entry1);
        });

        return sortedEntries;
    };
});
