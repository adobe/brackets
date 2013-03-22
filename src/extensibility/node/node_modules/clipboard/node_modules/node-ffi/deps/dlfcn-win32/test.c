/*
 * dlfcn-win32
 * Copyright (c) 2007 Ramiro Polla
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 */

#include <stdio.h>
#include "dlfcn.h"

/* This is what this test does:
 * - Open library with RTLD_GLOBAL
 * - Get global object
 * - Get symbol from library through library object <- works
 * - Run function if it worked
 * - Get symbol from library through global object  <- works
 * - Run function if it worked
 * - Close library
 * - Open library with RTLD_LOCAL
 * - Get symbol from library through library object <- works
 * - Run function if it worked
 * - Get symbol from library through global object  <- fails
 * - Run function if it worked
 * - Open library again (without closing it first) with RTLD_GLOBAL
 * - Get symbol from library through global object  <- works
 * - Close library
 * - Close global object
 */

int main()
{
    void *global;
    void *library;
    char *error;
    int (*function)( void );
    int ret;

    library = dlopen( "testdll.dll", RTLD_GLOBAL );
    if( !library )
    {
        error = dlerror( );
        printf( "Could not open library globally: %s\n", error ? error : "" );
    }
    else
        printf( "Opened library globally: %p\n", library );

    global = dlopen( 0, RTLD_GLOBAL );
    if( !global )
    {
        error = dlerror( );
        printf( "Could not open global handle: %s\n", error ? error : "" );
    }
    else
        printf( "Got global handle: %p\n", global );

    function = dlsym( library, "function" );
    if( !function )
    {
        error = dlerror( );
        printf( "Could not get symbol from library handle: %s\n",
                error ? error : "" );
    }
    else
        printf( "Got symbol from library handle: %p\n", function );

    if( function )
        function( );

    function = dlsym( global, "function" );
    if( !function )
    {
        error = dlerror( );
        printf( "Could not get symbol from global handle: %s\n",
                error ? error : "" );
    }
    else
        printf( "Got symbol from global handle: %p\n", function );

    if( function )
        function( );

    ret = dlclose( library );
    if( ret )
    {
        error = dlerror( );
        printf( "Could not close library: %s\n", error ? error : "" );
    }
    else
        printf( "Closed library.\n" );

    library = dlopen( "testdll.dll", RTLD_LOCAL );
    if( !library )
    {
        error = dlerror( );
        printf( "Could not open library locally: %s\n", error ? error : "" );
    }
    else
        printf( "Opened library locally: %p\n", library );

    function = dlsym( library, "function" );
    if( !function )
    {
        error = dlerror( );
        printf( "Could not get symbol from library handle: %s\n",
                error ? error : "" );
    }
    else
        printf( "Got symbol from library handle: %p\n", function );

    if( function )
        function( );

    function = dlsym( global, "function" );
    if( !function )
    {
        error = dlerror( );
        printf( "Could not get symbol from global handle: %s\n",
                error ? error : "" );
    }
    else
        printf( "Got symbol from global handle: %p\n", function );

    if( function )
        function( );

    ret = dlclose( library );
    if( ret )
    {
        error = dlerror( );
        printf( "Could not close library: %s\n", error ? error : "" );
    }
    else
        printf( "Closed library.\n" );

    ret = dlclose( global );
    if( ret )
    {
        error = dlerror( );
        printf( "Could not close global handle: %s\n", error ? error : "" );
    }
    else
        printf( "Closed global handle.\n" );

    return 0;
}
