/*jslint vars: true, plusplus: true, devel: true, browser: true, node: true, nomen: true, indent: 4, maxerr: 50 */
/*global brackets, define, require, $ */
define(function (require, exports, module) {
    'use strict';
     
    var moduleName = (function () {
        // this becomes public due to the reference exposure in the return below
        var addMessage = function (test) {
            this.publicMethod1();   // a test here to check the method showing
        };
        
        var name = "new name";
    
        // this is the "revealed" part of the module
        return {
            addMessage: addMessage,
            name:       name
        };
    }());
    moduleName.publicMethod1 = function () { // test for methods:name, addMessage, publicMethod1, priv
    };
    
    // extending a new module
    var extendedModule = (function (oldModule) {
        var parent = oldModule;
        
        parent.privilegedMethod = function () {
        };
        
        var privateMethod2 = function () {
        // test parent. make sure all methods defined in moduleName showing up here
        };
        return {
            newMethod : function () {
               // should see methods for oldModule oldModule., parent.
               // should see privateMethod2(
            }
        };
    }(moduleName || {}));//Module object is the existing module to extend. 
    
    // test here: check extendedModule    
    
    moduleName.addMessage("test");
    moduleName.name = " new name";
    
    //parent module
    var SearchEngine = (function () {
        //Private Method.
        var luckyAlgo = function () {
            //create one random number.
            return Math.floor(Math.random() * 11);
        };
        //Returning the object
        return {
            //privileged method.
            getYourLuckyNumber : function () {
                //Has access to its private method because of closure.
                return luckyAlgo();
            }
        };
    }());//Self executing method.
    // test SearchEngine.getYourLuckyNumber().toExponential();
  
    
    SearchEngine.subSearch = (function () {
       //Private variable.
        var defaultColor = "Orange";
        //private method.
        var myColorAlgo = function (num) {
            switch (num) {
            case 1:
                defaultColor = "Green";
                break;
            }
        };
        return {
            getYourLuckyColor : function () {
                //access to private variable because of closure.
                myColorAlgo(SearchEngine.getYourLuckyNumber());
                return defaultColor;
            }
        };
    }());
    
    require(["shirt"], function (myShirt) {
        // myShirt. test here        
    });
    var t2 = require("shirt");
    var size   = t2.size;
    var color  = t2.color;
    t2.material();
    
    var purchaseModule = require('purchase');
    purchaseModule.purchaseProduct();
    
    var hondaCar = require('Car');
    
});