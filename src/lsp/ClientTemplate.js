
define(function (require, exports, module) {
    "use strict";

    var ProjectManager          = require("project/ProjectManager");
    
    var _capabilities = {};

    class Client{

        getServerName(){
            throw "Must implement getServerName() in Client";
        }

        getServerPath(){
            throw "Must implement getServerPath() in Client";
        }

        getProjectRootUri(){
            return ProjectManager.getProjectRoot().fullPath;
        }

        getCapabilities(){
            return _capabilities;
        }

        getLanguageId(){
            throw "Must implement getLanguageId() in Client";
        }
    }

    module.exports = Client;
});