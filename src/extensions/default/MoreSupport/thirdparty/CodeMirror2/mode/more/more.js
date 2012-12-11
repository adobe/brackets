/*
MORE mode - http://www.lesscss.org/
Ported to CodeMirror by Peter Kroon
Renamed to MORE by Dennis Kehrig
*/

CodeMirror.defineMode("more", function(config) {
  var indentUnit = config.indentUnit, type;
  function ret(style, tp) {type = tp; return style;}
  //html5 tags
  var tags = ["a","abbr","acronym","address","applet","area","article","aside","audio","b","base","basefont","bdi","bdo","big","blockquote","body","br","button","canvas","caption","cite","code","col","colgroup","command","datalist","dd","del","details","dfn","dir","div","dl","dt","em","embed","fieldset","figcaption","figure","font","footer","form","frame","frameset","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","iframe","img","input","ins","keygen","kbd","label","legend","li","link","map","mark","menu","meta","meter","nav","noframes","noscript","object","ol","optgroup","option","output","p","param","pre","progress","q","rp","rt","ruby","s","samp","script","section","select","small","source","span","strike","strong","style","sub","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","title","tr","track","tt","u","ul","var","video","wbr"];
  
  function inTagsArray(val){
	  for(var i=0; i<tags.length; i++){
		  if(val === tags[i]){
			  return true;
		  }
	  }
  }

  function tokenBase(stream, state) {
    var ch = stream.next();

	if (ch == "@") {stream.eatWhile(/[\w\-]/); return ret("meta", stream.current());}
    else if (ch == "/" && stream.eat("*")) {
      state.tokenize = tokenCComment;
      return tokenCComment(stream, state);
    }
    else if (ch == "<" && stream.eat("!")) {
      state.tokenize = tokenSGMLComment;
      return tokenSGMLComment(stream, state);
    }
    else if (ch == "=") ret(null, "compare");
    else if ((ch == "~" || ch == "|") && stream.eat("=")) return ret(null, "compare");
    else if (ch == "\"" || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }
	else if (ch == "/") { // lesscss e.g.: .png will not be parsed as a class
	  if(stream.eat("/")){
		state.tokenize = tokenSComment
      	return tokenSComment(stream, state);
	  }else{
	    stream.eatWhile(/[\a-zA-Z0-9\-_.\s]/);
		if(/\/|\)|#/.test(stream.peek() || stream.eol() || (stream.eatSpace() && stream.peek() == ")")))return ret("string", "string");//let url(/images/logo.png) without quotes return as string
        return ret("number", "unit");
	  }
    }
    else if (ch == "!") {
      stream.match(/^\s*\w*/);
      return ret("keyword", "important");
    }
    else if (/\d/.test(ch)) {
      stream.eatWhile(/[\w.%]/);
      return ret("number", "unit");
    }
    else if (/[,+<>*\/]/.test(ch)) {//removed . dot character original was [,.+>*\/]
      return ret(null, "select-op");
    }
    else if (/[;{}:\[\]()]/.test(ch)) { //added () char for lesscss original was [;{}:\[\]]
      if(ch == ":"){
		stream.eatWhile(/[active|hover|link|visited]/);
		if( stream.current().match(/active|hover|link|visited/)){
		  return ret("tag", "tag");
		}else{
		  return ret(null, ch);	
		}
	  }else{
  	    return ret(null, ch);
	  }
    }
	else if (ch == ".") { // lesscss
	  stream.eatWhile(/[\a-zA-Z0-9\-_]/);
      return ret("tag", "tag");
    }
	else if (ch == "#") { // lesscss
	  //we don't eat white-space, we want the hex color and or id only
	  stream.eatWhile(/[A-Za-z0-9]/);
	  //check if there is a proper hex color length e.g. #eee || #eeeEEE
	  if(stream.current().length ===4 || stream.current().length ===7){
		  if(stream.current().match(/[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}/,false) != null){//is there a valid hex color value present in the current stream
		  	//when not a valid hex value, parse as id
			if(stream.current().substring(1) != stream.current().match(/[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}/,false))return ret("atom", "tag");
			//eat white-space
			stream.eatSpace();
			//when hex value declaration doesn't end with [;,] but is does with a slash/cc comment treat it as an id, just like the other hex values that don't end with[;,]
			if( /[\/<>.(){!$%^&*_\-\\?=+\|#'~`]/.test(stream.peek()) )return ret("atom", "tag");
			//#time { color: #aaa }
			else if(stream.peek() == "}" )return ret("number", "unit");
			//we have a valid hex color value, parse as id whenever an element/class is defined after the hex(id) value e.g. #eee aaa || #eee .aaa
			else if( /[a-zA-Z\\]/.test(stream.peek()) )return ret("atom", "tag");
			//when a hex value is on the end of a line, parse as id
			else if(stream.eol())return ret("atom", "tag");
			//default
			else return ret("number", "unit");
		  }else{//when not a valid hexvalue in the current stream e.g. #footer
			stream.eatWhile(/[\w\\\-]/);
			return ret("atom", "tag"); 
		  }
	  }else{
		stream.eatWhile(/[\w\\\-]/);		
		return ret("atom", "tag");
	  }
    }
	else if (ch == "&") {
	  stream.eatWhile(/[\w\-]/);
	  return ret(null, ch);
	}
    else {
      stream.eatWhile(/[\w\\\-_%.{]/);
	  if(stream.current().match(/http|https/) != null){
		stream.eatWhile(/[\w\\\-_%.{:\/]/);
		return ret("string", "string");
	  }else if(stream.peek() == "<" || stream.peek() == ">"){
		return ret("tag", "tag");
	  }else if( stream.peek().match(/\(/) != null ){// lessc
		return ret(null, ch);
	  }else if (stream.peek() == "/" && state.stack[state.stack.length-1] != undefined){ // url(dir/center/image.png)
	  	return ret("string", "string");
	  }else if( stream.current().match(/\-\d|\-.\d/) ){ // lesscss match e.g.: -5px -0.4 etc... only colorize the minus sign
		//stream.backUp(stream.current().length-1); //commment out these 2 comment if you want the minus sign to be parsed as null -500px
	  	//return ret(null, ch);
		return ret("number", "unit");
	  }else if( inTagsArray(stream.current()) ){ // lesscss match html tags
	  	return ret("tag", "tag");
	  }else if( /\/|[\s\)]/.test(stream.peek() || stream.eol() || (stream.eatSpace() && stream.peek() == "/")) && stream.current().indexOf(".") !== -1){
		if(stream.current().substring(stream.current().length-1,stream.current().length) == "{"){
			stream.backUp(1);
			return ret("tag", "tag");
		}//end if
		if( (stream.eatSpace() && stream.peek().match(/[{<>.a-zA-Z]/) != null)  || stream.eol() )return ret("tag", "tag");//e.g. button.icon-plus
		return ret("string", "string");//let url(/images/logo.png) without quotes return as string
	  }else if( stream.eol() ){
		  if(stream.current().substring(stream.current().length-1,stream.current().length) == "{")stream.backUp(1);
		  return ret("tag", "tag");
	  }else{
      	return ret("variable", "variable");
	  }
    }
    
  }

  function tokenSComment(stream, state) {// SComment = Slash comment
    stream.skipToEnd();
	state.tokenize = tokenBase;
    return ret("comment", "comment");
  }
    
  function tokenCComment(stream, state) {
    var maybeEnd = false, ch;
    while ((ch = stream.next()) != null) {
      if (maybeEnd && ch == "/") {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return ret("comment", "comment");
  }

  function tokenSGMLComment(stream, state) {
    var dashes = 0, ch;
    while ((ch = stream.next()) != null) {
      if (dashes >= 2 && ch == ">") {
        state.tokenize = tokenBase;
        break;
      }
      dashes = (ch == "-") ? dashes + 1 : 0;
    }
    return ret("comment", "comment");
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped)
          break;
        escaped = !escaped && ch == "\\";
      }
      if (!escaped) state.tokenize = tokenBase;
      return ret("string", "string");
    };
  }

  return {
    startState: function(base) { 
      return {tokenize: tokenBase,
              baseIndent: base || 0,
              stack: []};
    },

    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);

      var context = state.stack[state.stack.length-1];
      if (type == "hash" && context == "rule") style = "atom";
      else if (style == "variable") {
        if (context == "rule") style = null; //"tag"
        else if (!context || context == "@media{"){ 
			style = stream.current() 	== "when" 	? "variable" 	: 
			stream.string.match(/#/g) 	!= undefined 	? null 		: 
			/[\s,|\s\)]/.test(stream.peek()) 		? "tag" 	: null;
		}
      }

      if (context == "rule" && /^[\{\};]$/.test(type))
        state.stack.pop();
      if (type == "{") {
        if (context == "@media") state.stack[state.stack.length-1] = "@media{";
        else state.stack.push("{");
      }
      else if (type == "}") state.stack.pop();
      else if (type == "@media") state.stack.push("@media");
      else if (context == "{" && type != "comment") state.stack.push("rule");
      return style;
    },

    indent: function(state, textAfter) {
      var n = state.stack.length;
      if (/^\}/.test(textAfter))
        n -= state.stack[state.stack.length-1] == "rule" ? 2 : 1;
      return state.baseIndent + n * indentUnit;
    },

    electricChars: "}"
  };
});

CodeMirror.defineMIME("text/x-more", "more");
if (!CodeMirror.mimeModes.hasOwnProperty("text/css"))
  CodeMirror.defineMIME("text/css", "more");
