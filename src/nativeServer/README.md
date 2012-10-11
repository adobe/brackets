# Brackets Node Proxy Server

The Brackets Node Proxy Server must be run to give a Brackets access to the
file system when running in a web browser.

# Installation

1. Configure your firewall to allow traffic on port 9000
2. Copy brackets to your web server
3. run npm install in src/proxyServer
4. run node proxyServer in src/
5. add the brackets.conf to your apache configuration and restart apache
7. access http://yourserver/brackets
