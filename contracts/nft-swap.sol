// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTSwap is Initializable {

    struct SwapNFT {
        address desiredERC721Address;
        uint256 desiredTokenId;
        address releaseERC721Address;
        uint256 releaseTokenId;
    }

    mapping(address => SwapNFT[]) private swaps;

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

        SwapNFT memory swapNFT = SwapNFT(_desiredERC721Address, _desiredTokenId, _releaseERC721Address, _releaseTokenId);
        swaps[msg.sender].push(swapNFT);
        emit EventCreateRequest(_desiredERC721Address, _desiredTokenId, _releaseERC721Address, _releaseTokenId);
    }

    function CancelRequest(address _desiredERC721Address, uint256 _desiredTokenId, address _releaseERC721Address, uint256 _releaseTokenId) public {
        for (uint i = 0; i < swaps[msg.sender].length; i++) {
            SwapNFT memory swapNFT = swaps[msg.sender][i];
            if (swapNFT.desiredERC721Address == _desiredERC721Address && swapNFT.desiredTokenId == _desiredTokenId && swapNFT.releaseERC721Address == _releaseERC721Address && swapNFT.releaseTokenId == _releaseTokenId) {
                delete swaps[msg.sender][i];
                break;
            }
        }
        emit EventCancelRequest(_desiredERC721Address, _desiredTokenId, _releaseERC721Address, _releaseTokenId);
    }

    function AcceptRequest(address _desiredERC721Address, uint256 _desiredTokenId, address _releaseERC721Address, uint256 _releaseTokenId) public {
        ERC721 releaseContract = ERC721(_releaseERC721Address);
        address releaseOwner = releaseContract.ownerOf(_releaseTokenId);
        bool isSwapFound = false;
        for (uint i = 0; i < swaps[releaseOwner].length; i++) {
            SwapNFT memory swapNFT = swaps[releaseOwner][i];
            if (swapNFT.desiredERC721Address == _desiredERC721Address && swapNFT.desiredTokenId == _desiredTokenId && swapNFT.releaseERC721Address == _releaseERC721Address && swapNFT.releaseTokenId == _releaseTokenId) {
                address releaseERC721Address = swapNFT.releaseERC721Address;

                ERC721 desiredContract = ERC721(_desiredERC721Address);
                address desiredOwner = desiredContract.ownerOf(_desiredTokenId);

                uint256 desiredTokenId = swapNFT.desiredTokenId;
                uint256 releaseTokenId = swapNFT.releaseTokenId;

                require(desiredContract.getApproved(desiredTokenId) == address(this), "Token is not approved for swap");
                require(releaseContract.getApproved(releaseTokenId) == address(this), "Token is not approved for swap");

                desiredContract.safeTransferFrom(desiredOwner, releaseOwner, desiredTokenId);
                releaseContract.safeTransferFrom(releaseOwner, desiredOwner, releaseTokenId);

                delete swaps[msg.sender][i];

                isSwapFound = true;

                emit EventAcceptRequest(_desiredERC721Address, desiredTokenId, releaseERC721Address, releaseTokenId);
                break;
            }
        }
        require(isSwapFound, "Swap not found");
    }

    function GetSwaps(address _owner) public view returns (SwapNFT[] memory) {
        return swaps[_owner];
    }

}
