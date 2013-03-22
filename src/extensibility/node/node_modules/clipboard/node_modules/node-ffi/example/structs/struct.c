#include <stdio.h>

struct test {
  int a;
  double b;
  const char *c;
};

void inspect () {
  printf("sizeof(struct test): %lu\n", sizeof(struct test));
}

double test_struct_arg_by_value (struct test by_value) {
  printf("Input a: %d\n", by_value.a);
  printf("Input c: %s\n", by_value.c);
  return by_value.a + (double)by_value.b;
}

struct test test_struct_rtn_by_value () {
  struct test rtn;
  rtn.a = 10;
  rtn.b = 123.213;
  rtn.c = "Does this work?";
  return rtn;
}
