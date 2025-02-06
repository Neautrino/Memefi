import {
	createMintToCheckedInstruction,
	getMint,
	getTokenMetadata,
    TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
	Connection,
	clusterApiUrl,
	PublicKey,
	Transaction,
} from "@solana/web3.js";
import { NextRequest } from "next/server";
import { getOrCreateAssociatedTokenAccountTx } from "./create-ata";

const connection = new Connection(clusterApiUrl("devnet"));

export async function mintToken(
	mintPubKey: string,
	payer: string,
	owner: string,
	amount: number
) {

	const mintPublickey = new PublicKey(mintPubKey);

	const mintInfo = await getMint(connection, mintPublickey, undefined, TOKEN_2022_PROGRAM_ID);
	const totalMintAmount = BigInt(amount * 10 ** mintInfo.decimals);

	const metadata = await getTokenMetadata(connection, mintPublickey);
	const maxSupplyEntry = metadata?.additionalMetadata.find(
		([key]) => key === "maxSupply"
	);
	const maxSupply = maxSupplyEntry ? Number(maxSupplyEntry[1]) : null;
	const currentSupply = BigInt(mintInfo.supply);

	
	if (
		maxSupply &&
		currentSupply + totalMintAmount >
			BigInt(maxSupply * 10 ** mintInfo.decimals)
	) {
		throw new Error("Exceeds max supply");
	}

	const payerPubkey = new PublicKey(payer);
	const ownerPubkey = new PublicKey(owner);

	const { serializedTx, associatedToken } =
		await getOrCreateAssociatedTokenAccountTx(
			connection,
			payerPubkey,
			mintPublickey,
			ownerPubkey,
			false,
			undefined,
			TOKEN_2022_PROGRAM_ID,
		);

	const tx = Transaction.from(Buffer.from(serializedTx, "base64"));

	tx.add(
		createMintToCheckedInstruction(
            mintPublickey,
			associatedToken,
            payerPubkey,
			totalMintAmount,
			mintInfo.decimals,
            [],
            TOKEN_2022_PROGRAM_ID
		)
	);

		const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
		tx.recentBlockhash = blockhash;
		tx.lastValidBlockHeight = lastValidBlockHeight;
		tx.feePayer = payerPubkey;


	const serializedTransaction = tx
		.serialize({ requireAllSignatures: false })
		.toString("base64");

	return { serializedTransaction, associatedToken, lastValidBlockHeight };
}

export async function POST(request: NextRequest) {
	const body = await request.formData();

	const senderPublicKey = body.get("sender") as string;
	const receiverPublicKey = body.get("receiver") as string;
	const amount = parseInt( body.get("amount") as string);
	const mintPubkey = body.get("mintPubKey") as string;

	try {
		const { serializedTransaction, associatedToken, lastValidBlockHeight } = await mintToken(
			mintPubkey,
			senderPublicKey,
			receiverPublicKey,
			amount
		);

		return new Response(
			JSON.stringify({
				tokenATA: associatedToken,
				serializedTransaction,
				lastValidBlockHeight
			}),
			{
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (error: any) {
		return new Response(JSON.stringify({ error: error.message }), {
			headers: { "Content-Type": "application/json" },
		});
	}
}
