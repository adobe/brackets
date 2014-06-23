# Nimble is based on Brackets

Brackets is a modern open-source code editor for HTML, CSS
and JavaScript that's *built* in HTML, CSS and JavaScript. 

Brackets is at 1.0 and we're not stopping there. We have many feature ideas on our
[trello board](http://bit.ly/BracketsTrelloBoard) that we're anxious to add and other
innovative web development workflows that we're planning to build into Brackets. 
So take Brackets out for a spin and let us know how we can make it your favorite editor. 

You can see some 
[screenshots of Brackets](https://github.com/adobe/brackets/wiki/Brackets-Screenshots)
on the wiki, [intro videos](http://www.youtube.com/user/CodeBrackets) on YouTube, and news on the [Brackets blog](http://blog.brackets.io/).

The text editor inside Brackets is based on 
[CodeMirror](http://github.com/codemirror/CodeMirror)&mdash;thanks to Marijn for
taking our pull requests, implementing feature requests and fixing bugs! See 
[Notes on CodeMirror](https://github.com/adobe/brackets/wiki/Notes-on-CodeMirror)
for info on how we're using CodeMirror.

#How to setup Nimble with MakeDrive server

## Setup Webmaker Login Server

You need to have Webmaker Login for Authentication to connect to MakeDrive WebSocket Server.  

Make sure you have forked and cloned [Webmaker Login](https://github.com/mozilla/login.webmaker.org) then run the following steps:  

Install npm modules:
```
$ npm install
```
Use the default configuration:
```
$ cp env.sample .env
```
Run the server:
```
$ node app.js
```

You will now have Webmaker Login server running on port `3000` you can test by visiting [http://localhost:3000/account](http://localhost:3000/account).  Also, make sure you create an account.

## Setup Nimble (Brackets) in your lcoal machine

Step 01: Make sure you have forked and clone [Nimble](https://github.com/mozilla/nimble).

```
$ git clone https://github.com/[yourusername]/nimble --recursive
```

Step 02: Install its dependencies

```
$ npm install
```

```
$ git submodule update --init
```

Step 03: Run Nimble:

There are multiple ways to run Nimble.  
You can use [Apache Webserver](http://www.apache.org/), host on [github pages](https://help.github.com/articles/what-are-github-pages) or use [Python WebServer](https://docs.python.org/2/library/simplehttpserver.html).

Assuming you have Nimble running on port `8080`. Now you can visit [http://localhost:8080/src](http://localhost:8080/src).

## Step up MakeDrive in your local machine

Step 01: Make sure you have forked and clone [MakeDrive](https://github.com/mozilla/makedrive) repo.  

```
$ git clone git@github.com:[yourusername]/makedrive.git --recursive
```
```
$ cd makedrive
```

Step 02: After you have cloned and cd MakeDrive in your local machine then you need to install all of MakeDrive dependencies

First you will need `grunt-cli` to be installed globally using `npm`

```
$ sudo npm install grunt-cli -g
```

Install npm modules:

```
$ npm install
```

Install submodule's dependencies
```
$ grunt init
```

Step 03: Copy the environment file

```
$ cp env.dist .env
```

Step 04: configure `ALLOWED_CORS_DOMAINS` to allow Nimble to connect.

Assuming you have Nimble running on `http://localhost:8080`

```
export ALLOWED_CORS_DOMAINS='["http://localhost", "http://localhost:80", "http://localhost:8080", "http://localhost:7777", "http://localhost:9090", "http://localhost:5001"]'
```

Step 05: Run MakeDrive server

```
$ npm start
```

Now you will have MakeDrive running on port 9090 [http://localhost:9090](http://localhost:9090).

--------------

## After installation

After you have everything setup and running you can now test by running Nimble and start creating files and see it in action by visiting [http://localhost:8080/src](http://localhost:8080/src). Also, make sure you already have Webmaker Login server running and you are logged in.

Watch our demo to see [Nimble in action](https://www.youtube.com/watch?v=sHn6oO0i0ak).

If you have any question feel free to ask on [#nimble](irc://irc.mozilla.org/nimble) IRC channel on the [Mozilla Network](https://wiki.mozilla.org/IRC).