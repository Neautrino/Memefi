import { createMint, getOrCreateAssociatedTokenAccount, mintToChecked } from "@solana/spl-token";
import {
	Connection,
	clusterApiUrl,
	Keypair,
    PublicKey,
    LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { NextRequest } from "next/server";
import bs58 from "bs58";


const connection = new Connection(clusterApiUrl("devnet"));

export async function POST(request: NextRequest) {
	const body = await request.json();

	const payer = Keypair.fromSecretKey(bs58.decode(body.privateKey as string));
    const mintPubkey = new PublicKey(
        body.mintPubKey
    );

	try {
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            mintPubkey,
            new PublicKey(body.publicKey),
        );

        const tokenAccountAddress = tokenAccount.address;
        const tokenAccountPubkey = new PublicKey(tokenAccountAddress);

        const txhash = await mintToChecked(
            connection, // connection
            payer, // fee payer
            mintPubkey, // mint
            tokenAccountPubkey, // receiver (should be a token account)
            payer, // mint authority
            1e9, // amount. if your decimals is 8, you mint 10^8 for 1 token.
            9, // decimals
        );

        const tokenAmount = (await connection.getTokenAccountBalance(new PublicKey(tokenAccountAddress))).value.amount;
        

		return new Response(JSON.stringify( {"tokenATA" :tokenAccountAddress, "amount": tokenAmount, "txhash": txhash} ), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error: any) {
		return new Response(JSON.stringify({ error: error.message }), {
			headers: { "Content-Type": "application/json" },
		});
	}
}
