/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports, module) {
    "use strict";

    var Content = require("filesystem/impls/lib/content");
    var Log = require("filesystem/impls/lib/log");
    var HTMLRewriter = require("filesystem/impls/lib/HTMLRewriter");
    var CSSRewriter = require("filesystem/impls/lib/CSSRewriter");
    var Filer = require("filesystem/impls/filer/BracketsFiler");
    var Path  = Filer.Path;

    function _handle404(err, path, callback) {
        var html = '<!DOCTYPE html>' +
                   '<html><head>' +
                   '<title>404 Not Found</title>' +
                   '</head><body>' +
                   '<h1>Not Found</h1>' +
                   '<p>The requested URL ' + path + ' was not found on this server.</p>' +
                   '<hr>' +
                   '<address>nohost/0.0.1 (Web) Server</address>' +
                   '</body></html>';
        callback(err, Content.toURL(html, 'text/html'));
    }

    function _handleHTML(path, content, callback) {
        HTMLRewriter.rewrite(path, content, function(err, html) {
            if(err) {
                Log.error('unable to read html for `' + path + '`');
                // TODO: best way to deal with error here? 500?
                return _handle404(err, path, callback);
            }

            callback(null, Content.toURL(html));
        });
    }

    function _handleCSS(path, content, callback) {
        CSSRewriter.rewrite(path, content, function(err, css) {
            if(err) {
                Log.error('unable to read css for `' + path + '`');
                // TODO: best way to deal with error here? 500?
                return _handle404(err, path, callback);
            }

            callback(null, Content.toURL(css));
        });
    }

    /**
     * Send the raw file, making it somewhat more readable
     */
    function handleFile(path, callback) {
        var fs = Filer.fs();
        var ext = Path.extname(path);
        var encoding = Content.isUTF8Encoded(ext) && 'utf8';

        fs.readFile(path, encoding, function(err, data) {
            if(err) {
                Log.error('unable to read `' + path + '` in handler');
                return _handle404(err, path, callback);
            }

            if(Content.isHTML(ext)) {
                _handleHTML(path, data, callback);
            } else if(Content.isCSS(ext)) {
                _handleCSS(path, data, callback);
            } else {
                callback(null, Content.toURL(data));
            }
        });
    }

    exports.handleFile = handleFile;
});
