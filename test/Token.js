const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenToken", function () {
  let Token, tokentoken, owner, addr1, addr2;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    Token = await ethers.getContractFactory("Token");
    tokentoken = await Token.deploy();
    await tokentoken.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async () => {
      expect(await tokentoken.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async () => {
      expect(await tokentoken.name()).to.equal("TokenToken");
      expect(await tokentoken.symbol()).to.equal("TT");
    });
  });

  describe("Minting", function () {
    it("Should mint tokentokens to owner", async () => {
      await tokentoken.mint(1000);
      expect(await tokentoken.balanceOf(owner.address)).to.equal(1000);
      expect(await tokentoken.totalSupply()).to.equal(1000);
    });

    it("Should disable minting", async () => {
      await tokentoken.disable_mint();
      await expect(tokentoken.mint(1000)).to.be.revertedWith(
        "Mint has already been disabled."
      );
    });

    it("Should revert disabling mint again", async () => {
      await tokentoken.disable_mint();
      await expect(tokentoken.disable_mint()).to.be.revertedWith(
        "Mint has already been disabled."
      );
    });
  });

  describe("Total Supply", function () {
    beforeEach(async () => {
      await tokentoken.mint(1000);
    });

    it("Should return the correct total supply", async () => {
      expect(await tokentoken.totalSupply()).to.equal(1000);
    });

    it("Should increase total supply after minting", async () => {
      await tokentoken.mint(500);
      expect(await tokentoken.totalSupply()).to.equal(1500); // 1000 initially + 500 minted
    });
  });

  describe("Transfers", function () {
    beforeEach(async () => {
      await tokentoken.mint(1000);
    });

    it("Should transfer tokentoken between accounts", async () => {
      await tokentoken.transfer(addr1.address, 500);
      expect(await tokentoken.balanceOf(addr1.address)).to.equal(500);
    });

    it("Should fail if sender doesn’t have enough balance", async () => {
      await expect(
        tokentoken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("insufficient balance");
    });

    it("Should revert transfer to zero address", async () => {
      await expect(
        tokentoken.transfer(ethers.constants.AddressZero, 100)
      ).to.be.revertedWith("Transfer to zero address");
    });
  });

  describe("Allowance & Approvals", function () {
    beforeEach(async () => {
      await tokentoken.mint(1000);
    });

    it("Should approve and allow transferFrom", async () => {
      await tokentoken.approve(addr1.address, 500);
      await tokentoken
        .connect(addr1)
        .transferFrom(owner.address, addr2.address, 200);
      expect(await tokentoken.balanceOf(addr2.address)).to.equal(200);
    });

    it("Should fail transferFrom if not enough allowance", async () => {
      await tokentoken.approve(addr1.address, 100);
      await expect(
        tokentoken
          .connect(addr1)
          .transferFrom(owner.address, addr2.address, 200)
      ).to.be.revertedWith("Insufficient allowance");
    });

    it("Should fail transferFrom if not enough balance", async () => {
      await tokentoken.transfer(addr1.address, 100);
      await tokentoken.connect(addr1).approve(addr2.address, 100);
      await tokentoken.connect(addr1).transfer(owner.address, 100);
      await expect(
        tokentoken
          .connect(addr2)
          .transferFrom(addr1.address, owner.address, 100)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should fail transferFrom if not enough allowance", async () => {
      await tokentoken.transfer(addr1.address, 100);
      await tokentoken.connect(addr1).approve(addr2.address, 100);
      await expect(
        tokentoken
          .connect(addr2)
          .transferFrom(addr1.address, owner.address, 200)
      ).to.be.revertedWith("Insufficient allowance");
    });

    it("Should revert approval to zero address", async () => {
      await expect(
        tokentoken.approve(ethers.constants.AddressZero, 100)
      ).to.be.revertedWith("Approve to zero address");
    });

    it("Should fail if allowance check is made from a zero address", async () => {
      await expect(
        tokentoken.allowance(ethers.constants.AddressZero, addr1.address)
      ).to.be.revertedWith("Transfer to zero address");
    });

    it("Should fail if allowance check is made to a zero address", async () => {
      await expect(
        tokentoken.allowance(addr1.address, ethers.constants.AddressZero)
      ).to.be.revertedWith("Transfer from zero address");
    });

    it("Should return correct allowance between valid addresses", async () => {
      await tokentoken.approve(addr1.address, 300);
      const allowance = await tokentoken.allowance(
        owner.address,
        addr1.address
      );
      expect(allowance).to.equal(300);
    });
  });
});
