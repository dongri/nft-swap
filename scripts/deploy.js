const { ethers, upgrades } = require("hardhat");

async function main() {

  // // First time
  // const NFTSwap = await ethers.getContractFactory("NFTSwap");
  // const token = await upgrades.deployProxy(NFTSwap);
  // await token.deployed();
  // console.log(`NFTSwap deployed to ${token.address}`);

  // Second time
  const NFTSwap = await ethers.getContractFactory("NFTSwap");
  const token = await upgrades.upgradeProxy('0x063Fdaf96C2Ff9F6a84a6b3D67473D4D61997b81', NFTSwap);
  await token.deployed();
  console.log(`NFTSwap deployed to ${token.address}`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

