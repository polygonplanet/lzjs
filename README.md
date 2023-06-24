lzjs
========

[![GitHub Actions Build Status](https://github.com/polygonplanet/lzjs/actions/workflows/ci.yml/badge.svg)](https://github.com/polygonplanet/lzjs/actions)

lzjs is a JavaScript library that compresses and decompresses strings using an original algorithm based on the LZ algorithm.

This can be particularly useful when storing large amounts of data in storage with size limitations, such as localStorage or cookies.

## Installation

### npm

```bash
$ npm install --save lzjs
```

#### using `import`

```javascript
import lzjs from 'lzjs';
```

#### using `require`

```javascript
const lzjs = require('lzjs');
```

### browser (standalone)

You can install the library via npm or download it from the [release list](https://github.com/polygonplanet/lzjs/tags). Use the `lzjs.js` or `lzjs.min.js` files included in the package.  
\*Please note that if you use `git clone`, even the *master* branch may be under development.

```html
<script src="lzjs.js"></script>
```
or the minified `lzjs.min.js`:

```html
<script src="lzjs.min.js"></script>
```

When the script is loaded, the `lzjs` object is defined in the global scope (i.e., `window.lzjs`).

## Demo

* [lzjs compression demo](https://polygonplanet.github.io/lzjs/demo/)

## API

* [compress](#lzjscompressdata-options)
* [decompress](#lzjsdecompressdata-options)
* [compressToBase64](#lzjscompresstobase64data)
* [decompressFromBase64](#lzjsdecompressfrombase64data)

----

### lzjs.compress(data, [options])

Compresses data into a binary string.

#### Arguments

* **data** *(string)* : Input data
* **[options]** *(object)* : Compression options
  * **onData** *(function (data) {})* : Called when a data is chunked
  * **onEnd** *(function () {})* : Called when process ends

#### Returns

*(string)* : Compressed data

#### Example

Example of compressing and decompressing a string.

```javascript
const data = 'hello hello hello';
const compressed = lzjs.compress(data);
console.log(compressed); // 'Whello \x80\x82\x84\x86\x83'

const decompressed = lzjs.decompress(compressed);
console.log(decompressed === data); // true
```

Compress data using `onData` and `onEnd` events.

```javascript
const string = 'hello hello hello';
const compressed = [];

lzjs.compress(string, {
  onData: (data) => {
    compressed.push(data);
  },
  onEnd: () => {
    console.log(compressed.join('')); // 'Whello \x80\x82\x84\x86\x83'
  }
});
```

----

### lzjs.decompress(data, [options])

Decompresses a string that has been compressed with [`lzjs.compress()`](#lzjscompressdata-options)

#### Arguments

* **data** *(string)* : Input data
* **[options]** *(object)* : Decompression options
  * **onData** *(function (data) {})* : Called when a data is chunked
  * **onEnd** *(function () {})* : Called when process ends

#### Returns

*(string)* : Decompressed data

#### Example

Example of decompressing a string that has been compressed with [`lzjs.compress()`](#lzjscompressdata-options).

```javascript
const decompressed = lzjs.decompress('Wabc\x80\x82\x81\x83\x83');
console.log(decompressed); // 'abcabcabcabcabc'
```

Decompress data using `onData` and `onEnd` events.

```javascript
const compressed = 'Whello \x80\x82\x84\x86\x83';
const decompressed = [];

lzjs.decompress(compressed, {
  onData: (data) => {
    decompressed.push(data);
  },
  onEnd: () => {
    console.log(decompressed.join('')); // 'hello hello hello'
  }
});
```

----

### lzjs.compressToBase64(data)

Compresses and encodes data into a Base64 string.

#### Arguments

* **data** *(string)* : Input data

#### Returns

*(string)* : Compressed and Base64 encoded string

#### Example

```javascript
const data = 'hello hello hello';
const compressed = lzjs.compressToBase64(data);
console.log(compressed); // 'V2hlbGxvIMKAwoLChMKGwoM='
```

----

### lzjs.decompressFromBase64(data)

Decompresses a string that has been compressed with [`lzjs.compressToBase64()`](#lzjscompresstobase64data).

#### Arguments

* **data** *(string)* : Input data

#### Returns

*(string)* : Decompressed data

#### Example

```javascript
const decompressed = lzjs.decompressFromBase64('V2FiY8KAwoLCgcKDwoM=');
console.log(decompressed); // 'abcabcabcabcabc'
```

## Command line usage

After `npm install -g lzjs`

#### Add file to archive

```bash
lzjs -a something.txt
```

#### Extract file

```bash
lzjs -x something.txt.lzjs
```

### All command line options

```
  -h, --help                 show Help
  -v, --version              show Version
  -a, --add <file_name>      Add file to archive
  -x, --extract <file_name>  eXtract file
```

Note that command line compression is only valid for the UTF-8 encoded file.

## Contributing

We welcome contributions from everyone.
For bug reports and feature requests, please [create an issue on GitHub](https://github.com/polygonplanet/lzjs/issues).

### Pull Requests

Before submitting a pull request, please run `$ npm run test` to ensure there are no errors.
We only accept pull requests that pass all tests.

## License

This project is licensed under the terms of the MIT license.
See the [LICENSE](LICENSE) file for details.
