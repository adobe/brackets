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

            var versionHeader = line.match(/^[#\+].*([0-9]+\.[0-9]+\.[0-9]+)/);
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

            if (!target) {
                return;
            }

            /* TODO: parse headers from MARKDOWN
            line = line.trim();
            // replace some leading markdown non-word characters
            line = line.replace(/^[^0-9A-Za-z]+/, "");
            */

            if (line) {
                target.lines.push({
                    content: line
                });
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
                        lines: [{
                            className: "header",
                            content: "Commits"
                        }]
                    };
                    changelog.push(target);
                }
            }

            if (!target) {
                return;
            }

            commit.message = commit.message.trim();

            if (commit.message) {
                target.lines.push({
                    content: obj.sha.substring(0, 7) + " - " + commit.message
                });
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

        // https/ssh version
        var m = repoUrl.match(/github\.com[:\/]([^\/]+)\/([^\/]+)/);

        return {
            owner: m[1],
            repo: m[2].replace(/\.git$/, "")
        };
    }

    function getChangelogFromChangelogFile(extensionId, githubDetails) {
        return new Promise(function (resolve, reject) {
            $.get("https://api.github.com/repos/" + githubDetails.owner + "/" + githubDetails.repo + "/contents/CHANGELOG.md")
                .done(function (response) {
                    var utf8content = base64toUtf8(response.content);
                    resolve(createChangelogFromMarkdown(extensionId, utf8content));
                })
                .fail(function (response) {
                    reject("Couldn't load changelog: " + response.statusText);
                });
        });
    }

    function getChangelogFromCommits(extensionId, githubDetails) {
        return new Promise(function (resolve, reject) {
            $.get("https://api.github.com/repos/" + githubDetails.owner + "/" + githubDetails.repo + "/commits")
                .done(function (response) {
                    resolve(createChangelogFromCommits(extensionId, response));
                })
                .fail(function (response) {
                    reject("Couldn't load changelog: " + response.statusText);
                });
        });
    }

    function downloadChangelog(extensionId) {
        return new Promise(function (resolve, reject) {

            var isInRegistry = ExtensionManager.extensions[extensionId].registryInfo;
            if (!isInRegistry) {
                reject("Couldn't find " + extensionId + " in the extension registry!");
                return;
            }

            var githubDetails = getGithubDetails(extensionId);

            var changelogFile = null;
            var changelogCommits = null;

            var finish = _.after(2, function () {
                if (changelogFile && changelogCommits) {
                    var mergedChangelogs = _.union(_.pluck(changelogFile, "version"), _.pluck(changelogCommits, "version"))
                        .map(function (version) {
                            var find1 = _.find(changelogFile, { version: version });
                            var find2 = _.find(changelogCommits, { version: version });

                            if (find1 && find2) {
                                find1.lines = find1.lines.concat(find2.lines);
                                return find1;
                            }

                            return find1 || find2;
                        });
                    resolve(mergedChangelogs);
                    return;
                }
                if (changelogFile || changelogCommits) {
                    resolve(changelogFile || changelogCommits);
                    return;
                }
                reject("Couldn't load any changelog information!");
            });

            getChangelogFromChangelogFile(extensionId, githubDetails)
                .then(function (result) {
                    changelogFile = result;
                })
                .catch(function (e) {
                    console.error(e);
                })
                .then(function () {
                    finish();
                });

            getChangelogFromCommits(extensionId, githubDetails)
                .then(function (result) {
                    changelogCommits = result;
                })
                .catch(function (e) {
                    console.error(e);
                })
                .then(function () {
                    finish();
                });

        });
    }

    exports.downloadChangelog = downloadChangelog;

});
