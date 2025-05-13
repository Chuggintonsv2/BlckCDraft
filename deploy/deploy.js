// Example Hardhat deployment script for MessageLogger contract

async function main() {
  // Get the contract factory
  const MessageLogger = await ethers.getContractFactory("MessageLogger");
  
  // Deploy the contract
  console.log("Deploying MessageLogger contract...");
  const messageLogger = await MessageLogger.deploy();
  
  // Wait for deployment to be mined
  await messageLogger.deployed();
  
  // Log the contract address
  console.log("MessageLogger deployed to:", messageLogger.address);
  
  console.log("Deployment complete!");
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });

/*
 * To run this deployment script:
 * 1. Install Hardhat: npm install --save-dev hardhat
 * 2. Initialize Hardhat: npx hardhat init
 * 3. Place MessageLogger.sol in the contracts/ directory
 * 4. Place this file in the scripts/ directory
 * 5. Configure hardhat.config.js with your network settings
 * 6. Run: npx hardhat run scripts/deploy.js --network <network-name>
 */ 