var ffi = require('./ffi');

// The clipboard is one of the few things that still uses global allocation
var kernel32 = new ffi.Library('kernel32', {
  GlobalSize:   ['ulong',   { hMem: 'ulong' }],
  GlobalLock:   ['pointer', { hMem: 'ulong' }],
  GlobalUnlock: ['int8',    { hMem: 'ulong' }],
  GlobalAlloc:  ['ulong',   { uFlags: 'uint', dwBytes: 'ulong' }],
});

var GMEM = {
  FIXED:    0x0000,
  MOVEABLE: 0x0002,
  ZEROINIT: 0x0040,
};



var user32 = new ffi.Library('user32', {
  OpenClipboard:                 ['int8',  { hWndNewOwner: 'ulong'}],
  CloseClipboard:                ['int8'],
  EmptyClipboard:                ['int8'],
  SetClipboardData:              ['ulong', { uFormat: 'uint', hMem: 'ulong' }],
  GetClipboardData:              ['ulong', { uFormat: 'uint' }],
  EnumClipboardFormats:          ['uint',  { format: 'uint' }],
  CountClipboardFormats:         ['int'],
  GetClipboardFormatNameA:       ['int',   { format: 'uint', lpszFormatName: 'pointer', cchMaxCount: 'int'}],
  RegisterClipboardFormatA:      ['uint',  { lpszFormat: 'string' }],
  //AddClipboardFormatListener:    ['int8',  { hwnd: 'ulong' }],
  //RemoveClipboardFormatListener: ['int8',  { hwnd: 'ulong' }],
  //SetClipboardViewer:            ['ulong', { hWndNewViewer: 'ulong' }],
  //ChangeClipboardChain:          ['int8',  { hWndRemove: 'ulong', hWndNewNext: 'ulong'}]
});


var CF = {
  TEXT            : 1,
  BITMAP          : 2,
  METAFILEPICT    : 3,
  SYLK            : 4,
  DIF             : 5,
  TIFF            : 6,
  OEMTEXT         : 7,
  DIB             : 8,
  PALETTE         : 9,
  PENDATA         : 10,
  RIFF            : 11,
  WAVE            : 12,
  UNICODETEXT     : 13,
  ENHMETAFILE     : 14,
  HDROP           : 15,
  LOCALE          : 16,
  DIBV5           : 17,
  MAX             : 18,
  OWNERDISPLAY    : 0x0080,
  DSPTEXT         : 0x0081,
  DSPBITMAP       : 0x0082,
  DSPMETAFILEPICT : 0x0083,
  DSPENHMETAFILE  : 0x008E,
  PRIVATEFIRST    : 0x0200,
  PRIVATELAST     : 0x02FF,
  GDIOBJFIRST     : 0x0300,
  GDIOBJLAST      : 0x03FF,
};

var CF_ = invert(CF);

/**
 * A wrapper class for dealing with these global handles the clipboard requires.
 * @param {HGLOBAL} handle   A global handle originating from a handful of win32 API calls
 */
function GlobalHandle(handle){
  if (!(this instanceof GlobalHandle)) return new GlobalHandle(handle);
  this._handle = handle;
}

/**
 * Allocate and set a completely new HGLOBAL
 * @param  {String|Buffer|number}  input   A string or Buffer which will be copied to the new global handle
 * @param  {Number}                input   OR a byte size which simlpy allocates the handle
 * @param  {GMEM}                  [flags] Flags to pass to GlobalAlloc. GMEM_MOVEABLE is default
 * @return {GlobalHandle}                  An instantiated GlobalHandle wrapping the new handle.
 */
GlobalHandle.create = function create(input, flags){
  var size;
  if (typeof input === 'string') {
    input += '\0';
    size = Buffer.byteLength(input, 'utf8');
  } else if (Buffer.isBuffer(input)) {
    size = input.length;
  } else if (Object(input) === input) {
    size = ffi.POINTER_SIZE;
  } else if (input > 0) {
    size = input;
    input = null;
  }
  if (!size) return null;
  var handle = new GlobalHandle(kernel32.GlobalAlloc(flags || GMEM.MOVEABLE, size));
  handle.size = size;
  if (input) {
    handle.write(input);
  }
  return handle;
}



