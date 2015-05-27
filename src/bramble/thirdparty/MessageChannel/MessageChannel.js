define(["thirdparty/MessageChannel/MessageChannel"], function(MessageChannel) {

  var nativeMessageChannel = !MessageChannel._shim;

  function postMsg(win, args) {
    if(nativeMessageChannel) {
        console.log('postMsg native', args);
        win.postMessage.apply(win, args);
    } else {
        args.unshift(win);
        console.log('postMsg shimmed', args);
        Window.postMessage.apply(Window, args);
    }
  }

  return {
    postMessage: postMsg
  };
});
