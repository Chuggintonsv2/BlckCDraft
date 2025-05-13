# Encrypted Messaging dApp

A minimal decentralized application (dApp) that allows users to send encrypted messages using MetaMask and IPFS, with the message metadata stored on the blockchain.

## Features

- **MetaMask-only login**: Authentication is handled through MetaMask wallet connection
- **End-to-end encryption**: All messages are encrypted client-side using TweetNaCl's box encryption
- **IPFS storage**: Encrypted message content is stored on IPFS (simulated in this demo)
- **Blockchain logging**: Only message metadata is stored on-chain via events (sender, recipient hash, IPFS hash)
- **Single-page application**: Everything runs in the browser - no backend required

## Technology Stack

- **Frontend**: HTML/JavaScript with Bootstrap 5
- **Wallet Connection**: MetaMask (via ethers.js)
- **Encryption**: TweetNaCl (tweetnacl-js)
- **Storage**: IPFS (simulated in demo)
- **Smart Contract**: Solidity (to be deployed via Hardhat/Remix)

## Setup & Installation

### Local Development

1. Clone this repository
2. Install dependencies (optional - only needed for deployment):
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```
   This will start a server at http://localhost:3000
4. Make sure you have MetaMask extension installed in your browser
5. Connect your MetaMask wallet to the application

### Quick Deployment to GitHub Pages

The easiest way to make this dApp accessible online is to deploy it to GitHub Pages using our deployment script:

1. Clone this repository to your local machine
2. Install dependencies:
   ```
   npm install
   ```
3. Run the deployment script:
   ```
   npm run deploy
   ```
4. Enter your GitHub username and repository name when prompted
5. The script will automatically deploy your app to GitHub Pages
6. Your app will be available at `https://your-username.github.io/your-repo-name/`

### Manual GitHub Pages Setup

You can also deploy manually:

1. Fork this repository to your GitHub account
2. Go to your repository settings > Pages
3. Set up GitHub Pages to deploy from the main branch
4. The site will be available at `https://your-username.github.io/your-repo-name/`

Alternatively, you can use the included GitHub Actions workflow:

1. Push your code to GitHub
2. GitHub Actions will automatically deploy your dApp to GitHub Pages
3. You can also manually trigger a deployment from the Actions tab

### Custom Domain Setup (Optional)

1. In your repository settings > Pages, you can configure a custom domain
2. Add a CNAME record in your DNS settings pointing to `your-username.github.io`
3. Add a file named `CNAME` to your repository with your domain name

## Smart Contract Deployment

The app runs in demo mode by default (without a real smart contract). For a real application, deploy the MessageLogger.sol contract:

1. Use Remix IDE (https://remix.ethereum.org/) to deploy to Sepolia testnet:
   - Create a new file named `MessageLogger.sol` in Remix
   - Copy the contract code from `contract/MessageLogger.sol`
   - Compile the contract
   - Deploy to Sepolia testnet using MetaMask
   - Copy the deployed contract address

2. Alternatively, you can use Hardhat:
   ```
   npx hardhat run scripts/deploy.js --network sepolia
   ```

3. Update the contract address in js/config.js:
   ```javascript
   CONTRACT: {
     ADDRESS: "0xYourDeployedContractAddress", // Replace with your contract address
     // ...
   }
   ```

4. Redeploy to GitHub Pages:
   ```
   npm run deploy
   ```

## Getting Sepolia Testnet ETH

To interact with the contract on Sepolia testnet, you'll need some test ETH:

1. Visit a Sepolia faucet such as:
   - https://sepoliafaucet.com/
   - https://sepolia-faucet.pk910.de/

2. Connect your MetaMask wallet and request test ETH
3. Once you have received the test ETH, you can deploy your contract and interact with it

## Development Notes

- This demo uses simulated IPFS functionality. For a production application, replace the mock IPFS client in app.js with a real client
- The app uses hardcoded public keys for the demo. In a real app, you would fetch these from a registry
- Consider implementing additional security measures for a production application

## Security Notes

- This is a demonstration application and has not been audited for security
- In a production application, you would need to handle key management more securely
- Consider adding additional authentication mechanisms for increased security

## License

MIT 