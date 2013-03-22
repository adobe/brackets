#include "ffi.h"
#include <node_buffer.h>

Pointer::Pointer(unsigned char *ptr) {
  this->origPtr = ptr;
  this->m_ptr = ptr;
  this->m_allocated = 0;
  this->doFree = false;
  //fprintf(stderr, "Creating new Pointer %p\n", this->m_ptr);
}

Pointer::~Pointer() {
  if (this->doFree) {
    //fprintf(stderr, "Pointer destructor called on ALLOCATED area: %p\n", this->m_ptr);
    free(this->origPtr);
  }
}

Persistent<FunctionTemplate> Pointer::pointer_template;

Handle<FunctionTemplate> Pointer::MakeTemplate() {
  HandleScope scope;
  Handle<FunctionTemplate> t = FunctionTemplate::New(New);
  t->SetClassName(String::NewSymbol("Pointer"));

  Local<ObjectTemplate> inst = t->InstanceTemplate();
  inst->SetInternalFieldCount(1);
  inst->SetAccessor(String::NewSymbol("address"), GetAddress);
  inst->SetAccessor(String::NewSymbol("allocated"), GetAllocated);
  inst->SetAccessor(String::NewSymbol("free"), GetFree, SetFree);

  return scope.Close(t);
}

void Pointer::Initialize(Handle<Object> target) {
  HandleScope scope;

  if (pointer_template.IsEmpty()) {
    pointer_template = Persistent<FunctionTemplate>::New(MakeTemplate());
  }

  Handle<FunctionTemplate> t = pointer_template;

  NODE_SET_PROTOTYPE_METHOD(t, "seek", Seek);
  NODE_SET_PROTOTYPE_METHOD(t, "putUInt8", PutUInt8);
  NODE_SET_PROTOTYPE_METHOD(t, "getUInt8", GetUInt8);
  NODE_SET_PROTOTYPE_METHOD(t, "putInt8", PutInt8);
  NODE_SET_PROTOTYPE_METHOD(t, "getInt8", GetInt8);
  NODE_SET_PROTOTYPE_METHOD(t, "putInt16", PutInt16);
  NODE_SET_PROTOTYPE_METHOD(t, "getInt16", GetInt16);
  NODE_SET_PROTOTYPE_METHOD(t, "putUInt16", PutUInt16);
  NODE_SET_PROTOTYPE_METHOD(t, "getUInt16", GetUInt16);
  NODE_SET_PROTOTYPE_METHOD(t, "putInt32", PutInt32);
  NODE_SET_PROTOTYPE_METHOD(t, "getInt32", GetInt32);
  NODE_SET_PROTOTYPE_METHOD(t, "putUInt32", PutUInt32);
  NODE_SET_PROTOTYPE_METHOD(t, "getUInt32", GetUInt32);
  NODE_SET_PROTOTYPE_METHOD(t, "putInt64", PutInt64);
  NODE_SET_PROTOTYPE_METHOD(t, "getInt64", GetInt64);
  NODE_SET_PROTOTYPE_METHOD(t, "putUInt64", PutUInt64);
  NODE_SET_PROTOTYPE_METHOD(t, "getUInt64", GetUInt64);
  NODE_SET_PROTOTYPE_METHOD(t, "putFloat", PutFloat);
  NODE_SET_PROTOTYPE_METHOD(t, "getFloat", GetFloat);
  NODE_SET_PROTOTYPE_METHOD(t, "putDouble", PutDouble);
  NODE_SET_PROTOTYPE_METHOD(t, "getDouble", GetDouble);
  NODE_SET_PROTOTYPE_METHOD(t, "_putPointer", PutPointerMethod);
  NODE_SET_PROTOTYPE_METHOD(t, "getPointer", GetPointerMethod);
  NODE_SET_PROTOTYPE_METHOD(t, "getObject", GetObject);
  NODE_SET_PROTOTYPE_METHOD(t, "putObject", PutObject);
  NODE_SET_PROTOTYPE_METHOD(t, "putCString", PutCString);
  NODE_SET_PROTOTYPE_METHOD(t, "getCString", GetCString);
  NODE_SET_PROTOTYPE_METHOD(t, "isNull", IsNull);
  NODE_SET_PROTOTYPE_METHOD(t, "toBuffer", ToBuffer);

  target->Set(String::NewSymbol("Pointer"), t->GetFunction());
}

unsigned char *Pointer::GetPointer() {
  return this->m_ptr;
}

