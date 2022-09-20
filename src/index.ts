import web3 = require("@solana/web3.js");
import anchor = require("@project-serum/anchor");
import fs from "fs";
import Dotenv from "dotenv";
import IcrosschainSwapSolana from "./smartcontract.json"
import path from "path"

Dotenv.config();

const receiver_ata_usdc = new anchor.web3.PublicKey(
    "6xsfJFLvRZywAtQf6kTqcQFiRPJ7nybpgBgacUioC5fB"
  ); //usdc destionation ata
  const pda_ata_usdc = new anchor.web3.PublicKey(
    "FJSnBX6xi2dpqMgZ6mcgtEG2WD2kmFtSS8NjS93jqR5V"
  );
  const pda_ata_ray = new anchor.web3.PublicKey(
    "GgSUeWbmJ49C65mdNrcPUrkXU871PDAr8gswEY31Pxrg"
  );
  const ray_mint_address = new anchor.web3.PublicKey(
    "FSRvxBNrQWX2Fy2qvKMLL3ryEdRtE3PUTZBcdKwASZTU"
  );
  const deployer_ata_ray = new anchor.web3.PublicKey(
    "GnyLkKfU3fg1c4cUVMCpttAdA52hNgaNoM2K4ZBBNBQS"
  );
  const receive_ata_ray = new anchor.web3.PublicKey(
    "Bch9yCgL4RHQURsguLjFvHZzgqowBBLsBjpW3LJLSvBf"
  );
  const user_ata_ray = new anchor.web3.PublicKey(
    "G8QVGAH5JHmBEgrCjMyMuHK4je9XmYD9L8YnviyehHJh"
  );
  const user_ata_usdc = new anchor.web3.PublicKey(
    "9j8LLJpmm28tCGKnRV42H5HPz6NyP9v25kipxETQghN8"
  );
  const treasure_ata_ray = new anchor.web3.PublicKey(
    "8fLvkHH63PeyaJoC7aJEZUpMnnj34wJ8EUA1crUHEoiK"
  );
  const treasure_ata_usdc = new anchor.web3.PublicKey(
    "GggZiqA8ToJQ4pPm3n1rQ5sFSmvb6MpPTsjLnruaH9nq"
  );
  const usdc_mint_address = new anchor.web3.PublicKey(
    "BEcGFQK1T1tSu3kvHC17cyCkQ5dvXqAJ7ExB2bb5Do7a"
  );

// initialize keypair
async function initializeKeypair(connection: web3.Connection): Promise<web3.Keypair> {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        console.log("creating .env file ...");
        const signer = web3.Keypair.generate();
        fs.writeFileSync(".env", `PRIVATE_KEY=[${signer.secretKey.toString()}]`);
        // airdrop some sol
        airdropSol(signer, connection);
        return signer;
    }

    const secret = JSON.parse(privateKey ?? "") as number[];
    const keypairFromSecret = web3.Keypair.fromSecretKey(Uint8Array.from(secret));
    //airdrop
    await airdropSol(keypairFromSecret, connection);
    return keypairFromSecret;
}

// airdrop sol
async function airdropSol(signer: web3.Keypair, connection: web3.Connection) {
    let balance = await connection.getBalance(signer.publicKey);
    console.log("💰 current balance: ", balance / web3.LAMPORTS_PER_SOL);

    if (balance / web3.LAMPORTS_PER_SOL < 1) {
        console.log("🛬 airdropping 1 sol ...");
        const airdropSign = await connection.requestAirdrop(signer.publicKey, web3.LAMPORTS_PER_SOL);

        const latestBlockHash = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: airdropSign,
        });

        balance = await connection.getBalance(signer.publicKey);
        console.log("💰 new balance ", balance / web3.LAMPORTS_PER_SOL);
    }
}
// create transfer function
async function transferSolToAccount(
    payer: web3.Keypair,
    receiver: web3.Keypair,
    amount: number,
    conn: web3.Connection,
) {
    //some checks before transaction
    const payerBalance = await conn.getBalance(payer.publicKey);
    if (payerBalance / web3.LAMPORTS_PER_SOL < amount) {
        const msg = `not enough account balance...\nCurrent Balance: ${payerBalance}\nRequested Amount: ${amount}`;
        throw new Error(msg);
    }
    if (amount <= 0) {
        const msg = `amount should be greater than 0\nRequested Amount: ${amount}`;
        throw new Error(msg);
    }
    // create transation
    let currentBalance = await conn.getBalance(receiver.publicKey);
    console.log(
        `\n🚀 Initializing transaction...\n📤 Sending ${amount} to: ${receiver.publicKey}\n💰 Current Balance: ${currentBalance}`,
    );

    const tx = new web3.Transaction();
    tx.add(
        web3.SystemProgram.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: receiver.publicKey,
            lamports: amount * web3.LAMPORTS_PER_SOL,
        }),
    );

    //sign and confirm transaction
    console.log("📜 Verifying transaction...");
    const sign = await web3.sendAndConfirmTransaction(conn, tx, [payer]);
    //view transaction signature on etherscan
    currentBalance = await conn.getBalance(receiver.publicKey);
    console.log(`💰 New Balance: ${currentBalance / web3.LAMPORTS_PER_SOL}`);
    console.log(
        `\n🎉 view this transaction on the Solana Explorer at:\nhttps://explorer.solana.com/tx/${sign}?cluster=devnet`,
    );
}
export const getPayer = (file: String) => {
    const rawdata = fs.readFileSync(
      // replace with your key
      path.resolve("/home/datpham/.config/solana/" + file + ".json")
    );
    const keyData = JSON.parse(rawdata.toString());
    return web3.Keypair.fromSecretKey(new Uint8Array(keyData));
  };
