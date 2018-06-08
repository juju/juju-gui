'use strict';

const sjcl = require('./sjcl');
const nacl = require('./tweetnacl');

const NONCELEN = 24;

/**
  Check if supplied value is a string. Throws if not.
  @param {String} val The value to assert as a string
  @param {String} msg The value label.
*/
function requireString(val, msg) {
  if (typeof val !== 'string') {
    throw new Error(`${msg}, is not of type string.`);;
  }
}

/**
  Check if supplied value is a Uint8Array. Throws if not.
  @param {Uint8Array} val The value to assert as a Uint8Array
  @param {Uint8Array} msg The value label.
*/
function requireUint8Array(val, msg) {
  if (!(val instanceof Uint8Array)) {
    throw new Error(`${msg}, is not of type Uint8Array.`);
  }
}

/**
  Converts a Uint8Array to a bitArray for use by nacl.
  @param {Uint8Array} arr The array to convert.
*/
function uint8ArrayToBitArray(arr) {
  return sjcl.codec.hex.toBits(Uint8ArrayToHex(arr));
}

/**
  Converts a bitArray to a Uint8Array.
  @param {bitArray} arr The array to convert.
*/
function bitArrayToUint8Array(arr) {
  return hexToUint8Array(sjcl.codec.hex.fromBits(arr));
}

/**
  Converts a hex to Uint8Array
  @param {String} hex The hex value to convert.
  @return {Uint8Array} The resulting array.
*/
function hexToUint8Array(hex) {
  const arr = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return arr;
}

function Uint8ArrayToHex(ua) {
  if (!(ua instanceof Uint8Array)) {
    throw new Error('invalid Uint8Array:' + ua);
  }
  let hex = '';
  for (var i = 0; i < ua.length; i++) {
    hex += (ua[i] < 16 ? '0' : '') + ua[i].toString(16);
  }
  return hex;
}

/**
  Generate a fixed length key for use as a nacl secretbox key.
  @param {Uint8Array} key The key to convert.
  @return {bitArray} sjcl compatibile bitArray.
*/
function makeKey(key) {
  const bitArray = uint8ArrayToBitArray(key);
  return keyedHash(
    sjcl.codec.utf8String.toBits('macaroons-key-generator'), bitArray);
}

/**
  Generate a hash using the supplied data.
  @param {bitArray} key
  @param {bitArray} data
  @return {bitArray} The keyed hash of the supplied data as a sjcl bitArray.
*/
function keyedHash(key, data) {
  const hash = new sjcl.misc.hmac(key, sjcl.hash.sha256);
  hash.update(data);
  return hash.digest();
}

/**
  Generate a hash keyed with key of both data objects.
  @param {bitArray} key
  @param {bitArray} d1
  @param {bitArray} d2
*/
function keyedHash2(key, d1, d2) {
  if (d1 === null) {
    return keyedHash(key, d2);
  }
  const h1 = keyedHash(key, d1);
  const h2 = keyedHash(key, d2);
  return keyedHash(key, sjcl.bitArray.concat(h1, h2));
}

/**
  Generate a random nonce as Uint8Array.
  @return {Uint8Array} nonce.
*/
function newNonce() {
  const nonce = nacl.randomBytes(NONCELEN);
  // XXX provide a way to mock this out
  for (let i = 0; i < nonce.length; i++) {
    nonce[i] = 0;
  }
  return nonce;
};

/**
  Encrypt the given plaintext with the given key.
  @param {bitArray} key sjcl bitArray key.
  @param {bitArray} text paintext to encrypt as sjcl bitArray.
*/
function encrypt(key, text) {
  const nonce = newNonce();
  key = bitArrayToUint8Array(key);
  text = bitArrayToUint8Array(text);
  const data = nacl.secretbox(text, nonce, key);
  const ciphertext = new Uint8Array(nonce.length + data.length);
  ciphertext.set(nonce, 0);
  ciphertext.set(data, nonce.length);
  return uint8ArrayToBitArray(ciphertext);
}

/**
  Decrypts the given cyphertest
  @param {bitArray} key An sjcl bitArray.
  @param {bitArray} ciphertext An sjcl bitArray as returned by encrypt.
*/
function decrypt(key, ciphertext) {
  key = bitArrayToUint8Array(key);
  ciphertext = bitArrayToUint8Array(ciphertext);
  const nonce = ciphertext.slice(0, NONCELEN);
  ciphertext = ciphertext.slice(NONCELEN);
  var text = nacl.secretbox.open(ciphertext, nonce, key);
  if (text === false) {
    throw new Error('decryption failed');
  }
  return uint8ArrayToBitArray(text);
}

