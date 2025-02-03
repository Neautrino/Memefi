import { createMint } from "@solana/spl-token";
import {
	Connection,
	clusterApiUrl,
	Keypair,
} from "@solana/web3.js";
import { NextRequest } from "next/server";
import bs58 from "bs58";


const connection = new Connection(clusterApiUrl("devnet"));

export async function POST(request: NextRequest) {
	const body = await request.json();

	const payer = Keypair.fromSecretKey(bs58.decode(body.privateKey as string));
	const mintAuthority = payer;

	try {
		const mintPubKey = await createMint(
			connection,
			payer,
			mintAuthority.publicKey,
			null,
			9
		);

		console.log("Mint Created: ", mintPubKey.toBase58());


		return new Response(JSON.stringify({ mintPubKey }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error: any) {
		return new Response(JSON.stringify({ error: error.message }), {
			headers: { "Content-Type": "application/json" },
		});
	}
}
