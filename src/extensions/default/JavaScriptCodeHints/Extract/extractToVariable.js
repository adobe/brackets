/*
* Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

define(function(require, exports, module) {
    'use strict';

    var Acorn               = brackets.getModule("thirdparty/acorn/dist/acorn"),
        ASTWalker           = brackets.getModule("thirdparty/acorn/dist/walk"),
        Menus               = brackets.getModule("command/Menus"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        KeyBindingManager   = brackets.getModule("command/KeyBindingManager"),
        _                   = brackets.getModule("thirdparty/lodash"),
        DefaultDialogs      = brackets.getModule("widgets/DefaultDialogs"),
        Dialogs             = brackets.getModule("widgets/Dialogs"),
        StringMatch         = brackets.getModule("utils/StringMatch"),
        StringUtils         = brackets.getModule("utils/StringUtils"),
        Widget              = require("./widget").Widget,
        ScopeManager        = require("../ScopeManager");


    var session, // current editor session
        data = {}, // contains the data got from tern
        scopes;  // an array of all the scopes


    // Error messages
    var TERN_FAILED = "Unable to get data from Tern",
        EXTRACTVARIABLE_ERR_MSG = "Selection does not form an expression",
        EXTRACTFUNCTION_ERR_MSG = "Selected block should represent set of statements or an expression";

    // Utility functions
    function indexFromPos(pos) {
        return session.editor.indexFromPos(pos);
    }

    function posFromIndex(index) {
        return session.editor._codeMirror.posFromIndex(index);
    }

    // Checks whether two ast nodes are equal
    function isEqual(a, b) {
        return a.start === b.start && a.end === b.end;
    }

    // Removes the leading and trailing spaces from selection and the trailing semicolons
    function normalizeText(text, start, end, removeTrailingSemiColons) {
        var trimmedText;

        start = indexFromPos(start);
        end = indexFromPos(end);

        // Remove leading spaces
        trimmedText = _.trimLeft(text);

        if (trimmedText.length < text.length) {
            start += (text.length - trimmedText.length);
        }

        text = trimmedText;

        // Remove trailing spaces
        trimmedText = _.trimRight(text);

        if (trimmedText.length < text.length) {
            end -= (text.length - trimmedText.length);
        }

        text = trimmedText;

        // Remove trailing semicolons
        if (removeTrailingSemiColons) {
            trimmedText = _.trimRight(text, ';');

            if (trimmedText.length < text.length) {
                end -= (text.length - trimmedText.length);
            }
        }

        return {
            text: trimmedText,
            start: posFromIndex(start),
            end: posFromIndex(end)
        };
    }

    function getUniqueIdentifierName(scope, prefix, num) {
        if (!scope) {
            return prefix;
        }
        num = num || "1";
        var name;
        while (num < 100) { // limit search length
            name = prefix + num;
            if (!scope.props.hasOwnProperty(name)) {
                break;
            }
            ++num;
        }
        return name;
    }

    function isStandAloneExpression(text) { 
        var found = ASTWalker.findNodeAt(Acorn.parse_dammit(text, {ecmaVersion: 9}), 0, text.length, function(nodeType, node) {
            if (nodeType === "Expression"){
                return true;
            }
            return false;
        });
        return found && found.node;
    }

    function numLines(text) { 
        return text.split("\n").length;
    }

    function extractToVariable(scope, parentStatement, expns, text) { 
        var varType = "var",
            varName = getUniqueIdentifierName(scope, "extracted"),
            varDeclaration = varType + " " + varName + " = " + text + ";\n",
            insertStartPos = posFromIndex(parentStatement.start),
            selections = [],
            posToIndent,
            doc = session.editor.document,
            replaceExpnIndex = 0;

        // If parent statement is expression statement, then just append var declaration
        // Ex: "add(1, 2)" will become "var extracted = add(1, 2)"
        if (parentStatement.type === "ExpressionStatement" && isEqual(parentStatement.expression, expns[0])) {
            varDeclaration = varType + " " + varName + " = ";
            replaceExpnIndex = 1;
        }

        posToIndent = doc.adjustPosForChange(insertStartPos, varDeclaration.split("\n"), insertStartPos, insertStartPos);

        // adjust pos for change
        for (var i = replaceExpnIndex; i < expns.length; ++i) {
            expns[i].start = posFromIndex(expns[i].start);
            expns[i].end = posFromIndex(expns[i].end);
            expns[i].start = doc.adjustPosForChange(expns[i].start, varDeclaration.split("\n"), insertStartPos, insertStartPos);
            expns[i].end = doc.adjustPosForChange(expns[i].end, varDeclaration.split("\n"), insertStartPos, insertStartPos);

            selections.push({
                start: expns[i].start,
                end: {line: expns[i].start.line, ch: expns[i].start.ch + varName.length}
            });
        }

        doc.batchOperation(function() {
            doc.replaceRange(varDeclaration, insertStartPos);

            for (var i = replaceExpnIndex; i < expns.length; ++i) {
                doc.replaceRange(varName, expns[i].start, expns[i].end);
            }
            selections.push({
                start: {line: insertStartPos.line, ch: insertStartPos.ch + varType.length + 1},
                end: {line: insertStartPos.line, ch: insertStartPos.ch + varType.length + varName.length + 1},
                primary: true
            });

            session.editor.setSelections(selections);
            session.editor._codeMirror.indentLine(posToIndent.line, "prev");
        });
    }


    function analyzeCode(srcScope, destScope, start, end, text) { 
        var identifiers = {},
            inThisScope = {},
            thisPointerUsed = false,
            startPos = indexFromPos(start),
            endPos = indexFromPos(end),
            variableDeclarations = {},
            changedValues = {},
            dependentValues = {},
            restScopeStr,
            doc = session.editor.document,
            ast = Acorn.parse_dammit(text, { ecmaVersion: 9 });
        
        ASTWalker.full(ast, function(node) {
            var value, name;
            switch(node.type) {
                case "AssignmentExpression":
                value = node.left;
                break;
                case "VariableDeclarator":
                inThisScope[node.id.name] = true;
                value = node.init && node.id;
                var foundNode = ASTWalker.findNodeAround(ast, node.start, function(pnodeType, pnode) {
                    return pnodeType === "VariableDeclaration" && pnode.end >= node.end;
                });
                if (foundNode && foundNode.node)
                variableDeclarations[node.id.name] = foundNode.node.kind;
                break;
                case "ThisExpression":
                thisPointerUsed = true;
                break;
                case "UpdateExpression":
                value = node.argument;
                break;
                case "Identifier":
                identifiers[node.name] = true;
                break;
            }
            if (value){
                if (value.type === "MemberExpression") {
                    name = value.object.name;
                } else {
                    name = value.name;
                }
                changedValues[name] = true;
            }
        });

        if (srcScope.originNode) {
            restScopeStr = doc.getText().substr(endPos, srcScope.originNode.end - endPos);
        } else {
            restScopeStr = doc.getText().substr(endPos);
        }

        ASTWalker.simple(Acorn.parse_dammit(restScopeStr, {ecmaVersion: 9}), {
            Identifier: function(node) {
                var name = node.name;
                dependentValues[name] = true;
            },
            Expression: function(node) {
                if (node.type === "MemberExpression") {
                    var name = node.object.name;
                    dependentValues[name] = true;
                }
            }
        });

        var props = scopes.slice(srcScope.id, destScope.id).reduce(function(props, scope) {
            return _.union(props, _.keys(scope.props));
        }, []);

        var retParams = _.intersection(props, _.keys(changedValues), _.keys(dependentValues));

        return {
            passParams: _.intersection(_.difference(_.keys(identifiers), _.keys(inThisScope)), props),
            retParams: retParams,
            thisPointerUsed: thisPointerUsed,
            variableDeclarations: _.pick(variableDeclarations, retParams)
        };
    }

    function isFnScope(scope) { 
        return !scope.isBlock && !scope.isCatch;
    }

    function getScopePos(srcScope, destScope, initPos) { 
        var pos = _.clone(initPos);
        var fnScopes = scopes.filter(isFnScope);

        for (var i = 0; i < fnScopes.length; ++i) {
            if (fnScopes[i].id === destScope.id) {
                if (fnScopes[i - 1]) pos = posFromIndex(fnScopes[i - 1].originNode.start);
                break;
            }
        }

        pos.ch = 0;
        return pos;
    }

    function extractToFunction(text, srcScope, destScope, start, end, isExpression) {
        var retObj = analyzeCode(srcScope, destScope, start, end, text);
        var passParams = retObj.passParams;
        var retParams = retObj.retParams;
        var thisPointerUsed = retObj.thisPointerUsed;
        var variableDeclarations = retObj.variableDeclarations;
        var fnDeclaration;
        var doc = session.editor.document;
        var fnCall;

        var fnbody = text;
        if (destScope.isClass) {
            fnCall = "this.extracted(" + passParams.join(", ") + ")";
        } else {
            if (thisPointerUsed) passParams.unshift("this");
            fnCall = (thisPointerUsed? "extracted.call(": "extracted(") + passParams.join(", ") + ")";
            if (thisPointerUsed) passParams.shift();
        }

        function appendVarDeclaration(identifier) {
            if (variableDeclarations.hasOwnProperty(identifier)) return variableDeclarations[identifier] + " " + identifier;
            else return identifier;
        }

        if (isExpression) {
            var expression = getSingleExpression(start, end);
            var parentStatement = findParentStatement(expression);
            if (parentStatement.type !== "ExpressionStatement" || !isEqual(parentStatement.expression, parentStatement)) {
                fnbody = "return " + fnbody + ";";
            }
        } else {
            var retParamsStr;
            if (retParams && retParams.length) {
                if (retParams.length > 1) {
                    retParamsStr = '{' + retParams.join(", ") + '}';
                    fnCall = "var ret = " + fnCall + ";\n" +
                    retParams.map(function(param) {
                        return appendVarDeclaration(param) + " = ret." + param + ";"
                    }).join("\n");
                } else if (retParams.length === 1) {
                    retParamsStr = retParams[0];
                    fnCall = appendVarDeclaration(retParams[0]) + " = " + fnCall + ";";
                }
                fnbody = fnbody + "\n" +
                "return " + retParamsStr  + ";";
            } else {
                fnCall += ";";
            }
        }

        if (destScope.isClass) {
            fnDeclaration = "extracted(" + passParams.join(", ") + ") {\n" +
            fnbody + "\n" +
            "}\n\n";
        } else {
            fnDeclaration = "function extracted(" + passParams.join(", ") + ") {\n" +
            fnbody + "\n" +
            "}\n\n";
        }

        var scopePos = getScopePos(srcScope, destScope, start);

        doc.batchOperation(function() {
            doc.replaceRange(fnCall, start, end);
            session.editor.setCursorPos(start);
            for (var i = start.line; i < start.line + numLines(fnCall); ++i) {
                session.editor._codeMirror.indentLine(i, "smart");
            }
            doc.replaceRange(fnDeclaration, scopePos);
            for (var i = scopePos.line; i < scopePos.line + numLines(fnDeclaration); ++i) {
                session.editor._codeMirror.indentLine(i, "smart");
            }
        });

        console.log(fnDeclaration);
        console.log(scopePos);
        console.log(fnCall);
    }

    function findAllExpressions(parentBlockStatement, expn, text) {
        var doc = session.editor.document;
        var obj = {};
        var expns = [];
        obj[expn.type] = function(node) {
            if (text === doc.getText().substr(node.start, node.end - node.start)) {
                expns.push(node);
            }
        }
        ASTWalker.simple(parentBlockStatement, obj);
        return expns;
    }

    function findParentBlockStatement(expn) { 
        var foundNode = ASTWalker.findNodeAround(data.ast, expn.start, function(nodeType, node) {
            return (nodeType === "BlockStatement" || nodeType === "Program") && node.end >= expn.end;
        });
        return foundNode && foundNode.node;
    }

    function findParentStatement(expn) { 
        var foundNode = ASTWalker.findNodeAround(data.ast, expn.start, function(nodeType, node) {
            return nodeType === "Statement" && node.end >= expn.end;
        });
        return foundNode && foundNode.node;
    }

    function getSingleExpression(start, end) { 
        start = indexFromPos(start);
        end = indexFromPos(end);
        var doc = session.editor.document;

        var foundNode = ASTWalker.findNodeAround(data.ast, start, function(nodeType, node) {
            return nodeType === "Expression" && node.end >= end;
        });
        if (!foundNode) return false;

        var expn = foundNode.node;
        if (expn.start === start && expn.end === end) { //Math.abs(expn.end - endPos) <= 1 // if selection is a whole expression node in ast
            return expn;
        }

        if (!(["BinaryExpression", "LogicalExpression", "SequenceExpression"].includes(expn.type))) {
            return false;
        }

        // Check subexpression
        var parentExpn = expn;
        var parentExpStr = doc.getText().substr(parentExpn.start, parentExpn.end - parentExpn.start);

        var str = parentExpStr.substr(0, startPos - parentExpn.start) + "extracted" + parentExpStr.substr(endPos - parentExpn.start);
        var node = isStandAloneExpression(str);
        if (node && node.type === parentExpn.type) return parentExpn;

        return false;
    }

    function getExpressions(start, end) { 
        var expns = [];

        var pstart = indexFromPos(start);
        var pend = indexFromPos(end);

        while (true) {
            var foundNode = ASTWalker.findNodeAround(data.ast, pstart, function(nodeType, node) {
                return nodeType === "Expression" && node.end >= pend;
            });
            if (!foundNode) break;
            var expn = foundNode.node;
            expns.push(expn);
            pstart = expn.start - 1;
        }


        pstart = indexFromPos(start);
        pend = indexFromPos(end);

        while (true) {
            var foundNode = ASTWalker.findNodeAround(data.ast, pstart, function(nodeType, node) {
                return nodeType === "Expression" && node.end >= pend;
            });
            if (!foundNode) break;
            var expn = foundNode.node;
            expns.push(expn);
            pend = expn.end + 1; 
        }

        return expns;
    }


    function findScopes() { 
        var curScope = data.scope;
        var cnt = 0;
        var scopes = [];
        var doc = session.editor.document;

        while (curScope) {
            curScope.id = cnt++;
            scopes.push(curScope);
            if (curScope.fnType) {
                // Check for class scopes surrounding the function
                if (curScope.fnType === "FunctionExpression") {
                    var found = ASTWalker.findNodeAround(data.ast, curScope.originNode.start, function(nodeType, node) {
                        return nodeType === "MethodDefinition" && node.end >= curScope.originNode.end;
                    });
                    // class scope found
                    if (found && found.node && isEqual(found.node.value, curScope.originNode)) {
                        curScope.name = found.node.key.name;

                        found = ASTWalker.findNodeAround(data.ast, found.node.start, function(nodeType, node) {
                            return ["ClassDeclaration", "ClassExpression"].includes(nodeType) && node.end >= found.node.end;
                        });

                        if (found && found.node) {
                            // Class Declaration found add it to scopes
                            var temp = curScope.prev;
                            var newScope = {};
                            newScope.isClass = true;
                            newScope.name = "class " + (found.node.id && found.node.id.name);
                            newScope.originNode = found.node;
                            curScope.prev = newScope;
                            newScope.prev = temp;
                        }
                    } else {
                        curScope.name = "function starting with " + doc.getText().substr(curScope.originNode.start, 15);
                    }
                } else {
                    curScope.name = curScope.fnType;
                }
            } else if (!curScope.originNode) {
                curScope.name = "global";
            }

            curScope = curScope.prev;
        }
        return scopes;
    }

    function getScopeData(offset) { 
        var response = ScopeManager.requestScopeData(session, offset);
        var doc = session.editor.document;

        var result = new $.Deferred;

        if (response.hasOwnProperty("promise")) {
            response.promise.done(function(response) {
                data = response;
                data.ast = Acorn.parse_dammit(doc.getText(), {ecmaVersion: 9});
                result.resolve();
            }).fail(function() {
                result.reject();
            })
        }

        return result;
    }

    // Check whether start and end represents a set of statements
    function checkStatement(start, end) { 
        start = indexFromPos(start);
        end = indexFromPos(end);

        // Do not allow function or class nodes
        var doc = session.editor.document;
        var notStatement = false;
        ASTWalker.simple(Acorn.parse_dammit(doc.getText().substr(start, end - start), {ecmaVersion: 9}), {
            Function: function(node) {
                notStatement = true;
            },
            Class: function(node) {
                notStatement = true;
            }
        });

        if (notStatement) return false;

        var foundNode1 = ASTWalker.findNodeAround(data.ast, start, function(nodeType, node) {
            return nodeType === "Statement";
        });

        var foundNode2 = ASTWalker.findNodeAround(data.ast, end, function(nodeType, node) {
            return nodeType === "Statement";
        });

        return foundNode1 && foundNode2 && foundNode1.node.start === start &&
        foundNode1.node.end <= end && foundNode2.node.start >= start &&
        foundNode2.node.end === end;
    }
    
    function extractExpressionToVariable(start, end, text) {
        var parentExpn = getSingleExpression(start, end);
        var parentBlockStatement, parentStatement;
        var doc = session.editor.document;
        var expns = [];

        if (!parentExpn) {
            session.editor.displayErrorMessageAtCursor(EXTRACTVARIABLE_ERR_MSG);
            return;
        }

        // Find all expressions only if selected expn is not a subexpression
        // In case of subexpressions, ast cannot be used to find all expressions
        if (doc.getText().substr(parentExpn.start, parentExpn.end - parentExpn.start) === text) {
            parentBlockStatement = findParentBlockStatement(parentExpn);
            expns = findAllExpressions(parentBlockStatement, parentExpn, text);
            parentStatement = findParentStatement(expns[0]);
            extractToVariable(data.scope, parentStatement, expns, text);
        } else {
            parentStatement = findParentStatement(parentExpn);
            extractToVariable(data.scope, parentStatement, [{ start: indexFromPos(start), end: indexFromPos(end) }], text);
        }
    }

    function handleExtractToVariable() {
        var selection = session.editor.getSelection();
        var doc = session.editor.document;
        var editor = session.editor;

        var retObj = normalizeText(session.editor.getSelectedText(), selection.start, selection.end, true);
        var text = retObj.text;
        var start = retObj.start;
        var end = retObj.end;

        getScopeData(start).done(function() {
            var expns = [];

            if (editor.hasSelection()) {
                extractExpressionToVariable(start, end, text);

            } else {
                expns = getExpressions(start, end).filter(function(expn) {
                    return numLines(doc.getText().substr(expn.start, expn.end - expn.start)) === 1;
                });

                if (!expns || !expns.length) {
                    session.editor.displayErrorMessageAtCursor(EXTRACTVARIABLE_ERR_MSG);
                    return;
                }
                expns.forEach(function(expn, index) {
                    expn.id = index;
                    expn.name = doc.getText().substr(expn.start, expn.end - expn.start);
                });


                
                var widget = new Widget(session.editor, "Select expresion");

                widget.open(expns);

                widget.onSelect(function (expnId) {
                    extractExpressionToVariable(posFromIndex(expns[expnId].start), posFromIndex(expns[expnId].end), expns[expnId].name);
                    widget.close();
                });

                widget.onClose(function () { });
            }
        }).fail(function() {
            session.editor.displayErrorMessageAtCursor(TERN_FAILED);
        });
    }

    function handleExtractToFunction() {
        var selection = session.editor.getSelection();
        var doc = session.editor.document;

        var retObj = normalizeText(session.editor.getSelectedText(), selection.start, selection.end, false);
        var text = retObj.text;
        var start = retObj.start;
        var end = retObj.end;

        getScopeData(start).done(function() {
            var isExpression = false;
            if (!checkStatement(start, end)) {
                isExpression = getSingleExpression(start, end);
                if (!isExpression) {
                    session.editor.displayErrorMessageAtCursor(EXTRACTFUNCTION_ERR_MSG);
                    return;
                }
            }
            scopes = findScopes();

            var widget = new Widget(session.editor, "Choose destination scope");

            widget.open(scopes.filter(isFnScope));

            widget.onSelect(function (scopeId) {
                extractToFunction(text, scopes[0], scopes[scopeId], start, end, isExpression);
                widget.close();
            });

            widget.onClose(function(){});
        }).fail(function() {
            session.editor.displayErrorMessageAtCursor(TERN_FAILED);
        });
    }

    function setSession(s) {
        session = s;
    }

    function addCommands() {
        // Extract To Variable
        CommandManager.register("Extract To Variable", "refactoring.extractToVariable", handleExtractToVariable);
        KeyBindingManager.addBinding("refactoring.extractToVariable", "Ctrl-Alt-V");
        Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU).addMenuItem("refactoring.extractToVariable");

        // Extract To Function
        CommandManager.register("Extract To Function", "refactoring.extractToFunction", handleExtractToFunction);
        KeyBindingManager.addBinding("refactoring.extractToFunction", "Ctrl-Alt-M");
        Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU).addMenuItem("refactoring.extractToFunction");
    }

    exports.setSession = setSession;
    exports.addCommands = addCommands;
});

// Commented Blocks
// getAllIdentifiers
/*ASTWalker.simple(ast, {
Identifier: function(node) {
if (!identifiers.hasOwnProperty(node.name)) {
identifiers[node.name] = true;
}
},
VariableDeclarator: function(node) {
if (!inThisScope.hasOwnProperty(node.id.name)) {
inThisScope[node.id.name] = true;
}
}
// FunctionDeclaration: function(node) {
//     if (!inThisScope.hasOwnProperty(node.name)) {
//         inThisScope[node.id.name] = true;
//     }
// }
});*/



