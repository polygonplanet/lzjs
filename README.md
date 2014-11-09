lzjs
========

[![Build Status](https://travis-ci.org/polygonplanet/lzjs.svg)](https://travis-ci.org/polygonplanet/lzjs)


Compression by LZ algorithm in JavaScript.

This is useful when storing the large data in a size limited storage (e.g., localStorage, cookie etc.).

## Installation

### In a browser:

```html
<script src="lzjs.js"></script>
```

or

```html
<script src="lzjs.min.js"></script>
```

The object named "lzjs" will defined in the global scope.


### In Node.js:

```bash
npm install lzjs
```

```javascript
var lzjs = require('lzjs');
```

## Usage

* {_string_} lzjs.**compress** ( {_string_|_Buffer_} data )  
  Compress data.  
  @param {_string_|_Buffer_} _data_ Input data  
  @return {_string_} Compressed data

* {_string_} lzjs.**decompress** ( {_string_} data )  
  Decompress data.  
  @param {_string_} _data_ Input data  
  @return {_string_} Decompressed data


```javascript
var data = 'hello hello hello';
var compressed = lzjs.compress(data);
console.log(compressed); // Outputs a compressed binary string
var decompressed = lzjs.decompress(compressed);
console.log(decompressed === data); // true
```

## Demo

* [Demo](http://polygonplanet.github.io/lzjs/demo/)

## License

MIT


