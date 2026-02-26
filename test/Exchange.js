const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

describe("TokenExchange", function () {
  let Token, tokentoken, TokenExchange, exchange;
  let owner;
  const initialSupply = 1000;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy tokentokentokentoken and exchange
    Token = await ethers.getContractFactory("Token");
    tokentoken = await Token.deploy();
    await tokentoken.deployed();

    TokenExchange = await ethers.getContractFactory("TokenExchange");
    exchange = await TokenExchange.deploy(tokentoken.address);
    await exchange.deployed();

    // Mint tokentokens to owner
    await tokentoken.mint(
      ethers.utils.parseUnits(initialSupply.toString(), 18)
    );

    // const balance = await tokentokentokentoken.balanceOf(owner.address);
    // console.log("Owner Token Balance:", ethers.utils.formatUnits(balance, 18));

    // Approve transfers
    await tokentoken
      .connect(owner)
      .approve(
        exchange.address,
        ethers.utils.parseUnits(initialSupply.toString(), 18)
      );

    // const allowance = await tokentokentokentoken.allowance(
    //   owner.address,
    //   exchange.address
    // );
    // console.log(
    //   "Owner Allowance to Exchange:",
    //   ethers.utils.formatUnits(allowance, 18)
    // );
  });

  describe("createPool", function () {
    const tokenAmount = ethers.utils.parseUnits("100", 18);
    const ethAmount = ethers.utils.parseEther("100");

    it("should allow the owner to create a pool with valid tokentoken and ETH amounts", async function () {
      await exchange
        .connect(owner)
        .createPool(tokenAmount, { value: ethAmount });

      expect(await ethers.provider.getBalance(exchange.address)).to.equal(
        ethAmount
      );
      expect(await tokentoken.balanceOf(exchange.address)).to.equal(
        tokenAmount
      );

      //   const balance = await tokentokentokentoken.balanceOf(owner.address);
      //   console.log(
      //     "Owner Token Balance:",
      //     ethers.utils.formatUnits(balance, 18)
      //   );

      //   const allowance = await tokentokentokentoken.allowance(
      //     owner.address,
      //     exchange.address
      //   );
      //   console.log(
      //     "Owner Allowance to Exchange:",
      //     ethers.utils.formatUnits(allowance, 18)
      //   );
    });

    // it("should fail if token reserves already exist", async function () {
    //   await exchange
    //     .connect(owner)
    //     .createPool(tokentokenAmount, { value: ethAmount });

    //   // Second attempt should fail
    //   await expect(
    //     exchange.connect(owner).createPool(tokentokenAmount, { value: ethAmount })
    //   ).to.be.revertedWith("Token reserves was not 0.");
    // });

    // it("should fail if ETH reserves already exist", async function () {
    //   // Already covered by the same require in the first test; but for clarity:

    //   await exchange
    //     .connect(owner)
    //     .createPool(tokentokenAmount, { value: ethAmount });

    //   await expect(
    //     exchange.connect(owner).createPool(tokentokenAmount, { value: ethAmount })
    //   ).to.be.revertedWith("Token reserves was not 0.");
    // });

    it("should fail if no ETH is sent", async function () {
      await expect(
        exchange.connect(owner).createPool(tokenAmount, { value: 0 })
      ).to.be.revertedWith("Need eth to create pool.");
    });

    it("should fail if tokentoken amount is zero", async function () {
      await expect(
        exchange.connect(owner).createPool(0, { value: ethAmount })
      ).to.be.revertedWith("Need tokens to create pool.");
    });

    it("should fail if token amount exceeds balance", async function () {
      const excessiveAmount = ethers.utils.parseUnits("1000000", 18); // More than any account owns
      await expect(
        exchange
          .connect(owner)
          .createPool(excessiveAmount, { value: ethAmount })
      ).to.be.revertedWith("Not have enough tokens to create the pool.");
    });

    it("should fail if caller is not the owner", async function () {
      await expect(
        exchange.connect(user1).createPool(tokenAmount, { value: ethAmount })
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});

describe("TokenExchange - addLiquidity", function () {
  let Token, tokentoken, TokenExchange, exchange;
  let owner, user1;
  const rateDecimals = 1000;
  const initialSupply = ethers.utils.parseUnits("1000", 18);
  const tokenAmount_100 = ethers.utils.parseUnits("100", 18);
  const ethAmount_100 = ethers.utils.parseEther("100");

  beforeEach(async () => {
    [owner, user1] = await ethers.getSigners();

    // Deploy token
    Token = await ethers.getContractFactory("Token");
    tokentoken = await Token.deploy();
    await tokentoken.deployed();

    // Mint tokens to owner
    await tokentoken.mint(initialSupply);

    // Deploy exchange contract
    TokenExchange = await ethers.getContractFactory("TokenExchange");
    exchange = await TokenExchange.deploy(tokentoken.address);
    await exchange.deployed();

    await tokentoken.connect(owner).transfer(user1.address, tokenAmount_100);
    await tokentoken.connect(owner).approve(exchange.address, initialSupply);
    await tokentoken.connect(user1).approve(exchange.address, tokenAmount_100);

    await exchange
      .connect(owner)
      .createPool(tokenAmount_100.div(2), { value: ethAmount_100.div(2) });
  });

  it("should allow a user to add liquidity successfully", async () => {
    // Create initial pool

    const ethToAdd = ethers.utils.parseEther("1");

    // Capture tokentoken/ETH reserves before
    const tokentokenReserve = await tokentoken.balanceOf(exchange.address);
    const ethReserve = await ethers.provider.getBalance(exchange.address);

    // Calculate expected exchange rate
    const exchangeRate = tokentokenReserve.mul(rateDecimals).div(ethReserve);

    const maxRate = exchangeRate.add(100); // Slightly higher
    const minRate = exchangeRate.sub(100); // Slightly lower

    await expect(
      exchange
        .connect(user1)
        .addLiquidity(maxRate, minRate, { value: ethToAdd })
    ).to.emit(exchange, "LiquidityAdded");
  });

  //   it("should fail if ETH value is 0", async () => {
  //     const maxRate = 1_000_000;
  //     const minRate = 1;

  //     await expect(
  //       exchange.connect(user1).addLiquidity(maxRate, minRate, { value: 0 })
  //     ).to.be.revertedWith("Need eth to add liquidity.");
  //   });

  it("should fail if exchange rate is too high", async () => {
    const ethToAdd = ethers.utils.parseEther("1");

    // Get artificially low max exchange rate
    const maxRate = 1;
    const minRate = 0;

    await expect(
      exchange
        .connect(user1)
        .addLiquidity(maxRate, minRate, { value: ethToAdd })
    ).to.be.revertedWith("Exchange rate is larger than the max exchange rate.");
  });

  it("should fail if exchange rate is too low", async () => {
    const ethToAdd = ethers.utils.parseEther("1");

    // Get artificially high min exchange rate
    const maxRate = 1_000_000_000;
    const minRate = 1_000_000_000;

    await expect(
      exchange
        .connect(user1)
        .addLiquidity(maxRate, minRate, { value: ethToAdd })
    ).to.be.revertedWith(
      "Exchange rate is smaller than the min exchange rate."
    );
  });

  it("should fail if user has insufficient tokentokens", async () => {
    const ethToAdd = ethers.utils.parseEther("5000"); // huge ETH → huge tokentoken requirement

    const maxRate = 1_000_000_000;
    const minRate = 1;

    await expect(
      exchange
        .connect(user1)
        .addLiquidity(maxRate, minRate, { value: ethToAdd })
    ).to.be.revertedWith("Not have enough tokens to add to liquidity.");
  });
});

describe("TokenExchange - removeLiquidity", function () {
  let Token, token, TokenExchange, exchange;
  let owner, user1;
  const rateDecimals = 1000;
  const initialSupply = ethers.utils.parseUnits("1000", 18);
  const tokenAmount_100 = ethers.utils.parseUnits("100", 18);
  const ethAmount_100 = ethers.utils.parseEther("100");

  beforeEach(async () => {
    [owner, user1] = await ethers.getSigners();

    Token = await ethers.getContractFactory("Token");
    token = await Token.deploy();
    await token.deployed();

    await token.mint(initialSupply);
    await token.connect(owner).transfer(user1.address, tokenAmount_100);

    TokenExchange = await ethers.getContractFactory("TokenExchange");
    exchange = await TokenExchange.deploy(token.address);
    await exchange.deployed();

    await token.connect(owner).approve(exchange.address, initialSupply);
    await token.connect(user1).approve(exchange.address, tokenAmount_100);

    await token
      .connect(owner)
      .approve(exchange.address, tokenAmount_100.div(2));
    await exchange.connect(owner).createPool(tokenAmount_100.div(2), {
      value: ethAmount_100.div(2),
    });

    await exchange
      .connect(user1)
      .addLiquidity(rateDecimals + 10, rateDecimals - 10, {
        value: ethers.utils.parseEther("10"),
      });
  });

  it("should allow user to remove liquidity successfully", async () => {
    const tokenReserves = await token.balanceOf(exchange.address);
    const ethReserves = await ethers.provider.getBalance(exchange.address);
    const exchangeRate = tokenReserves.mul(rateDecimals).div(ethReserves);

    const maxRate = exchangeRate.add(100);
    const minRate = exchangeRate.sub(100);
    const amountETH = ethers.utils.parseEther("1");

    await expect(
      exchange.connect(user1).removeLiquidity(amountETH, maxRate, minRate)
    ).to.emit(exchange, "LiquidityRemoved");
  });

  it("should fail if exchange rate is too high", async () => {
    const amountETH = ethers.utils.parseEther("1");
    const maxRate = 1; // way too low
    const minRate = 0;

    await expect(
      exchange.connect(user1).removeLiquidity(amountETH, maxRate, minRate)
    ).to.be.revertedWith("Exchange rate is larger than the max exchange rate.");
  });

  it("should fail if exchange rate is too low", async () => {
    const amountETH = ethers.utils.parseEther("1");
    const maxRate = 1_000_000_000;
    const minRate = 1_000_000_000;

    await expect(
      exchange.connect(user1).removeLiquidity(amountETH, maxRate, minRate)
    ).to.be.revertedWith(
      "Exchange rate is smaller than the min exchange rate."
    );
  });

  it("should fail if LP has insufficient liquidity", async () => {
    const tooMuchETH = ethers.utils.parseEther("1000");

    const maxRate = 1_000_000;
    const minRate = 1;

    await expect(
      exchange.connect(user1).removeLiquidity(tooMuchETH, maxRate, minRate)
    ).to.be.revertedWith("Not enough liquidity in pool for this provider.");
  });

  //   it("should fail if not enough ETH in reserves", async () => {
  //     // Empty ETH balance manually
  //     await exchange.connect(owner).removeAllLiquidity(1_000_000, 1);

  //     const amountETH = ethers.utils.parseEther("1");
  //     const maxRate = 1_000_000;
  //     const minRate = 1;

  //     await expect(
  //       exchange.connect(user1).removeLiquidity(amountETH, maxRate, minRate)
  //     ).to.be.revertedWith("Not enough ethers to transfer.");
  //   });

  //   it("should fail if not enough tokens in reserves", async () => {
  //     // Remove tokens manually
  //     await exchange.connect(owner).emergencyWithdrawTokens();

  //     const amountETH = ethers.utils.parseEther("1");
  //     const maxRate = 1_000_000;
  //     const minRate = 1;

  //     await expect(
  //       exchange.connect(user1).removeLiquidity(amountETH, maxRate, minRate)
  //     ).to.be.revertedWith("Not enough tokens to transfer.");
  //   });
});
