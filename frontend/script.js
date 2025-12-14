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
    let wallet = document.getElementById('talentWallet').value.trim();
    if (!wallet) {
        alert('Enter Talent Wallet Address');
        return;
    }

    // Checksum the address
    try {
        wallet = ethers.utils.getAddress(wallet);
        document.getElementById('talentWallet').value = wallet; // Update input with checksummed
    } catch (e) {
        alert('Invalid wallet address');
        return;
    }

    const fetchBtn = document.getElementById('fetchData');
    fetchBtn.disabled = true;
    fetchBtn.innerText = 'Fetching...';

    try {
        // Step 1: Search for profile by wallet address
        const searchParams = {
            query: { walletAddresses: [wallet] },
            sort: { score: { order: "desc" } },
            page: 1,
            per_page: 1
        };
        const queryString = Object.keys(searchParams)
            .map(key => `${key}=${encodeURIComponent(JSON.stringify(searchParams[key]))}`)
            .join('&');

        let response = await fetch(`https://api.talentprotocol.com/search/advanced/profiles?${queryString}`, {
            headers: {
                'X-API-KEY': TALENT_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to find profile: ' + response.status + ' ' + response.statusText);
        }

        const searchData = await response.json();
        console.log('Search Response:', searchData);

        if (!searchData.profiles || searchData.profiles.length === 0) {
            throw new Error('No profile found for this wallet address.');
        }

        const profile = searchData.profiles[0];
        const profileId = profile.uuid;

        // Step 2: Get data points for the profile
        response = await fetch(`https://api.talentprotocol.com/data_points?talent_id=${profileId}`, {
            headers: {
                'X-API-KEY': TALENT_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get data points: ' + response.status + ' ' + response.statusText);
        }

        const dataPoints = await response.json();
        console.log('Data Points Response:', dataPoints);

        // Extract relevant data points
        const dataMap = {};
        dataPoints.data_points.forEach(dp => {
            dataMap[dp.slug] = dp.value || 0;
        });

        const github = dataMap.github_commit_count || dataMap.github_contributions || 0;
        const contracts = dataMap.base_contract_deployed || dataMap.contracts_deployed || 0;
        const miniApps = dataMap.mini_app_created || dataMap.mini_apps_created || 0;

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
