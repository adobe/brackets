define(["bramble/thirdparty/MessageChannel/uuid.core"], function(UUID) {
  var root = window;

  var self = root,
      Window = self.Window,
      usePoly = false,
      a_slice = [].slice;

  function isFunction(functionToCheck) {
    return functionToCheck && Object.prototype.toString.call(functionToCheck) === '[object Function]';
  }

  function isInWorker() {
    return  typeof Worker === 'undefined' && typeof Window === 'undefined';
  }

  if( usePoly || !self.MessageChannel ) {

    var isWindowToWindowMessage = function( currentTarget ) {
          return typeof window !== "undefined" && self instanceof Window && ( !isFunction(self.Worker) || !(currentTarget instanceof Worker) );
        },
        log = function( message ) {
          if (MessageChannel.verbose) {
            var args = a_slice.apply(arguments);
            args.unshift("MCNP: ");
            console.log.apply(console, args);
          }
        },
        messagePorts = {};

    var MessagePort = self.MessagePort = function( uuid ) {
      this._entangledPortUuid = null;
      this.destinationUrl = null;
      this._listeners = {};
      this._messageQueue = [];
      this._messageQueueEnabled = false;
      this._currentTarget = null;

      this.uuid = uuid || UUID.generate();
      messagePorts[this.uuid] = this;
      this.log("created");
    };

    MessagePort.prototype = {
      start: function() {
        var event,
            self = this;

        // TODO: we have no guarantee that
        // we will not receive and process events in the correct order
        setTimeout( function() {
          self.log('draining ' + self._messageQueue.length + ' queued messages');
          while( self._messageQueueEnabled && (event = self._messageQueue.shift()) ) {
            self.dispatchEvent( event );
          }
        });
        this._messageQueueEnabled = true;
        this.log('started');
      },

      close: function() {
        this._messageQueueEnabled = false;
        if( this._entangledPortUuid ) {
          this._getEntangledPort()._entangledPortUuid = null;
          this._entangledPortUuid = null;

          // /!\ Probably need to send that (?)
        }
      },

      postMessage: function( message ) {
        // Numbers refer to step from the W3C specs. It shows how simplified things are
        // 1- Let target port be the port with which source port is entangled, if any
        var target = this._getEntangledPort(),
            currentTarget = this._currentTarget,
            messageClone;


        // 8- If there is no target port (i.e. if source port is not entangled), then abort these steps.
        if(!target) {
          this.log("not entangled, discarding message", message);
          return;
        }

        // 12- Add the event to the port message queue of target port.
        // As the port is cloned when sent to the other user agent,
        // posting a message can mean different things:
        // * The port is still local, then we need to queue the event
        // * the port has been sent, then we need to send that event
        if( currentTarget ) {
          // 5- Let message clone be the result of obtaining a structured clone of the message argument
          messageClone = MessageChannel.encodeEvent( message, [target], true );

          if( isWindowToWindowMessage( currentTarget ) ) {
            this.log("posting message from window to window", message, this.destinationUrl);
            currentTarget.postMessage(messageClone, this.destinationUrl);
          } else {
            this.log("posting message from or to worker", message);
            currentTarget.postMessage(messageClone);
          }
        } else {
          this.log("not connected, queueing message", message);
          target._enqueueEvent(MessageChannel._messageEvent(message, [target], true));
        }
      },

      addEventListener: function( type, listener ) {
        if (typeof this._listeners[type] === "undefined"){
          this._listeners[type] = [];
        }

        this._listeners[type].push( listener );
      },

      removeEventListener: function( type, listener) {
        if (this._listeners[type] instanceof Array){
          var listeners = this._listeners[type];
          for (var i=0; i < listeners.length; i++){
            if (listeners[i] === listener){
              listeners.splice(i, 1);
              break;
            }
          }
        }
      },

      dispatchEvent: function( event ) {
        var listeners = this._listeners.message;
        if( listeners ) {
          for (var i=0; i < listeners.length; i++){
            listeners[i].call(this, event);
          }
        }
      },

      _enqueueEvent: function( event ) {
        if(this._messageQueueEnabled) {
          this.dispatchEvent( event );
        } else {
          this._messageQueue.push( event );
        }
      },

      _getPort: function( portClone, messageEvent, copyEvents ) {
        var loadPort = function(uuid) {
          var port = messagePorts[uuid] || MessageChannel._createPort(uuid);
          return port;
        };

        var port = loadPort(portClone.uuid);
        port._entangledPortUuid = portClone._entangledPortUuid;
        port._getEntangledPort()._entangledPortUuid = port.uuid;
        port._currentTarget =  messageEvent.source || messageEvent.currentTarget || self;
        if( messageEvent.origin === "null" ) {
          port.destinationUrl = "*";
        } else {
          port.destinationUrl = messageEvent.origin;
        }

        if( copyEvents ) {
          for( var i=0 ; i < portClone._messageQueue.length ; i++ ) {
            port._messageQueue.push( portClone._messageQueue[i] );
          }
        }

        return port;
      },

      _getEntangledPort: function() {
        if( this._entangledPortUuid ) {
          return messagePorts[ this._entangledPortUuid ] || MessageChannel._createPort(this._entangledPortUuid);
        } else {
          return null;
        }
      },

      log: function () {
        if (MessageChannel.verbose) {
          var args = a_slice.apply(arguments);
          args.unshift("Port", this.uuid);
          log.apply(null, args);
        }
      }
    };

    var MessageChannel = self.MessageChannel = function () {
      var port1 = MessageChannel._createPort(),
          port2 = MessageChannel._createPort(),
          channel;

      port1._entangledPortUuid = port2.uuid;
      port2._entangledPortUuid = port1.uuid;

      channel = {
        port1: port1,
        port2: port2
      };

      MessageChannel.log(channel, "created");

      return channel;
    };

    // Helper to determine if this is a shim or native
    MessageChannel._shim = true;

    MessageChannel.log = function (_channel) {
      if (MessageChannel.verbose) {
        var args = ["Chnl"],
            msgArgs = a_slice.call(arguments, 1);

        if (_channel.port1 && _channel.port2) {
          args.push(_channel.port1.uuid, _channel.port2.uuid);
        } else {
          _channel.forEach( function(channel) {
            args.push(channel._entangledPortUuid);
          });
        }

        args.push.apply(args, msgArgs);
        log.apply(null, args);
      }
    };

    MessageChannel._createPort = function() {
      var args = arguments,
          MessagePortConstructor = function() {
            return MessagePort.apply(this, args);
          };

      MessagePortConstructor.prototype = MessagePort.prototype;

      return new MessagePortConstructor();
    };

    /**
        Encode the event to be sent.

        It contains:
        * data: the content that the MessagePort should send
        * ports: The targeted MessagePorts.
        * messageChannel: this allows to decide if the MessageEvent was meant for the window or the port

        @param {Object} data
        @param {Array} ports
        @param {Boolean} messageChannel
        @returns {String} a string representation of the data to be sent
    */
    MessageChannel.encodeEvent = function( data, ports, messageChannel ) {
      var strippedPorts = new Array(ports.length),
          encodedMessage, messageEvent;

      for (var i = 0; i < ports.length; ++i) {
        strippedPorts[i] = MessageChannel._strippedPort(ports[i]);
      }

      messageEvent = { event: MessageChannel._messageEvent(data, strippedPorts, messageChannel) };
      return messageEvent;
    };

    MessageChannel._messageEvent = function(data, ports, messageChannel) {
      return  { data: data, ports: ports, messageChannel: messageChannel};
    };

    MessageChannel._strippedPort = function (port) {
      if (!port) { return; }

      var messageQueue = [];
      for (var msg, msgPorts, ports, i = 0; i < port._messageQueue.length; ++i) {
        msg = port._messageQueue[i];
        msgPorts = msg.ports || [];
        ports = [];

        for (var portRef, j = 0; j < msgPorts.length; ++j) {
          portRef = msgPorts[j];
          ports.push({
            uuid: portRef.uuid,
            _entangledPortUuid: portRef._entangledPortUuid
          });
        }
        messageQueue.push({
          data: msg.data,
          messageChannel: msg.messageChannel,
          ports: ports
        });
      }

      return {
        uuid: port.uuid,
        _entangledPortUuid: port._entangledPortUuid,
        _messageQueue: messageQueue
      };
    };

    /**
        Extract the event from the message.

        It contains:
        * data: the content that the MessagePort should use
        * ports: The targeted MessagePorts.
        * messageChannel: this allows to decide if the MessageEvent was meant for the window or the port

        @param {MessageEvent} messageEvent
        @param {Boolean} copyEvents: copy or not the events from the cloned port to the local one
        @returns {Object} an object that fakes an event with limited attributes ( data, ports )
    */
    MessageChannel.decodeEvent = function( messageEvent, copyEvents ) {
      var fakeEvent = {
            data: null,
            ports: []
          },
          data, event, ports;

      data = messageEvent.data;
      event = data && data.event;

      if( event ) {
        ports = event.ports;
        if( ports ) {
          for(var i=0; i< ports.length ; i++) {
            fakeEvent.ports.push( MessagePort.prototype._getPort( ports[i], messageEvent, copyEvents ) );
          }
        }
        fakeEvent.data = event.data;
        fakeEvent.source = messageEvent.source;
        fakeEvent.messageChannel = event.messageChannel;
      } else {
        return messageEvent;
      }

      return fakeEvent;
    };

    /**
        Extract the event from the message if possible.

        @param {MessageEvent} messageEvent
        @param {Boolean} copyEvents: copy or not the events from the cloned port to the local one
        @returns {Object} an object that fakes an event or the triggered event
    */
    var decodeEvent = function( event, copyEvents ) {
      var messageEvent;

      try {
        messageEvent = MessageChannel.decodeEvent( event, copyEvents );
      } catch( e ) {
        if( e instanceof SyntaxError ) {
          messageEvent = event;
        } else {
          throw e;
        }
      }

      return messageEvent;
    };

    var propagationHandler = function( event ) {
      var messageEvent = decodeEvent( event, true );

      if( messageEvent.messageChannel ) {
        MessageChannel.propagateEvent( messageEvent );
      }
    };

    // Add the default message event handler
    // This is useful so that a user agent can pass ports
    // without declaring any event handler.
    //
    // This handler takes care of copying the events queue passed with a port.
    // We only need to perform this when passing a port between user agents,
    // otherwise the event is passed through `postMessage` and not through the queue
    // and is handled by the port's message listener.
    //
    // Ex:
    //    iFrame1 - iFrame2 - iFrame3
    //    iFrame2 creates a MessageChannel and passes a port to each iframe
    //    we need a default handler to receive MessagePorts' events
    //    and to propagate them
    var _addMessagePortEventHandler = function( target ) {
      if( target.addEventListener ) {
        target.addEventListener( 'message', propagationHandler, false );
      } else if( target.attachEvent ) {
        target.attachEvent( 'onmessage', propagationHandler );
      }
    };

    var _overrideMessageEventListener = function( target ) {
      var originalAddEventListener, addEventListenerName,
          targetRemoveEventListener, removeEventListenerName,
          messageEventType,
          messageHandlers = [];

      if( target.addEventListener ) {
        addEventListenerName = 'addEventListener';
        removeEventListenerName = 'removeEventListener';
        messageEventType = 'message';
      } else if( target.attachEvent ) {
        addEventListenerName = 'attachEvent';
        removeEventListenerName = 'detachEvent';
        messageEventType = 'onmessage';
      }
      originalAddEventListener = target[addEventListenerName];
      targetRemoveEventListener = target[removeEventListenerName];

      target[addEventListenerName] = function() {
        var args = Array.prototype.slice.call( arguments ),
            originalHandler = args[1],
            self = this,
            messageHandlerWrapper;

        if( args[0] === messageEventType ) {
          messageHandlerWrapper = function( event ) {
            var messageEvent = decodeEvent( event );

            if( ! messageEvent.messageChannel ) {
              originalHandler.call( self, messageEvent );
            }
          };
          originalHandler.messageHandlerWrapper = messageHandlerWrapper;

          args[1] = messageHandlerWrapper;
        }

        originalAddEventListener.apply( this, args );
      };

      target[removeEventListenerName] = function() {
        var args = Array.prototype.slice.call( arguments ),
            originalHandler = args[1];

        if( args[0] === messageEventType ) {
          args[1] = originalHandler.messageHandlerWrapper;
          delete originalHandler.messageHandlerWrapper;
        }

        if( args[1] ) {
          targetRemoveEventListener.apply( this, args );
        }
      };
    };


    /**
        Send the event to the targeted ports

        It uses the `messageChannel` attribute to decide
        if the event is meant for the window or MessagePorts

        @param {Object} fakeEvent
    */
    MessageChannel.propagateEvent = function( fakeEvent ) {
      var ports, port, entangledPort;

      if( fakeEvent.messageChannel ) {
        ports = fakeEvent.ports;

        for( var i=0 ; i<ports.length ; i++) {
          port = ports[i];
          entangledPort = port._getEntangledPort();

          if( port._currentTarget && entangledPort._currentTarget ) {
            entangledPort.postMessage( fakeEvent.data );
          } else {
            port._enqueueEvent( fakeEvent );
          }
        }
      }
    };

    MessageChannel.reset = function() {
      messagePorts = {};
    };

    //
    _addMessagePortEventHandler( self );

    /**
        Send the MessagePorts to the other window

        `window.postMessage` doesn't accept fake ports so we have to encode them
        and pass them in the message.

        @param {Object} otherWindow: A reference to another window.
        @param {Object} message: Data to be sent to the other window.
        @param {String} targetOrigin: Specifies what the origin of otherWindow must be for the event to be dispatched.
        @param {Array} ports: MessagePorts that need to be sent to otherWindow.
    */
    if( Window ) {
      MessageChannel.Window = Window;
      Window.postMessage = function( otherWindow, message, targetOrigin, ports ) {
        var data, entangledPort;

        // Internet Explorer requires the `ports` parameter
        ports = ports || [];

        data = MessageChannel.encodeEvent( message, ports, false );

        if( ports ) {
          // We need to know if a port has been sent to another user agent
          // to decide when to queue and when to send messages
          // See `MessageChannel.propagateEvent`
          for( var i=0 ; i<ports.length ; i++) {
            entangledPort = ports[i]._getEntangledPort();
            if( !entangledPort._currentTarget ) {
              entangledPort._currentTarget = otherWindow;
              entangledPort.destinationUrl = targetOrigin;
            }
          }
        }

        MessageChannel.log(ports, "handshake window", otherWindow);
        otherWindow.postMessage(data, targetOrigin);
      };

      // Juggling to find where to override `addEventListener`
      // Firefox 30.0a1 (2014-02-17) adds `addEventListener` on the global object
      // Internet Explorer doesn't allow to override `window.attachEvent`
      var target;
      if( window.addEventListener ) {
        target = window;
      } else if( window.attachEvent ) {
        target = Window.prototype;
      } else {
        throw "We couldn't find a method to attach an event handler.";
      }

      _overrideMessageEventListener( target );
    } else {
      //Worker
      _overrideMessageEventListener( self );
    }

    if( self.Worker ) {
      var OriginalWorker = Worker,
          originalAddEventListener;

      if( OriginalWorker.prototype.addEventListener ) {
        originalAddEventListener = OriginalWorker.prototype.addEventListener;
      } else if( OriginalWorker.prototype.attachEvent ) {
        originalAddEventListener = OriginalWorker.prototype.attachEvent;
      }

      self.Worker = function() {
        var worker = new OriginalWorker(arguments[0]),
            _addEventListener = originalAddEventListener;

        _addEventListener.call(worker, 'message', propagationHandler);

        return worker;
      };
      Worker.prototype = OriginalWorker.prototype;

      _overrideMessageEventListener( Worker.prototype );

    } else if (isInWorker()) {
      self.Worker = { };
    }

    if (self.Worker) {
      self.Worker.postMessage = function( worker, message, transferList )  {
        var data = MessageChannel.encodeEvent( message, transferList, false ),
            entangledPort;

        for( var i=0 ; i<transferList.length ; i++) {
          entangledPort = transferList[i]._getEntangledPort();
          entangledPort._currentTarget = worker;
        }

        MessageChannel.log(transferList, "handshake worker", worker);
        worker.postMessage( data );
      };
    }
  } else {
    if( Window ) {
      Window.postMessage = function( source, message, targetOrigin, ports ) {
        // Internet Explorer requires the `ports` parameter
        ports = ports || [];
        source.postMessage( message, targetOrigin, ports );
      };
    } else {
      // Web worker
      self.Worker = {
        postMessage: function( worker, message, transferList ) {
          worker.postMessage( message, transferList );
        }
      };
    }

    if( self.Worker ) {
      self.Worker.postMessage = function( worker, message, transferList )  {
        worker.postMessage( message, transferList);
      };
    }
  }

  return MessageChannel;
});
