#!/usr/bin/env node

var express = require('express');
var app = express();

app.use(express.static(__dirname + '/src'));

app.use(express.logger());

app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), function(){
  console.log(
    "Express server listening on port:",
    app.get('port'),
    "( Likely http://localhost:" + app.get('port'),
    ")"
  );
});

