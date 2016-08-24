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

/*unittests: HTML Instrumentation*/

define(function (require, exports, module) {
    "use strict";

    /**
     * @private
     *
     * Determines the changes made to attributes and generates edits for those changes.
     *
     * @param {SimpleNode} oldNode node from old tree
     * @param {SimpleNode} newNode node from new tree
     * @return {Array.<Object>} list of edits to mutate attributes from the old node to the new
     */
    function generateAttributeEdits(oldNode, newNode) {
        // shallow copy the old attributes object so that we can modify it
        var oldAttributes = $.extend({}, oldNode.attributes),
            newAttributes = newNode.attributes,
            edits = [];

        Object.keys(newAttributes).forEach(function (attributeName) {
            if (oldAttributes[attributeName] !== newAttributes[attributeName]) {
                var type = oldAttributes.hasOwnProperty(attributeName) ? "attrChange" : "attrAdd";
                edits.push({
                    type: type,
                    tagID: oldNode.tagID,
                    attribute: attributeName,
                    value: newAttributes[attributeName]
                });
            }
            delete oldAttributes[attributeName];
        });

        Object.keys(oldAttributes).forEach(function (attributeName) {
            edits.push({
                type: "attrDelete",
                tagID: oldNode.tagID,
                attribute: attributeName
            });
        });

        return edits;
    }

    /**
     * @private
     *
     * Retrieve the parent tag ID of a SimpleDOM node.
     *
     * @param {Object} node SimpleDOM node for which to look up parent ID
     * @return {int?} ID or null if there is no parent
     */
    function getParentID(node) {
        return node.parent && node.parent.tagID;
    }

    /**
     * @private
     *
     * When the main loop (see below) determines that something has changed with
     * an element's immediate children, it calls this function to create edit
     * operations for those changes.
     *
     * This adds to the edit list in place and does not return anything.
     *
     * @param {?Object} oldParent SimpleDOM node for the previous state of this element, null/undefined if the element is new
     * @param {Object} newParent SimpleDOM node for the current state of the element
     */
    var generateChildEdits = function (oldParent, oldNodeMap, newParent, newNodeMap) {
        /*jslint continue: true */

        var newIndex = 0,
            oldIndex = 0,
            newChildren = newParent.children,
            oldChildren = oldParent ? oldParent.children : [],
            newChild,
            oldChild,
            newEdits = [],
            newEdit,
            textAfterID,
            edits = [],
            moves = [],
            newElements = [];

        /**
         * We initially put new edit objects into the `newEdits` array so that we
         * can fix them up with proper positioning information. This function is
         * responsible for doing that fixup.
         *
         * The `beforeID` that appears in many edits tells the browser to make the
         * change before the element with the given ID. In other words, an
         * elementInsert with a `beforeID` of 32 would result in something like
         * `parentElement.insertBefore(newChildElement, _queryBracketsID(32))`
         *
         * Many new edits are captured in the `newEdits` array so that a suitable
         * `beforeID` can be added to them before they are added to the main edits
         * list. This function sets the `beforeID` on any pending edits and adds
         * them to the main list.
         *
         * If this item is not being deleted, then it will be used as the `afterID`
         * for text edits that follow.
         *
         * @param {int} beforeID ID to set on the pending edits
         * @param {boolean} isBeingDeleted true if the given item is being deleted. If so,
         *     we can't use it as the `afterID` for future edits--whatever previous item
         *     was set as the `textAfterID` is still okay.
         */
        var finalizeNewEdits = function (beforeID, isBeingDeleted) {
            newEdits.forEach(function (edit) {
                // elementDeletes don't need any positioning information
                if (edit.type !== "elementDelete") {
                    edit.beforeID = beforeID;
                }
            });
            edits.push.apply(edits, newEdits);
            newEdits = [];

            // If the item we made this set of edits relative to
            // is being deleted, we can't use it as the afterID for future
            // edits. It's okay to just keep the previous afterID, since
            // this node will no longer be in the tree by the time we get
            // to any future edit that needs an afterID.
            if (!isBeingDeleted) {
                textAfterID = beforeID;
            }
        };

        /**
         * If the current element was not in the old DOM, then we will create
         * an elementInsert edit for it.
         *
         * If the element was in the old DOM, this will return false and the
         * main loop will either spot this element later in the child list
         * or the element has been moved.
         *
         * @return {boolean} true if an elementInsert was created
         */
        var addElementInsert = function () {
            if (!oldNodeMap[newChild.tagID]) {
                newEdit = {
                    type: "elementInsert",
                    tag: newChild.tag,
                    tagID: newChild.tagID,
                    parentID: newChild.parent.tagID,
                    attributes: newChild.attributes
                };

                newEdits.push(newEdit);

                // This newly inserted node needs to have edits generated for its
                // children, so we add it to the queue.
                newElements.push(newChild);

                // A textInsert edit that follows this elementInsert should use
                // this element's ID.
                textAfterID = newChild.tagID;

                // new element means we need to move on to compare the next
                // of the current tree with the one from the old tree that we
                // just compared
                newIndex++;
                return true;
            }
            return false;
        };

        /**
         * If the old element that we're looking at does not appear in the new
         * DOM, that means it was deleted and we'll create an elementDelete edit.
         *
         * If the element is in the new DOM, then this will return false and
         * the main loop with either spot this node later on or the element
         * has been moved.
         *
         * @return {boolean} true if elementDelete was generated
         */
        var addElementDelete = function () {
            if (!newNodeMap[oldChild.tagID]) {
                // We can finalize existing edits relative to this node *before* it's
                // deleted.
                finalizeNewEdits(oldChild.tagID, true);

                newEdit = {
                    type: "elementDelete",
                    tagID: oldChild.tagID
                };
                newEdits.push(newEdit);

                // deleted element means we need to move on to compare the next
                // of the old tree with the one from the current tree that we
                // just compared
                oldIndex++;
                return true;
            }
            return false;
        };

        /**
         * Adds a textInsert edit for a newly created text node.
         */
        var addTextInsert = function () {
            newEdit = {
                type: "textInsert",
                content: newChild.content,
                parentID: newChild.parent.tagID
            };

            // text changes will generally have afterID and beforeID, but we make
            // special note if it's the first child.
            if (textAfterID) {
                newEdit.afterID = textAfterID;
            } else {
                newEdit.firstChild = true;
            }
            newEdits.push(newEdit);

            // The text node is in the new tree, so we move to the next new tree item
            newIndex++;
        };

        /**
         * Finds the previous child of the new tree.
         *
         * @return {?Object} previous child or null if there wasn't one
         */
        var prevNode = function () {
            if (newIndex > 0) {
                return newParent.children[newIndex - 1];
            }
            return null;
        };

        /**
         * Adds a textDelete edit for text node that is not in the new tree.
         * Note that we actually create a textReplace rather than a textDelete
         * if the previous node in current tree was a text node. We do this because
         * text nodes are not individually addressable and a delete event would
         * end up clearing out both that previous text node that we want to keep
         * and this text node that we want to eliminate. Instead, we just log
         * a textReplace which will result in the deletion of this node and
         * the maintaining of the old content.
         */
        var addTextDelete = function () {
            var prev = prevNode();
            if (prev && !prev.children) {
                newEdit = {
                    type: "textReplace",
                    content: prev.content
                };
            } else {
                newEdit = {
                    type: "textDelete"
                };
            }

            // When elements are deleted or moved from the old set of children, you
            // can end up with multiple text nodes in a row. A single textReplace edit
            // will take care of those (and will contain all of the right content since
            // the text nodes between elements in the new DOM are merged together).
            // The check below looks to see if we're already in the process of adding
            // a textReplace edit following the same element.
            var previousEdit = newEdits.length > 0 && newEdits[newEdits.length - 1];
            if (previousEdit && previousEdit.type === "textReplace" &&
                    previousEdit.afterID === textAfterID) {
                oldIndex++;
                return;
            }

            newEdit.parentID = oldChild.parent.tagID;

            // If there was only one child previously, we just pass along
            // textDelete/textReplace with the parentID and the browser will
            // clear all of the children
            if (oldChild.parent.children.length === 1) {
                newEdits.push(newEdit);
            } else {
                if (textAfterID) {
                    newEdit.afterID = textAfterID;
                }
                newEdits.push(newEdit);
            }

            // This text appeared in the old tree but not the new one, so we
            // increment the old children counter.
            oldIndex++;
        };

        /**
         * Adds an elementMove edit if the parent has changed between the old and new trees.
         * These are fairly infrequent and generally occur if you make a change across
         * tag boundaries.
         *
         * @return {boolean} true if an elementMove was generated
         */
        var addElementMove = function () {

            // This check looks a little strange, but it suits what we're trying
            // to do: as we're walking through the children, a child node that has moved
            // from one parent to another will be found but would look like some kind
            // of insert. The check that we're doing here is looking up the current
            // child's ID in the *old* map and seeing if this child used to have a
            // different parent.
            var possiblyMovedElement = oldNodeMap[newChild.tagID];
            if (possiblyMovedElement &&
                    newParent.tagID !== getParentID(possiblyMovedElement)) {
                newEdit = {
                    type: "elementMove",
                    tagID: newChild.tagID,
                    parentID: newChild.parent.tagID
                };
                moves.push(newEdit.tagID);
                newEdits.push(newEdit);

                // this element in the new tree was a move to this spot, so we can move
                // on to the next child in the new tree.
                newIndex++;
                return true;
            }
            return false;
        };

        /**
         * Looks to see if the element in the old tree has moved by checking its
         * current and former parents.
         *
         * @return {boolean} true if the element has moved
         */
        var hasMoved = function (oldChild) {
            var oldChildInNewTree = newNodeMap[oldChild.tagID];

            return oldChild.children && oldChildInNewTree && getParentID(oldChild) !== getParentID(oldChildInNewTree);
        };

        // Loop through the current and old children, comparing them one by one.
        while (newIndex < newChildren.length && oldIndex < oldChildren.length) {
            newChild = newChildren[newIndex];

            // Check to see if the currentChild has been reparented from somewhere
            // else in the old tree
            if (newChild.children && addElementMove()) {
                continue;
            }

            oldChild = oldChildren[oldIndex];

            // Check to see if the oldChild has been moved to another parent.
            // If it has, we deal with it on the other side (see above)
            if (hasMoved(oldChild)) {
                oldIndex++;
                continue;
            }

            if (newChild.isElement() || oldChild.isElement()) {

                if (newChild.isElement() && oldChild.isText()) {
                    addTextDelete();

                    // If this element is new, add it and move to the next child
                    // in the current tree. Otherwise, we'll compare this same
                    // current element with the next old element on the next pass
                    // through the loop.
                    addElementInsert();

                } else if (oldChild.isElement() && newChild.isText()) {
                    // If the old child has *not* been deleted, we assume that we've
                    // inserted some text and will still encounter the old node
                    if (!addElementDelete()) {
                        addTextInsert();
                    }

                // both children are elements
                } else {
                    if (newChild.tagID !== oldChild.tagID) {

                        // First, check to see if we're deleting an element.
                        // If we are, get rid of that element and restart our comparison
                        // logic with the same element from the new tree and the next one
                        // from the old tree.
                        if (!addElementDelete()) {
                            // Since we're not deleting and these elements don't match up, we
                            // must have a new element. Add an elementInsert (and log a problem
                            // if no insert works.)
                            if (!addElementInsert()) {
                                console.error("HTML Instrumentation: This should not happen. Two elements have different tag IDs and there was no insert/delete. This generally means there was a reordering of elements.");
                                newIndex++;
                                oldIndex++;
                            }
                        }

                    // There has been no change in the tag we're looking at.
                    } else {
                        // Since this element hasn't moved, it is a suitable "beforeID"
                        // for the edits we've logged.
                        finalizeNewEdits(oldChild.tagID, false);
                        newIndex++;
                        oldIndex++;
                    }
                }

            // We know we're comparing two texts. Just match up their signatures.
            } else {
                if (newChild.textSignature !== oldChild.textSignature) {
                    newEdit = {
                        type: "textReplace",
                        content: newChild.content,
                        parentID: newChild.parent.tagID
                    };
                    if (textAfterID) {
                        newEdit.afterID = textAfterID;
                    }
                    newEdits.push(newEdit);
                }

                // Either we've done a text replace or both sides matched. In either
                // case we're ready to move forward among both the old and new children.
                newIndex++;
                oldIndex++;
            }
        }

        // At this point, we've used up all of the children in at least one of the
        // two sets of children.

        /**
         * Take care of any remaining children in the old tree.
         */
        while (oldIndex < oldChildren.length) {
            oldChild = oldChildren[oldIndex];

            // Check for an element that has moved
            if (hasMoved(oldChild)) {
                // This element has moved, so we skip it on this side (the move
                // is handled on the new tree side).
                oldIndex++;

            // is this an element? if so, delete it
            } else if (oldChild.isElement()) {
                if (!addElementDelete()) {
                    console.error("HTML Instrumentation: failed to add elementDelete for remaining element in the original DOM. This should not happen.", oldChild);
                    oldIndex++;
                }

            // must be text. delete that.
            } else {
                addTextDelete();
            }
        }

        /**
         * Take care of the remaining children in the new tree.
         */
        while (newIndex < newChildren.length) {
            newChild = newChildren[newIndex];

            // Is this an element?
            if (newChild.isElement()) {

                // Look to see if the element has moved here.
                if (!addElementMove()) {
                    // Not a move, so we insert this element.
                    if (!addElementInsert()) {
                        console.error("HTML Instrumentation: failed to add elementInsert for remaining element in the updated DOM. This should not happen.");
                        newIndex++;
                    }
                }

            // not a new element, so it must be new text.
            } else {
                addTextInsert();
            }
        }

        /**
         * Finalize remaining edits. For inserts and moves, we can set the `lastChild`
         * flag and the browser can simply use `appendChild` to add these items.
         */
        newEdits.forEach(function (edit) {
            if (edit.type === "textInsert" || edit.type === "elementInsert" || edit.type === "elementMove") {
                edit.lastChild = true;
                delete edit.firstChild;
                delete edit.afterID;
            }
        });
        edits.push.apply(edits, newEdits);

        return {
            edits: edits,
            moves: moves,
            newElements: newElements
        };
    };

    /**
     * Generate a list of edits that will mutate oldNode to look like newNode.
     * Currently, there are the following possible edit operations:
     *
     * * elementInsert
     * * elementDelete
     * * elementMove
     * * textInsert
     * * textDelete
     * * textReplace
     * * attrDelete
     * * attrChange
     * * attrAdd
     * * rememberNodes (a special instruction that reflects the need to hang on to moved nodes)
     *
     * @param {Object} oldNode SimpleDOM node with the original content
     * @param {Object} newNode SimpleDOM node with the new content
     * @return {Array.{Object}} list of edit operations
     */
    function domdiff(oldNode, newNode) {
        var queue = [],
            edits = [],
            moves = [],
            newElement,
            oldElement,
            oldNodeMap = oldNode ? oldNode.nodeMap : {},
            newNodeMap = newNode.nodeMap;

        /**
         * Adds elements to the queue for generateChildEdits.
         * Only elements (and not text nodes) are added. New nodes (ones that aren't in the
         * old nodeMap), are not added here because they will be added when generateChildEdits
         * creates the elementInsert edit.
         */
        var queuePush = function (node) {
            if (node.children && oldNodeMap[node.tagID]) {
                queue.push(node);
            }
        };

        /**
         * Aggregates the child edits in the proper data structures.
         *
         * @param {Object} delta edits, moves and newElements to add
         */
        var addEdits = function (delta) {
            edits.push.apply(edits, delta.edits);
            moves.push.apply(moves, delta.moves);
            queue.push.apply(queue, delta.newElements);
        };

        // Start at the root of the current tree.
        queue.push(newNode);

        do {
            newElement = queue.pop();
            oldElement = oldNodeMap[newElement.tagID];

            // Do we need to compare elements?
            if (oldElement) {

                // Are attributes different?
                if (newElement.attributeSignature !== oldElement.attributeSignature) {
                    // generate attribute edits
                    edits.push.apply(edits, generateAttributeEdits(oldElement, newElement));
                }

                // Has there been a change to this node's immediate children?
                if (newElement.childSignature !== oldElement.childSignature) {
                    addEdits(generateChildEdits(oldElement, oldNodeMap, newElement, newNodeMap));
                }

                // If there's a change farther down in the tree, add the children to the queue.
                // If not, we can skip that whole subtree.
                if (newElement.subtreeSignature !== oldElement.subtreeSignature) {
                    newElement.children.forEach(queuePush);
                }

            // This is a new element, so go straight to generating child edits (which will
            // create the appropriate Insert edits).
            } else {
                // If this is the root (html) tag, we need to manufacture an insert for it here,
                // because it isn't the child of any other node. The browser-side code doesn't
                // care about parentage/positioning in this case, and will handle just setting the
                // ID on the existing implied HTML tag in the browser without actually creating it.
                if (!newElement.parent) {
                    edits.push({
                        type: "elementInsert",
                        tag: newElement.tag,
                        tagID: newElement.tagID,
                        parentID: null,
                        attributes: newElement.attributes
                    });
                }

                addEdits(generateChildEdits(null, oldNodeMap, newElement, newNodeMap));
            }
        } while (queue.length);

        // Special handling for moves: add edits to the beginning of the list so that
        // moved nodes are set aside to ensure that they remain available at the time of their
        // move.
        if (moves.length > 0) {
            edits.unshift({
                type: "rememberNodes",
                tagIDs: moves
            });
        }

        return edits;
    }

    // Public API
    exports.domdiff = domdiff;
});
