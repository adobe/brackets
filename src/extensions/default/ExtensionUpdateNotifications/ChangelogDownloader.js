/*global $, brackets, define, Promise*/

define(function (require, exports, module) {
    "use strict";

    var ExtensionManager  = brackets.getModule("extensibility/ExtensionManager");

    function createChangelogFromMarkdown(str) {
        var changelog = {};
        var currentTarget = null;

        str.split("\n").forEach(function (line) {

            var versionHeader = line.match(/^#.*([0-9]+\.[0-9]+\.[0-9]+)/);
            if (versionHeader) {
                changelog[versionHeader[1]] = currentTarget = [];
                return;
            }

            if (!currentTarget) {
                return;
            }

            currentTarget.push(line);

        });

        return changelog;
    }

    function createChangelogFromCommits(extensionId, commits) {
        var changelog = {};
        var versions = ExtensionManager.extensions[extensionId].registryInfo.versions;

        commits.forEach(function (obj) {
            var commit = obj.commit;
            var commitDate = commit.committer.date;
            var key, i;

            // check for the first version published after the commit was made
            for (i = 0; i < versions.length; i++) {
                if (versions[i].published > commitDate) {
                    key = versions[i].version;
                    break;
                }
            }

            if (!key) {
                // commits made after last version in the registry was published
                return;
            }

            if (!changelog[key]) {
                changelog[key] = [];
            }

            changelog[key].push(commit.message);
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
                    resolve(createChangelogFromMarkdown(utf8content));
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