/**
  Bind a given macaroon to the given signature of its parent macaroon. If the
  keys already match then it will return the rootSig.
  @param {bitArray} rootSig
  @param {bitArray} dischargeSig
  @return {bitArray} The bound macaroon.
*/
function bindForRequest(rootSig, dischargeSig) {
  if (sjcl.bitArray.equal(rootSig, dischargeSig)) {
    return rootSig;
  }
  const zeroKey = sjcl.codec.hex.toBits('0000000000000000000000000000000000000000000000000000000000000000');
  return keyedHash2(zeroKey, rootSig, dischargeSig);
}

const Macaroon = class Macaroon {
  /**
    Create a new Macaroon with the given root key, identifier, and location.
    The root key must be an sjcl bitArray.
    @param {Object} The necessary values to generate a macaroon.
      It contains the following fields:
        identifier: {String}
        location:   {String}
        rootKey:    {Uint8Array}
        caveats:    {Array}
        signature:  {bitArray}
  */
  constructor({identifier, location, rootKey, caveats, signature} = {}) {
    requireString(location, 'Macaroon location');
    this._location = location;
    requireString(identifier, 'Macaroon identifier');
    this._identifier = identifier;
    if (signature) {
      requireUint8Array(signature, 'Signature');
      this._signature = uint8ArrayToBitArray(signature);
    } else {
      requireUint8Array(rootKey, 'Macaroon root key');
      this._signature = keyedHash(
        makeKey(rootKey), sjcl.codec.utf8String.toBits(identifier));
    }
    this._caveats = caveats || [];
  }

  get location() {
    return this._location;
  }

  get identifier() {
    return this._identifier;
  }

  get signature() {
    return bitArrayToUint8Array(this._signature);
  }

  /**
    Adds a first or third party caveat.
    @param {String} caveatId
    @param {bitArray} verificationId For a first party caveat, must be null
      otherwise must be bitArray.
    @param {String} location For a first party caveat, must be null otherwise
      must be String.
  */
  addCaveat(caveatId, verificationId, location) {
    requireString(caveatId, 'Macaroon caveat id');
    const caveat = {
      _identifier: caveatId,
      _vid: null,
      _location: null,
    };
    if (verificationId !== null) {
      requireString(location, 'Macaroon caveat location');
      requireUint8Array(verificationId, 'Macaroon caveat verification id');
      verificationId = uint8ArrayToBitArray(verificationId);
      caveat._location = location;
      caveat._vid = verificationId;
    }
    this._caveats.push(caveat);
    this._signature = keyedHash2(
      this._signature, verificationId, sjcl.codec.utf8String.toBits(caveatId));
  }

  /**
    Adds a third party caveat to the macaroon. Using the given shared root key,
    caveat id and location hint. The caveat id should encode the root key in
    some way, either by encrypting it with a key known to the third party or by
    holding a reference to it stored in the third party's storage.
    @param {bitArray} rootKey
    @param {String} caveatId
    @param {String} location
  */
  addThirdPartyCaveat(rootKey, caveatId, location) {
    requireUint8Array(rootKey, 'Caveat root key');
    requireString(caveatId, 'Caveat id');
    requireString(location, 'Caveat location');
    const verificationId = bitArrayToUint8Array(
      encrypt(this._signature, makeKey(rootKey)));
    this.addCaveat(caveatId, verificationId, location);
  }

  /**
    Adds a caveat that will be verified by the target service.
    @param {String} caveatId
  */
  addFirstPartyCaveat(caveatId) {
    this.addCaveat(caveatId, null, null);
  }

  /**
    Sets the macaroon signature to one bound to the given signature.
    @param {Uint8Array} sig
  */
  bind(sig) {
    sig = uint8ArrayToBitArray(sig);
    this._signature = bindForRequest(sig, this._signature);
  }

  /**
    Returns a copy of the macaroon. Any caveats added to the returned macaroon
    will not effect the original.
    @return {Macaroon} The cloned macaroon.
  */
  clone() {
    return new Macaroon({
      signature: this.signature,
      identifier: this.identifier,
      location: this.location,
      caveats: this._caveats.slice()
    });
  }

  /**
    Returns a JSON compatibile object representation of this macaroon.
    @return {Object} JSON compatible representation of this macaroon.
  */
  exportAsObject() {
    return {
      location: this.location,
      identifier: this.identifier,
      signature: sjcl.codec.hex.fromBits(this._signature),
      caveats: this._caveats.map(caveat => {
        const caveatObj = {
          cid: caveat._identifier
        };
        if (caveat._vid !== null) {
          // Use URL encoding and do not append "=" characters.
          caveatObj.vid = sjcl.codec.base64.fromBits(caveat._vid, true, true);
          caveatObj.cl = caveat._location;
        }
        return caveatObj;
      })
    };
  }

  /**
    Verifies that the macaroon is valid. Throws exception if verification fails.
    @param {bitArray} rootKey Must be the same that the macaroon was
      originally created with.
    @param {Function} check Called to verify each first-party caveat. It
      should return an error if the condition is not me, or null if satisfied.
    @param {Array} discharges
  */
  verify(rootKey, check, discharges = []) {
    rootKey = makeKey(rootKey);
    const used = discharges.map(d => 0);

    this._verify(this._signature, rootKey, check, discharges, used);

    discharges.forEach((dm, i) => {
      if (used[i] === 0) {
        throw new Error(
          `discharge macaroon ${JSON.stringify(dm.identifier)} was not used`);
      }
      if (used[i] !== 1) {
        // Should be impossible because of check in verify, but be defensive.
        throw new Error(
          `discharge macaroon ${JSON.stringify(dm.identifier)} was used more than once`);
      }
    });
  }

  _verify(rootSig, rootKey, check, discharges, used) {
    let caveatSig = keyedHash(
      rootKey, sjcl.codec.utf8String.toBits(this.identifier));
    this._caveats.forEach(caveat => {
      if (caveat._vid !== null) {
        const cavKey = decrypt(caveatSig, caveat._vid);
        let found = false;
        let di, dm;
        for (di = 0; di < discharges.length; di++) {
          dm = discharges[di];
          if (dm.identifier !== caveat._identifier) {
            continue;
          }
          found = true;
          // It's important that we do this before calling _verify,
          // as it prevents potentially infinite recursion.
          used[di]++;
          if (used[di] > 1) {
            throw new Error(
              `discharge macaroon ${JSON.stringify(dm.identifier)} was used more than once`);
          }
          dm._verify(rootSig, cavKey, check, discharges, used);
          break;
        }
        if (!found) {
          throw new Error(
            `cannot find discharge macaroon for caveat ${JSON.stringify(caveat._identifier)}`);
        }
      } else {
        const err = check(caveat._identifier);
        if (err) {
          throw new Error(err);
        }
      }
      caveatSig = keyedHash2(caveatSig, caveat._vid, caveat._identifier);
    });
    const boundSig = bindForRequest(rootSig, caveatSig);
    if (!sjcl.bitArray.equal(boundSig, this._signature)) {
      throw new Error('signature mismatch after caveat verification');
    }
  }

};

