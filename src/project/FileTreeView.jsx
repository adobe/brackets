/**
 * @jsx React.DOM
 */

/*global define*/
define(function (require, exports, module) {
    "use strict";
    
    var React = require("react");
    
    var FileNode = React.createClass({
        render: function () {
            var entry = this.props.file,
                i = entry.name.lastIndexOf("."),
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

    var DirectoryNode = React.createClass({
        getInitialState: function () {
            return {};
        },
        componentDidMount: function () {
            var open = this.props.open;
            if (open) {
                this.props.directory.getContents(function (err, contents) {
                    if (!err) {
                        this.setState({
                            contents: contents
                        });
                    }
                }.bind(this));
            }
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
            
            var open = this.props.open;
            
            return (
                <li className={"jstree-" + open}>
                    <ins className="jstree-icon">&nbsp;</ins>
                    <a href="#">
                        <ins className="jstree-icon">&nbsp;</ins>
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
                        openPaths={this.props.openPaths}
                        directory={entry}/>
                );
            } else {
                return (
                    <FileNode
                        key={entry.fullPath}
                        file={entry}/>
                );
            }
        }
    });
    
    var FileTreeView = React.createClass({
        render: function () {
            return (
                <ul className="jstree-no-dots jstree-no-icons">
                    <DirectoryNode
                        key={this.props.root.fullPath}
                        directory={this.props.root}
                        open={true}
                        openPaths={this.props.openPaths}/>
                </ul>
            );
        }
        
    });
    
    function render(element, root, openPaths) {
        React.renderComponent(
            <FileTreeView
                root={root}
                openPaths={openPaths}/>,
            element
        )
    }
    
    exports.render = render;
});