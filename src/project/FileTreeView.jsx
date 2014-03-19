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
        componentDidMount: function () {
            this.props.directory.getContents(function (err, contents) {
                if (!err) {
                    this.state.setState({
                        contents: contents
                    });
                }
            });
        },
        render: function () {
            var nodes;
            if (this.state.contents) {
                nodes = this.state.contents.map(function (entry) {
                    return this._formatEntry(entry);
                }.bind(this));
            } else {
                nodes = []
            }
            
            var open = this.props.openPaths[this.props.directory.fullPath] ? "open" : "closed";
            
            return (
                <li className={"jstree-" + open}>
                    <ins className="jstree-icon">&nbsp;</ins>
                    <a href="#">
                        <ins class="jstree-icon">&nbsp;</ins>
                        {this.props.directory.name}
                    </a>
                    <ul>
                        {nodes}
                    </ul>
                </li>
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
    
    FileTreeView = React.createClass({
        render: function () {
            return (
                <ul className="jstree-no-dots jstree-no-icons">
                    <DirectoryNode
                        key={this.props.root.fullPath}
                        directory={this.props.root}
                        openPaths=this.props.openPaths>
                    </DirectoryNode>
                </ul>
            );
        }
        
    });
});