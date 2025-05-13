/**
 * Crypto utilities for encryption and decryption using TweetNaCl
 */
const CryptoUtils = {
    /**
     * Convert a hex string to Uint8Array
     * @param {string} hexString - Hex string to convert
     * @returns {Uint8Array} - Resulting byte array
     */
    hexToUint8Array(hexString) {
        return nacl.util.decodeBase16(hexString.toLowerCase());
    },

    /**
     * Convert Uint8Array to hex string
     * @param {Uint8Array} bytes - Byte array to convert
     * @returns {string} - Hex string
     */
    uint8ArrayToHex(bytes) {
        return nacl.util.encodeBase16(bytes).toLowerCase();
    },

    /**
     * Convert string to Uint8Array
     * @param {string} str - String to convert
     * @returns {Uint8Array} - Resulting byte array
     */
    strToUint8Array(str) {
        return nacl.util.decodeUTF8(str);
    },

    /**
     * Convert Uint8Array to string
     * @param {Uint8Array} bytes - Byte array to convert
     * @returns {string} - Resulting string
     */
    uint8ArrayToStr(bytes) {
        return nacl.util.encodeUTF8(bytes);
    },

    /**
     * Hash a string to a bytes32 compatible hex string
     * @param {string} str - String to hash
     * @returns {string} - Bytes32 compatible hex string
     */
    hashToBytes32(str) {
        // Using SHA-512 truncated to 32 bytes for simplicity (for actual deployment, consider using keccak256)
        const hash = nacl.hash(this.strToUint8Array(str));
        return '0x' + this.uint8ArrayToHex(hash.slice(0, 32));
    },

    /**
     * Generate a key pair for encryption/decryption
     * @returns {Object} - Object containing publicKey and secretKey
     */
    generateKeyPair() {
        const keyPair = nacl.box.keyPair();
        return {
            publicKey: this.uint8ArrayToHex(keyPair.publicKey),
            secretKey: this.uint8ArrayToHex(keyPair.secretKey)
        };
    },

    /**
     * Encrypt a message using the recipient's public key
     * @param {string} message - Plain text message to encrypt
     * @param {string} recipientPublicKeyHex - Recipient's public key in hex format
     * @param {string} senderSecretKeyHex - Sender's secret key in hex format
     * @returns {Object} - Encrypted message with nonce
     */
    encryptMessage(message, recipientPublicKeyHex, senderSecretKeyHex) {
        const messageUint8 = this.strToUint8Array(message);
        const recipientPublicKey = this.hexToUint8Array(recipientPublicKeyHex);
        const senderSecretKey = this.hexToUint8Array(senderSecretKeyHex);
        const nonce = nacl.randomBytes(nacl.box.nonceLength);
        
        const encryptedMessage = nacl.box(
            messageUint8,
            nonce,
            recipientPublicKey,
            senderSecretKey
        );
        
        return {
            encrypted: this.uint8ArrayToHex(encryptedMessage),
            nonce: this.uint8ArrayToHex(nonce)
        };
    },

    /**
     * Decrypt a message using the recipient's secret key
     * @param {string} encryptedHex - Encrypted message in hex format
     * @param {string} nonceHex - Nonce used for encryption in hex format
     * @param {string} senderPublicKeyHex - Sender's public key in hex format
     * @param {string} recipientSecretKeyHex - Recipient's secret key in hex format
     * @returns {string} - Decrypted message
     */
    decryptMessage(encryptedHex, nonceHex, senderPublicKeyHex, recipientSecretKeyHex) {
        const encryptedUint8 = this.hexToUint8Array(encryptedHex);
        const nonceUint8 = this.hexToUint8Array(nonceHex);
        const senderPublicKey = this.hexToUint8Array(senderPublicKeyHex);
        const recipientSecretKey = this.hexToUint8Array(recipientSecretKeyHex);
        
        const decryptedMessage = nacl.box.open(
            encryptedUint8,
            nonceUint8,
            senderPublicKey,
            recipientSecretKey
        );
        
        if (!decryptedMessage) {
            throw new Error('Could not decrypt message');
        }
        
        return this.uint8ArrayToStr(decryptedMessage);
    }
}; 