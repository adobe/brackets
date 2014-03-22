/**
 * @jsx React.DOM
 */

/*global define*/
define(function (require, exports, module) {
    "use strict";
    
    var React = require("react"),
        _ = require("thirdparty/lodash"),
        FileUtils = require("file/FileUtils");
    
    var FileNode = React.createClass({
        handleClick: function () {
            console.log("file clicked");
            if (this.props.setSelected) {
                this.props.setSelected(this.props.file.fullPath);
            }
            return false;
        },
        render: function () {
            var entry = this.props.file,
                i = entry.name.lastIndexOf("."),
                name = entry.name.substr(0, i > -1 ? i : entry.name.length),
                extension;
            
            if (i > -1) {
                extension = (
                    <span className="extension">{entry.name.substring(i)}</span>
                );
            }
            
            var fileClasses = "";
            if (this.props.selected) {
                fileClasses = "jstree-clicked jstree-hovered";
            }
            return (
                <li className="jstree-leaf" onClick={this.handleClick}>
                    <ins className="jstree-icon">&nbsp;</ins>
                    <a href="#" className={fileClasses}>{name}{extension}</a>
                </li>
            );
        }
    });

    var DirectoryNode = React.createClass({
        getInitialState: function () {
            return {};
        },
        loadContents: function () {
            this.props.directory.getContents(function (err, contents) {
                if (!err) {
                    this.setState({
                        contents: contents
                    });
                }
            }.bind(this));
        },
        componentDidMount: function () {
            var open = this.props.open;
            if (open) {
                this.loadContents();
            }
        },
        handleClick: function () {
            if (this.props.togglePath) {
                var newOpen = !this.props.open;
                if (newOpen && !this.state.contents) {
                    this.loadContents();
                }
                this.props.togglePath(this.props.directory.fullPath, !this.props.open);
            }
            return false;
        },
        render: function () {
            var nodes;
            if (this.state.contents) {
                var dirsFirst = this.props.dirsFirst;
                nodes = _(this.state.contents).clone().sort(function (a, b) {
                    if (dirsFirst) {
                        if (a.isDirectory && !b.isDirectory) {
                            return -1;
                        } else if (!a.isDirectory && b.isDirectory) {
                            return 1;
                        }
                    }
                    return FileUtils.compareFilenames(a.name, b.name, false);
                }).map(function (entry) {
                    return this._formatEntry(entry);
                }.bind(this));
            } else {
                nodes = []
            }
            
            if (this.props.skipRoot) {
                return (
                    <div>{nodes}</div>
                );
            }
            
            var open = this.props.open ? "open" : "closed";
            
            return (
                <li className={"jstree-" + open} onClick={this.handleClick}>
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
                        callbacks={this.props.callbacks}
                        selected={this.props.selected}
                        setSelected={this.props.setSelected}
                        togglePath={this.props.togglePath}
                        directory={entry}/>
                );
            } else {
                return (
                    <FileNode
                        key={entry.fullPath}
                        callbacks={this.props.callbacks}
                        selected={this.props.selected === entry.fullPath}
                        setSelected={this.props.setSelected}
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
                        skipRoot={true}
                        selected={this.props.selected}
                        setSelected={this.props.setSelected}
                        togglePath={this.props.togglePath}
                        openPaths={this.props.openPaths}
                        dirsFirst={this.props.dirsFirst}/>
                </ul>
            );
        }
        
    });
    
    function render(element, root, props) {
        $(element).addClass("jstree jstree-brackets");
        $(element).css("overflow", "auto");
        React.renderComponent(
            <FileTreeView
                root={root}
                openPaths={props.openPaths}
                selected={props.selected}
                togglePath={props.togglePath}
                setSelected={props.setSelected}
                dirsFirst={props.dirsFirst}/>,
            element
        )
    }
    
    exports.render = render;
});