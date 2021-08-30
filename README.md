# Netlify plugin TTL cache

A Netlify plugin for persisting immutable build assets across releases.

## How it works

By default, Netlify replaces all existing static assets when publishing new releases.

For sites where assets are unique across deployments, and dynamically loaded (e.g. [`React.lazy`](https://reactjs.org/docs/code-splitting.html)) this can lead to runtime errors (e.g. [chunk-load errors](https://www.google.com/search?q=chunk+load+error+netlify&oq=chunk+load+error+netlify)).

This plugin prevents this problem by allowing users to include legacy assets across releases.

## Usage

Install the plugin

```sh
npm i -D netlify-plugin-ttl-cache
```

Add the plugin to your `netlify.toml`

```toml
[[plugins]]
package = "netlify-plugin-ttl-cache"
  [plugins.inputs]
  path = "build"
  ttl = 90
```

## Inputs

### path

_Build output directory._

**type:** `string`

**default:** `"build"`

### ttl

_Maximum age (days) of files in cache._

**type:** `number`

**default:** `90`

### exclude

_Regular expression [string pattern](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) for files to exclude._

**type:** `string`

**default:** `n/a`
