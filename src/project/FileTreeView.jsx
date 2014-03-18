/**
 * @jsx React.DOM
 */

/*global define*/
define(function (require, exports, module) {
    "use strict";
    
    FileNode = React.createClass({
        render: function () {
            var i = entry.name.lastIndexOf("."),
                name = entry.name.substring(0, i),
                extension;
            
            if (i > -1) {
                extension = (
                    <span className="extension">{entry.name.substring(i)}</span>
                );
            }
                
            return (
                <li className="jstree-leaf">{name}{extension}</li>
            );
        }
    });

    DirectoryNode = React.createClass({
        render: function () {
        }
    });
    
    FileTreeView = React.createClass({
        render: function () {
            var nodes = this.props.contents.map(function (entry) {
                return this._formatEntry(entry);
            }.bind(this));
            return (
                <ul className="jstree-no-dots jstree-no-icons">
                    {nodes}
                </ul>
            );
        },
        
        _formatEntry: function (entry) {
            if (entry.isDirectory) {
                var open = !!this.props.openPaths[entry.fullPath];
                return (
                    <DirectoryNode
                        key={entry.fullPath}
                        open={open}
                        directory={entry}>
                    </DirectoryNode>
                );
            } else {
                return (
                    <FileNode>
                        key={entry.fullPath}
                        file={entry}
                    </FileNode>
                );
            }
        }
    });
});