GlobalHandle.prototype = {
  constructor: GlobalHandle,

  set _handle(v){ Object.defineProperty(this, '_handle', { value: v }) },

  get size(){ return this.size = kernel32.GlobalSize(this._handle) },
  set size(v){ Object.defineProperty(this, 'size', { value: v, enumerable: true }) },

  /**
   * Write data to where the handle's pointer points to
   * @param  {String|Buffer} input data to write
   */
  write: function write(input){
    var pointer = kernel32.GlobalLock(this._handle);
    var size = this.size;
    if (typeof input === 'string') {
      pointer.putCString(input);
    } else if (Buffer.isBuffer(input)) {
      for (var i=0; i < size; i++) {
        pointer.putInt8(input.readInt8(i), true);
      }
    } else if (Object(input) === input) {
      pointer.putObject(input);
    }
    kernel32.GlobalUnlock(this._handle);
  },

  /**
   * Copy the data from where the handle's pointer points. ffi.Pointer.toBuffer doesn't
   * work before we receive the size of the buffer via GlobalSize which ffi is unaware of.
   * @return {Buffer}
   */
  toBuffer: function toBuffer(){
    var size = this.size;
    var pointer = kernel32.GlobalLock(this._handle);
    var buffer = new Buffer(size);
    for (var i=0; i < size; i++) {
      buffer.writeInt8(pointer.getInt8(true), i);
    }
    kernel32.GlobalUnlock(this._handle);
    return buffer;
  },

  /**
   * Extract the data as a string using Pointer's getCString which reads until null termination
   * @return {String}
   */
  toString: function toString(){
    var string = kernel32.GlobalLock(this._handle).getCString();
    kernel32.GlobalUnlock(this._handle);
    return string;
  },

  toObject: function toObject(){
    if (!this.size) return null;
    var obj = kernel32.GlobalLock(this._handle).getObject();
    kernel32.GlobalUnlock(this._handle);
    return obj;
  }
};



var formats = {
  ascii: CF.TEXT,
  unicode: CF.UNICODETEXT,
  bitmap: CF.BITMAP,
  audio: CF.RIFF,
  symlink: CF.SYLK,
  dragdrop: CF.HDROP,
  locale: CF.LOCALE,
};

var formats_ = invert(formats);
formats_[CF.OEMTEXT] = 'ascii';


var refCount = 0;

var platform = module.exports = {
  /**
   * Open the clipboard only if it's no already open, and keep track of it so we can close it when done.
   */
  ref: function ref(){
    if (!refCount++) user32.OpenClipboard(0);
  },

  /**
   * Decrement references and close if no one's using it anymore
   * @return {[type]}
   */
  unref: function unref(){
    if (!--refCount) user32.CloseClipboard();
  },

  /**
   * Empty the clipboard
   */
  clear: function clear(){
    return user32.EmptyClipboard();
  },

  /**
   * Initialize an iterator for the formats currently available in the clipboard
   * @return {Array}  An array with a `method` that self fills and returns the
   *                  value each time its called, or null when depleted
   */
  formatIterator: function formatIterator(){
    var format = 0;
    var collected = [];
    collected.next = function(){
      format = user32.EnumClipboardFormats(format) || null;
      if (format) collected.push(format);
      else collected.next = function depleted(){};
      return format;
    }
    return collected;
  },

  addCustomFormat: function addCustomFormat(name){
    formats[name] = user32.RegisterClipboardFormatA(name);
    formats_[formats[name]] = name;
    return formats[name];
  },


  /**
   * Try to return the platform-neutral format name if possible
   * @param  {String|Number} format   Import format to look up which could be the platform neutral name, the
   *                                  platform specific name, or the integer value of the platform constant.
   * @return {String}
   */
  formatName: function formatName(format){
    if (format in formats_) return formats_[format];
    if (format in CF_) return CF_[format];
    if (format in formats || format in CF) return format;
    var out = new ffi.Pointer(ffi.POINTER_SIZE);
    user32.GetClipboardFormatNameA(format > 0 ? format : platform.formatHandle(format), out, 512);
    if (out = out.getCString()) platform.addCustomFormat(out);
    return out || null;
  },



  formatHandle: function formatHandle(format){
    if (format > 0) return platform.formatName(format) ? +format : null;
    if (format in formats) return +formats[format];
    if (format in CF) return CF[format];
    return null;
  },

  /**
   * Read a single format from the clipboard
   * @param  {String|Number} format Entry's format
   * @return {GlobalHandle}  Wrapper for the handle that knows how to get the data when asked
   */
  read: function read(format){
    return new GlobalHandle(user32.GetClipboardData(platform.formatHandle(format)));
  },

  /**
   * Write a single format to the clipboard
   @param  {String|Number}    format Entry's format
   * @param  {String|Buffer}   value New entry's data
   */
  write: function write(format, value){
    var handle = GlobalHandle.create(value);
    return user32.SetClipboardData(platform.formatHandle(format), handle._handle);
  },

  formats: CF_,
};


function invert(o){
  return Object.keys(o).reduce(function(r,s){
    r[o[s]] = s;
    return r;
  }, {});
}


function iterate(callback){
  var iterator = platform.formatIterator();
  var format;
  var ret = [];

  platform.ref();
  while (format = iterator.next()) {
    var builtin = platform.formats[format];
    ret.push(callback(format, platform.formatName(format), !builtin));
  }
  platform.unref();

  return ret;
}
