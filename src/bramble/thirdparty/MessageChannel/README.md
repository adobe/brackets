# MessageChannel.js

[![Build Status](https://secure.travis-ci.org/tildeio/MessageChannel.js.png?branch=master)](http://travis-ci.org/tildeio/MessageChannel.js)

MessageChannel.js proposes an implementation of the [_channel messaging_ described in the
HTML5
specification](http://www.w3.org/TR/webmessaging/#channel-messaging).

## Compatibility

It is important to note that **the MessageChannel.js communication can only work
with browser that supports `window.postMessage`.**

## Installation

`MessageChannel.js` depends on UUID.js and Kamino.js.  The easiest way to get
them is to install `MessageChannel` via [bower][].  They will then wind up in
`bower_components`.

```sh
bower install MessageChannel.js
```

## Usage

The library works almost like a polyfill.

The only difference
in the code is the way `MessagePort`s are sent between user agents.

```js
 otherWindow.postMessage('hello', "http://example.com", [channel.port1]);
 worker.postMessage('hello', "http://example.com", [channel.port1]);
```

becomes:

```js
 Window.postMessage(otherWindow, 'hello', "http://example.com", [channel.port1]);
 Worker.postMessage(worker, 'hello', "http://example.com", [channel.port1]);
```

## Limitations

- A `MessagePort` can be transfered to another user agent that isn't a parent or a child.
In that case, each intermediate user agent needs to a) persist and b) retain a handle
to the user agent it transferred the port to. So if port p is sent from agent a to c via b,
b will still see messages between a and c.
- Structured data sent between ports uses [Kamino.js] (https://github.com/tildeio/kamino.js).
It offers support for more types than the structured clone algorithm implemented by browsers.
If you plan to send those types through a `MessagePort`, you'll have to encode/decode
the message with Kamino.

## Build Tools

MessageChannel.js uses [Grunt](http://gruntjs.com/) to automate building and
testing.

### Setup

Before you use any of the commands below, make sure you have
installed node.js, which includes npm, the node package manager.

If you haven't before, install the `grunt` CLI tool:

```sh
$ npm install -g grunt-cli
```

This will put the `grunt` command in your system path, allowing it to be
run from any directory.

Next, install MessageChannel's dependencies:

```sh
$ npm install
```

This will install all of the packages that MessageChannel's Gruntfile relies
on into the local `node_modules` directory.

### Tests

Run the MessageChannel tests by starting a test server:

```
grunt server
```

Once the server is running, visit `http://localhost:8000/test/` in your
browser.


[bower]: https://github.com/bower/bower
