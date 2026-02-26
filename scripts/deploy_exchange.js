const hre = require("hardhat");

async function main() {
  const ExchangeContract = await hre.ethers.getContractFactory("TokenExchange");
  const exchangeContract = await ExchangeContract.deploy("0x610178dA211FEF7D417bC0e6FeD39F05609AD788");
  await exchangeContract.deployed();
  console.log(`Finished writing exchange contract address: ${exchangeContract.address}`);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
