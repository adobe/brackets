/*global $, brackets, define, Promise*/

define(function (require, exports, module) {
    "use strict";

    var _                = brackets.getModule("thirdparty/lodash");
    var ExtensionManager = brackets.getModule("extensibility/ExtensionManager");
    var Strings          = brackets.getModule("strings");

    function getDateOfVersion(extensionId, versionNumber) {
        var versions = ExtensionManager.extensions[extensionId].registryInfo.versions;
        var versionObj = _.find(versions, function (obj) {
            return obj.version === versionNumber;
        });
        return versionObj ? versionObj.published.substring(0, 10) : null;
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

            // check for headers
            var m = line.match(/^#+([\s\S]+)$/);
            var className = null;
            if (m) {
                className = "header";
                line = m[1].trim();
            }

            // remove markdown bullet points
            line = line.replace(/^\s*[\-\*\+]\s+/, "");

            if (line) {
                target.lines.push({
                    className: className,
                    escapedContent: _.escape(line)
                });
            }
        });

        return changelog;
    }

    function createChangelogFromCommits(extensionId, commits) {
        var changelog = [];
        var versions = ExtensionManager.extensions[extensionId].registryInfo.versions;
        var githubDetails = getGithubDetails(extensionId);

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
                            escapedContent: _.escape(Strings.COMMITS)
                        }]
                    };
                    changelog.push(target);
                }
            }

            if (!target) {
                return;
            }

            var escapedLine = _.escape(obj.sha.substring(0, 7) + " - " + commit.message.trim());

            // convert links to other repositories
            escapedLine = escapedLine.replace(/(\s)([\-0-9a-zA-Z]+)\/([\-0-9a-zA-Z]+)#([0-9]+)/g, function (wholeMatch, pre, owner, repo, issueNumber) {
                var url = "https://github.com/" + owner + "/" + repo + "/issues/" + issueNumber;
                return pre + "<a href='" + url + "'>" + owner + "/" + repo + "#" + issueNumber + "</a>";
            });

            // convert local issue numbers to links
            escapedLine = escapedLine.replace(/(\s)#([0-9]+)/g, function (wholeMatch, pre, issueNumber) {
                var url = "https://github.com/" + githubDetails.owner + "/" + githubDetails.repo + "/issues/" + issueNumber;
                return pre + "<a href='" + url + "'>#" + issueNumber + "</a>";
            });

            // add end of lines
            escapedLine = escapedLine.replace(/\n+/g, "<br>");

            target.lines.push({
                escapedContent: escapedLine
            });
        });

        return changelog;
    }

    // ref: https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
    function base64toUtf8(str) {
        return decodeURIComponent(window.escape(window.atob(str)));
    }

    function getChangelogFromChangelogFile(extensionId, githubDetails) {
        return new Promise(function (resolve, reject) {
            var url = "https://raw.githubusercontent.com/" + githubDetails.owner + "/" + githubDetails.repo + "/master/CHANGELOG.md";
            // apiUrl "https://api.github.com/repos/" + githubDetails.owner + "/" + githubDetails.repo + "/contents/CHANGELOG.md"
            $.get(url)
                .done(function (response) {
                    if (typeof response === "string") {
                        resolve(createChangelogFromMarkdown(extensionId, response));
                    } else {
                        // base64 to utf8 transformation is required for apiUrl
                        var utf8content = base64toUtf8(response.content);
                        resolve(createChangelogFromMarkdown(extensionId, utf8content));
                    }
                })
                .fail(function (response) {
                    reject("Couldn't load changelog from CHANGELOG.md: " + response.statusText);
                });
        });
    }

    function githubHtmlToCommits(html) {
        return $(html).find(".commit-title")
            .map(function () {
                var $aMessage = $(this).find("a.message").first();
                var $commitMeta = $(this).parent().children(".commit-meta");
                return {
                    sha: $aMessage.attr("href").match(/commit\/([a-zA-Z0-9]+)/)[1],
                    commit: {
                        message: $aMessage.attr("title"),
                        committer: {
                            date: $commitMeta.children("time").attr("datetime")
                        }
                    }
                };
            })
            .toArray();
    }

    function getChangelogFromCommits(extensionId, githubDetails) {
        return new Promise(function (resolve, reject) {
            var url = "https://github.com/" + githubDetails.owner + "/" + githubDetails.repo + "/commits/master";
            // apiUrl = "https://api.github.com/repos/" + githubDetails.owner + "/" + githubDetails.repo + "/commits"
            $.get(url)
                .done(function (response) {
                    response = githubHtmlToCommits(response);
                    resolve(createChangelogFromCommits(extensionId, response));
                })
                .fail(function (response) {
                    reject("Couldn't load changelog from GitHub commits: " + response.statusText);
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

    // exposed for testing purposes
    exports._getDateOfVersion               = getDateOfVersion;
    exports._getGithubUrl                   = getGithubUrl;
    exports._getGithubDetails               = getGithubDetails;
    exports._createChangelogFromMarkdown    = createChangelogFromMarkdown;
    exports._createChangelogFromCommits     = createChangelogFromCommits;
    exports._base64toUtf8                   = base64toUtf8;
    exports._getChangelogFromChangelogFile  = getChangelogFromChangelogFile;
    exports._githubHtmlToCommits            = githubHtmlToCommits;
    exports._getChangelogFromCommits        = getChangelogFromCommits;
    // public
    exports.downloadChangelog = downloadChangelog;

});
