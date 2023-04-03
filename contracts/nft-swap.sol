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

    mapping(address => SwapNFT[]) private swapsByReleaseOwner;
    mapping(address => SwapNFT[]) private swapsByDesiredOwner;

    event EventCreateRequest(address desiredERC721Address, uint256 desiredTokenId, address releaseERC721Address, uint256 releaseTokenId);
    event EventCancelRequest(address desiredERC721Address, uint256 desiredTokenId, address releaseERC721Address, uint256 releaseTokenId);
    event EventAcceptRequest(address desiredERC721Address, uint256 desiredTokenId, address releaseERC721Address, uint256 releaseTokenId);

    uint256 constant public MAX_INT_TYPE = type(uint256).max;

    function initialize() public initializer {}

    function CreateRequest(address _desiredERC721Address, uint256 _desiredTokenId, address _releaseERC721Address, uint256 _releaseTokenId) public {
        ERC721 releaseContract = ERC721(_releaseERC721Address);

        address releaseOwner = releaseContract.ownerOf(_releaseTokenId);
        require(releaseOwner == msg.sender, "NFT is not owned by sender");

        address operator = releaseContract.getApproved(_releaseTokenId);
        require(operator == address(this), "Token is not approved for swap");

        uint foundIndexRelease = _foundIndexRelease(msg.sender, _desiredERC721Address, _desiredTokenId, _releaseERC721Address, _releaseTokenId);
        require(foundIndexRelease == MAX_INT_TYPE, "Swap already exists");

        SwapNFT memory newSwapNFT = SwapNFT(_desiredERC721Address, _desiredTokenId, _releaseERC721Address, _releaseTokenId);
        swapsByReleaseOwner[msg.sender].push(newSwapNFT);

        address desiredOwner = ERC721(_desiredERC721Address).ownerOf(_desiredTokenId);
        swapsByDesiredOwner[desiredOwner].push(newSwapNFT);

        emit EventCreateRequest(_desiredERC721Address, _desiredTokenId, _releaseERC721Address, _releaseTokenId);
    }

    function CancelRequest(address _desiredERC721Address, uint256 _desiredTokenId, address _releaseERC721Address, uint256 _releaseTokenId) public {
        uint foundIndex = _foundIndexRelease(msg.sender, _desiredERC721Address, _desiredTokenId, _releaseERC721Address, _releaseTokenId);
        require(foundIndex != MAX_INT_TYPE, "Swap not found");

        _removeSwapNFTRelease(msg.sender, foundIndex);
        _removeSwapNFTDesired(ERC721(_desiredERC721Address).ownerOf(_desiredTokenId), foundIndex);

        emit EventCancelRequest(_desiredERC721Address, _desiredTokenId, _releaseERC721Address, _releaseTokenId);
    }

    function AcceptRequest(address _desiredERC721Address, uint256 _desiredTokenId, address _releaseERC721Address, uint256 _releaseTokenId) public {
        ERC721 releaseContract = ERC721(_releaseERC721Address);
        address releaseOwner = releaseContract.ownerOf(_releaseTokenId);
        uint foundIndexRelease = _foundIndexRelease(releaseOwner, _desiredERC721Address, _desiredTokenId, _releaseERC721Address, _releaseTokenId);
        require(foundIndexRelease != MAX_INT_TYPE, "Swap not found");
        SwapNFT memory swapNFT = swapsByReleaseOwner[releaseOwner][foundIndexRelease];
        ERC721 desiredContract = ERC721(_desiredERC721Address);
        address desiredOwner = desiredContract.ownerOf(_desiredTokenId);

        uint256 desiredTokenId = swapNFT.desiredTokenId;
        uint256 releaseTokenId = swapNFT.releaseTokenId;

        require(desiredContract.getApproved(desiredTokenId) == address(this), "Desired Token is not approved for swap");
        require(releaseContract.getApproved(releaseTokenId) == address(this), "Release Token is not approved for swap");

        desiredContract.safeTransferFrom(desiredOwner, releaseOwner, desiredTokenId);
        releaseContract.safeTransferFrom(releaseOwner, desiredOwner, releaseTokenId);

        _removeSwapNFTRelease(releaseOwner, foundIndexRelease);
        _removeSwapNFTDesired(desiredOwner, foundIndexRelease);

        emit EventAcceptRequest(_desiredERC721Address, _desiredTokenId, _releaseERC721Address, _releaseTokenId);
    }

    function GetSwapsByReleaseOwner(address _owner) public view returns (SwapNFT[] memory) {
        return swapsByReleaseOwner[_owner];
    }

    function GetSwapsByDesiredOwner(address _owner) public view returns (SwapNFT[] memory) {
        return swapsByDesiredOwner[_owner];
    }

    function _removeSwapNFTRelease(address _owner, uint256 _index) private {
        if (_index >= swapsByReleaseOwner[_owner].length) return;
        for (uint i = _index; i < swapsByReleaseOwner[_owner].length - 1; i++){
            swapsByReleaseOwner[_owner][i] = swapsByReleaseOwner[_owner][i+1];
        }
        swapsByReleaseOwner[_owner].pop();
    }

    function _removeSwapNFTDesired(address _owner, uint256 _index) private {
        if (_index >= swapsByDesiredOwner[_owner].length) return;
        for (uint i = _index; i < swapsByDesiredOwner[_owner].length - 1; i++){
            swapsByDesiredOwner[_owner][i] = swapsByDesiredOwner[_owner][i+1];
        }
        swapsByDesiredOwner[_owner].pop();
    }

    function _foundIndexRelease(address _owner, address _desiredERC721Address, uint256 _desiredTokenId, address _releaseERC721Address, uint256 _releaseTokenId) private view returns (uint256) {
        for (uint i = 0; i < swapsByReleaseOwner[_owner].length; i++) {
            SwapNFT memory swapNFT = swapsByReleaseOwner[_owner][i];
            if (swapNFT.desiredERC721Address == _desiredERC721Address && swapNFT.desiredTokenId == _desiredTokenId && swapNFT.releaseERC721Address == _releaseERC721Address && swapNFT.releaseTokenId == _releaseTokenId) {
                return i;
            }
        }
        return MAX_INT_TYPE;
    }
}
