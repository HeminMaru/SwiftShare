
const rsaGenParams = {
  name: 'RSA-OAEP',
  modulusLength: 1024,
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]), 
  hash: 'SHA-256'
};

const aesGenParams = {
  name: 'AES-GCM',
  length: 256
};

async function gen_rsa_key() {
  const keyPair = await crypto.subtle.generateKey(rsaGenParams, true, ['encrypt', 'decrypt']);
  return keyPair;
}

async function gen_aes_key() {
  const key = await crypto.subtle.generateKey(aesGenParams, true, ['encrypt', 'decrypt']);
  return key;
}

async function encrypt_file_chunk(key, message) {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await crypto.subtle.encrypt({ name: aesGenParams.name, iv }, key, message);
  const encryptedArray = new Uint8Array(encryptedData);

  const result = new Uint8Array(iv.length + encryptedArray.length);
  result.set(iv);
  result.set(encryptedArray, iv.length);

  return result;
}

async function encrypt_aes_key(publicKey, aesKey) {
  const exportedAesKey = await crypto.subtle.exportKey('raw', aesKey);
  const encryptedAesKey = await crypto.subtle.encrypt(
    { name: rsaGenParams.name },
    publicKey,
    exportedAesKey
  );
  return new Uint8Array(encryptedAesKey);
}

async function decrypt_aes_key(privateKey, encryptedAesKey) {
  const decryptedAesKey = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    encryptedAesKey
  );
  const aesKey = await crypto.subtle.importKey(
    'raw',
    decryptedAesKey,
    { name: aesGenParams.name },
    true,
    ['encrypt', 'decrypt']
  );
  return aesKey;
}

async function decrypt_file_chunk(key, encryptedData) {
  const iv = encryptedData.slice(0, 12);
  const encryptedMessage = encryptedData.slice(12);

  const decryptedData = await crypto.subtle.decrypt(
    { name: aesGenParams.name, iv },
    key,
    encryptedMessage
  );

  return new Uint8Array(decryptedData);
}

function array_to_b64(buffer) {
  const byteArray = new Uint8Array(buffer);
  const byteString = String.fromCharCode.apply(null, byteArray);
  const base64String = btoa(byteString);
  return base64String;
}

async function send_rsa(publicKey) {
  const exportedPublicKey = await crypto.subtle.exportKey('spki', publicKey);
  return array_to_b64(exportedPublicKey);
}

function b64_to_array(base64) {
  const binaryString = atob(base64);
  const byteArray = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    byteArray[i] = binaryString.charCodeAt(i);
  }
  return byteArray.buffer;
}

async function get_rsa(base64PublicKey) {
  const publicKeyBuffer = b64_to_array(base64PublicKey);
  const publicKey = await crypto.subtle.importKey('spki', publicKeyBuffer, rsaGenParams, true, [
    'encrypt'
  ]);
  return publicKey;
}

export {
  gen_rsa_key,
  gen_aes_key,
  encrypt_file_chunk,
  encrypt_aes_key,
  decrypt_aes_key,
  decrypt_file_chunk,
  send_rsa,
  get_rsa,
};
