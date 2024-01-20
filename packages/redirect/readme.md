# @polka/redirect [![npm](https://badgen.now.sh/npm/v/@polka/redirect)](https://npmjs.org/package/@polka/redirect) [![licenses](https://licenses.dev/b/npm/%40polka%2Fredirect)](https://licenses.dev/npm/%40polka%2Fredirect)

> A response helper for URL redirects; _not_ limited to [Polka][polka]!

Allows you to easily formulate HTTP redirect responses.

It will set the [`Location`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location) header with the target value, which may be fully-qualified URLs or may be relative to the current URL of the request.

## Install

```
$ npm install --save @polka/redirect
```

## Usage

```js
const polka = require('polka');
const redirect = require('@polka/redirect');

polka()
  // All examples start from "/foo/bar" path:
  .get('/foo/bar', (req, res) => {
    // relative paths
    redirect(res, '../'); //=> (302) "/"
    redirect(res, './'); //=> (302) "/foo/"
    redirect(res, 'baz'); //=> (302) "/foo/baz"

    // absolute paths
    redirect(res, '/'); //=> (302) "/"
    redirect(res, '/bar'); //=> (302) "/bar"

    // external paths
    redirect(res, 'https://example.com'); //=> (302) "https://example.com/"
    redirect(res, 'https://example.com/foo'); //=> (302) "https://example.com/foo"

    // custom statusCode
    redirect(res, 301, '/'); //=> (301) "/"
    redirect(res, 301, '/baz'); //=> (301) "/baz"
    redirect(res, 301, 'baz?name=bat'); //=> (301) "/foo/baz?name=bat"
    redirect(res, 301, 'https://example.com/foo'); //=> (301) "https://example.com/foo"

    // "back" w/ "Referrer" HTTP header
    redirect(res, 'back'); //=> (302) "/previous/path"
    redirect(res, 301, 'back'); //=> (301) "/previous/path"

    // "back" without "Referrer" HTTP header
    redirect(res, 'back'); //=> (302) "/"
    redirect(res, 301, 'back'); //=> (301) "/"
  });
```

## API

### redirect(res, location)
### redirect(res, code, location)

#### res
Type: `ServerReponse`

The outgoing HTTP response.

#### code
Type: `Number`<br>
Default: `302`

The `statusCode` for your response.

#### location
Type: `String`<br>
Default: `''`

The [`Location`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location) target for your redirect. It may be declared as:

* an absolute path – eg `/`, `/foo/bar`
* a relative path – eg `.`, `..`, `./`, `../`, `foo/bar`
* a complete URL – eg `https://example.com/foo/bar`
* or `"back"`, which redirects to `"/"` only when the [`Referrer`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer) is unavailable


## Support

Any issues or questions can be sent to the [Polka][polka] repository.<br>However, please specify that your inquiry is about `@polka/url` specifically.


## License

MIT © [Luke Edwards](https://lukeed.com)

[polka]: https://github.com/lukeed/polka
