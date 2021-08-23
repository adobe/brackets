/*
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 * Copyright (c) 2012-2015 Rod Vagg (@rvagg)
 * Based on : https://github.com/rvagg/node-errno
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

// jshint ignore: start
/*global fs, Phoenix*/
/*eslint-env es6*/
/*eslint no-console: 0*/
/*eslint strict: ["error", "global"]*/


/** All phoenix shell errors and their description.
 *
 * This module should be functionally as light weight as possible with minimal deps as it is a shell component.
 * **/


const ALL_ERRORS = [
    {
        errno: -2,
        code: 'ENOENT',
        description: 'no such file or directory'
    },
    {
        errno: -1,
        code: 'UNKNOWN',
        description: 'unknown error'
    },
    {
        errno: 0,
        code: 'OK',
        description: 'success'
    },
    {
        errno: 1,
        code: 'EOF',
        description: 'end of file'
    },
    {
        errno: 2,
        code: 'EADDRINFO',
        description: 'getaddrinfo error'
    },
    {
        errno: 3,
        code: 'EACCES',
        description: 'permission denied'
    },
    {
        errno: 4,
        code: 'EAGAIN',
        description: 'resource temporarily unavailable'
    },
    {
        errno: 5,
        code: 'EADDRINUSE',
        description: 'address already in use'
    },
    {
        errno: 6,
        code: 'EADDRNOTAVAIL',
        description: 'address not available'
    },
    {
        errno: 7,
        code: 'EAFNOSUPPORT',
        description: 'address family not supported'
    },
    {
        errno: 8,
        code: 'EALREADY',
        description: 'connection already in progress'
    },
    {
        errno: 9,
        code: 'EBADF',
        description: 'bad file descriptor'
    },
    {
        errno: 10,
        code: 'EBUSY',
        description: 'resource busy or locked'
    },
    {
        errno: 11,
        code: 'ECONNABORTED',
        description: 'software caused connection abort'
    },
    {
        errno: 12,
        code: 'ECONNREFUSED',
        description: 'connection refused'
    },
    {
        errno: 13,
        code: 'ECONNRESET',
        description: 'connection reset by peer'
    },
    {
        errno: 14,
        code: 'EDESTADDRREQ',
        description: 'destination address required'
    },
    {
        errno: 15,
        code: 'EFAULT',
        description: 'bad address in system call argument'
    },
    {
        errno: 16,
        code: 'EHOSTUNREACH',
        description: 'host is unreachable'
    },
    {
        errno: 17,
        code: 'EINTR',
        description: 'interrupted system call'
    },
    {
        errno: 18,
        code: 'EINVAL',
        description: 'invalid argument'
    },
    {
        errno: 19,
        code: 'EISCONN',
        description: 'socket is already connected'
    },
    {
        errno: 20,
        code: 'EMFILE',
        description: 'too many open files'
    },
    {
        errno: 21,
        code: 'EMSGSIZE',
        description: 'message too long'
    },
    {
        errno: 22,
        code: 'ENETDOWN',
        description: 'network is down'
    },
    {
        errno: 23,
        code: 'ENETUNREACH',
        description: 'network is unreachable'
    },
    {
        errno: 24,
        code: 'ENFILE',
        description: 'file table overflow'
    },
    {
        errno: 25,
        code: 'ENOBUFS',
        description: 'no buffer space available'
    },
    {
        errno: 26,
        code: 'ENOMEM',
        description: 'not enough memory'
    },
    {
        errno: 27,
        code: 'ENOTDIR',
        description: 'not a directory'
    },
    {
        errno: 28,
        code: 'EISDIR',
        description: 'illegal operation on a directory'
    },
    {
        errno: 29,
        code: 'ENONET',
        description: 'machine is not on the network'
    },
    {
        errno: 31,
        code: 'ENOTCONN',
        description: 'socket is not connected'
    },
    {
        errno: 32,
        code: 'ENOTSOCK',
        description: 'socket operation on non-socket'
    },
    {
        errno: 33,
        code: 'ENOTSUP',
        description: 'operation not supported on socket'
    },
    {
        errno: 34,
        code: 'ENOENT',
        description: 'no such file or directory'
    },
    {
        errno: 35,
        code: 'ENOSYS',
        description: 'function not implemented'
    },
    {
        errno: 36,
        code: 'EPIPE',
        description: 'broken pipe'
    },
    {
        errno: 37,
        code: 'EPROTO',
        description: 'protocol error'
    },
    {
        errno: 38,
        code: 'EPROTONOSUPPORT',
        description: 'protocol not supported'
    },
    {
        errno: 39,
        code: 'EPROTOTYPE',
        description: 'protocol wrong type for socket'
    },
    {
        errno: 40,
        code: 'ETIMEDOUT',
        description: 'connection timed out'
    },
    {
        errno: 41,
        code: 'ECHARSET',
        description: 'invalid Unicode character'
    },
    {
        errno: 42,
        code: 'EAIFAMNOSUPPORT',
        description: 'address family for hostname not supported'
    },
    {
        errno: 44,
        code: 'EAISERVICE',
        description: 'servname not supported for ai_socktype'
    },
    {
        errno: 45,
        code: 'EAISOCKTYPE',
        description: 'ai_socktype not supported'
    },
    {
        errno: 46,
        code: 'ESHUTDOWN',
        description: 'cannot send after transport endpoint shutdown'
    },
    {
        errno: 47,
        code: 'EEXIST',
        description: 'file already exists'
    },
    {
        errno: 48,
        code: 'ESRCH',
        description: 'no such process'
    },
    {
        errno: 49,
        code: 'ENAMETOOLONG',
        description: 'name too long'
    },
    {
        errno: 50,
        code: 'EPERM',
        description: 'operation not permitted'
    },
    {
        errno: 51,
        code: 'ELOOP',
        description: 'too many symbolic links encountered'
    },
    {
        errno: 52,
        code: 'EXDEV',
        description: 'cross-device link not permitted'
    },
    {
        errno: 53,
        code: 'ENOTEMPTY',
        description: 'directory not empty'
    },
    {
        errno: 54,
        code: 'ENOSPC',
        description: 'no space left on device'
    },
    {
        errno: 55,
        code: 'EIO',
        description: 'i/o error'
    },
    {
        errno: 56,
        code: 'EROFS',
        description: 'read-only file system'
    },
    {
        errno: 57,
        code: 'ENODEV',
        description: 'no such device'
    },
    {
        errno: 58,
        code: 'ESPIPE',
        description: 'invalid seek'
    },
    {
        errno: 59,
        code: 'ECANCELED',
        description: 'operation canceled'
    }
];

let ERRNO_TO_ERROR_MAP = {};
let CODE_TO_ERROR_MAP = {};

ALL_ERRORS.forEach(function (error) {
    ERRNO_TO_ERROR_MAP[error.errno] = error;
    CODE_TO_ERROR_MAP[error.code] = error;
});

const ERR_NO = {
    ALL_ERRORS: ALL_ERRORS,
    ERRNO_TO_ERROR_MAP: ERRNO_TO_ERROR_MAP,
    CODE_TO_ERROR_MAP: CODE_TO_ERROR_MAP
};

export default ERR_NO;
