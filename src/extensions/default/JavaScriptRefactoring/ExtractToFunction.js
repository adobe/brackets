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

    var ASTWalker           = brackets.getModule("thirdparty/acorn/dist/walk"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        _                   = brackets.getModule("thirdparty/lodash"),
        StringUtils         = brackets.getModule("utils/StringUtils"),
        Session             = brackets.getModule("JSUtils/Session"),
        RefactoringUtils    = require("RefactoringUtils"),
        Strings             = brackets.getModule("strings"),
        InlineMenu          = brackets.getModule("widgets/InlineMenu").InlineMenu;

    var template = JSON.parse(require("text!Templates.json"));

    var session = null;

    /**
     * Analyzes the code and finds values required for extract to function
     * @param {!string} text - text to be extracted
     * @param {!Array.<Scope>} - scopes
     * @param {!Scope} srcScope - source scope of the extraction
     * @param {!Scope} destScope - destination scope of the extraction
     * @param {!number} start - the start offset
     * @param {!number} end - the end offset
     * @return {!{
     *          passParams: Array.<string>,
     *          retParams: Array.<string>,
     *          thisPointerUsed: boolean,
     *          varaibleDeclarations: {} // variable-name: kind
     * }}
     */
    function analyzeCode(text, scopes, srcScope, destScope, start, end) {
        var identifiers          = {},
            inThisScope          = {},
            thisPointerUsed      = false,
            returnStatementUsed  = false,
            variableDeclarations = {},
            changedValues        = {},
            dependentValues      = {},
            ast                  = RefactoringUtils.getAST(text),
            doc                  = session.editor.document,
            restScopeStr;

        ASTWalker.full(ast, function(node) {
            var value, name;
            switch (node.type) {
                case "AssignmentExpression":
                    value = node.left;
                    break;
                case "VariableDeclarator":
                    inThisScope[node.id.name] = true;
                    value = node.init && node.id;
                    var variableDeclarationNode = RefactoringUtils.findSurroundASTNode(ast, node, ["VariableDeclaration"]);
                    variableDeclarations[node.id.name] = variableDeclarationNode.kind;
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
                case "ReturnStatement":
                    returnStatementUsed = true;
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
            restScopeStr = doc.getText().substr(end, srcScope.originNode.end - end);
        } else {
            restScopeStr = doc.getText().substr(end);
        }

        ASTWalker.simple(RefactoringUtils.getAST(restScopeStr), {
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

        var passProps = scopes.slice(srcScope.id, destScope.id).reduce(function(props, scope) {
            return _.union(props, _.keys(scope.props));
        }, []);

        var retProps = scopes.slice(srcScope.id, destScope.id + 1).reduce(function(props, scope) {
            return _.union(props, _.keys(scope.props));
        }, []);

        return {
            passParams:           _.intersection(_.difference(_.keys(identifiers), _.keys(inThisScope)), passProps),
            retParams:            _.intersection( _.keys(changedValues), _.keys(dependentValues), retProps),
            thisPointerUsed:      thisPointerUsed,
            returnStatementUsed:  returnStatementUsed,
            variableDeclarations: variableDeclarations
        };
    }

    /**
     * Does the actual extraction. i.e Replacing the text, Creating a function
     * and multi select function names
     */
    function extract(ast, text, scopes, srcScope, destScope, start, end, isExpression) {
        var retObj               = analyzeCode(text, scopes, srcScope, destScope, start, end),
            passParams           = retObj.passParams,
            retParams            = retObj.retParams,
            thisPointerUsed      = retObj.thisPointerUsed,
            returnStatementUsed  = retObj.returnStatementUsed,
            variableDeclarations = retObj.variableDeclarations,
            doc                  = session.editor.document,
            fnBody               = text,
            fnName               = RefactoringUtils.getUniqueIdentifierName(scopes, "extracted"),
            fnDeclaration,
            fnCall;

        function appendVarDeclaration(identifier) {
            if (variableDeclarations.hasOwnProperty(identifier)) {
                 return variableDeclarations[identifier] + " " + identifier;
            }
            else {
                 return identifier;
            }
        }

        if (destScope.isClass) {
            fnCall = StringUtils.format(template.functionCall.class, fnName, passParams.join(", "));
        } else if (thisPointerUsed) {
            passParams.unshift("this");
            fnCall = StringUtils.format(template.functionCall.thisPointer, fnName, passParams.join(", "));
            passParams.shift();
        } else {
            fnCall = StringUtils.format(template.functionCall.normal, fnName, passParams.join(", "));
        }

        // Append return to the fnCall, if the extracted text contains return statement
        // Ideally in this case retParams should be empty.
        if (returnStatementUsed) {
            fnCall = "return " + fnCall;
        }

        if (isExpression) {
            fnBody = StringUtils.format(template.returnStatement.single, fnBody);
        } else {

            var retParamsStr = "";
            if (retParams.length > 1) {
                retParamsStr = StringUtils.format(template.returnStatement.multiple, retParams.join(", "));
                fnCall = "var ret = " + fnCall + ";\n";
                fnCall += retParams.map(function (param) {
                    return StringUtils.format(template.assignment, appendVarDeclaration(param),  "ret." + param);
                }).join("\n");
            } else if (retParams.length === 1) {
                retParamsStr = StringUtils.format(template.returnStatement.single, retParams.join(", "));
                fnCall = StringUtils.format(template.assignment, appendVarDeclaration(retParams[0]), fnCall);
            } else {
                fnCall += ";";
            }

            fnBody = fnBody + "\n" + retParamsStr;
        }

        if (destScope.isClass) {
            fnDeclaration = StringUtils.format(template.functionDeclaration.class, fnName, passParams.join(", "), fnBody);
        } else {
            fnDeclaration = StringUtils.format(template.functionDeclaration.normal, fnName, passParams.join(", "), fnBody);
        }

        start = session.editor.posFromIndex(start);
        end   = session.editor.posFromIndex(end);

        // Get the insertion pos for function declaration
        var insertPos = _.clone(start);
        var fnScopes = scopes.filter(RefactoringUtils.isFnScope);

        for (var i = 0; i < fnScopes.length; ++i) {
            if (fnScopes[i].id === destScope.id) {
                if (fnScopes[i - 1]) {
                     insertPos = session.editor.posFromIndex(fnScopes[i - 1].originNode.start);
                     // If the origin node of the destination scope is a function expression or a arrow function expression,
                     // get the surrounding statement to get the position
                     if (fnScopes[i - 1].originNode.type === "FunctionExpression" || fnScopes[i - 1].originNode.type === "ArrowFunctionExpression") {
                         var surroundStatement = RefactoringUtils.findSurroundASTNode(ast, { start: session.editor.indexFromPos(insertPos)}, ["Statement"]);
                         insertPos = session.editor.posFromIndex(surroundStatement.start);
                     }
                }
                break;
            }
        }

        insertPos.ch = 0;

        // Replace and multi-select and indent
        doc.batchOperation(function() {
            // Replace
            doc.replaceRange(fnCall, start, end);
            doc.replaceRange(fnDeclaration, insertPos);

            // Set selections
            start = doc.adjustPosForChange(start, fnDeclaration.split("\n"), insertPos, insertPos);
            end   = doc.adjustPosForChange(end, fnDeclaration.split("\n"), insertPos, insertPos);

            session.editor.setSelections([
                {
                    start: session.editor.posFromIndex(session.editor.indexFromPos(start) + fnCall.indexOf(fnName)),
                    end:   session.editor.posFromIndex(session.editor.indexFromPos(start) + fnCall.indexOf(fnName) + fnName.length)
                },
                {
                    start: session.editor.posFromIndex(session.editor.indexFromPos(insertPos) + fnDeclaration.indexOf(fnName)),
                    end:   session.editor.posFromIndex(session.editor.indexFromPos(insertPos) + fnDeclaration.indexOf(fnName) + fnName.length)
                }
            ]);

            // indent
            for (var i = start.line; i < start.line + RefactoringUtils.numLines(fnCall); ++i) {
                session.editor._codeMirror.indentLine(i, "smart");
            }
            for (var i = insertPos.line; i < insertPos.line + RefactoringUtils.numLines(fnDeclaration); ++i) {
                session.editor._codeMirror.indentLine(i, "smart");
            }
        });
    }

    /**
     * Main function that handles extract to function
     */
    function handleExtractToFunction() {
        var editor = EditorManager.getActiveEditor();

        if (editor.getSelections().length > 1) {
            editor.displayErrorMessageAtCursor(Strings.ERROR_EXTRACTTO_FUNCTION_MULTICURSORS);
            return;
        }
        initializeSession(editor);

        var selection = editor.getSelection(),
            doc       = editor.document,
            retObj    = RefactoringUtils.normalizeText(editor.getSelectedText(), editor.indexFromPos(selection.start), editor.indexFromPos(selection.end)),
            text      = retObj.text,
            start     = retObj.start,
            end       = retObj.end,
            ast,
            scopes,
            expns,
            inlineMenu;

        RefactoringUtils.getScopeData(session, editor.posFromIndex(start)).done(function(scope) {
            ast = RefactoringUtils.getAST(doc.getText());

            var isExpression = false;
            if (!RefactoringUtils.checkStatement(ast, start, end, doc.getText())) {
                isExpression = RefactoringUtils.getExpression(ast, start, end, doc.getText());
                if (!isExpression) {
                    editor.displayErrorMessageAtCursor(Strings.ERROR_EXTRACTTO_FUNCTION_NOT_VALID);
                    return;
                }
            }
            scopes = RefactoringUtils.getAllScopes(ast, scope, doc.getText());

            // if only one scope, extract without menu
            if (scopes.length === 1) {
                extract(ast, text, scopes, scopes[0], scopes[0], start, end, isExpression);
                return;
            }

            inlineMenu = new InlineMenu(editor, Strings.EXTRACTTO_FUNCTION_SELECT_SCOPE);

            inlineMenu.open(scopes.filter(RefactoringUtils.isFnScope));

            inlineMenu.onSelect(function (scopeId) {
                extract(ast, text, scopes, scopes[0], scopes[scopeId], start, end, isExpression);
                inlineMenu.close();
            });

            inlineMenu.onClose(function(){
                inlineMenu.close();
            });
        }).fail(function() {
            editor.displayErrorMessageAtCursor(Strings.ERROR_TERN_FAILED);
        });
    }

    /**
     * Creates a new session from editor and stores it in session global variable
     */
    function initializeSession(editor) {
        session = new Session(editor);
    }

    exports.handleExtractToFunction = handleExtractToFunction;
});