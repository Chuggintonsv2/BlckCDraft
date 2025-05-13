/**
 * Encrypted Messaging dApp - Main Application Logic
 */
document.addEventListener('DOMContentLoaded', () => {
    const App = {
        // App state
        account: null,
        provider: null,
        contract: null,
        keyPair: null,
        ipfs: null,
        demoMode: CONFIG.APP.DEMO_MODE, // Use configuration value
        
        // DOM elements
        connectWalletBtn: document.getElementById('connectWallet'),
        connectionStatus: document.getElementById('connectionStatus'),
        userAddress: document.getElementById('userAddress'),
        sendMessageCard: document.getElementById('sendMessageCard'),
        sendMessageForm: document.getElementById('sendMessageForm'),
        recipientSelect: document.getElementById('recipient'),
        messageInput: document.getElementById('messageInput'),
        inboxCard: document.getElementById('inboxCard'),
        messagesContainer: document.getElementById('messagesContainer'),
        loadingMessages: document.getElementById('loadingMessages'),
        noMessages: document.getElementById('noMessages'),
        messagesList: document.getElementById('messagesList'),
        sendBtn: document.getElementById('sendBtn'),
        sendBtnText: document.getElementById('sendBtnText'),
        sendSpinner: document.getElementById('sendSpinner'),
        statusToast: document.getElementById('statusToast'),
        toastTitle: document.getElementById('toastTitle'),
        toastMessage: document.getElementById('toastMessage'),
        
        // Bootstrap toast instance
        toast: null,
        
        /**
         * Initialize the application
         */
        async init() {
            console.log(`App starting in ${this.demoMode ? 'DEMO' : 'PRODUCTION'} mode`);
            
            // Initialize UI components
            this.initializeUIComponents();
            
            // Check if MetaMask is installed
            if (window.ethereum) {
                this.provider = new ethers.providers.Web3Provider(window.ethereum);
                
                // Handle account changes
                window.ethereum.on('accountsChanged', (accounts) => {
                    if (accounts.length === 0) {
                        this.handleDisconnect();
                    } else {
                        this.account = accounts[0];
                        this.updateUIAfterLogin();
                    }
                });
                
                // Handle chain changes
                window.ethereum.on('chainChanged', () => {
                    window.location.reload();
                });
                
                // Try to auto-connect
                try {
                    const accounts = await this.provider.listAccounts();
                    if (accounts.length > 0) {
                        this.account = accounts[0];
                        await this.checkNetwork();
                        await this.setupContractConnection();
                        this.updateUIAfterLogin();
                    }
                } catch (error) {
                    console.error("Auto-connect failed:", error);
                }
            } else {
                this.showError("MetaMask Not Detected", "Please install MetaMask to use this dApp");
            }
            
            // Add event listeners
            this.addEventListeners();
        },
        
        /**
         * Check if connected to the correct network and switch if needed
         */
        async checkNetwork() {
            try {
                // Get the current chain ID
                const chainId = await this.provider.getNetwork().then(network => network.chainId);
                
                // If not on the correct network, prompt to switch
                if (chainId !== CONFIG.NETWORK.CHAIN_ID) {
                    console.log(`Wrong network detected: ${chainId}. Switching to ${CONFIG.NETWORK.CHAIN_ID}`);
                    
                    try {
                        // Try to switch to the required network
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: `0x${CONFIG.NETWORK.CHAIN_ID.toString(16)}` }],
                        });
                        
                        // Refresh provider after network switch
                        this.provider = new ethers.providers.Web3Provider(window.ethereum);
                        return true;
                    } catch (switchError) {
                        // This error code indicates that the chain has not been added to MetaMask
                        if (switchError.code === 4902) {
                            try {
                                await window.ethereum.request({
                                    method: 'wallet_addEthereumChain',
                                    params: [
                                        {
                                            chainId: `0x${CONFIG.NETWORK.CHAIN_ID.toString(16)}`,
                                            chainName: CONFIG.NETWORK.NETWORK_NAME,
                                            rpcUrls: [CONFIG.NETWORK.RPC_URL],
                                            nativeCurrency: {
                                                name: 'Ether',
                                                symbol: 'ETH',
                                                decimals: 18
                                            },
                                            blockExplorerUrls: [`https://${CONFIG.NETWORK.NETWORK_NAME.toLowerCase()}.etherscan.io`]
                                        },
                                    ],
                                });
                                
                                // Refresh provider after network add
                                this.provider = new ethers.providers.Web3Provider(window.ethereum);
                                return true;
                            } catch (addError) {
                                console.error('Error adding the network to MetaMask:', addError);
                                this.showError("Network Error", `Please manually add and switch to ${CONFIG.NETWORK.NETWORK_NAME} network in MetaMask`);
                                return false;
                            }
                        } else {
                            console.error('Error switching networks:', switchError);
                            this.showError("Network Error", `Please manually switch to ${CONFIG.NETWORK.NETWORK_NAME} network in MetaMask`);
                            return false;
                        }
                    }
                }
                
                return true;
            } catch (error) {
                console.error("Network check failed:", error);
                return false;
            }
        },
        
        /**
         * Initialize UI components
         */
        initializeUIComponents() {
            // Initialize Bootstrap toast
            this.toast = new bootstrap.Toast(this.statusToast);
            
            // Initialize recipient dropdown
            CONFIG.USERS.forEach(user => {
                const option = document.createElement('option');
                option.value = user.publicKey;
                option.textContent = `${user.name} (${user.address.substring(0, 8)}...)`;
                option.dataset.address = user.address;
                this.recipientSelect.appendChild(option);
            });
            
            // Update UI to show correct mode notice
            const demoNotice = document.querySelector('.demo-notice');
            
            if (this.demoMode) {
                demoNotice.style.display = 'block';
            } else {
                demoNotice.style.display = 'none';
            }
        },
        
        /**
         * Add event listeners to UI elements
         */
        addEventListeners() {
            // Connect wallet button
            this.connectWalletBtn.addEventListener('click', this.connectWallet.bind(this));
            
            // Send message form
            this.sendMessageForm.addEventListener('submit', this.handleSendMessage.bind(this));
        },
        
        /**
         * Connect to MetaMask wallet
         */
        async connectWallet() {
            if (!window.ethereum) {
                this.showError("MetaMask Not Detected", "Please install MetaMask to use this dApp");
                return;
            }
            
            try {
                // Request accounts from MetaMask
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.account = accounts[0];
                
                // Check if on the correct network and switch if needed
                const networkChecked = await this.checkNetwork();
                if (!networkChecked) {
                    return;
                }
                
                // Setup contract connection
                await this.setupContractConnection();
                
                // Update UI after successful login
                this.updateUIAfterLogin();
                
                // Show success message
                this.showSuccess("Wallet Connected", "Successfully connected to MetaMask");
            } catch (error) {
                console.error("Connection error:", error);
                this.showError("Connection Failed", "Failed to connect to MetaMask");
            }
        },
        
        /**
         * Set up contract connection
         */
        async setupContractConnection() {
            try {
                // Get the signer
                const signer = this.provider.getSigner();
                
                // Check if we're in demo mode or have a zero contract address
                if (this.demoMode || CONFIG.CONTRACT.ADDRESS === "0x0000000000000000000000000000000000000000") {
                    console.log("Running in demo mode with mock contract");
                    
                    // Create a mock contract with the same interface
                    this.contract = {
                        sendMessage: async (recipientHash, messageHash) => {
                            console.log("Mock contract - sendMessage called with:", recipientHash, messageHash);
                            // Simulate transaction delay
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            // Return a mock transaction object
                            return {
                                wait: async () => {
                                    console.log("Mock transaction confirmed");
                                    // Simulate event emission
                                    setTimeout(() => {
                                        if (typeof this.mockMessageEventCallback === 'function') {
                                            const event = {
                                                sender: this.account,
                                                recipientHash,
                                                messageHash,
                                                timestamp: Math.floor(Date.now() / 1000)
                                            };
                                            this.mockMessageEventCallback(
                                                event.sender,
                                                event.recipientHash,
                                                event.messageHash,
                                                event.timestamp,
                                                event
                                            );
                                        }
                                    }, 1500);
                                    return { hash: "0x" + Array(64).fill("0").join("") };
                                }
                            };
                        },
                        on: (eventName, callback) => {
                            console.log("Mock contract - listening for event:", eventName);
                            if (eventName === "MessageSent") {
                                this.mockMessageEventCallback = callback;
                            }
                            return {
                                removeAllListeners: () => {
                                    console.log("Mock contract - removed event listeners");
                                    this.mockMessageEventCallback = null;
                                }
                            };
                        }
                    };
                } else {
                    console.log("Using real contract at address:", CONFIG.CONTRACT.ADDRESS);
                    // Create real contract instance with the actual deployed address
                    this.contract = new ethers.Contract(
                        CONFIG.CONTRACT.ADDRESS,
                        CONFIG.CONTRACT.ABI,
                        signer
                    );
                }
                
                // Set up IPFS client
                if (CONFIG.APP.USE_REAL_IPFS) {
                    try {
                        // Initialize real IPFS client
                        // Note: For this to work, you'd need to include the correct IPFS client library
                        // and potentially set up authentication with Web3.Storage or Infura
                        console.log("Using real IPFS client");
                        
                        // Example using Web3.Storage (you'd need to add the library)
                        // const token = 'your-web3-storage-token';
                        // this.ipfs = new Web3Storage({ token });
                        
                        // For now, we'll still use a mock implementation
                        this.ipfs = {
                            add: async (content) => {
                                console.log("Real IPFS upload would happen here:", content);
                                // Simulate upload delay
                                await new Promise(resolve => setTimeout(resolve, 500));
                                // Return a mock CID (in a real app, this would be a real CID)
                                const mockCid = "Qm" + CryptoUtils.uint8ArrayToHex(nacl.randomBytes(32)).substring(0, 44);
                                return { path: mockCid };
                            },
                            cat: async (cid) => {
                                console.log("Real IPFS fetch would happen here:", cid);
                                // Simulate fetch delay
                                await new Promise(resolve => setTimeout(resolve, 500));
                                // In a real app, this would fetch and return the actual content
                                return JSON.stringify({
                                    encrypted: "mockEncryptedData",
                                    nonce: "mockNonce",
                                    sender: "mockSenderPublicKey"
                                });
                            }
                        };
                    } catch (error) {
                        console.error("Failed to initialize real IPFS client:", error);
                        this.showError("IPFS Error", "Failed to connect to IPFS. Using mock client instead.");
                        
                        // Fall back to mock IPFS client
                        this.initializeMockIPFS();
                    }
                } else {
                    // Use mock IPFS client
                    this.initializeMockIPFS();
                }
                
                // Generate a key pair for the current session
                // In a real app, you might want to persistently store this
                try {
                    console.log("Generating key pair...");
                    // Test if cryptography functions are working
                    if (typeof nacl === 'undefined') {
                        throw new Error("TweetNaCl library is not loaded properly");
                    }
                    
                    if (typeof nacl.box === 'undefined') {
                        throw new Error("TweetNaCl box functionality is not available");
                    }
                    
                    if (typeof nacl.box.keyPair !== 'function') {
                        throw new Error("TweetNaCl keyPair function is not available");
                    }
                    
                    // Check if custom hex functions work
                    const testBytes = new Uint8Array([1, 2, 3, 4]);
                    const testHex = CryptoUtils.uint8ArrayToHex(testBytes);
                    console.log("Hex encoding test:", testHex);
                    
                    this.keyPair = CryptoUtils.generateKeyPair();
                    console.log("Generated key pair for current session");
                } catch (cryptoError) {
                    console.error("Cryptography error:", cryptoError);
                    this.showError("Crypto Error", "Failed to initialize encryption. Error: " + cryptoError.message);
                    throw cryptoError;
                }
                
                // Start listening for messages
                this.startListeningForMessages();
            } catch (error) {
                console.error("Setup error:", error);
                this.showError("Setup Failed", "Failed to set up contract connection: " + error.message);
                throw error;
            }
        },
        
        /**
         * Initialize mock IPFS client
         */
        initializeMockIPFS() {
            console.log("Using mock IPFS client");
            this.ipfs = {
                add: async (content) => {
                    // Simulate IPFS upload delay
                    await new Promise(resolve => setTimeout(resolve, 500));
                    // Return a mock CID
                    const mockCid = "Qm" + CryptoUtils.uint8ArrayToHex(nacl.randomBytes(32)).substring(0, 44);
                    return { path: mockCid };
                },
                cat: async (cid) => {
                    // Simulate IPFS fetch delay
                    await new Promise(resolve => setTimeout(resolve, 500));
                    // In a real app, this would fetch and return the actual content
                    return JSON.stringify({
                        encrypted: "mockEncryptedData",
                        nonce: "mockNonce",
                        sender: "mockSenderPublicKey"
                    });
                }
            };
        },
        
        /**
         * Update UI after successful login
         */
        updateUIAfterLogin() {
            // Update connection status
            this.connectionStatus.textContent = "Connected";
            this.connectionStatus.classList.remove('bg-danger');
            this.connectionStatus.classList.add('bg-success');
            
            // Update user address
            this.userAddress.textContent = this.account;
            
            // Show send message and inbox cards
            this.sendMessageCard.style.display = 'block';
            this.inboxCard.style.display = 'block';
            
            // Update button text
            this.connectWalletBtn.textContent = "Connected";
            this.connectWalletBtn.disabled = true;
        },
        
        /**
         * Handle disconnection
         */
        handleDisconnect() {
            // Reset state
            this.account = null;
            this.contract = null;
            
            // Update UI
            this.connectionStatus.textContent = "Not connected";
            this.connectionStatus.classList.remove('bg-success');
            this.connectionStatus.classList.add('bg-danger');
            this.userAddress.textContent = "";
            this.sendMessageCard.style.display = 'none';
            this.inboxCard.style.display = 'none';
            this.connectWalletBtn.textContent = "Connect MetaMask";
            this.connectWalletBtn.disabled = false;
        },
        
        /**
         * Handle sending a message
         * @param {Event} event - Form submit event
         */
        async handleSendMessage(event) {
            event.preventDefault();
            
            const recipient = this.recipientSelect.value;
            const message = this.messageInput.value.trim();
            
            if (!recipient || !message) {
                this.showError("Input Error", "Please select a recipient and enter a message");
                return;
            }
            
            try {
                // Show loading state
                this.setSendingState(true);
                
                // Get selected recipient
                const selectedOption = this.recipientSelect.options[this.recipientSelect.selectedIndex];
                const recipientAddress = selectedOption.dataset.address;
                
                // Generate recipient hash for privacy
                const recipientHash = CryptoUtils.hashToBytes32(recipientAddress);
                
                // Encrypt the message using NaCl box
                const encryptedData = CryptoUtils.encryptMessage(
                    message,
                    recipient, // recipient's public key
                    this.keyPair.secretKey // sender's secret key
                );
                
                // Prepare message package
                const messagePackage = {
                    encrypted: encryptedData.encrypted,
                    nonce: encryptedData.nonce,
                    sender: this.keyPair.publicKey,
                    timestamp: Date.now()
                };
                
                // Upload encrypted message to IPFS
                console.log("Uploading to IPFS...");
                try {
                    const result = await this.ipfs.add(JSON.stringify(messagePackage));
                    const cid = result.path;
                    console.log("IPFS CID:", cid);
                    
                    // Convert CID to bytes32 compatible format
                    const messageHash = CryptoUtils.hashToBytes32(cid);
                    
                    // Record metadata in smart contract
                    console.log("Sending transaction to blockchain...");
                    console.log("Contract address:", CONFIG.CONTRACT.ADDRESS);
                    console.log("Recipient hash:", recipientHash);
                    console.log("Message hash:", messageHash);
                    
                    try {
                        const tx = await this.contract.sendMessage(recipientHash, messageHash);
                        console.log("Transaction submitted:", tx);
                        
                        // Wait for transaction to be mined
                        const receipt = await tx.wait();
                        console.log("Transaction confirmed:", receipt);
                        
                        // Clear the form and show success message
                        this.messageInput.value = "";
                        this.showSuccess("Message Sent", "Your encrypted message has been sent!");
                    } catch (txError) {
                        console.error("Transaction error:", txError);
                        let errorMsg = "Failed to send the transaction.";
                        
                        if (txError.code === 'INSUFFICIENT_FUNDS') {
                            errorMsg = "You don't have enough ETH to send this transaction. Please get some Sepolia testnet ETH from a faucet.";
                        } else if (txError.code === 'UNPREDICTABLE_GAS_LIMIT') {
                            errorMsg = "Contract error. Please check that you're connected to the correct network.";
                        } else if (txError.message) {
                            errorMsg += " " + txError.message;
                        }
                        
                        this.showError("Transaction Failed", errorMsg);
                    }
                } catch (ipfsError) {
                    console.error("IPFS error:", ipfsError);
                    this.showError("IPFS Error", "Failed to upload message to IPFS: " + ipfsError.message);
                }
            } catch (error) {
                console.error("Send message error:", error);
                this.showError("Send Failed", "Failed to send the message: " + error.message);
            } finally {
                // Reset loading state
                this.setSendingState(false);
            }
        },
        
        /**
         * Set the sending state of the form
         * @param {boolean} isSending - Whether message is being sent
         */
        setSendingState(isSending) {
            if (isSending) {
                this.sendBtnText.textContent = "Sending...";
                this.sendSpinner.classList.remove('d-none');
                this.sendBtn.disabled = true;
            } else {
                this.sendBtnText.textContent = "Send Encrypted Message";
                this.sendSpinner.classList.add('d-none');
                this.sendBtn.disabled = false;
            }
        },
        
        /**
         * Start listening for messages
         */
        async startListeningForMessages() {
            if (!this.contract) return;
            
            // Calculate the recipient hash for the current user
            const myRecipientHash = CryptoUtils.hashToBytes32(this.account);
            console.log("My recipient hash:", myRecipientHash);
            
            // Hide loading and show no messages initially
            this.loadingMessages.style.display = 'none';
            this.noMessages.style.display = 'block';
            
            try {
                // In a real application, fetch past events
                if (!this.demoMode) {
                    console.log("Fetching past messages...");
                    try {
                        // Query past MessageSent events where recipientHash matches the current user
                        const filter = this.contract.filters.MessageSent(null, myRecipientHash);
                        const events = await this.contract.queryFilter(filter, -10000); // Look back 10000 blocks
                        
                        console.log(`Found ${events.length} past messages`);
                        
                        if (events.length > 0) {
                            this.noMessages.style.display = 'none';
                            
                            // Process each event
                            for (const event of events) {
                                const { sender, messageHash, timestamp } = event.args;
                                await this.processMessage(sender, messageHash, timestamp);
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching past messages:", error);
                        this.showError("Message Error", "Failed to fetch past messages");
                    }
                }
                
                // Listen for new MessageSent events
                console.log("Listening for incoming messages...");
                
                this.contract.on("MessageSent", async (sender, recipientHash, messageHash, timestamp, event) => {
                    console.log("Message event detected:", sender, recipientHash, messageHash);
                    
                    // Check if this message is for the current user
                    if (recipientHash === myRecipientHash) {
                        console.log("New message for current user detected!");
                        
                        try {
                            if (this.demoMode) {
                                // For demo purposes, display mock messages
                                await this.displayMockMessage(sender, timestamp);
                            } else {
                                // In production mode, process the real message
                                await this.processMessage(sender, messageHash, timestamp);
                            }
                        } catch (error) {
                            console.error("Error processing message:", error);
                        }
                    }
                });
                
                // For demo, add some mock messages
                if (this.demoMode) {
                    setTimeout(() => {
                        this.displayMockMessage("0x71C7656EC7ab88b098defB751B7401B5f6d8976F", Date.now() - 3600000);
                        this.displayMockMessage("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", Date.now() - 1800000);
                    }, 2000);
                }
            } catch (error) {
                console.error("Error setting up message listener:", error);
            }
        },
        
        /**
         * Process a real message from the blockchain
         * @param {string} sender - Sender address
         * @param {string} messageHash - IPFS CID hash
         * @param {number} timestamp - Message timestamp
         */
        async processMessage(sender, messageHash, timestamp) {
            try {
                // In a real implementation, we would:
                // 1. Fetch the encrypted message from IPFS using the messageHash
                // 2. Decrypt the message using the recipient's private key
                
                // For this demo, we'll just show a placeholder
                // Hide the "no messages" display if it's visible
                this.noMessages.style.display = 'none';
                
                // Find sender name from CONFIG
                let senderName = "Unknown User";
                const senderObj = CONFIG.USERS.find(user => user.address.toLowerCase() === sender.toLowerCase());
                if (senderObj) {
                    senderName = senderObj.name;
                }
                
                // Convert timestamp from BigNumber if needed
                const timeValue = typeof timestamp === 'object' && timestamp.toNumber ? 
                    timestamp.toNumber() * 1000 : // Convert from seconds to milliseconds
                    Number(timestamp) * 1000;
                    
                // Format the timestamp
                const date = new Date(timeValue);
                const formattedDate = date.toLocaleString();
                
                // Create a message card
                const card = document.createElement('div');
                card.className = 'card message-card';
                
                // Set the card content with real message data
                card.innerHTML = `
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div>
                            <b>${senderName}</b>
                            <small class="text-muted">(${sender.substring(0, 8)}...)</small>
                        </div>
                        <small class="text-muted">${formattedDate}</small>
                    </div>
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <p class="card-text mb-0">Encrypted message received (IPFS hash: ${messageHash.substring(0, 10)}...)</p>
                        </div>
                    </div>
                `;
                
                // Add the card to the messages list
                this.messagesList.prepend(card);
            } catch (error) {
                console.error("Error processing message:", error);
            }
        },
        
        /**
         * Display a mock message (for demo purposes)
         * @param {string} sender - Sender address
         * @param {number} timestamp - Message timestamp
         */
        async displayMockMessage(sender, timestamp) {
            // Hide the "no messages" display if it's visible
            this.noMessages.style.display = 'none';
            
            // Find sender name from CONFIG
            let senderName = "Unknown User";
            const senderObj = CONFIG.USERS.find(user => user.address.toLowerCase() === sender.toLowerCase());
            if (senderObj) {
                senderName = senderObj.name;
            }
            
            // Create a message card
            const card = document.createElement('div');
            card.className = 'card message-card';
            
            // Format the timestamp
            const date = new Date(timestamp);
            const formattedDate = date.toLocaleString();
            
            // Set the card content
            card.innerHTML = `
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div>
                        <b>${senderName}</b>
                        <small class="text-muted">(${sender.substring(0, 8)}...)</small>
                    </div>
                    <small class="text-muted">${formattedDate}</small>
                </div>
                <div class="card-body">
                    <p class="card-text">This is a mock encrypted message that would be decrypted in a real application.</p>
                </div>
            `;
            
            // Add the card to the messages list
            this.messagesList.prepend(card);
        },
        
        /**
         * Show a success toast message
         * @param {string} title - Toast title
         * @param {string} message - Toast message
         */
        showSuccess(title, message) {
            this.toastTitle.textContent = title;
            this.toastMessage.textContent = message;
            this.statusToast.classList.remove('bg-danger');
            this.statusToast.classList.add('bg-success');
            this.toast.show();
        },
        
        /**
         * Show an error toast message
         * @param {string} title - Toast title
         * @param {string} message - Toast message
         */
        showError(title, message) {
            this.toastTitle.textContent = title;
            this.toastMessage.textContent = message;
            this.statusToast.classList.remove('bg-success');
            this.statusToast.classList.add('bg-danger');
            this.toast.show();
        }
    };
    
    // Initialize the application
    App.init();
}); 