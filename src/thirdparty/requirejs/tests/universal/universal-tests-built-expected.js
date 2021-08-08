
!function (name, definition) {
  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define('tail', [],function(){return definition()})
  else this[name] = definition()
}('tail', function() {
    return {
        name: 'tail'
    }
})
;
!function (name, definition) {
  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(name, definition)
  else this[name] = definition()
}('eye', function() {
    return {
        name: 'eye'
    }
})
;
define("eye", function(){});

/*jslint strict: false */
/*global define: false, module: false, require: false, window: false */

(function (define) {
    //The 'id' is optional, but recommended if this is
    //a popular web library that is used mostly in
    //non-AMD/Node environments.
    define('newt',['require','tail','eye'],function (require) {
        //If have dependencies, get them here
        var tail = require('tail'),
            eye = require('eye');

        //Return the module definition.
        return {
            name: 'newt',
            eyeName: eye.name,
            tailName: tail.name
        };
    });
}(typeof define === 'function' && define.amd ? define : function (id, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //Node
        module.exports = factory(require);
    } else {
        //Create a global function. Only works if
        //the code does not have dependencies, or
        //dependencies fit the call pattern below.
        window.myGlobal = factory(function (value) {
            return window[value];
        });
    }
}));

/*jslint strict: false */
/*global define: false, module: false, require: false, window: false */

(function (define) {
    //The 'id' is optional, but recommended if this is
    //a popular web library that is used mostly in
    //non-AMD/Node environments.
    define('spell', ['require','newt'],function (require) {
        //If have dependencies, get them here
        var newt = require('newt');

        //Return the module definition.
        return {
            name: 'spell',
            newtName: newt.name,
            tailName: newt.tailName,
            eyeName: newt.eyeName
        };
    });
}(typeof define === 'function' && define.amd ? define : function (id, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //Node
        module.exports = factory(require);
    } else {
        //Create a global function. Only works if
        //the code does not have dependencies, or
        //dependencies fit the call pattern below.
        window.myGlobal = factory(function (value) {
            return window[value];
        });
    }
}));

require({baseUrl: requirejs.isBrowser ? "./" : "./universal/"}, ["spell"], function(spell) {
    doh.register(
        "universal",
        [
            function universal(t){
                t.is('spell', spell.name);
                t.is('newt', spell.newtName);
                t.is('tail', spell.tailName);
                t.is('eye', spell.eyeName);
            }
        ]
    );

    doh.run();
});

define("universal-tests", function(){});
