var express = require('express');
var app = express();

app.use(express.static(__dirname + '/src'));

app.listen(4000);
