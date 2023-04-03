const setupWeb3 = async () => {
  try {
    let currentProvider = null
    if (window.ethereum) {
      await window.ethereum.enable()
      currentProvider = window.ethereum
    } else if (window.web3) {
      currentProvider = window.web3.currentProvider
    } else {
      window.open('https://metamask.app.link/dapp/nft-swap.example.com', '_blank');
    }
    if (currentProvider) {
      const web3 = new Web3(currentProvider)
      const chainId = await web3.eth.getChainId()
      const accounts = (await web3.eth.getAccounts()) || web3.eth.accounts
      const account = accounts[0]
      if (chainId !== 5) {
        alert('Please switch to the Goerli testnet')
        return
      } else {
        return {web3, chainId, account}
      }
    }
  } catch (err) {
    console.log(err)
  }
}

const createRequest = async () => {
  const {web3, chainId, account} = await setupWeb3()
  const swapContract = new web3.eth.Contract(ContractABI, ContractAddressGoerli)
  const address1 = document.getElementById('address1').value
  const tokenId1 = document.getElementById('tokenid1').value
  const address2 = document.getElementById('address2').value
  const tokenId2 = document.getElementById('tokenid2').value

  const erc721Contract = new web3.eth.Contract(ERC721ABI, address1)
  let approveTxHash = ''
  erc721Contract.events.allEvents({}, (error, event) => {
    if (event.transactionHash == approveTxHash) {
      swapContract.methods.CreateRequest(address1, tokenId1, address2, tokenId2).send(
        {
          from: account
        }, (err, txHash) => {
          if (err) {
            alert(err.message)
          } else {
            alert('txHash:' + txHash)
          }
        }
      )
    }
  })

  // approve to swap contract
  erc721Contract.methods.getApproved(tokenId2).call((err, result) => {
    if (err) {
      alert(err.message)
    } else {
      if (result !== ContractAddressGoerli) {
        erc721Contract.methods.approve(ContractAddressGoerli, tokenId2).send(
          {
            from: account
          }, (err, txHash) => {
            if (err) {
              alert(err.message)
            } else {
              approveTxHash = txHash
            }
          }
        )
      } else {
        swapContract.methods.CreateRequest(address1, tokenId1, address2, tokenId2).send(
          {
            from: account
          }, (err, txHash) => {
            if (err) {
              alert(err.message)
            } else {
              alert('txHash:' + txHash)
            }
          }
        )
      }
    }
  })
}

const cancelRequest = async () => {
  const {web3, chainId, account} = await setupWeb3()
  const contract = new web3.eth.Contract(ContractABI, ContractAddressGoerli)
  const address1 = document.getElementById('address1').value
  const tokenId1 = document.getElementById('tokenid1').value
  const address2 = document.getElementById('address2').value
  const tokenId2 = document.getElementById('tokenid2').value
  contract.methods.CancelRequest(address1, tokenId1, address2, tokenId2).send(
    {
      from: account
    }, (err, txHash) => {
      if (err) {
        alert(err.message)
      } else {
        alert('txHash:' + txHash)
      }
    }
  )
}

const acceptRequest = async () => {
  const {web3, chainId, account} = await setupWeb3()
  const swapContract = new web3.eth.Contract(ContractABI, ContractAddressGoerli)
  const address1 = document.getElementById('address1').value
  const tokenId1 = document.getElementById('tokenid1').value
  const address2 = document.getElementById('address2').value
  const tokenId2 = document.getElementById('tokenid2').value

  const erc721Contract = new web3.eth.Contract(ERC721ABI, address1)
  let approveTxHash = ''
  erc721Contract.events.allEvents({}, (error, event) => {
    if (event.transactionHash == approveTxHash) {
      swapContract.methods.AcceptRequest(address1, tokenId1, address2, tokenId2).send(
        {
          from: account
        }, (err, txHash) => {
          if (err) {
            alert(err.message)
          } else {
            alert('txHash:' + txHash)
          }
        }
      )    
    }
  })

  // approve to swap contract
  erc721Contract.methods.getApproved(tokenId1).call((err, result) => {
    if (err) {
      alert(err.message)
    } else {
      if (result !== ContractAddressGoerli) {
        erc721Contract.methods.approve(ContractAddressGoerli, tokenId1).send(
          {
            from: account
          }, (err, txHash) => {
            if (err) {
              alert(err.message)
            } else {
              approveTxHash = txHash
            }
          }
        )
      } else {
        swapContract.methods.AcceptRequest(address1, tokenId1, address2, tokenId2).send(
          {
            from: account
          }, (err, txHash) => {
            if (err) {
              alert(err.message)
            } else {
              alert('txHash:' + txHash)
            }
          }
        )      
      }
    }
  })
}

