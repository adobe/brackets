'use strict';

var binary = require('binary');
var Q = require('q');

var convertDateTime = function (dosDate, dosTime) {
    var year = ((dosDate >> 9) & 0x7F) + 1980;
    var month = (dosDate >> 5) & 0x0F;
    var day = dosDate & 0x1F;

    var hour = (dosTime >> 11);
    var minute = (dosTime >> 5) & 0x3F;
    var second = (dosTime & 0x1F) * 2;

    var result = new Date(year, month - 1, day, hour, minute, second, 0);

    return result;
};

var readEndRecord = function (buffer) {
    var data = binary.parse(buffer)
    .word32lu('signature')
    .word16lu('diskNumber')
    .word16lu('directoryStartDisk')
    .word16lu('directoryEntryCountDisk')
    .word16lu('directoryEntryCount')
    .word32lu('directorySize')
    .word32lu('directoryOffset')
    .word16lu('commentLength')
    .buffer('comment', 'commentLength')
    .vars;

    data.comment = data.comment.toString();

    return data;
};

var readDirectory = function (stream, count) {
    var deferred = Q.defer();
    var stage = 'main';
    var directory = [];
    var current;

    stream.on('readable', function () {
        var chunk;

        while (directory.length < count) {
            if (stage === 'main') {
                chunk = stream.read(46);
                if (chunk === null) {
                    return;
                }

                current = binary.parse(chunk)
                .word32lu('signature')
                .word8lu('creatorSpecVersion')
                .word8lu('creatorPlatform')
                .word8lu('requiredSpecVersion')
                .word8lu('requiredPlatform')
                .word16lu('generalPurposeBitFlag')
                .word16lu('compressionMethod')
                .word16lu('lastModFileTime')
                .word16lu('lastModFileDate')
                .word32lu('crc32')
                .word32lu('compressedSize')
                .word32lu('uncompressedSize')
                .word16lu('fileNameLength')
                .word16lu('extraFieldLength')
                .word16lu('fileCommentLength')
                .word16lu('diskNumberStart')
                .word16lu('internalFileAttributes')
                .word32lu('externalFileAttributes')
                .word32lu('relativeOffsetOfLocalHeader')
                .vars;

                current.generalPurposeFlags = [];

                for (var i = 0; i < 16; i++) {
                    current.generalPurposeFlags[i] = (current.generalPurposeBitFlag >> i) & 1;
                }

                current.modifiedTime = convertDateTime(current.lastModFileDate, current.lastModFileTime);
                current.fileName = current.extraField = current.fileComment = '';
                current.headerLength = 46 + current.fileNameLength + current.extraFieldLength + current.fileCommentLength;

                stage = 'fileName';
            }

            if (stage === 'fileName') {
                if (current.fileNameLength > 0) {
                    chunk = stream.read(current.fileNameLength);
                    if (chunk === null) {
                        return;
                    }

                    current.fileName = chunk.toString();
                }

                stage = 'extraField';
            }

            if (stage === 'extraField') {
                if (current.extraFieldLength > 0) {
                    chunk = stream.read(current.extraFieldLength);
                    if (chunk === null) {
                        return;
                    }

                    current.extraField = chunk.toString();
                }

                stage = 'fileComment';
            }

            if (stage === 'fileComment') {
                if (current.fileCommentLength > 0) {
                    chunk = stream.read(current.fileCommentLength);
                    if (chunk === null) {
                        return;
                    }
                    current.fileComment = chunk.toString();
                }

                directory.push(current);

                if (directory.length === count) {
                    deferred.resolve(directory);
                    stream.resume();
                }

                stage = 'main';
            }
        }
    });

    stream.on('end', function () {
        deferred.resolve(directory);
    });

    stream.on('error', function (err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

var readFileEntry = function (stream) {
    var deferred = Q.defer();
    var stage = 'main';
    var data;

    stream.on('readable', function () {
        var chunk;

        if (stage === 'main') {
            chunk = stream.read(30);
            if (chunk === null) {
                return;
            }

            data = binary.parse(chunk)
            .word32lu('signature')
            .word16lu('versionNeededToExtract')
            .word16lu('generalPurposeBitFlag')
            .word16lu('compressionMethod')
            .word16lu('lastModFileTime')
            .word16lu('lastModFileDate')
            .word32lu('crc32')
            .word32lu('compressedSize')
            .word32lu('uncompressedSize')
            .word16lu('fileNameLength')
            .word16lu('extraFieldLength')
            .vars;

            data.fileName = data.extraField = '';

            data.entryLength = 30 + data.fileNameLength + data.extraFieldLength;

            stage = 'fileName';
        }

        if (stage === 'fileName') {
            if (data.fileNameLength > 0) {
                chunk = stream.read(data.fileNameLength);
                if (chunk === null) {
                    return;
                }

                data.fileName = chunk.toString();
            }

            stage = 'extraField';
        }

        if (stage === 'extraField') {
            if (data.extraFieldLength > 0) {
                chunk = stream.read(data.extraFieldLength);
                if (chunk === null) {
                    return;
                }

                data.extraField = chunk.toString();
            }

            deferred.resolve(data);
            // Run the stream to the end so that it can be closed
            stream.resume();
        }
    });

    stream.on('end', function () {
        deferred.resolve(data);
    });

    stream.on('close', function () {
        deferred.resolve(data);
    });

    stream.on('error', function (err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

module.exports = {
    readEndRecord: readEndRecord,
    readDirectory: readDirectory,
    readFileEntry: readFileEntry
};
