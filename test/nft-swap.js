const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const Web3 = require("web3");
const web3 = new Web3(ethers.provider);

describe("NFT", function () {

  let swap;
  let owner;
  let addr1;
  let addr2;
  let addr3;

  beforeEach(async () => {
    // Create accounts (10000 ETH)
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

    const NFTSwap = await ethers.getContractFactory("NFTSwap");
    swap = await upgrades.deployProxy(NFTSwap);
  })

  it("Check onlyOwner", async function () {
    const contractWithAdd1 = await NFT.connect(addr1);

    await expect(contractWithAdd1.setBaseTokenURI('https://example.com/metadata/')).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(contractWithAdd1.setPrice(ethers.utils.parseEther("0.04"))).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(contractWithAdd1.setRoyaltyBPS(1000)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(contractWithAdd1.setRecipient(addr3.address)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(contractWithAdd1.setSigner(addr3.address)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(contractWithAdd1.setPublicMintable(true)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(contractWithAdd1.setAdmin(addr2.address)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(contractWithAdd1.burn(1)).to.be.revertedWith("Ownable: caller is not the owner");

    const contractWithOwner = await NFT.connect(owner);

    expect(await contractWithOwner.setBaseTokenURI('https://example.com/metadata/')).to.be.ok;
    expect(await contractWithOwner.setPrice(ethers.utils.parseEther("0.04"))).to.be.ok;
    expect(await contractWithOwner.setRoyaltyBPS(1000)).to.be.ok;
    expect(await contractWithOwner.setRecipient(addr3.address)).to.be.ok;
    expect(await contractWithOwner.setSigner(addr3.address)).to.be.ok;
    expect(await contractWithOwner.setPublicMintable(true)).to.be.ok;
    expect(await contractWithOwner.setAdmin(addr2.address)).to.be.ok;
    await expect(contractWithOwner.setAdmin(addr2.address)).to.be.revertedWith("Ownable: caller is not the owner");    
  })

  it("Check mintPrivate", async function () {
    const contractWithOwner = await NFT.connect(owner);
    await contractWithOwner.setSigner(addr3.address);
    await contractWithOwner.setPrice(ethers.utils.parseEther("0.04"))

    const contractWithAdd1 = await NFT.connect(addr1);

    const now = new Date().getTime();
    const message = `verify ${now}`;
    const messageHash = ethers.utils.solidityKeccak256(["string", "address"], [message, addr1.address]);
    const signature = await addr3.signMessage(ethers.utils.arrayify(messageHash));

    await expect(contractWithAdd1.mintPrivate(message, signature, 0, { value: ethers.utils.parseEther("0.24")})).to.be.revertedWith("count is invalid");
    await expect(contractWithAdd1.mintPrivate(message+'invalid', signature, 2, { value: ethers.utils.parseEther("0.04")})).to.be.revertedWith("invalid signature");

    const messageHash2 = ethers.utils.solidityKeccak256(["string", "address"], [message, addr2.address]);
    const signature2 = await addr3.signMessage(ethers.utils.arrayify(messageHash2));
    await expect(contractWithAdd1.mintPrivate(message, signature2, 2, { value: ethers.utils.parseEther("0.04")})).to.be.revertedWith("invalid signature");
    await expect(contractWithAdd1.mintPrivate(message, signature, 2, { value: ethers.utils.parseEther("0.03")})).to.be.revertedWith("price is insufficient");
    await expect(contractWithAdd1.mintPrivate(message, signature, 2, { value: ethers.utils.parseEther("0.04")})).to.be.revertedWith("price is insufficient");
    expect(await contractWithAdd1.mintPrivate(message, signature, 2, { value: ethers.utils.parseEther("0.08")})).to.be.ok;

    await expect(() => contractWithAdd1.mintPrivate(message, signature, 2, { value: ethers.utils.parseEther("0.08")})).to.changeEtherBalance(addr2, ethers.utils.parseEther("0"));

    await contractWithOwner.setRecipient(addr2.address);
    await expect(() => contractWithAdd1.mintPrivate(message, signature, 2, { value: ethers.utils.parseEther("0.08")})).to.changeEtherBalance(addr2, ethers.utils.parseEther("0.08"));
  })

  it("Check mintPublic - mint has not started", async function () {
    const contractWithAdd1 = await NFT.connect(addr1);
    await expect(contractWithAdd1.mintPublic(2)).to.be.revertedWith("mint has not started");
  });

  it("Check mintPublic - price", async function () {
    const contractWithOwner = await NFT.connect(owner);
    await contractWithOwner.setPublicMintable(true);
    await contractWithOwner.setPrice(ethers.utils.parseEther("0.04"))

    const contractWithAdd1 = await NFT.connect(addr1);
    await expect(contractWithAdd1.mintPublic(1)).to.be.revertedWith("price is insufficient");
    await expect(contractWithAdd1.mintPublic(1, { value: ethers.utils.parseEther("0.03")})).to.be.revertedWith("price is insufficient");
    expect(await contractWithAdd1.mintPublic(1, { value: ethers.utils.parseEther("0.04")})).to.be.ok;
  });

  it("Check mintPublic - multiple mint", async function () {
    const contractWithOwner = await NFT.connect(owner);
    await contractWithOwner.setPublicMintable(true);
    await contractWithOwner.setPrice(ethers.utils.parseEther("0.04"))

    const contractWithAdd1 = await NFT.connect(addr1);
    await expect(contractWithAdd1.mintPublic(0)).to.be.revertedWith("count is invalid");
    await expect(contractWithAdd1.mintPublic(1)).to.be.revertedWith("price is insufficient");
    await expect(contractWithAdd1.mintPublic(2, { value: ethers.utils.parseEther("0.04")})).to.be.revertedWith("price is insufficient");

    expect(await contractWithAdd1.mintPublic(1, { value: ethers.utils.parseEther("0.04")})).to.be.ok;
    expect(await contractWithAdd1.mintPublic(2, { value: ethers.utils.parseEther("0.08")})).to.be.ok;
  });

  it("Check mintPublic - recipient", async function () {
    const contractWithOwner = await NFT.connect(owner);
    await contractWithOwner.setPublicMintable(true);
    await contractWithOwner.setPrice(ethers.utils.parseEther("0.04"))
    await contractWithOwner.setRecipient(addr2.address);

    const contractWithAdd1 = await NFT.connect(addr1);
    await expect(() => contractWithAdd1.mintPublic(1, { value: ethers.utils.parseEther("0.04")})).to.changeEtherBalance(addr2, ethers.utils.parseEther("0.04"));

    await expect(contractWithAdd1.mintPublic(2, { value: ethers.utils.parseEther("0.04")})).to.be.revertedWith("price is insufficient");
    await expect(() => contractWithAdd1.mintPublic(2, { value: ethers.utils.parseEther("0.08")})).to.changeEtherBalance(addr2, ethers.utils.parseEther("0.08"));
  });

  it("Check currentTokenId", async function () {
    const contractWithOwner = await NFT.connect(owner);
    await contractWithOwner.setPublicMintable(true);
    await contractWithOwner.setPrice(ethers.utils.parseEther("0.04"));
    await contractWithOwner.setRecipient(addr2.address);

    const contractWithAdd1 = await NFT.connect(addr1);
    await contractWithAdd1.mintPublic(1, { value: ethers.utils.parseEther("0.04")});
    expect(await contractWithAdd1.currentTokenId()).to.equal(1);
    await contractWithAdd1.mintPublic(2, { value: ethers.utils.parseEther("0.08")});
    expect(await contractWithAdd1.currentTokenId()).to.equal(3);
  })

  it("Check royaltyInfo", async function () {
    const contractWithOwner = await NFT.connect(owner);
    await contractWithOwner.setPublicMintable(true);
    await contractWithOwner.setPrice(ethers.utils.parseEther("0.04"));
    await contractWithOwner.setRoyaltyBPS(1000);

    const contractWithAdd1 = await NFT.connect(addr1);
    await contractWithAdd1.mintPublic(1, { value: ethers.utils.parseEther("0.04")});
    let result = await contractWithAdd1.royaltyInfo(1, ethers.utils.parseEther("1"));

    expect(result[0]).to.equal('0x0000000000000000000000000000000000000000');
    expect(result[1].toString()).to.equal(ethers.utils.parseEther("0"));

    await contractWithOwner.setRecipient(addr2.address);
    result = await contractWithAdd1.royaltyInfo(1, ethers.utils.parseEther("1"));

    expect(result[0]).to.equal(addr2.address);
    expect(result[1].toString()).to.equal(ethers.utils.parseEther("0.1"));

  })

  it("Check tokenURI", async function () {
    const contractWithOwner = await NFT.connect(owner);
    await contractWithOwner.setPublicMintable(true);
    await contractWithOwner.setPrice(ethers.utils.parseEther("0.04"));
    await contractWithOwner.setRecipient(addr2.address);
    contractWithOwner.setBaseTokenURI('https://example.com/metadata/')

    const contractWithAdd1 = await NFT.connect(addr1);
    await contractWithAdd1.mintPublic(1, { value: ethers.utils.parseEther("0.04")});
    const result = await contractWithAdd1.tokenURI(1);
    expect(result).to.equal('https://example.com/metadata/1');
  })

  it("Check burn", async function () {
    const contractWithOwner = await NFT.connect(owner);
    await contractWithOwner.setPublicMintable(true);
    await contractWithOwner.setPrice(ethers.utils.parseEther("0.04"));
    await contractWithOwner.setRecipient(addr2.address);

    contractWithOwner.setBaseTokenURI('https://example.com/metadata/')

    const contractWithAdd1 = await NFT.connect(addr1);
    await contractWithAdd1.mintPublic(1, { value: ethers.utils.parseEther("0.04")});
    expect(await contractWithOwner.burn(1)).to.be.ok;
  })

  it("Check withdraw", async function () {
    const contractWithOwner = await NFT.connect(owner);
    await contractWithOwner.setPublicMintable(true);
    await contractWithOwner.setPrice(ethers.utils.parseEther("0.04"))

    const contractWithAdd1 = await NFT.connect(addr1);
    expect(await contractWithAdd1.mintPublic(1, { value: ethers.utils.parseEther("0.04")})).to.be.ok;
    expect(await contractWithAdd1.mintPublic(2, { value: ethers.utils.parseEther("0.08")})).to.be.ok;

    const contractWithAdd2 = await NFT.connect(addr2);
    await expect(contractWithAdd2.withdraw(ethers.utils.parseEther("0.04"))).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(contractWithOwner.withdraw(ethers.utils.parseEther("0.04"))).to.be.revertedWith("recipient is not set");

    await contractWithOwner.setRecipient(addr2.address);
    await expect(() => contractWithOwner.withdraw(ethers.utils.parseEther("0.04"))).to.changeEtherBalance(addr2, ethers.utils.parseEther("0.04"));
    await expect(() => contractWithOwner.withdraw(ethers.utils.parseEther("0.08"))).to.changeEtherBalance(addr2, ethers.utils.parseEther("0.08"));
    await expect(contractWithOwner.withdraw(ethers.utils.parseEther("0.04"))).to.be.revertedWith("balance is insufficient");
  })

  it("Check ERC4907", async function () {
    const contractWithOwner = await NFT.connect(owner);
    await contractWithOwner.setPublicMintable(true);
    await contractWithOwner.setPrice(ethers.utils.parseEther("0.04"));
    await contractWithOwner.setRecipient(addr2.address);
    contractWithOwner.setBaseTokenURI('https://example.com/metadata/')

    const contractWithAdd1 = await NFT.connect(addr1);
    await contractWithAdd1.mintPublic(1, { value: ethers.utils.parseEther("0.04")});

    expect(await contractWithAdd1.setUser(1, addr2.address, 3140484519)).to.be.ok;
    expect(await contractWithAdd1.userOf(1)).to.equal(addr2.address);
    expect(await contractWithAdd1.userExpires(1)).to.equal(3140484519);
    expect(await contractWithAdd1.ownerOf(1)).to.equal(addr1.address);

    const contractWithAdd2 = await NFT.connect(addr2);
    await expect(contractWithAdd2.setUser(1, addr3.address, 3140484519)).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");;

    expect(await contractWithAdd1.setUser(1, addr3.address, 100)).to.be.ok;
    expect(await contractWithAdd1.userOf(1)).to.equal('0x0000000000000000000000000000000000000000');

    expect(await contractWithAdd1.transferFrom(addr1.address, addr3.address, 1)).to.be.ok;
    expect(await contractWithAdd1.ownerOf(1)).to.equal(addr3.address);

    expect(await contractWithAdd1.supportsInterface('0xad092b5c')).to.equal(true);
  })

});
