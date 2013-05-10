// init_ui.js
// 2011-12-08

// This is the web browser companion to fulljslint.js. It is an ADsafe
// lib file that implements a web ui by adding behavior to the widget's
// html tags.

// It stores a function in lib.init_ui. Calling that function will
// start up the JSLint widget ui.

// option = {adsafe: true, fragment: false}

/*properties check, cookie, each, edition, get, getCheck, getTitle, getValue,
    has, indent, isArray, join, jslint, length, lib, maxerr, maxlen, on,
    predef, push, q, select, set, split, stringify, style, target, tree, value
*/


ADSAFE.lib("init_ui", function (lib) {
    'use strict';

    return function (dom) {
        var table = dom.q('#JSLINT_TABLE'),
            boxes = table.q('span'),
            indent = dom.q('#JSLINT_INDENT'),
            input = dom.q('#JSLINT_INPUT'),
            jslintstring = dom.q('#JSLINT_JSLINTSTRING'),
            maxerr = dom.q('#JSLINT_MAXERR'),
            maxlen = dom.q('#JSLINT_MAXLEN'),
            option = lib.cookie.get(),
            output = dom.q('#JSLINT_OUTPUT'),
            tree = dom.q('#JSLINT_TREE'),
            predefined = dom.q('#JSLINT_PREDEF');

        function show_jslint_control() {

// Build and display a /*jslint*/ control comment.
// The comment can be copied into a .js file.

            var a = [];

            boxes.each(function (bunch) {
                var name = bunch.getTitle(),
                    value = ADSAFE.get(option, name);
                if (typeof value === 'boolean') {
                    if (name !== 'adsafe' && name !== 'safe') {
                        a.push(name + ': ' + value);
                    }
                    bunch.style('backgroundColor', value ? 'black' : 'white');
                } else {
                    bunch.style('backgroundColor', 'gainsboro');
                }
            });
            if (typeof option.maxerr === 'number' && option.maxerr >= 0) {
                a.push('maxerr: ' + String(option.maxerr));
            }
            if (typeof option.maxlen === 'number' && option.maxlen >= 0) {
                a.push('maxlen: ' + String(option.maxlen));
            }
            if (typeof option.indent === 'number' && option.indent >= 0) {
                a.push('indent: ' + String(option.indent));
            }
            jslintstring.value('/*jslint ' + a.join(', ') + ' */');

// Make a JSON cookie of the option object.

            lib.cookie.set(option);
        }

        function show_options() {
            indent.value(String(option.indent));
            maxlen.value(String(option.maxlen || ''));
            maxerr.value(String(option.maxerr));
            predefined.value(ADSAFE.isArray(option.predef)
                ? option.predef.join(',')
                : '');
            show_jslint_control();
        }

        function update_box(event) {

//  Boxes are tristate, cycling true, false, undefined.

            var title = event.target.getTitle();
            if (title) {
                ADSAFE.set(option, title,
                    ADSAFE.get(option, title) === true
                        ? false
                        : ADSAFE.get(option, title) === false
                        ? undefined
                        : true);
            }
            show_jslint_control();
        }

        function update_number(event) {
            var value = event.target.getValue();
            if (value.length === 0 || +value < 0 || !isFinite(value)) {
                value = '';
                ADSAFE.set(option, event.target.getTitle(), undefined);
            } else {
                ADSAFE.set(option, event.target.getTitle(), +value);
            }
            event.target.value(String(value));
            show_jslint_control();
        }

        function update_list(event) {
            var value = event.target.getValue().split(/\s*,\s*/);
            ADSAFE.set(option, event.target.getTitle(), value);
            event.target.value(value.join(', '));
            show_jslint_control();
        }


// Restore the options from a JSON cookie.

        if (!option || typeof option !== 'object') {
            option = {
                indent: 4,
                maxerr: 50
            };
        } else {
            option.indent = typeof option.indent === 'number' && option.indent >= 0
                ? option.indent
                : 4;
            option.maxerr = typeof option.maxerr === 'number' && option.maxerr >= 0
                ? option.maxerr
                : 50;
        }
        show_options();


// Display the edition.

        dom.q('#JSLINT_EDITION').value('Edition ' + lib.edition());

// Add click event handlers to the [JSLint] and [clear] buttons.

        dom.q('input&jslint').on('click', function () {
            tree.value('');

// Call JSLint and display the report.

            tree.value(String(lib.jslint(input.getValue(), option, output) / 1000) + ' seconds.');
            input.select();
            return false;
        });

        dom.q('input&tree').on('click', function () {
            output.value('Tree:');
            tree.value(JSON.stringify(lib.tree(), [
                'label', 'id', 'string', 'number', 'arity', 'name', 'first',
                'second', 'third', 'block', 'else', 'quote', 'flag', 'type'
            ], 4));
            input.select();
        });

        dom.q('input&clear').on('click', function () {
            output.value('');
            tree.value('');
            input.value('').select();
        });


        dom.q('#JSLINT_CLEARALL').on('click', function () {
            option = {
                indent: 4,
                maxerr: 50
            };
            show_options();
        });

        table.on('click', update_box);
        indent.on('change', update_number);
        maxerr.on('change', update_number);
        maxlen.on('change', update_number);
        predefined.on('change', update_list);
        input
            .on('change', function () {
                output.value('');
            })
            .select();
    };
});
