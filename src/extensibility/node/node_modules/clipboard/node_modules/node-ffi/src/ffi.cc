#include "ffi.h"

///////////////

void FFI::InitializeStaticFunctions(Handle<Object> target) {
  Local<Object> o = Object::New();

  // atoi and abs here for testing purposes
  o->Set(String::NewSymbol("atoi"), Pointer::WrapPointer((unsigned char *)atoi));
  // Windows has multiple `abs` signatures, so we need to manually disambiguate
  int (*absPtr)(int)(abs);
  o->Set(String::NewSymbol("abs"), Pointer::WrapPointer((unsigned char *)absPtr));

  // dl functions used by the DynamicLibrary JS class
  o->Set(String::NewSymbol("dlopen"), Pointer::WrapPointer((unsigned char *)dlopen));
  o->Set(String::NewSymbol("dlclose"), Pointer::WrapPointer((unsigned char *)dlclose));
  o->Set(String::NewSymbol("dlsym"), Pointer::WrapPointer((unsigned char *)dlsym));
  o->Set(String::NewSymbol("dlerror"), Pointer::WrapPointer((unsigned char *)dlerror));

  target->Set(String::NewSymbol("StaticFunctions"), o);
}

///////////////

void FFI::InitializeBindings(Handle<Object> target) {

  target->Set(String::NewSymbol("free"), FunctionTemplate::New(Free)->GetFunction());
  target->Set(String::NewSymbol("prepCif"), FunctionTemplate::New(FFIPrepCif)->GetFunction());
  target->Set(String::NewSymbol("strtoul"), FunctionTemplate::New(Strtoul)->GetFunction());
  target->Set(String::NewSymbol("POINTER_SIZE"), Integer::New(sizeof(unsigned char *)));
  target->Set(String::NewSymbol("FFI_TYPE_SIZE"), Integer::New(sizeof(ffi_type)));

  bool hasObjc = false;
#if __OBJC__ || __OBJC2__
  hasObjc = true;
#endif
  target->Set(String::NewSymbol("HAS_OBJC"), Boolean::New(hasObjc), static_cast<PropertyAttribute>(ReadOnly|DontDelete));

  Local<Object> smap = Object::New();
  smap->Set(String::NewSymbol("byte"),      Integer::New(sizeof(unsigned char)));
  smap->Set(String::NewSymbol("int8"),      Integer::New(sizeof(int8_t)));
  smap->Set(String::NewSymbol("uint8"),     Integer::New(sizeof(uint8_t)));
  smap->Set(String::NewSymbol("int16"),     Integer::New(sizeof(int16_t)));
  smap->Set(String::NewSymbol("uint16"),    Integer::New(sizeof(uint16_t)));
  smap->Set(String::NewSymbol("int32"),     Integer::New(sizeof(int32_t)));
  smap->Set(String::NewSymbol("uint32"),    Integer::New(sizeof(uint32_t)));
  smap->Set(String::NewSymbol("int64"),     Integer::New(sizeof(int64_t)));
  smap->Set(String::NewSymbol("uint64"),    Integer::New(sizeof(uint64_t)));
  smap->Set(String::NewSymbol("char"),      Integer::New(sizeof(char)));
  smap->Set(String::NewSymbol("uchar"),     Integer::New(sizeof(unsigned char)));
  smap->Set(String::NewSymbol("short"),     Integer::New(sizeof(short)));
  smap->Set(String::NewSymbol("ushort"),    Integer::New(sizeof(unsigned short)));
  smap->Set(String::NewSymbol("int"),       Integer::New(sizeof(int)));
  smap->Set(String::NewSymbol("uint"),      Integer::New(sizeof(unsigned int)));
  smap->Set(String::NewSymbol("long"),      Integer::New(sizeof(long)));
  smap->Set(String::NewSymbol("ulong"),     Integer::New(sizeof(unsigned long)));
  smap->Set(String::NewSymbol("longlong"),  Integer::New(sizeof(long long)));
  smap->Set(String::NewSymbol("ulonglong"), Integer::New(sizeof(unsigned long long)));
  smap->Set(String::NewSymbol("float"),     Integer::New(sizeof(float)));
  smap->Set(String::NewSymbol("double"),    Integer::New(sizeof(double)));
  smap->Set(String::NewSymbol("pointer"),   Integer::New(sizeof(unsigned char *)));
  smap->Set(String::NewSymbol("string"),    Integer::New(sizeof(char *)));
  smap->Set(String::NewSymbol("size_t"),    Integer::New(sizeof(size_t)));
  // Size of a Persistent handle to a JS object
  smap->Set(String::NewSymbol("Object"),    Integer::New(sizeof(Persistent<Object>)));

  Local<Object> ftmap = Object::New();
  ftmap->Set(String::NewSymbol("void"),     Pointer::WrapPointer((unsigned char *)&ffi_type_void));
  ftmap->Set(String::NewSymbol("byte"),     Pointer::WrapPointer((unsigned char *)&ffi_type_uint8));
  ftmap->Set(String::NewSymbol("int8"),     Pointer::WrapPointer((unsigned char *)&ffi_type_sint8));
  ftmap->Set(String::NewSymbol("uint8"),    Pointer::WrapPointer((unsigned char *)&ffi_type_uint8));
  ftmap->Set(String::NewSymbol("uint16"),   Pointer::WrapPointer((unsigned char *)&ffi_type_uint16));
  ftmap->Set(String::NewSymbol("int16"),    Pointer::WrapPointer((unsigned char *)&ffi_type_sint16));
  ftmap->Set(String::NewSymbol("uint32"),   Pointer::WrapPointer((unsigned char *)&ffi_type_uint32));
  ftmap->Set(String::NewSymbol("int32"),    Pointer::WrapPointer((unsigned char *)&ffi_type_sint32));
  ftmap->Set(String::NewSymbol("uint64"),   Pointer::WrapPointer((unsigned char *)&ffi_type_uint64));
  ftmap->Set(String::NewSymbol("int64"),    Pointer::WrapPointer((unsigned char *)&ffi_type_sint64));
  ftmap->Set(String::NewSymbol("uchar"),    Pointer::WrapPointer((unsigned char *)&ffi_type_uchar));
  ftmap->Set(String::NewSymbol("char"),     Pointer::WrapPointer((unsigned char *)&ffi_type_schar));
  ftmap->Set(String::NewSymbol("ushort"),   Pointer::WrapPointer((unsigned char *)&ffi_type_ushort));
  ftmap->Set(String::NewSymbol("short"),    Pointer::WrapPointer((unsigned char *)&ffi_type_sshort));
  ftmap->Set(String::NewSymbol("uint"),     Pointer::WrapPointer((unsigned char *)&ffi_type_uint));
  ftmap->Set(String::NewSymbol("int"),      Pointer::WrapPointer((unsigned char *)&ffi_type_sint));
  ftmap->Set(String::NewSymbol("float"),    Pointer::WrapPointer((unsigned char *)&ffi_type_float));
  ftmap->Set(String::NewSymbol("double"),   Pointer::WrapPointer((unsigned char *)&ffi_type_double));
  ftmap->Set(String::NewSymbol("pointer"),  Pointer::WrapPointer((unsigned char *)&ffi_type_pointer));
  ftmap->Set(String::NewSymbol("string"),   Pointer::WrapPointer((unsigned char *)&ffi_type_pointer));
  ftmap->Set(String::NewSymbol("size_t"),   Pointer::WrapPointer((unsigned char *)&ffi_type_pointer));

  // libffi is weird when it comes to long data types (defaults to 64-bit), so we emulate here, since
  // some platforms have 32-bit longs and some platforms have 64-bit longs.
  if (sizeof(long) == 4) {
    ftmap->Set(String::NewSymbol("ulong"),    Pointer::WrapPointer((unsigned char *)&ffi_type_uint32));
    ftmap->Set(String::NewSymbol("long"),     Pointer::WrapPointer((unsigned char *)&ffi_type_sint32));
  } else if (sizeof(long) == 8) {
    ftmap->Set(String::NewSymbol("ulong"),    Pointer::WrapPointer((unsigned char *)&ffi_type_uint64));
    ftmap->Set(String::NewSymbol("long"),     Pointer::WrapPointer((unsigned char *)&ffi_type_sint64));
  }

  // Let libffi handle "long long"
  ftmap->Set(String::NewSymbol("ulonglong"),Pointer::WrapPointer((unsigned char *)&ffi_type_ulong));
  ftmap->Set(String::NewSymbol("longlong"), Pointer::WrapPointer((unsigned char *)&ffi_type_slong));

  target->Set(String::NewSymbol("FFI_TYPES"), ftmap);
  target->Set(String::NewSymbol("TYPE_SIZE_MAP"), smap);
}

