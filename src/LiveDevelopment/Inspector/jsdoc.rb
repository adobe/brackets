#!/bin/ruby
#
#
# Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
#  
# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the "Software"), 
# to deal in the Software without restriction, including without limitation 
# the rights to use, copy, modify, merge, publish, distribute, sublicense, 
# and/or sell copies of the Software, and to permit persons to whom the 
# Software is furnished to do so, subject to the following conditions:
#  
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#  
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
# DEALINGS IN THE SOFTWARE.
# 
#
# This script generates debugger documentation from Inspector.json
#
# Required Ruby Gems
#  json date open-uri

require "rubygems"
require "json"
require "date"
require "open-uri"

#INSPECTOR_URL   = "http://svn.webkit.org/repository/webkit/trunk/Source/WebCore/inspector/Inspector.json"
INSPECTOR_URL   = "Inspector.json"
OUTPUT          = "inspector.html"

class NilClass
	def empty?
		true
	end
	def each
	end
end

class String
	def upcaseFirst
		self[0, 1].upcase + self[1, self.length - 1]
	end
end

class JSDoc

	def typedef(domain, info)
		return "[" + typedef(domain, info['items']) + "]" if info['items']
		if info["$ref"]
			ref = info["$ref"]
			ref = domain + "." + ref unless ref =~ /\./
			r = "<a href='##{ref}'>#{ref}</a>" if info["$ref"]
		elsif info["enum"]
			r = "( #{info['enum'].join " | "} )"
		else
			r = info["type"].upcaseFirst
		end
		r
	end

	def initialize(input, output)
		@input = input
		@output = output
	end

	def open
		@in = JSON.parse(File.open(@input).read)
		@in["domains"].sort! { |a,b| a["domain"] <=> b["domain"] }
		@version = "#{@in['version']['major']}.#{@in['version']['minor']}"
		File.open(@output, "w") do |out|
			@out = out
			yield
		end
	end

	def run
		open do 
			writeDocument do
				writeTOC
				@in["domains"].each { |domain| writeDomain domain }
			end
		end
	end

	def write(*args)
		args.each { |line| @out.write line + "\n" }
	end

	def writeParams(domain, params, prefixLine = false)
		return unless params
		write prefixLine if prefixLine
		write "<dl>"
		params.each do |p|
			name = p["name"]
			description = " <span class='text'>#{p['description']}</span>" if p['description']
			type = typedef domain, p
			name += " (optional)" if p['optional']
			write "<dt>#{name}</dt>"
			write "<dd>#{type}#{description}</dd>"
		end
		write "</dl>"
	end

	def writeTOCLine(domain, info)
		info["name"] ||= info["id"]
		uid = "#{domain}.#{info['name']}"
		description = info['description'] ? ": #{info['description'].gsub(/<[^>]*>/, "")}" : ""
		write "<li><a href='##{uid}'>#{uid}</a>#{description}</li>"
	end

	def writeTOCDomain(info)
		domain = info["domain"]
		unless info["types"].empty?
			write "<span class='label'>Type</span>", "<ul>"
			info["types"].each { |p| writeTOCLine domain, p }
			write "</ul>"
		end
		unless info["commands"].empty?
			write "<span class='label label-success'>Command</span>", "<ul>"
			info["commands"].each { |p| writeTOCLine domain, p }
			write "</ul>"
		end
		unless info["events"].empty?
			write "<span class='label label-info'>Event</span>", "<ul>"
			info["events"].each { |p| writeTOCLine domain, p }
			write "</ul>"
		end
	end

	def writeDocument
		@out.write <<-eos
