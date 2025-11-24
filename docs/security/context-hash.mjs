import { blake3 } from '@noble/hashes/blake3.js';
const data = new TextEncoder().encode('your context data');
const digest = blake3(data);  // Uint8Array
const hex = Array.from(digest).map(b => b.toString(16).padStart(2, '0')).join('');
console.log(hex);

import { sha256 } from '@noble/hashes/sha2.js';
const hash = sha256(new TextEncoder().encode('your data here'));
