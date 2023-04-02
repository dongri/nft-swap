const { ethers, upgrades } = require("hardhat");

async function main() {

  // // First time
  // const NFTSwap = await ethers.getContractFactory("NFTSwap");
  // const token = await upgrades.deployProxy(NFTSwap);
  // await token.deployed();
  // console.log(`NFTSwap deployed to ${token.address}`);

  // Second time
  const NFTSwap = await ethers.getContractFactory("NFTSwap");
  const token = await upgrades.upgradeProxy('0x752f365FA73D28AC27dE2904280BC2F37992B195', NFTSwap);
  await token.deployed();
  console.log(`NFTSwap deployed to ${token.address}`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

