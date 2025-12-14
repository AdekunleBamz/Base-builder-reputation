let provider;
let signer;
let contract;
const contractAddress = '0xYourDeployedContractAddress'; // Replace with actual address after deployment
const contractABI = [
    "function mintPassport(uint256 _score, string memory _talentProfileId) payable",
    "function updatePassport(uint256 _newScore) payable",
    "function isExpired(address _builder) view returns (bool)",
    "function getScore(address _builder) view returns (uint256)",
    "function hasPassport(address _builder) view returns (bool)"
];

document.getElementById('connectWallet').addEventListener('click', connectWallet);
document.getElementById('fetchData').addEventListener('click', fetchAndCalculate);
document.getElementById('mintPassport').addEventListener('click', mintPassport);
document.getElementById('updatePassport').addEventListener('click', updatePassport);

async function connectWallet() {
    if (window.ethereum) {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);

            // Switch to Base network
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x2105' }], // Base mainnet chain ID
            });

            document.getElementById('status').innerText = 'Wallet connected to Base!';
            document.getElementById('passportSection').style.display = 'block';
        } catch (error) {
            document.getElementById('status').innerText = 'Error connecting wallet: ' + error.message;
        }
    } else {
        alert('Please install MetaMask!');
    }
}

async function fetchAndCalculate() {
    const profileId = document.getElementById('talentProfileId').value;
    if (!profileId) {
        alert('Enter Talent Profile ID');
        return;
    }

    try {
        // Fetch from Talent Protocol API (placeholder URL - replace with actual)
        const response = await fetch(`https://api.talentprotocol.com/api/v1/builders/${profileId}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();

        // Assume API returns: { github_commits, base_contracts_deployed, mini_apps_created }
        const github = data.github_commits || 0;
        const contracts = data.base_contracts_deployed || 0;
        const miniApps = data.mini_apps_created || 0;

        // Calculate score
        const score = Math.floor((github * 0.4) + (contracts * 0.4) + (miniApps * 0.2));

        document.getElementById('scoreDisplay').innerText = `Calculated Score: ${score} (GitHub: ${github}, Contracts: ${contracts}, Mini Apps: ${miniApps})`;
        document.getElementById('status').innerText = 'Data fetched and score calculated!';
    } catch (error) {
        document.getElementById('status').innerText = 'Error fetching data: ' + error.message;
    }
}

async function mintPassport() {
    const profileId = document.getElementById('talentProfileId').value;
    const scoreText = document.getElementById('scoreDisplay').innerText;
    const score = parseInt(scoreText.match(/Calculated Score: (\d+)/)?.[1]);
    if (!score || !profileId) {
        alert('Fetch data first');
        return;
    }

    try {
        const tx = await contract.mintPassport(score, profileId, { value: ethers.utils.parseEther('0.0001') });
        await tx.wait();
        document.getElementById('status').innerText = 'Passport minted! TX: ' + tx.hash;
    } catch (error) {
        document.getElementById('status').innerText = 'Mint failed: ' + error.message;
    }
}

async function updatePassport() {
    const scoreText = document.getElementById('scoreDisplay').innerText;
    const newScore = parseInt(scoreText.match(/Calculated Score: (\d+)/)?.[1]);
    if (!newScore) {
        alert('Fetch data first');
        return;
    }

    try {
        const tx = await contract.updatePassport(newScore, { value: ethers.utils.parseEther('0.0001') });
        await tx.wait();
        document.getElementById('status').innerText = 'Passport updated! TX: ' + tx.hash;
    } catch (error) {
        document.getElementById('status').innerText = 'Update failed: ' + error.message;
    }
}
