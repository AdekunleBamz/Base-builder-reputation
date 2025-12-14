// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract BuilderPassport is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct PassportData {
        uint256 score;
        uint256 mintedAt;
        uint256 expiresAt;
        string talentProfileId;
    }

    mapping(uint256 => PassportData) public passportData;
    mapping(address => uint256) public addressToTokenId;
    mapping(address => bool) public hasPassport;

    uint256 public constant MINT_FEE = 0.0001 ether; // Adjustable fee for fees generation
    uint256 public constant EXPIRY_PERIOD = 30 days; // Monthly expiry

    event PassportMinted(address indexed builder, uint256 tokenId, uint256 score);
    event PassportUpdated(address indexed builder, uint256 tokenId, uint256 newScore);

    constructor() ERC721("Base Builder Passport", "BBP") {}

    // Mint a new passport (SBT - non-transferable)
    function mintPassport(uint256 _score, string memory _talentProfileId) external payable {
        require(msg.value >= MINT_FEE, "Insufficient mint fee");
        require(!hasPassport[msg.sender], "Passport already exists for this address");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _mint(msg.sender, tokenId);

        passportData[tokenId] = PassportData({
            score: _score,
            mintedAt: block.timestamp,
            expiresAt: block.timestamp + EXPIRY_PERIOD,
            talentProfileId: _talentProfileId
        });

        addressToTokenId[msg.sender] = tokenId;
        hasPassport[msg.sender] = true;

        emit PassportMinted(msg.sender, tokenId, _score);
    }

    // Update score (requires re-payment for fees)
    function updatePassport(uint256 _newScore) external payable {
        require(msg.value >= MINT_FEE, "Insufficient update fee");
        require(hasPassport[msg.sender], "No passport found");

        uint256 tokenId = addressToTokenId[msg.sender];
        require(block.timestamp > passportData[tokenId].expiresAt, "Passport not expired yet");

        passportData[tokenId].score = _newScore;
        passportData[tokenId].expiresAt = block.timestamp + EXPIRY_PERIOD;

        emit PassportUpdated(msg.sender, tokenId, _newScore);
    }

    // Check if passport is expired
    function isExpired(address _builder) external view returns (bool) {
        if (!hasPassport[_builder]) return true;
        uint256 tokenId = addressToTokenId[_builder];
        return block.timestamp > passportData[tokenId].expiresAt;
    }

    // Get passport score
    function getScore(address _builder) external view returns (uint256) {
        require(hasPassport[_builder], "No passport found");
        uint256 tokenId = addressToTokenId[_builder];
        return passportData[tokenId].score;
    }

    // Override transfer to make it SBT (non-transferable)
    function _transfer(address from, address to, uint256 tokenId) internal override {
        revert("Passports are soulbound and cannot be transferred");
    }

    // Withdraw fees to owner
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
