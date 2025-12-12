# noFlake - Stake-Backed Events on Base

## 🚀 Quick Start

```bash
bun run dev
```

Open http://localhost:3000 - **That's it!**

---

## ✅ What's Included

### **Full-Stack Application**
- ✅ Next.js 14 (App Router) + TypeScript
- ✅ Tailwind CSS (mobile-first, responsive)
- ✅ Farcaster Mini App SDK integration
- ✅ Base Sepolia blockchain (viem + wagmi)

### **Smart Contracts**
- ✅ `EventStaking.sol` - Main event management contract
- ✅ `MockUSDC.sol` - ERC20 token for testing
- ✅ Hardhat configuration for Base Sepolia
- ✅ Deployment scripts ready

### **Web Pages**
- ✅ `/` - Landing page with Farcaster integration
- ✅ `/events` - Browse all events
- ✅ `/events/create` - Create new event (with wallet connect)
- ✅ `/events/[id]` - Event details, join, check-in

### **Farcaster Integration**
- ✅ Mini app ready (works in Farcaster clients)
- ✅ User authentication via Quick Auth
- ✅ Deep links to web app

---

## 📁 Project Structure

```
my-minikit-app/
├── app/
│   ├── api/
│   │   └── auth/route.ts          # Farcaster Quick Auth
│   ├── events/
│   │   ├── page.tsx               # Events list
│   │   ├── create/page.tsx        # Create event
│   │   └── [id]/page.tsx          # Event detail
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page
│   └── rootProvider.tsx           # Wagmi/OnchainKit provider
├── contracts/
│   ├── EventStaking.sol           # Main contract
│   └── MockUSDC.sol               # Test token
├── lib/
│   ├── contracts.ts               # ABIs & addresses
│   └── types.ts                   # TypeScript types
├── scripts/
│   └── deploy.ts                  # Deployment script
└── test/
    └── EventStaking.test.ts       # Contract tests
```

---

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run compile` | Compile Solidity contracts |
| `bun run test` | Run contract tests |
| `bun run deploy:sepolia` | Deploy to Base Sepolia |

---

## ⚙️ Configuration

### Environment Variables (Optional)

Create `.env.local`:

```env
# Base Sepolia RPC
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Private key for deployments (NEVER commit!)
PRIVATE_KEY=your_private_key_here

# Contract addresses (set after deployment)
NEXT_PUBLIC_USDC_ADDRESS=
NEXT_PUBLIC_EVENT_STAKING_ADDRESS=

# App URL
NEXT_PUBLIC_URL=http://localhost:3000

# OnchainKit API Key (optional)
NEXT_PUBLIC_ONCHAINKIT_API_KEY=
```

**Note:** The app works **without contracts** - UI is fully functional. Contract addresses are optional.

---

## 🎯 How It Works

1. **Create Event**: Organizer creates event with deposit amount (e.g., 5 USDC)
2. **Join Event**: Participants stake USDC to commit to showing up
3. **Check In**: At event time, participants check in
4. **Settle**: Organizer settles event, deposits distributed to checked-in participants

---

## 🔧 Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Base Sepolia, viem, wagmi
- **Farcaster**: Miniapp SDK, Quick Auth
- **Contracts**: Solidity 0.8.20, Hardhat, OpenZeppelin

---

## 📚 Key Features

### **Error Handling**
- ✅ Graceful handling of missing contract addresses
- ✅ User-friendly error messages
- ✅ Loading states for all async operations

### **Wallet Integration**
- ✅ Connect wallet via OnchainKit
- ✅ USDC balance display
- ✅ Automatic approval flow
- ✅ Transaction status tracking

### **Farcaster Integration**
- ✅ Mini app ready (works in Farcaster clients)
- ✅ User authentication via Quick Auth
- ✅ Deep linking to web app

---

## 🚢 Deployment

### Deploy Contracts (Optional)

1. Get Base Sepolia ETH from [faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
2. Add `PRIVATE_KEY` to `.env.local`
3. Run: `bun run deploy:sepolia`
4. Copy contract addresses to `.env.local`

### Deploy Web App

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy!

---

## ✨ Ready to Use!

The project is **production-ready** and **fully functional**. Just run `bun run dev` and start building!

**No setup required** - everything works out of the box. Contract addresses are optional for testing the UI.

---

## 📝 Notes

- App works without contracts - perfect for UI development
- Contract addresses show helpful messages if not configured
- Farcaster integration works in Farcaster clients
- All TypeScript types are properly defined
- Error boundaries and loading states included

**Happy building! 🎉**
