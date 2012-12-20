/** internal
 * class ActionContainer
 *
 * Action container. Parent for [[ArgumentParser]] and [[ArgumentGroup]]
 **/

'use strict';

var _ = require('underscore');
_.str = require('underscore.string');

// Constants
var $$ = require('./const');

//Actions
var ActionHelp = require('./action/help');
var ActionAppend = require('./action/append');
var ActionAppendConstant = require('./action/append/constant');
var ActionCount = require('./action/count');
var ActionStore = require('./action/store');
var ActionStoreConstant = require('./action/store/constant');
var ActionStoreTrue = require('./action/store/true');
var ActionStoreFalse = require('./action/store/false');
var ActionVersion = require('./action/version');
var ActionSubparsers = require('./action/subparsers');

// Errors
var argumentErrorHelper = require('./argument/error');



/**
 * new ActionContainer(options)
 *
 * Action container. Parent for [[ArgumentParser]] and [[ArgumentGroup]]
 *
 * ##### Options:
 *
 * - `description` -- A description of what the program does
 * - `prefixChars`  -- Characters that prefix optional arguments
 * - `argumentDefault`  -- The default value for all arguments
 **/
var ActionContainer = module.exports = function ActionContainer(options) {
  options = options || {};

  this.description = options.description;
  this.argumentDefault = options.argumentDefault;
  this.prefixChars = options.prefixChars || '';

  // ToDo conflict handler

  // set up registries
  this._registries = {};

  // register actions
  this.register('action', null, ActionStore);
  this.register('action', 'store', ActionStore);
  this.register('action', 'storeConst', ActionStoreConstant);
  this.register('action', 'storeTrue', ActionStoreTrue);
  this.register('action', 'storeFalse', ActionStoreFalse);
  this.register('action', 'append', ActionAppend);
  this.register('action', 'appendConst', ActionAppendConstant);
  this.register('action', 'count', ActionCount);
  this.register('action', 'help', ActionHelp);
  this.register('action', 'version', ActionVersion);
  this.register('action', 'parsers', ActionSubparsers);

  // action storage
  this._actions = [];
  this._optionStringActions = {};

  // groups
  this._actionGroups = [];

  // defaults storage
  this._defaults = {};

  // determines whether an "option" looks like a negative number
  this._regexpNegativeNumber = new RegExp('^-\\d+$|^-\\d*\\.\\d+$');

  // whether or not there are any optionals that look like negative
  // numbers -- uses a list so it can be shared and edited
  this._hasNegativeNumberOptionals = [];
};

// Groups must be required, then ActionContainer already defined
var ArgumentGroup = require('./argument/group');

//
// Registration methods
//

/**
 * ActionContainer#register(registryName, value, object) -> Void
 * - registryName (String) : object type action|type
 * - value (string) : keyword
 * - object (Object|Function) : handler
 *
 *  Register handlers
 **/
ActionContainer.prototype.register = function (registryName, value, object) {
  this._registries[registryName] = this._registries[registryName] || {};
  this._registries[registryName][value] = object;
};

ActionContainer.prototype._registryGet = function (registryName, value, defaultValue) {
  defaultValue = defaultValue || null;
  return this._registries[registryName][value] || defaultValue;
};

//
// Namespace default accessor methods
//

/**
 * ActionContainer#setDefaults(options) -> Void
 * - options (object):hash of options see [[Action.new]]
 *
 * Set defaults
 **/
ActionContainer.prototype.setDefaults = function (options) {
  options = options || {};
  for (var property in options) {
    this._defaults[property] = options[property];
  }

  // if these defaults match any existing arguments, replace the previous
  // default on the object with the new one
  this._actions.forEach(function (action) {
    if (action.dest in options) {
      action.defaultValue = options[action.dest];
    }
  });
};

/**
 * ActionContainer#getDefault(dest) -> Mixed
 * - dest (string): action destination
 *
 * Return action default value
 **/
