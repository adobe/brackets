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

    function Scope(tree, parent) {

        /*
         * Given a member expression, try to add a target-property association
         * to the given scope.
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
                    // most likely a call expression or a literal
                    return;
                }
            } else {
                // Because we restrict to non-computed property lookups, this
                // should be unreachable
                throw "Expected identifier but found " + property.type;
            }
        }

        /*
         * Build scope information for an AST as a child scope of parent.
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
     */
    Scope.prototype.addIdOccurrence = function (id) {
        this.idOccurrences.push(id);
    };
    
    /*
     * Add an identifier declaration
     */
    Scope.prototype.addDeclaration = function (id) {
        this.idDeclarations[id.name] = id;
        this.addIdOccurrence(id);
    };
    
    /*
     * Add a list of identifier declarations
     */
    Scope.prototype.addAllDeclarations = function (ids) {
        var that = this;
        ids.forEach(function (i) {
            that.addDeclaration(i);
        });
    };
    
    /* 
     * Add a property occurrence
     */
    Scope.prototype.addProperty = function (prop) {
        this.propOccurrences.push(prop);
    };

    /* 
     * Add an association object
     */
    Scope.prototype.addAssociation = function (obj, prop) {
        this.associations.push({object: obj, property: prop});
    };
    
    /*
     * Add a literal occurrence
     */
    Scope.prototype.addLiteralOccurrence = function (lit) {
        this.literals.push(lit);
    };

    /*
     * Attach a new child scope to the current scope
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
     * Find the child scope of the current scope for a given position
     */
    Scope.prototype.findChild = function (pos) {
        var i;
        
        if (this.range.start <= pos && pos <= this.range.end) {
            for (i = 0; i < this.children.length; i++) {
                if (this.children[i].range.start <= pos &&
                        pos <= this.children[i].range.end) {
                    return this.children[i].findChild(pos);
                }
            }
            // if no child has a matching range, this is the most precise scope
            return this;
        } else {
            return null;
        }
    };
    
    /* 
     * Is the symbol declared in this scope?
     */
    Scope.prototype.member = function (sym) {
        return Object.prototype.hasOwnProperty.call(this.idDeclarations, sym);
    };
    
    /*
     * Is the symbol declared in this scope or a parent scope?
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
     */
    Scope.prototype.containsPosition = function (pos) {
        return this.range.start <= pos && pos <= this.range.end;
    };
    
    /*
     * Does this scope, but not its children, contain the given position? 
     */
    Scope.prototype.containsPositionImmediate = function (pos) {
        var children = this.children,
            i;
        
        // is in the scope's range...
        if (this.containsPosition(pos)) {
            for (i = 0; i < children.length; i++) {
                // but not in a child's scope
                if (children[i].containsPosition(pos)) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    };
    
    /**
     * Traverse the scope down via children
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
     */
    Scope.prototype.walkDownIdentifiers = function (add, init) {
        return this.walkDownList(add, init, "idOccurrences");
    };

    /*
     * Traverse property occurrences in the scope down via children
     */
    Scope.prototype.walkDownProperties = function (add, init) {
        return this.walkDownList(add, init, "propOccurrences");
    };

    /*
     * Traverse associations in the scope down via children
     */
    Scope.prototype.walkDownAssociations = function (add, init) {
        return this.walkDownList(add, init, "associations");
    };

    /*
     * Traverse literals in the scope down via children
     */
    Scope.prototype.walkDownLiterals = function (add, init) {
        return this.walkDownList(add, init, "literals");
    };
    
    /**
     * Traverse the scope up via the parent
     */
    Scope.prototype.walkUp = function (add, init, prop) {
        var scope = this,
            result = init,
            i;
        
        while (scope !== null) {
            for (i = 0; i < this[prop].length; i++) {
                result = add(result, this[prop][i]);
            }
            scope = scope.parent;
        }
        
        return result;
    };
    
    /**
     * Traverse identifier declarations in the scope up via the parent
     */
    Scope.prototype.walkUpDeclarations = function (add, init) {
        return this.walkUp(add, init, "idDeclarations");
    };
    
    /**
     * Traverse identifier occurrences in the scope up via the parent
     */
    Scope.prototype.walkUpIdentifiers = function (add, init) {
        return this.walkUp(add, init, "idOccurrences");
    };

    /**
     * Traverse property occurrences in the scope up via the parent
     */
    Scope.prototype.walkUpProperties = function (add, init) {
        return this.walkUp(add, init, "propOccurrences");
    };

    /**
     * Traverse associations in the scope up via the parent
     */
    Scope.prototype.walkUpAssociations = function (add, init) {
        return this.walkUp(add, init, "associations");
    };
    
    /**
     * Traverse literal occurrences in the scope up via the parent
     */
    Scope.prototype.walkUpLiterals = function (add, init) {
        return this.walkUp(add, init, "literals");
    };
    
    /**
     * Return a string representations of declarations below this scope
     */
    Scope.prototype.toStringBelow = function () {
        return "[" + this.range.start + " " + this.idDeclarations.map(function (i) {
            return i.name;
        }).join(", ") +
            " : " + (this.children.map(function (c) {
                return c.toString();
            }).join("; ")) + this.range.end + "]";
    };

    /**
     * Return a string representations of declarations in this scope
     */
    Scope.prototype.toString = function () {
        return "[" + this.range.start + " " + this.idDeclarations.map(function (i) {
            return i.name;
        }).join(", ") + this.range.end + "]";
    };

    module.exports = Scope;
});
