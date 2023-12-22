const {ethers} = require("hardhat");
const fs = require('fs');





async function main() {

  const whiteList = fs.readFileSync('scripts/whitelist.txt').toString().split("\r\n");
  const fcfsList = fs.readFileSync('scripts/fcfs.txt').toString().split("\r\n");

  //console.log(whiteList);
  //console.log(fcfsList);

  const signers = await ethers.getSigners();

  const MultiPhaseMint = await ethers.getContractFactory("MultiPhaseMint");
  const multiPhaseMint = await MultiPhaseMint.deploy(whiteList, fcfsList);
  const receipt = multiPhaseMint.deployTransaction;

  const transactionReceipt = await ethers.provider.getTransactionReceipt(receipt.hash);
  const gasUsed = transactionReceipt.gasUsed;
  const gasPricePaid = transactionReceipt.effectiveGasPrice;
  const transactionFee = gasUsed.mul(gasPricePaid);
  
  console.log(`Estimation of deployment cost: ${ethers.utils.formatEther(transactionFee)}`);
  console.log(`MultiPhaseMint deployed at ${multiPhaseMint.address}`);

  console.log(`Initial total supply: ${await multiPhaseMint.totalSupply()}`);
  console.log(`Max supply: ${await multiPhaseMint.MAX_SUPPLY()}`);

  /*

  // TESTING SEND ETH AND WITHDRAW FROM CONTRACT

  console.log(`MultiPhaseMint balance before send: ${ethers.utils.formatEther(await multiPhaseMint.provider.getBalance(multiPhaseMint.address))}`);
  console.log(`Signer balance before send: ${ethers.utils.formatEther(await signers[0].getBalance())}`);

  await signers[0].sendTransaction({value: ethers.utils.parseEther("2"), to: multiPhaseMint.address});
  
  console.log(`MultiPhaseMint balance after send: ${ethers.utils.formatEther(await multiPhaseMint.provider.getBalance(multiPhaseMint.address))}`);
  console.log(`Signer balance after send: ${ethers.utils.formatEther(await signers[0].getBalance())}`);

  await multiPhaseMint.widthrawBalance(signers[0].address);

  console.log(`MultiPhaseMint balance after withdraw: ${ethers.utils.formatEther(await multiPhaseMint.provider.getBalance(multiPhaseMint.address))}`);
  console.log(`Signer balance after withdraw: ${ethers.utils.formatEther(await signers[0].getBalance())}`);
  */
  
  

  const UNREVEALED_BASE_URI = "";
  const REVEALED_BASE_URI = "";
  

  await multiPhaseMint.setUnrevealedURI(UNREVEALED_BASE_URI);
  await multiPhaseMint._setBaseURI(REVEALED_BASE_URI);
  await multiPhaseMint.setPausedMint(false);
  await multiPhaseMint.teamMint([signers[0].address, signers[1].address, signers[2].address, signers[3].address, signers[4].address]);
  
  console.log(`Example of Token URI for ID 0: ${await multiPhaseMint.tokenURI(0)}`);

  console.log(`Team Wallet 1 balance: ${await multiPhaseMint.balanceOf(signers[0].address)}`);
  console.log(`Team Wallet 2 balance: ${await multiPhaseMint.balanceOf(signers[1].address)}`);
  console.log(`Team Wallet 3 balance: ${await multiPhaseMint.balanceOf(signers[2].address)}`);
  console.log(`Team Wallet 4 balance: ${await multiPhaseMint.balanceOf(signers[3].address)}`);
  console.log(`Team Wallet 5 balance: ${await multiPhaseMint.balanceOf(signers[4].address)}`);

  console.log(`Current supply: ${await multiPhaseMint.totalSupply()}`);

  /*
  // Adding new whitelist address example
  const random = ethers.Wallet.createRandom().connect(multiPhaseMint.provider);
  console.log(`Created new random wallet: ${random.address}`);
  await signers[0].sendTransaction({to: random.address, value: ethers.utils.parseEther("0.02")});
  console.log(`Trying to mint without adding it..`);
  try
  {
    await random.sendTransaction({to: multiPhaseMint.address, data: ethers.utils.id("whitelistMint()").substring(0, 10)});
  }
  catch
  {
    console.log("Failed to mint..");
  }
  
  console.log("Adding it as new mint address..");
  await multiPhaseMint.addAddressToWhitelist([random.address]);

  console.log("Trying mint with it..");
  await random.sendTransaction({to: multiPhaseMint.address, data: ethers.utils.id("whitelistMint()").substring(0, 10)});
  
  console.log(`Current supply: ${await multiPhaseMint.totalSupply()}`);
  */
  
  console.log("Whitelist minting..");
  for(addr of whiteList)
  {
    const signer = await ethers.getImpersonatedSigner(addr);
    await signers[0].sendTransaction({to: signer.address, value: ethers.utils.parseEther("0.001")});
    await signer.sendTransaction({to: multiPhaseMint.address, data: ethers.utils.id("whitelistMint()").substring(0, 10)});
  }

  console.log(`Current supply: ${await multiPhaseMint.totalSupply()}`);

  await multiPhaseMint.endWhitelistMint();


  // Adding new fcfs address example
  const random = ethers.Wallet.createRandom().connect(multiPhaseMint.provider);
  console.log(`Created new random wallet: ${random.address}`);
  await signers[0].sendTransaction({to: random.address, value: ethers.utils.parseEther("0.02")});
  console.log(`Trying to mint without adding it..`);
  try
  {
    await random.sendTransaction({to: multiPhaseMint.address, data: ethers.utils.id("fcfsMint()").substring(0, 10)});
  }
  catch
  {
    console.log("Failed to mint..");
  }
  
  console.log("Adding it as new mint address..");
  await multiPhaseMint.addAddressToFcfsList([random.address]);

  console.log("Trying mint with it..");
  await random.sendTransaction({to: multiPhaseMint.address, data: ethers.utils.id("fcfsMint()").substring(0, 10)});
  
  console.log(`Current supply: ${await multiPhaseMint.totalSupply()}`);
  

  console.log("FCFS minting..");
  for(addr of fcfsList)
  {
    const signer = await ethers.getImpersonatedSigner(addr);
    await signers[0].sendTransaction({to: signer.address, value: ethers.utils.parseEther("0.001")});
    try
    {
      await signer.sendTransaction({to: multiPhaseMint.address, data: ethers.utils.id("fcfsMint()").substring(0, 10)});
    }
    catch(error)
    {
      //console.log(error);
      continue
    }
    
  }

  console.log(`Current supply: ${await multiPhaseMint.totalSupply()}`);

  await multiPhaseMint.endFcfsMint();



  console.log("Public sale minting..");
  for(let i=0; i<83; i++)
  {
    const signer = ethers.Wallet.createRandom().connect(multiPhaseMint.provider);
    await signers[0].sendTransaction({to: signer.address, value: ethers.utils.parseEther("0.001")});
    try
    {
      await signer.sendTransaction({to: multiPhaseMint.address, data: ethers.utils.id("publicMint()").substring(0, 10)});
    }
    catch(error)
    {
      console.log(error);
      continue
    }

  }

  console.log(`Current supply: ${await multiPhaseMint.totalSupply()}`);

}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
