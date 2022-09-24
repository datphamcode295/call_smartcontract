import web3 = require("@solana/web3.js");
import anchor = require("@project-serum/anchor");
import fs from "fs";
import Dotenv from "dotenv";
import IcrosschainSwapSolana from "./smartcontract.json";
import path from "path";

Dotenv.config();

const TOKEN_PROGRAM_ID = new anchor.web3.PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

export const SOL_PDA_ADDRESS = process.env.SOL_PDA_ADDRESS as string;
export const SOL_PDA_USDC_ATA_ADDRESS = process.env
  .SOL_PDA_USDC_ATA_ADDRESS as string;
  export const SOL_USER_USDC_ATA_ADDRESS = process.env
  .SOL_USER_USDC_ATA_ADDRESS as string;
  export const SOL_TREASURY_USDC_ATA_ADDRESS = process.env
  .SOL_TREASURY_USDC_ATA_ADDRESS as string;

const pda_address = new anchor.web3.PublicKey(SOL_PDA_ADDRESS);
const pda_ata_usdc = new anchor.web3.PublicKey(SOL_PDA_USDC_ATA_ADDRESS);
const user_ata_usdc = new anchor.web3.PublicKey(SOL_USER_USDC_ATA_ADDRESS);
const treasure_ata_usdc = new anchor.web3.PublicKey(
  SOL_TREASURY_USDC_ATA_ADDRESS
);

export const getPayer = (file: String) => {
  const rawdata = fs.readFileSync(
    // replace with your key
    path.resolve("./private/" + file + ".json")
  );
  const keyData = JSON.parse(rawdata.toString());
  return web3.Keypair.fromSecretKey(new Uint8Array(keyData));
};

async function SwapSolana(
  wallet: anchor.web3.Keypair,
  program: anchor.Program
) {
  let tx = await program.methods.swapFromSolanaUsdc(
            new anchor.BN(100000),
            new anchor.BN(100),
            {
              minEvmAmountOut: "100000",
              toEvmChainId: "97",
              toEvmAddress: "0",
              toEvmRouter: "0",
              toEvmSwapPath: "0",
              toEvmFee:"0",
              toEvmSqrtRatioX96: "0",
            }).accounts({
                tokenProgram: TOKEN_PROGRAM_ID, //1
                uerSourceTokenAccount: user_ata_usdc, //user ray
                uerDestinationTokenAccount: pda_ata_usdc, //pda usdc
                userSourceOwner: wallet.publicKey,
                treasureAta: treasure_ata_usdc,
                pdaAddress: pda_address,
              }).signers([]).rpc()
  console.log("tx: ", tx);
}

async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
  const keypairwallet = getPayer("id");
  const wallet = new anchor.Wallet(keypairwallet);

  if (!wallet.publicKey) throw new Error("No public key.");
  const provider = new anchor.AnchorProvider(connection, wallet, {
    preflightCommitment: "recent",
  });
  const programId = new anchor.web3.PublicKey(
    "AfUXdLExtYBDG6bbAZa2sKvjwnqf3odpvdTcrUiBUhv8"
  );
  const anchorProgram = new anchor.Program(
    IcrosschainSwapSolana as anchor.Idl,
    programId,
    provider
  );
  await SwapSolana(keypairwallet, anchorProgram);
}

main()
  .then(() => {
    console.log("Finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