ActionContainer.prototype.getDefault = function (dest) {
  this._actions.forEach(function (action) {
    if (action.dest === dest && !!action.defaultValue) {
      return action.defaultValue;
    }
  });
  return this._defaults[dest] || null;
};

//
// Adding argument actions
//

/**
 * ActionContainer#addArgument(args, options) -> Object
 * - args (Array): array of argument keys
 * - options (Object): action objects see [[Action.new]]
 *
 * #### Examples
 * - addArgument([-f, --foo], {action:'store', defaultValue=1, ...})
 * - addArgument(['bar'], action: 'store', nargs:1, ...})
 **/
ActionContainer.prototype.addArgument = function (args, options) {
  args = args;
  options = options || {};

  if (!_.isArray(args)) {
    throw new TypeError('addArgument first argument should be an array');
  }
  if (!_.isObject(options) || _.isArray(options)) {
    throw new TypeError('addArgument second argument should be a hash');
  }

  // if no positional args are supplied or only one is supplied and
  // it doesn't look like an option string, parse a positional argument
  if (!args || args.length === 1 && this.prefixChars.indexOf(args[0][0]) < 0) {
    if (args && !!options.dest) {
      throw new Error('dest supplied twice for positional argument');
    }
    options = this._getPositional(args, options);

    // otherwise, we're adding an optional argument
  } else {
    options = this._getOptional(args, options);
  }

  // if no default was supplied, use the parser-level default
  if (!options.defaultValue) {
    var dest = options.dest;
    if (!!this._defaults[dest]) {
      options.defaultValue = this._defaults[dest];
    } else if (!this.argumentDefault) {
      options.defaultValue = this.argumentDefault;
    }
  }

  // create the action object, and add it to the parser
  var ActionClass = this._popActionClass(options);
  if (! _.isFunction(ActionClass)) {
    throw new Error(_.str.sprintf(
          'Unknown action "%(action)s".',
          {action: ActionClass}
    ));
  }
  var action = new ActionClass(options);

  // throw an error if the action type is not callable
  var typeFunction = this._registryGet('type', action.type, action.type);
  if (!_.isFunction(typeFunction)) {
    throw new Error(_.str.sprintf(
          '"%(function)s" is not callable',
          {'function': typeFunction}
    ));
  }

  return this._addAction(action);
};

/**
 * ActionContainer#addArgumentGroup(options) -> ArgumentGroup
 * - options (Object): hash of options see [[ArgumentGroup.new]]
 *
 * Create new arguments groups
 **/
ActionContainer.prototype.addArgumentGroup = function (options) {
  var group = new ArgumentGroup(this, options);
  this._actionGroups.push(group);
  return group;
};

ActionContainer.prototype._addAction = function (action) {
  var self = this;

  // resolve any conflicts
  this._checkConflict(action);

  // add to actions list
  this._actions.push(action);
  action.container = this;

  // index the action by any option strings it has
  action.optionStrings.forEach(function (optionString) {
    self._optionStringActions[optionString] = action;
  });

  // set the flag if any option strings look like negative numbers
  action.optionStrings.forEach(function (optionString) {
    if (optionString.match(self._regexpNegativeNumber)) {
      if (!self._hasNegativeNumberOptionals) {
        self._hasNegativeNumberOptionals.push(true);
      }
    }
  });

  // return the created action
  return action;
};

ActionContainer.prototype._removeAction = function (action) {
  var actionIndex = this._actions.indexOf(action);
  if (actionIndex >= 0) {
    this._actions.splice(actionIndex);
  }
};

