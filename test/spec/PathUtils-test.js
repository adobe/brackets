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

/*global define, describe, it, expect */

define(function (require, exports, module) {
    "use strict";

    var PathUtils = require("utils/PathUtils");

    var testParseUrls = [
			"http://jblas:password@mycompany.com:8080/mail/inbox?msg=1234&type=unread#msg-content",
			"//jblas:password@mycompany.com:8080/mail/inbox?msg=1234&type=unread#msg-content",
			"//mycompany.com:8080/mail/inbox?msg=1234&type=unread#msg-content",
			"/mail/inbox?msg=1234&type=unread#msg-content",
			"mail/inbox?msg=1234&type=unread#msg-content",
			"inbox?msg=1234&type=unread#msg-content",
			"?msg=1234&type=unread#msg-content",
			"#msg-content",
			"http://mycompany.com/mail/inbox?msg=1234&type=unread#msg-content",
			"//mycompany.com/mail/inbox?msg=1234&type=unread#msg-content",
			"/mail/inbox?msg=1234&type=unread#msg-content",
			"mail/inbox?msg=1234&type=unread#msg-content",
			"inbox?msg=1234&type=unread#msg-content",
			"http://jblas:password@123.456.78.9:8080/mail/inbox?msg=1234&type=unread#msg-content",
			"//jblas:password@123.456.78.9:8080/mail/inbox?msg=1234&type=unread#msg-content",
			"//123.456.78.9:8080/mail/inbox?msg=1234&type=unread#msg-content",
			"http://mycompany.com/a/b.php?foo=1&bar=2",
			"http://mycompany.com/b.php?foo=1&bar=2",
			"http://mycompany.com/a/b.html",
			"http://mycompany.com/b.html",
			"a/file.html",
			"/file.html",
			"file.html",
			"../file.html",
			"a/b/../../file.html",
			"http://mycompany.com/a/b-1.0-min.js?foo=1&bar=2"
		];

    var testParseResults = [
        {
            href: "http://jblas:password@mycompany.com:8080/mail/inbox?msg=1234&type=unread#msg-content",
            hrefNoHash: "http://jblas:password@mycompany.com:8080/mail/inbox?msg=1234&type=unread",
            hrefNoSearch: "http://jblas:password@mycompany.com:8080/mail/inbox",
            domain: "http://jblas:password@mycompany.com:8080",
            protocol: "http:",
            doubleSlash: "//",
            authority: "jblas:password@mycompany.com:8080",
            userinfo: "jblas:password",
            username: "jblas",
            password: "password",
            host: "mycompany.com:8080",
            hostname: "mycompany.com",
            port: "8080",
            pathname: "/mail/inbox",
            directory: "/mail/",
            filename: "inbox",
            filenameExtension: "",
            search: "?msg=1234&type=unread",
            hash: "#msg-content",
        },
        {
            href: "//jblas:password@mycompany.com:8080/mail/inbox?msg=1234&type=unread#msg-content",
            hrefNoHash: "//jblas:password@mycompany.com:8080/mail/inbox?msg=1234&type=unread",
            hrefNoSearch: "//jblas:password@mycompany.com:8080/mail/inbox",
            domain: "//jblas:password@mycompany.com:8080",
            protocol: "",
            doubleSlash: "//",
            authority: "jblas:password@mycompany.com:8080",
            userinfo: "jblas:password",
            username: "jblas",
            password: "password",
            host: "mycompany.com:8080",
            hostname: "mycompany.com",
            port: "8080",
            pathname: "/mail/inbox",
            directory: "/mail/",
            filename: "inbox",
            filenameExtension: "",
            search: "?msg=1234&type=unread",
            hash: "#msg-content"
        },
        {
            href: "//mycompany.com:8080/mail/inbox?msg=1234&type=unread#msg-content",
            hrefNoHash: "//mycompany.com:8080/mail/inbox?msg=1234&type=unread",
            hrefNoSearch: "//mycompany.com:8080/mail/inbox",
            domain: "//mycompany.com:8080",
            protocol: "",
            doubleSlash: "//",
            authority: "mycompany.com:8080",
            userinfo: "",
            username: "",
            password: "",
            host: "mycompany.com:8080",
            hostname: "mycompany.com",
            port: "8080",
            pathname: "/mail/inbox",
            directory: "/mail/",
            filename: "inbox",
            filenameExtension: "",
            search: "?msg=1234&type=unread",
            hash: "#msg-content"
        },
        {
            href: "/mail/inbox?msg=1234&type=unread#msg-content",
            hrefNoHash: "/mail/inbox?msg=1234&type=unread",
            hrefNoSearch: "/mail/inbox",
            domain: "",
            protocol: "",
            doubleSlash: "",
            authority: "",
            userinfo: "",
            username: "",
            password: "",
            host: "",
            hostname: "",
            port: "",
            pathname: "/mail/inbox",
            directory: "/mail/",
            filename: "inbox",
            filenameExtension: "",
            search: "?msg=1234&type=unread",
            hash: "#msg-content"
        },
        {
            href: "mail/inbox?msg=1234&type=unread#msg-content",
            hrefNoHash: "mail/inbox?msg=1234&type=unread",
            hrefNoSearch: "mail/inbox",
            domain: "",
            protocol: "",
            doubleSlash: "",
            authority: "",
            userinfo: "",
            username: "",
            password: "",
            host: "",
            hostname: "",
            port: "",
            pathname: "mail/inbox",
            directory: "mail/",
            filename: "inbox",
            filenameExtension: "",
            search: "?msg=1234&type=unread",
            hash: "#msg-content"
        },
        {
            href: "inbox?msg=1234&type=unread#msg-content",
            hrefNoHash: "inbox?msg=1234&type=unread",
            hrefNoSearch: "inbox",
            domain: "",
            protocol: "",
            doubleSlash: "",
            authority: "",
            userinfo: "",
            username: "",
            password: "",
            host: "",
            hostname: "",
            port: "",
            pathname: "inbox",
            directory: "",
            filename: "inbox",
            filenameExtension: "",
            search: "?msg=1234&type=unread",
            hash: "#msg-content"
        },
        {
            href: "?msg=1234&type=unread#msg-content",
            hrefNoHash: "?msg=1234&type=unread",
            hrefNoSearch: "",
            domain: "",
            protocol: "",
            doubleSlash: "",
            authority: "",
            userinfo: "",
            username: "",
            password: "",
            host: "",
            hostname: "",
            port: "",
            pathname: "",
            directory: "",
            filename: "",
            filenameExtension: "",
            search: "?msg=1234&type=unread",
            hash: "#msg-content",
        },
        {
            href: "#msg-content",
            hrefNoHash: "",
            hrefNoSearch: "",
            domain: "",
            protocol: "",
            doubleSlash: "",
            authority: "",
            userinfo: "",
            username: "",
            password: "",
            host: "",
            hostname: "",
            port: "",
            pathname: "",
            directory: "",
            filename: "",
            filenameExtension: "",
            search: "",
            hash: "#msg-content",
        },
        {
            href: "http://mycompany.com/mail/inbox?msg=1234&type=unread#msg-content",
            hrefNoHash: "http://mycompany.com/mail/inbox?msg=1234&type=unread",
            hrefNoSearch: "http://mycompany.com/mail/inbox",
            domain: "http://mycompany.com",
            protocol: "http:",
            doubleSlash: "//",
            authority: "mycompany.com",
            userinfo: "",
            username: "",
            password: "",
            host: "mycompany.com",
            hostname: "mycompany.com",
            port: "",
            pathname: "/mail/inbox",
            directory: "/mail/",
            filename: "inbox",
            filenameExtension: "",
            search: "?msg=1234&type=unread",
            hash: "#msg-content",
        },
        {
            href: "//mycompany.com/mail/inbox?msg=1234&type=unread#msg-content",
            hrefNoHash: "//mycompany.com/mail/inbox?msg=1234&type=unread",
            hrefNoSearch: "//mycompany.com/mail/inbox",
            domain: "//mycompany.com",
            protocol: "",
            doubleSlash: "//",
            authority: "mycompany.com",
            userinfo: "",
            username: "",
            password: "",
            host: "mycompany.com",
            hostname: "mycompany.com",
            port: "",
            pathname: "/mail/inbox",
            directory: "/mail/",
            filename: "inbox",
            filenameExtension: "",
            search: "?msg=1234&type=unread",
            hash: "#msg-content",
        },
        {
            href: "/mail/inbox?msg=1234&type=unread#msg-content",
            hrefNoHash: "/mail/inbox?msg=1234&type=unread",
            hrefNoSearch: "/mail/inbox",
            domain: "",
            protocol: "",
            doubleSlash: "",
            authority: "",
            userinfo: "",
            username: "",
            password: "",
            host: "",
            hostname: "",
            port: "",
            pathname: "/mail/inbox",
            directory: "/mail/",
            filename: "inbox",
            filenameExtension: "",
            search: "?msg=1234&type=unread",
            hash: "#msg-content",
        },
        {
            href: "mail/inbox?msg=1234&type=unread#msg-content",
            hrefNoHash: "mail/inbox?msg=1234&type=unread",
            hrefNoSearch: "mail/inbox",
            domain: "",
            protocol: "",
            doubleSlash: "",
            authority: "",
            userinfo: "",
            username: "",
            password: "",
            host: "",
            hostname: "",
            port: "",
            pathname: "mail/inbox",
            directory: "mail/",
            filename: "inbox",
            filenameExtension: "",
            search: "?msg=1234&type=unread",
            hash: "#msg-content",
        },
        {
            href: "inbox?msg=1234&type=unread#msg-content",
            hrefNoHash: "inbox?msg=1234&type=unread",
            hrefNoSearch: "inbox",
            domain: "",
            protocol: "",
            doubleSlash: "",
            authority: "",
            userinfo: "",
            username: "",
            password: "",
            host: "",
            hostname: "",
            port: "",
            pathname: "inbox",
            directory: "",
            filename: "inbox",
            filenameExtension: "",
            search: "?msg=1234&type=unread",
            hash: "#msg-content",
        },
        {
            href: "http://jblas:password@123.456.78.9:8080/mail/inbox?msg=1234&type=unread#msg-content",
            hrefNoHash: "http://jblas:password@123.456.78.9:8080/mail/inbox?msg=1234&type=unread",
            hrefNoSearch: "http://jblas:password@123.456.78.9:8080/mail/inbox",
            domain: "http://jblas:password@123.456.78.9:8080",
            protocol: "http:",
            doubleSlash: "//",
            authority: "jblas:password@123.456.78.9:8080",
            userinfo: "jblas:password",
            username: "jblas",
            password: "password",
            host: "123.456.78.9:8080",
            hostname: "123.456.78.9",
            port: "8080",
            pathname: "/mail/inbox",
            directory: "/mail/",
            filename: "inbox",
            filenameExtension: "",
            search: "?msg=1234&type=unread",
            hash: "#msg-content",
        },
        {
            href: "//jblas:password@123.456.78.9:8080/mail/inbox?msg=1234&type=unread#msg-content",
            hrefNoHash: "//jblas:password@123.456.78.9:8080/mail/inbox?msg=1234&type=unread",
            hrefNoSearch: "//jblas:password@123.456.78.9:8080/mail/inbox",
            domain: "//jblas:password@123.456.78.9:8080",
            protocol: "",
            doubleSlash: "//",
            authority: "jblas:password@123.456.78.9:8080",
            userinfo: "jblas:password",
            username: "jblas",
            password: "password",
            host: "123.456.78.9:8080",
            hostname: "123.456.78.9",
            port: "8080",
            pathname: "/mail/inbox",
            directory: "/mail/",
            filename: "inbox",
            filenameExtension: "",
            search: "?msg=1234&type=unread",
            hash: "#msg-content",
        },
        {
            href: "//123.456.78.9:8080/mail/inbox?msg=1234&type=unread#msg-content",
            hrefNoHash: "//123.456.78.9:8080/mail/inbox?msg=1234&type=unread",
            hrefNoSearch: "//123.456.78.9:8080/mail/inbox",
            domain: "//123.456.78.9:8080",
            protocol: "",
            doubleSlash: "//",
            authority: "123.456.78.9:8080",
            userinfo: "",
            username: "",
            password: "",
            host: "123.456.78.9:8080",
            hostname: "123.456.78.9",
            port: "8080",
            pathname: "/mail/inbox",
            directory: "/mail/",
            filename: "inbox",
            filenameExtension: "",
            search: "?msg=1234&type=unread",
            hash: "#msg-content",
        },
        {
            href: "http://mycompany.com/a/b.php?foo=1&bar=2",
            hrefNoHash: "http://mycompany.com/a/b.php?foo=1&bar=2",
            hrefNoSearch: "http://mycompany.com/a/b.php",
            domain: "http://mycompany.com",
            protocol: "http:",
            doubleSlash: "//",
            authority: "mycompany.com",
            userinfo: "",
            username: "",
            password: "",
            host: "mycompany.com",
            hostname: "mycompany.com",
            port: "",
            pathname: "/a/b.php",
            directory: "/a/",
            filename: "b.php",
            filenameExtension: ".php",
            search: "?foo=1&bar=2",
            hash: "",
        },
        {
            href: "http://mycompany.com/b.php?foo=1&bar=2",
            hrefNoHash: "http://mycompany.com/b.php?foo=1&bar=2",
            hrefNoSearch: "http://mycompany.com/b.php",
            domain: "http://mycompany.com",
            protocol: "http:",
            doubleSlash: "//",
            authority: "mycompany.com",
            userinfo: "",
            username: "",
            password: "",
            host: "mycompany.com",
            hostname: "mycompany.com",
            port: "",
            pathname: "/b.php",
            directory: "/",
            filename: "b.php",
            filenameExtension: ".php",
            search: "?foo=1&bar=2",
            hash: "",
        },
        {
            href: "http://mycompany.com/a/b.html",
            hrefNoHash: "http://mycompany.com/a/b.html",
            hrefNoSearch: "http://mycompany.com/a/b.html",
            domain: "http://mycompany.com",
            protocol: "http:",
            doubleSlash: "//",
            authority: "mycompany.com",
            userinfo: "",
            username: "",
            password: "",
            host: "mycompany.com",
            hostname: "mycompany.com",
            port: "",
            pathname: "/a/b.html",
            directory: "/a/",
            filename: "b.html",
            filenameExtension: ".html",
            search: "",
            hash: "",
        },
        {
            href: "http://mycompany.com/b.html",
            hrefNoHash: "http://mycompany.com/b.html",
            hrefNoSearch: "http://mycompany.com/b.html",
            domain: "http://mycompany.com",
            protocol: "http:",
            doubleSlash: "//",
            authority: "mycompany.com",
            userinfo: "",
            username: "",
            password: "",
            host: "mycompany.com",
            hostname: "mycompany.com",
            port: "",
            pathname: "/b.html",
            directory: "/",
            filename: "b.html",
            filenameExtension: ".html",
            search: "",
            hash: "",
        },
        {
            href: "a/file.html",
            hrefNoHash: "a/file.html",
            hrefNoSearch: "a/file.html",
            domain: "",
            protocol: "",
            doubleSlash: "",
            authority: "",
            userinfo: "",
            username: "",
            password: "",
            host: "",
            hostname: "",
            port: "",
            pathname: "a/file.html",
            directory: "a/",
            filename: "file.html",
            filenameExtension: ".html",
            search: "",
            hash: "",
        },
        {
            href: "/file.html",
            hrefNoHash: "/file.html",
            hrefNoSearch: "/file.html",
            domain: "",
            protocol: "",
            doubleSlash: "",
            authority: "",
            userinfo: "",
            username: "",
            password: "",
            host: "",
            hostname: "",
            port: "",
            pathname: "/file.html",
            directory: "/",
            filename: "file.html",
            filenameExtension: ".html",
            search: "",
            hash: "",
        },
        {
            href: "file.html",
            hrefNoHash: "file.html",
            hrefNoSearch: "file.html",
            domain: "",
            protocol: "",
            doubleSlash: "",
            authority: "",
            userinfo: "",
            username: "",
            password: "",
            host: "",
            hostname: "",
            port: "",
            pathname: "file.html",
            directory: "",
            filename: "file.html",
            filenameExtension: ".html",
            search: "",
            hash: "",
        },
        {
            href: "../file.html",
            hrefNoHash: "../file.html",
            hrefNoSearch: "../file.html",
            domain: "",
            protocol: "",
            doubleSlash: "",
            authority: "",
            userinfo: "",
            username: "",
            password: "",
            host: "",
            hostname: "",
            port: "",
            pathname: "../file.html",
            directory: "../",
            filename: "file.html",
            filenameExtension: ".html",
            search: "",
            hash: "",
        },
        {
            href: "a/b/../../file.html",
            hrefNoHash: "a/b/../../file.html",
            hrefNoSearch: "a/b/../../file.html",
            domain: "",
            protocol: "",
            doubleSlash: "",
            authority: "",
            userinfo: "",
            username: "",
            password: "",
            host: "",
            hostname: "",
            port: "",
            pathname: "a/b/../../file.html",
            directory: "a/b/../../",
            filename: "file.html",
            filenameExtension: ".html",
            search: "",
            hash: "",
        },
        {
            href: "http://mycompany.com/a/b-1.0-min.js?foo=1&bar=2",
            hrefNoHash: "http://mycompany.com/a/b-1.0-min.js?foo=1&bar=2",
            hrefNoSearch: "http://mycompany.com/a/b-1.0-min.js",
            domain: "http://mycompany.com",
            protocol: "http:",
            doubleSlash: "//",
            authority: "mycompany.com",
            userinfo: "",
            username: "",
            password: "",
            host: "mycompany.com",
            hostname: "mycompany.com",
            port: "",
            pathname: "/a/b-1.0-min.js",
            directory: "/a/",
            filename: "b-1.0-min.js",
            filenameExtension: ".js",
            search: "?foo=1&bar=2",
            hash: "",
        }
    ];


    var testPaths = [
        {
            base: "",
            relative: "foo.html"
        },
        {
            base: "/",
            relative: "foo.html"
        },
        {
            base: "/file",
            relative: "foo.html"
        },
        {
            base: "/dir/",
            relative: "foo.html"
        },
        {
            base: "/",
            relative: "../foo.html"
        },
        {
            base: "/file",
            relative: "../foo.html"
        },
        {
            base: "/dir/",
            relative: "../foo.html"
        },
        {
            base: "/a/b/",
            relative: "../foo.html"
        },
        {
            base: "/a/b/",
            relative: "./.././foo.html"   //9
        },
        {
            base: "/a/b/",
            relative: "../../foo.html"
        },
        {
            base: "/a/b/",
            relative: "../../../../../../../../foo.html"
        },
        {
            base: "/a/b/",
            relative: "../../c/d/"
        },
        {
            base: "/a/b/c/d/e/f/g/file.html",
            relative: "../../h/i/j/k/l/m/n/"
        },
        {
            base: "/a/b/c/d/e/f/g/file.html",
            relative: "../../h/i/j/k/l/m/n/bar.html"
        },
        {
            base: "/a/b/c/d/e/f/g/",
            relative: "../../h/i/j/k/l/m/n/"
        },
        {
            base: "/a/b/c/d/e/f/g/",
            relative: "../../../../../../../h/i/j/k/l/m/n/bar.html"
        },
        {
            base: "/a/b/c/d/e/f/g/",
            relative: "../../../../../../../h/i/j/k/l/m/n/"
        },
    ];

    var testPathResults = [
        {
            abs: "/foo.html",
            rel: "foo.html"
        },
        {
            abs: "/foo.html",
            rel: "foo.html"
        },
        {
            abs: "/foo.html",
            rel: "foo.html"
        },
        {
            abs: "/dir/foo.html",
            rel: "foo.html"
        },
        {
            abs: "/foo.html",
            rel: "foo.html"
        },
        {
            abs: "/foo.html",
            rel: "foo.html"
        },
        {
            abs: "/foo.html",
            rel: "../foo.html"
        },
        {
            abs: "/a/foo.html",
            rel: "../foo.html"
        },
        {
            abs: "/a/foo.html",
            rel: "../foo.html"
        },
        {
            abs: "/foo.html",
            rel: "../../foo.html"
        },
        {
            abs: "/foo.html",
            rel: "../../foo.html"
        },
        {
            abs: "/c/d/",
            rel: "../../c/d/"
        },
        {
            abs: "/a/b/c/d/e/h/i/j/k/l/m/n/",
            rel: "../../h/i/j/k/l/m/n/"
        },
        {
            abs: "/a/b/c/d/e/h/i/j/k/l/m/n/bar.html",
            rel: "../../h/i/j/k/l/m/n/bar.html"
        },
        {
            abs: "/a/b/c/d/e/h/i/j/k/l/m/n/",
            rel: "../../h/i/j/k/l/m/n/"
        },
        {
            abs: "/h/i/j/k/l/m/n/bar.html",
            rel: "../../../../../../../h/i/j/k/l/m/n/bar.html"
        },
        {
            abs: "/h/i/j/k/l/m/n/",
            rel: "../../../../../../../h/i/j/k/l/m/n/",
        }
    ];

    var props = PathUtils.parsedUrlPropNames;

    describe("PathUtils", function () {
        describe("Parse Urls Tests", function () {
            testParseUrls.forEach(function (url, index) {
                it("should parse the url " + url + " correctly", function () {
                    var obj = PathUtils.parseUrl(url),
                        expectedResults = testParseResults[index];

                    props.forEach(function (prop) {
                        expect(obj[prop]).toBe(expectedResults[prop]);
                    });
                });
            });
        });

        describe("Make Absolute Tests", function () {
            testPaths.forEach(function (item, index) {
                it("Use 'base' (" + item.base + ") to turn 'relative' (" + item.relative + ") into an absolute path.", function () {
                    var absPath = PathUtils.makePathAbsolute(item.relative, item.base);
                    expect(absPath).toBe(testPathResults[index].abs);
                });
            });
        });

        describe("Make Relative Tests", function () {
            testPaths.forEach(function (item, index) {
                it("Make 'B' (" + testPathResults[index].abs + ") a path that is relative to 'A' (" + item.base + ").", function () {
                    var relPath = PathUtils.makePathRelative(testPathResults[index].abs, item.base);
                    expect(relPath).toBe(testPathResults[index].rel);
                });
            });
        });
    });
});
