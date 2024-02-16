const { expect } = require("chai");
const { waffle, ethers, loadFixture } = require("hardhat");
const { deployMockContract } = waffle;

describe("SaveERC20", function () {
  const ERC20TokenMockFactory = require("./mocks/ERC20TokenMocks.json");

  async function deploySaveERC20(address) {
    const SaveERC20 = await ethers.getContractFactory("SaveERC20");
    const saveERC20 = await SaveERC20.deploy(address);
    return { saveERC20 };
  }

  describe("Deposit", function () {
    it("Should revert if deposit is not more than 0", async function () {
      const [owner, otherAccount, thirdAccount] = await ethers.getSigners();
      const ERC20TokenMock = await deployMockContract(
        owner,
        ERC20TokenMockFactory.abi
      );
      const { saveERC20 } = await deploySaveERC20(ERC20TokenMock.address);
      await expect(saveERC20.deposit(0)).to.be.revertedWith(
        "can't save zero value"
      );
    });
    it("Should revert if balance > deposit", async function () {
      const [owner, otherAccount, thirdAccount] = await ethers.getSigners();
      const ERC20TokenMock = await deployMockContract(
        owner,
        ERC20TokenMockFactory.abi
      );
      await ERC20TokenMock.mock.balanceOf.returns(0);
      const { saveERC20 } = await deploySaveERC20(ERC20TokenMock.address);
      await expect(
        saveERC20.connect(thirdAccount).deposit(50000)
      ).to.be.revertedWith("not enough token");
    });
    it("Should revert if contract has no allowance", async function () {
      const [owner, otherAccount, thirdAccount] = await ethers.getSigners();
      const ERC20TokenMock = await deployMockContract(
        owner,
        ERC20TokenMockFactory.abi
      );
      await ERC20TokenMock.mock.balanceOf.returns(50000);
      await ERC20TokenMock.mock.transferFrom.returns(false);
      const { saveERC20 } = await deploySaveERC20(ERC20TokenMock.address);
      await expect(saveERC20.deposit(50000)).to.be.revertedWith(
        "failed to transfer"
      );
    });
    it("Should deposit cause contract has allowance", async function () {
      const [owner, otherAccount, thirdAccount] = await ethers.getSigners();
      const ERC20TokenMock = await deployMockContract(
        owner,
        ERC20TokenMockFactory.abi
      );
      await ERC20TokenMock.mock.balanceOf.returns(50000);
      await ERC20TokenMock.mock.transferFrom.returns(true);
      const { saveERC20 } = await deploySaveERC20(ERC20TokenMock.address);
      // console.log(owner);
      await expect(await saveERC20.deposit(50000))
        .to.emit(saveERC20, "SavingSuccessful")
        .withArgs(owner.address, 50000);
      await expect(await saveERC20.checkContractBalance()).to.be.equals(50000);
      await expect(
        await saveERC20.checkUserBalance(owner.address)
      ).to.be.equals(50000);
    });
  });
  describe("Withdraw", function () {
    it("Should revert if withdrawal is not more than 0", async function () {
      const [owner] = await ethers.getSigners();
      const ERC20TokenMock = await deployMockContract(
        owner,
        ERC20TokenMockFactory.abi
      );
      const { saveERC20 } = await deploySaveERC20(ERC20TokenMock.address);
      await expect(saveERC20.withdraw(0)).to.be.revertedWith(
        "can't withdraw zero value"
      );
    });
    it("Should revert if balance < amount", async function () {
      const [owner] = await ethers.getSigners();
      const ERC20TokenMock = await deployMockContract(
        owner,
        ERC20TokenMockFactory.abi
      );
      const { saveERC20 } = await deploySaveERC20(ERC20TokenMock.address);
      await expect(saveERC20.withdraw(50000)).to.be.revertedWith(
        "insufficient funds"
      );
    });
    it("Should revert if transfer fails", async function () {
      const [owner] = await ethers.getSigners();
      const ERC20TokenMock = await deployMockContract(
        owner,
        ERC20TokenMockFactory.abi
      );
      await ERC20TokenMock.mock.balanceOf.returns(50000);
      await ERC20TokenMock.mock.transferFrom.returns(true);
      await ERC20TokenMock.mock.transfer.returns(false);
      const { saveERC20 } = await deploySaveERC20(ERC20TokenMock.address);
      await saveERC20.deposit(50000);
      await expect(saveERC20.withdraw(50000)).to.be.revertedWith(
        "failed to withdraw"
      );
    });
    it("Should withdraw succesfully", async function () {
      const [owner] = await ethers.getSigners();
      const ERC20TokenMock = await deployMockContract(
        owner,
        ERC20TokenMockFactory.abi
      );
      await ERC20TokenMock.mock.balanceOf.returns(50000);
      await ERC20TokenMock.mock.transferFrom.returns(true);
      await ERC20TokenMock.mock.transfer.returns(true);
      const { saveERC20 } = await deploySaveERC20(ERC20TokenMock.address);
      await saveERC20.deposit(50000);
      await ERC20TokenMock.mock.balanceOf.returns(0);
      await expect(saveERC20.withdraw(50000))
        .to.emit(saveERC20, "WithdrawSuccessful")
        .withArgs(owner.address, 50000);
      await expect(await saveERC20.checkContractBalance()).to.be.equals(0);
      await expect(
        await saveERC20.checkUserBalance(owner.address)
      ).to.be.equals(0);
    });
    it("Should revert if it is not the owner", async function () {
      const [owner, otherAccount] = await ethers.getSigners();
      const ERC20TokenMock = await deployMockContract(
        owner,
        ERC20TokenMockFactory.abi
      );
      await ERC20TokenMock.mock.balanceOf.returns(50000);
      await ERC20TokenMock.mock.transferFrom.returns(true);
      await ERC20TokenMock.mock.transfer.returns(true);
      const { saveERC20 } = await deploySaveERC20(ERC20TokenMock.address);
      await saveERC20.deposit(50000);
      await expect(
        saveERC20.connect(otherAccount).ownerWithdraw(50000)
      ).to.be.revertedWith("not owner");
      await expect(await saveERC20.checkContractBalance()).to.be.equals(50000);
    });
    it("Should withdraw contract balance to owner", async function () {
      const [owner, otherAccount] = await ethers.getSigners();
      const ERC20TokenMock = await deployMockContract(
        owner,
        ERC20TokenMockFactory.abi
      );
      await ERC20TokenMock.mock.balanceOf.returns(50000);
      await ERC20TokenMock.mock.transferFrom.returns(true);
      await ERC20TokenMock.mock.transfer.returns(true);
      const { saveERC20 } = await deploySaveERC20(ERC20TokenMock.address);
      await saveERC20.deposit(50000);
      await ERC20TokenMock.mock.balanceOf.returns(0);
      await saveERC20.ownerWithdraw(50000);
      await expect(await saveERC20.checkContractBalance()).to.be.equals(0);
    });
  });
});
