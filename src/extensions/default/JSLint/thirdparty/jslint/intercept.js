// intercept.js
// 2012-05-09

// This file makes it possible for JSLint to run as an ADsafe widget by
// adding lib features.

// It provides a JSON cookie facility. Each widget is allowed to create a
// single JSON cookie.

// It also provides a way for the widget to call JSLint. The widget cannot
// call JSLint directly because it is loaded as a global variable. I don't
// want to change that because other versions of JSLint depend on that.

// And it provides access to the syntax tree that JSLint constructed.

/*jslint nomen: true, unparam: true */

/*global ADSAFE, document, JSLINT */

/*properties
    ___nodes___, _intercept, cookie, data, edition, error_report, get, getTime,
    indexOf, innerHTML, jslint, length, now, parse, properties_report, property,
    replace, report, set, setTime, slice, stringify, toGMTString, value
*/

ADSAFE._intercept(function (id, dom, lib, bunch) {
    'use strict';

// Give every widget access to a JSON cookie. The name of the cookie will be
// the same as the id of the widget.

    lib.cookie = {
        get: function () {

// Get the raw cookie. Extract this widget's cookie, and parse it.

            var c = ' ' + document.cookie + ';',
                s = c.indexOf((' ' + id + '=')),
                v;
            try {
                if (s >= 0) {
                    s += id.length + 2;
                    v = JSON.parse(c.slice(s, c.indexOf(';', s)));
                }
            } catch (ignore) {}
            return v;
        },
        set: function (value) {

// Set a cookie. It must be under 2000 in length. Escapify equal sign
// and semicolon if necessary.

            var d,
                j = JSON.stringify(value)
                    .replace(/[=]/g, '\\u003d')
                    .replace(/[;]/g, '\\u003b');

            if (j.length < 2000) {
                d = new Date();
                d.setTime(d.getTime() + 1e9);
                document.cookie = id + "=" + j + ';expires=' + d.toGMTString();
            }
        }
    };
});

ADSAFE._intercept(function (id, dom, lib, bunch) {
    'use strict';

// Give only the JSLINT_ widget access to the JSLINT function.
// We add a jslint function to its lib that calls JSLINT and
// then gets the reports, and stuffs the results into nodes
// provided by the widget. We do not trust a widget to stuff
// just any HTML content.

// We also add an edition function to the lib that gives the
// widget access to the current edition string.

    var now = Date.now || function () {
        return new Date().getTime();
    };

    if (id === 'JSLINT_') {
        lib.jslint = function (source, options, errors, report, properties, edition) {
            var after, before = now(), data, errtext, protext, retext;
            JSLINT(source, options);
            data = JSLINT.data();
            errtext = JSLINT.error_report(data);
            retext = JSLINT.report(data);
            protext = JSLINT.properties_report(JSLINT.property);
            after = now();
            edition.value(((after - before) / 1000) + ' seconds.');
            errors.___nodes___[0].innerHTML = errtext;
            report.___nodes___[0].innerHTML = retext;
            properties.value(protext);
            return errtext !== '';
        };
        lib.edition = function () {
            return JSLINT.edition;
        };
    }
});
