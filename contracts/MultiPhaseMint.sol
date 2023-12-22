// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @author TheHustler
/// @title MultiPhaseMint


import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "erc721a/contracts/ERC721A.sol";



contract MultiPhaseMint is ERC721A, ERC2981, Ownable {


    uint public constant MAX_SUPPLY = 200;
    uint private constant TEAM_SUPPLY = 10;
    uint private constant WHITELIST_FCFS_SUPPLY = 50;
    
    string private _localBaseURI;
    string private _unrevealedURI;
    
    bool private whitelistMinted;
    bool private fcfsMinted;
    bool private teamMinted;

    bool private revealed = false;
    bool private pausedMint = true;

    mapping(address => bool) private alreadyMinted;
    mapping(address => bool) private whiteList;
    mapping(address => bool) private fcfsList;

    uint private whitelistedCount;
    uint private whitelistMintCount;
    uint private fcfsMintCount;




    constructor(
        address[] memory _whiteList,
        address[] memory _fcfsList
        ) ERC721A("", "") Ownable(msg.sender) {

        _setBaseURI("ipfs://");

        whitelistedCount = _whiteList.length;
        for(uint i=0; i<whitelistedCount;)
        {
            whiteList[_whiteList[i]] = true;
            unchecked {
                ++i;
            }
        }
        
        for(uint i=0; i<_fcfsList.length;)
        {
            fcfsList[_fcfsList[i]] = true;
            unchecked {
                ++i;
            }
        }

    }

    modifier preventContract() {
        require(tx.origin == msg.sender, "Only EOA call allowed");
        _;
    }
    
    function setPausedMint(bool paused) external onlyOwner {
        pausedMint = paused;
    }

    function addAddressToWhitelist(address[] calldata _addrList) external onlyOwner {
        require(whitelistedCount + _addrList.length <= WHITELIST_FCFS_SUPPLY, "Already reached max whitelisted addresses!");
        
        whitelistedCount += _addrList.length;

        for(uint i=0; i < _addrList.length;)
        {
            require(!whiteList[_addrList[i]], "Already existing address!");
            whiteList[_addrList[i]] = true;
            unchecked {
                ++i; // Overflow here wouldn't profit attacker
            }
        }
    }

    function removeAddressFromWhitelist(address _addr) external onlyOwner {
        require(whiteList[_addr], "Address not on whitelist!");

        whiteList[_addr] = false;
        whitelistedCount -= 1;
    }

    function addAddressToFcfsList(address[] calldata _addrList) external onlyOwner {
        
        for(uint i=0; i < _addrList.length;)
        {
            require(!fcfsList[_addrList[i]], "Already existing address!");
            fcfsList[_addrList[i]] = true;
            unchecked {
                ++i; // Overflow here wouldn't profit attacker
            }
        }
    }

    function removeAddressFromFcfsList(address _addr) external onlyOwner {
        require(fcfsList[_addr], "Address not on FCFS list!");
        
        fcfsList[_addr] = false;
    }

    function _baseURI() internal view override returns (string memory) {
        return _localBaseURI;
    }

    function _setBaseURI(string memory baseURI) public onlyOwner {
        _localBaseURI = baseURI;
    }

    function setUnrevealedURI(string memory _uri) external onlyOwner {
        _unrevealedURI = _uri;
    }

    function revealCollection() external onlyOwner {
        revealed = true;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

        string memory baseURI = revealed ? _baseURI() : _unrevealedURI;
        string memory result = string(abi.encodePacked(baseURI, _toString(tokenId)));

        return bytes(baseURI).length != 0 ? result : '';
    }

    function setRoyalty(address _feeReceiver, uint96 _royaltyInBPS) external onlyOwner {
        _setDefaultRoyalty(_feeReceiver, _royaltyInBPS);
    }

    function teamMint(address[] calldata team) external onlyOwner {
        
        require(!pausedMint, "Mint is paused!");
        require(!teamMinted, "Team mint already performed!");
        require(totalSupply() + TEAM_SUPPLY <= MAX_SUPPLY, "Sum of team and current supply exceed MAX_SUPPLY");
        require(team.length <= TEAM_SUPPLY, "Addresses more than allowed team supply!");

        teamMinted = true;
        
        uint _mintPerTeamMember = TEAM_SUPPLY / team.length;
        for(uint i=0; i < team.length;)
        {
            _safeMint(team[i], _mintPerTeamMember);

            unchecked {
                ++i;
            }
        }
    }


    function whitelistMint() external preventContract {
        require(!pausedMint, "Mint is paused!");
        require(!whitelistMinted, "Whitelist phase over!");
        require(whiteList[msg.sender], "Address not whitelisted!");
        require(!alreadyMinted[msg.sender], "Address already minted!");
        require(whitelistMintCount < WHITELIST_FCFS_SUPPLY, "Whitelist mint cap reached!");
        
        alreadyMinted[msg.sender] = true;
        whitelistMintCount += 1;
        _safeMint(msg.sender, 1);
    }

    function endWhitelistMint() external onlyOwner {
        whitelistMinted = true;
    }

    function fcfsMint() external preventContract {
        require(!pausedMint, "Mint is paused!");
        require(whitelistMinted, "Whitelist phase not over yet!");
        require(!fcfsMinted, "FCFS phase over!");
        require(fcfsList[msg.sender], "Address not on FCFS list!");
        require(!alreadyMinted[msg.sender], "Address already minted!");
        require(fcfsMintCount < WHITELIST_FCFS_SUPPLY, "FCFS mint cap reached!");

        alreadyMinted[msg.sender] = true;
        fcfsMintCount += 1;
        _safeMint(msg.sender, 1);
    }

    function endFcfsMint() external onlyOwner {
        fcfsMinted = true;
    }

    function publicMint() external preventContract {
        require(!pausedMint, "Mint is paused!");
        require(whitelistMinted, "Whitelist phase not over yet!");
        require(fcfsMinted, "FCFS phase not over yet!");
        require(!alreadyMinted[msg.sender], "Address already minted!");
        require(totalSupply() < MAX_SUPPLY, "Max supply reached!");

        alreadyMinted[msg.sender] = true;
        _safeMint(msg.sender, 1);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721A, ERC2981) returns (bool) {
        return
            ERC721A.supportsInterface(interfaceId) ||
            ERC2981.supportsInterface(interfaceId);
    }

    function widthrawBalance(address _recipient) external payable onlyOwner {
        uint _amount = address(this).balance;
        require(_amount > 0, "No active balance to withdraw!");
        (bool success, ) = _recipient.call{value: _amount}("");
        require(success, "Failed to withdraw");
    }

    receive() external payable {}

}