void Pointer::MovePointer(int bytes) {
  this->m_ptr += bytes;
}

Handle<Value> Pointer::Alloc(size_t bytes) {
  if (!this->m_allocated && bytes > 0) {
    this->m_ptr = (unsigned char *)malloc(bytes);
    this->origPtr = this->m_ptr;
    //fprintf(stderr, "malloc()'d %p\n", this->m_ptr);

    if (this->m_ptr != NULL) {
      this->m_allocated = bytes;

      // Any allocated Pointer gets free'd by default
      // This can be changed in JS-land with `free`
      this->doFree = true;
    } else {
      return THROW_ERROR_EXCEPTION("malloc(): Could not allocate Memory");
    }
  }
  return Undefined();
}

/**
 * Sentinel Object used to determine when Pointer::New() is being called from
 * JS-land or from within a Pointer::WrapInstance() call.
 */

static Persistent<Value> SENTINEL = Persistent<Object>::New(Object::New());
static Persistent<Value> WRAP_ARGS[] = { SENTINEL };

Handle<Object> Pointer::WrapInstance(Pointer *inst) {
  HandleScope scope;

  Local<Object> obj = pointer_template->GetFunction()->NewInstance(1, WRAP_ARGS);
  inst->Wrap(obj);
  return scope.Close(obj);
}

Handle<Object> Pointer::WrapPointer(unsigned char *ptr) {
  return WrapInstance(new Pointer(ptr));
}

Handle<Value> Pointer::New(const Arguments& args) {
  HandleScope scope;

  int argc = args.Length();

  if (argc < 1) {
    return THROW_ERROR_EXCEPTION("new Pointer() requires at least 1 argument");
  }

  Handle<Value> arg0 = args[0];
  if (!arg0->StrictEquals(SENTINEL)) {
    Pointer *self = new Pointer(NULL);
    unsigned int sz = arg0->Uint32Value();
    self->Alloc(sz);

    if (argc >= 2) {
      // Second argument specifies whether or not to call `free()` on the
      // allocated buffer when this Pointer gets garbage collected
      self->doFree = args[1]->BooleanValue();
    }
    self->Wrap(args.This());
  }

  return scope.Close(args.This());
}

Handle<Value> Pointer::GetAddress(Local<String> name, const AccessorInfo& info) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(info.Holder());
  Handle<Value>   ret;

  ret = Number::New((size_t)self->GetPointer());

  return scope.Close(ret);
}

Handle<Value> Pointer::GetAllocated(Local<String> name, const AccessorInfo& info) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(info.Holder());
  Handle<Value>   ret = Integer::New(self->m_allocated);
  return scope.Close(ret);
}

Handle<Value> Pointer::GetFree(Local<String> name, const AccessorInfo& info) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(info.Holder());
  Handle<Value>   ret = Boolean::New(self->doFree);
  return scope.Close(ret);
}

void Pointer::SetFree(Local<String> property, Local<Value> value, const AccessorInfo &info) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(info.Holder());
  Handle<Boolean> val = value->ToBoolean();
  self->doFree = val->BooleanValue();
}


Handle<Value> Pointer::Seek(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  Handle<Value>   ret;

  if (args.Length() > 0 && args[0]->IsNumber()) {
    size_t offset = args[0]->IntegerValue();
    ret = WrapPointer(static_cast<unsigned char *>(self->GetPointer()) + offset);
  }
  else {
    return THROW_ERROR_EXCEPTION("Must specify an offset");
  }

  return scope.Close(ret);
}

Handle<Value> Pointer::PutUInt8(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();

  if (args.Length() >= 1 && args[0]->IsNumber()) {
    int64_t val = args[0]->IntegerValue();

    if (val >= UINT8_MIN && val <= UINT8_MAX) {
      uint8_t cvt = (uint8_t)val;
      memcpy(ptr, &cvt, sizeof(uint8_t));
    }
    else {
      return THROW_ERROR_EXCEPTION("Value out of Range.");
    }
  }
  if (args.Length() == 2 && args[1]->IsBoolean() && args[1]->BooleanValue()) {
    self->MovePointer(sizeof(uint8_t));
  }

  return Undefined();
}

Handle<Value> Pointer::GetUInt8(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();

  if (args.Length() == 1 && args[0]->IsBoolean() && args[0]->BooleanValue()) {
    self->MovePointer(sizeof(uint8_t));
  }

  return scope.Close(Integer::New(*ptr));
}

