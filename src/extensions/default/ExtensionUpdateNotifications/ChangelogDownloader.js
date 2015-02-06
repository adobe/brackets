/*global $, brackets, define, Promise*/

define(function (require, exports, module) {
    "use strict";

    var _                = brackets.getModule("thirdparty/lodash");
    var ExtensionManager = brackets.getModule("extensibility/ExtensionManager");

    function getDateOfVersion(extensionId, versionNumber) {
        var versions = ExtensionManager.extensions[extensionId].registryInfo.versions;
        var versionObj = _.find(versions, function (obj) {
            return obj.version === versionNumber;
        });
        return versionObj ? versionObj.published.substring(0, 10) : null;
    }

    function createChangelogFromMarkdown(extensionId, str) {
        var changelog = [];
        var version;
        var versionPublished;

        str.split("\n").forEach(function (line) {
            var target;

            var versionHeader = line.match(/^#.*([0-9]+\.[0-9]+\.[0-9]+)/);
            if (versionHeader) {
                version = versionHeader[1];
                versionPublished = getDateOfVersion(extensionId, version);
                return;
            }

            if (version && versionPublished) {
                target = _.find(changelog, function (o) {
                    return o.version === version;
                });
                if (!target) {
                    target = {
                        version: version,
                        date: versionPublished,
                        lines: []
                    };
                    changelog.push(target);
                }
            }

            line = line.trim();

            if (target && line) {
                target.lines.push(line);
            }
        });

        return changelog;
    }

    function createChangelogFromCommits(extensionId, commits) {
        var changelog = [];
        var versions = ExtensionManager.extensions[extensionId].registryInfo.versions;

        commits.forEach(function (obj) {
            var commit = obj.commit;
            var commitDate = commit.committer.date;
            var target, version, versionDate, i;

            // check for the first version published after the commit was made
            for (i = 0; i < versions.length; i++) {
                if (versions[i].published > commitDate) {
                    version = versions[i].version;
                    versionDate = versions[i].published.substring(0, 10);
                    break;
                }
            }

            if (version) {
                target = _.find(changelog, function (o) {
                    return o.version === version;
                });
                if (!target) {
                    target = {
                        version: version,
                        date: versionDate,
                        lines: []
                    };
                    changelog.push(target);
                }
            }

            commit.message = commit.message.trim();

            if (target && commit.message) {
                target.lines.push(commit.message);
            }
        });

        return changelog;
    }

    // ref: https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
    function base64toUtf8(str) {
        return decodeURIComponent(window.escape(window.atob(str)));
    }

    function getGithubUrl(extensionId) {
        var extensionInfo = ExtensionManager.extensions[extensionId];

        var metadata = extensionInfo.registryInfo ? extensionInfo.registryInfo.metadata : extensionInfo.installInfo.metadata;

        if (metadata.repository) {

            return typeof metadata.repository === "string" ? metadata.repository : metadata.repository.url;

        } else if (metadata.homepage) {

            return metadata.homepage;

        } else {

            throw new Error("Cannot get Github url from: " + JSON.stringify(metadata));

        }
    }

    function getGithubDetails(extensionId) {
        var repoUrl = getGithubUrl(extensionId);
        var m = repoUrl.match(/github.com\/([^\/]+)\/([^\/]+)/);
        return {
            owner: m[1],
            repo: m[2].replace(/\.git$/, "")
        };
    }

    function downloadChangelog(extensionId) {
        return new Promise(function (resolve, reject) {
            var githubDetails = getGithubDetails(extensionId);

            function getChangelogFromCommits() {
                $.get("https://api.github.com/repos/" + githubDetails.owner + "/" + githubDetails.repo + "/commits")
                    .done(function (response) {
                        resolve(createChangelogFromCommits(extensionId, response));
                    })
                    .fail(function (response) {
                        reject("Couldn't load changelog: " + response.statusText);
                    });
            }

            $.get("https://api.github.com/repos/" + githubDetails.owner + "/" + githubDetails.repo + "/contents/CHANGELOG.md")
                .done(function (response) {
                    var utf8content = base64toUtf8(response.content);
                    resolve(createChangelogFromMarkdown(extensionId, utf8content));
                })
                .fail(function (response) {
                    if (response.status === 404) {
                        return getChangelogFromCommits();
                    }
                    reject("Couldn't load changelog: " + response.statusText);
                });

        });
    }

    exports.downloadChangelog = downloadChangelog;

});
