import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy MockUSDC
  console.log("\nDeploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("MockUSDC deployed to:", mockUSDCAddress);

  // Deploy EventStaking
  console.log("\nDeploying EventStaking...");
  const EventStaking = await ethers.getContractFactory("EventStaking");
  const eventStaking = await EventStaking.deploy(mockUSDCAddress);
  await eventStaking.waitForDeployment();
  const eventStakingAddress = await eventStaking.getAddress();
  console.log("EventStaking deployed to:", eventStakingAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("MockUSDC:", mockUSDCAddress);
  console.log("EventStaking:", eventStakingAddress);
  console.log("\nSave these addresses to your .env.local file:");
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${mockUSDCAddress}`);
  console.log(`NEXT_PUBLIC_EVENT_STAKING_ADDRESS=${eventStakingAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


