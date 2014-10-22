# Negotiator

An HTTP content negotiator for node.js written in javascript.

# Accept Negotiation

    Negotiator = require('negotiator')

    availableMediaTypes = ['text/html', 'text/plain', 'application/json']

    // The negotiator constructor receives a request object
    negotiator = new Negotiator(request)

    // Let's say Accept header is 'text/html, application/*;q=0.2, image/jpeg;q=0.8'

    negotiator.preferredMediaTypes()
    // -> ['text/html', 'image/jpeg', 'application/*']

    negotiator.preferredMediaTypes(availableMediaTypes)
    // -> ['text/html', 'application/json']

    negotiator.preferredMediaType(availableMediaTypes)
    // -> 'text/html'

You can check a working example at `examples/accept.js`.

## Methods

`preferredMediaTypes(availableMediaTypes)`:

Returns an array of preferred media types ordered by priority from a list of available media types.

`preferredMediaType(availableMediaType)`:

Returns the top preferred media type from a list of available media types.

# Accept-Language Negotiation

    Negotiator = require('negotiator')

    negotiator = new Negotiator(request)

    availableLanguages = 'en', 'es', 'fr'

    // Let's say Accept-Language header is 'en;q=0.8, es, pt'

    negotiator.preferredLanguages()
    // -> ['es', 'pt', 'en']

    negotiator.preferredLanguages(availableLanguages)
    // -> ['es', 'en']

    language = negotiator.preferredLanguage(availableLanguages)
    // -> 'es'

You can check a working example at `examples/language.js`.

## Methods

`preferredLanguages(availableLanguages)`:

Returns an array of preferred languages ordered by priority from a list of available languages.

`preferredLanguage(availableLanguages)`:

Returns the top preferred language from a list of available languages.

# Accept-Charset Negotiation

    Negotiator = require('negotiator')

    availableCharsets = ['utf-8', 'iso-8859-1', 'iso-8859-5']

    negotiator = new Negotiator(request)

    // Let's say Accept-Charset header is 'utf-8, iso-8859-1;q=0.8, utf-7;q=0.2'

    negotiator.preferredCharsets()
    // -> ['utf-8', 'iso-8859-1', 'utf-7']

    negotiator.preferredCharsets(availableCharsets)
    // -> ['utf-8', 'iso-8859-1']

    negotiator.preferredCharset(availableCharsets)
    // -> 'utf-8'

You can check a working example at `examples/charset.js`.

## Methods

`preferredCharsets(availableCharsets)`:

Returns an array of preferred charsets ordered by priority from a list of available charsets.

`preferredCharset(availableCharsets)`:

Returns the top preferred charset from a list of available charsets.

# Accept-Encoding Negotiation

    Negotiator = require('negotiator').Negotiator

    availableEncodings = ['identity', 'gzip']

    negotiator = new Negotiator(request)

    // Let's say Accept-Encoding header is 'gzip, compress;q=0.2, identity;q=0.5'

    negotiator.preferredEncodings()
    // -> ['gzip', 'identity', 'compress']

    negotiator.preferredEncodings(availableEncodings)
    // -> ['gzip', 'identity']

    negotiator.preferredEncoding(availableEncodings)
    // -> 'gzip'

You can check a working example at `examples/encoding.js`.

## Methods

`preferredEncodings(availableEncodings)`:

Returns an array of preferred encodings ordered by priority from a list of available encodings.

`preferredEncoding(availableEncodings)`:

Returns the top preferred encoding from a list of available encodings.

# License

MIT
