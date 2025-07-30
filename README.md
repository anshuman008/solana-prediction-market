# CryptoBet

CryptoBet is a decentralized betting protocol built on Solana using the Anchor framework. It allows users to create and participate in prediction markets on the future price of cryptocurrencies (e.g., BTC/USDC). Users can bet on whether the price will reach a target within a specified duration, and winners can claim rewards from the pooled funds.

## Features

- **Create Prediction Markets:** Anyone can initialize a new market with a target price, bet price, duration, and fee.
- **Place Bets:** Users can bet "YES" (price will reach/exceed target) or "NO" (price will not reach target) by depositing SOL.
- **Resolve Markets:** After the bet duration, the market creator (or anyone) can resolve the market using a Pyth price feed (e.g., BTC/USDC).
- **Claim Rewards:** Winning side participants can claim their share of the pool, minus protocol fees.
- **On-chain Settlement:** All logic and funds are managed by Solana smart contracts for transparency and security.

## How It Works

1. **Initialize Market:**  
   The market creator specifies:
   - `seed`: Unique identifier for the market
   - `crypto_target_price`: Target price (e.g., BTC/USDC in USD cents)
   - `bet_price`: Amount to bet (in lamports)
   - `bet_duration`: Duration for the bet (in seconds)
   - `betfees`: Protocol fee (basis points, e.g., 500 = 5%)

2. **Place Bets:**  
   Users place bets by sending the required SOL and choosing "YES" or "NO". Each bet is recorded on-chain.

3. **Resolve Market:**  
   After the duration, the market is resolved using the latest BTC/USDC price from the Pyth oracle. The winning side is determined by whether the price meets/exceeds the target.

4. **Claim Rewards:**  
   Winners can claim their rewards, which are distributed proportionally from the pool after deducting fees.

## Program Structure

- **Solana Program:**  
  Located in `programs/cryptobet/` (Rust, Anchor).
  - `instructions/`: Handlers for `initialize`, `bet`, `resolve`, and `claim`.
  - `state.rs`: Defines `BetState` and `UserClaim` accounts.
  - `error.rs`: Custom error types.

- **Tests:**  
  Located in `tests/cryptobet.ts` (TypeScript, Mocha/Chai).
  - Simulates market creation, betting, resolution, and claiming.
  - Uses multiple wallets to test real-world scenarios.

## Example Usage

### 1. Initialize a Market (BTC/USDC)

```typescript
await program.methods
  .initialize(seed, crypto_target_price, bet_price, bet_duration, betfees)
  .accounts({
    signer,
    betState: state_account,
    poolAccount: pool_account,
    pythPriceFeed: btcUsdcPriceFeedAccount, // BTC/USDC price feed
    systemProgram,
  })
  .signers([provider.wallet.payer])
  .rpc();
```

### 2. Place a Bet

```typescript
await program.methods
  .bet(0) // 0 = NO, 1 = YES
  .accounts({
    signer: user.publicKey,
    creator: market_creator,
    betState: state_account,
    poolAccount: pool_account,
    claimState: user_claim_account,
    systemProgram,
  })
  .signers([user])
  .rpc();
```

### 3. Resolve the Market (BTC/USDC)

```typescript
await program.methods
  .resolve()
  .accounts({
    signer: market_creator,
    creator: market_creator,
    betState: state_account,
    pythPriceFeed: btcUsdcPriceFeedAccount, // BTC/USDC price feed
    systemProgram,
  })
  .signers([provider.wallet.payer])
  .rpc();
```

### 4. Claim Rewards

```typescript
await program.methods
  .claim()
  .accounts({
    signer: user.publicKey,
    creator: market_creator,
    betState: state_account,
    poolAccount: pool_account,
    claimAccount: user_claim_account,
    systemProgram,
  })
  .signers([user])
  .rpc();
```

## Accounts

- **BetState:** Stores market parameters, pool balance, participants, and result.
- **UserClaim:** Tracks each user's bet, claim status, and reward.

## Dependencies

- [Anchor](https://github.com/coral-xyz/anchor)
- [@solana/web3.js](https://github.com/solana-labs/solana-web3.js)
- [Pyth Oracle](https://pyth.network/)
- [Mocha](https://mochajs.org/) & [Chai](https://www.chaijs.com/) for testing

## Development

### Build & Test

```bash
anchor build
anchor test
```

### Directory Structure

```
programs/cryptobet/      # Solana program (Rust, Anchor)
tests/cryptobet.ts       # End-to-end tests (TypeScript)
migrations/              # Deployment scripts
app/                     # (Optional) Frontend or scripts
```

## License

ISC