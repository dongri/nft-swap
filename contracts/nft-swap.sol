// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import './strings.sol';

contract NFTSwap is Initializable {

    using strings for *;

    string private separator;

    mapping(string => string) private orders;

    event SwapRequested(string _nftA, string _nftB);
    event SwapAccepted(string _nftA, string _nftB);

    // constructor() initializer {}

    function initialize() public initializer {
        separator = "/";
    }

    function RequestSwap(address _erc721AddressA, address _erc721AddressB, uint256 _tokenIdA, uint256 _tokenIdB) public {
        string memory _nftA = string(abi.encodePacked(_erc721AddressA, separator, _tokenIdA));
        string memory _nftB = string(abi.encodePacked(_erc721AddressB, separator, _tokenIdB));

        request(_nftA, _nftB);
    }

    function request(string memory _nftA, string memory _nftB) private {
        require(keccak256(abi.encodePacked(orders[_nftA])) == keccak256(abi.encodePacked("")), "NFT A already has a swap request");
        orders[_nftA] = _nftB;

        emit SwapRequested(_nftA, _nftB);
    }

    function AcceptSwap(address _erc721AddressA, address _erc721AddressB, uint256 _tokenIdA, uint256 _tokenIdB) public {
        string memory _nftA = string(abi.encodePacked(_erc721AddressA, separator, _tokenIdA));
        string memory _nftB = string(abi.encodePacked(_erc721AddressB, separator, _tokenIdB));

        // accept(_nftA, _nftB);

        require(keccak256(abi.encodePacked(orders[_nftA])) == keccak256(abi.encodePacked(_nftB)), "NFT A does not have a swap request for NFT B");
        orders[_nftA] = "";

        // string memory addressA = _nftA.toSlice().split(separator.toSlice()).toString();
        // string memory tokenA = _nftA.toSlice().split(separator.toSlice()).toString();
        // string memory addressB = _nftB.toSlice().split(separator.toSlice()).toString();
        // string memory tokenB = _nftB.toSlice().split(separator.toSlice()).toString();

        // address nftAddressA = stringToAddress(addressA);
        // address nftAddressB = stringToAddress(addressB);
        // uint256 nftTokenA = stringToUint(tokenA);
        // uint256 nftTokenB = stringToUint(tokenB);

        ERC721 nftContractA = ERC721(_erc721AddressA);
        ERC721 nftContractB = ERC721(_erc721AddressB);
        
        address nftAOwner = nftContractA.ownerOf(_tokenIdA);
        address nftBOwner = nftContractB.ownerOf(_tokenIdB);

        nftContractA.safeTransferFrom(nftAOwner, nftBOwner, _tokenIdA);
        nftContractB.safeTransferFrom(nftBOwner, nftAOwner, _tokenIdB);


        emit SwapAccepted(_nftA, _nftB);
    }

    function accept(string memory _nftA, string memory _nftB) public {
        require(keccak256(abi.encodePacked(orders[_nftA])) == keccak256(abi.encodePacked(_nftB)), "NFT A does not have a swap request for NFT B");
        orders[_nftA] = "";

        string memory addressA = _nftA.toSlice().split(separator.toSlice()).toString();
        string memory tokenA = _nftA.toSlice().split(separator.toSlice()).toString();
        string memory addressB = _nftB.toSlice().split(separator.toSlice()).toString();
        string memory tokenB = _nftB.toSlice().split(separator.toSlice()).toString();

        address nftAddressA = stringToAddress(addressA);
        address nftAddressB = stringToAddress(addressB);
        uint256 nftTokenA = stringToUint(tokenA);
        uint256 nftTokenB = stringToUint(tokenB);

        ERC721 nftContractA = ERC721(nftAddressA);
        ERC721 nftContractB = ERC721(nftAddressB);
        
        address nftAOwner = nftContractA.ownerOf(nftTokenA);
        address nftBOwner = nftContractB.ownerOf(nftTokenB);

        nftContractA.safeTransferFrom(nftAOwner, nftBOwner, nftTokenA);
        nftContractB.safeTransferFrom(nftBOwner, nftAOwner, nftTokenB);

    }

    function stringToAddress(string memory _address) public pure returns (address) {
        bytes memory tmp = abi.encodePacked(_address);
        return abi.decode(tmp, (address));
    }

    function stringToUint(string memory s) public pure returns (uint256) {
        return uint256(keccak256(bytes(s)));
    }

}
