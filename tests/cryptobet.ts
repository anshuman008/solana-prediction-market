import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Cryptobet } from "../target/types/cryptobet";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import { expect } from "chai";
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";
import { Connection } from "@solana/web3.js";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { it } from "mocha";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import dotenv from "dotenv";
import wallets from "./key.json";

dotenv.config();

describe("cryptobet", async() => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const allUsers: Keypair[] = wallets.map((val) => Keypair.fromSecretKey(bs58.decode(val)));

  console.log("Total keypairs loaded:", allUsers.length);

  const program = anchor.workspace.cryptobet as Program<Cryptobet>;
  const provider = anchor.AnchorProvider.env(); 
  const connection = provider.connection;
  const wallet = provider.wallet as anchor.Wallet;
  const pythSolanaReceiver = new PythSolanaReceiver({ connection, wallet });

  const solUsdPriceFeedAccount = pythSolanaReceiver
    .getPriceFeedAccountAddress(0, "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43")
    .toBase58();

  console.log("SOL/USD Price Feed:", solUsdPriceFeedAccount);

  const signer = provider.publicKey;
  const seed = new anchor.BN(1218); 

  // state account - using 8 bytes for seed (u64)
  const state_seed = [
    Buffer.from("bet_state"),
    signer.toBuffer(),
    seed.toArrayLike(Buffer,"le",8)
  ];
  const state_account = PublicKey.findProgramAddressSync(
    state_seed,
    program.programId
  )[0];

  // pool account - using 8 bytes for seed (u64)
  const pool_seed = [
    Buffer.from("pool_account"),
    signer.toBuffer(),
    seed.toArrayLike(Buffer,"le",8)
  ];
  const pool_account = PublicKey.findProgramAddressSync(
    pool_seed,
    program.programId
  )[0];

  // pyth account
  const pyth_price_account = new PublicKey(solUsdPriceFeedAccount);

  // system program
  const system_program = SystemProgram.programId;

  it("should initialize the market", async() => {
    console.log("=== INITIALIZING MARKET ===");
    console.log("State account:", state_account.toBase58());
    console.log("Pool account:", pool_account.toBase58());
    console.log("Pyth account:", pyth_price_account.toBase58());
    console.log("System program:", system_program.toBase58());

    // args
    const crypto_target_price = new anchor.BN(119000); // $119
    const bet_price = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
    const bet_duration = new anchor.BN(121); // 1 minutes
    const betfees = 500; // 5%

    try {
      const tx = await program.methods
        .initialize(
          seed,
          crypto_target_price,
          bet_price,
          bet_duration,
          betfees
        )
        .accounts({
          signer: signer,
          //@ts-ignore
          betState: state_account,
          poolAccount: pool_account,
          pythPriceFeed: pyth_price_account,
          systemProgram: system_program,
        })
        .signers([provider.wallet.payer])
        .rpc();

      console.log("Transaction signature:", tx);

      // Verify the state was initialized correctly
      const betStateAccount = await program.account.betState.fetch(state_account);
     
      Object.entries(betStateAccount).map((val) => {
        console.log(`${val[0]}: ${val[1].toString()}`)
      });

      console.log("✅ Market initialized successfully!");
      console.log("Crypto start price:", betStateAccount.cryptoStartPrice.toString());
      
    } catch (error) {
      console.error("❌ Test failed:", error);
      throw error;
    }
  });

  // Multiple NO bets (users betting price will NOT reach target)
  it("should place multiple NO bets", async() => {
    console.log("=== PLACING NO BETS ===");
    
    // Use first 4 users for NO bets
    const noBettors = allUsers.slice(0, 4);
    
    for (let i = 0; i < noBettors.length; i++) {
      const user = noBettors[i];
      console.log(`Placing NO bet for user ${i + 1}: ${user.publicKey.toBase58()}`);
      
      const claim_seeds = [
        Buffer.from("claim"), 
        user.publicKey.toBuffer(),
        state_account.toBuffer()
      ];
      const user_claim_account = PublicKey.findProgramAddressSync(
        claim_seeds,
        program.programId
      )[0];

      try {
        const tx = await program.methods.bet(0) // 0 = NO bet
          .accounts({
            signer: user.publicKey,
            //@ts-ignore
            creator: signer,
            betState: state_account,
            poolAccount: pool_account,
            claimState: user_claim_account,
            systemProgram: system_program
          })
          .signers([user])
          .rpc();

        console.log(`✅ NO bet ${i + 1} placed. TX: ${tx}`);
      } catch (error) {
        console.error(`❌ NO bet ${i + 1} failed:`, error);
      }
    }
  });

  // Multiple YES bets (users betting price WILL reach target)
  it("should place multiple YES bets", async() => {
    console.log("=== PLACING YES BETS ===");
    
    // Use next 6 users for YES bets (users 4-9, indices 4-9)
    const yesBettors = allUsers.slice(4, 10);
    
    for (let i = 0; i < yesBettors.length; i++) {
      const user = yesBettors[i];
      console.log(`Placing YES bet for user ${i + 5}: ${user.publicKey.toBase58()}`);
      
      const claim_seeds = [
        Buffer.from("claim"), 
        user.publicKey.toBuffer(),
        state_account.toBuffer()
      ];
      const user_claim_account = PublicKey.findProgramAddressSync(
        claim_seeds,
        program.programId
      )[0];

      try {
        const tx = await program.methods.bet(1) // 1 = YES bet
          .accounts({
            signer: user.publicKey,
            //@ts-ignore
            creator: signer,
            betState: state_account,
            poolAccount: pool_account,
            claimState: user_claim_account,
            systemProgram: system_program
          })
          .signers([user])
          .rpc();

        console.log(`✅ YES bet ${i + 1} placed. TX: ${tx}`);
      } catch (error) {
        console.error(`❌ YES bet ${i + 1} failed:`, error);
      }
    }
  });

  it("should display betting summary", async() => {
    console.log("=== BETTING SUMMARY ===");
    
    try {
      const betStateAccount = await program.account.betState.fetch(state_account);
      
      console.log("Total NO bets:", betStateAccount.noVoters?.toString() || "0");
      console.log("Total YES bets:", betStateAccount.yesVoters?.toString() || "0");
      console.log("Total pool amount:", (betStateAccount.poolBalance?.toString() || "0") + " lamports");
      console.log("Pool amount in SOL:", ((betStateAccount.poolBalance.toNumber() / LAMPORTS_PER_SOL).toString()));
      console.log("total transactiom :", betStateAccount.totalTransactions?.toString() || "Unknown");

    } catch (error) {
      console.error("Failed to fetch bet state:", error);
    }
  });

  it("should resolve the bet", async() => {
    console.log("=== RESOLVING BET ===");
    
    try {
      // Wait a bit to ensure bet duration might have passed
      console.log("Waiting 120 seconds before resolving...");
      await new Promise(resolve => setTimeout(resolve, 120000));
      
      const tx = await program.methods.resolve()
        .accounts({
          signer: signer, // Market creator resolves
          creator: signer,
          //@ts-ignore
          betState: state_account,
          pythPriceFeed: pyth_price_account,
          systemProgram: system_program
        })
        .signers([provider.wallet.payer])
        .rpc();

      console.log("✅ Bet resolved successfully! TX:", tx);
      
      // Check final state
      const betStateAccount = await program.account.betState.fetch(state_account);
      console.log("Final status:", betStateAccount.isActive?.toString());
      console.log("Winning side:", betStateAccount.winnerSide?.toString());
      console.log("Final price:", betStateAccount.cryptoTragetPrice?.toString());
      
    } catch (error) {
      console.error("❌ Bet resolution failed:", error);
      throw error;
    }
  });

  it("should allow winning side to claim rewards", async() => {
    console.log("=== CLAIMING REWARDS ===");
    
    try {
      // First, check which side won
      const betStateAccount = await program.account.betState.fetch(state_account);
      const winningSide = betStateAccount.winnerSide;
      
      console.log("Winning side:", winningSide?.toString());
      
      let winners: Keypair[] = [];
      
      if (winningSide === 0) {
        // NO side won - first 4 users
        winners = allUsers.slice(0, 4);
        console.log("NO side won! Processing claims for NO bettors...");
      } else if (winningSide === 1) {
        // YES side won - users 4-9
        winners = allUsers.slice(4, 10);
        console.log("YES side won! Processing claims for YES bettors...");
      } else {
        console.log("No winner determined or draw");
        return;
      }

      // Process claims for winners
      for (let i = 0; i < winners.length; i++) {
        const user = winners[i];
        console.log(`Processing claim for winner ${i + 1}: ${user.publicKey.toBase58()}`);
        
        const user_pda_seed = [
          Buffer.from("claim"),
          user.publicKey.toBuffer(),
          state_account.toBuffer()
        ];
        
        const user_pda = PublicKey.findProgramAddressSync(
          user_pda_seed,
          program.programId
        )[0];

        try {
          // Check initial balance
          const initialBalance = await connection.getBalance(user.publicKey);
          console.log(`Initial balance: ${initialBalance / LAMPORTS_PER_SOL} SOL`);

          const tx = await program.methods.claim()
            .accounts({
              signer: user.publicKey,
              //@ts-ignore
              creator: signer,
              betState: state_account,
              poolAccount: pool_account,
              claimAccount: user_pda,
              systemProgram: system_program
            })
            .signers([user])
            .rpc();

          console.log(`✅ Claim ${i + 1} successful! TX: ${tx}`);

          // Check final balance
          const finalBalance = await connection.getBalance(user.publicKey);
          console.log(`Final balance: ${finalBalance / LAMPORTS_PER_SOL} SOL`);
          console.log(`Reward claimed: ${(finalBalance - initialBalance) / LAMPORTS_PER_SOL} SOL`);
          
        } catch (error) {
          console.error(`❌ Claim ${i + 1} failed:`, error);
        }
      }
      
    } catch (error) {
      console.error("❌ Claiming process failed:", error);
    }
  });

  // Helper test to check individual claim accounts
  it("should check individual claim accounts", async() => {
    console.log("=== CHECKING CLAIM ACCOUNTS ===");
    
    for (let i = 0; i < Math.min(allUsers.length, 10); i++) {
      const user = allUsers[i];
      const claim_seeds = [
        Buffer.from("claim"),
        user.publicKey.toBuffer(),
        state_account.toBuffer()
      ];
      
      const user_claim_pda = PublicKey.findProgramAddressSync(
        claim_seeds,
        program.programId
      )[0];

      try {
        const claimAccount = await program.account.userClaim.fetch(user_claim_pda);
        
        console.log(`User ${i + 1} (${user.publicKey.toBase58().slice(0, 8)}...):`);
        Object.entries(claimAccount).map((val) => {
          console.log(`  ${val[0]}: ${val[1].toString()}`);
        });
        console.log("---");
        
      } catch (error) {
        console.log(`User ${i + 1}: No claim account found`);
      }
    }
  });
});