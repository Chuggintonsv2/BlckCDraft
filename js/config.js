/**
 * config file for messaging dapp
 */
const CONFIG = {
    // contract details
    CONTRACT: {
        // deployed contract address for reference
        ADDRESS: "0xd9145CCE52D386f254917e481eB44e9943F39138", // deployed address
        // abi with needed functions and events
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
    
    // ipfs config
    IPFS: {
        // mock ipfs functionality
        API_URL: "https://dweb.link/api/v0",
        // public gateway for files
        GATEWAY_URL: "https://dweb.link/ipfs/"
    },
    
    // sample user keys for demo
    USERS: [
        {
            name: "Alice",
            // example nacl public keys
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
    
    // network config
    NETWORK: {
        // chain id for sepolia testnet
        CHAIN_ID: 11155111,
        // network name for display
        NETWORK_NAME: "Sepolia",
        // rpc url
        RPC_URL: "https://ethereum-sepolia.publicnode.com"
    },
    
    // github pages url
    PAGES_URL: "https://chuggintonsv2.github.io/BlckCDraft/",
    
    // app config
    APP: {
        // use zero-gas simulation
        SIMULATION_MODE: true,
        // use real contract (costs gas)
        USE_REAL_CONTRACT: false,
        // use real ipfs
        USE_REAL_IPFS: false
    }
}; 