/*
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, require, Mustache */

define(function(require) {
    "use strict";

    var _       = require("thirdparty/lodash"),
        Dialogs = require("widgets/Dialogs"),

        tmpl = {
            "settings": require("text!htmlContent/themes-settings.html"),
            "general": require("text!htmlContent/themes-general.html")
        };

    var _themes;

    // Setup all the templates so that we can easily render them with Mustache
    var $settings = $(tmpl.settings).addClass("themeSettings");
    $("#generalSettings", $settings).html(tmpl.general);


    function show(settings) {
        var currentSettings = settings.getAll("themes", "fontSize", "fontType", "lineHeight", "customScrollbars");
        var newSettings     = {};
        var themes          = _.map(_themes, function(theme) {return theme;});
        var template        = $("<div>").append($settings).html();
        var $template       = $(Mustache.render(template, {"settings": currentSettings, "themes": themes}));

        // Select the correct theme.
        _.each(currentSettings.themes, function(item) {
            $template
                .find("[value='" + item + "']")
                .attr("selected", "selected");
        });

        $template
            .find("[data-toggle=tab].default")
            .tab("show");

        $template
            .on("change", "[data-target]:checkbox", function() {
                var $target = $(this);
                var attr = $target.attr("data-target");
                newSettings[attr] = $target.is(":checked");
            })
            .on("change", "[data-target]:text", function() {
                var $target = $(this);
                var attr = $target.attr("data-target");
                newSettings[attr] = $target.val();
            })
            .on("change", function() {
                var $target = $(":selected", this);
                var attr = $target.attr("data-target");
                if ( attr ) {
                    var items = $target.map(function(i, item) {return $(item).val();}).toArray();
                    settings.setValue( attr, items );
                }
            });

        Dialogs.showModalDialogUsingTemplate($template).done(function( id ) {
            if ( id === "save" ) {
                for( var i in newSettings ) {
                    if ( currentSettings.hasOwnProperty(i) ) {
                        settings.setValue( i, newSettings[i] );
                    }
                }
            }
        });
    }


    function setThemes(themes) {
        _themes = themes;
    }


    return {
        setThemes: setThemes,
        show: show
    };
});
