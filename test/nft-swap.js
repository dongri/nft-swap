const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("NFTSwap", function () {

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

    await expect(nftSwapContractWithAdd1.CreateRequest(nft2.address, 2, nft1.address, 1)).to.be.revertedWith("Swap already exists");

  });

  it("should cancel a swap request", async function () {
    const nftSwapContractWithAdd1 = await swap.connect(addr1);

    const nft1ContractWithAdd1 = await nft1.connect(addr1);
    await nft1ContractWithAdd1.mint(addr1.address, 1);
    await nft1ContractWithAdd1.approve(swap.address, 1);

    const nft2ContractWithAdd2 = await nft2.connect(addr2);
    await nft2ContractWithAdd2.mint(addr2.address, 2);

    expect(await nftSwapContractWithAdd1.CreateRequest(nft2.address, 2, nft1.address, 1)).to.be.ok;
    const swapsBefore = await nftSwapContractWithAdd1.GetSwaps(addr1.address);
    expect(swapsBefore.length).to.equal(1);

    await expect(nftSwapContractWithAdd1.CancelRequest(nft2.address, 2, nft1.address, 2)).to.be.revertedWith("Swap not found");
    await expect(nftSwapContractWithAdd1.CancelRequest(nft2.address, 1, nft1.address, 1)).to.be.revertedWith("Swap not found");

    expect(await nftSwapContractWithAdd1.CancelRequest(nft2.address, 2, nft1.address, 1)).to.be.ok;
    const swapsAfter = await nftSwapContractWithAdd1.GetSwaps(addr1.address);
    expect(swapsAfter.length).to.equal(0);

    await nft1ContractWithAdd1.mint(addr1.address, 2);
    await nft1ContractWithAdd1.approve(swap.address, 2);
    await nft1ContractWithAdd1.mint(addr1.address, 3);
    await nft1ContractWithAdd1.approve(swap.address, 3);

    expect(await nftSwapContractWithAdd1.CreateRequest(nft2.address, 2, nft1.address, 1)).to.be.ok;
    expect(await nftSwapContractWithAdd1.CreateRequest(nft2.address, 2, nft1.address, 2)).to.be.ok;
    expect(await nftSwapContractWithAdd1.CreateRequest(nft2.address, 2, nft1.address, 3)).to.be.ok;
    let swaps = await nftSwapContractWithAdd1.GetSwaps(addr1.address);
    expect(swaps.length).to.equal(3);

    expect(await nftSwapContractWithAdd1.CancelRequest(nft2.address, 2, nft1.address, 1)).to.be.ok;
    swaps = await nftSwapContractWithAdd1.GetSwaps(addr1.address);
    expect(swaps.length).to.equal(2);
  
  });

  it("should accept a swap request", async function () {
    const nftSwapContractWithAdd1 = await swap.connect(addr1);

    const nft1ContractWithAdd1 = await nft1.connect(addr1);
    await nft1ContractWithAdd1.mint(addr1.address, 1);
    await nft1ContractWithAdd1.approve(swap.address, 1);

    const nft2ContractWithAdd2 = await nft2.connect(addr2);
    await nft2ContractWithAdd2.mint(addr2.address, 2);

    expect(await nftSwapContractWithAdd1.CreateRequest(nft2.address, 2, nft1.address, 1)).to.be.ok;
    const swapsBefore = await nftSwapContractWithAdd1.GetSwaps(addr1.address);
    expect(swapsBefore.length).to.equal(1);

    const nftSwapContractWithAdd2 = await swap.connect(addr2);
    await expect(nftSwapContractWithAdd2.AcceptRequest(nft2.address, 2, nft1.address, 1)).to.be.revertedWith("Desired Token is not approved for swap" );

    await nft2ContractWithAdd2.approve(swap.address, 2);

    await nft1ContractWithAdd1.approve(addr3.address, 1);

    await expect(nftSwapContractWithAdd2.AcceptRequest(nft2.address, 2, nft1.address, 1)).to.be.revertedWith("Release Token is not approved for swap" );

    await nft1ContractWithAdd1.approve(swap.address, 1);

    expect(await nftSwapContractWithAdd2.AcceptRequest(nft2.address, 2, nft1.address, 1)).to.be.ok;

    await expect(nftSwapContractWithAdd2.AcceptRequest(nft2.address, 1, nft1.address, 1)).to.be.revertedWith("Swap not found" );

  });
  

});
