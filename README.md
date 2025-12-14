# Base Builder Reputation Passport

A Soulbound Token (SBT) on Base chain that verifies and scores builders using Talent Protocol data. This project generates onchain fees through minting/updates and contributes to Base Builder leaderboard rankings.

## Features
- **SBT (Non-Transferable NFT)**: Represents builder reputation onchain.
- **Talent Protocol Integration**: Fetches builder data (GitHub, contracts, mini apps) for scoring.
- **Scoring Formula**: Score = (GitHub commits × 0.4) + (Base contracts × 0.4) + (Mini apps × 0.2)
- **Monthly Expiry**: Forces recurring updates for ongoing fees.
- **Fees**: 0.0001 ETH per mint/update to boost onchain progress.

## Contract Deployment
1. Use Remix IDE: https://remix.ethereum.org/
2. Load `contracts/Passport.sol`
3. Compile with Solidity ^0.8.0
4. Deploy on Base mainnet (chain ID: 8453)
5. Note the contract address and update in `frontend/script.js`

## Frontend Setup
1. Open `frontend/index.html` in a browser (serve locally if needed).
2. Connect MetaMask to Base network.
3. Enter Talent Profile ID (from Talent Protocol).
4. Fetch data, calculate score, mint/update passport.

## Talent Protocol API
- Placeholder URL: `https://api.talentprotocol.com/api/v1/builders/{profileId}`
- Expected response: `{ github_commits, base_contracts_deployed, mini_apps_created }`
- Update script.js with actual API endpoint if different.

## GitHub Contributions
- Create a public repo and push this code.
- Document deployment, usage, and contribute to Base/Talent ecosystems.

## Mini App
For Coinbase Wallet mini app, adapt frontend to mini app format (future enhancement).

## License
MIT