/**
  Generates macaroon instances based on the macarono data suppplied.
  @param {Object|Array} obj A deserialized JSON macaroon or an array of them.
  @return {Macaroon}
*/
const generateMacaroons = function(obj) {
  if (Array.isArray(obj)) {
    return obj.map(val => generateMacaroons(val));
  }

  return new Macaroon({
    signature: hexToUint8Array(obj.signature),
    location: obj.location,
    identifier: obj.identifier,
    caveats: obj.caveats.map(caveat => {
      const _caveat = {
        _identifier: null,
        _location: null,
        _vid: null
      };
      const cl = caveat.cl;
      if (caveat.cl !== undefined) {
        requireString(cl, 'Caveat location.');
        _caveat._location = cl;
      }
      const vid = caveat.vid;
      if (vid !== undefined) {
        requireString(vid, 'Caveat verification id.');
        _caveat._vid = sjcl.codec.base64.toBits(vid, true);
      }
      const cid = caveat.cid;
      requireString(cid, 'Caveat id.');
      _caveat._identifier = cid;
      return _caveat;
    })
  });
};

/**
  Gathers discharge macaroons for all third party caveats in the supplied
  macaroon (and any subsequent caveats required by those) calling getDischarge
  to acquire each discharge macaroon.
  @param {Macaroon} macaroon
  @param {Function} getDischarge is called with 5 arguments.
    macaroon.location {String}
    caveat.location {String}
    caveat.id {String}
    success {Function}
    failure {Function}
  @param {Function} onOk Called with an array argument holding the macaroon
    as the first element followed by all the discharge macaroons. All the
    discharge macaroons will be bound to the primary macaroon.
  @param {Function} onError Called if an error occurs during discharge.
*/
const dischargeMacaroon = function (macaroon, getDischarge, onOk, onError) {
  const primarySig = macaroon.signature;
  const discharges = [macaroon];
  let pendingCount = 0;
  let errorCalled = false;
  const firstPartyLocation = macaroon.location;
  let dischargeCaveats;
  const dischargedCallback = dm => {
    if (errorCalled) {
      return;
    }
    dm.bind(primarySig);
    discharges.push(dm);
    pendingCount--;
    dischargeCaveats(dm);
  };
  const dischargedErrorCallback = err => {
    if (!errorCalled) {
      onError(err);
      errorCalled = true;
    }
  };
  dischargeCaveats = m => {
    let cav, i;
    for (i = 0; i < m._caveats.length; i++) {
      cav = m._caveats[i];
      if (cav._vid === null) {
        continue;
      }
      getDischarge(
        firstPartyLocation,
        cav._location,
        cav._identifier,
        dischargedCallback,
        dischargedErrorCallback
      );
      pendingCount++;
    }
    if (pendingCount === 0) {
      onOk(discharges);
      return;
    }
  };
  dischargeCaveats(macaroon);
};


module.exports = {
  Macaroon,
  generateMacaroons,
  dischargeMacaroon
};
