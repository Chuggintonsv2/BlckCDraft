/**
 * crypto utilities for tweetnacl
 */

// fallback if inline script fails
if (typeof nacl !== 'undefined') {
    if (!nacl.util) {
        nacl.util = {};
    }
    
    if (!nacl.util.encodeBase16) {
        nacl.util.encodeBase16 = function(bytes) {
            return Array.from(bytes)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        };
    }
    
    if (!nacl.util.decodeBase16) {
        nacl.util.decodeBase16 = function(hexString) {
            const str = hexString.toLowerCase();
            const bytes = new Uint8Array(str.length / 2);
            for (let i = 0; i < bytes.length; i++) {
                bytes[i] = parseInt(str.substr(i * 2, 2), 16);
            }
            return bytes;
        };
    }
}

const CryptoUtils = {
    /**
     * hex encoding since nacl.util lacks encodebase16
     */
    bytesToHex(bytes) {
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },
    
    /**
     * hex decoding since nacl.util lacks decodebase16
     */
    hexToBytes(hexString) {
        const str = hexString.toLowerCase();
        const bytes = new Uint8Array(str.length / 2);
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(str.substr(i * 2, 2), 16);
        }
        return bytes;
    },

    /**
     * convert hex string to uint8array
     */
    hexToUint8Array(hexString) {
        // try nacl.util first, fallback to our implementation
        try {
            if (nacl.util && typeof nacl.util.decodeBase16 === 'function') {
                return nacl.util.decodeBase16(hexString.toLowerCase());
            }
        } catch (e) {
            console.log("using fallback hex decoder");
        }
        return this.hexToBytes(hexString);
    },

    /**
     * convert uint8array to hex string
     */
    uint8ArrayToHex(bytes) {
        // try nacl.util first, fallback to our implementation
        try {
            if (nacl.util && typeof nacl.util.encodeBase16 === 'function') {
                return nacl.util.encodeBase16(bytes).toLowerCase();
            }
        } catch (e) {
            console.log("using fallback hex encoder");
        }
        return this.bytesToHex(bytes);
    },

    /**
     * convert string to uint8array
     */
    strToUint8Array(str) {
        return nacl.util.decodeUTF8(str);
    },

    /**
     * convert uint8array to string
     */
    uint8ArrayToStr(bytes) {
        return nacl.util.encodeUTF8(bytes);
    },

    /**
     * hash a string to bytes32 format
     */
    hashToBytes32(str) {
        // sha-512 truncated to 32 bytes
        const hash = nacl.hash(this.strToUint8Array(str));
        return '0x' + this.uint8ArrayToHex(hash.slice(0, 32));
    },

    /**
     * generate encryption keypair
     */
    generateKeyPair() {
        const keyPair = nacl.box.keyPair();
        return {
            publicKey: this.uint8ArrayToHex(keyPair.publicKey),
            secretKey: this.uint8ArrayToHex(keyPair.secretKey)
        };
    },

    /**
     * encrypt a message
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
     * decrypt a message
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