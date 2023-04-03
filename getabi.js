const fs = require('fs');

const NFTSwap = JSON.parse(fs.readFileSync('./artifacts/contracts/nft-swap.sol/NFTSwap.json', 'utf8'));
console.log(JSON.stringify(NFTSwap.abi));
