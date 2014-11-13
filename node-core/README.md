appshell-node-core
==================

Implements the "core" of the node server for the appshell. The code here is
responsible for launching node, setting up loggers, and creating the 
http/websocket servers necessary to communicate with the client.

This code also implements the minimal "base" domain which has commands for
enabling the debugger and loading new domains. All other node code is in the 
client repository, and is loaded using the base.loadDomainModulesFromPaths 
command. The goal is for the "core" to be as minimal as possible, and to
change very little once it is stable.
