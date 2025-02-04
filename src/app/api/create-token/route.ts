import { createInitializeMetadataPointerInstruction, createInitializeMintInstruction, ExtensionType, getMintLen, LENGTH_SIZE, TOKEN_2022_PROGRAM_ID, TYPE_SIZE } from "@solana/spl-token";
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import { clusterApiUrl, Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { NextRequest } from "next/server";
import { PinataSDK } from "pinata-web3";
import bs58 from "bs58";

const connection = new Connection(clusterApiUrl("devnet"));
const pinataGateway = process.env.PINATA_GATEWAY;

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: pinataGateway!,
});

async function uploadImageToPinata(file: File) {

    const existingGroups = await pinata.groups.list();
    let group = existingGroups.find(g => g.name === "Token Launchpad Images");

    if (!group) {
        group = await pinata.groups.create({ name: "Token Launchpad Images" });
    }

    const upload = await pinata.upload .file(file)
    .addMetadata({
      name: file.name,
      keyValues: {
        folder: "token-images"
      },
    })
    .cidVersion(1)
    .group(group.id);

    return `https://${pinataGateway}/ipfs/${upload.IpfsHash}`;
}

async function uploadMetadataToPinata(name: string, symbol: string, description: string, imageUrl: string) {
    const metadata = {
        name,
        symbol,
        image: imageUrl,
        description
    };

    // Check if the group exists
    const existingGroups = await pinata.groups.list();
    let group = existingGroups.find(g => g.name === "Token Launchpad JSON");

    if (!group) {
        group = await pinata.groups.create({ name: "Token Launchpad JSON" });
    }

    const upload = await pinata.upload.json(metadata)
    .addMetadata({
        name,
    })
    .group(group.id)
    .cidVersion(1)

    return { metadataUrl: `https://${pinataGateway}/ipfs/${upload.IpfsHash}` };
}

export async function POST(request: NextRequest) {
    const body = await request.formData();
    
    const name = body.get("name") as string;
    const symbol = body.get("symbol") as string;
    const description = body.get("description") as string;
    const imageFile = body.get("image") as File;
    const privateKey = body.get("privateKey") as string;
    const walletPublicKey = new PublicKey(body.get("publicKey") as string);

    const payer = Keypair.fromSecretKey(bs58.decode(privateKey));

    if (!name || !symbol || !description || !imageFile) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const imageUrl = await uploadImageToPinata(imageFile);
        const pinataResponse = await uploadMetadataToPinata(name, symbol, description, imageUrl);
        
        const tokenKeyPair = Keypair.generate();
        const tokenMetaData = {
            mint: tokenKeyPair.publicKey,
            name,
            symbol,
            uri: pinataResponse.metadataUrl,
            additionalMetadata: [],
        };

        const tokenLen = getMintLen([ExtensionType.MetadataPointer]);
        const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(tokenMetaData).length;

        const tokenRent = await connection.getMinimumBalanceForRentExemption(tokenLen + metadataLen);

        const transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: walletPublicKey,
                newAccountPubkey: tokenKeyPair.publicKey,
                space: tokenLen,
                lamports: tokenRent,
                programId: TOKEN_2022_PROGRAM_ID,
            }),
            createInitializeMintInstruction(
                tokenKeyPair.publicKey,
                9,
                walletPublicKey,
                walletPublicKey,
                TOKEN_2022_PROGRAM_ID
            ),
            createInitializeMetadataPointerInstruction(
                tokenKeyPair.publicKey,
                walletPublicKey,
                tokenKeyPair.publicKey,
                TOKEN_2022_PROGRAM_ID
            ),
            createInitializeInstruction({
                programId: TOKEN_2022_PROGRAM_ID,
                mint: tokenKeyPair.publicKey,
                metadata: tokenKeyPair.publicKey,
                name: tokenMetaData.name,
                symbol: tokenMetaData.symbol,
                uri: tokenMetaData.uri,
                mintAuthority: walletPublicKey,
                updateAuthority: walletPublicKey,
            })
        );
        
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = walletPublicKey;

        // partial sign
        transaction.partialSign(tokenKeyPair);

        // serialize to send to frontend
        const serializedTransaction = transaction.serialize({
            requireAllSignatures: false
        });

        return new Response(JSON.stringify({
            serializedTransaction: serializedTransaction.toString('base64'),
            tokenAddress: tokenKeyPair.publicKey.toString(),
            mint: tokenKeyPair.publicKey.toString()
        }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
