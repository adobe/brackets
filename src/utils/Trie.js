 /*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, window, brackets */

define(function (require, exports, module) {
    "use strict";

    function TrieNode(char, value) {
        this.char = char;
        this.value = value;
        this.isWord = false;
        this.children = {};
    }
    
    TrieNode.prototype.toString = function () {
        var children = this.children,
            keys = Object.keys(children),
            childStrings = keys.map(function (key) {
                var node = children[key];
                return node.toString();
            });
        
        return this.char + " [" + childStrings.join(", ") + "]";
    };
    
    TrieNode.prototype.addChild = function (node) {
        var char = node.char;
        if (this.children[char]) {
            return false;
        } else {
            this.children[char] = node;
            return true;
        }
    };
    
    TrieNode.prototype.hasChildren = function () {
        return Object.keys(this.children).length > 0;
    };
    
    TrieNode.prototype.longestCommonPrefix = function () {
        var children = this.children,
            keys = Object.keys(children);
        if (keys.length === 1) {
            if (this.isWord) {
                return this.value;
            } else {
                return children[keys[0]].longestCommonPrefix();
            }
        } else {
            return this.value;
        }
    };
    
    function Trie(separator) {
        this.root = new TrieNode(null, "");
        this.separator = separator || "";
    }
    
    Trie.prototype._split = function (word) {
        var splits = word.split(this.separator),
            chars = [];
        
        splits.forEach(function (char) {
            if (char && char.length > 0) {
                chars.push(char);
            }
        });
        
        return chars;
    };

    Trie.prototype.addWord = function (word) {
        var currentNode = this.root,
            separator = this.separator;
        
        this._split(word).forEach(function (char, index) {
            var nextNode = currentNode.children[char];
            if (!nextNode) {
                nextNode = new TrieNode(char, [currentNode.value, char].join(separator));
                currentNode.addChild(nextNode);
            }
            currentNode = nextNode;
        });
        
        currentNode.isWord = true;
        
        return currentNode;
    };
    
    Trie.prototype.getNode = function (word) {
        var currentNode = this.root;

        this._split(word).some(function (char) {
            currentNode = currentNode.children[char];
            return !currentNode;
        });
        
        return currentNode;
    };
    
    Trie.prototype.getPrefix = function (word) {
        var currentNode = this.root,
            lastWord = currentNode.isWord ? currentNode : null;

        this._split(word).some(function (char) {
            currentNode = currentNode.children[char];
            lastWord = currentNode.isWord ? currentNode : lastWord;
            return !currentNode;
        });
        
        return lastWord;
    };

    Trie.prototype.removeNode = function (word) {
        var currentNode = this.root,
            nextNode,
            nodes = [];

        this._split(word).some(function (char) {
            var children = currentNode.children;

            if (children.hasOwnProperty(char)) {
                nextNode = children[char];
                nodes.unshift(currentNode);
                currentNode = nextNode;
                return false;
            } else {
                return true;
            }
        });
        
        currentNode.isWord = false;
        
        nodes.some(function (node) {
            var children = node.children,
                keys = Object.keys(children);

            if (keys.length === 1) {
                node.children = {};
            }

            return node.isWord;
        });
    };
    
    Trie.prototype.getWord = function (word) {
        var node = this.getNode(word);
        
        return node && node.isWord ? node : null;
    };
    
    Trie.prototype.contains = function (word, isWord) {
        var node = this.getNode(word);
        
        return node && (!isWord || node.isWord);
    };
    
    Trie.prototype.containsPrefix = function (word) {
        return this.contains(word, false);
    };

    Trie.prototype.containsWord = function (word) {
        return this.contains(word, true);
    };
    
    Trie.prototype.longestCommonPrefix = function () {
        return this.root.longestCommonPrefix();
    };
            
    module.exports = Trie;
});