// var ret = [];
// if (includeIdentifiersInThisScope) {
//     for (var identifier in Object.assign(identifiers, inThisScope)) {
//         if (identifiers.hasOwnProperty(identifier) || inThisScope.hasOwnProperty(identifier)) {
//             ret.push(identifier);
//         }
//     }
// } else {
// for (var identifier in identifiers) {
//     if (identifiers.hasOwnProperty(identifier) && !inThisScope.hasOwnProperty(identifier)) {
//         ret.push(identifier);
//     }
// }
// }

// return ret;

//findPassParams

// identifiers.forEach(function(identifier){
//     var passParam = false;
//     var scope = srcScope;
//     while (scope.id !== destScope.id) {
//         if (scope.props.hasOwnProperty(identifier)) {
//             passParam = true;
//             break;
//         }
//         scope = scope.prev;
//     }
//     if (passParam) {
//         params.push(identifier);
//     }
// });
// return params;

//findRetParams

// FunctionDeclaration: function(node) {
//     if (!inThisScope.hasOwnProperty(node.name)) {
//         inThisScope[node.id.name] = true;
//     }
// }


/*ASTWalker.full(ast, function(node) {
if (node.type === "Identifier") console.log(node);
if (node.type === "MemberExpression") console.log(node);
});*/


// AssignmentExpression: function(node) {
//     var value = node.left;
//     var name = ;
//     if (srcScope.props.hasOwnProperty(name))
//     changedValues[name] = true;
// },
// UpdateExpression: function(node) {
//     var value = node.argument;
//     var name = text.substr(value.start, value.end - value.start);
//     if (srcScope.props.hasOwnProperty(name))
//     changedValues[name] = true;
// }


