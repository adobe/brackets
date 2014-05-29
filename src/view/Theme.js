/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, require, less */

define(function () {
    "use strict";

    var FileSystem     = require("filesystem/FileSystem"),
        FileUtils      = require("file/FileUtils"),
        ExtensionUtils = require("utils/ExtensionUtils");

    var commentRegex = /\/\*([\s\S]*?)\*\//mg,
        scrollbarsRegex = /(?:[^}|,]*)::-webkit-scrollbar(?:[\s\S]*?){(?:[\s\S]*?)}/mg;

    /**
    *  Theme object to encasulate all the logic in one pretty bundle.
    *  The theme will self register when it is created.
    *
    *  * Required settings are fileName and path
    *
    * @constructor
    */
    function Theme(file, displayName) {
        var _self     = this,
            fileName  = file.name;

        _self.file        = file;
        _self.displayName = displayName || toDisplayName(fileName);
        _self.name        = fileName.substring(0, fileName.lastIndexOf('.'));
        _self.className   = "theme-" + _self.name;
    }


    Theme.prototype.getFile = function() {
        return this.file;
    };


    Theme.prototype.load = function(force) {
        var theme = this;

        if (theme.css && !force) {
            return theme;
        }

        if (theme.css) {
            $(theme.css).remove();
        }

        return FileUtils.readAsText(this.getFile())
            .then(function(content) {
                var result = extractScrollbars(content);
                theme.scrollbar = result.scrollbar;
                return result.content;
            })
            .then(function(content) {
                return lessify(content, theme);
            })
            .then(function(style) {
                return ExtensionUtils.addEmbeddedStyleSheet(style);
            })
            .then(function(styleNode) {
                theme.css = styleNode;
                return theme;
            })
            .promise();
    };


    /**
    *  Takes all dashes and converts them to white spaces...
    *  Then takes all first letters and capitalizes them.
    */
    function toDisplayName (name) {
        name = name.substring(0, name.lastIndexOf('.')).replace(/-/g, ' ');
        var parts = name.split(" ");

        $.each(parts.slice(0), function (index, part) {
            parts[index] = part[0].toUpperCase() + part.substring(1);
        });

        return parts.join(" ");
    }


    function extractScrollbars(content) {
        var scrollbar = [];

        // Go through and extract out scrollbar customizations so that we can
        // enable/disable via settings.
        content = content
            .replace(commentRegex, "")
            .replace(scrollbarsRegex, function(match) {
                scrollbar.push(match);
                return "";
            });

        return {
            content: content,
            scrollbar: scrollbar
        };
    }


    function lessify(content, theme) {
        var deferred = $.Deferred(),
            parser = new less.Parser();

        parser.parse("." + theme.className + "{" + content + "}", function (err, tree) {
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve(tree.toCSS());
            }
        });

        return deferred.promise();
    }


    return Theme;
});

