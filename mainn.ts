// import { Program, AnchorProvider, Idl, Wallet } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
// import { WalletContextState } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import * as web3 from "@solana/web3.js";
import fs from "fs";
import path from "path";
import IcrosschainSwapSolana from "./icrosschain_swap_solana.json"

const getPayer = (file: String) => {
  const rawdata = fs.readFileSync(
    // replace with your key
    path.resolve("/home/datpham/.config/solana/" + file + ".json")
  );
  const keyData = JSON.parse(rawdata.toString());
  return web3.Keypair.fromSecretKey(new Uint8Array(keyData));
};

const callProgram = async () => {
  const endpoint = "https://api.devnet.solana.com";
  // process.env.REACT_APP_CONNECTION_NETWORK === "devnet"
  //   ? process.env.REACT_APP_SOLANA_RPC_HOST_DEVNET
  //   : process.env.REACT_APP_SOLANA_RPC_HOST_MAINNET_BETA

  //   if (!endpoint) throw new Error("No RPC endpoint configured.")

  const solConnection = new web3.Connection(endpoint, "confirmed");
  let payer = getPayer("id");
  const wallet = new anchor.Wallet(payer);
  const anchorWallet = {
    publicKey: wallet.publicKey,
    signAllTransactions: wallet.signAllTransactions,
    signTransaction: wallet.signTransaction,
  } as any;

  if (!wallet.publicKey) throw new Error("No public key.");

  const provider = new anchor.AnchorProvider(solConnection, anchorWallet, {
    preflightCommitment: "recent",
  });

  const programId = new PublicKey(
    "AfUXdLExtYBDG6bbAZa2sKvjwnqf3odpvdTcrUiBUhv8"
  );

//   const idl = await Program.fetchIdl(programId, provider);

//   if (!idl)
//     throw new Error(
//       "No idl with address " +
//         programId.toString() +
//         " has been found on " +
//         process.env.REACT_APP_CONNECTION_NETWORK +
//         "."
//     );

  const anchorProgram = new anchor.Program(IcrosschainSwapSolana as anchor.Idl, programId, provider);
  console.log("ok")

//   const res = await anchorProgram.rpc.initialize({});

  return null;
};

callProgram();