// while (srcScope.id !== destScope.id) {
//     props = _.union(props, _.keys(srcScope.props));
//     srcScope = srcScope.prev;
// }

// extract

//function extract() {
//    var varType = "var",
//        varDeclaration,
//        insertStartIndex = this.parentExp.start,
//        insertEndIndex,
//        insertStartPos,
//        insertEndPos ,
//        startPos = this.posFromIndex(this.start),
//        endPos = this.posFromIndex(this.end),
//        self = this;
//
//    // Display Dialog for type
//    var $template = $(require("text!./dialog.html"));
//    Dialogs.showModalDialogUsingTemplate($template).done(function(id) {
//        if (id === "extract") {
//            varType = $template.find('input:radio[name=var-type]:checked').val();
//
//            // Var initializations
//            varDeclaration = varType + " test = " + self.text + ";\n";
//            insertEndIndex = insertStartIndex + varDeclaration.length;
//            insertStartPos = self.posFromIndex(insertStartIndex);
//            insertEndPos   = self.posFromIndex(insertEndIndex);
//
//            // Check if the expression is the only thing on this line.
//            // If it is, then append variable declaration to it.
//            if (self.parentExp.type === "ExpressionStatement" &&
//            // abs for semicolons TODO: change this
//                self.parentExp.start === self.start && Math.abs(self.parentExp.end - self.end) <= 1) {
//                self.doc.replaceRange(varType + " test = ", insertStartPos);
//                self.editor.setSelection(
//                    {line: insertStartPos.line, ch: insertStartPos.ch + varType.length + 1},
//                    {line: insertStartPos.line, ch: insertStartPos.ch + varType.length + varName.length + 1}
//                );
//                return;
//            }
//
//
//            startPos = self.doc.adjustPosForChange(startPos, varDeclaration.split("\n"), insertStartPos, insertStartPos);
//            endPos = self.doc.adjustPosForChange(endPos, varDeclaration.split("\n"), insertStartPos, insertStartPos);
//
//            var posToIndent = self.doc.adjustPosForChange(insertStartPos, varDeclaration.split("\n"), insertStartPos, insertStartPos);
//            self.doc.batchOperation(function() {
//                self.doc.replaceRange(varDeclaration, insertStartPos);
//                self.doc.replaceRange("test", startPos, endPos);
//
//                // Set the multi selections for editing variable name
//                self.editor.setSelections([
//                    {
//                        start: {line: insertStartPos.line, ch: insertStartPos.ch + varType.length + 1},
//                        end: {line: insertStartPos.line, ch: insertStartPos.ch + varType.length + 5},
//                        primary: true
//                    },
//                    {
//                        start: startPos,
//                        end: {line: startPos.line, ch: startPos.ch + 4}
//                    }
//                ]);
//
//                self.editor._codeMirror.indentLine(posToIndent.line, "prev");
//            });
//        }
//    });
//}

