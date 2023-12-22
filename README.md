# MULTI PHASE MINT

## DESCRIPTION
This Solidity contract leverages ERC721A advantages and offers multi phase minting:

- Team mint: team has a reserved supply. Callable only by deployer, batch mint equally team supply.
- Whitelist mint: first allocated supply for addresses configured on deployment.
- FCFS mint: second allocated supply for addresses configured on deployment.
- Public mint: rest of supply is mintable without any restriction.

## IMPORTANT
- Reveal NFT & Royalties features are supported in this contract.
- Minting using a third-party smart contract is prevented in whitelist, fcfs and public mints.
- Mint phases can be paused via `pausedMint` flag.
- `MAX_SUPPLY`, `TEAM_SUPPLY` and `WHITELIST_FCFS_SUPPLY` should be configured with desired values.
- `run_multiphasemint.js` leverages hardhat tools to run real-world scenarios on contract.