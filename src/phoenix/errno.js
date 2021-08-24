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

const ERROR_CODES ={
    ENOENT: 'ENOENT',
    UNKNOWN: 'UNKNOWN',
    OK: 'OK',
    EOF: 'EOF',
    EADDRINFO: 'EADDRINFO',
    EACCES: 'EACCES',
    EAGAIN: 'EAGAIN',
    EADDRINUSE: 'EADDRINUSE',
    EADDRNOTAVAIL: 'EADDRNOTAVAIL',
    EAFNOSUPPORT: 'EAFNOSUPPORT',
    EALREADY: 'EALREADY',
    EBADF: 'EBADF',
    EBUSY: 'EBUSY',
    ECONNABORTED: 'ECONNABORTED',
    ECONNREFUSED: 'ECONNREFUSED',
    ECONNRESET: 'ECONNRESET',
    EDESTADDRREQ: 'EDESTADDRREQ',
    EFAULT: 'EFAULT',
    EHOSTUNREACH: 'EHOSTUNREACH',
    EINTR: 'EINTR',
    EINVAL: 'EINVAL',
    EISCONN: 'EISCONN',
    EMFILE: 'EMFILE',
    EMSGSIZE: 'EMSGSIZE',
    ENETDOWN: 'ENETDOWN',
    ENETUNREACH: 'ENETUNREACH',
    ENFILE: 'ENFILE',
    ENOBUFS: 'ENOBUFS',
    ENOMEM: 'ENOMEM',
    ENOTDIR: 'ENOTDIR',
    EISDIR: 'EISDIR',
    ENONET: 'ENONET',
    ENOTCONN: 'ENOTCONN',
    ENOTSOCK: 'ENOTSOCK',
    ENOTSUP: 'ENOTSUP',
    ENOSYS: 'ENOSYS',
    EPIPE: 'EPIPE',
    EPROTO: 'EPROTO',
    EPROTONOSUPPORT: 'EPROTONOSUPPORT',
    EPROTOTYPE: 'EPROTOTYPE',
    ETIMEDOUT: 'ETIMEDOUT',
    ECHARSET: 'ECHARSET',
    EAIFAMNOSUPPORT: 'EAIFAMNOSUPPORT',
    EAISERVICE: 'EAISERVICE',
    EAISOCKTYPE: 'EAISOCKTYPE',
    ESHUTDOWN: 'ESHUTDOWN',
    EEXIST: 'EEXIST',
    ESRCH: 'ESRCH',
    ENAMETOOLONG: 'ENAMETOOLONG',
    EPERM: 'EPERM',
    ELOOP: 'ELOOP',
    EXDEV: 'EXDEV',
    ENOTEMPTY: 'ENOTEMPTY',
    ENOSPC: 'ENOSPC',
    EIO: 'EIO',
    EROFS: 'EROFS',
    ENODEV: 'ENODEV',
    ESPIPE: 'ESPIPE',
    ECANCELED: 'ECANCELED'
};

const FS_ERROR_CODES = {
    ENOENT: ERROR_CODES.ENOENT, //no such file or directory
    EOF: ERROR_CODES.EOF, //end of file
    EACCES: ERROR_CODES.EACCES, //permission denied
    EAGAIN: ERROR_CODES.EAGAIN, //resource temporarily unavailable
    EBADF: ERROR_CODES.EBADF, //bad file descriptor
    EBUSY: ERROR_CODES.EBUSY, //resource busy or locked
    EINVAL: ERROR_CODES.EINVAL, //invalid argument
    EMFILE: ERROR_CODES.EMFILE, //too many open files,
    ENFILE: ERROR_CODES.ENFILE, //file table overflow
    ENOBUFS: ERROR_CODES.ENOBUFS, //no buffer space available
    ENOTDIR: ERROR_CODES.ENOTDIR, //not a directory
    EISDIR: ERROR_CODES.EISDIR, //illegal operation on a directory
    ENOSYS: ERROR_CODES.ENOSYS, //function not implemented. Eg. creating linux sym links in win
    ECHARSET: ERROR_CODES.ECHARSET, //invalid Unicode character
    EEXIST: ERROR_CODES.EEXIST, //file already exists
    ENAMETOOLONG: ERROR_CODES.ENAMETOOLONG, //name too long
    EPERM: ERROR_CODES.EPERM, //operation not permitted
    ELOOP: ERROR_CODES.ELOOP, //too many symbolic links encountered
    EXDEV: ERROR_CODES.EXDEV, //cross-device link not permitted
    ENOTEMPTY: ERROR_CODES.ENOTEMPTY, //directory not empty
    ENOSPC: ERROR_CODES.ENOSPC, //no space left on device
    EIO: ERROR_CODES.EIO, //i/o error
    EROFS: ERROR_CODES.EROFS, //read-only file system
    ESPIPE: ERROR_CODES.ESPIPE, //invalid seek
    ECANCELED: ERROR_CODES.ECANCELED //operation canceled
};