Handle<Value> FFI::Free(const Arguments &args) {
  HandleScope scope;

  Pointer *p = ObjectWrap::Unwrap<Pointer>(args[0]->ToObject());
  free(p->GetPointer());
  return Undefined();
}

/**
 * Hard-coded `stftoul` binding, for the benchmarks.
 */

Handle<Value> FFI::Strtoul(const Arguments &args) {
  HandleScope scope;

  Pointer *middle = ObjectWrap::Unwrap<Pointer>(args[1]->ToObject());
  char buf[128];
  args[0]->ToString()->WriteUtf8(buf);

  unsigned long val = strtoul(buf, (char **)middle->GetPointer(), args[2]->Int32Value());

  return scope.Close(Integer::NewFromUnsigned(val));
}

/**
 * Function that creates and returns an `ffi_cif` pointer from the given return
 * value type and argument types.
 */

Handle<Value> FFI::FFIPrepCif(const Arguments& args) {
  HandleScope scope;

  unsigned int nargs;
  Pointer *rtype, *atypes, *cif;
  ffi_status status;

  if (args.Length() != 3) {
    return THROW_ERROR_EXCEPTION("prepCif() requires 3 arguments!");
  }

  nargs = args[0]->Uint32Value();
  rtype = ObjectWrap::Unwrap<Pointer>(args[1]->ToObject());
  atypes = ObjectWrap::Unwrap<Pointer>(args[2]->ToObject());

  cif = new Pointer(NULL);
  cif->Alloc(sizeof(ffi_cif));

  status = ffi_prep_cif(
      (ffi_cif *)cif->GetPointer(),
      FFI_DEFAULT_ABI,
      nargs,
      (ffi_type *)rtype->GetPointer(),
      (ffi_type **)atypes->GetPointer());

  if (status != FFI_OK) {
    delete cif;
    return THROW_ERROR_EXCEPTION("ffi_prep_cif() returned error.");
  }

  return scope.Close(Pointer::WrapInstance(cif));
}

///////////////

extern "C" {
  static void init(Handle<Object> target) {
    HandleScope scope;

    Pointer::Initialize(target);
    FFI::InitializeBindings(target);
    FFI::InitializeStaticFunctions(target);
    CallbackInfo::Initialize(target);
    ForeignCaller::Initialize(target);
  }
  NODE_MODULE(ffi_bindings, init);
}
