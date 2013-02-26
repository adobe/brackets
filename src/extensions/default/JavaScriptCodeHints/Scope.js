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
/*global define */

define(function (require, exports, module) {
    "use strict";

    /*
     * Performs a binary search among an array of scope objects for one with a
     * range that contains pos. The array must be non-empty and sorted
     * ascending according to the objects' (disjoint) ranges.
     *
     * @param {Array.<Object>} arr - the sorted array of scope objects to
     *      search
     * @param {number} pos - the position to search for in arr
     * @return {Object} - the scope object containing pos
     */
    function binaryRangeSearch(arr, pos) {
        var low     = 0,
            high    = arr.length,
            middle  = Math.floor(high / 2);

        // binary search for the position among the sorted ranges
        while (low < middle && middle < high) {
            if (arr[middle].range.end < pos) {
                low = middle;
                middle += Math.floor((high - middle) / 2);
            } else if (arr[middle].range.start > pos) {
                high = middle;
                middle = low + Math.floor((middle - low) / 2);
            } else {
                break;
            }
        }
        return arr[middle];
    }

    /**
     * Build a scope object from AST tree as a child of the given parent.
     * 
     * @constructor
     * @param {AST} tree - an AST as described at 
            https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API
     * @param {?Scope=} parent - the (optional) parent of the new Scope
     */
    function Scope(tree, parent) {

        /*
         * Given a member expression, try to add a target-property association
         * to the given scope.
         * 
         * @param {AST} object - the lookup object
         * @param {AST} property - the property being looked up
         * @param {Scope} parent - the Scope object in which the association
         *      occurs.
         */
        function _buildAssociations(object, property, parent) {
            if (property.type === "Identifier") {
                if (object.type === "Identifier") {
                    parent.addAssociation(object, property);
                } else if (object.type === "MemberExpression") {
                    if (object.computed === false) {
                        _buildAssociations(object.property, property, parent);
                    }
                } else if (object.type === "CallExpression") {
                    _buildAssociations(object.callee, property, parent);
                } else if (object.type === "ThisExpression") {
                    object.name = "this";
                    parent.addAssociation(object, property);
                } else {
                    // most likely a literal
                    return;
                }
            } else {
                // Because we restrict to non-computed property lookups, this
                // should be unreachable
                throw "Expected identifier but found " + property.type;
            }
        }

        /*
         * Walk a given AST and add scope information to a given parent scope, 
         * including new child Scope objects. 
         * 
         * @param {AST} tree - the AST from which the Scope is constructed
         * @param {Scope} parent - the parent of the Scope to be constructed
         */
        function _buildScope(tree, parent) {
            var child;

            if (tree === undefined || tree === null) {
                return;
            }

            switch (tree.type) {
            case "Program":
            case "BlockStatement":
                tree.body.forEach(function (t) {
                    _buildScope(t, parent);
                });
                break;

            case "FunctionDeclaration":
                parent.addDeclaration(tree.id);
                _buildScope(tree.id, parent);
                child = new Scope(tree, parent);
                child.addAllDeclarations(tree.params);
                tree.params.forEach(function (t) {
                    _buildScope(t, child);
                });
                parent.addChildScope(child);
                _buildScope(tree.body, child);
                break;

            case "VariableDeclaration":
                // FIXME handle let scoping
                tree.declarations.forEach(function (t) {
                    _buildScope(t, parent);
                });
                break;

            case "VariableDeclarator":
                parent.addDeclaration(tree.id);
                _buildScope(tree.id, parent);
                if (tree.init !== null) {
                    _buildScope(tree.init, parent);
                }
                break;

            case "ExpressionStatement":
                _buildScope(tree.expression, parent);
                break;

            case "SwitchStatement":
                _buildScope(tree.discriminant, parent);
                if (tree.cases) {
                    tree.cases.forEach(function (t) {
                        _buildScope(t, parent);
                    });
                }
                break;

            case "SwitchCase":
                tree.consequent.forEach(function (t) {
                    _buildScope(t, parent);
                });
                if (tree.test) {
                    _buildScope(tree.test, parent);
                }
                break;

            case "TryStatement":
                tree.handlers.forEach(function (t) {
                    _buildScope(t, parent);
                });
                _buildScope(tree.block, parent);
                if (tree.finalizer) {
                    _buildScope(tree.finalizer, parent);
                }
                break;

            case "ThrowStatement":
                _buildScope(tree.argument, parent);
                break;

            case "WithStatement":
                _buildScope(tree.object, parent);
                _buildScope(tree.body, parent);
                break;

            case "CatchClause":
                if (tree.guard) {
                    _buildScope(tree.guard, parent);
                }
                // FIXME: Is this the correct way to handle catch?
                child = new Scope(tree, parent);
                child.addDeclaration(tree.param);
                _buildScope(tree.param, child);
                parent.addChildScope(child);
                _buildScope(tree.body, child);
                break;

            case "ReturnStatement":
                if (tree.argument) {
                    _buildScope(tree.argument, parent);
                }
                break;

            case "ForStatement":
                _buildScope(tree.body, parent);
                if (tree.init) {
                    _buildScope(tree.init, parent);
                }
                if (tree.test) {
                    _buildScope(tree.test, parent);
                }
                if (tree.update) {
                    _buildScope(tree.update, parent);
                }
                break;

            case "ForInStatement":
                _buildScope(tree.left, parent);
                _buildScope(tree.right, parent);
                _buildScope(tree.body, parent);
                break;

            case "LabeledStatement":
                _buildScope(tree.body, parent);
                break;

            case "BreakStatement":
            case "ContinueStatement":
                if (tree.label) {
                    _buildScope(tree.label, parent);
                }
                break;

            case "UpdateExpression":
            case "UnaryExpression":
                _buildScope(tree.argument, parent);
                break;

            case "IfStatement":
            case "ConditionalExpression":
                _buildScope(tree.test, parent);
                _buildScope(tree.consequent, parent);
                if (tree.alternate) {
                    _buildScope(tree.alternate, parent);
                }
                break;

            case "WhileStatement":
            case "DoWhileStatement":
                _buildScope(tree.test, parent);
                _buildScope(tree.body, parent);
                break;

            case "SequenceExpression":
                tree.expressions.forEach(function (t) {
                    _buildScope(t, parent);
                });
                break;

            case "ObjectExpression":
                tree.properties.forEach(function (t) {
                    _buildScope(t, parent);
                });
                break;

            case "ArrayExpression":
                tree.elements.forEach(function (t) {
                    _buildScope(t, parent);
                });
                break;

            case "NewExpression":
                if (tree["arguments"]) { // pacifies JSLint
                    tree["arguments"].forEach(function (t) {
                        _buildScope(t, parent);
                    });
                }
                _buildScope(tree.callee, parent);
                break;

            case "BinaryExpression":
            case "AssignmentExpression":
            case "LogicalExpression":
                _buildScope(tree.left, parent);
                _buildScope(tree.right, parent);
                break;

            case "MemberExpression":
                _buildScope(tree.object, parent);
                _buildScope(tree.property, parent);
                if (tree.property && tree.property.type === "Identifier") {
                    parent.addProperty(tree.property);
                }
                if (tree.computed === false) {
                    _buildAssociations(tree.object, tree.property, parent);
                }
                break;

            case "CallExpression":
                tree["arguments"].forEach(function (t) {
                    _buildScope(t, parent);
                });
                _buildScope(tree.callee, parent);
                break;

            case "FunctionExpression":
                if (tree.id) {
                    parent.addDeclaration(tree.id);
                    _buildScope(tree.id, parent);
                }
                child = new Scope(tree, parent);
                parent.addChildScope(child);
                child.addAllDeclarations(tree.params);
                tree.params.forEach(function (t) {
                    _buildScope(t, child);
                });
                _buildScope(tree.body, child);
                break;

            case "Property":
                // Undocumented or Esprima-specific?
                parent.addProperty(tree.key);
                _buildScope(tree.value, parent);
                break;

            case "Identifier":
                parent.addIdOccurrence(tree);
                break;

            case "Literal":
                if (tree.value && typeof tree.value === "string") {
                    parent.addLiteralOccurrence(tree);
                }
                break;
                    
            case "DebuggerStatement":
            case "EmptyStatement":
            case "ThisExpression":
                break;

            default:
                throw "Unknown node type: " + tree.type;
            }
        }
        
        if (parent === undefined) {
            this.parent = null;
        } else {
            this.parent = parent;
        }

        this.idDeclarations = {};
        this.idOccurrences = [];
        this.propOccurrences = [];
        this.associations = [];
        this.literals = [];

        this.children = []; // disjoint ranges, ordered by range start
        this.range = {
            start: tree.range[0],
            end: tree.range[1]
        };

        // if parent is null, walk the AST
        if (!this.parent) {
            _buildScope(tree, this);
        }
    }

    /*
     * Rebuild a Scope object from an object that has all the necessary data
     * but the wrong prototype. Such objects may be created as a result of
     * e.g., JSON-marshalling and unmarshalling a scope.
     * 
     * @param {Object} data - an object that contains all data of a Scope object
     *      but none of the methods
     * @return {Scope} - the same object with Scope methods added
     */
    Scope.rebuild = function (data) {
        var memberName,
            member;

        for (memberName in Scope.prototype) {
            if (Scope.prototype.hasOwnProperty(memberName)) {
                member = Scope.prototype[memberName];
                if (typeof member === "function") {
                    data[memberName] = member;
                }
            }
        }

        data.children.forEach(function (child) {
            Scope.rebuild(child);
        });

        return data;
    };

    /* 
     * Add an identifier occurrence.
     * 
     * @param {AST} id - an identifier AST node
     */
    Scope.prototype.addIdOccurrence = function (id) {
        this.idOccurrences.push(id);
    };
    
    /*
     * Add an identifier declaration
     * 
     * @param {AST} id - an identifier AST node
     */
    Scope.prototype.addDeclaration = function (id) {
        this.idDeclarations[id.name] = id;
        this.addIdOccurrence(id);
    };
    
    /*
     * Add a list of identifier declarations
     * 
     * @param {Array.<AST>} ids - a list of identifier AST nodes
     */
    Scope.prototype.addAllDeclarations = function (ids) {
        var that = this;
        ids.forEach(function (i) {
            that.addDeclaration(i);
        });
    };
    
    /* 
     * Add a property occurrence
     * 
     * @param {AST} prop - a property AST node
     */
    Scope.prototype.addProperty = function (prop) {
        this.propOccurrences.push(prop);
    };

    /* 
     * Add an association object
     * 
     * @param {AST} obj - an identifier AST node 
     * @param {AST} prop - a property AST node
     */
    Scope.prototype.addAssociation = function (obj, prop) {
        this.associations.push({object: obj, property: prop});
    };
    
    /*
     * Add a literal occurrence
     * 
     * @param {AST} lit - a literal AST node
     */
    Scope.prototype.addLiteralOccurrence = function (lit) {
        this.literals.push(lit);
    };

    /*
     * Attach a new child scope to the current scope. Inserts the child scope
     * in range-sorted order w.r.t. the other children of the current scope.
     * 
     * @param {Scope} child - the child to be added
     */
    Scope.prototype.addChildScope = function (child) {
        var i = 0;
        
        while (i < this.children.length &&
                child.range.start > this.children[i].range.end) {
            i++;
        }
        this.children.splice(i, 0, child);
    };

    /* 
     * Is the symbol declared in this scope?
     * 
     * @param {string} sym - a symbol name
     * @return {boolean} - whether a symbol with that name is declared in this
     *      immediate scope
     */
    Scope.prototype.member = function (sym) {
        return Object.prototype.hasOwnProperty.call(this.idDeclarations, sym);
    };
    
    /*
     * Is the symbol declared in this scope or a parent scope?
     *
     * @param {string} sym - a symbol name
     * @return {boolean} - whether a symbol with that name is declared in this
     *      immediate scope or a parent scope
     */
    Scope.prototype.contains = function (sym) {
        var depth = 0,
            child = this;
        
        do {
            if (child.member(sym)) {
                return depth;
            } else {
                child = child.parent;
                depth++;
            }
        } while (child !== null);
        
        return undefined;
    };
    
    /*
     * Does this scope, or its children, contain the given position?
     * 
     * @param {number} pos - the position to test for inclusion in the scope
     * @return {boolean} - is the position included in the scope?
     */
    Scope.prototype.containsPosition = function (pos) {
        return this.range.start <= pos && pos <= this.range.end;
    };
    
    /*
     * Does this scope, but not its children, contain the given position? 
     * 
     * @param {number} pos - the position to test for inclusion in the scope
     * @return {boolean} - is the position directly included in the scope?
     */
    Scope.prototype.containsPositionImmediate = function (pos) {
        if (this.containsPosition(pos)) {
            if (this.children.length === 0) {
                // contains the position and there are no children
                return true;
            } else {
                var child = binaryRangeSearch(this.children, pos);
                // contains the position if the nearest child does not
                return !child.containsPosition(pos);
            }
        } else {
            // does not contain the position
            return false;
        }
    };
    
    /*
     * Find the child scope of the current scope for a given position
     *
     * @param {number} pos - the position at which to find a child scope
     * @return {?Scope} - the child scope for the given position, or null
     *      if none exists
     */
    Scope.prototype.findChild = function (pos) {
        if (this.containsPosition(pos)) {
            if (this.children.length === 0) {
                // there are no children, so this is the most precise scope
                return this;
            } else {
                var child = binaryRangeSearch(this.children, pos);
                // the most precise scope is the most precise scope of the child,
                // unless no child contains the position, in which case this is
                // the most precise scope
                return child.findChild(pos) || this;
            }
        } else {
            return null;
        }
    };

    /**
     * Traverse the scope down via children in pre-order.
     * 
     * @param {Function} add - the Scope accumulation function
     * @param {Object} init - an initial value for the accumulation function
     * @return {Object} - the result of accumulating the current scope along
     *      with all of its children
     */
    Scope.prototype.walkDown = function (add, init) {
        var result = add(this, init);
        
        this.children.forEach(function (child) {
            result = child.walkDown(add, result);
        });
        
        return result;
    };

    /* 
     * Traverse a particular list in the scope down via children
     *
     * @param {Function} addItem - the item accumulation function
     * @param {Object} init - an initial value for the accumulation function
     * @param {string} listName - the name of a Scope property
     * @return {Object} - the result of accumulating the given property for
     *      the current scope along with all of its children
     */
    Scope.prototype.walkDownList = function (addItem, init, listName) {
        function addList(scope, init) {
            var list = scope[listName];
            return list.reduce(function (prev, curr) {
                return addItem(prev, curr);
            }, init);
        }
        
        return this.walkDown(addList, init);
    };

    /*
     * Traverse identifier occurrences in the scope down via children
     *
     * @param {Function} add - the identifier accumulation function
     * @param {Object} init - an initial value for the accumulation function
     * @return {Object} - the result of accumulating identifier occurrences
     *      for the current scope along with all of its children
     */
    Scope.prototype.walkDownIdentifiers = function (add, init) {
        return this.walkDownList(add, init, "idOccurrences");
    };

    /*
     * Traverse property occurrences in the scope down via children
     *
     * @param {Function} add - the property accumulation function
     * @param {Object} init - an initial value for the accumulation function
     * @return {Object} - the result of of accumulating property occurrences
     *      for the current scope along with all of its children
     */
    Scope.prototype.walkDownProperties = function (add, init) {
        return this.walkDownList(add, init, "propOccurrences");
    };

    /*
     * Traverse associations in the scope down via children
     *
     * @param {Function} add - the association accumulation function
     * @param {Object} init - an initial value for the accumulation function
     * @return {Object} - the result of of accumulating association occurrences
     *      for the current scope along with all of its children
     */
    Scope.prototype.walkDownAssociations = function (add, init) {
        return this.walkDownList(add, init, "associations");
    };

    /*
     * Traverse literals in the scope down via children
     *
     * @param {Function} add - the literal accumulation function
     * @param {Object} init - an initial value for the accumulation function
     * @return {Object} - the result of of accumulating literal occurrences
     *      for the current scope along with all of its children
     */
    Scope.prototype.walkDownLiterals = function (add, init) {
        return this.walkDownList(add, init, "literals");
    };
    
    /**
     * Traverse the scope up via the parent
     *
     * @param {Function} add - the Scope accumulation function
     * @param {Object} init - an initial value for the accumulation function
     * @param {string} prop - the property name to combine scope information for
     * @return {Object} - the result of of accumulating the current scope along
     *      with its parents
     */
    Scope.prototype.walkUp = function (add, init, prop) {
        var scope   = this,
            result  = init,
            combine = function (elem) {
                result = add(result, elem);
            };
        
        while (scope !== null) {
            this[prop].forEach(combine);
            scope = scope.parent;
        }
        
        return result;
    };

    module.exports = Scope;
});
