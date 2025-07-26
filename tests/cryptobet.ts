import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Cryptobet } from "../target/types/cryptobet";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import { expect } from "chai";
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";
import { Connection } from "@solana/web3.js";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { it } from "mocha";

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


   
  it("it shoud intialize the markte", async() => {

    const signer = provider.publicKey;
    const seed = new anchor.BN(1234);

    // state account
    const state_seed = [Buffer.from("bet_state"),signer.toBuffer(),seed.toArrayLike(Buffer,"le",8)];
    const state_account =  getpda(state_seed);

    // bet account 
    const bet_seed = [Buffer.from("pool_account"),signer.toBuffer(),seed.toArrayLike(Buffer,"le",8)];
    const bet_account = getpda(bet_seed);

    console.log("here is state_account", state_account.toBase58());
    console.log("here is bet_account", bet_account.toBase58())

    console.log("passed")
  })







  const getpda = (seeds:any) => {
    return PublicKey.findProgramAddressSync(
      seeds,
      program.programId
    )[0]
  }



  
})


