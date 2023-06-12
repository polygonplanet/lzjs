const lzjs = require('../lzjs');
const assert = require('assert');

describe('lzjs test', () => {
  describe('compress and decompress', () => {
    it('should have compress and decompress methods', () => {
      assert(typeof lzjs.decompress === 'function');
      assert(typeof lzjs.decompress === 'function');
    });

    describe('ASCII string', () => {
      let asciiStr = null;

      beforeEach(() => {
        asciiStr = 'Hello World.';
      });

      afterEach(() => {
        asciiStr = null;
      });

      it('should correctly compress and decompress ASCII string', () => {
        assert(asciiStr.length > 0);
        const compressed = lzjs.compress(asciiStr);
        assert(compressed.length > 0);
        const decompressed = lzjs.decompress(compressed);
        assert.equal(decompressed, asciiStr);
      });

      it('should correctly compress and decompress repeated ASCII', () => {
        const repeatedAsciiStr = new Array(6).join(asciiStr);
        assert(repeatedAsciiStr.length > 0);
        const compressed = lzjs.compress(repeatedAsciiStr);
        assert(compressed.length > 0);
        assert(repeatedAsciiStr.length > compressed.length);
        const decompressed = lzjs.decompress(compressed);
        assert.equal(decompressed, repeatedAsciiStr);
      });
    });

    describe('Unicode string [U+0000 - U+FFFF]', () => {
      let codeUnitStr = null;

      beforeEach(() => {
        codeUnitStr = '';
        for (let i = 0; i <= 0xffff; i++) {
          codeUnitStr += String.fromCharCode(i);
        }
      });

      afterEach(() => {
        codeUnitStr = null;
      });

      it('should correctly compress and decompress Unicode string', () => {
        assert(codeUnitStr.length > 0);
        const compressed = lzjs.compress(codeUnitStr);
        assert(compressed.length > 0);
        const decompressed = lzjs.decompress(compressed);
        assert.equal(decompressed, codeUnitStr);
      });

      it('should correctly compress and decompress repeated Unicode string', () => {
        const doubleCodeUnitStr = codeUnitStr + codeUnitStr;
        assert(doubleCodeUnitStr.length > 0);
        const compressed = lzjs.compress(doubleCodeUnitStr);
        assert(compressed.length > 0);
        const decompressed = lzjs.decompress(compressed);
        assert.equal(decompressed, doubleCodeUnitStr);
      });
    });

    describe('reversed Unicode string [U+0000 - U+FFFF]', () => {
      let reversedCodeUnitStr = null;

      beforeEach(() => {
        reversedCodeUnitStr = '';
        for (let i = 0xffff; i >= 0; --i) {
          reversedCodeUnitStr += String.fromCharCode(i);
        }
      });

      afterEach(() => {
        reversedCodeUnitStr = null;
      });

      it('should correctly compress and decompress reversed Unicode string', () => {
        assert(reversedCodeUnitStr.length > 0);
        const compressed = lzjs.compress(reversedCodeUnitStr);
        assert(compressed.length > 0);
        const decompressed = lzjs.decompress(compressed);
        assert.equal(decompressed, reversedCodeUnitStr);
      });
    });

    describe('Unicode characters [U+0000 - U+FFFF]', () => {
      let codeUnitChars = null;

      beforeEach(() => {
        codeUnitChars = [];
        for (let i = 0; i <= 0xffff; i += 32) {
          codeUnitChars.push(new Array(100).join(String.fromCharCode(i)));
        }
      });

      afterEach(() => {
        codeUnitChars = null;
      });

      it('should correctly compress and decompress Unicode characters', () => {
        codeUnitChars.forEach((c) => {
          assert(c.length > 0);
          const compressed = lzjs.compress(c);
          assert(compressed.length > 0);
          const decompressed = lzjs.decompress(compressed);
          assert.equal(decompressed, c);

          const repeatedChars = new Array(10).join(c);
          assert.equal(lzjs.decompress(lzjs.compress(repeatedChars)), repeatedChars);
        });
      });
    });

    describe('Repeated characters', () => {
      let asciiBits = null;
      let nonAsciiBits = null;

      beforeEach(() => {
        asciiBits = [];

        // Make repeated characters for a specific number of times
        const max = 60 * (60 + 1);
        const bits = [59, 60, 61, max - 1, max, max + 1];
        for (let i = 0; i < bits.length; i++) {
          asciiBits.push(new Array(bits[i] + 1).join('a'));
        }

        nonAsciiBits = [];
        for (let i = 0; i < bits.length; i++) {
          nonAsciiBits.push(new Array(bits[i] + 1).join('a\u3042'));
          nonAsciiBits.push(new Array(bits[i] + 1).join('\u3042'));
          nonAsciiBits.push(new Array(bits[i] + 1).join('\u3042a'));
        }
      });

      afterEach(() => {
        asciiBits = null;
        nonAsciiBits = null;
      });

      it('should correctly compress and decompress repeated ASCII characters', () => {
        asciiBits.forEach((c) => {
          assert(c.length > 0);
          const compressed = lzjs.compress(c);
          assert(compressed.length > 0);
          const decompressed = lzjs.decompress(compressed);
          assert.equal(decompressed, c);
        });
      });

      it('should correctly compress and decompress repeated non-ASCII characters', () => {
        nonAsciiBits.forEach((c) => {
          assert(c.length > 0);
          const compressed = lzjs.compress(c);
          assert(compressed.length > 0);
          const decompressed = lzjs.decompress(compressed);
          assert.equal(decompressed, c);
        });
      });
    });

    describe('ASCII string and Buffer', () => {
      let sampleStr = null;

      beforeEach(() => {
        sampleStr = 'Lorem ipsum dolor sit amet, Consectetur adipiscing. 123!@#$';
      });

      afterEach(() => {
        sampleStr = null;
      });

      it('should correctly compress and decompress sample string', () => {
        assert(sampleStr.length > 0);
        const compressed = lzjs.compress(sampleStr);
        assert(compressed.length > 0);
        const decompressed = lzjs.decompress(compressed);
        assert.equal(decompressed, sampleStr);
      });

      it('should correctly compress and decompress Buffer', () => {
        const sampleBuffer = Buffer.from(sampleStr);
        assert(sampleBuffer.length > 0);
        const compressed = lzjs.compress(sampleBuffer);
        assert(compressed.length > 0);
        const decompressed = lzjs.decompress(compressed);
        assert.equal(decompressed.toString(), sampleStr);
      });
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