const ALL_ERRORS = [
    {
        errno: -2,
        code: ERROR_CODES.ENOENT,
        description: 'no such file or directory'
    },
    {
        errno: -1,
        code: ERROR_CODES.UNKNOWN,
        description: 'unknown error'
    },
    {
        errno: 0,
        code: ERROR_CODES.OK,
        description: 'success'
    },
    {
        errno: 1,
        code: ERROR_CODES.EOF,
        description: 'end of file'
    },
    {
        errno: 2,
        code: ERROR_CODES.EADDRINFO,
        description: 'getaddrinfo error'
    },
    {
        errno: 3,
        code: ERROR_CODES.EACCES,
        description: 'permission denied'
    },
    {
        errno: 4,
        code: ERROR_CODES.EAGAIN,
        description: 'resource temporarily unavailable'
    },
    {
        errno: 5,
        code: ERROR_CODES.EADDRINUSE,
        description: 'address already in use'
    },
    {
        errno: 6,
        code: ERROR_CODES.EADDRNOTAVAIL,
        description: 'address not available'
    },
    {
        errno: 7,
        code: ERROR_CODES.EAFNOSUPPORT,
        description: 'address family not supported'
    },
    {
        errno: 8,
        code: ERROR_CODES.EALREADY,
        description: 'connection already in progress'
    },
    {
        errno: 9,
        code: ERROR_CODES.EBADF,
        description: 'bad file descriptor'
    },
    {
        errno: 10,
        code: ERROR_CODES.EBUSY,
        description: 'resource busy or locked'
    },
    {
        errno: 11,
        code: ERROR_CODES.ECONNABORTED,
        description: 'software caused connection abort'
    },
    {
        errno: 12,
        code: ERROR_CODES.ECONNREFUSED,
        description: 'connection refused'
    },
    {
        errno: 13,
        code: ERROR_CODES.ECONNRESET,
        description: 'connection reset by peer'
    },
    {
        errno: 14,
        code: ERROR_CODES.EDESTADDRREQ,
        description: 'destination address required'
    },
    {
        errno: 15,
        code: ERROR_CODES.EFAULT,
        description: 'bad address in system call argument'
    },
    {
        errno: 16,
        code: ERROR_CODES.EHOSTUNREACH,
        description: 'host is unreachable'
    },
    {
        errno: 17,
        code: ERROR_CODES.EINTR,
        description: 'interrupted system call'
    },
    {
        errno: 18,
        code: ERROR_CODES.EINVAL,
        description: 'invalid argument'
    },
    {
        errno: 19,
        code: ERROR_CODES.EISCONN,
        description: 'socket is already connected'
    },
    {
        errno: 20,
        code: ERROR_CODES.EMFILE,
        description: 'too many open files'
    },
    {
        errno: 21,
        code: ERROR_CODES.EMSGSIZE,
        description: 'message/datagram too long'
    },
    {
        errno: 22,
        code: ERROR_CODES.ENETDOWN,
        description: 'network is down'
    },
    {
        errno: 23,
        code: ERROR_CODES.ENETUNREACH,
        description: 'network is unreachable'
    },
    {
        errno: 24,
        code: ERROR_CODES.ENFILE,
        description: 'file table overflow'
    },
    {
        errno: 25,
        code: ERROR_CODES.ENOBUFS,
        description: 'no buffer space available'
    },
    {
        errno: 26,
        code: ERROR_CODES.ENOMEM,
        description: 'not enough memory/ high virtual memory usage'
    },
    {
        errno: 27,
        code: ERROR_CODES.ENOTDIR,
        description: 'not a directory'
    },
    {
        errno: 28,
        code: ERROR_CODES.EISDIR,
        description: 'illegal operation on a directory'
    },
    {
        errno: 29,
        code: ERROR_CODES.ENONET,
        description: 'machine is not on the network'
    },
    {
        errno: 31,
        code: ERROR_CODES.ENOTCONN,
        description: 'socket is not connected'
    },
    {
        errno: 32,
        code: ERROR_CODES.ENOTSOCK,
        description: 'socket operation on non-socket'
    },
    {
        errno: 33,
        code: ERROR_CODES.ENOTSUP,
        description: 'operation not supported on socket'
    },
    {
        errno: 34,
        code: ERROR_CODES.ENOENT,
        description: 'no such file or directory'
    },
    {
        errno: 35,
        code: ERROR_CODES.ENOSYS,
        description: 'function not implemented'
    },
    {
        errno: 36,
        code: ERROR_CODES.EPIPE,
        description: 'broken pipe'
    },
    {
        errno: 37,
        code: ERROR_CODES.EPROTO,
        description: 'protocol error'
    },
    {
        errno: 38,
        code: ERROR_CODES.EPROTONOSUPPORT,
        description: 'protocol not supported'
    },
    {
        errno: 39,
        code: ERROR_CODES.EPROTOTYPE,
        description: 'protocol wrong type for socket'
    },
    {
        errno: 40,
        code: ERROR_CODES.ETIMEDOUT,
        description: 'connection timed out'
    },
    {
        errno: 41,
        code: ERROR_CODES.ECHARSET,
        description: 'invalid Unicode character'
    },
    {
        errno: 42,
        code: ERROR_CODES.EAIFAMNOSUPPORT,
        description: 'address family for hostname not supported'
    },
    {
        errno: 44,
        code: ERROR_CODES.EAISERVICE,
        description: 'servname not supported for ai_socktype'
    },
    {
        errno: 45,
        code: ERROR_CODES.EAISOCKTYPE,
        description: 'ai_socktype not supported'
    },
    {
        errno: 46,
        code: ERROR_CODES.ESHUTDOWN,
        description: 'cannot send after transport endpoint shutdown'
    },
    {
        errno: 47,
        code: ERROR_CODES.EEXIST,
        description: 'file already exists'
    },
    {
        errno: 48,
        code: ERROR_CODES.ESRCH,
        description: 'no such process'
    },
    {
        errno: 49,
        code: ERROR_CODES.ENAMETOOLONG,
        description: 'name too long'
    },
    {
        errno: 50,
        code: ERROR_CODES.EPERM,
        description: 'operation not permitted'
    },
    {
        errno: 51,
        code: ERROR_CODES.ELOOP,
        description: 'too many symbolic links encountered'
    },
    {
        errno: 52,
        code: ERROR_CODES.EXDEV,
        description: 'cross-device link not permitted'
    },
    {
        errno: 53,
        code: ERROR_CODES.ENOTEMPTY,
        description: 'directory not empty'
    },
    {
        errno: 54,
        code: ERROR_CODES.ENOSPC,
        description: 'no space left on device'
    },
    {
        errno: 55,
        code: ERROR_CODES.EIO,
        description: 'i/o error'
    },
    {
        errno: 56,
        code: ERROR_CODES.EROFS,
        description: 'read-only file system'
    },
    {
        errno: 57,
        code: ERROR_CODES.ENODEV,
        description: 'no such device'
    },
    {
        errno: 58,
        code: ERROR_CODES.ESPIPE,
        description: 'invalid seek'
    },
    {
        errno: 59,
        code: ERROR_CODES.ECANCELED,
        description: 'operation canceled'
    }
];

let ERRNO_TO_ERROR_MAP = {};
let CODE_TO_ERROR_MAP = {};

ALL_ERRORS.forEach(function (error) {
    ERRNO_TO_ERROR_MAP[error.errno] = error;
    CODE_TO_ERROR_MAP[error.code] = error;
});

const ERR_CODES = {
    ERROR_CODES: ERROR_CODES,
    FS_ERROR_CODES: FS_ERROR_CODES,
    ALL_ERRORS: ALL_ERRORS,
    ERRNO_TO_ERROR_MAP: ERRNO_TO_ERROR_MAP,
    CODE_TO_ERROR_MAP: CODE_TO_ERROR_MAP
};

export default ERR_CODES;
