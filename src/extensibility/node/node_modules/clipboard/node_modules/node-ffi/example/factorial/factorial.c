#include <stdint.h>

uint64_t factorial(int max) {
    int i           = max;
    uint64_t result = 1;

    while (i >= 2)
        result *= i--;

    return result;
}
