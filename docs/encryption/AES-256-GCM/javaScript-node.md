
# AES-256-GCM Encryption

```mjs
const fs = require('fs');
const crypto = require('crypto');

const algorithm = 'aes-256-gcm';
const password = <PASS>
const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12); 

const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');

const jsonData = <JSON>;
const plaintext = JSON.stringify(jsonData);

const cipher = crypto.createCipheriv(algorithm, key, iv);
let encrypted = cipher.update(plaintext, 'utf8', 'hex');
encrypted += cipher.final('hex');
const authTag = cipher.getAuthTag().toString('hex');

const payload = {
  salt: salt.toString('hex'),
  iv: iv.toString('hex'),
  authTag,
  data: encrypted
};

fs.writeFileSync('encrypted.json', JSON.stringify(payload, null, 2));
console.log('JSON encrypted successfully.');
```

# AES-256-GCM Decryption
```md
const encryptedPayload = JSON.parse(fs.readFileSync('encrypted.json', 'utf8'));
const { salt, iv, authTag, data } = encryptedPayload;
const password = <PASS>
const key = crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), 100000, 32, 'sha512');

const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
decipher.setAuthTag(Buffer.from(authTag, 'hex'));

let decrypted = decipher.update(data, 'hex', 'utf8');
decrypted += decipher.final('utf8');

const originalJSON = JSON.parse(decrypted);
console.log('Decrypted JSON:', originalJSON);
```