Handle<Value> Pointer::PutInt8(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();

  if (args.Length() >= 1 && args[0]->IsNumber()) {
    int64_t val = args[0]->IntegerValue();

    if (val >= INT8_MIN && val <= INT8_MAX) {
      int8_t cvt = (int8_t)val;
      memcpy(ptr, &cvt, sizeof(int8_t));
    }
    else {
      return THROW_ERROR_EXCEPTION("Value out of Range.");
    }
  }
  if (args.Length() == 2 && args[1]->IsBoolean() && args[1]->BooleanValue()) {
    self->MovePointer(sizeof(int8_t));
  }

  return Undefined();
}

Handle<Value> Pointer::GetInt8(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr  = self->GetPointer();
  int8_t          val   = *((int8_t *)ptr);

  if (args.Length() == 1 && args[0]->IsBoolean() && args[0]->BooleanValue()) {
    self->MovePointer(sizeof(int8_t));
  }

  return scope.Close(Integer::New(val));
}


Handle<Value> Pointer::PutInt16(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();

  // TODO: Exception handling here for out of range values
  if (args.Length() >= 1 && args[0]->IsNumber()) {
    int64_t val = args[0]->IntegerValue();

    if (val >= INT16_MIN && val <= INT16_MAX) {
      int16_t cvt = (int16_t)val;
      memcpy(ptr, &cvt, sizeof(int16_t));
    }
    else {
      return THROW_ERROR_EXCEPTION("Value out of Range.");
    }
  }
  if (args.Length() == 2 && args[1]->IsBoolean() && args[1]->BooleanValue()) {
    self->MovePointer(sizeof(int16_t));
  }

  return Undefined();
}

Handle<Value> Pointer::GetInt16(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();
  int16_t          val = *((int16_t *)ptr);

  if (args.Length() == 1 && args[0]->IsBoolean() && args[0]->BooleanValue()) {
    self->MovePointer(sizeof(int16_t));
  }

  return scope.Close(Integer::New(val));
}

Handle<Value> Pointer::PutUInt16(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();

  // TODO: Exception handling here for out of range values
  if (args.Length() >= 1 && args[0]->IsNumber()) {
    int64_t val = args[0]->IntegerValue();

    if (val >= UINT16_MIN && val <= UINT16_MAX) {
      uint16_t cvt = (uint16_t)val;
      memcpy(ptr, &cvt, sizeof(uint16_t));
    }
    else {
      return THROW_ERROR_EXCEPTION("Value out of Range.");
    }
  }
  if (args.Length() == 2 && args[1]->IsBoolean() && args[1]->BooleanValue()) {
    self->MovePointer(sizeof(uint16_t));
  }

  return Undefined();
}

Handle<Value> Pointer::GetUInt16(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();
  unsigned short  val = *((uint16_t *)ptr);

  if (args.Length() == 1 && args[0]->IsBoolean() && args[0]->BooleanValue()) {
    self->MovePointer(sizeof(uint16_t));
  }

  return scope.Close(Integer::New(val));
}

Handle<Value> Pointer::PutInt32(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();

  if (args.Length() >= 1 && args[0]->IsNumber()) {
    int64_t val = args[0]->IntegerValue();

    if (val >= INT32_MIN && val <= INT32_MAX) { // XXX: Will this ever be false?
      memcpy(ptr, &val, sizeof(int32_t));
    }
    else {
      return THROW_ERROR_EXCEPTION("Value out of Range.");
    }
  }
  if (args.Length() == 2 && args[1]->IsBoolean() && args[1]->BooleanValue()) {
    self->MovePointer(sizeof(int32_t));
  }

  return Undefined();
}

Handle<Value> Pointer::GetInt32(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();
  int32_t         val = *((int32_t *)ptr);

  if (args.Length() == 1 && args[0]->IsBoolean() && args[0]->BooleanValue()) {
    self->MovePointer(sizeof(int32_t));
  }

  return scope.Close(Integer::New(val));
}

Handle<Value> Pointer::PutUInt32(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();

  if (args.Length() >= 1 && args[0]->IsNumber()) {
    int64_t val = args[0]->IntegerValue();

    if (val >= UINT32_MIN && val <= UINT32_MAX) { // XXX: Will this ever be false?
      memcpy(ptr, &val, sizeof(uint32_t));
    }
    else {
      return THROW_ERROR_EXCEPTION("Value out of Range.");
    }
  }
  if (args.Length() == 2 && args[1]->IsBoolean() && args[1]->BooleanValue()) {
    self->MovePointer(sizeof(uint32_t));
  }

  return Undefined();
}

