// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTSwap is Initializable {

    struct ReleaseNFT {
        address erc721Address;
        uint256 tokenId;
    }

    mapping(string => ReleaseNFT) private swapRequests;

    event EventCreateRequest(address desiredERC721Address, uint256 desiredTokenId, address releaseERC721Address, uint256 releaseTokenId);
    event EventCancelRequest(address desiredERC721Address, uint256 desiredTokenId, address releaseERC721Address, uint256 releaseTokenId);
    event EventAcceptRequest(address desiredERC721Address, uint256 desiredTokenId, address releaseERC721Address, uint256 releaseTokenId);

    function initialize() public initializer {}

    function CreateRequest(address _desiredERC721Address, uint256 _desiredTokenId, address _releaseERC721Address, uint256 _releaseTokenId) public {
        ERC721 releaseContract = ERC721(_releaseERC721Address);
        address releaseOwner = releaseContract.ownerOf(_releaseTokenId);
        require(releaseOwner == msg.sender, "NFT is not owned by sender");
        address operator = releaseContract.getApproved(_releaseTokenId);
        require(operator == address(this), "Token is not approved for swap");
        string memory desiredKey = string(abi.encodePacked(_desiredERC721Address, _desiredTokenId));
        ReleaseNFT memory releaseNFT = ReleaseNFT(_releaseERC721Address, _releaseTokenId);
        swapRequests[desiredKey] = releaseNFT;
        emit EventCreateRequest(_desiredERC721Address, _desiredTokenId, _releaseERC721Address, _releaseTokenId);
    }

    function CancelRequest(address _desiredERC721Address, uint256 _desiredTokenId, address _releaseERC721Address, uint256 _releaseTokenId) public {
        string memory desiredKey = string(abi.encodePacked(_desiredERC721Address, _desiredTokenId));
        ReleaseNFT memory releaseNFT = swapRequests[desiredKey];
        require(releaseNFT.erc721Address == _releaseERC721Address && releaseNFT.tokenId == _releaseTokenId, "NFT A does not have a swap request"); 
        delete swapRequests[desiredKey];
        emit EventCancelRequest(_desiredERC721Address, _desiredTokenId, _releaseERC721Address, _releaseTokenId);
    }

    function AcceptRequest(address _desiredERC721Address, uint256 _desiredTokenId) public {
        string memory desiredKey = string(abi.encodePacked(_desiredERC721Address, _desiredTokenId));
        require(swapRequests[desiredKey].erc721Address != address(0), "NFT A does not have a swap request");

        ERC721 desiredContract = ERC721(_desiredERC721Address);
        ReleaseNFT memory releaseNFT = swapRequests[desiredKey];
        address releaseERC721Address = releaseNFT.erc721Address;
        ERC721 releaseContract = ERC721(releaseERC721Address);
        uint256 releaseTokenId = releaseNFT.tokenId;

        address desiredOwner = desiredContract.ownerOf(_desiredTokenId);
        address releaseOwner = releaseContract.ownerOf(releaseTokenId);

        require(desiredOwner == msg.sender, "NFT is not owned by sender");
        
        address operator = desiredContract.getApproved(_desiredTokenId);
        require(operator == address(this), "Token is not approved for swap");

        desiredContract.safeTransferFrom(desiredOwner, releaseOwner, _desiredTokenId);
        releaseContract.safeTransferFrom(releaseOwner, desiredOwner, releaseTokenId);
        delete swapRequests[desiredKey];
        emit EventAcceptRequest(_desiredERC721Address, _desiredTokenId, releaseERC721Address, releaseTokenId);
    }

}