// getScopePos
//
//
// if (srcScope.id === destScope.id) {
//     pos.ch = 0;
//     return pos;
// }
// while (srcScope.prev.id !== destScope.id) {
//     srcScope = srcScope.prev;
// }
// pos = posFromIndex(srcScope.originNode.start);
// pos.ch = 0;
// return pos;

// getAllIdentifiers


//function getAllIdentifiers() {
//    var identifiers = {};
//    var inThisScope = {};
//    var ast = Acorn.parse_dammit(text, {ecmaVersion: 9});
//    ASTWalker.full(ast, function(node) {
//        if (node.type === "Identifier") {
//            identifiers[node.name] = true;
//        }
//        if (node.type === "VariableDeclarator") {
//            inThisScope[node.id.name] = true;
//        }
//    });
//
//    return _.difference(_.keys(identifiers), _.keys(inThisScope));
//}


// findPassParams

// function findPassParams(srcScope, destScope) {
//     var identifiers = {};
//     var inThisScope = {};
//     var ast = Acorn.parse_dammit(text, {ecmaVersion: 9});
//
//     ASTWalker.full(ast, function(node) {
//         if (node.type === "Identifier") {
//             identifiers[node.name] = true;
//         }
//         if (node.type === "VariableDeclarator") {
//             inThisScope[node.id.name] = true;
//         }
//     });
//
//     var props = scopes.slice(srcScope.id, destScope.id).reduce(function(props, scope) {
//         return _.union(props, _.keys(scope.props));
//     }, []);
//
//     return _.intersection(_.difference(_.keys(identifiers), _.keys(inThisScope)), props);
// }
