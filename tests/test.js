const lzjs = require('../lzjs');
const assert = require('assert');
const fs = require('fs');

describe('lzjs test', () => {
  const tests = {};

  before((done) => {
    let i;

    tests.unicode = '';
    for (i = 0; i <= 0xffff; i++) {
      tests.unicode += String.fromCharCode(i);
    }

    tests.unicodeReverse = '';
    for (i = 0xffff; i >= 0; --i) {
      tests.unicodeReverse += String.fromCharCode(i);
    }

    tests.randoms = [];
    let s, code;
    for (var j = 0; j < 3; j++) {
      s = '';
      for (i = 0; i <= 0xffff; i++) {
        code = Math.floor(Math.random() * (0xffff + 1));
        s += String.fromCharCode(code);
      }
      tests.randoms.push(s);
    }

    tests.bits = [];
    const max = 60 * (60 + 1);
    const bits = [59, 60, 61, max - 1, max, max + 1];
    for (i = 0; i < bits.length; i++) {
      tests.bits.push(new Array(bits[i] + 1).join('a'));
    }

    tests.unicodeBits = [];
    for (i = 0; i < bits.length; i++) {
      tests.unicodeBits.push(new Array(bits[i] + 1).join('a\u3042'));
      tests.unicodeBits.push(new Array(bits[i] + 1).join('\u3042'));
      tests.unicodeBits.push(new Array(bits[i] + 1).join('\u3042a'));
    }

    tests.chars = [];
    for (i = 0; i <= 0xffff; i += 32) {
      tests.chars.push(new Array(100).join(String.fromCharCode(i)));
    }

    tests.hello = 'Hello World.';
    tests.code = fs.readFileSync(__filename);
    done();
  });

  describe('compress/decompress', () => {
    it('ascii string', () => {
      assert(tests.hello.length > 0);
      const compressed = lzjs.compress(tests.hello);
      assert(compressed.length > 0);
      const decompressed = lzjs.decompress(compressed);
      assert.equal(decompressed, tests.hello);
    });

    it('ascii string*5', () => {
      const s = new Array(6).join(tests.hello);
      assert(s.length > 0);
      const compressed = lzjs.compress(s);
      assert(compressed.length > 0);
      assert(s.length > compressed.length);
      const decompressed = lzjs.decompress(compressed);
      assert.equal(decompressed, s);
    });

    it('unicode [U+0000 - U+FFFF]', () => {
      assert(tests.unicode.length > 0);
      const compressed = lzjs.compress(tests.unicode);
      assert(compressed.length > 0);
      const decompressed = lzjs.decompress(compressed);
      assert.equal(decompressed, tests.unicode);
    });

    it('unicode [U+0000 - U+FFFF]*2', () => {
      const s = tests.unicode + tests.unicode;
      assert(s.length > 0);
      const compressed = lzjs.compress(s);
      assert(compressed.length > 0);
      const decompressed = lzjs.decompress(compressed);
      assert.equal(decompressed, s);
      tests.unicode = null;
    });

    it('unicode [U+0000 - U+FFFF] reverse', () => {
      assert(tests.unicodeReverse.length > 0);
      const compressed = lzjs.compress(tests.unicodeReverse);
      assert(compressed.length > 0);
      const decompressed = lzjs.decompress(compressed);
      assert.equal(decompressed, tests.unicodeReverse);
    });

    it('unicode chars', () => {
      tests.chars.forEach((c) => {
        assert(c.length > 0);
        const compressed = lzjs.compress(c);
        assert(compressed.length > 0);
        const decompressed = lzjs.decompress(compressed);
        assert.equal(decompressed, c);
      });
      tests.chars = null;
    });

    it('random chars', () => {
      const randomString = tests.randoms[0];
      assert(randomString.length > 0);
      const compressed = lzjs.compress(randomString);
      assert(compressed.length > 0);
      const decompressed = lzjs.decompress(compressed);
      assert.equal(decompressed, randomString);
    });

    it('random chars 2', () => {
      const randomString = tests.randoms[1];
      assert(randomString.length > 0);
      const compressed = lzjs.compress(randomString);
      assert(compressed.length > 0);
      const decompressed = lzjs.decompress(compressed);
      assert.equal(decompressed, randomString);
    });

    it('random chars 3', () => {
      const randomString = tests.randoms[2];
      assert(randomString.length > 0);
      const compressed = lzjs.compress(randomString);
      assert(compressed.length > 0);
      const decompressed = lzjs.decompress(compressed);
      assert.equal(decompressed, randomString);
    });

    it('bits', () => {
      tests.bits.forEach((c) => {
        assert(c.length > 0);
        const compressed = lzjs.compress(c);
        assert(compressed.length > 0);
        const decompressed = lzjs.decompress(compressed);
        assert.equal(decompressed, c);
      });
      tests.bits = null;
    });

    it('unicode bits', () => {
      tests.unicodeBits.forEach((c) => {
        assert(c.length > 0);
        const compressed = lzjs.compress(c);
        assert(compressed.length > 0);
        const decompressed = lzjs.decompress(compressed);
        assert.equal(decompressed, c);
      });
      tests.unicodeBits = null;
    });

    it('this source code', () => {
      const s = new Array(5).join(tests.code.toString());
      assert(s.length > 0);
      const compressed = lzjs.compress(s);
      assert(compressed.length > 0);
      const decompressed = lzjs.decompress(compressed);
      assert.equal(decompressed, s);
    });

    it('this source code (Buffer)', () => {
      const buffer = tests.code;
      assert(buffer.length > 0);
      const compressed = lzjs.compress(buffer);
      assert(compressed.length > 0);
      const decompressed = lzjs.decompress(compressed);
      assert.equal(decompressed, buffer.toString());
    });
  });

  describe('compressToBase64 and decompressFromBase64', () => {
    it('should have compressToBase64 and decompressFromBase64 methods', () => {
      assert(typeof lzjs.compressToBase64 === 'function');
      assert(typeof lzjs.decompressFromBase64 === 'function');
    });

    it('should compress data to base64 string and decompress to original data', () => {
      const data = 'hello hello hello';
      const compressed = lzjs.compressToBase64(data);
      assert.equal(compressed, 'V2hlbGxvIMKAwoLChMKGwoM=');

      const decompressed = lzjs.decompressFromBase64(compressed);
      assert.equal(decompressed, data);
    });
  });
});
