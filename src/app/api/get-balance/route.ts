import {
	Connection,
	clusterApiUrl,
	PublicKey,
	LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { NextRequest } from "next/server";
const connection = new Connection(clusterApiUrl("devnet"));

export async function POST(request: NextRequest) {
	try {
		const { publicKey } = await request.json();
	
		const balanceLamports = await connection.getBalance(
			new PublicKey(publicKey)
		);

		const balanceSOL = parseFloat((balanceLamports / LAMPORTS_PER_SOL).toFixed(9));

		return new Response(JSON.stringify({ balance:balanceSOL }), {
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
		return new Response(JSON.stringify({ error: errorMessage }), {
			headers: { 'Content-Type': 'application/json' },
		});
	}
}