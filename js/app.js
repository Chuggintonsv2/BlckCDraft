/**
 * messaging dapp - main application logic
 */
document.addEventListener('DOMContentLoaded', () => {
    // check tweetnacl
    if (typeof nacl === 'undefined') {
        alert('TweetNaCl library failed to load. Please check your internet connection and refresh the page.');
        console.error('TweetNaCl library not found');
        return;
    }
    
    if (typeof nacl.util === 'undefined') {
        alert('TweetNaCl utilities failed to load. Please check your internet connection and refresh the page.');
        console.error('TweetNaCl utilities not found');
        return;
    }
    
    // test hex encoding
    try {
        const testBytes = new Uint8Array([1, 2, 3, 4]);
        const testHex = nacl.util.encodeBase16(testBytes);
        console.log("TweetNaCl hex encoding test passed:", testHex);
    } catch (e) {
        console.error("TweetNaCl hex encoding test failed:", e);
        alert('TweetNaCl encryption functions are not working properly. Please refresh the page and try again.');
        return;
    }
    
    const App = {
        // app state
        account: null,
        provider: null,
        contract: null,
        keyPair: null,
        ipfs: null,
        demoMode: CONFIG.APP.DEMO_MODE, // use config value
        
        // dom elements
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
        
        // bootstrap toast
        toast: null,
        
        /**
         * initialize app
         */
        async init() {
            console.log(`App starting in ${this.demoMode ? 'DEMO' : 'PRODUCTION'} mode`);
            
            // init ui
            this.initializeUIComponents();
            
            // check metamask
            if (window.ethereum) {
                this.provider = new ethers.providers.Web3Provider(window.ethereum);
                
                // handle account changes
                window.ethereum.on('accountsChanged', (accounts) => {
                    if (accounts.length === 0) {
                        this.handleDisconnect();
                    } else {
                        this.account = accounts[0];
                        this.updateUIAfterLogin();
                    }
                });
                
                // handle chain changes
                window.ethereum.on('chainChanged', () => {
                    window.location.reload();
                });
                
                // try auto-connect
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
            
            // add event listeners
            this.addEventListeners();
        },
        
        /**
         * check network and switch if needed
         */
        async checkNetwork() {
            try {
                // get chain id
                const chainId = await this.provider.getNetwork().then(network => network.chainId);
                
                // switch if needed
                if (chainId !== CONFIG.NETWORK.CHAIN_ID) {
                    console.log(`Wrong network detected: ${chainId}. Switching to ${CONFIG.NETWORK.CHAIN_ID}`);
                    
                    try {
                        // try switch
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: `0x${CONFIG.NETWORK.CHAIN_ID.toString(16)}` }],
                        });
                        
                        // refresh provider
                        this.provider = new ethers.providers.Web3Provider(window.ethereum);
                        return true;
                    } catch (switchError) {
                        // chain not added to metamask
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
                                
                                // refresh provider
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
         * init ui components
         */
        initializeUIComponents() {
            // init toast
            this.toast = new bootstrap.Toast(this.statusToast);
            
            // init recipient dropdown
            CONFIG.USERS.forEach(user => {
                const option = document.createElement('option');
                option.value = user.publicKey;
                option.textContent = `${user.name} (${user.address.substring(0, 8)}...)`;
                option.dataset.address = user.address;
                this.recipientSelect.appendChild(option);
            });
        },
        
        /**
         * add event listeners
         */
        addEventListeners() {
            // connect wallet button
            this.connectWalletBtn.addEventListener('click', this.connectWallet.bind(this));
            
            // send message form
            this.sendMessageForm.addEventListener('submit', this.handleSendMessage.bind(this));
        },
        
        /**
         * connect to metamask
         */
        async connectWallet() {
            if (!window.ethereum) {
                this.showError("MetaMask Not Detected", "Please install MetaMask to use this dApp");
                return;
            }
            
            try {
                // request accounts
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.account = accounts[0];
                
                // check network
                const networkChecked = await this.checkNetwork();
                if (!networkChecked) {
                    return;
                }
                
                // setup contract
                await this.setupContractConnection();
                
                // update ui
                this.updateUIAfterLogin();
                
                // show success
                this.showSuccess("Wallet Connected", "Successfully connected to MetaMask");
            } catch (error) {
                console.error("Connection error:", error);
                this.showError("Connection Failed", "Failed to connect to MetaMask");
            }
        },
        
        /**
         * setup contract connection
         */
        async setupContractConnection() {
            try {
                // get signer
                const signer = this.provider.getSigner();
                
                // check simulation mode
                if (CONFIG.APP.SIMULATION_MODE || !CONFIG.APP.USE_REAL_CONTRACT) {
                    console.log("Running in simulation mode - transactions will be simulated (no gas fees)");
                    
                    // create simulation contract
                    this.contract = {
                        // reference only
                        address: CONFIG.CONTRACT.ADDRESS,
                        
                        // simulated function
                        sendMessage: async (recipientHash, messageHash) => {
                            console.log("Simulation - sendMessage called with:", recipientHash, messageHash);
                            // simulate delay
                            await new Promise(resolve => setTimeout(resolve, 800));
                            
                            // user feedback
                            console.log("Simulation - transaction would cost gas but is being simulated");
                            
                            // simulated tx object
                            return {
                                wait: async () => {
                                    console.log("Simulation - transaction confirmed (no gas spent)");
                                    // simulate event
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
                                    }, 1000);
                                    return { 
                                        hash: "0xsimulated" + Array(56).fill("0").join(""),
                                        wait: () => Promise.resolve(true)
                                    };
                                }
                            };
                        },
                        
                        // event listener
                        on: (eventName, callback) => {
                            console.log("Simulation - listening for event:", eventName);
                            if (eventName === "MessageSent") {
                                this.mockMessageEventCallback = callback;
                            }
                            return {
                                removeAllListeners: () => {
                                    console.log("Simulation - removed event listeners");
                                    this.mockMessageEventCallback = null;
                                }
                            };
                        },
                        
                        // mock query filter
                        queryFilter: async (filter, fromBlock, toBlock) => {
                            console.log("Simulation - queryFilter called:", filter);
                            // empty array
                            return [];
                        },
                        
                        // other methods
                        filters: {
                            MessageSent: (sender, recipientHash) => {
                                return { sender, recipientHash };
                            }
                        }
                    };
                } else {
                    console.log("Using real contract at address:", CONFIG.CONTRACT.ADDRESS);
                    // real contract instance
                    this.contract = new ethers.Contract(
                        CONFIG.CONTRACT.ADDRESS,
                        CONFIG.CONTRACT.ABI,
                        signer
                    );
                }
                
                // setup ipfs
                if (CONFIG.APP.USE_REAL_IPFS) {
                    try {
                        // init real ipfs
                        // needs correct ipfs library
                        console.log("Using real IPFS client");
                        
                        // web3.storage example
                        // const token = 'your-web3-storage-token';
                        // this.ipfs = new Web3Storage({ token });
                        
                        // mock implementation
                        this.ipfs = {
                            add: async (content) => {
                                console.log("Real IPFS upload would happen here:", content);
                                // simulate delay
                                await new Promise(resolve => setTimeout(resolve, 500));
                                // mock cid
                                const mockCid = "Qm" + CryptoUtils.uint8ArrayToHex(nacl.randomBytes(32)).substring(0, 44);
                                return { path: mockCid };
                            },
                            cat: async (cid) => {
                                console.log("Real IPFS fetch would happen here:", cid);
                                // simulate delay
                                await new Promise(resolve => setTimeout(resolve, 500));
                                // mock content
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
                        
                        // fallback
                        this.initializeMockIPFS();
                    }
                } else {
                    // use mock ipfs
                    this.initializeMockIPFS();
                }
                
                // generate keypair
                // could be stored persistently
                try {
                    console.log("Generating key pair...");
                    // test crypto functions
                    if (typeof nacl === 'undefined') {
                        throw new Error("TweetNaCl library is not loaded properly");
                    }
                    
                    if (typeof nacl.box === 'undefined') {
                        throw new Error("TweetNaCl box functionality is not available");
                    }
                    
                    if (typeof nacl.box.keyPair !== 'function') {
                        throw new Error("TweetNaCl keyPair function is not available");
                    }
                    
                    // test hex functions
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
                
                // start message listener
                this.startListeningForMessages();
            } catch (error) {
                console.error("Setup error:", error);
                this.showError("Setup Failed", "Failed to set up contract connection: " + error.message);
                throw error;
            }
        },
        
        /**
         * init mock ipfs
         */
        initializeMockIPFS() {
            console.log("Using mock IPFS client");
            this.ipfs = {
                add: async (content) => {
                    // simulate delay
                    await new Promise(resolve => setTimeout(resolve, 500));
                    // mock cid
                    const mockCid = "Qm" + CryptoUtils.uint8ArrayToHex(nacl.randomBytes(32)).substring(0, 44);
                    return { path: mockCid };
                },
                cat: async (cid) => {
                    // simulate delay
                    await new Promise(resolve => setTimeout(resolve, 500));
                    // mock content
                    return JSON.stringify({
                        encrypted: "mockEncryptedData",
                        nonce: "mockNonce",
                        sender: "mockSenderPublicKey"
                    });
                }
            };
        },
        
        /**
         * update ui after login
         */
        updateUIAfterLogin() {
            // update status
            this.connectionStatus.textContent = "Connected";
            this.connectionStatus.classList.remove('bg-danger');
            this.connectionStatus.classList.add('bg-success');
            
            // update address
            this.userAddress.textContent = this.account;
            
            // show cards
            this.sendMessageCard.style.display = 'block';
            this.inboxCard.style.display = 'block';
            
            // update button
            this.connectWalletBtn.textContent = "Connected";
            this.connectWalletBtn.disabled = true;
        },
        
        /**
         * handle disconnect
         */
        handleDisconnect() {
            // reset state
            this.account = null;
            this.contract = null;
            
            // update ui
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
         * handle sending message
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
                // show loading
                this.setSendingState(true);
                
                // get recipient
                const selectedOption = this.recipientSelect.options[this.recipientSelect.selectedIndex];
                const recipientAddress = selectedOption.dataset.address;
                
                // hash for privacy
                const recipientHash = CryptoUtils.hashToBytes32(recipientAddress);
                
                // encrypt message
                const encryptedData = CryptoUtils.encryptMessage(
                    message,
                    recipient, // recipient public key
                    this.keyPair.secretKey // sender secret key
                );
                
                // prepare package
                const messagePackage = {
                    encrypted: encryptedData.encrypted,
                    nonce: encryptedData.nonce,
                    sender: this.keyPair.publicKey,
                    timestamp: Date.now()
                };
                
                // upload to ipfs
                console.log("Uploading to IPFS...");
                try {
                    const result = await this.ipfs.add(JSON.stringify(messagePackage));
                    const cid = result.path;
                    console.log("IPFS CID:", cid);
                    
                    // convert to bytes32
                    const messageHash = CryptoUtils.hashToBytes32(cid);
                    
                    // record in contract
                    console.log("Sending transaction to blockchain...");
                    console.log("Contract address:", CONFIG.CONTRACT.ADDRESS);
                    console.log("Recipient hash:", recipientHash);
                    console.log("Message hash:", messageHash);
                    
                    try {
                        const tx = await this.contract.sendMessage(recipientHash, messageHash);
                        console.log("Transaction submitted:", tx);
                        
                        // wait for confirmation
                        const receipt = await tx.wait();
                        console.log("Transaction confirmed:", receipt);
                        
                        // clear form and show success
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
                // reset loading
                this.setSendingState(false);
            }
        },
        
        /**
         * set sending state
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
         * listen for messages
         */
        async startListeningForMessages() {
            if (!this.contract) return;
            
            // calculate recipient hash
            const myRecipientHash = CryptoUtils.hashToBytes32(this.account);
            console.log("My recipient hash:", myRecipientHash);
            
            // hide loading
            this.loadingMessages.style.display = 'none';
            this.noMessages.style.display = 'block';
            
            try {
                // fetch past events in real app
                if (!this.demoMode) {
                    console.log("Fetching past messages...");
                    try {
                        // query past events
                        const filter = this.contract.filters.MessageSent(null, myRecipientHash);
                        const events = await this.contract.queryFilter(filter, -10000); // 10000 blocks
                        
                        console.log(`Found ${events.length} past messages`);
                        
                        if (events.length > 0) {
                            this.noMessages.style.display = 'none';
                            
                            // process events
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
                
                // listen for new events
                console.log("Listening for incoming messages...");
                
                this.contract.on("MessageSent", async (sender, recipientHash, messageHash, timestamp, event) => {
                    console.log("Message event detected:", sender, recipientHash, messageHash);
                    
                    // check for current user
                    if (recipientHash === myRecipientHash) {
                        console.log("New message for current user detected!");
                        
                        try {
                            if (this.demoMode) {
                                // display mock
                                await this.displayMockMessage(sender, timestamp);
                            } else {
                                // process real message
                                await this.processMessage(sender, messageHash, timestamp);
                            }
                        } catch (error) {
                            console.error("Error processing message:", error);
                        }
                    }
                });
                
                // add mock messages in demo
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
         * process message from blockchain
         */
        async processMessage(sender, messageHash, timestamp) {
            try {
                // in real implementation:
                // 1. fetch from ipfs
                // 2. decrypt with private key
                
                // hide "no messages"
                this.noMessages.style.display = 'none';
                
                // find sender name
                let senderName = "Unknown User";
                const senderObj = CONFIG.USERS.find(user => user.address.toLowerCase() === sender.toLowerCase());
                if (senderObj) {
                    senderName = senderObj.name;
                }
                
                // convert timestamp
                const timeValue = typeof timestamp === 'object' && timestamp.toNumber ? 
                    timestamp.toNumber() * 1000 : // to milliseconds
                    Number(timestamp) * 1000;
                    
                // format timestamp
                const date = new Date(timeValue);
                const formattedDate = date.toLocaleString();
                
                // create message card
                const card = document.createElement('div');
                card.className = 'card message-card';
                
                // set content
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
                
                // add to messages list
                this.messagesList.prepend(card);
            } catch (error) {
                console.error("Error processing message:", error);
            }
        },
        
        /**
         * display mock message
         */
        async displayMockMessage(sender, timestamp) {
            // hide no messages
            this.noMessages.style.display = 'none';
            
            // find sender name
            let senderName = "Unknown User";
            const senderObj = CONFIG.USERS.find(user => user.address.toLowerCase() === sender.toLowerCase());
            if (senderObj) {
                senderName = senderObj.name;
            }
            
            // create message card
            const card = document.createElement('div');
            card.className = 'card message-card';
            
            // format timestamp
            const date = new Date(timestamp);
            const formattedDate = date.toLocaleString();
            
            // set content
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
            
            // add to messages list
            this.messagesList.prepend(card);
        },
        
        /**
         * show success toast
         */
        showSuccess(title, message) {
            this.toastTitle.textContent = title;
            this.toastMessage.textContent = message;
            this.statusToast.classList.remove('bg-danger');
            this.statusToast.classList.add('bg-success');
            this.toast.show();
        },
        
        /**
         * show error toast
         */
        showError(title, message) {
            this.toastTitle.textContent = title;
            this.toastMessage.textContent = message;
            this.statusToast.classList.remove('bg-success');
            this.statusToast.classList.add('bg-danger');
            this.toast.show();
        }
    };
    
    // initialize app
    App.init();
}); 