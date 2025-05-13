/**
 * Configuration file for the encrypted messaging dApp
 */
const CONFIG = {
    // Contract details - For a real deployment, you would replace with actual contract details
    CONTRACT: {
        // This is a placeholder address. You would replace it with the actual deployed contract address
        ADDRESS: "0x0000000000000000000000000000000000000000",
        // ABI excerpt containing just the functions and events we need
        ABI: [
            {
                "inputs": [
                    {
                        "internalType": "bytes32",
                        "name": "recipientHash",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "messageHash",
                        "type": "bytes32"
                    }
                ],
                "name": "sendMessage",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "sender",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "recipientHash",
                        "type": "bytes32"
                    },
                    {
                        "indexed": false,
                        "internalType": "bytes32",
                        "name": "messageHash",
                        "type": "bytes32"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    }
                ],
                "name": "MessageSent",
                "type": "event"
            }
        ]
    },
    
    // IPFS configuration - Using public gateway
    IPFS: {
        // For demo purposes, we're using mock IPFS functionality
        // In production, you would use a real IPFS API endpoint
        API_URL: "https://dweb.link/api/v0",
        // Public gateway for retrieving files
        GATEWAY_URL: "https://dweb.link/ipfs/"
    },
    
    // Sample user public keys for the demo
    // In a real application, these would be fetched from a registry or user directory
    USERS: [
        {
            name: "Alice",
            // These are example NaCl public keys in hex format - generated for demo purposes only
            publicKey: "8f40c5adb68f25624ee5170fa14c64a4b3c4ce08c14071d9091232e37e85e1d5",
            address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
        },
        {
            name: "Bob",
            publicKey: "52817c8fbc67aa70f2c9968f91962d9a2676c8bebf62859a5baac8228e363898",
            address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        },
        {
            name: "Charlie",
            publicKey: "4a47f147c6a39d0f8ee935815904ab8a5d2c9f0adfb1f5c837b095c4de87e568",
            address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
        }
    ],
    
    // Network configuration
    NETWORK: {
        // Chain ID for Sepolia testnet
        CHAIN_ID: 11155111,
        // Network name for display
        NETWORK_NAME: "Sepolia",
        // RPC URL for the testnet - This is a public Sepolia RPC endpoint
        RPC_URL: "https://eth-sepolia.g.alchemy.com/v2/demo"
    },
    
    // GitHub Pages URL - Update this with your actual GitHub Pages URL
    PAGES_URL: "https://chuggintonsv2.github.io/BlckCDraft/"
}; 