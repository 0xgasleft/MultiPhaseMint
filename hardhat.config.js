require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: ""
      }
    },
    goerli: {
      url: "",
      accounts: [""]
    },
    sepolia: {
      url: "",
      accounts: [""]
    }
  }
};
