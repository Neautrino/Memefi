import {
	Connection,
	LAMPORTS_PER_SOL,
	clusterApiUrl,
	PublicKey,
} from "@solana/web3.js";
import { NextRequest } from "next/server";
const connection = new Connection(clusterApiUrl("devnet"));

export async function POST(request: NextRequest) {
	const body = await request.json();

	try {
		const airdropSignature = await connection.requestAirdrop(
			new PublicKey(body.publicKey),
			body.amount * LAMPORTS_PER_SOL
		);

		const { value } = await connection.getSignatureStatuses([airdropSignature]);

		if(value === null) {
			throw new Error('Airdrop failed');
		}
	
		console.log(value);
	
		return new Response(JSON.stringify({ value }), {
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error ) {
		const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
		return new Response(JSON.stringify({ error:errorMessage }), {
			headers: { 'Content-Type': 'application/json' },
		});
	}

    
}
