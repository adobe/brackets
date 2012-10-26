/*jslint plusplus: true, sloppy: true, browser: true */
$(function () {
    var lang_active = $("html").prop("lang"),
        $switcher = $(".language-switcher"),
        $button = $switcher.find("button"),
        $list = $switcher.find("ul"),
        $active = $list.find("li[data-lang=" + lang_active + "]"),

        setcookie = function (c_name, value, exdays) {
            var exdate = new Date(), c_value;
            exdate.setDate(exdate.getDate() + exdays);
            c_value = encodeURIComponent(value) + ((exdays === null) ? "" : "; expires=" + exdate.toUTCString());
            document.cookie = c_name + "=" + c_value;
        },

        getcookie = function (c_name) {
            var i, x, y, cookies = document.cookie.split(";");
            for (i = 0; i < cookies.length; i++) {
                x = cookies[i].substr(0, cookies[i].indexOf("="));
                y = cookies[i].substr(cookies[i].indexOf("=") + 1);
                x = x.replace(/^\s+|\s+$/g, "");
                if (x === c_name) {
                    return decodeURIComponent(y);
                }
            }
            return false;
        },

        redirect_to_lang = function (lang) {
            if (lang === lang_active) {
                return;
            }
            setcookie("brackets_lang", lang, 365); // remember the lang
            var url = "./";
            if (lang !== "en") {
                url = "index_" + lang + ".html";
            }
            location.replace(url);
        },

        set_preferred_lang = function () {
            var lang_available = "", lang;
            $list.find("li").each(function () {
                lang_available += $(this).data("lang") + " ";
            });
            lang = getcookie("brackets_lang");
            if (lang === false) {
                lang = window.navigator.userLanguage || window.navigator.language;
            }
            if (typeof lang !== "string") {
                lang = "en";
            }
            lang = lang.substring(0, 2);
            if (lang_available.indexOf(lang) === -1) {
                lang = "en"; // user language is not supported, assume English
            }
            setcookie("brackets_lang", lang, 365); // remember the lang
            if (lang === lang_active) {
                return;
            }
            redirect_to_lang(lang);
        },

        setup_switcher = function () {
            $active.addClass("active"); // set active menu item checkbox
            $button.html($active.html()); // set button text
            $button.click(function () { // show or hide the list
                if ($list.is(":hidden")) {
                    // position list
                    var height = ($list.css("top", "-9999px").show().height() + 1) + "px";
                    $list.css("top", "-" + height);
                } else {
                    $list.hide();
                }
            });
            $button.blur(function () {
                setTimeout(function () {
                    $list.hide();
                }, 200);
            });
            $list.find("li").click(function () {
                var lang = $(this).data("lang");
                redirect_to_lang(lang);
            });
            $switcher.show();
        };

    set_preferred_lang();
    setup_switcher();
});