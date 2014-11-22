/**
 * lzjs
 *
 * @description  Compression by LZ algorithm in JavaScript.
 * @fileOverview Data compression library
 * @version      1.1.0
 * @date         2014-11-22
 * @link         https://github.com/polygonplanet/lzjs
 * @copyright    Copyright (c) 2014 polygon planet <polygon.planet.aqua@gmail.com>
 * @license      Licensed under the MIT license.
 */

(function(name, context, factory) {

  // Supports UMD. AMD, CommonJS/Node.js and browser context
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = factory();
    } else {
      exports[name] = factory();
    }
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    context[name] = factory();
  }

}('lzjs', this, function() {
  'use strict';

  var fromCharCode = String.fromCharCode;
  var hasOwnProperty = Object.prototype.hasOwnProperty;

  var TABLE = (function() {
    var table = '';
    var esc = {
      0x8: 1,
      0xa: 1,
      0xb: 1,
      0xc: 1,
      0xd: 1,
      0x5c: 1
    };

    for (var i = 0; i < 0x7f; i++) {
      if (!hasOwnProperty.call(esc, i)) {
        table += fromCharCode(i);
      }
    }

    return table;
  }());

  // Buffers
  var TABLE_LENGTH = TABLE.length;
  var TABLE_DIFF = Math.max(TABLE_LENGTH, 62) - Math.min(TABLE_LENGTH, 62);
  var BUFFER_MAX = TABLE_LENGTH - 1;
  var TABLE_BUFFER_MAX = BUFFER_MAX * (BUFFER_MAX + 1);

  // Sliding Window
  var WINDOW_MAX = 1024;
  var WINDOW_BUFFER_MAX = 304; // maximum 304

  // Unicode table : U+0000 - U+0084
  var LATIN_CHAR_MAX = 11;
  var LATIN_BUFFER_MAX = LATIN_CHAR_MAX * (LATIN_CHAR_MAX + 1);

  // Unicode table : U+0000 - U+FFFF
  var UNICODE_CHAR_MAX = 40;
  var UNICODE_BUFFER_MAX = UNICODE_CHAR_MAX * (UNICODE_CHAR_MAX + 1);

  // Index positions
  var LATIN_INDEX = TABLE_LENGTH + 1;
  var LATIN_INDEX_START = TABLE_DIFF + 20;
  var UNICODE_INDEX = TABLE_LENGTH + 5;

  // Decode/Start positions
  var DECODE_MAX = TABLE_LENGTH - TABLE_DIFF - 19;
  var LATIN_DECODE_MAX = UNICODE_CHAR_MAX + 7;
  var CHAR_START = LATIN_DECODE_MAX + 1;
  var COMPRESS_START = CHAR_START + 1;
  var COMPRESS_FIXED_START = COMPRESS_START + 5;
  var COMPRESS_INDEX = COMPRESS_FIXED_START + 5; // 59


  // LZSS Compression
  function LZSS() {
    this.init();
  }

  LZSS.prototype = {
    init: function() {
      this._data = null;
      this._offset = null;
      this._index = null;
      this._length = null;
    },
    _createWindow: function() {
      var alpha = 'abcdefghijklmnopqrstuvwxyz';

      var win = '';
      var len = alpha.length;
      var i, j, c, c2;

      for (i = 0; i < len; i++) {
        c = alpha.charAt(i);
        for (j = len - 1; j > 15 && win.length < WINDOW_MAX; j--) {
          c2 = alpha.charAt(j);
          win += ' ' + c + ' ' + c2;
        }
      }

      while (win.length < WINDOW_MAX) {
        win = ' ' + win;
      }
      win = win.slice(0, WINDOW_MAX);

      return win;
    },
    // Searches for a longer match
    _search: function() {
      this._length = 0;

      var offset = this._offset;
      var sub = this._data.substr(offset, BUFFER_MAX);
      var len = sub.length;
      var pos = offset - WINDOW_BUFFER_MAX;

      var i = 2;
      var j, s, win, index;

      while (i <= len) {
        s = sub.substr(0, i);
        win = this._data.substring(pos, offset + i - 1);

        // Fast check by pre-match for the slow lastIndexOf.
        if (!~win.indexOf(s)) {
          break;
        }

        index = win.lastIndexOf(s);
        j = pos + index;

        while (i <= len) {
          if (sub.charCodeAt(i) !== this._data.charCodeAt(j + i)) {
            break;
          }
          i++;
        }

        this._index = WINDOW_BUFFER_MAX - index;
        this._length = i;
        i++;
      }

      if (this._length > 0) {
        return true;
      }

      return false;
    },
    compress: function(data) {
      if (data == null || data.length === 0) {
        return '';
      }

      var result = '';

      var chars = TABLE.split('');
      var win = this._createWindow();

      this._offset = win.length;
      this._data = win + data;
      win = data = null;

      var index = -1;
      var lastIndex = -2;

      var len = this._data.length;
      var c, c1, c2, c3, c4;

      while (this._offset < len) {
        if (!this._search()) {
          c = this._data.charCodeAt(this._offset++);
          if (c < LATIN_BUFFER_MAX) {
            c1 = c % UNICODE_CHAR_MAX;
            c2 = (c - c1) / UNICODE_CHAR_MAX;

            // Latin index
            index = c2 + LATIN_INDEX;
            if (lastIndex === index) {
              result += chars[c1];
            } else {
              result += chars[index - LATIN_INDEX_START] + chars[c1];
              lastIndex = index;
            }
          } else {
            c1 = c % UNICODE_BUFFER_MAX;
            c2 = (c - c1) / UNICODE_BUFFER_MAX;
            c3 = c1 % UNICODE_CHAR_MAX;
            c4 = (c1 - c3) / UNICODE_CHAR_MAX;

            // Unicode index
            index = c2 + UNICODE_INDEX;
            if (lastIndex === index) {
              result += chars[c3] + chars[c4];
            } else {
              result += chars[CHAR_START] +
                chars[index - TABLE_LENGTH] + chars[c3] + chars[c4];

              lastIndex = index;
            }
          }
        } else {
          c1 = this._index % BUFFER_MAX;
          c2 = (this._index - c1) / BUFFER_MAX;

          if (this._length === 2) {
            result += chars[c2 + COMPRESS_FIXED_START] + chars[c1];
          } else {
            result += chars[c2 + COMPRESS_START] +
              chars[c1] + chars[this._length];
          }

          this._offset += this._length;
          index = -1;
          lastIndex = -2;
        }
      }

      this._data = null;
      return result;
    },
    decompress: function(data) {
      if (data == null || data.length === 0) {
        return '';
      }

      var result = this._createWindow();

      var out = false;
      var index = null;

      var i, len, c, c2, c3;
      var code, pos, length, buffer, sub;

      var chars = {};
      for (i = 0, len = TABLE.length; i < len; i++) {
        chars[TABLE.charAt(i)] = i;
      }

      for (i = 0, len = data.length; i < len; i++) {
        c = chars[data.charAt(i)];
        if (c === void 0) {
          throw new Error('Out of range in decompression');
        }

        if (c < DECODE_MAX) {
          if (!out) {
            // Latin index
            code = index * UNICODE_CHAR_MAX + c;
          } else {
            // Unicode index
            c3 = chars[data.charAt(++i)];
            code = c3 * UNICODE_CHAR_MAX + c + UNICODE_BUFFER_MAX * index;
          }
          result += fromCharCode(code);
        } else if (c < LATIN_DECODE_MAX) {
          // Latin starting point
          index = c - DECODE_MAX;
          out = false;
        } else if (c === CHAR_START) {
          // Unicode starting point
          c2 = chars[data.charAt(++i)];
          index = c2 - 5;
          out = true;
        } else if (c < COMPRESS_INDEX) {
          c2 = chars[data.charAt(++i)];

          if (c < COMPRESS_FIXED_START) {
            pos = (c - COMPRESS_START) * BUFFER_MAX + c2;
            length = chars[data.charAt(++i)];
          } else {
            pos = (c - COMPRESS_FIXED_START) * BUFFER_MAX + c2;
            length = 2;
          }

          sub = result.slice(-WINDOW_BUFFER_MAX)
            .slice(-pos).substring(0, length);

          if (sub) {
            buffer = '';
            while (buffer.length < length) {
              buffer += sub;
            }
            buffer = buffer.substring(0, length);
            result += buffer;
          }
          index = null;
        }
      }

      result = result.substring(WINDOW_MAX);
      data = null;

      return result;
    }
  };


  // LZW Compression
  function LZW() {}

  LZW.prototype = {
    compress: function(data) {
      if (data == null || data.length === 0) {
        return '';
      }

      var result = '';
      var buffer = '';

      var dict = {};
      var code = 0x100;

      var i = 0;
      var len = data.length;
      var c;

      if (len > 0) {
        buffer = c = data.charAt(i++);
      }

      while (i < len) {
        c = data.charAt(i++);

        if (hasOwnProperty.call(dict, buffer + c)) {
          buffer += c;
        } else {
          if (buffer.length === 1) {
            result += buffer;
          } else {
            result += dict[buffer];
          }

          if (code <= 0xffff) {
            dict[buffer + c] = fromCharCode(code++);
          }

          buffer = c;
        }
      }

      if (buffer.length === 1) {
        result += buffer;
      } else {
        result += dict[buffer];
      }

      return result;
    },
    decompress: function(data) {
      if (data == null || data.length === 0) {
        return '';
      }

      var result = '';

      var dict = [];
      var code = 0x100;

      var i = 0;
      var len = data.length;
      var c, ch, prev, buffer;

      if (len > 0) {
        c = data.charCodeAt(i++);
        ch = fromCharCode(c);
        result += ch;
        prev = ch;
      }

      while (i < len) {
        c = data.charCodeAt(i++);

        if (c <= 0xff) {
          buffer = fromCharCode(c);
        } else {
          if (hasOwnProperty.call(dict, c)) {
            buffer = dict[c];
          } else {
            buffer = prev + ch;
          }
        }

        result += buffer;

        ch = buffer.charAt(0);
        dict[code++] = prev + ch;
        prev = buffer;
      }

      return result;
    }
  };


  // LZJS Compression
  function LZJS() {}

  LZJS.prototype = {
    compress: function(data) {
      if (data == null || data.length === 0) {
        return '';
      }

      data = '' + data;
      var result = '';

      var minCount = 26;
      var maxCount = 192;

      var chars = {};
      var count = 0;
      var len = data.length;
      var i = 0;
      var c;

      while (i < len && count < maxCount) {
        c = data.charAt(i++);
        if (!hasOwnProperty.call(chars, c)) {
          chars[c] = null;
          count++;
        }
      }

      var dataBytes = byteLength(data);
      var resultBytes;

      if (count <= minCount || count >= maxCount) {
        result = this._compressByS(data);
        resultBytes = result.length;
      } else {
        result = this._compressByW(data);
        resultBytes = byteLength(result);
      }

      if (resultBytes > dataBytes) {
        result = this._compressByN(data);
      }

      return result;
    },
    decompress: function(data) {
      if (data == null || data.length === 0) {
        return '';
      }

      data = '' + data;
      var type = data.charAt(0);
      data = data.substring(1);

      var method = '_decompressBy' + type;
      if (typeof this[method] !== 'function') {
        throw new Error('Invalid format in decompression');
      }

      return this[method](data);
    },
    _compressByS: function(data) {
      return 'S' + new LZSS().compress(data);
    },
    _compressByW: function(data) {
      return 'W' + new LZW().compress(toUTF8(data));
    },
    _compressByN: function(data) {
      return 'N' + data;
    },
    _decompressByS: function(data) {
      return new LZSS().decompress(data);
    },
    _decompressByW: function(data) {
      return toUTF16(new LZW().decompress(data));
    },
    _decompressByN: function(data) {
      return data;
    }
  };


  // UTF-16 to UTF-8
  function toUTF8(data) {
    var result = '';
    var i = 0;
    var len = data.length;
    var c, c2;

    for (; i < len; i++) {
      c = data.charCodeAt(i);
      if (c >= 0xd800 && c <= 0xd8ff) {
        if (i + 1 < len) {
          c2 = data.charCodeAt(i + 1);
          if (c2 >= 0xdc00 && c2 <= 0xdfff) {
            c = ((c & 0x3ff) << 10) + (c2 & 0x3ff) + 0x10000;
            i++;
          }
        }
      }

      if (c < 0x80) {
        result += fromCharCode(c);
      } else if (c < 0x800) {
        result += fromCharCode(0xc0 | ((c >> 6) & 0x1f)) +
                  fromCharCode(0x80 | (c & 0x3f));
      } else if (c < 0x10000) {
        result += fromCharCode(0xe0 | ((c >> 12) & 0xf)) +
                  fromCharCode(0x80 | ((c >> 6) & 0x3f)) +
                  fromCharCode(0x80 | (c & 0x3f));
      } else {
        result += fromCharCode(0xf0 | ((c >> 18) & 0xf)) +
                  fromCharCode(0x80 | ((c >> 12) & 0x3f)) +
                  fromCharCode(0x80 | ((c >> 6) & 0x3f)) +
                  fromCharCode(0x80 | (c & 0x3f));
      }
    }

    return result;
  }

  // UTF-8 to UTF-16
  function toUTF16(data) {
    var result = '';
    var i = 0;
    var len = data.length;
    var n, c, c2, c3, c4;

    while (i < len) {
      c = data.charCodeAt(i++);
      n = c >> 4;
      if (n >= 0 && n <= 7) {
        result += fromCharCode(c);
      } else if (n >= 12 && n <= 13) {
        c2 = data.charCodeAt(i++);
        result += fromCharCode(((c & 0x1f) << 6) | (c2 & 0x3f));
      } else if (n === 14) {
        c2 = data.charCodeAt(i++);
        c3 = data.charCodeAt(i++);
        result += fromCharCode(((c & 0xf) << 12) |
                               ((c2 & 0x3f) << 6) |
                               (c3 & 0x3f));
      } else if (i + 2 < len) {
        c2 = data.charCodeAt(i++);
        c3 = data.charCodeAt(i++);
        c4 = data.charCodeAt(i++);
        result += fromCharCode(((c & 0x7) << 18) |
                               ((c2 & 0x3f) << 12) |
                               ((c3 & 0x3f) << 6) |
                               (c4 & 0x3f));
      }
    }

    return result;
  }

  // UTF-8 byte length
  function byteLength(data) {
    var length = 0;
    var c, c2;

    for (var i = 0, len = data.length; i < len; i++) {
      c = data.charCodeAt(i);

      if (c >= 0xd800 && c <= 0xd8ff) {
        if (i + 1 < len) {
          c2 = data.charCodeAt(i + 1);
          if (c2 >= 0xdc00 && c2 <= 0xdfff) {
            c = ((c & 0x3ff) << 10) + (c2 & 0x3ff) + 0x10000;
            i++;
          } else {
            continue;
          }
        } else {
          continue;
        }
      }

      if (c < 0x80) {
        length += 1;
      } else if (c < 0x800) {
        length += 2;
      } else if (c < 0x10000) {
        length += 3;
      } else if (c < 0x200000) {
        length += 4;
      } else if (c < 0x4000000) {
        length += 5;
      } else {
        length += 6;
      }
    }

    return length;
  }


  // via http://www.onicos.com/staff/iz/amuse/javascript/expert/base64.txt
  var base64EncodeChars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  var base64DecodeChars = [
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
    -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
    -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1
  ];

  function base64encode(str) {
    var out, i, len;
    var c1, c2, c3;

    len = str.length;
    i = 0;
    out = '';
    while (i < len) {
      c1 = str.charCodeAt(i++) & 0xff;
      if (i === len) {
        out += base64EncodeChars.charAt(c1 >> 2) +
          base64EncodeChars.charAt((c1 & 0x3) << 4) +
          '==';
        break;
      }

      c2 = str.charCodeAt(i++);
      if (i === len) {
        out += base64EncodeChars.charAt(c1 >> 2) +
          base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4)) +
          base64EncodeChars.charAt((c2 & 0xf) << 2) +
          '=';
        break;
      }

      c3 = str.charCodeAt(i++);
      out += base64EncodeChars.charAt(c1 >> 2) +
        base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4)) +
        base64EncodeChars.charAt(((c2 & 0xf) << 2) | ((c3 & 0xc0) >> 6)) +
        base64EncodeChars.charAt(c3 & 0x3f);
    }

    return out;
  }


  function base64decode(str) {
    var c1, c2, c3, c4;
    var i, len, out;

    len = str.length;
    i = 0;
    out = '';

    while (i < len) {
      do {
        c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
      } while (i < len && c1 === -1);

      if (c1 === -1) {
        break;
      }

      do {
        c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
      } while (i < len && c2 === -1);

      if (c2 === -1) {
        break;
      }

      out += fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));

      do {
        c3 = str.charCodeAt(i++) & 0xff;
        if (c3 === 61) {
          return out;
        }
        c3 = base64DecodeChars[c3];
      } while (i < len && c3 === -1);

      if (c3 === -1) {
        break;
      }

      out += fromCharCode(((c2 & 0xf) << 4) | ((c3 & 0x3c) >> 2));

      do {
        c4 = str.charCodeAt(i++) & 0xff;
        if (c4 === 61) {
          return out;
        }
        c4 = base64DecodeChars[c4];
      } while (i < len && c4 === -1);

      if (c4 === -1) {
        break;
      }

      out += fromCharCode(((c3 & 0x03) << 6) | c4);
    }

    return out;
  }


  /**
   * @name lzjs
   * @type {Object}
   * @public
   * @class
   */
  var lzjs = {
    /**
     * @lends lzjs
     */
    /**
     * Compress data.
     *
     * @param {string|Buffer} data Input data
     * @return {string} Compressed data
     */
    compress: function(data) {
      return new LZJS().compress(data);
    },
    /**
     * Decompress data.
     *
     * @param {string} data Input data
     * @return {string} Decompressed data
     */
    decompress: function(data) {
      return new LZJS().decompress(data);
    },
    /**
     * Compress data to base64 string.
     *
     * @param {string|Buffer} data Input data
     * @return {string} Compressed data
     */
    compressBase64: function(data) {
      return base64encode(toUTF8(lzjs.compress(data)));
    },
    /**
     * Decompress data from base64 string.
     *
     * @param {string} data Input data
     * @return {string} Decompressed data
     */
    decompressBase64: function(data) {
      return lzjs.decompress(toUTF16(base64decode(data)));
    }
  };

  return lzjs;
}));