<!DOCTYPE html>
<html>
<head>
<title>Inspector #{@version} Documentation</title>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.18/jquery-ui.min.js"></script>
<script src="http://twitter.github.com/bootstrap/assets/js/bootstrap-dropdown.js"></script>
<script>
$(function () {
var _domain = $(window.location.hash);
if (_domain.length === 0) _domain = $("#toc");
$(".domain").hide();
_domain.show();
$(".dropdown-toggle").dropdown();
$("a[href^=#]").click(function (e) {
e.preventDefault();
var domainAndName = e.currentTarget.hash.split(".");
window.location = domainAndName[0];
var symbol = $(domainAndName.join("_"));
var speed;
if (_domain !== domainAndName[0]) {
$(_domain).hide();
_domain = domainAndName[0];
$(_domain).show();
speed = 0;
} else {
speed = "fast";
}
$("html, body").animate({
scrollTop: symbol.offset().top - 70 + "px"
}, speed);
if (domainAndName.length > 1) symbol.effect("highlight", { color: "#ffc"}, 1000);
});
});
</script>
<link href="http://twitter.github.com/bootstrap/assets/css/bootstrap.css" rel="stylesheet">
<style>
body {padding: 70px 0 20px 0;}
h3, dl {font-family: Menlo, Monaco, "Courier New", monospace;}
dl {font-size: 12.025px;}
dl dd {margin-bottom: 6px;}
dl .text {margin-left:12px; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;}
h3 {border-top: 1px solid #aaa; padding: 8px 0;}
h3 .label {float: left; margin: 6px;}
footer p {text-align: center; margin: 0;}
</style>
</head>
<body>
<div class="navbar navbar-fixed-top">
<div class="navbar-inner">
<div class="container">
<a href="#toc" class="brand">WebInspector v#{@version}</a>
<ul class="nav nav-pills">
<li class="dropdown" id="domain-menu">
<a class="dropdown-toggle" data-toggle="dropdown">Domains<b class="caret"></b></a>
<ul class="dropdown-menu">
eos
		@in["domains"].each { |info| write "<li><a href='##{info['domain']}'>#{info['domain']}</a></li>" }
		write "</ul>", "</li>", "</ul>", "</div>", "</div>", "</div>", "<div class='container'>"
		yield
		write "</div>", "<footer>"
		write "<p>Generated from Inspector.json v#{@version} on #{DateTime.now.strftime '%F %T%z'}</p>"
		write "<p>Implementation by <a href='mailto:jdiehl@adobe.com'>Jonathan Diehl</a></p>"
		write "</footer>", "</body>", "</html>"
	end

	def writeTOC
		write "<section id='toc' class='domain'>", "<h1>Table of Contents</h1>"
		@in["domains"].each do |info|
			domain = info["domain"]
			write "<h3><a href=\"##{info['domain']}\">#{info['domain']}</a></h3>"
			writeTOCDomain info
		end
		write "</section>"
	end

	def writeDomain(info)
		domain, description = info["domain"], info["description"]
		types, commands, events = info["types"], info["commands"], info["events"]
		write "<section id='#{domain}' class='domain'>"
		write "<h1>#{domain}</h1>"
		write "<p>#{description}</p>"
		writeTOCDomain info
		if types
			types.each    { |info| writeType domain, info    }
		end
		if commands
			commands.each    { |info| writeCommand domain, info    }
		end
		if events
			events.each    { |info| writeEvent domain, info    }
		end
		write "</section>"
	end

	def writeType(domain, info)
		name, description = info["id"], info["description"]
		type, enum, properties = info["type"], info["enum"], info["properties"]
		write "<div id='#{domain}_#{name}' class='type'>"
		write "<h3>#{domain}.#{name} <span class='label'>Type</span></h3>"
		write "<p>#{description}</p>" if description
		if type != "object"
			write "<dl>"
			write "<dd>#{typedef domain, info}</dd>"
			write "</dl>"
		end
		writeParams domain, properties
		write "</div>"
	end

	def writeCommand(domain, info)
		name, description = info["name"], info["description"]
		parameters, returns = info["parameters"], info["returns"]
		write "<div id='#{domain}_#{name}' class='command'>"
		write "<h3>#{domain}.#{name} <span class='label label-success'>Command</span></h3>"
		write "<p>#{description}</p>" if description
		writeParams domain, parameters
		writeParams domain, returns, "<h4>Callback Parameters:</h4>"
		write "<h4>Code Example:</h4>", "<pre>"
		paramNames = parameters.collect { |p| p["name"] } if parameters
		paramNames ||= []
		if returns
			returnNames = returns.collect { |p| p["name"] }
			paramNames << "function callback(res) {\n\t// res = {#{returnNames.join ", "}}\n}"
		end
		write "// WebInspector Command: #{domain}.#{name}"
		write "#{domain}.#{name}(#{paramNames.join ", "});"
		write "</pre>", "</div>"
	end

	def writeEvent(domain, info)
		name, description = info["name"], info["description"]
		parameters = info["parameters"]
		write "<div id='#{domain}_#{name}' class='command'>"
		write "<h3>#{domain}.#{name} <span class='label label-info'>Event</span></h3>"
		write "<p>#{description}</p>" if description
		writeParams domain, parameters
		write "<h4>Code Example:</h4>", "<pre>"
		paramNames = parameters.collect { |p| p["name"] } if parameters
		paramNames ||= []
		write "// WebInspector Event: #{domain}.#{name}"
		write "function on#{name.upcaseFirst}(res) {\n\t// res = {#{paramNames.join ", "}}\n}"
		write "</pre>", "</div>"
	end

end

jsdoc = JSDoc.new INSPECTOR_URL, OUTPUT
jsdoc.run