async function main() {
    const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
    const payer = await initializeKeypair(connection);
    const receiver = web3.Keypair.generate();
    const keypairwallet = getPayer("id")
    // console.log(keypairwallet)
    const wallet = new anchor.Wallet(keypairwallet);
  const anchorWallet = {
    publicKey: wallet.publicKey,
    signAllTransactions: wallet.signAllTransactions,
    signTransaction: wallet.signTransaction,
  } as any;
  if (!wallet.publicKey) throw new Error("No public key.");

  const provider = new anchor.AnchorProvider(connection, anchorWallet, {
    preflightCommitment: "recent",
  });
  const programId = new anchor.web3.PublicKey(
    "AfUXdLExtYBDG6bbAZa2sKvjwnqf3odpvdTcrUiBUhv8"
  );
  const anchorProgram = new anchor.Program(IcrosschainSwapSolana as anchor.Idl, programId, provider);
  console.log("ok")
  const res = await anchorProgram.rpc.swapSolana(
    new anchor.BN(100000),
    new anchor.BN(100),
    new anchor.BN(4),
    {
      accounts: {
        poolProgramId: new anchor.web3.PublicKey(
          "9rpQHSyFVM1dkkHFQ2TtTzPEW7DVmEyPmN8wVniqJtuC"
        ), //raydium program
        tokenProgram: new anchor.web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), //1
        ammId: new anchor.web3.PublicKey("HeD1cekRWUNR25dcvW8c9bAHeKbr1r7qKEhv7pEegr4f"), //2
        ammAuthority: new anchor.web3.PublicKey(
          "DhVpojXMTbZMuTaCgiiaFU7U8GvEEhnYo4G9BUdiEYGh"
        ), //3
        ammOpenOrders: new anchor.web3.PublicKey(
          "HboQAt9BXyejnh6SzdDNTx4WELMtRRPCr7pRSLpAW7Eq"
        ), //4
        atoOrMda: new anchor.web3.PublicKey(
          "6TzAjFPVZVMjbET8vUSk35J9U2dEWFCrnbHogsejRE5h"
        ), //5
        poolCoinTokenAccount: new anchor.web3.PublicKey(
          "3qbeXHwh9Sz4zabJxbxvYGJc57DZHrFgYMCWnaeNJENT"
        ), //6 ray
        poolPcTokenAccount: new anchor.web3.PublicKey(
          "FrGPG5D4JZVF5ger7xSChFVFL8M9kACJckzyCz8tVowz"
        ), //7 usdc
        serumProgramId: new anchor.web3.PublicKey(
          "DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY"
        ), //8 Serum DEX V3
        serumMarket: new anchor.web3.PublicKey(
          "3tsrPhKrWHWMB8RiPaqNxJ8GnBhZnDqL4wcu5EAMFeBe"
        ),
        serumBids: new anchor.web3.PublicKey(
          "ANHHchetdZVZBuwKWgz8RSfVgCDsRpW9i2BNWrmG9Jh9"
        ),
        serumAsks: new anchor.web3.PublicKey(
          "ESSri17GNbVttqrp7hrjuXtxuTcCqytnrMkEqr29gMGr"
        ),
        serumEventQueue: new anchor.web3.PublicKey(
          "FGAW7QqNJGFyhakh5jPzGowSb8UqcSJ95ZmySeBgmVwt"
        ),

        serumCoinVaultAccount: new anchor.web3.PublicKey(
          "E1E5kQqWXkXbaqVzpY5P2EQUSi8PNAHdCnqsj3mPWSjG"
        ),
        serumPcVaultAccount: new anchor.web3.PublicKey(
          "3sj6Dsw8fr8MseXpCnvuCSczR8mQjCWNyWDC5cAfEuTq"
        ),
        serumVaultSigner: new anchor.web3.PublicKey(
          "C2fDkZJqHH5PXyQ7UWBNZsmu6vDXxrEbb9Ex9KF7XsAE"
        ),

        uerSourceTokenAccount: user_ata_ray, //Ray ata source
        uerDestinationTokenAccount: user_ata_usdc, //usec ata destination
        // userSourceOwner: wallet.publicKey,
        userSourceOwner: new anchor.web3.PublicKey("C3qKZuPgdyGdnCSwj5QYjrAVkv6zRiUvKCZRziXnendA"),
        treasureAta: treasure_ata_ray,
        tokenMint: ray_mint_address,
        pdaAddress: new anchor.web3.PublicKey("7pnMk37vHxEFFTDGU3ewd3vwPLiBgt3wku2LxSAqWTio"),
      },
      signers: [anchorWallet],
    }
  );
                console.log("res :", res)
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