Handle<Value> Pointer::GetUInt32(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();
  uint32_t        val = *((uint32_t *)ptr);

  if (args.Length() == 1 && args[0]->IsBoolean() && args[0]->BooleanValue()) {
    self->MovePointer(sizeof(uint32_t));
  }

  return scope.Close(Integer::NewFromUnsigned(val));
}

Handle<Value> Pointer::PutInt64(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();

  // Have to do this because strtoll doesn't set errno to 0 on success :(
  errno = 0;

  if (args.Length() >= 1) {
    if (args[0]->IsNumber() || args[0]->IsString()) {
      int64_t val;

      if (args[0]->IsNumber()) {
        val = args[0]->IntegerValue();
      }
      else { // assumed args[0]->IsString() from condition above
        String::Utf8Value str(args[0]->ToString());
        val = STR_TO_INT64(*str);
      }

      if (errno != ERANGE && (val >= INT64_MIN && val <= INT64_MAX)) {
        memcpy(ptr, &val, sizeof(int64_t));
      }
      else {
        return THROW_ERROR_EXCEPTION("Value out of Range.");
      }
    }
  }
  if (args.Length() == 2 && args[1]->IsBoolean() && args[1]->BooleanValue()) {
    self->MovePointer(sizeof(int64_t));
  }

  return Undefined();
}

Handle<Value> Pointer::GetInt64(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();
  int64_t         val = *((int64_t *)ptr);
  char            buf[INTEGER_CONVERSION_BUFFER_SIZE];

  memset(buf, 0, INTEGER_CONVERSION_BUFFER_SIZE);
  snprintf(buf, INTEGER_CONVERSION_BUFFER_SIZE, "%lld", val);

  if (args.Length() == 1 && args[0]->IsBoolean() && args[0]->BooleanValue()) {
    self->MovePointer(sizeof(int64_t));
  }

  return scope.Close(String::New(buf));
}

Handle<Value> Pointer::PutUInt64(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();

  // Have to do this because strtoull doesn't set errno to 0 on success :(
  errno = 0;

  if (args.Length() >= 1) {
    if (args[0]->IsNumber() || args[0]->IsString()) {
      uint64_t val;

      // Convert everything to a string because it's easier this way
      String::Utf8Value str(args[0]->ToString());
      val = STR_TO_UINT64(*str);

      if ((*str)[0] != '-' && errno != ERANGE && val <= UINT64_MAX) {
        memcpy(ptr, &val, sizeof(uint64_t));
      } else {
        return THROW_ERROR_EXCEPTION("Value out of Range.");
      }
    }
  }
  if (args.Length() == 2 && args[1]->IsBoolean() && args[1]->BooleanValue()) {
    self->MovePointer(sizeof(uint64_t));
  }

  return Undefined();
}

Handle<Value> Pointer::GetUInt64(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();
  uint64_t        val = *((uint64_t *)ptr);
  char            buf[INTEGER_CONVERSION_BUFFER_SIZE];

  memset(buf, 0, INTEGER_CONVERSION_BUFFER_SIZE);
  snprintf(buf, INTEGER_CONVERSION_BUFFER_SIZE, "%llu", val);

  if (args.Length() == 1 && args[0]->IsBoolean() && args[0]->BooleanValue()) {
    self->MovePointer(sizeof(uint64_t));
  }

  return scope.Close(String::New(buf));
}

Handle<Value> Pointer::PutFloat(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();

  if (args.Length() >= 1 && args[0]->IsNumber()) {
    float val = args[0]->NumberValue();
    memcpy(ptr, &val, sizeof(float));
  }
  if (args.Length() == 2 && args[1]->IsBoolean() && args[1]->BooleanValue()) {
    self->MovePointer(sizeof(float));
  }

  return Undefined();
}

Handle<Value> Pointer::GetFloat(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();
  float           val = *((float *)ptr);

  if (args.Length() == 1 && args[0]->IsBoolean() && args[0]->BooleanValue()) {
    self->MovePointer(sizeof(float));
  }

  return scope.Close(Number::New((double)val));
}