ActionContainer.prototype._addContainerActions = function (container) {
  // collect groups by titles
  var titleGroupMap = {};
  this._actionGroups.forEach(function (group) {
    if (titleGroupMap[group.title]) {
      throw new Error(_.str.sprintf('Cannot merge actions - two groups are named "%(group.title)s".', group));
    }
    titleGroupMap[group.title] = group;
  });

  // map each action to its group
  var groupMap = {};

  container._actionGroups.forEach(function (group) {
    // if a group with the title exists, use that, otherwise
    // create a new group matching the container's group
    if (!titleGroupMap[group.title]) {
      titleGroupMap[group.title] = this.addArgumentGroup({
        title: group.title,
        description: group.description
      });
    }

    // map the actions to their new group
    group._groupActions.forEach(function (action) {
      groupMap[action] = titleGroupMap[group.title];
    });
  });

  // add container's mutually exclusive groups
  // NOTE: if add_mutually_exclusive_group ever gains title= and
  // description= then this code will need to be expanded as above
  // ToDo mutually_exclusive_group


  // add all actions to this container or their group
  container._actions.forEach(function (action) {
    if (!!groupMap[action]) {
      groupMap[action]._addAction(action);
    }
    else
    {
      this._addAction(action);
    }
  });
};

ActionContainer.prototype._getPositional = function (dest, options) {
  if (_.isArray(dest)) {
    dest = _.first(dest);
  }
  // make sure required is not specified
  if (options.required) {
    throw new Error('"required" is an invalid argument for positionals.');
  }

  // mark positional arguments as required if at least one is
  // always required
  if (options.nargs !== $$.OPTIONAL && options.nargs !== $$.ZERO_OR_MORE) {
    options.required = true;
  }
  if (options.nargs === $$.ZERO_OR_MORE && options.defaultValue === undefined) {
    options.required = true;
  }

  // return the keyword arguments with no option strings
  options.dest = dest;
  options.optionStrings = [];
  return options;
};

ActionContainer.prototype._getOptional = function (args, options) {
  var prefixChars = this.prefixChars;
  var optionStrings = [];
  var optionStringsLong = [];

  // determine short and long option strings
  args.forEach(function (optionString) {
    // error on strings that don't start with an appropriate prefix
    if (prefixChars.indexOf(optionString[0]) < 0) {
      throw new Error(_.str.sprintf('Invalid option string "%(option)s": must start with a "%(prefix)s".', {
        option: optionString,
        prefix: prefixChars
      }));
    }

    // strings starting with two prefix characters are long options
    optionStrings.push(optionString);
    if (optionString.length > 1 && prefixChars.indexOf(optionString[1]) >= 0) {
      optionStringsLong.push(optionString);
    }
  });

  // infer dest, '--foo-bar' -> 'foo_bar' and '-x' -> 'x'
  var dest = options.dest || null;
  delete options.dest;
  
  if (!dest) {
    var optionStringDest = !!optionStringsLong ? optionStringsLong[0] :optionStrings[0];

    dest = _.str.strip(optionStringDest, this.prefixChars);

    if (dest.length === 0) {
      throw new Error(_.str.sprintf(
        'dest= is required for options like "%(option)s"',
        {option: optionStrings.join(', ')}
      ));
    }
    dest = dest.replace('-', '_');
  }

  // return the updated keyword arguments
  options.dest = dest;
  options.optionStrings = optionStrings;

  return options;
};

ActionContainer.prototype._popActionClass = function (options, defaultValue) {
  defaultValue = defaultValue || null;

  var action = (options.action || defaultValue);
  delete options.action;

  var actionClass = this._registryGet('action', action, action);
  return actionClass;
};

ActionContainer.prototype._checkConflict = function (action) {
  var optionStringActions = this._optionStringActions;
  var conflictOptionals = [];

  // find all options that conflict with this option
  action.optionStrings.forEach(function (optionString) {
    if (!!optionStringActions[optionString]) {
      conflictOptionals.push([optionString]);
    }
  });

  if (conflictOptionals.length > 0) {
    throw argumentErrorHelper(
      action,
      _.str.sprintf('Conflicting option string(s): %(conflict)s', {
        conflict: conflictOptionals.join(', ')
      })
    );
  }
};
