/**
 * This script helps deploy the app to GitHub Pages
 * Run with: node deploy-to-gh-pages.js
 */

const ghpages = require('gh-pages');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('📦 Encrypted Messaging dApp - GitHub Pages Deployment Script');
console.log('------------------------------------------------------------');

// Ask for GitHub username
rl.question('Enter your GitHub username: ', (username) => {
  // Ask for repository name
  rl.question('Enter your repository name: ', (repoName) => {
    // Update the GitHub repo link in the index.html
    console.log('\n👉 Updating repository link in index.html...');
    
    const indexPath = path.join(__dirname, 'index.html');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Replace GitHub repo link
    indexContent = indexContent.replace(
      /href="https:\/\/github\.com\/yourusername\/your-repo-name"/g,
      `href="https://github.com/${username}/${repoName}"`
    );
    
    fs.writeFileSync(indexPath, indexContent);
    
    console.log('✅ Repository link updated!');
    
    // Deploy to GitHub Pages
    console.log('\n🚀 Deploying to GitHub Pages...');
    console.log(`📋 Your app will be available at: https://${username}.github.io/${repoName}/`);
    
    ghpages.publish('.', {
      message: 'Auto-deploy from deployment script',
      branch: 'gh-pages'
    }, (err) => {
      if (err) {
        console.error('❌ Deployment failed:', err);
      } else {
        console.log('\n✅ Deployment completed successfully!');
        console.log(`📱 Your app is now live at: https://${username}.github.io/${repoName}/`);
        console.log('\n📝 Next steps:');
        console.log('1. Verify that your app is working at the URL above');
        console.log('2. To use with a real smart contract, deploy the contract using Remix or Hardhat');
        console.log('3. Update the CONTRACT.ADDRESS in js/config.js with your deployed contract address');
        console.log('4. Redeploy to GitHub Pages');
      }
      
      rl.close();
    });
  });
}); 