const getSwapsByReleaseOwner = async () => {
  const {web3, chainId, account} = await setupWeb3()
  const contract = new web3.eth.Contract(ContractABI, ContractAddressGoerli)
  const result = await contract.methods.GetSwapsByReleaseOwner(account).call()
  document.getElementById('log-getSwapsByReleaseOwner').innerHTML = JSON.stringify(result)
}

const getSwapsByDesiredOwner = async () => {
  const {web3, chainId, account} = await setupWeb3()
  const contract = new web3.eth.Contract(ContractABI, ContractAddressGoerli)
  const result = await contract.methods.GetSwapsByDesiredOwner(account).call()
  document.getElementById('log-getSwapsByDesiredOwner').innerHTML = JSON.stringify(result)
}

const ERC721ABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}];
const ContractABI = [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"desiredERC721Address","type":"address"},{"indexed":false,"internalType":"uint256","name":"desiredTokenId","type":"uint256"},{"indexed":false,"internalType":"address","name":"releaseERC721Address","type":"address"},{"indexed":false,"internalType":"uint256","name":"releaseTokenId","type":"uint256"}],"name":"EventAcceptRequest","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"desiredERC721Address","type":"address"},{"indexed":false,"internalType":"uint256","name":"desiredTokenId","type":"uint256"},{"indexed":false,"internalType":"address","name":"releaseERC721Address","type":"address"},{"indexed":false,"internalType":"uint256","name":"releaseTokenId","type":"uint256"}],"name":"EventCancelRequest","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"desiredERC721Address","type":"address"},{"indexed":false,"internalType":"uint256","name":"desiredTokenId","type":"uint256"},{"indexed":false,"internalType":"address","name":"releaseERC721Address","type":"address"},{"indexed":false,"internalType":"uint256","name":"releaseTokenId","type":"uint256"}],"name":"EventCreateRequest","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"inputs":[{"internalType":"address","name":"_desiredERC721Address","type":"address"},{"internalType":"uint256","name":"_desiredTokenId","type":"uint256"},{"internalType":"address","name":"_releaseERC721Address","type":"address"},{"internalType":"uint256","name":"_releaseTokenId","type":"uint256"}],"name":"AcceptRequest","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_desiredERC721Address","type":"address"},{"internalType":"uint256","name":"_desiredTokenId","type":"uint256"},{"internalType":"address","name":"_releaseERC721Address","type":"address"},{"internalType":"uint256","name":"_releaseTokenId","type":"uint256"}],"name":"CancelRequest","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_desiredERC721Address","type":"address"},{"internalType":"uint256","name":"_desiredTokenId","type":"uint256"},{"internalType":"address","name":"_releaseERC721Address","type":"address"},{"internalType":"uint256","name":"_releaseTokenId","type":"uint256"}],"name":"CreateRequest","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"}],"name":"GetSwapsByDesiredOwner","outputs":[{"components":[{"internalType":"address","name":"desiredERC721Address","type":"address"},{"internalType":"uint256","name":"desiredTokenId","type":"uint256"},{"internalType":"address","name":"releaseERC721Address","type":"address"},{"internalType":"uint256","name":"releaseTokenId","type":"uint256"}],"internalType":"struct NFTSwap.SwapNFT[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"}],"name":"GetSwapsByReleaseOwner","outputs":[{"components":[{"internalType":"address","name":"desiredERC721Address","type":"address"},{"internalType":"uint256","name":"desiredTokenId","type":"uint256"},{"internalType":"address","name":"releaseERC721Address","type":"address"},{"internalType":"uint256","name":"releaseTokenId","type":"uint256"}],"internalType":"struct NFTSwap.SwapNFT[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MAX_INT_TYPE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"}];

const ContractAddressGoerli = '0x44bE7Fe9c0540Cb3E2f9e573F9c46AA6D0974842'
