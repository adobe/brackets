'use strict';


var $$ = require('./common');
var _reader = require('./reader');
var _scanner = require('./scanner');
var _parser = require('./parser');
var _composer = require('./composer');
var _resolver = require('./resolver');
var _constructor = require('./constructor');


function BaseLoader(stream) {
  _reader.Reader.call(this, stream);
  _scanner.Scanner.call(this);
  _parser.Parser.call(this);
  _composer.Composer.call(this);
  _constructor.BaseConstructor.call(this);
  _resolver.BaseResolver.call(this);
}

$$.extend(BaseLoader.prototype,
         _reader.Reader.prototype,
         _scanner.Scanner.prototype,
         _parser.Parser.prototype,
         _composer.Composer.prototype,
         _constructor.BaseConstructor.prototype,
         _resolver.BaseResolver.prototype);


function SafeLoader(stream) {
  _reader.Reader.call(this, stream);
  _scanner.Scanner.call(this);
  _parser.Parser.call(this);
  _composer.Composer.call(this);
  _constructor.SafeConstructor.call(this);
  _resolver.Resolver.call(this);
}

$$.extend(SafeLoader.prototype,
         _reader.Reader.prototype,
         _scanner.Scanner.prototype,
         _parser.Parser.prototype,
         _composer.Composer.prototype,
         _constructor.SafeConstructor.prototype,
         _resolver.Resolver.prototype);


function Loader(stream) {
  _reader.Reader.call(this, stream);
  _scanner.Scanner.call(this);
  _parser.Parser.call(this);
  _composer.Composer.call(this);
  _constructor.Constructor.call(this);
  _resolver.Resolver.call(this);
}

$$.extend(Loader.prototype,
         _reader.Reader.prototype,
         _scanner.Scanner.prototype,
         _parser.Parser.prototype,
         _composer.Composer.prototype,
         _constructor.Constructor.prototype,
         _resolver.Resolver.prototype);


BaseLoader.addConstructor = function (tag, constructor) {
  _constructor.BaseConstructor.addConstructor(tag, constructor);
};


SafeLoader.addConstructor = function (tag, constructor) {
  _constructor.SafeConstructor.addConstructor(tag, constructor);
};


Loader.addConstructor = function (tag, constructor) {
  _constructor.Constructor.addConstructor(tag, constructor);
};


module.exports.BaseLoader = BaseLoader;
module.exports.SafeLoader = SafeLoader;
module.exports.Loader = Loader;
