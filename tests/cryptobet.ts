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

dotenv.config();

describe("cryptobet", async() => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.cryptobet as Program<Cryptobet>;
  const provider = anchor.AnchorProvider.env(); 
  const connection = provider.connection;
  const wallet = provider.wallet as anchor.Wallet;
  const pythSolanaReceiver = new PythSolanaReceiver({ connection, wallet });

  const solUsdPriceFeedAccount = pythSolanaReceiver
    .getPriceFeedAccountAddress(0, "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43")
    .toBase58();

  console.log(solUsdPriceFeedAccount);

    const signer = provider.publicKey;
    const seed = new anchor.BN(1921); 

    const user1 = Keypair.fromSecretKey(bs58.decode(process.env.USER1_KEY!));
    const user2 = Keypair.fromSecretKey(bs58.decode(process.env.USER2_KEY!));
    const user3 = Keypair.fromSecretKey(bs58.decode(process.env.USER3_KEY!));


    // state account - using 2 bytes for seed (u16)
    const state_seed = [
      Buffer.from("bet_state"),
      signer.toBuffer(),
      seed.toArrayLike(Buffer,"le",8) // u16 seed
    ];
    const state_account =PublicKey.findProgramAddressSync(
      state_seed,
      program.programId
    )[0];

    // pool account - using 2 bytes for seed (u16)
    const pool_seed = [
      Buffer.from("pool_account"),
      signer.toBuffer(),
      seed.toArrayLike(Buffer,"le",8) // u16 seed
    ];
    const pool_account = PublicKey.findProgramAddressSync(
      pool_seed,
      program.programId
    )[0];

    // pyth account
    const pyth_price_account = new PublicKey(solUsdPriceFeedAccount);

    // system program
    const system_program = SystemProgram.programId;


  xit("it should initialize the market", async() => {
  

    console.log("here is state_account", state_account.toBase58());
    console.log("here is pool_account", pool_account.toBase58());
    console.log("here is pyth account", pyth_price_account.toBase58());
    console.log("here is system program", system_program.toBase58());

    // args
    const crypto_target_price = new anchor.BN(119000);
    const bet_price = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
    const bet_duration = new anchor.BN(600);
    const betfees = 500;

    try {
      // Call the createhandler method (based on your Rust function name)
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
      })

      console.log("✅ Market initialized successfully!");
      console.log("Crypto start price:", betStateAccount.cryptoStartPrice.toString());


      
    } catch (error) {
      console.error("❌ Test failed:", error);
      throw error;
    }

    console.log("passed");
  });
  

  xit("should bet on NO", async() => {

      const tx = await program.methods.bet(0)
      .accounts(
  {
        signer:user1.publicKey,
        //@ts-ignore
        creator:signer,
        betState: state_account,
        poolAccount: pool_account,
        systemProgram: system_program
  }
      )
      .signers([user1])
      .rpc()


      console.log("Transaction signature:", tx);

  })

  xit("shoud bet on  Yess", async() => {

      const tx = await program.methods.bet(1)
      .accounts(
  {
        signer:user2.publicKey,
        //@ts-ignore
        creator:signer,
        betState: state_account,
        poolAccount: pool_account,
        systemProgram: system_program
  }
      )
      .signers([user2])
      .rpc()


      console.log("Transaction signature:", tx);

  })

  xit("should bet on  Yess too", async() => {

      const tx = await program.methods.bet(1)
      .accounts(
  {
        signer:user3.publicKey,
        //@ts-ignore
        creator:signer,
        betState: state_account,
        poolAccount: pool_account,
        systemProgram: system_program
  }
      )
      .signers([user3])
      .rpc()


      console.log("Transaction signature:", tx);

  })

 
  xit("should fetch the state data",  async() => {

      // const user_pda_seed = [Buffer.from("claim"),user3.publicKey.toBuffer(),state_account.toBuffer()];
       

      const user_pda = PublicKey.findProgramAddressSync(
      state_seed,
      program.programId
    )[0];




    const args = await program.account.betState.fetch(user_pda);


    //@ts-ignore
    // console.log("claimed amounr: ", args.amount/LAMPORTS_PER_SOL);

    Object.entries(args).map((val) => {
      console.log(`${val[0]}: ${val[1].toString()}`)
    })
  })

  xit("should resolve the bet",  async() => {
    try{
        const txs = await program.methods.resolve()
      .accounts(
        {
          signer: user1.publicKey,
          creator: signer,
          //@ts-ignore
          betState: state_account,
          pythPriceFeed: pyth_price_account,
          systemProgram: system_program
        }
      ).signers([user1])
      .rpc();

      console.log("bet resolve succesfully!!", txs);
    }
    catch(e){
      console.log("something went wrong", e);
    }

      
  })

  xit("should claim the amount", async() => {
     
    const user_pda_seed = [Buffer.from("claim"),user1.publicKey.toBuffer(),state_account.toBuffer()];

    const balance = await connection.getBalance(user1.publicKey);

    console.log("here is intial balance!!", balance/LAMPORTS_PER_SOL);

    const user_pda = PublicKey.findProgramAddressSync(
      user_pda_seed,
      program.programId
    )[0];

     try{
         const txs = await program.methods.claim()
         .accounts({
          signer:user1.publicKey,
          //@ts-ignore
          creator: signer,
          betState:state_account,
          poolAccount:pool_account,
          claimAccount:user_pda,
          systemProgram: system_program
         })
         .signers([user1])
         .rpc();


         console.log("claimed succes!!", txs);

         console.log("claimable pubke: ", signer);

         const afterbalance = await connection.getBalance(user1.publicKey);
         

         console.log("updated balance: ", afterbalance/LAMPORTS_PER_SOL);

     }
     catch(e){
      console.log("here is error", e);
     }
  })

  it("norma test", async() => {


    const programId = new PublicKey("Ahb2NPqt6wqcLJydV2asqydAuctHPAFhUskXDzYSF61x");
    const seeds  = [Buffer.from("config")];
    const configpda = PublicKey.findProgramAddressSync(seeds,programId)[0];
     
    console.log("here is the config pda----", configpda.toBase58());

  })

})