Handle<Value> Pointer::PutDouble(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();

  if (args.Length() >= 1 && args[0]->IsNumber()) {
    double val = args[0]->NumberValue();
    memcpy(ptr, &val, sizeof(double));
  }
  if (args.Length() == 2 && args[1]->IsBoolean() && args[1]->BooleanValue()) {
    self->MovePointer(sizeof(double));
  }

  return Undefined();
}

Handle<Value> Pointer::GetDouble(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();
  double          val = *((double *)ptr);

  if (args.Length() == 1 && args[0]->IsBoolean() && args[0]->BooleanValue()) {
    self->MovePointer(sizeof(double));
  }

  return scope.Close(Number::New(val));
}

Handle<Value> Pointer::PutPointerMethod(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();

  if (args.Length() >= 1) {
    if (args[0]->IsNull()) {
      *((unsigned char **)ptr) = NULL;
    }
    else {
      Pointer *obj = ObjectWrap::Unwrap<Pointer>(args[0]->ToObject());
      *((unsigned char **)ptr) = obj->GetPointer();
    }
    //printf("Pointer::PutPointerMethod: writing pointer %p at %p\n", *((unsigned char **)ptr), ptr);

    if (args.Length() == 2 && args[1]->IsBoolean() && args[1]->BooleanValue()) {
      self->MovePointer(sizeof(unsigned char *));
    }
  }

  return Undefined();
}

Handle<Value> Pointer::GetPointerMethod(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();
  unsigned char   *val = *((unsigned char **)ptr);

  //printf("Pointer::GetPointerMethod: got %p from %p\n", val, ptr);

  if (args.Length() == 1 && args[0]->IsBoolean() && args[0]->BooleanValue()) {
    self->MovePointer(sizeof(unsigned char *));
  }

  return scope.Close(WrapPointer(val));
}

Handle<Value> Pointer::PutObject(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());

  if (args.Length() >= 1) {
    Local<Value> obj = args[0];
    *reinterpret_cast<Persistent<Value>*>(self->GetPointer()) = Persistent<Value>::New(obj);

    if (args.Length() == 2 && args[1]->IsBoolean() && args[1]->BooleanValue()) {
      self->MovePointer(sizeof(Persistent<Value>));
    }
  }

  return Undefined();
}

Handle<Value> Pointer::GetObject(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();
  Persistent<Value> rtn = *reinterpret_cast<Persistent<Value>*>(ptr);

  if (args.Length() == 1 && args[0]->IsBoolean() && args[0]->BooleanValue()) {
    self->MovePointer(sizeof(Persistent<Value>));
  }

  return scope.Close(rtn);
}

Handle<Value> Pointer::PutCString(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  unsigned char   *ptr = self->GetPointer();

  if (args.Length() >= 1 && args[0]->IsString()) {
    args[0]->ToString()->WriteUtf8((char *)ptr);

    if (args.Length() == 2 && args[1]->IsBoolean() && args[1]->BooleanValue()) {
      self->MovePointer(args[0]->ToString()->Utf8Length() + 1);
    }
  }

  return Undefined();
}

Handle<Value> Pointer::GetCString(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  char            *val = (char *)self->GetPointer();

  Local<String> rtn = String::New(val);
  if (args.Length() == 1 && args[0]->IsBoolean() && args[0]->BooleanValue()) {
    self->MovePointer(rtn->Utf8Length() + 1);
  }

  return scope.Close(rtn);
}

Handle<Value> Pointer::IsNull(const Arguments& args) {
  HandleScope     scope;
  Pointer         *self = ObjectWrap::Unwrap<Pointer>(args.This());
  return scope.Close(Boolean::New(self->GetPointer() == NULL));
}

// Callback that gets invoked when the Buffer returned from ToBuffer is being freed
void Pointer::unref_pointer_callback(char *data, void *hint) {
  Pointer *p = static_cast<Pointer *>(hint);
  //printf("Unref()ing pointer\n");
  p->Unref();
}

Handle<Value> Pointer::ToBuffer(const Arguments& args) {
  HandleScope scope;
  Pointer *self = ObjectWrap::Unwrap<Pointer>(args.This());

  // Defaults to the size of the allocated Buffer area, but can be explicitly
  // specified as the first argument.
  unsigned int sz = self->m_allocated;
  if (args.Length() >= 1) {
    sz = args[0]->Uint32Value();
  }

  Buffer *slowBuffer = Buffer::New((char *)self->GetPointer(), (size_t)sz, unref_pointer_callback, self);

  // increase the reference count for this Pointer
  self->Ref();

  return scope.Close(slowBuffer->handle_);
}
