let provider;
let signer;
let contract;
const contractAddress = '0x2c42276d5345CAb9fd3197808b1A2144354ca3D5'; // Deployed on Base mainnet
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

            document.getElementById('connectWallet').innerText = 'Wallet Connected';
            document.getElementById('connectWallet').disabled = true;
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
    const wallet = document.getElementById('talentWallet').value;
    if (!wallet) {
        alert('Enter Talent Wallet Address');
        return;
    }

    const fetchBtn = document.getElementById('fetchData');
    fetchBtn.disabled = true;
    fetchBtn.innerText = 'Fetching...';

    try {
        // Fetch from Talent Protocol API
        const response = await fetch(`https://api.talentprotocol.com/api/v1/users/${wallet}`, {
            headers: {
                'Authorization': `Bearer ${TALENT_API_KEY}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch data: ' + response.status + ' ' + response.statusText);
        const data = await response.json();

        console.log('API Response:', data); // Debug log

        // Assume API returns: { github_commits, base_contracts_deployed, mini_apps_created }
        const github = data.github_commits || data.github_contributions || 0;
        const contracts = data.base_contracts_deployed || data.contracts_deployed || 0;
        const miniApps = data.mini_apps_created || data.mini_apps || 0;

        // Calculate score
        const score = Math.floor((github * 0.4) + (contracts * 0.4) + (miniApps * 0.2));

        document.getElementById('scoreDisplay').innerText = `Calculated Score: ${score} (GitHub: ${github}, Contracts: ${contracts}, Mini Apps: ${miniApps})`;
        document.getElementById('status').innerText = 'Data fetched and score calculated!';
        document.getElementById('status').className = 'success';
    } catch (error) {
        console.error('Fetch error:', error); // Debug log
        document.getElementById('status').innerText = 'Error fetching data: ' + error.message;
        document.getElementById('status').className = 'error';
    } finally {
        fetchBtn.disabled = false;
        fetchBtn.innerText = 'Fetch Talent Data & Calculate Score';
    }
}

async function mintPassport() {
    const wallet = document.getElementById('talentWallet').value;
    const scoreText = document.getElementById('scoreDisplay').innerText;
    const score = parseInt(scoreText.match(/Calculated Score: (\d+)/)?.[1]);
    if (!score || !wallet) {
        alert('Fetch data first');
        return;
    }

    try {
        const tx = await contract.mintPassport(score, wallet, { value: ethers.utils.parseEther('0.0001') });
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
