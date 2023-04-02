const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("NFT", function () {

  let nft1;
  let nft2;
  let swap;
  let owner;
  let addr1;
  let addr2;
  let addr3;

  beforeEach(async () => {
    // Create accounts (10000 ETH)
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

    const erc721_1 = await ethers.getContractFactory("MyERC721");
    nft1 = await erc721_1.deploy();
    
    const erc721_2 = await ethers.getContractFactory("MyERC721");
    nft2 = await erc721_2.deploy();
    
    const NFTSwap = await ethers.getContractFactory("NFTSwap");
    swap = await upgrades.deployProxy(NFTSwap);
  })

  it("should create a swap request", async function () {

    const nftSwapContractWithAdd1 = await swap.connect(addr1);

    const nft1ContractWithAdd1 = await nft1.connect(addr1);
    await nft1ContractWithAdd1.mint(addr1.address, 1);

    const nft1ContractWithAdd2 = await nft1.connect(addr2);
    await nft1ContractWithAdd2.mint(addr2.address, 2);

    const nft2ContractWithAdd2 = await nft2.connect(addr2);
    await nft2ContractWithAdd2.mint(addr2.address, 2);

    await expect(nftSwapContractWithAdd1.CreateRequest(nft2.address, 2, nft1.address, 2)).to.be.revertedWith("NFT is not owned by sender" );

    await expect(nftSwapContractWithAdd1.CreateRequest(nft2.address, 2, nft1.address, 1)).to.be.revertedWith("Token is not approved for swap");
    
    await nft1ContractWithAdd1.approve(swap.address, 1);

    expect(nftSwapContractWithAdd1.CreateRequest(nft2.address, 2, nft1.address, 1)).to.be.ok;

  });
  

  // it("should create a swap request-success", async function () {
    
  //   const nft1ContractWithAdd1 = nft1.connect(addr1);
  //   await nft1ContractWithAdd1.mint(addr1.address, 1);
  //   await nft1ContractWithAdd1.approve(swap.address, 1);

  //   const nft2ContractWithAdd2 = nft2.connect(addr2);
  //   await nft2ContractWithAdd2.mint(addr2.address, 2);
  //   await nft2ContractWithAdd2.approve(swap.address, 2);

  
  //   const nftSwapContractWithAdd1 = await swap.connect(addr1);
  //   await nftSwapContractWithAdd1.CreateRequest(nft2.address, 2, nft1.address, 1);

  //   const swaps = await swap.GetSwaps(addr1.address);
  //   expect(swaps.length).to.equal(1);
  // });
  

  // it("should cancel a swap request", async function () {
  //   const desiredERC721 = await ethers.getContractFactory("MyERC721");
  //   const desiredToken = await desiredERC721.deploy();
  //   await desiredToken.deployed();
  
  //   const releaseERC721 = await ethers.getContractFactory("MyERC721");
  //   const releaseToken = await releaseERC721.deploy();
  //   await releaseToken.deployed();
  
  //   await releaseToken.mint(owner.address, 1);
  //   await releaseToken.approve(swap.address, 1);
  
  //   await swap.CreateRequest(desiredToken.address, 1, releaseToken.address, 1);
  
  //   const swapsBefore = await swap.GetSwaps(owner.address);
  //   expect(swapsBefore.length).to.equal(1);
  
  //   await swap.CancelRequest(desiredToken.address, 1, releaseToken.address, 1);
  
  //   const swapsAfter = await swap.GetSwaps(owner.address);
  //   expect(swapsAfter.length).to.equal(0);
  // });

  // it("should swap two NFTs", async function () {
  //   const desiredERC721 = await ethers.getContractFactory("MyERC721");
  //   const desiredToken = await desiredERC721.deploy();
  //   await desiredToken.deployed();
  
  //   const releaseERC721 = await ethers.getContractFactory("MyERC721");
  //   const releaseToken = await releaseERC721.deploy();
  //   await releaseToken.deployed();
  
  //   await desiredToken.mint(addr1.address, 1);
  //   await desiredToken.approve(swap.address, 1);
  
  //   await releaseToken.mint(owner.address, 1);
  //   await releaseToken.approve(swap.address, 1);
  
  //   await swap.CreateRequest(desiredToken.address, 1, releaseToken.address, 1);
  
  //   await swap.AcceptRequest(desiredToken.address, 1, releaseToken.address, 1);
  
  //   const desiredOwner = await desiredToken.ownerOf(1);
  //   const releaseOwner = await releaseToken.ownerOf(1);
  
  //   expect(desiredOwner).to.equal(owner.address);
  //   expect(releaseOwner).to.equal(addr1.address);
  
  //   const swapsAfter = await swap.GetSwaps(owner.address);
  //   expect(swapsAfter.length).to.equal(0);
  // });
  

});
