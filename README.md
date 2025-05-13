Encrypted Messaging dApp

A dApp that allows users to send encrypted messages using MetaMask and IPFS, with message metadata stored on blockchain.

Important Note: Zero-Gas Simulation Mode

This application runs in simulation mode by default, which means:
- Users can try functionality without spending ETH or gas fees
- MetaMask wallet is required for authentication and user identity
- Blockchain transactions are simulated locally without actual on-chain transactions
- The app provides same user experience as real version

This makes it useful for demonstrations, education, or trying blockchain concepts without cost.

Features

- MetaMask-only login: Authentication handled through MetaMask wallet connection
- End-to-end encryption: Messages encrypted client-side using TweetNaCl box encryption
- IPFS storage: Encrypted message content stored on IPFS (simulated in demo)
- Blockchain logging: Message metadata stored on-chain via events (sender, recipient hash, IPFS hash)
- Single-page application: Everything runs in browser - no backend required
- Zero-gas option: Can run in simulation mode without spending ETH

Technology Stack

- Frontend: HTML/JavaScript with Bootstrap 5
- Wallet Connection: MetaMask (via ethers.js)
- Encryption: TweetNaCl (tweetnacl-js)
- Storage: IPFS (simulated in demo)
- Smart Contract: Solidity (with option to use simulation mode or real contract)

How to Use the App

1. Install MetaMask browser extension if you don't have it
2. Access the application at https://chuggintonsv2.github.io/BlckCDraft/
3. Click "Connect MetaMask" to authenticate
4. Select recipient from dropdown menu
5. Type message and click "Send Encrypted Message"
6. Message will be encrypted, "uploaded" to simulated IPFS, and "logged" on simulated blockchain
7. See incoming messages in Messages section

The app works with any MetaMask account - no ETH needed in wallet since it operates in simulation mode.

Setup & Installation

Local Development

1. Clone this repository
2. Install dependencies (optional - only needed for deployment):
   ```
   npm install
   ```
3. Start development server:
   ```
   npm start
   ```
   This will start server at http://localhost:3000
4. Make sure MetaMask extension installed in browser
5. Connect MetaMask wallet to application

Quick Deployment to GitHub Pages

The easiest way to make this dApp accessible online is to deploy to GitHub Pages using deployment script:

1. Clone repository to local machine
2. Install dependencies:
   ```
   npm install
   ```
3. Run deployment script:
   ```
   npm run deploy
   ```
4. Enter GitHub username and repository name when prompted
5. Script will automatically deploy app to GitHub Pages
6. App will be available at `https://your-username.github.io/your-repo-name/`

Manual GitHub Pages Setup

You can also deploy manually:

1. Fork repository to GitHub account
2. Go to repository settings > Pages
3. Set up GitHub Pages to deploy from main branch
4. Site will be available at `https://your-username.github.io/your-repo-name/`

Alternatively, use included GitHub Actions workflow:

1. Push code to GitHub
2. GitHub Actions will automatically deploy dApp to GitHub Pages
3. You can manually trigger deployment from Actions tab

Switching Between Simulation and Real Mode

The app is configured to run in simulation mode by default. If you want to use real smart contract (requires ETH for gas fees), modify the config:

1. Open `js/config.js`
2. Change following values:
   ```javascript
   APP: {
     SIMULATION_MODE: false,      // Set to false to use real transactions
     USE_REAL_CONTRACT: true,     // Set to true to use real contract
     USE_REAL_IPFS: false         // Optionally set to true for real IPFS
   }
   ```
3. Ensure you've deployed contract (see "Smart Contract Deployment" below)
4. Update CONTRACT.ADDRESS value with deployed contract address

Smart Contract Deployment

The app runs in simulation mode by default (without real smart contract). For real application, deploy MessageLogger.sol contract:

1. Use Remix IDE (https://remix.ethereum.org/) to deploy to Sepolia testnet:
   - Create file named `MessageLogger.sol` in Remix
   - Copy contract code from `contract/MessageLogger.sol`
   - Compile contract
   - Deploy to Sepolia testnet using MetaMask
   - Copy deployed contract address

2. Alternatively, use Hardhat:
   ```
   npx hardhat run scripts/deploy.js --network sepolia
   ```

3. Update contract address in js/config.js:
   ```javascript
   CONTRACT: {
     ADDRESS: "0xYourDeployedContractAddress", // Replace with your contract address
     // ...
   }
   ```

4. Update simulation mode settings as described in previous section
5. Redeploy to GitHub Pages:
   ```
   npm run deploy
   ```

Getting Sepolia Testnet ETH

If you choose to run in real mode (not simulation), you'll need test ETH:

1. Visit Sepolia faucet such as:
   - https://sepoliafaucet.com/
   - https://sepolia-faucet.pk910.de/

2. Connect MetaMask wallet and request test ETH
3. Once received test ETH, you can deploy contract and interact with it

Development Notes

- Demo uses simulated IPFS functionality. For production application, replace mock IPFS client in app.js with real client
- App uses hardcoded public keys for demo. In real app, fetch these from registry
- Consider implementing additional security measures for production application

Security Notes

- This is demonstration application and has not been audited for security
- In production application, handle key management more securely
- Consider adding additional authentication mechanisms for increased security

License

MIT 