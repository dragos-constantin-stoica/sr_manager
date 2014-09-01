(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
global.List = require("pouchdb-list");
global.Rewrite = require("pouchdb-rewrite");
global.Show = require("pouchdb-show");
global.Update = require("pouchdb-update");
global.Validation = require("pouchdb-validation");

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"pouchdb-list":26,"pouchdb-rewrite":97,"pouchdb-show":143,"pouchdb-update":213,"pouchdb-validation":280}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * If `Buffer._useTypedArrays`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (compatible down to IE6)
 */
Buffer._useTypedArrays = (function () {
  // Detect if browser supports Typed Arrays. Supported browsers are IE 10+, Firefox 4+,
  // Chrome 7+, Safari 5.1+, Opera 11.6+, iOS 4.2+. If the browser does not support adding
  // properties to `Uint8Array` instances, then that's the same as no `Uint8Array` support
  // because we need to be able to add all the node Buffer API methods. This is an issue
  // in Firefox 4-29. Now fixed: https://bugzilla.mozilla.org/show_bug.cgi?id=695438
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() &&
        typeof arr.subarray === 'function' // Chrome 9-10 lack `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Workaround: node's base64 implementation allows for non-padded strings
  // while base64-js does not.
  if (encoding === 'base64' && type === 'string') {
    subject = stringtrim(subject)
    while (subject.length % 4 !== 0) {
      subject = subject + '='
    }
  }

  // Find the length
  var length
  if (type === 'number')
    length = coerce(subject)
  else if (type === 'string')
    length = Buffer.byteLength(subject, encoding)
  else if (type === 'object')
    length = coerce(subject.length) // assume that object is array-like
  else
    throw new Error('First argument needs to be a number, array or string.')

  var buf
  if (Buffer._useTypedArrays) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer._useTypedArrays && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    if (Buffer.isBuffer(subject)) {
      for (i = 0; i < length; i++)
        buf[i] = subject.readUInt8(i)
    } else {
      for (i = 0; i < length; i++)
        buf[i] = ((subject[i] % 256) + 256) % 256
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer._useTypedArrays && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.isBuffer = function (b) {
  return !!(b !== null && b !== undefined && b._isBuffer)
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str.toString()
  switch (encoding || 'utf8') {
    case 'hex':
      ret = str.length / 2
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.concat = function (list, totalLength) {
  assert(isArray(list), 'Usage: Buffer.concat(list[, length])')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (totalLength === undefined) {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

Buffer.compare = function (a, b) {
  assert(Buffer.isBuffer(a) && Buffer.isBuffer(b), 'Arguments must be Buffers')
  var x = a.length
  var y = b.length
  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
  if (i !== len) {
    x = a[i]
    y = b[i]
  }
  if (x < y) {
    return -1
  }
  if (y < x) {
    return 1
  }
  return 0
}

// BUFFER INSTANCE METHODS
// =======================

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  assert(strLen % 2 === 0, 'Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    assert(!isNaN(byte), 'Invalid hex string')
    buf[offset + i] = byte
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function asciiWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function utf16leWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leWrite(this, string, offset, length)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toString = function (encoding, start, end) {
  var self = this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end === undefined) ? self.length : Number(end)

  // Fastpath empty strings
  if (end === start)
    return ''

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexSlice(self, start, end)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Slice(self, start, end)
      break
    case 'ascii':
      ret = asciiSlice(self, start, end)
      break
    case 'binary':
      ret = binarySlice(self, start, end)
      break
    case 'base64':
      ret = base64Slice(self, start, end)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leSlice(self, start, end)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

Buffer.prototype.equals = function (b) {
  assert(Buffer.isBuffer(b), 'Argument must be a Buffer')
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.compare = function (b) {
  assert(Buffer.isBuffer(b), 'Argument must be a Buffer')
  return Buffer.compare(this, b)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  assert(end >= start, 'sourceEnd < sourceStart')
  assert(target_start >= 0 && target_start < target.length,
      'targetStart out of bounds')
  assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
  assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 100 || !Buffer._useTypedArrays) {
    for (var i = 0; i < len; i++) {
      target[i + target_start] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function binarySlice (buf, start, end) {
  return asciiSlice(buf, start, end)
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = clamp(start, len, 0)
  end = clamp(end, len, len)

  if (Buffer._useTypedArrays) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  return this[offset]
}

function readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    val = buf[offset]
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
  } else {
    val = buf[offset] << 8
    if (offset + 1 < len)
      val |= buf[offset + 1]
  }
  return val
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  return readUInt16(this, offset, true, noAssert)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  return readUInt16(this, offset, false, noAssert)
}

function readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    if (offset + 2 < len)
      val = buf[offset + 2] << 16
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
    val |= buf[offset]
    if (offset + 3 < len)
      val = val + (buf[offset + 3] << 24 >>> 0)
  } else {
    if (offset + 1 < len)
      val = buf[offset + 1] << 16
    if (offset + 2 < len)
      val |= buf[offset + 2] << 8
    if (offset + 3 < len)
      val |= buf[offset + 3]
    val = val + (buf[offset] << 24 >>> 0)
  }
  return val
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  return readUInt32(this, offset, true, noAssert)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  return readUInt32(this, offset, false, noAssert)
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  var neg = this[offset] & 0x80
  if (neg)
    return (0xff - this[offset] + 1) * -1
  else
    return this[offset]
}

function readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = readUInt16(buf, offset, littleEndian, true)
  var neg = val & 0x8000
  if (neg)
    return (0xffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  return readInt16(this, offset, true, noAssert)
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  return readInt16(this, offset, false, noAssert)
}

function readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = readUInt32(buf, offset, littleEndian, true)
  var neg = val & 0x80000000
  if (neg)
    return (0xffffffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  return readInt32(this, offset, true, noAssert)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  return readInt32(this, offset, false, noAssert)
}

function readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 23, 4)
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  return readFloat(this, offset, true, noAssert)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  return readFloat(this, offset, false, noAssert)
}

function readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 52, 8)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  return readDouble(this, offset, true, noAssert)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  return readDouble(this, offset, false, noAssert)
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= this.length) return

  this[offset] = value
  return offset + 1
}

function writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
    buf[offset + i] =
        (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
            (littleEndian ? i : 1 - i) * 8
  }
  return offset + 2
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  return writeUInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  return writeUInt16(this, value, offset, false, noAssert)
}

function writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
    buf[offset + i] =
        (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
  return offset + 4
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  return writeUInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  return writeUInt32(this, value, offset, false, noAssert)
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= this.length)
    return

  if (value >= 0)
    this.writeUInt8(value, offset, noAssert)
  else
    this.writeUInt8(0xff + value + 1, offset, noAssert)
  return offset + 1
}

function writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    writeUInt16(buf, value, offset, littleEndian, noAssert)
  else
    writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
  return offset + 2
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  return writeInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  return writeInt16(this, value, offset, false, noAssert)
}

function writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    writeUInt32(buf, value, offset, littleEndian, noAssert)
  else
    writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
  return offset + 4
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  return writeInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  return writeInt32(this, value, offset, false, noAssert)
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  assert(end >= start, 'end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  assert(start >= 0 && start < this.length, 'start out of bounds')
  assert(end >= 0 && end <= this.length, 'end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

Buffer.prototype.inspect = function () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer._useTypedArrays) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new Error('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

// slice(start, end)
function clamp (index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function coerce (length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length)
  return length < 0 ? 0 : length
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F) {
      byteArray.push(b)
    } else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++) {
        byteArray.push(parseInt(h[j], 16))
      }
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 */
function verifuint (value, max) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifsint (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754 (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

},{"base64-js":4,"ieee754":5}],4:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS)
			return 62 // '+'
		if (code === SLASH)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],5:[function(require,module,exports){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],6:[function(require,module,exports){
(function (Buffer){
var createHash = require('sha.js')

var md5 = toConstructor(require('./md5'))
var rmd160 = toConstructor(require('ripemd160'))

function toConstructor (fn) {
  return function () {
    var buffers = []
    var m= {
      update: function (data, enc) {
        if(!Buffer.isBuffer(data)) data = new Buffer(data, enc)
        buffers.push(data)
        return this
      },
      digest: function (enc) {
        var buf = Buffer.concat(buffers)
        var r = fn(buf)
        buffers = null
        return enc ? r.toString(enc) : r
      }
    }
    return m
  }
}

module.exports = function (alg) {
  if('md5' === alg) return new md5()
  if('rmd160' === alg) return new rmd160()
  return createHash(alg)
}

}).call(this,require("buffer").Buffer)
},{"./md5":10,"buffer":3,"ripemd160":11,"sha.js":13}],7:[function(require,module,exports){
(function (Buffer){
var createHash = require('./create-hash')

var blocksize = 64
var zeroBuffer = new Buffer(blocksize); zeroBuffer.fill(0)

module.exports = Hmac

function Hmac (alg, key) {
  if(!(this instanceof Hmac)) return new Hmac(alg, key)
  this._opad = opad
  this._alg = alg

  key = this._key = !Buffer.isBuffer(key) ? new Buffer(key) : key

  if(key.length > blocksize) {
    key = createHash(alg).update(key).digest()
  } else if(key.length < blocksize) {
    key = Buffer.concat([key, zeroBuffer], blocksize)
  }

  var ipad = this._ipad = new Buffer(blocksize)
  var opad = this._opad = new Buffer(blocksize)

  for(var i = 0; i < blocksize; i++) {
    ipad[i] = key[i] ^ 0x36
    opad[i] = key[i] ^ 0x5C
  }

  this._hash = createHash(alg).update(ipad)
}

Hmac.prototype.update = function (data, enc) {
  this._hash.update(data, enc)
  return this
}

Hmac.prototype.digest = function (enc) {
  var h = this._hash.digest()
  return createHash(this._alg).update(this._opad).update(h).digest(enc)
}


}).call(this,require("buffer").Buffer)
},{"./create-hash":6,"buffer":3}],8:[function(require,module,exports){
(function (Buffer){
var intSize = 4;
var zeroBuffer = new Buffer(intSize); zeroBuffer.fill(0);
var chrsz = 8;

function toArray(buf, bigEndian) {
  if ((buf.length % intSize) !== 0) {
    var len = buf.length + (intSize - (buf.length % intSize));
    buf = Buffer.concat([buf, zeroBuffer], len);
  }

  var arr = [];
  var fn = bigEndian ? buf.readInt32BE : buf.readInt32LE;
  for (var i = 0; i < buf.length; i += intSize) {
    arr.push(fn.call(buf, i));
  }
  return arr;
}

function toBuffer(arr, size, bigEndian) {
  var buf = new Buffer(size);
  var fn = bigEndian ? buf.writeInt32BE : buf.writeInt32LE;
  for (var i = 0; i < arr.length; i++) {
    fn.call(buf, arr[i], i * 4, true);
  }
  return buf;
}

function hash(buf, fn, hashSize, bigEndian) {
  if (!Buffer.isBuffer(buf)) buf = new Buffer(buf);
  var arr = fn(toArray(buf, bigEndian), buf.length * chrsz);
  return toBuffer(arr, hashSize, bigEndian);
}

module.exports = { hash: hash };

}).call(this,require("buffer").Buffer)
},{"buffer":3}],9:[function(require,module,exports){
(function (Buffer){
var rng = require('./rng')

function error () {
  var m = [].slice.call(arguments).join(' ')
  throw new Error([
    m,
    'we accept pull requests',
    'http://github.com/dominictarr/crypto-browserify'
    ].join('\n'))
}

exports.createHash = require('./create-hash')

exports.createHmac = require('./create-hmac')

exports.randomBytes = function(size, callback) {
  if (callback && callback.call) {
    try {
      callback.call(this, undefined, new Buffer(rng(size)))
    } catch (err) { callback(err) }
  } else {
    return new Buffer(rng(size))
  }
}

function each(a, f) {
  for(var i in a)
    f(a[i], i)
}

exports.getHashes = function () {
  return ['sha1', 'sha256', 'md5', 'rmd160']

}

var p = require('./pbkdf2')(exports.createHmac)
exports.pbkdf2 = p.pbkdf2
exports.pbkdf2Sync = p.pbkdf2Sync


// the least I can do is make error messages for the rest of the node.js/crypto api.
each(['createCredentials'
, 'createCipher'
, 'createCipheriv'
, 'createDecipher'
, 'createDecipheriv'
, 'createSign'
, 'createVerify'
, 'createDiffieHellman'
], function (name) {
  exports[name] = function () {
    error('sorry,', name, 'is not implemented yet')
  }
})

}).call(this,require("buffer").Buffer)
},{"./create-hash":6,"./create-hmac":7,"./pbkdf2":17,"./rng":18,"buffer":3}],10:[function(require,module,exports){
/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

var helpers = require('./helpers');

/*
 * Calculate the MD5 of an array of little-endian words, and a bit length
 */
function core_md5(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << ((len) % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;

    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
  }
  return Array(a, b, c, d);

}

/*
 * These functions implement the four basic operations the algorithm uses.
 */
function md5_cmn(q, a, b, x, s, t)
{
  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
}
function md5_ff(a, b, c, d, x, s, t)
{
  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function md5_gg(a, b, c, d, x, s, t)
{
  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function md5_hh(a, b, c, d, x, s, t)
{
  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5_ii(a, b, c, d, x, s, t)
{
  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function bit_rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

module.exports = function md5(buf) {
  return helpers.hash(buf, core_md5, 16);
};

},{"./helpers":8}],11:[function(require,module,exports){
(function (Buffer){

module.exports = ripemd160



/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
/** @preserve
(c) 2012 by Cédric Mesnil. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

    - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

// Constants table
var zl = [
    0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
    7,  4, 13,  1, 10,  6, 15,  3, 12,  0,  9,  5,  2, 14, 11,  8,
    3, 10, 14,  4,  9, 15,  8,  1,  2,  7,  0,  6, 13, 11,  5, 12,
    1,  9, 11, 10,  0,  8, 12,  4, 13,  3,  7, 15, 14,  5,  6,  2,
    4,  0,  5,  9,  7, 12,  2, 10, 14,  1,  3,  8, 11,  6, 15, 13];
var zr = [
    5, 14,  7,  0,  9,  2, 11,  4, 13,  6, 15,  8,  1, 10,  3, 12,
    6, 11,  3,  7,  0, 13,  5, 10, 14, 15,  8, 12,  4,  9,  1,  2,
    15,  5,  1,  3,  7, 14,  6,  9, 11,  8, 12,  2, 10,  0,  4, 13,
    8,  6,  4,  1,  3, 11, 15,  0,  5, 12,  2, 13,  9,  7, 10, 14,
    12, 15, 10,  4,  1,  5,  8,  7,  6,  2, 13, 14,  0,  3,  9, 11];
var sl = [
     11, 14, 15, 12,  5,  8,  7,  9, 11, 13, 14, 15,  6,  7,  9,  8,
    7, 6,   8, 13, 11,  9,  7, 15,  7, 12, 15,  9, 11,  7, 13, 12,
    11, 13,  6,  7, 14,  9, 13, 15, 14,  8, 13,  6,  5, 12,  7,  5,
      11, 12, 14, 15, 14, 15,  9,  8,  9, 14,  5,  6,  8,  6,  5, 12,
    9, 15,  5, 11,  6,  8, 13, 12,  5, 12, 13, 14, 11,  8,  5,  6 ];
var sr = [
    8,  9,  9, 11, 13, 15, 15,  5,  7,  7,  8, 11, 14, 14, 12,  6,
    9, 13, 15,  7, 12,  8,  9, 11,  7,  7, 12,  7,  6, 15, 13, 11,
    9,  7, 15, 11,  8,  6,  6, 14, 12, 13,  5, 14, 13, 13,  7,  5,
    15,  5,  8, 11, 14, 14,  6, 14,  6,  9, 12,  9, 12,  5, 15,  8,
    8,  5, 12,  9, 12,  5, 14,  6,  8, 13,  6,  5, 15, 13, 11, 11 ];

var hl =  [ 0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E];
var hr =  [ 0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000];

var bytesToWords = function (bytes) {
  var words = [];
  for (var i = 0, b = 0; i < bytes.length; i++, b += 8) {
    words[b >>> 5] |= bytes[i] << (24 - b % 32);
  }
  return words;
};

var wordsToBytes = function (words) {
  var bytes = [];
  for (var b = 0; b < words.length * 32; b += 8) {
    bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
  }
  return bytes;
};

var processBlock = function (H, M, offset) {

  // Swap endian
  for (var i = 0; i < 16; i++) {
    var offset_i = offset + i;
    var M_offset_i = M[offset_i];

    // Swap
    M[offset_i] = (
        (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
        (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
    );
  }

  // Working variables
  var al, bl, cl, dl, el;
  var ar, br, cr, dr, er;

  ar = al = H[0];
  br = bl = H[1];
  cr = cl = H[2];
  dr = dl = H[3];
  er = el = H[4];
  // Computation
  var t;
  for (var i = 0; i < 80; i += 1) {
    t = (al +  M[offset+zl[i]])|0;
    if (i<16){
        t +=  f1(bl,cl,dl) + hl[0];
    } else if (i<32) {
        t +=  f2(bl,cl,dl) + hl[1];
    } else if (i<48) {
        t +=  f3(bl,cl,dl) + hl[2];
    } else if (i<64) {
        t +=  f4(bl,cl,dl) + hl[3];
    } else {// if (i<80) {
        t +=  f5(bl,cl,dl) + hl[4];
    }
    t = t|0;
    t =  rotl(t,sl[i]);
    t = (t+el)|0;
    al = el;
    el = dl;
    dl = rotl(cl, 10);
    cl = bl;
    bl = t;

    t = (ar + M[offset+zr[i]])|0;
    if (i<16){
        t +=  f5(br,cr,dr) + hr[0];
    } else if (i<32) {
        t +=  f4(br,cr,dr) + hr[1];
    } else if (i<48) {
        t +=  f3(br,cr,dr) + hr[2];
    } else if (i<64) {
        t +=  f2(br,cr,dr) + hr[3];
    } else {// if (i<80) {
        t +=  f1(br,cr,dr) + hr[4];
    }
    t = t|0;
    t =  rotl(t,sr[i]) ;
    t = (t+er)|0;
    ar = er;
    er = dr;
    dr = rotl(cr, 10);
    cr = br;
    br = t;
  }
  // Intermediate hash value
  t    = (H[1] + cl + dr)|0;
  H[1] = (H[2] + dl + er)|0;
  H[2] = (H[3] + el + ar)|0;
  H[3] = (H[4] + al + br)|0;
  H[4] = (H[0] + bl + cr)|0;
  H[0] =  t;
};

function f1(x, y, z) {
  return ((x) ^ (y) ^ (z));
}

function f2(x, y, z) {
  return (((x)&(y)) | ((~x)&(z)));
}

function f3(x, y, z) {
  return (((x) | (~(y))) ^ (z));
}

function f4(x, y, z) {
  return (((x) & (z)) | ((y)&(~(z))));
}

function f5(x, y, z) {
  return ((x) ^ ((y) |(~(z))));
}

function rotl(x,n) {
  return (x<<n) | (x>>>(32-n));
}

function ripemd160(message) {
  var H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];

  if (typeof message == 'string')
    message = new Buffer(message, 'utf8');

  var m = bytesToWords(message);

  var nBitsLeft = message.length * 8;
  var nBitsTotal = message.length * 8;

  // Add padding
  m[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
  m[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
      (((nBitsTotal << 8)  | (nBitsTotal >>> 24)) & 0x00ff00ff) |
      (((nBitsTotal << 24) | (nBitsTotal >>> 8))  & 0xff00ff00)
  );

  for (var i=0 ; i<m.length; i += 16) {
    processBlock(H, m, i);
  }

  // Swap endian
  for (var i = 0; i < 5; i++) {
      // Shortcut
    var H_i = H[i];

    // Swap
    H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
          (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
  }

  var digestbytes = wordsToBytes(H);
  return new Buffer(digestbytes);
}



}).call(this,require("buffer").Buffer)
},{"buffer":3}],12:[function(require,module,exports){
var u = require('./util')
var write = u.write
var fill = u.zeroFill

module.exports = function (Buffer) {

  //prototype class for hash functions
  function Hash (blockSize, finalSize) {
    this._block = new Buffer(blockSize) //new Uint32Array(blockSize/4)
    this._finalSize = finalSize
    this._blockSize = blockSize
    this._len = 0
    this._s = 0
  }

  Hash.prototype.init = function () {
    this._s = 0
    this._len = 0
  }

  function lengthOf(data, enc) {
    if(enc == null)     return data.byteLength || data.length
    if(enc == 'ascii' || enc == 'binary')  return data.length
    if(enc == 'hex')    return data.length/2
    if(enc == 'base64') return data.length/3
  }

  Hash.prototype.update = function (data, enc) {
    var bl = this._blockSize

    //I'd rather do this with a streaming encoder, like the opposite of
    //http://nodejs.org/api/string_decoder.html
    var length
      if(!enc && 'string' === typeof data)
        enc = 'utf8'

    if(enc) {
      if(enc === 'utf-8')
        enc = 'utf8'

      if(enc === 'base64' || enc === 'utf8')
        data = new Buffer(data, enc), enc = null

      length = lengthOf(data, enc)
    } else
      length = data.byteLength || data.length

    var l = this._len += length
    var s = this._s = (this._s || 0)
    var f = 0
    var buffer = this._block
    while(s < l) {
      var t = Math.min(length, f + bl)
      write(buffer, data, enc, s%bl, f, t)
      var ch = (t - f);
      s += ch; f += ch

      if(!(s%bl))
        this._update(buffer)
    }
    this._s = s

    return this

  }

  Hash.prototype.digest = function (enc) {
    var bl = this._blockSize
    var fl = this._finalSize
    var len = this._len*8

    var x = this._block

    var bits = len % (bl*8)

    //add end marker, so that appending 0's creats a different hash.
    x[this._len % bl] = 0x80
    fill(this._block, this._len % bl + 1)

    if(bits >= fl*8) {
      this._update(this._block)
      u.zeroFill(this._block, 0)
    }

    //TODO: handle case where the bit length is > Math.pow(2, 29)
    x.writeInt32BE(len, fl + 4) //big endian

    var hash = this._update(this._block) || this._hash()
    if(enc == null) return hash
    return hash.toString(enc)
  }

  Hash.prototype._update = function () {
    throw new Error('_update must be implemented by subclass')
  }

  return Hash
}

},{"./util":16}],13:[function(require,module,exports){
var exports = module.exports = function (alg) {
  var Alg = exports[alg]
  if(!Alg) throw new Error(alg + ' is not supported (we accept pull requests)')
  return new Alg()
}

var Buffer = require('buffer').Buffer
var Hash   = require('./hash')(Buffer)

exports.sha =
exports.sha1 = require('./sha1')(Buffer, Hash)
exports.sha256 = require('./sha256')(Buffer, Hash)

},{"./hash":12,"./sha1":14,"./sha256":15,"buffer":3}],14:[function(require,module,exports){
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */
module.exports = function (Buffer, Hash) {

  var inherits = require('util').inherits

  inherits(Sha1, Hash)

  var A = 0|0
  var B = 4|0
  var C = 8|0
  var D = 12|0
  var E = 16|0

  var BE = false
  var LE = true

  var W = new Int32Array(80)

  var POOL = []

  function Sha1 () {
    if(POOL.length)
      return POOL.pop().init()

    if(!(this instanceof Sha1)) return new Sha1()
    this._w = W
    Hash.call(this, 16*4, 14*4)
  
    this._h = null
    this.init()
  }

  Sha1.prototype.init = function () {
    this._a = 0x67452301
    this._b = 0xefcdab89
    this._c = 0x98badcfe
    this._d = 0x10325476
    this._e = 0xc3d2e1f0

    Hash.prototype.init.call(this)
    return this
  }

  Sha1.prototype._POOL = POOL

  // assume that array is a Uint32Array with length=16,
  // and that if it is the last block, it already has the length and the 1 bit appended.


  var isDV = new Buffer(1) instanceof DataView
  function readInt32BE (X, i) {
    return isDV
      ? X.getInt32(i, false)
      : X.readInt32BE(i)
  }

  Sha1.prototype._update = function (array) {

    var X = this._block
    var h = this._h
    var a, b, c, d, e, _a, _b, _c, _d, _e

    a = _a = this._a
    b = _b = this._b
    c = _c = this._c
    d = _d = this._d
    e = _e = this._e

    var w = this._w

    for(var j = 0; j < 80; j++) {
      var W = w[j]
        = j < 16
        //? X.getInt32(j*4, false)
        //? readInt32BE(X, j*4) //*/ X.readInt32BE(j*4) //*/
        ? X.readInt32BE(j*4)
        : rol(w[j - 3] ^ w[j -  8] ^ w[j - 14] ^ w[j - 16], 1)

      var t =
        add(
          add(rol(a, 5), sha1_ft(j, b, c, d)),
          add(add(e, W), sha1_kt(j))
        );

      e = d
      d = c
      c = rol(b, 30)
      b = a
      a = t
    }

    this._a = add(a, _a)
    this._b = add(b, _b)
    this._c = add(c, _c)
    this._d = add(d, _d)
    this._e = add(e, _e)
  }

  Sha1.prototype._hash = function () {
    if(POOL.length < 100) POOL.push(this)
    var H = new Buffer(20)
    //console.log(this._a|0, this._b|0, this._c|0, this._d|0, this._e|0)
    H.writeInt32BE(this._a|0, A)
    H.writeInt32BE(this._b|0, B)
    H.writeInt32BE(this._c|0, C)
    H.writeInt32BE(this._d|0, D)
    H.writeInt32BE(this._e|0, E)
    return H
  }

  /*
   * Perform the appropriate triplet combination function for the current
   * iteration
   */
  function sha1_ft(t, b, c, d) {
    if(t < 20) return (b & c) | ((~b) & d);
    if(t < 40) return b ^ c ^ d;
    if(t < 60) return (b & c) | (b & d) | (c & d);
    return b ^ c ^ d;
  }

  /*
   * Determine the appropriate additive constant for the current iteration
   */
  function sha1_kt(t) {
    return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
           (t < 60) ? -1894007588 : -899497514;
  }

  /*
   * Add integers, wrapping at 2^32. This uses 16-bit operations internally
   * to work around bugs in some JS interpreters.
   * //dominictarr: this is 10 years old, so maybe this can be dropped?)
   *
   */
  function add(x, y) {
    return (x + y ) | 0
  //lets see how this goes on testling.
  //  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  //  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  //  return (msw << 16) | (lsw & 0xFFFF);
  }

  /*
   * Bitwise rotate a 32-bit number to the left.
   */
  function rol(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
  }

  return Sha1
}

},{"util":25}],15:[function(require,module,exports){

/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
 * in FIPS 180-2
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 *
 */

var inherits = require('util').inherits
var BE       = false
var LE       = true
var u        = require('./util')

module.exports = function (Buffer, Hash) {

  var K = [
      0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
      0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
      0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
      0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
      0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
      0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
      0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
      0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
      0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
      0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
      0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
      0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
      0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
      0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
      0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
      0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
    ]

  inherits(Sha256, Hash)
  var W = new Array(64)
  var POOL = []
  function Sha256() {
    if(POOL.length) {
      //return POOL.shift().init()
    }
    //this._data = new Buffer(32)

    this.init()

    this._w = W //new Array(64)

    Hash.call(this, 16*4, 14*4)
  };

  Sha256.prototype.init = function () {

    this._a = 0x6a09e667|0
    this._b = 0xbb67ae85|0
    this._c = 0x3c6ef372|0
    this._d = 0xa54ff53a|0
    this._e = 0x510e527f|0
    this._f = 0x9b05688c|0
    this._g = 0x1f83d9ab|0
    this._h = 0x5be0cd19|0

    this._len = this._s = 0

    return this
  }

  var safe_add = function(x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  }

  function S (X, n) {
    return (X >>> n) | (X << (32 - n));
  }

  function R (X, n) {
    return (X >>> n);
  }

  function Ch (x, y, z) {
    return ((x & y) ^ ((~x) & z));
  }

  function Maj (x, y, z) {
    return ((x & y) ^ (x & z) ^ (y & z));
  }

  function Sigma0256 (x) {
    return (S(x, 2) ^ S(x, 13) ^ S(x, 22));
  }

  function Sigma1256 (x) {
    return (S(x, 6) ^ S(x, 11) ^ S(x, 25));
  }

  function Gamma0256 (x) {
    return (S(x, 7) ^ S(x, 18) ^ R(x, 3));
  }

  function Gamma1256 (x) {
    return (S(x, 17) ^ S(x, 19) ^ R(x, 10));
  }

  Sha256.prototype._update = function(m) {
    var M = this._block
    var W = this._w
    var a, b, c, d, e, f, g, h
    var T1, T2

    a = this._a | 0
    b = this._b | 0
    c = this._c | 0
    d = this._d | 0
    e = this._e | 0
    f = this._f | 0
    g = this._g | 0
    h = this._h | 0

    for (var j = 0; j < 64; j++) {
      var w = W[j] = j < 16
        ? M.readInt32BE(j * 4)
        : Gamma1256(W[j - 2]) + W[j - 7] + Gamma0256(W[j - 15]) + W[j - 16]

      T1 = h + Sigma1256(e) + Ch(e, f, g) + K[j] + w

      T2 = Sigma0256(a) + Maj(a, b, c);
      h = g; g = f; f = e; e = d + T1; d = c; c = b; b = a; a = T1 + T2;
    }

    this._a = (a + this._a) | 0
    this._b = (b + this._b) | 0
    this._c = (c + this._c) | 0
    this._d = (d + this._d) | 0
    this._e = (e + this._e) | 0
    this._f = (f + this._f) | 0
    this._g = (g + this._g) | 0
    this._h = (h + this._h) | 0

  };

  Sha256.prototype._hash = function () {
    if(POOL.length < 10)
      POOL.push(this)

    var H = new Buffer(32)

    H.writeInt32BE(this._a,  0)
    H.writeInt32BE(this._b,  4)
    H.writeInt32BE(this._c,  8)
    H.writeInt32BE(this._d, 12)
    H.writeInt32BE(this._e, 16)
    H.writeInt32BE(this._f, 20)
    H.writeInt32BE(this._g, 24)
    H.writeInt32BE(this._h, 28)

    return H
  }

  return Sha256

}

},{"./util":16,"util":25}],16:[function(require,module,exports){
exports.write = write
exports.zeroFill = zeroFill

exports.toString = toString

function write (buffer, string, enc, start, from, to, LE) {
  var l = (to - from)
  if(enc === 'ascii' || enc === 'binary') {
    for( var i = 0; i < l; i++) {
      buffer[start + i] = string.charCodeAt(i + from)
    }
  }
  else if(enc == null) {
    for( var i = 0; i < l; i++) {
      buffer[start + i] = string[i + from]
    }
  }
  else if(enc === 'hex') {
    for(var i = 0; i < l; i++) {
      var j = from + i
      buffer[start + i] = parseInt(string[j*2] + string[(j*2)+1], 16)
    }
  }
  else if(enc === 'base64') {
    throw new Error('base64 encoding not yet supported')
  }
  else
    throw new Error(enc +' encoding not yet supported')
}

//always fill to the end!
function zeroFill(buf, from) {
  for(var i = from; i < buf.length; i++)
    buf[i] = 0
}


},{}],17:[function(require,module,exports){
(function (Buffer){
// JavaScript PBKDF2 Implementation
// Based on http://git.io/qsv2zw
// Licensed under LGPL v3
// Copyright (c) 2013 jduncanator

var blocksize = 64
var zeroBuffer = new Buffer(blocksize); zeroBuffer.fill(0)

module.exports = function (createHmac, exports) {
  exports = exports || {}

  exports.pbkdf2 = function(password, salt, iterations, keylen, cb) {
    if('function' !== typeof cb)
      throw new Error('No callback provided to pbkdf2');
    setTimeout(function () {
      cb(null, exports.pbkdf2Sync(password, salt, iterations, keylen))
    })
  }

  exports.pbkdf2Sync = function(key, salt, iterations, keylen) {
    if('number' !== typeof iterations)
      throw new TypeError('Iterations not a number')
    if(iterations < 0)
      throw new TypeError('Bad iterations')
    if('number' !== typeof keylen)
      throw new TypeError('Key length not a number')
    if(keylen < 0)
      throw new TypeError('Bad key length')

    //stretch key to the correct length that hmac wants it,
    //otherwise this will happen every time hmac is called
    //twice per iteration.
    var key = !Buffer.isBuffer(key) ? new Buffer(key) : key

    if(key.length > blocksize) {
      key = createHash(alg).update(key).digest()
    } else if(key.length < blocksize) {
      key = Buffer.concat([key, zeroBuffer], blocksize)
    }

    var HMAC;
    var cplen, p = 0, i = 1, itmp = new Buffer(4), digtmp;
    var out = new Buffer(keylen);
    out.fill(0);
    while(keylen) {
      if(keylen > 20)
        cplen = 20;
      else
        cplen = keylen;

      /* We are unlikely to ever use more than 256 blocks (5120 bits!)
         * but just in case...
         */
        itmp[0] = (i >> 24) & 0xff;
        itmp[1] = (i >> 16) & 0xff;
          itmp[2] = (i >> 8) & 0xff;
          itmp[3] = i & 0xff;

          HMAC = createHmac('sha1', key);
          HMAC.update(salt)
          HMAC.update(itmp);
        digtmp = HMAC.digest();
        digtmp.copy(out, p, 0, cplen);

        for(var j = 1; j < iterations; j++) {
          HMAC = createHmac('sha1', key);
          HMAC.update(digtmp);
          digtmp = HMAC.digest();
          for(var k = 0; k < cplen; k++) {
            out[k] ^= digtmp[k];
          }
        }
      keylen -= cplen;
      i++;
      p += cplen;
    }

    return out;
  }

  return exports
}

}).call(this,require("buffer").Buffer)
},{"buffer":3}],18:[function(require,module,exports){
(function (Buffer){
// Original code adapted from Robert Kieffer.
// details at https://github.com/broofa/node-uuid


(function() {
  var _global = this;

  var mathRNG, whatwgRNG;

  // NOTE: Math.random() does not guarantee "cryptographic quality"
  mathRNG = function(size) {
    var bytes = new Buffer(size);
    var r;

    for (var i = 0, r; i < size; i++) {
      if ((i & 0x03) == 0) r = Math.random() * 0x100000000;
      bytes[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return bytes;
  }

  if (_global.crypto && crypto.getRandomValues) {
    whatwgRNG = function(size) {
      var bytes = new Buffer(size); //in browserify, this is an extended Uint8Array
      crypto.getRandomValues(bytes);
      return bytes;
    }
  }

  module.exports = whatwgRNG || mathRNG;

}())

}).call(this,require("buffer").Buffer)
},{"buffer":3}],19:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],20:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],21:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],22:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],23:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":21,"./encode":22}],24:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],25:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require("FWaASH"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":24,"FWaASH":20,"inherits":19}],26:[function(require,module,exports){
/*
  Copyright 2013-2014, Marten de Vries

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

"use strict";

var extend = require("extend");
var nodify = require("promise-nodify");
var Promise = require("pouchdb-promise");

var couchdb_objects = require("couchdb-objects");
var render = require("couchdb-render");
var httpQuery = require("pouchdb-req-http-query");

exports.list = function (listPath, options, callback) {
  //options: values to end up in the request object of the list
  //function (next to their defaults).
  var db = this;

  if (["function", "undefined"].indexOf(typeof options) !== -1) {
    callback = options;
    options = {};
  }
  var designDocName = listPath.split("/")[0];
  var listName = listPath.split("/")[1];
  var viewName = listPath.split("/")[2];

  //build request object
  var pathEnd = ["_design", designDocName, "_list", listName];
  if (viewName) {
    pathEnd.push(viewName);
  }
  var reqPromise = couchdb_objects.buildRequestObject(db, pathEnd, options);
  return reqPromise.then(function (req) {
    var promise;
    if (["http", "https"].indexOf(db.type()) === -1) {
      promise = offlineQuery(db, designDocName, listName, viewName, req, options);
    } else {
      promise = httpQuery(db, req);
    }
    nodify(promise, callback);
    return promise;
  });
};

function offlineQuery(db, designDocName, listName, viewName, req, options) {
  if (req.headers["Content-Type"] && req.headers["Content-Type"] !== "application/json") {
    return Promise.reject({
      status: 400,
      name: "bad_request",
      message: "invalid_json"
    });
  }

  //get the data involved.
  var ddocPromise = db.get("_design/" + designDocName).then(function (designDoc) {
    if (!(designDoc.lists || {}).hasOwnProperty(listName)) {
      throw {
        status: 404,
        name: "not_found",
        message: "missing list function " + listName + " on design doc _design/" + designDocName
      };
    }
    return designDoc;
  });
  var viewPromise = db.query(designDocName + "/" + viewName, options.query);

  //not Promise.all because the order matters.
  var args = [];
  return viewPromise.then(function (viewResp) {
    args.push(viewResp);

    return ddocPromise;
  }).then(function (ddoc) {
    args.push(ddoc);
  }).then(function () {
    var viewResp = args[0];
    var designDoc = args[1];

    var head = {
      offset: viewResp.offset,
      total_rows: viewResp.total_rows
    };

    var respInfo;
    var chunks = [];

    var listApi = {
      getRow: function () {
        listApi.start({});
        return viewResp.rows.shift() || null;
      },
      send: function (chunk) {
        listApi.start({});
        chunks.push(chunk);
      },
      start: function (respBegin) {
        if (!respInfo) {
          respInfo = respBegin;
        }
      }
    };

    var resp = render(designDoc.lists[listName], designDoc, head, req, listApi);
    if (respInfo) {
      extend(resp, respInfo);
      resp.body = chunks.join("") + resp.body;
      resp.headers["Transfer-Encoding"] = "chunked";
    }
    return resp;
  });
}

},{"couchdb-objects":29,"couchdb-render":51,"extend":58,"pouchdb-promise":59,"pouchdb-req-http-query":77,"promise-nodify":96}],27:[function(require,module,exports){
(function (global){
/*
	Copyright 2013-2014, Marten de Vries

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/

"use strict";

var extend = require("extend");

var isEmpty = require("is-empty");
var querystring = require("querystring");
var Promise = require("pouchdb-promise");
var uuid = require("node-uuid");
var buildUserContextObject = require("./couchusercontextobject.js");

module.exports = function buildRequestObject(db, pathEnd, options) {
  var infoPromise = db.info();
  var pathPromise = infoPromise.then(function (info) {
    pathEnd.unshift(encodeURIComponent(info.db_name));
    return normalizePath(pathEnd);
  });
  var userCtxPromise = infoPromise.then(buildUserContextObject);

  return Promise.all([pathPromise, infoPromise, userCtxPromise]).then(function (args) {
    args.push(uuid.v4());
    args.push(options);
    return actuallyBuildRequestObject.apply(null, args);
  });
};

function normalizePath(path) {
  //based on path-browserify's normalizeArray function.
  //https://github.com/substack/path-browserify/blob/master/index.js#L26
  var up = 0;
  for (var i = path.length - 1; i >= 0; i--) {
    var last = path[i];
    if (last === ".") {
      path.splice(i, 1);
    } else if (last === "..") {
      path.splice(i, 1);
      up++;
    } else if (up) {
      path.splice(i, 1);
      up--;
    }
  }

  for (; up--; up) {
    path.unshift("..");
  }

  return path;
}

function actuallyBuildRequestObject(path, info, userCtx, uuid, options) {
  //documentation: http://couchdb.readthedocs.org/en/latest/json-structure.html#request-object
  var result = {
    body: "undefined",
    cookie: {},
    form: {},
    headers: {
      "Host": "localhost:5984",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": buildAcceptLanguage(),
      "User-Agent": buildUserAgent()
    },
    info: info,
    method: "GET",
    path: path.slice(0),
    peer: "127.0.0.1",
    query: {},
    requested_path: path.slice(0),
    raw_path: "/" + path.join("/"),
    secObj: {},
    userCtx: userCtx,
    uuid: uuid
  };
  //set id
  if (["_show", "_update"].indexOf(path[3]) === -1) {
    result.id = null;
  } else {
    result.id = path[5] || null;
    if (result.id === "_design" && path[6]) {
      result.id += "/" + path[6];
    }
  }

  extend(true, result, options);

  //add query string to requested_path if necessary
  var i = result.requested_path.length - 1;
  var pathEnd = result.requested_path[i];
  if (!isEmpty(result.query) && pathEnd.indexOf("?") === -1) {
    result.requested_path[i] = pathEnd + "?" + querystring.stringify(result.query);
  }
  //add query string to raw_path if necessary
  if (!isEmpty(result.query) && result.raw_path.indexOf("?") === -1) {
    result.raw_path += "?" + querystring.stringify(result.query);
  }

  //update body based on form & add content-type & content-length
  //header accordingly if necessary.
  if (!isEmpty(result.form) && result.body === "undefined") {
    result.body = querystring.stringify(result.form);
    result.headers["Content-Type"] = "application/x-www-form-urlencoded";
    result.headers["Content-Length"] = result.body.length.toString();
  }
  //switch to POST (most common) if not already either POST, PUT or
  //PATCH and having a body.
  if (result.body !== "undefined" && ["POST", "PUT", "PATCH"].indexOf(result.method) === -1) {
    result.method = "POST";
  }

  return result;
}

function buildAcceptLanguage() {
  //An Accept-Language header based on
  //1) the browser language
  //2) a default (i.e. English)
  var lang = (global.navigator || {}).language || (global.navigator || {}).userLanguage;
  lang = (lang || "en").toLowerCase();
  if (["en", "en-us"].indexOf(lang) !== -1) {
    return "en-us,en;q=0.5";
  } else {
    return lang + ",en-us;q=0.7,en;q=0.3";
  }
}

function buildUserAgent() {
  //if running in a browser, use its user agent.
  var ua = (global.navigator || {}).userAgent;
  return ua || "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:28.0) Gecko/20100101 Firefox/28.0";
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./couchusercontextobject.js":28,"extend":30,"is-empty":31,"node-uuid":32,"pouchdb-promise":33,"querystring":23}],28:[function(require,module,exports){
/*
	Copyright 2013-2014, Marten de Vries

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/

"use strict";

module.exports = function buildUserContextObject(info) {
  //documentation: http://couchdb.readthedocs.org/en/latest/json-structure.html#user-context-object
  //a default userCtx (admin party like)
  return {
    db: info.db_name,
    name: null,
    roles: ["_admin"]
  };
};

},{}],29:[function(require,module,exports){
/*
	Copyright 2013-2014, Marten de Vries

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/

"use strict";

exports.buildUserContextObject = require("./couchusercontextobject.js");
exports.buildRequestObject = require("./couchrequestobject.js");

},{"./couchrequestobject.js":27,"./couchusercontextobject.js":28}],30:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;
var undefined;

var isPlainObject = function isPlainObject(obj) {
	"use strict";
	if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval) {
		return false;
	}

	var has_own_constructor = hasOwn.call(obj, 'constructor');
	var has_is_property_of_method = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) {}

	return key === undefined || hasOwn.call(obj, key);
};

module.exports = function extend() {
	"use strict";
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === "boolean") {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if (typeof target !== "object" && typeof target !== "function" || target == undefined) {
			target = {};
	}

	for (; i < length; ++i) {
		// Only deal with non-null/undefined values
		if ((options = arguments[i]) != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target === copy) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
					if (copyIsArray) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];
					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[name] = extend(deep, clone, copy);

				// Don't bring in undefined values
				} else if (copy !== undefined) {
					target[name] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};


},{}],31:[function(require,module,exports){

/**
 * Expose `isEmpty`.
 */

module.exports = isEmpty;


/**
 * Has.
 */

var has = Object.prototype.hasOwnProperty;


/**
 * Test whether a value is "empty".
 *
 * @param {Mixed} val
 * @return {Boolean}
 */

function isEmpty (val) {
  if (null == val) return true;
  if ('number' == typeof val) return 0 === val;
  if (undefined !== val.length) return 0 === val.length;
  for (var key in val) if (has.call(val, key)) return false;
  return true;
}
},{}],32:[function(require,module,exports){
(function (Buffer){
//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

(function() {
  var _global = this;

  // Unique ID creation requires a high quality random # generator.  We feature
  // detect to determine the best RNG source, normalizing to a function that
  // returns 128-bits of randomness, since that's what's usually required
  var _rng;

  // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
  //
  // Moderately fast, high quality
  if (typeof(require) == 'function') {
    try {
      var _rb = require('crypto').randomBytes;
      _rng = _rb && function() {return _rb(16);};
    } catch(e) {}
  }

  if (!_rng && _global.crypto && crypto.getRandomValues) {
    // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
    //
    // Moderately fast, high quality
    var _rnds8 = new Uint8Array(16);
    _rng = function whatwgRNG() {
      crypto.getRandomValues(_rnds8);
      return _rnds8;
    };
  }

  if (!_rng) {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    var  _rnds = new Array(16);
    _rng = function() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return _rnds;
    };
  }

  // Buffer class to use
  var BufferClass = typeof(Buffer) == 'function' ? Buffer : Array;

  // Maps for number <-> hex string conversion
  var _byteToHex = [];
  var _hexToByte = {};
  for (var i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
  }

  // **`parse()` - Parse a UUID into it's component bytes**
  function parse(s, buf, offset) {
    var i = (buf && offset) || 0, ii = 0;

    buf = buf || [];
    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
      if (ii < 16) { // Don't overflow!
        buf[i + ii++] = _hexToByte[oct];
      }
    });

    // Zero out remaining bytes if string was short
    while (ii < 16) {
      buf[i + ii++] = 0;
    }

    return buf;
  }

  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
  function unparse(buf, offset) {
    var i = offset || 0, bth = _byteToHex;
    return  bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]];
  }

  // **`v1()` - Generate time-based UUID**
  //
  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html

  // random #'s we need to init node and clockseq
  var _seedBytes = _rng();

  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
  var _nodeId = [
    _seedBytes[0] | 0x01,
    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
  ];

  // Per 4.2.2, randomize (14 bit) clockseq
  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

  // Previous uuid creation time
  var _lastMSecs = 0, _lastNSecs = 0;

  // See https://github.com/broofa/node-uuid for API details
  function v1(options, buf, offset) {
    var i = buf && offset || 0;
    var b = buf || [];

    options = options || {};

    var clockseq = options.clockseq != null ? options.clockseq : _clockseq;

    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    var msecs = options.msecs != null ? options.msecs : new Date().getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq == null) {
      clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
      nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
      throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    var node = options.node || _nodeId;
    for (var n = 0; n < 6; n++) {
      b[i + n] = node[n];
    }

    return buf ? buf : unparse(b);
  }

  // **`v4()` - Generate random UUID**

  // See https://github.com/broofa/node-uuid for API details
  function v4(options, buf, offset) {
    // Deprecated - 'format' argument, as supported in v1.2
    var i = buf && offset || 0;

    if (typeof(options) == 'string') {
      buf = options == 'binary' ? new BufferClass(16) : null;
      options = null;
    }
    options = options || {};

    var rnds = options.random || (options.rng || _rng)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
      for (var ii = 0; ii < 16; ii++) {
        buf[i + ii] = rnds[ii];
      }
    }

    return buf || unparse(rnds);
  }

  // Export public API
  var uuid = v4;
  uuid.v1 = v1;
  uuid.v4 = v4;
  uuid.parse = parse;
  uuid.unparse = unparse;
  uuid.BufferClass = BufferClass;

  if (typeof define === 'function' && define.amd) {
    // Publish as AMD module
    define(function() {return uuid;});
  } else if (typeof(module) != 'undefined' && module.exports) {
    // Publish as node.js module
    module.exports = uuid;
  } else {
    // Publish as global (in browsers)
    var _previousRoot = _global.uuid;

    // **`noConflict()` - (browser only) to reset global 'uuid' var**
    uuid.noConflict = function() {
      _global.uuid = _previousRoot;
      return uuid;
    };

    _global.uuid = uuid;
  }
}).call(this);

}).call(this,require("buffer").Buffer)
},{"buffer":3,"crypto":9}],33:[function(require,module,exports){
(function (global){
if (typeof global.Promise === 'function') {
  module.exports = global.Promise;
} else {
  module.exports = require('bluebird');
}
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"bluebird":37}],34:[function(require,module,exports){
'use strict';

module.exports = INTERNAL;

function INTERNAL() {}
},{}],35:[function(require,module,exports){
'use strict';
var Promise = require('./promise');
var reject = require('./reject');
var resolve = require('./resolve');
var INTERNAL = require('./INTERNAL');
var handlers = require('./handlers');
var noArray = reject(new TypeError('must be an array'));
module.exports = function all(iterable) {
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return noArray;
  }

  var len = iterable.length;
  if (!len) {
    return resolve([]);
  }

  var values = new Array(len);
  var resolved = 0;
  var i = -1;
  var promise = new Promise(INTERNAL);
  
  while (++i < len) {
    allResolver(iterable[i], i);
  }
  return promise;
  function allResolver(value, i) {
    resolve(value).then(resolveFromAll, function (error) {
      handlers.reject(promise, error);
    });
    function resolveFromAll(outValue) {
      values[i] = outValue;
      if (++resolved === len) {
        handlers.resolve(promise, values);
      }
    }
  }
};
},{"./INTERNAL":34,"./handlers":36,"./promise":38,"./reject":40,"./resolve":41}],36:[function(require,module,exports){
'use strict';
var tryCatch = require('./tryCatch');
var resolveThenable = require('./resolveThenable');
var states = require('./states');

exports.resolve = function (self, value) {
  var result = tryCatch(getThen, value);
  if (result.status === 'error') {
    return exports.reject(self, result.value);
  }
  var thenable = result.value;

  if (thenable) {
    resolveThenable.safely(self, thenable);
  } else {
    self.state = states.FULFILLED;
    self.outcome = value;
    var i = -1;
    var len = self.queue.length;
    while (++i < len) {
      self.queue[i].callFulfilled(value);
    }
  }
  return self;
};
exports.reject = function (self, error) {
  self.state = states.REJECTED;
  self.outcome = error;
  var i = -1;
  var len = self.queue.length;
  while (++i < len) {
    self.queue[i].callRejected(error);
  }
  return self;
};

function getThen(obj) {
  // Make sure we only access the accessor once as required by the spec
  var then = obj && obj.then;
  if (obj && typeof obj === 'object' && typeof then === 'function') {
    return function appyThen() {
      then.apply(obj, arguments);
    };
  }
}
},{"./resolveThenable":42,"./states":43,"./tryCatch":44}],37:[function(require,module,exports){
module.exports = exports = require('./promise');

exports.resolve = require('./resolve');
exports.reject = require('./reject');
exports.all = require('./all');
},{"./all":35,"./promise":38,"./reject":40,"./resolve":41}],38:[function(require,module,exports){
'use strict';

var unwrap = require('./unwrap');
var INTERNAL = require('./INTERNAL');
var resolveThenable = require('./resolveThenable');
var states = require('./states');
var QueueItem = require('./queueItem');

module.exports = Promise;
function Promise(resolver) {
  if (!(this instanceof Promise)) {
    return new Promise(resolver);
  }
  if (typeof resolver !== 'function') {
    throw new TypeError('reslover must be a function');
  }
  this.state = states.PENDING;
  this.queue = [];
  this.outcome = void 0;
  if (resolver !== INTERNAL) {
    resolveThenable.safely(this, resolver);
  }
}

Promise.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected);
};
Promise.prototype.then = function (onFulfilled, onRejected) {
  if (typeof onFulfilled !== 'function' && this.state === states.FULFILLED ||
    typeof onRejected !== 'function' && this.state === states.REJECTED) {
    return this;
  }
  var promise = new Promise(INTERNAL);

  
  if (this.state !== states.PENDING) {
    var resolver = this.state === states.FULFILLED ? onFulfilled: onRejected;
    unwrap(promise, resolver, this.outcome);
  } else {
    this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
  }

  return promise;
};

},{"./INTERNAL":34,"./queueItem":39,"./resolveThenable":42,"./states":43,"./unwrap":45}],39:[function(require,module,exports){
'use strict';
var handlers = require('./handlers');
var unwrap = require('./unwrap');

module.exports = QueueItem;
function QueueItem(promise, onFulfilled, onRejected) {
  this.promise = promise;
  if (typeof onFulfilled === 'function') {
    this.onFulfilled = onFulfilled;
    this.callFulfilled = this.otherCallFulfilled;
  }
  if (typeof onRejected === 'function') {
    this.onRejected = onRejected;
    this.callRejected = this.otherCallRejected;
  }
}
QueueItem.prototype.callFulfilled = function (value) {
  handlers.resolve(this.promise, value);
};
QueueItem.prototype.otherCallFulfilled = function (value) {
  unwrap(this.promise, this.onFulfilled, value);
};
QueueItem.prototype.callRejected = function (value) {
  handlers.reject(this.promise, value);
};
QueueItem.prototype.otherCallRejected = function (value) {
  unwrap(this.promise, this.onRejected, value);
};
},{"./handlers":36,"./unwrap":45}],40:[function(require,module,exports){
'use strict';

var Promise = require('./promise');
var INTERNAL = require('./INTERNAL');
var handlers = require('./handlers');
module.exports = reject;

function reject(reason) {
	var promise = new Promise(INTERNAL);
	return handlers.reject(promise, reason);
}
},{"./INTERNAL":34,"./handlers":36,"./promise":38}],41:[function(require,module,exports){
'use strict';

var Promise = require('./promise');
var INTERNAL = require('./INTERNAL');
var handlers = require('./handlers');
module.exports = resolve;

var FALSE = handlers.resolve(new Promise(INTERNAL), false);
var NULL = handlers.resolve(new Promise(INTERNAL), null);
var UNDEFINED = handlers.resolve(new Promise(INTERNAL), void 0);
var ZERO = handlers.resolve(new Promise(INTERNAL), 0);
var EMPTYSTRING = handlers.resolve(new Promise(INTERNAL), '');

function resolve(value) {
  if (value) {
    if (value instanceof Promise) {
      return value;
    }
    return handlers.resolve(new Promise(INTERNAL), value);
  }
  var valueType = typeof value;
  switch (valueType) {
    case 'boolean':
      return FALSE;
    case 'undefined':
      return UNDEFINED;
    case 'object':
      return NULL;
    case 'number':
      return ZERO;
    case 'string':
      return EMPTYSTRING;
  }
}
},{"./INTERNAL":34,"./handlers":36,"./promise":38}],42:[function(require,module,exports){
'use strict';
var handlers = require('./handlers');
var tryCatch = require('./tryCatch');
function safelyResolveThenable(self, thenable) {
  // Either fulfill, reject or reject with error
  var called = false;
  function onError(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.reject(self, value);
  }

  function onSuccess(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.resolve(self, value);
  }

  function tryToUnwrap() {
    thenable(onSuccess, onError);
  }
  
  var result = tryCatch(tryToUnwrap);
  if (result.status === 'error') {
    onError(result.value);
  }
}
exports.safely = safelyResolveThenable;
},{"./handlers":36,"./tryCatch":44}],43:[function(require,module,exports){
// Lazy man's symbols for states

exports.REJECTED = ['REJECTED'];
exports.FULFILLED = ['FULFILLED'];
exports.PENDING = ['PENDING'];
},{}],44:[function(require,module,exports){
'use strict';

module.exports = tryCatch;

function tryCatch(func, value) {
  var out = {};
  try {
    out.value = func(value);
    out.status = 'success';
  } catch (e) {
    out.status = 'error';
    out.value = e;
  }
  return out;
}
},{}],45:[function(require,module,exports){
'use strict';

var immediate = require('immediate');
var handlers = require('./handlers');
module.exports = unwrap;

function unwrap(promise, func, value) {
  immediate(function () {
    var returnValue;
    try {
      returnValue = func(value);
    } catch (e) {
      return handlers.reject(promise, e);
    }
    if (returnValue === promise) {
      handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
    } else {
      handlers.resolve(promise, returnValue);
    }
  });
}
},{"./handlers":36,"immediate":46}],46:[function(require,module,exports){
'use strict';
var types = [
  require('./nextTick'),
  require('./mutation.js'),
  require('./messageChannel'),
  require('./stateChange'),
  require('./timeout')
];
var draining;
var queue = [];
function drainQueue() {
  draining = true;
  var i, oldQueue;
  var len = queue.length;
  while (len) {
    oldQueue = queue;
    queue = [];
    i = -1;
    while (++i < len) {
      oldQueue[i]();
    }
    len = queue.length;
  }
  draining = false;
}
var scheduleDrain;
var i = -1;
var len = types.length;
while (++ i < len) {
  if (types[i] && types[i].test && types[i].test()) {
    scheduleDrain = types[i].install(drainQueue);
    break;
  }
}
module.exports = immediate;
function immediate(task) {
  if (queue.push(task) === 1 && !draining) {
    scheduleDrain();
  }
}
},{"./messageChannel":47,"./mutation.js":48,"./nextTick":2,"./stateChange":49,"./timeout":50}],47:[function(require,module,exports){
(function (global){
'use strict';

exports.test = function () {
  if (global.setImmediate) {
    // we can only get here in IE10
    // which doesn't handel postMessage well
    return false;
  }
  return typeof global.MessageChannel !== 'undefined';
};

exports.install = function (func) {
  var channel = new global.MessageChannel();
  channel.port1.onmessage = func;
  return function () {
    channel.port2.postMessage(0);
  };
};
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],48:[function(require,module,exports){
(function (global){
'use strict';
//based off rsvp https://github.com/tildeio/rsvp.js
//license https://github.com/tildeio/rsvp.js/blob/master/LICENSE
//https://github.com/tildeio/rsvp.js/blob/master/lib/rsvp/asap.js

var Mutation = global.MutationObserver || global.WebKitMutationObserver;

exports.test = function () {
  return Mutation;
};

exports.install = function (handle) {
  var called = 0;
  var observer = new Mutation(handle);
  var element = global.document.createTextNode('');
  observer.observe(element, {
    characterData: true
  });
  return function () {
    element.data = (called = ++called % 2);
  };
};
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],49:[function(require,module,exports){
(function (global){
'use strict';

exports.test = function () {
  return 'document' in global && 'onreadystatechange' in global.document.createElement('script');
};

exports.install = function (handle) {
  return function () {

    // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
    // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
    var scriptEl = global.document.createElement('script');
    scriptEl.onreadystatechange = function () {
      handle();

      scriptEl.onreadystatechange = null;
      scriptEl.parentNode.removeChild(scriptEl);
      scriptEl = null;
    };
    global.document.documentElement.appendChild(scriptEl);

    return handle;
  };
};
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],50:[function(require,module,exports){
'use strict';
exports.test = function () {
  return true;
};

exports.install = function (t) {
  return function () {
    setTimeout(t, 0);
  };
};
},{}],51:[function(require,module,exports){
/*
	Copyright 2013-2014, Marten de Vries

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/

"use strict";

var extend = require("extend");
var isEmpty = require("is-empty");

var coucheval = require("couchdb-eval");
var completeRespObj = require("couchdb-resp-completer");

function isObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

module.exports = function render(source, designDoc, data, req, extraVars) {
  /*jshint evil: true */
  if (!extraVars) {
    extraVars = {};
  }
  var providesCtx = buildProvidesCtx();
  extend(extraVars, providesCtx.api);
  var func = coucheval.evaluate(designDoc, extraVars, source);

  var result, contentType;
  try {
    result = func.call(designDoc, data, req);
  } catch (e) {
    throw coucheval.wrapExecutionError(e);
  }
  if (!(typeof result === "string" || isObject(result))) {
    var resp = providesCtx.getResult(req);
    result = resp[0];
    contentType = resp[1];
  }

  return completeRespObj(result, contentType);
};

function buildProvidesCtx() {
  var providesFuncs = {};
  var types = [];

  function registerType(key) {
    //signature: key, *mimes
    var mimes = Array.prototype.slice.call(arguments, 1);
    types.push([key, mimes]);
  }
  registerType("all", "*/*");
  registerType("text", "text/plain; charset=utf-8", "txt");
  registerType("html", "text/html; charset=utf-8");
  registerType("xhtml", "application/xhtml+xml", "xhtml");
  registerType("xml", "application/xml", "text/xml", "application/x-xml");
  registerType("js", "text/javascript", "application/javascript", "application/x-javascript");
  registerType("css", "text/css");
  registerType("ics", "text/calendar");
  registerType("csv", "text/csv");
  registerType("rss", "application/rss+xml");
  registerType("atom", "application/atom+xml");
  registerType("yaml", "application/x-yaml", "text/yaml");
  registerType("multipart_form", "multipart/form-data");
  registerType("url_encoded_form", "application/x-www-form-urlencoded");
  registerType("json", "application/json", "text/x-json");

  function execute(type) {
    try {
      return providesFuncs[type]();
    } catch (e) {
      throw coucheval.wrapExecutionError(e);
    }
  }

  function getRelevantTypes() {
    return types.filter(function (type) {
      return providesFuncs.hasOwnProperty(type[0]);
    });
  }

  function contentTypeFor(searchedType) {
    for (var i = 0; i < types.length; i += 1) {
      if (types[i][0] === searchedType) {
        return types[i][1][0];
      }
    }
  }

  function bestMatchForAcceptHeader(header) {
    var requestedMimes = parseAcceptHeader(header);
    var relevantTypes = getRelevantTypes();
    for (var i = 0; i < requestedMimes.length; i += 1) {
      var requestedMime = requestedMimes[i];
      var requestedParts = requestedMime.split(";")[0].trim().split("/");

      for (var j = 0; j < relevantTypes.length; j += 1) {
        var type = relevantTypes[j][0];
        var mimes = relevantTypes[j][1];

        for (var k = 0; k < mimes.length; k += 1) {
          var mime = mimes[k];

          var availableParts = mime.split(";")[0].trim().split("/");
          var match = (
            (
              //'text' in text/plain
              requestedParts[0] === availableParts[0] ||
              requestedParts[0] === "*" || availableParts[0] === "*"
            ) && (
              //'plain' in text/plain
              requestedParts[1] === availableParts[1] ||
              requestedParts[1] === "*" || availableParts[1] === "*"
            )
          );
          if (match) {
            return [type, mime];
          }
        }
      }
    }
    //no match was found
    throw {
      status: 406,
      name: "not_acceptable",
      message: [
        "Content-Type(s)",
        requestedMimes.join(", "),
        "not supported, try one of:",
        Object.keys(providesFuncs).map(contentTypeFor)
      ].join(" ")
    };
  }

  function provides(type, func) {
    providesFuncs[type] = func;
  }

  function getResult(req) {
    if (isEmpty(providesFuncs)) {
      return [""];
    }
    if (req.query.format) {
      if (!providesFuncs.hasOwnProperty(req.query.format)) {
        throw {
          status: 500,
          name: "render_error",
          message: [
            "the format option is set to '",
            req.query.format,
            //the + thing for es3ify
            "'" + ", but there's no provider registered for that format."
          ].join("")
        };
      }
      //everything fine
      return [execute(req.query.format), contentTypeFor(req.query.format)];
    }
    var chosenType = bestMatchForAcceptHeader(req.headers.Accept);
    return [execute(chosenType[0]), chosenType[1]];
  }

  return {
    api: {
      provides: provides,
      registerType: registerType
    },
    getResult: getResult
  };
}

function parseAcceptHeader(header) {
  return header.split(",").map(function (part) {
    return part.split(";")[0].trim();
  });
}

},{"couchdb-eval":52,"couchdb-resp-completer":53,"extend":56,"is-empty":57}],52:[function(require,module,exports){
/*
	Copyright 2013-2014, Marten de Vries

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/

"use strict";

exports.evaluate = function (requireContext, extraVars, program) {
  /*jshint evil:true, unused: false */
  var require;
  if (requireContext) {
    require = function (libPath) {
      var module = {
        id: libPath,
        //no way to fill in current and parent that I know of
        current: undefined,
        parent: undefined,
        exports: {}
      };
      var exports = module.exports;

      var path = libPath.split("/");
      var lib = requireContext;
      for (var i = 0; i < path.length; i += 1) {
        lib = lib[path[i]];
      }
      eval(lib);
      return module.exports;
    };
  }
  var isArray = Array.isArray;
  var toJSON = JSON.stringify;
  var log = function (message) {
    if (typeof message != "string") {
      message = JSON.stringify(message);
    }
    console.log("EVALUATED FUNCTION LOGS: " + message);
  };
  var sum = function (array) {
    return array.reduce(function (a, b) {
      return a + b;
    });
  };

  var statements = "";
  for (var name in extraVars) {
    if (extraVars.hasOwnProperty(name)) {
      statements += "var " + name + " = extraVars['" + name + "'];\n";
    }
  }

  //Strip trailing ';'s to make it more likely to be a valid expression
  program = program.replace(/;\s*$/, "");
  var func;
  try {
    func = eval(statements + "(" + program + ");");
    if (typeof func !== "function") {
      //activate the exception handling mechanism down here.
      throw "no function";
    }
  } catch (e) {
    throw {
      "name": "compilation_error",
      "status": 500,
      "message": "Expression does not eval to a function. " + program
    };
  }
  return func;
};

exports.wrapExecutionError = function (e) {
  return {
    name: e.name,
    message: e.toString() + "\n\n" + e.stack,
    status: 500
  };
};

},{}],53:[function(require,module,exports){
/*
  Copyright 2013-2014, Marten de Vries

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

"use strict";

var extend = require("extend");
var isEmpty = require("is-empty");

module.exports = function completeRespObj(resp, contentType) {
  //contentType may be undefined (if unknown). Resp may be anything
  //returned by the user as response.

  if (typeof resp === "string") {
    resp = {body: resp};
  }
  if (Object.prototype.toString.call(resp) !== "[object Object]") {
    resp = {body: ""};
  }
  //check for keys that shouldn't be in the resp object
  var copy = extend({}, resp);
  delete copy.code;
  delete copy.json;
  delete copy.body;
  delete copy.base64;
  delete copy.headers;
  delete copy.stop;
  if (!isEmpty(copy)) {
    var key = Object.keys(copy)[0];
    throw {
      "status": 500,
      "name": "external_response_error",
      "message": (
        "Invalid data from external server: {<<" +
        JSON.stringify(key) +
        ">>,<<" +
        JSON.stringify(copy[key]) +
        ">>}"
      )
    };
  }
  resp.code = resp.code || 200;
  resp.headers = resp.headers || {};
  resp.headers.Vary = resp.headers.Vary || "Accept";
  //if a content type is known by now, use it.
  resp.headers["Content-Type"] = resp.headers["Content-Type"] || contentType;
  if (resp.json) {
    resp.body = JSON.stringify(resp.json);
    resp.headers["Content-Type"] = resp.headers["Content-Type"] || "application/json";
  }
  if (resp.base64) {
    resp.headers["Content-Type"] = resp.headers["Content-Type"] || "application/binary";
  }
  //the default content type
  resp.headers["Content-Type"] = resp.headers["Content-Type"] || "text/html; charset=utf-8";

  return resp;
};

},{"extend":54,"is-empty":55}],54:[function(require,module,exports){
module.exports=require(30)
},{}],55:[function(require,module,exports){
module.exports=require(31)
},{}],56:[function(require,module,exports){
module.exports=require(30)
},{}],57:[function(require,module,exports){
module.exports=require(31)
},{}],58:[function(require,module,exports){
module.exports=require(30)
},{}],59:[function(require,module,exports){
module.exports=require(33)
},{"bluebird":63}],60:[function(require,module,exports){
module.exports=require(34)
},{}],61:[function(require,module,exports){
module.exports=require(35)
},{"./INTERNAL":60,"./handlers":62,"./promise":64,"./reject":66,"./resolve":67}],62:[function(require,module,exports){
module.exports=require(36)
},{"./resolveThenable":68,"./states":69,"./tryCatch":70}],63:[function(require,module,exports){
module.exports=require(37)
},{"./all":61,"./promise":64,"./reject":66,"./resolve":67}],64:[function(require,module,exports){
module.exports=require(38)
},{"./INTERNAL":60,"./queueItem":65,"./resolveThenable":68,"./states":69,"./unwrap":71}],65:[function(require,module,exports){
module.exports=require(39)
},{"./handlers":62,"./unwrap":71}],66:[function(require,module,exports){
module.exports=require(40)
},{"./INTERNAL":60,"./handlers":62,"./promise":64}],67:[function(require,module,exports){
module.exports=require(41)
},{"./INTERNAL":60,"./handlers":62,"./promise":64}],68:[function(require,module,exports){
module.exports=require(42)
},{"./handlers":62,"./tryCatch":70}],69:[function(require,module,exports){
module.exports=require(43)
},{}],70:[function(require,module,exports){
module.exports=require(44)
},{}],71:[function(require,module,exports){
module.exports=require(45)
},{"./handlers":62,"immediate":72}],72:[function(require,module,exports){
module.exports=require(46)
},{"./messageChannel":73,"./mutation.js":74,"./nextTick":2,"./stateChange":75,"./timeout":76}],73:[function(require,module,exports){
module.exports=require(47)
},{}],74:[function(require,module,exports){
module.exports=require(48)
},{}],75:[function(require,module,exports){
module.exports=require(49)
},{}],76:[function(require,module,exports){
module.exports=require(50)
},{}],77:[function(require,module,exports){
(function (global){
/*
  Copyright 2014, Marten de Vries

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

/*global XMLHttpRequest */

"use strict";

var Promise = require("pouchdb-promise");

if (typeof global.XMLHttpRequest === "undefined") {
  global.XMLHttpRequest = require("xhr2");
}

module.exports = function httpQuery(db, req) {
  return new Promise(function (resolve, reject) {
    function callback() {
      if (xhr.readyState !== 4) {
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        var err = JSON.parse(xhr.responseText);
        reject({
          "name": err.error,
          "message": err.reason,
          "status": xhr.status
        });
        return;
      }

      var headers = {};
      xhr.getAllResponseHeaders().split("\r\n").forEach(function (line) {
        if (line) {
          headers[line.split(":")[0].toLowerCase()] = line.split(":")[1].trim();
        }
      });
      var result = {
        body: xhr.responseText,
        headers: headers,
        code: xhr.status
      };
      if (headers["content-type"] === "application/json") {
        result.json = JSON.parse(result.body);
      }
      resolve(result);
    }

    //strips the database from the requested_path
    var relativeUrl = req.requested_path.slice(1).join("/");
    var url = db.getUrl() + relativeUrl;

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.onreadystatechange = callback;
    xhr.open(req.method, url, true);
    for (var name in req.headers) {
      if (req.headers.hasOwnProperty(name)) {
        xhr.setRequestHeader(name, req.headers[name]);
      }
    }
    xhr.send(req.body === "undefined" ? null : req.body);
  });
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"pouchdb-promise":78,"xhr2":2}],78:[function(require,module,exports){
module.exports=require(33)
},{"bluebird":82}],79:[function(require,module,exports){
module.exports=require(34)
},{}],80:[function(require,module,exports){
module.exports=require(35)
},{"./INTERNAL":79,"./handlers":81,"./promise":83,"./reject":85,"./resolve":86}],81:[function(require,module,exports){
module.exports=require(36)
},{"./resolveThenable":87,"./states":88,"./tryCatch":89}],82:[function(require,module,exports){
module.exports=require(37)
},{"./all":80,"./promise":83,"./reject":85,"./resolve":86}],83:[function(require,module,exports){
module.exports=require(38)
},{"./INTERNAL":79,"./queueItem":84,"./resolveThenable":87,"./states":88,"./unwrap":90}],84:[function(require,module,exports){
module.exports=require(39)
},{"./handlers":81,"./unwrap":90}],85:[function(require,module,exports){
module.exports=require(40)
},{"./INTERNAL":79,"./handlers":81,"./promise":83}],86:[function(require,module,exports){
module.exports=require(41)
},{"./INTERNAL":79,"./handlers":81,"./promise":83}],87:[function(require,module,exports){
module.exports=require(42)
},{"./handlers":81,"./tryCatch":89}],88:[function(require,module,exports){
module.exports=require(43)
},{}],89:[function(require,module,exports){
module.exports=require(44)
},{}],90:[function(require,module,exports){
module.exports=require(45)
},{"./handlers":81,"immediate":91}],91:[function(require,module,exports){
module.exports=require(46)
},{"./messageChannel":92,"./mutation.js":93,"./nextTick":2,"./stateChange":94,"./timeout":95}],92:[function(require,module,exports){
module.exports=require(47)
},{}],93:[function(require,module,exports){
module.exports=require(48)
},{}],94:[function(require,module,exports){
module.exports=require(49)
},{}],95:[function(require,module,exports){
module.exports=require(50)
},{}],96:[function(require,module,exports){
/*
  Copyright 2013-2014, Marten de Vries

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

"use strict";

module.exports = function nodify(promise, callback) {
  if (typeof callback === "function") {
    promise.then(function (resp) {
      callback(null, resp);
    }, function (err) {
      callback(err, null);
    });
  }
};

},{}],97:[function(require,module,exports){
/*
	Copyright 2014, Marten de Vries

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/

/*
  Nice extras/TODO:

  - secure_rewrite; false by default is ok, but it might be nice to be
    able to set it to true as an option.
  - set x-couchdb-requested-path header in the request object.
  - loop protection.

  Tests for all those can be found in the final part of the CouchDB
  rewrite tests, which haven't (yet) been ported to Python/this plug-in.
*/

"use strict";

var couchdb_objects = require("couchdb-objects");
var nodify = require("promise-nodify");
var httpQuery = require("pouchdb-req-http-query");
var extend = require("extend");

exports.rewriteResultRequestObject = function (rewritePath, options, callback) {
  var args = parseArgs(this, rewritePath, options, callback);
  var p = buildRewriteResultReqObj(args.db, args.designDocName, args.rewriteUrl, args.options);
  nodify(p, callback);
  return p;
};

function parseArgs(db, rewritePath, options, callback) {
  if (["function", "undefined"].indexOf(typeof options) !== -1) {
    callback = options;
    options = {};
  }
  return {
    db: db,
    callback: callback,
    options: options,
    designDocName: splitUrl(rewritePath)[0],
    rewriteUrl: splitUrl(rewritePath).slice(1)
  };
}

function splitUrl(url) {
  return url.split("/").filter(function (part) {
    return part;
  });
}

function buildRewriteResultReqObj(db, designDocName, rewriteUrl, options) {
  return db.get("_design/" + designDocName).then(function (ddoc) {
    //rewrite algorithm source:
    //https://github.com/apache/couchdb/blob/master/src/couchdb/couch_httpd_rewrite.erl
    var rewrites = ddoc.rewrites;
    if (typeof rewrites === "undefined") {
      throw {status: 404, name: "rewrite_error", message:"Invalid path."};
    }
    if (!Array.isArray(rewrites)) {
      throw {status: 400, name: "rewrite_error", message: "Rewrite rules should be a JSON Array."};
    }
    var rules = rewrites.map(function (rewrite) {
      if (typeof rewrite.to === "undefined") {
        throw {status: 500, name:"error", message:"invalid_rewrite_target"};
      }
      return {
        method: rewrite.method || "*",
        from: splitUrl(rewrite.from || "*"),
        to: splitUrl(rewrite.to),
        query: rewrite.query || {}
      };
    });
    var match = tryToFindMatch({
      method: options.method || "GET",
      url: rewriteUrl,
      query: options.query || {}
    }, rules);

    var pathEnd = ["_design", designDocName];
    pathEnd.push.apply(pathEnd, match.url);

    options.query = match.query;

    return couchdb_objects.buildRequestObject(db, pathEnd, options);
  });
}

function tryToFindMatch(input, rules) {
  if (arrayEquals(rules, [])) {
    throw404();
  }
  var bindings = {};
  if (methodMatch(rules[0].method, input.method)) {
    var match = pathMatch(rules[0].from, input.url, bindings);
    if (match.ok) {
      var allBindings = extend(bindings, input.query);

      var url = [];
      url.push.apply(url, replacePathBindings(rules[0].to, allBindings));
      url.push.apply(url, match.remaining);

      var ruleQueryArgs = replaceQueryBindings(rules[0].query, allBindings);
      var query = extend(allBindings, ruleQueryArgs);
      delete query["*"];

      return {
        url: url,
        query: query
      };
    } else {
      return tryToFindMatch(input, rules.slice(1));
    }
  } else {
    return tryToFindMatch(input, rules.slice(1));
  }
}

function throw404() {
  throw {status: 404, name: "not_found", message: "missing"};
}

function arrayEquals(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function methodMatch(required, given) {
  //corresponds to bind_method in the couchdb code
  return required === "*" || required === given;
}

function pathMatch(required, given, bindings) {
  //corresponds to bind_path in the couchdb code
  if (arrayEquals(required, []) && arrayEquals(given, [])) {
    return {ok: true, remaining: []};
  }
  if (arrayEquals(required, ["*"])) {
    bindings["*"] = given[0];
    return {ok: true, remaining: given.slice(1)};
  }
  if (arrayEquals(given, [])) {
    return {ok: false};
  }
  if ((required[0] || "")[0] === ":") {
    bindings[required[0].slice(1)] = given[0];
    return pathMatch(required.slice(1), given.slice(1), bindings);
  }
  if (required[0] === given[0]) {
    return pathMatch(required.slice(1), given.slice(1), bindings);
  }
  return {ok: false};
}

function replacePathBindings(path, bindings) {
  for (var i = 0; i < path.length; i += 1) {
    if (typeof path[i] !== "string") {
      continue;
    }
    var bindingName = path[i];
    if (bindingName[0] === ":") {
      bindingName = bindingName.slice(1);
    }
    if (bindings.hasOwnProperty(bindingName)) {
      path[i] = bindings[bindingName];
    }
  }
  return path;
}

function replaceQueryBindings(query, bindings) {
  for (var key in query) {
    if (!query.hasOwnProperty(key)) {
      continue;
    }
    if (typeof query[key] === "object") {
      query[key] = replaceQueryBindings(query[key], bindings);
    } else if (typeof query[key] === "string") {
      var bindingKey = query[key];
      if (bindingKey[0] === ":") {
        bindingKey = bindingKey.slice(1);
      }
      if (bindings.hasOwnProperty(bindingKey)) {
        var val = bindings[bindingKey];
        try {
          val = JSON.parse(val);
        } catch (e) {}
        query[key] = val;
      }
    }
  }
  return query;
}

exports.rewrite = function (rewritePath, options, callback) {
  //options: values to end up in the request object that's used to call
  //the rewrite destination (next to their defaults).

  var args = parseArgs(this, rewritePath, options, callback);

  var promise;
  if (["http", "https"].indexOf(args.db.type()) === -1) {
    promise = offlineRewrite(args.db, args.designDocName, args.rewriteUrl, args.options);
  } else {
    promise = httpRewrite(args.db, args.designDocName, args.rewriteUrl, args.options);
  }
  nodify(promise, args.callback);
  return promise;
};

function offlineRewrite(currentDb, designDocName, rewriteUrl, options) {
  var PouchDB = currentDb.constructor;

  var withValidation = options.withValidation;
  delete options.withValidation;

  var resultReqPromise = buildRewriteResultReqObj(currentDb, designDocName, rewriteUrl, options);
  return resultReqPromise.then(function (req) {
    //Mapping urls to PouchDB/plug-in functions. Based on:
    //http://docs.couchdb.org/en/latest/http-api.html
    if (req.path[0] === "..") {
      throw404();
    }
    var rootFunc = {
      "_all_dbs": (PouchDB.allDbs || throw404).bind(PouchDB),
      "_replicate": PouchDB.replicate.bind(PouchDB, req.query)
    }[req.path[0]];
    if (rootFunc) {
      return rootFunc();
    }
    var db = new PouchDB(decodeURIComponent(req.path[0]));
    var localCallWithBody = callWithBody.bind(null, db, req);
    if (req.path.length === 1) {
      var post = withValidation ? db.validatingPost : db.post;
      var defaultDBFunc = db.info.bind(db);
      return ({
        "DELETE": db.destroy.bind(db),
        "POST": localCallWithBody.bind(null, post, req.query)
      }[req.method] || defaultDBFunc)();
    }

    var localRouteCRUD = routeCRUD.bind(null, db, withValidation, req);
    var defaultFunc = localRouteCRUD.bind(null, req.path[1], req.path.slice(2));
    return ({
      "_all_docs": db.allDocs.bind(db, req.query),
      "_bulk_docs": localCallWithBody.bind(null, db.bulkDocs, req.query),
      "_changes": db.changes.bind(db, req.query),
      "_compact": db.compact.bind(db),
      "_design": function () {
        var url = req.path[2] + "/" + req.path.slice(4).join("/");
        var subDefaultFunc = localRouteCRUD.bind(null, "_design/" + req.path[2], req.path.slice(3));
        return ({
          "_list": (db.list || throw404).bind(db, url, req),
          "_rewrite": (db.rewrite || throw404).bind(db, url, req),
          "_search": (db.search || throw404).bind(db, url, req.query),
          "_show": (db.show || throw404).bind(db, url, req),
          "_spatial": (db.spatial || throw404).bind(db, url, req.query),
          "_update": (db.update || throw404).bind(db, url, req),
          "_view": db.query.bind(db, url, req.query)
        }[req.path[3]] || subDefaultFunc)();
      },
      "_local": localRouteCRUD.bind(null, "_local/" + req.path[2], req.path.slice(3)),
      "_revs_diff": localCallWithBody.bind(null, db.revsDiff),
      "_temp_view": localCallWithBody.bind(null, db.query, req.query),
      "_view_cleanup": db.viewCleanup.bind(db, req.query)
    }[req.path[1]] || defaultFunc)();
  });
}

function callWithBody(db, req, func) {
  var args = Array.prototype.slice.call(arguments, 3);
  args.unshift(JSON.parse(req.body));
  return func.apply(db, args);
}

function routeCRUD(db, withValidation, req, docId, remainingPath) {
  function throw405() {
    throw {
      status: 405,
      name: "method_not_allowed",
      message: "method '" + req.method + "' not allowed."
    };
  }
  function callAttachment(isPut) {
    var funcs;
    var args = [docId, remainingPath[0], req.query.rev];
    if (isPut) {
      args.push(req.body);
      args.push(req.headers["Content-Type"]);

      funcs = {
        true: db.validatingPutAttachment,
        false: db.putAttachment
      };
    } else {
      funcs = {
        true: db.validatingRemoveAttachment,
        false: db.removeAttachment
      };
    }
    if (withValidation) {
      args.push(req.query);
    }
    return funcs[withValidation].apply(db, args);
  }

  //document level
  if (remainingPath.length === 0) {
    var localCallWithBody = callWithBody.bind(null, db, req);
    var put = withValidation ? db.validatingPut : db.put;
    var remove = withValidation ? db.validatingRemove : db.remove;
    return ({
      "GET": function () {
        return db.get(docId, req.query);
      },
      "PUT": localCallWithBody.bind(null, put, req.query),
      "DELETE": localCallWithBody.bind(null, remove, req.query)
    }[req.method] || throw405)();
  }
  //attachment level
  if (remainingPath.length === 1) {
    return ({
      "GET": function () {
        return db.getAttachment(docId, remainingPath[0], req.query);
      },
      "PUT": callAttachment.bind(null, true),
      "DELETE": callAttachment.bind(null, false)

    }[req.method] || throw405)();
  }
  //not document & not attachment level
  throw404();
}

function httpRewrite(db, designDocName, rewriteUrl, options) {
  //no choice when http...
  delete options.withValidation;

  var pathEnd = ["_design", designDocName, "_rewrite"];
  pathEnd.push.apply(pathEnd, rewriteUrl);
  var reqPromise = couchdb_objects.buildRequestObject(db, pathEnd, options);
  return reqPromise.then(httpQuery.bind(null, db));
}

},{"couchdb-objects":100,"extend":122,"pouchdb-req-http-query":123,"promise-nodify":142}],98:[function(require,module,exports){
module.exports=require(27)
},{"./couchusercontextobject.js":99,"extend":101,"is-empty":102,"node-uuid":103,"pouchdb-promise":104,"querystring":23}],99:[function(require,module,exports){
module.exports=require(28)
},{}],100:[function(require,module,exports){
module.exports=require(29)
},{"./couchrequestobject.js":98,"./couchusercontextobject.js":99}],101:[function(require,module,exports){
module.exports=require(30)
},{}],102:[function(require,module,exports){
module.exports=require(31)
},{}],103:[function(require,module,exports){
module.exports=require(32)
},{"buffer":3,"crypto":9}],104:[function(require,module,exports){
module.exports=require(33)
},{"bluebird":108}],105:[function(require,module,exports){
module.exports=require(34)
},{}],106:[function(require,module,exports){
module.exports=require(35)
},{"./INTERNAL":105,"./handlers":107,"./promise":109,"./reject":111,"./resolve":112}],107:[function(require,module,exports){
module.exports=require(36)
},{"./resolveThenable":113,"./states":114,"./tryCatch":115}],108:[function(require,module,exports){
module.exports=require(37)
},{"./all":106,"./promise":109,"./reject":111,"./resolve":112}],109:[function(require,module,exports){
module.exports=require(38)
},{"./INTERNAL":105,"./queueItem":110,"./resolveThenable":113,"./states":114,"./unwrap":116}],110:[function(require,module,exports){
module.exports=require(39)
},{"./handlers":107,"./unwrap":116}],111:[function(require,module,exports){
module.exports=require(40)
},{"./INTERNAL":105,"./handlers":107,"./promise":109}],112:[function(require,module,exports){
module.exports=require(41)
},{"./INTERNAL":105,"./handlers":107,"./promise":109}],113:[function(require,module,exports){
module.exports=require(42)
},{"./handlers":107,"./tryCatch":115}],114:[function(require,module,exports){
module.exports=require(43)
},{}],115:[function(require,module,exports){
module.exports=require(44)
},{}],116:[function(require,module,exports){
module.exports=require(45)
},{"./handlers":107,"immediate":117}],117:[function(require,module,exports){
module.exports=require(46)
},{"./messageChannel":118,"./mutation.js":119,"./nextTick":2,"./stateChange":120,"./timeout":121}],118:[function(require,module,exports){
module.exports=require(47)
},{}],119:[function(require,module,exports){
module.exports=require(48)
},{}],120:[function(require,module,exports){
module.exports=require(49)
},{}],121:[function(require,module,exports){
module.exports=require(50)
},{}],122:[function(require,module,exports){
module.exports=require(30)
},{}],123:[function(require,module,exports){
module.exports=require(77)
},{"pouchdb-promise":124,"xhr2":2}],124:[function(require,module,exports){
module.exports=require(33)
},{"bluebird":128}],125:[function(require,module,exports){
module.exports=require(34)
},{}],126:[function(require,module,exports){
module.exports=require(35)
},{"./INTERNAL":125,"./handlers":127,"./promise":129,"./reject":131,"./resolve":132}],127:[function(require,module,exports){
module.exports=require(36)
},{"./resolveThenable":133,"./states":134,"./tryCatch":135}],128:[function(require,module,exports){
module.exports=require(37)
},{"./all":126,"./promise":129,"./reject":131,"./resolve":132}],129:[function(require,module,exports){
module.exports=require(38)
},{"./INTERNAL":125,"./queueItem":130,"./resolveThenable":133,"./states":134,"./unwrap":136}],130:[function(require,module,exports){
module.exports=require(39)
},{"./handlers":127,"./unwrap":136}],131:[function(require,module,exports){
module.exports=require(40)
},{"./INTERNAL":125,"./handlers":127,"./promise":129}],132:[function(require,module,exports){
module.exports=require(41)
},{"./INTERNAL":125,"./handlers":127,"./promise":129}],133:[function(require,module,exports){
module.exports=require(42)
},{"./handlers":127,"./tryCatch":135}],134:[function(require,module,exports){
module.exports=require(43)
},{}],135:[function(require,module,exports){
module.exports=require(44)
},{}],136:[function(require,module,exports){
module.exports=require(45)
},{"./handlers":127,"immediate":137}],137:[function(require,module,exports){
module.exports=require(46)
},{"./messageChannel":138,"./mutation.js":139,"./nextTick":2,"./stateChange":140,"./timeout":141}],138:[function(require,module,exports){
module.exports=require(47)
},{}],139:[function(require,module,exports){
module.exports=require(48)
},{}],140:[function(require,module,exports){
module.exports=require(49)
},{}],141:[function(require,module,exports){
module.exports=require(50)
},{}],142:[function(require,module,exports){
module.exports=require(96)
},{}],143:[function(require,module,exports){
/*
	Copyright 2013-2014, Marten de Vries

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/

"use strict";

var couchdb_objects = require("couchdb-objects");
var render = require("couchdb-render");
var nodify = require("promise-nodify");
var httpQuery = require("pouchdb-req-http-query");

var Promise = require("pouchdb-promise");

exports.show = function (showPath, options, callback) {
  //options: values to end up in the request object of the show
  //function (next to their defaults).

  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  var db = this;

  var splitted = showPath.split("/");
  var designDocName = splitted[0];
  var showName = splitted[1];
  var docId = splitted[2];
  if (docId === "_design" && splitted.length > 3) {
    docId += "/" + splitted[3];
  }

  //build request object
  var pathEnd = ["_design", designDocName, "_show", showName];
  if (docId) {
    pathEnd.push.apply(pathEnd, docId.split("/"));
  }
  var reqPromise = couchdb_objects.buildRequestObject(db, pathEnd, options);
  return reqPromise.then(function (req) {
    var promise;
    if (["http", "https"].indexOf(db.type()) === -1) {
      promise = offlineQuery(db, designDocName, showName, docId, req, options);
    } else {
      promise = httpQuery(db, req);
    }
    nodify(promise, callback);
    return promise;
  });
};

function offlineQuery(db, designDocName, showName, docId, req, options) {
  //get the documents involved.
  var ddocPromise = db.get("_design/" + designDocName).then(function (designDoc) {
    if (!(designDoc.shows || {}).hasOwnProperty(showName)) {
      throw {
        status: 404,
        name: "not_found",
        message: "missing show function " + showName + " on design doc _design/" + designDocName
      };
    }
    return designDoc;
  });
  var docPromise = db.get(docId, options)["catch"](function () {
    //doc might not exist - that's ok and expected.
    return null;
  });
  return Promise.all([ddocPromise, docPromise]).then(function (args) {
    //all data collected - do the magic that is a show function
    var designDoc = args[0];
    var doc = args[1];

    var source = designDoc.shows[showName];

    return render(source, designDoc, doc, req);
  });
}

},{"couchdb-objects":146,"couchdb-render":168,"pouchdb-promise":175,"pouchdb-req-http-query":193,"promise-nodify":212}],144:[function(require,module,exports){
module.exports=require(27)
},{"./couchusercontextobject.js":145,"extend":147,"is-empty":148,"node-uuid":149,"pouchdb-promise":150,"querystring":23}],145:[function(require,module,exports){
module.exports=require(28)
},{}],146:[function(require,module,exports){
module.exports=require(29)
},{"./couchrequestobject.js":144,"./couchusercontextobject.js":145}],147:[function(require,module,exports){
module.exports=require(30)
},{}],148:[function(require,module,exports){
module.exports=require(31)
},{}],149:[function(require,module,exports){
module.exports=require(32)
},{"buffer":3,"crypto":9}],150:[function(require,module,exports){
module.exports=require(33)
},{"bluebird":154}],151:[function(require,module,exports){
module.exports=require(34)
},{}],152:[function(require,module,exports){
module.exports=require(35)
},{"./INTERNAL":151,"./handlers":153,"./promise":155,"./reject":157,"./resolve":158}],153:[function(require,module,exports){
module.exports=require(36)
},{"./resolveThenable":159,"./states":160,"./tryCatch":161}],154:[function(require,module,exports){
module.exports=require(37)
},{"./all":152,"./promise":155,"./reject":157,"./resolve":158}],155:[function(require,module,exports){
module.exports=require(38)
},{"./INTERNAL":151,"./queueItem":156,"./resolveThenable":159,"./states":160,"./unwrap":162}],156:[function(require,module,exports){
module.exports=require(39)
},{"./handlers":153,"./unwrap":162}],157:[function(require,module,exports){
module.exports=require(40)
},{"./INTERNAL":151,"./handlers":153,"./promise":155}],158:[function(require,module,exports){
module.exports=require(41)
},{"./INTERNAL":151,"./handlers":153,"./promise":155}],159:[function(require,module,exports){
module.exports=require(42)
},{"./handlers":153,"./tryCatch":161}],160:[function(require,module,exports){
module.exports=require(43)
},{}],161:[function(require,module,exports){
module.exports=require(44)
},{}],162:[function(require,module,exports){
module.exports=require(45)
},{"./handlers":153,"immediate":163}],163:[function(require,module,exports){
module.exports=require(46)
},{"./messageChannel":164,"./mutation.js":165,"./nextTick":2,"./stateChange":166,"./timeout":167}],164:[function(require,module,exports){
module.exports=require(47)
},{}],165:[function(require,module,exports){
module.exports=require(48)
},{}],166:[function(require,module,exports){
module.exports=require(49)
},{}],167:[function(require,module,exports){
module.exports=require(50)
},{}],168:[function(require,module,exports){
module.exports=require(51)
},{"couchdb-eval":169,"couchdb-resp-completer":170,"extend":173,"is-empty":174}],169:[function(require,module,exports){
module.exports=require(52)
},{}],170:[function(require,module,exports){
module.exports=require(53)
},{"extend":171,"is-empty":172}],171:[function(require,module,exports){
module.exports=require(30)
},{}],172:[function(require,module,exports){
module.exports=require(31)
},{}],173:[function(require,module,exports){
module.exports=require(30)
},{}],174:[function(require,module,exports){
module.exports=require(31)
},{}],175:[function(require,module,exports){
module.exports=require(33)
},{"bluebird":179}],176:[function(require,module,exports){
module.exports=require(34)
},{}],177:[function(require,module,exports){
module.exports=require(35)
},{"./INTERNAL":176,"./handlers":178,"./promise":180,"./reject":182,"./resolve":183}],178:[function(require,module,exports){
module.exports=require(36)
},{"./resolveThenable":184,"./states":185,"./tryCatch":186}],179:[function(require,module,exports){
module.exports=require(37)
},{"./all":177,"./promise":180,"./reject":182,"./resolve":183}],180:[function(require,module,exports){
module.exports=require(38)
},{"./INTERNAL":176,"./queueItem":181,"./resolveThenable":184,"./states":185,"./unwrap":187}],181:[function(require,module,exports){
module.exports=require(39)
},{"./handlers":178,"./unwrap":187}],182:[function(require,module,exports){
module.exports=require(40)
},{"./INTERNAL":176,"./handlers":178,"./promise":180}],183:[function(require,module,exports){
module.exports=require(41)
},{"./INTERNAL":176,"./handlers":178,"./promise":180}],184:[function(require,module,exports){
module.exports=require(42)
},{"./handlers":178,"./tryCatch":186}],185:[function(require,module,exports){
module.exports=require(43)
},{}],186:[function(require,module,exports){
module.exports=require(44)
},{}],187:[function(require,module,exports){
module.exports=require(45)
},{"./handlers":178,"immediate":188}],188:[function(require,module,exports){
module.exports=require(46)
},{"./messageChannel":189,"./mutation.js":190,"./nextTick":2,"./stateChange":191,"./timeout":192}],189:[function(require,module,exports){
module.exports=require(47)
},{}],190:[function(require,module,exports){
module.exports=require(48)
},{}],191:[function(require,module,exports){
module.exports=require(49)
},{}],192:[function(require,module,exports){
module.exports=require(50)
},{}],193:[function(require,module,exports){
module.exports=require(77)
},{"pouchdb-promise":194,"xhr2":2}],194:[function(require,module,exports){
module.exports=require(33)
},{"bluebird":198}],195:[function(require,module,exports){
module.exports=require(34)
},{}],196:[function(require,module,exports){
module.exports=require(35)
},{"./INTERNAL":195,"./handlers":197,"./promise":199,"./reject":201,"./resolve":202}],197:[function(require,module,exports){
module.exports=require(36)
},{"./resolveThenable":203,"./states":204,"./tryCatch":205}],198:[function(require,module,exports){
module.exports=require(37)
},{"./all":196,"./promise":199,"./reject":201,"./resolve":202}],199:[function(require,module,exports){
module.exports=require(38)
},{"./INTERNAL":195,"./queueItem":200,"./resolveThenable":203,"./states":204,"./unwrap":206}],200:[function(require,module,exports){
module.exports=require(39)
},{"./handlers":197,"./unwrap":206}],201:[function(require,module,exports){
module.exports=require(40)
},{"./INTERNAL":195,"./handlers":197,"./promise":199}],202:[function(require,module,exports){
module.exports=require(41)
},{"./INTERNAL":195,"./handlers":197,"./promise":199}],203:[function(require,module,exports){
module.exports=require(42)
},{"./handlers":197,"./tryCatch":205}],204:[function(require,module,exports){
module.exports=require(43)
},{}],205:[function(require,module,exports){
module.exports=require(44)
},{}],206:[function(require,module,exports){
module.exports=require(45)
},{"./handlers":197,"immediate":207}],207:[function(require,module,exports){
module.exports=require(46)
},{"./messageChannel":208,"./mutation.js":209,"./nextTick":2,"./stateChange":210,"./timeout":211}],208:[function(require,module,exports){
module.exports=require(47)
},{}],209:[function(require,module,exports){
module.exports=require(48)
},{}],210:[function(require,module,exports){
module.exports=require(49)
},{}],211:[function(require,module,exports){
module.exports=require(50)
},{}],212:[function(require,module,exports){
module.exports=require(96)
},{}],213:[function(require,module,exports){
/*
	Copyright 2013-2014, Marten de Vries

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/

"use strict";

var Promise = require("pouchdb-promise");

var couchdb_objects = require("couchdb-objects");
var nodify = require("promise-nodify");
var coucheval = require("couchdb-eval");
var httpQuery = require("pouchdb-req-http-query");
var completeRespObj = require("couchdb-resp-completer");

exports.update = function (updatePath, options, callback) {
  if (["function", "undefined"].indexOf(typeof options) !== -1) {
    callback = options;
    options = {};
  }
  var db = this;

  //better default than GET.
  options.method = options.method || "POST";

  var designDocName = updatePath.split("/")[0];
  var updateName = updatePath.split("/")[1];
  var docId = updatePath.split("/")[2];

  //build request object
  var pathEnd = ["_design", designDocName, "_update", updateName];
  if (docId) {
    pathEnd.push.apply(pathEnd, docId.split("/"));
  }
  var reqPromise = couchdb_objects.buildRequestObject(db, pathEnd, options);
  return reqPromise.then(function (req) {
    //the only option that isn't related to the request object.
    delete req.withValidation;

    //because we might have set method -> POST, also set a Content-Type
    //to prevent a Qt warning in case there isn't one.
    var h = req.headers;
    h["Content-Type"] = h["Content-Type"] || "application/x-www-form-urlencoded";

    var promise;
    if (["http", "https"].indexOf(db.type()) === -1) {
      promise = offlineQuery(db, designDocName, updateName, docId, req, options);
    } else {
      promise = httpQuery(db, req);
    }

    nodify(promise, callback);
    return promise;
  });
};

function offlineQuery(db, designDocName, updateName, docId, req, options) {
  //get the documents involved
  var ddocPromise = db.get("_design/" + designDocName).then(function (designDoc) {
    if (!(designDoc.updates || {}).hasOwnProperty(updateName)) {
      throw {
        status: 404,
        name: "not_found",
        message: "missing update function " + updateName + " on design doc _design/" + designDocName
      };
    }
    return designDoc;
  });
  var docPromise = db.get(docId)["catch"](function () {
    //doc might not exist - that's ok and expected.
    return null;
  });

  return Promise.all([ddocPromise, docPromise]).then(function (args) {
    var designDoc = args[0];
    var doc = args[1];

    //run update function
    var func = coucheval.evaluate(designDoc, {}, designDoc.updates[updateName]);
    var result;
    try {
      result = func.call(designDoc, doc, req);
    } catch (e) {
      throw coucheval.wrapExecutionError(e);
    }
    var savePromise;
    //save result[0] if necessary
    if (result[0] === null) {
      savePromise = Promise.resolve(200);
    } else {
      var methodName = options.withValidation ? "validatingPut" : "put";
      savePromise = db[methodName](result[0], options).then(function () {
        return 201;
      });
    }
    //then return the result
    return savePromise.then(function (status) {
      var resp = completeRespObj(result[1]);
      resp.code = status;
      return resp;
    });
  });
}

},{"couchdb-eval":214,"couchdb-objects":217,"couchdb-resp-completer":239,"pouchdb-promise":242,"pouchdb-req-http-query":260,"promise-nodify":279}],214:[function(require,module,exports){
module.exports=require(52)
},{}],215:[function(require,module,exports){
module.exports=require(27)
},{"./couchusercontextobject.js":216,"extend":218,"is-empty":219,"node-uuid":220,"pouchdb-promise":221,"querystring":23}],216:[function(require,module,exports){
module.exports=require(28)
},{}],217:[function(require,module,exports){
module.exports=require(29)
},{"./couchrequestobject.js":215,"./couchusercontextobject.js":216}],218:[function(require,module,exports){
module.exports=require(30)
},{}],219:[function(require,module,exports){
module.exports=require(31)
},{}],220:[function(require,module,exports){
module.exports=require(32)
},{"buffer":3,"crypto":9}],221:[function(require,module,exports){
module.exports=require(33)
},{"bluebird":225}],222:[function(require,module,exports){
module.exports=require(34)
},{}],223:[function(require,module,exports){
module.exports=require(35)
},{"./INTERNAL":222,"./handlers":224,"./promise":226,"./reject":228,"./resolve":229}],224:[function(require,module,exports){
module.exports=require(36)
},{"./resolveThenable":230,"./states":231,"./tryCatch":232}],225:[function(require,module,exports){
module.exports=require(37)
},{"./all":223,"./promise":226,"./reject":228,"./resolve":229}],226:[function(require,module,exports){
module.exports=require(38)
},{"./INTERNAL":222,"./queueItem":227,"./resolveThenable":230,"./states":231,"./unwrap":233}],227:[function(require,module,exports){
module.exports=require(39)
},{"./handlers":224,"./unwrap":233}],228:[function(require,module,exports){
module.exports=require(40)
},{"./INTERNAL":222,"./handlers":224,"./promise":226}],229:[function(require,module,exports){
module.exports=require(41)
},{"./INTERNAL":222,"./handlers":224,"./promise":226}],230:[function(require,module,exports){
module.exports=require(42)
},{"./handlers":224,"./tryCatch":232}],231:[function(require,module,exports){
module.exports=require(43)
},{}],232:[function(require,module,exports){
module.exports=require(44)
},{}],233:[function(require,module,exports){
module.exports=require(45)
},{"./handlers":224,"immediate":234}],234:[function(require,module,exports){
module.exports=require(46)
},{"./messageChannel":235,"./mutation.js":236,"./nextTick":2,"./stateChange":237,"./timeout":238}],235:[function(require,module,exports){
module.exports=require(47)
},{}],236:[function(require,module,exports){
module.exports=require(48)
},{}],237:[function(require,module,exports){
module.exports=require(49)
},{}],238:[function(require,module,exports){
module.exports=require(50)
},{}],239:[function(require,module,exports){
module.exports=require(53)
},{"extend":240,"is-empty":241}],240:[function(require,module,exports){
module.exports=require(30)
},{}],241:[function(require,module,exports){
module.exports=require(31)
},{}],242:[function(require,module,exports){
module.exports=require(33)
},{"bluebird":246}],243:[function(require,module,exports){
module.exports=require(34)
},{}],244:[function(require,module,exports){
module.exports=require(35)
},{"./INTERNAL":243,"./handlers":245,"./promise":247,"./reject":249,"./resolve":250}],245:[function(require,module,exports){
module.exports=require(36)
},{"./resolveThenable":251,"./states":252,"./tryCatch":253}],246:[function(require,module,exports){
module.exports=require(37)
},{"./all":244,"./promise":247,"./reject":249,"./resolve":250}],247:[function(require,module,exports){
module.exports=require(38)
},{"./INTERNAL":243,"./queueItem":248,"./resolveThenable":251,"./states":252,"./unwrap":254}],248:[function(require,module,exports){
module.exports=require(39)
},{"./handlers":245,"./unwrap":254}],249:[function(require,module,exports){
module.exports=require(40)
},{"./INTERNAL":243,"./handlers":245,"./promise":247}],250:[function(require,module,exports){
module.exports=require(41)
},{"./INTERNAL":243,"./handlers":245,"./promise":247}],251:[function(require,module,exports){
module.exports=require(42)
},{"./handlers":245,"./tryCatch":253}],252:[function(require,module,exports){
module.exports=require(43)
},{}],253:[function(require,module,exports){
module.exports=require(44)
},{}],254:[function(require,module,exports){
module.exports=require(45)
},{"./handlers":245,"immediate":255}],255:[function(require,module,exports){
module.exports=require(46)
},{"./messageChannel":256,"./mutation.js":257,"./nextTick":2,"./stateChange":258,"./timeout":259}],256:[function(require,module,exports){
module.exports=require(47)
},{}],257:[function(require,module,exports){
module.exports=require(48)
},{}],258:[function(require,module,exports){
module.exports=require(49)
},{}],259:[function(require,module,exports){
module.exports=require(50)
},{}],260:[function(require,module,exports){
module.exports=require(77)
},{"pouchdb-promise":261,"xhr2":2}],261:[function(require,module,exports){
module.exports=require(33)
},{"bluebird":265}],262:[function(require,module,exports){
module.exports=require(34)
},{}],263:[function(require,module,exports){
module.exports=require(35)
},{"./INTERNAL":262,"./handlers":264,"./promise":266,"./reject":268,"./resolve":269}],264:[function(require,module,exports){
module.exports=require(36)
},{"./resolveThenable":270,"./states":271,"./tryCatch":272}],265:[function(require,module,exports){
module.exports=require(37)
},{"./all":263,"./promise":266,"./reject":268,"./resolve":269}],266:[function(require,module,exports){
module.exports=require(38)
},{"./INTERNAL":262,"./queueItem":267,"./resolveThenable":270,"./states":271,"./unwrap":273}],267:[function(require,module,exports){
module.exports=require(39)
},{"./handlers":264,"./unwrap":273}],268:[function(require,module,exports){
module.exports=require(40)
},{"./INTERNAL":262,"./handlers":264,"./promise":266}],269:[function(require,module,exports){
module.exports=require(41)
},{"./INTERNAL":262,"./handlers":264,"./promise":266}],270:[function(require,module,exports){
module.exports=require(42)
},{"./handlers":264,"./tryCatch":272}],271:[function(require,module,exports){
module.exports=require(43)
},{}],272:[function(require,module,exports){
module.exports=require(44)
},{}],273:[function(require,module,exports){
module.exports=require(45)
},{"./handlers":264,"immediate":274}],274:[function(require,module,exports){
module.exports=require(46)
},{"./messageChannel":275,"./mutation.js":276,"./nextTick":2,"./stateChange":277,"./timeout":278}],275:[function(require,module,exports){
module.exports=require(47)
},{}],276:[function(require,module,exports){
module.exports=require(48)
},{}],277:[function(require,module,exports){
module.exports=require(49)
},{}],278:[function(require,module,exports){
module.exports=require(50)
},{}],279:[function(require,module,exports){
module.exports=require(96)
},{}],280:[function(require,module,exports){
/*
	Copyright 2013-2014, Marten de Vries

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/

"use strict";

var coucheval = require("couchdb-eval");
var couchdb_objects = require("couchdb-objects");
var nodify = require("promise-nodify");

var uuid = require("node-uuid");
var Promise = require("pouchdb-promise");
var PouchPluginError = require("pouchdb-plugin-error");

var dbs = [];
var methodNames = ["put", "post", "remove", "bulkDocs", "putAttachment", "removeAttachment"];
var methodsByDbsIdx = [];

function methods(db) {
  var index = dbs.indexOf(db);
  if (index === -1) {
    return methodsFromDb(db);
  }
  return methodsByDbsIdx[index];
}

function methodsFromDb(db) {
  var meths = {};
  methodNames.forEach(function (name) {
    meths[name] = db[name].bind(db);
  });
  return meths;
}

function oldDoc(db, id) {
  return db.get(id, {revs: true})["catch"](function () {
    return null;
  });
}

function validate(validationFuncs, newDoc, oldDoc, options) {
  newDoc._revisions = (oldDoc || {})._revisions;

  try {
    validationFuncs.forEach(function (validationFuncInfo) {
      var func = validationFuncInfo.func;
      var designDoc = validationFuncInfo.designDoc;
      func.call(designDoc, newDoc, oldDoc, options.userCtx, options.secObj);
    });
  } catch (e) {
    if (typeof e.unauthorized !== "undefined") {
      throw {
        name: "unauthorized",
        message: e.unauthorized,
        status: 401
      };
    } else if (typeof e.forbidden !== "undefined") {
      throw {
        name: "forbidden",
        message: e.forbidden,
        status: 403
      };
    } else {
      throw coucheval.wrapExecutionError(e);
    }
  }
  //passed all validation functions (no errors thrown) -> success
}

function doValidation(db, newDoc, options, callback) {
  var isHttp = ["http", "https"].indexOf(db.type()) !== -1;
  if (isHttp && !(options || {}).checkHttp) {
    //CouchDB does the checking for itself. Validate succesful.
    return Promise.resolve();
  }
  if ((newDoc._id || "").indexOf("_design/") === 0) {
    //a design document -> always validates succesful.
    return Promise.resolve();
  }
  return getValidationFunctions(db).then(function (validationFuncs) {
    if (!validationFuncs.length) {
      //no validation functions, so valid!
      return;
    }
    var completeOptionsPromise = completeValidationOptions(db, options);
    var oldDocPromise = oldDoc(db, newDoc._id);

    return Promise.all([completeOptionsPromise, oldDocPromise]).then(function (args) {
      var completeOptions = args[0];
      var oldDoc = args[1];
      return validate(validationFuncs, newDoc, oldDoc, completeOptions);
    });
  });
}

function completeValidationOptions(db, options) {
  if (!options) {
    options = {};
  }
  if (!options.secObj) {
    options.secObj = {};
  }

  var userCtxPromise;
  if (options.userCtx) {
    userCtxPromise = Promise.resolve(options.userCtx);
  } else {
    var buildUserContext = couchdb_objects.buildUserContextObject;
    userCtxPromise = db.info().then(buildUserContext);
  }
  return userCtxPromise.then(function (userCtx) {
    options.userCtx = userCtx;
    return options;
  });
}

function getValidationFunctions(db, callback) {
  return db.allDocs({
    startkey: "_design/",
    endkey: "_design0",
    include_docs: true
  }).then(parseValidationFunctions);
}

function parseValidationFunctions(resp) {
  var validationFuncs = resp.rows.map(function (row) {
    return {
      designDoc: row.doc,
      code: row.doc.validate_doc_update
    };
  });
  validationFuncs = validationFuncs.filter(function (info) {
    return typeof info.code !== "undefined";
  });
  validationFuncs.forEach(function (info) {
    //convert str -> function
    info.func = coucheval.evaluate(info.designDoc, {}, info.code);
  });
  return validationFuncs;
}

function processArgs(db, callback, options) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  return {
    db: db,
    callback: callback,
    options: options
  };
}

exports.validatingPut = function (doc, options, callback) {
  var args = processArgs(this, callback, options);
  var promise = doValidation(args.db, doc, args.options).then(function () {
    return methods(args.db).put(doc, args.options);
  });
  nodify(promise, callback);
  return promise;
};

exports.validatingPost = function (doc, options, callback) {
  var args = processArgs(this, callback, options);

  doc._id = doc._id || uuid.v4();
  var promise = doValidation(args.db, doc, args.options).then(function () {
    return methods(args.db).post(doc, args.options);
  });
  nodify(promise, callback);
  return promise;
};

exports.validatingRemove = function (doc, options, callback) {
  var args = processArgs(this, callback, options);

  doc._deleted = true;
  var promise = doValidation(args.db, doc, args.options).then(function () {
    return methods(args.db).remove(doc, args.options);
  });
  nodify(promise, callback);
  return promise;
};

exports.validatingBulkDocs = function (bulkDocs, options, callback) {
  //the ``all_or_nothing`` attribute on ``bulkDocs`` is unsupported.
  //Also, the result array might not be in the same order as
  //``bulkDocs.docs``
  var args = processArgs(this, callback, options);

  var done = [];
  var notYetDone = [];

  var validations = bulkDocs.docs.map(function (doc) {
    doc._id = doc._id || uuid.v4();
    var validationPromise = doValidation(args.db, doc, args.options);

    return validationPromise.then(function (resp) {
      notYetDone.push(doc);
    })["catch"](function (err) {
      err.id = doc._id;
      done.push(err);
    });
  });
  var allValidationsPromise = Promise.all(validations).then(function () {
    return methods(args.db).bulkDocs({docs: notYetDone}, args.options);
  }).then(function (insertedDocs) {
    return done.concat(insertedDocs);
  });
  nodify(allValidationsPromise, callback);
  return allValidationsPromise;
};

var vpa = function (docId, attachmentId, rev, attachment, type, options, callback) {
  var args = processArgs(this, callback, options);

  //get the doc
  var promise = args.db.get(docId, {rev: rev, revs: true})["catch"](function (err) {
    return {_id: docId};
  }).then(function (doc) {
    //validate the doc + attachment
    doc._attachments = doc._attachments || {};
    doc._attachments[attachmentId] = {
      content_type: type,
      data: attachment
    };
    return doValidation(args.db, doc, args.options);
  }).then(function () {
    //save the attachment
    return methods(args.db).putAttachment(docId, attachmentId, rev, attachment, type);
  });
  nodify(promise, callback);
  return promise;
};
exports.validatingPutAttachment = vpa;

var vra = function (docId, attachmentId, rev, options, callback) {
  var args = processArgs(this, callback, options);
  //get the doc
  var promise = args.db.get(docId, {rev: rev, revs: true}).then(function (doc) {
    //validate the doc without attachment
    delete doc._attachments[attachmentId];

    return doValidation(args.db, doc, args.options);
  }).then(function () {
    //remove the attachment
    return methods(args.db).removeAttachment(docId, attachmentId, rev);
  });
  nodify(promise, callback);
  return promise;
};
exports.validatingRemoveAttachment = vra;

exports.installValidationMethods = function () {
  var db = this;

  if (dbs.indexOf(db) !== -1) {
    throw new PouchPluginError({
      status: 500,
      name: "already_installed",
      message: "Validation methods are already installed on this database."
    });
  }

  dbs.push(db);
  methodsByDbsIdx.push(methodsFromDb(db));
  methodNames.forEach(function (name) {
    db[name] = exports["validating" + name[0].toUpperCase() + name.substr(1)].bind(db);
  });
};

exports.uninstallValidationMethods = function () {
  var db = this;

  var index = dbs.indexOf(db);
  if (index === -1) {
    throw new PouchPluginError({
      status: 500,
      name: "already_not_installed",
      message: "Validation methods are already not installed on this database."
    });
  }
  var meths = methods(db);
  methodNames.forEach(function (name) {
    db[name] = meths[name];
  });

  //cleanup
  dbs.splice(index, 1);
  methodsByDbsIdx.splice(index, 1);
};

},{"couchdb-eval":281,"couchdb-objects":284,"node-uuid":306,"pouchdb-plugin-error":307,"pouchdb-promise":308,"promise-nodify":326}],281:[function(require,module,exports){
module.exports=require(52)
},{}],282:[function(require,module,exports){
module.exports=require(27)
},{"./couchusercontextobject.js":283,"extend":285,"is-empty":286,"node-uuid":287,"pouchdb-promise":288,"querystring":23}],283:[function(require,module,exports){
module.exports=require(28)
},{}],284:[function(require,module,exports){
module.exports=require(29)
},{"./couchrequestobject.js":282,"./couchusercontextobject.js":283}],285:[function(require,module,exports){
module.exports=require(30)
},{}],286:[function(require,module,exports){
module.exports=require(31)
},{}],287:[function(require,module,exports){
module.exports=require(32)
},{"buffer":3,"crypto":9}],288:[function(require,module,exports){
module.exports=require(33)
},{"bluebird":292}],289:[function(require,module,exports){
module.exports=require(34)
},{}],290:[function(require,module,exports){
module.exports=require(35)
},{"./INTERNAL":289,"./handlers":291,"./promise":293,"./reject":295,"./resolve":296}],291:[function(require,module,exports){
module.exports=require(36)
},{"./resolveThenable":297,"./states":298,"./tryCatch":299}],292:[function(require,module,exports){
module.exports=require(37)
},{"./all":290,"./promise":293,"./reject":295,"./resolve":296}],293:[function(require,module,exports){
module.exports=require(38)
},{"./INTERNAL":289,"./queueItem":294,"./resolveThenable":297,"./states":298,"./unwrap":300}],294:[function(require,module,exports){
module.exports=require(39)
},{"./handlers":291,"./unwrap":300}],295:[function(require,module,exports){
module.exports=require(40)
},{"./INTERNAL":289,"./handlers":291,"./promise":293}],296:[function(require,module,exports){
module.exports=require(41)
},{"./INTERNAL":289,"./handlers":291,"./promise":293}],297:[function(require,module,exports){
module.exports=require(42)
},{"./handlers":291,"./tryCatch":299}],298:[function(require,module,exports){
module.exports=require(43)
},{}],299:[function(require,module,exports){
module.exports=require(44)
},{}],300:[function(require,module,exports){
module.exports=require(45)
},{"./handlers":291,"immediate":301}],301:[function(require,module,exports){
module.exports=require(46)
},{"./messageChannel":302,"./mutation.js":303,"./nextTick":2,"./stateChange":304,"./timeout":305}],302:[function(require,module,exports){
module.exports=require(47)
},{}],303:[function(require,module,exports){
module.exports=require(48)
},{}],304:[function(require,module,exports){
module.exports=require(49)
},{}],305:[function(require,module,exports){
module.exports=require(50)
},{}],306:[function(require,module,exports){
module.exports=require(32)
},{"buffer":3,"crypto":9}],307:[function(require,module,exports){
/*
  Copyright 2014, Marten de Vries

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

"use strict";

function PouchPluginError(opts) {
  this.status = opts.status;
  this.name = opts.name;
  this.message = opts.message;
  this.error = true;
}

PouchPluginError.prototype = new Error();

PouchPluginError.prototype.toString = function () {
  return JSON.stringify({
    status: this.status,
    name: this.name,
    message: this.message
  });
};

module.exports = PouchPluginError;

},{}],308:[function(require,module,exports){
module.exports=require(33)
},{"bluebird":312}],309:[function(require,module,exports){
module.exports=require(34)
},{}],310:[function(require,module,exports){
module.exports=require(35)
},{"./INTERNAL":309,"./handlers":311,"./promise":313,"./reject":315,"./resolve":316}],311:[function(require,module,exports){
module.exports=require(36)
},{"./resolveThenable":317,"./states":318,"./tryCatch":319}],312:[function(require,module,exports){
module.exports=require(37)
},{"./all":310,"./promise":313,"./reject":315,"./resolve":316}],313:[function(require,module,exports){
module.exports=require(38)
},{"./INTERNAL":309,"./queueItem":314,"./resolveThenable":317,"./states":318,"./unwrap":320}],314:[function(require,module,exports){
module.exports=require(39)
},{"./handlers":311,"./unwrap":320}],315:[function(require,module,exports){
module.exports=require(40)
},{"./INTERNAL":309,"./handlers":311,"./promise":313}],316:[function(require,module,exports){
module.exports=require(41)
},{"./INTERNAL":309,"./handlers":311,"./promise":313}],317:[function(require,module,exports){
module.exports=require(42)
},{"./handlers":311,"./tryCatch":319}],318:[function(require,module,exports){
module.exports=require(43)
},{}],319:[function(require,module,exports){
module.exports=require(44)
},{}],320:[function(require,module,exports){
module.exports=require(45)
},{"./handlers":311,"immediate":321}],321:[function(require,module,exports){
module.exports=require(46)
},{"./messageChannel":322,"./mutation.js":323,"./nextTick":2,"./stateChange":324,"./timeout":325}],322:[function(require,module,exports){
module.exports=require(47)
},{}],323:[function(require,module,exports){
module.exports=require(48)
},{}],324:[function(require,module,exports){
module.exports=require(49)
},{}],325:[function(require,module,exports){
module.exports=require(50)
},{}],326:[function(require,module,exports){
module.exports=require(96)
},{}]},{},[1])