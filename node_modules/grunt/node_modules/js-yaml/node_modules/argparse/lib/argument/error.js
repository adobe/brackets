'use strict';

var _ = require('underscore');
_.str = require('underscore.string');
var ERR_CODE = 'ARGError';

/*:nodoc:*
 * argumentError(argument, message) -> TypeError
 * - argument (Object): action with broken argument
 * - message (String): error message
 *
 * Error format helper. An error from creating or using an argument
 * (optional or positional). The string value of this exception
 * is the message, augmented with information
 * about the argument that caused it.
 *
 * #####Example
 *
 *      var argumentErrorHelper = require('./argument/error');
 *      if (conflictOptionals.length > 0) {
 *        throw argumentErrorHelper(
 *          action,
 *          _.str.sprintf('Conflicting option string(s): %(conflict)s', {
 *            conflict: conflictOptionals.join(', ')
 *          })
 *        );
 *      }
 *
 **/
var argumentError = module.exports = function (argument, message) {
  var argumentName = null;
  var format;
  var errMessage;
  var err;

  if (argument.getName) {
    argumentName = argument.getName();
  } else {
    argumentName = '' + argument;
  }
  format = !argumentName ? '%(message)s': 'argument "%(argumentName)s": %(message)s';

  errMessage =  _.str.sprintf(format, {
    message: message,
    argumentName: argumentName
  });
  err = new TypeError(errMessage);
  err.code = ERR_CODE;
  return err;
};
