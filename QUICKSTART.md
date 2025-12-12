# 🚀 Quick Start Guide - Commit2ShowUp

## Just Run It!

```bash
bun run dev
```

That's it! Open http://localhost:3000

---

## What You Get

✅ **Full-stack Farcaster Mini App**
- Next.js 14 + TypeScript
- Tailwind CSS (mobile-first UI)
- Farcaster Frames v2 support
- Base Sepolia blockchain integration

✅ **Smart Contracts**
- EventStaking.sol - Main event management contract
- MockUSDC.sol - Test ERC20 token
- Hardhat setup for deployment

✅ **Web Pages**
- `/` - Landing page
- `/events` - Browse events
- `/events/create` - Create new event
- `/events/[id]` - Event details & interactions

✅ **Farcaster Frames**
- `/api/frames/event/[id]` - View event in cast
- Join & check-in actions from Farcaster

---

## Optional: Deploy Contracts

If you want to test with real contracts:

1. **Get Base Sepolia ETH** from [faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)

2. **Create `.env.local`**:
```env
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_URL=http://localhost:3000
```

3. **Deploy contracts**:
```bash
bun run deploy:sepolia
```

4. **Add contract addresses to `.env.local`**:
```env
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_EVENT_STAKING_ADDRESS=0x...
```

---

## Project Structure

```
my-minikit-app/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── auth/          # Farcaster Quick Auth
│   │   └── frames/        # Farcaster Frames v2
│   ├── events/            # Event pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── contracts/              # Solidity contracts
│   ├── EventStaking.sol
│   └── MockUSDC.sol
├── lib/                    # Utilities
│   ├── contracts.ts       # Contract ABIs & addresses
│   └── types.ts           # TypeScript types
├── scripts/                # Deployment scripts
└── test/                   # Contract tests
```

---

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Blockchain**: Base Sepolia, viem, wagmi
- **Farcaster**: Miniapp SDK, Frames v2 (frog)
- **Contracts**: Solidity 0.8.20, Hardhat, OpenZeppelin

---

## Available Commands

- `bun run dev` - Start dev server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run compile` - Compile contracts
- `bun run test` - Run contract tests
- `bun run deploy:sepolia` - Deploy to Base Sepolia

---

## Notes

- App works **without contracts** - UI is fully functional
- Contract addresses are optional - app shows helpful messages if not configured
- Farcaster integration works in Farcaster clients (Warpcast, etc.)
- Frames work standalone - can be embedded in casts

---

**Ready to go! Just `bun run dev` and start building! 🎉**


