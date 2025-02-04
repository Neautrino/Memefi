// import { createMint } from "@solana/spl-token";
// import {
// 	Connection,
// 	clusterApiUrl,
// 	Keypair,
// } from "@solana/web3.js";
// import { NextRequest } from "next/server";
// import bs58 from "bs58";


// const connection = new Connection(clusterApiUrl("devnet"));

// export async function POST(request: NextRequest) {
// 	const body = await request.json();

// 	const payer = Keypair.fromSecretKey(bs58.decode(body.privateKey as string));
// 	const mintAuthority = payer;

// 	try {
// 		const mintPubKey = await createMint(
// 			connection,
// 			payer,
// 			mintAuthority.publicKey,
// 			null,
// 			9
// 		);

// 		console.log("Mint Created: ", mintPubKey.toBase58());


// 		return new Response(JSON.stringify({ mintPubKey }), {
// 			headers: { "Content-Type": "application/json" },
// 		});
// 	} catch (error: any) {
// 		return new Response(JSON.stringify({ error: error.message }), {
// 			headers: { "Content-Type": "application/json" },
// 		});
// 	}
// }


import axios from "axios";
import { createMint } from "@solana/spl-token";
import {
    Connection,
    clusterApiUrl,
    Keypair,
} from "@solana/web3.js";
import { NextRequest } from "next/server";
import bs58 from "bs58";

const connection = new Connection(clusterApiUrl("devnet"));
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

async function uploadToPinata(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const pinataMetadata = JSON.stringify({ name: file.name });
    formData.append("pinataMetadata", pinataMetadata);

    const options = JSON.stringify({ cidVersion: 1 });
    formData.append("pinataOptions", options);

    const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: {
            "Content-Type": `multipart/form-data; boundary=${(formData as any)._boundary}`,
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
    });

    return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
}

async function uploadMetadataToPinata(name: string, symbol: string, imageUrl: string) {
    const metadata = {
        name,
        symbol,
        image: imageUrl,
        description: "Token created via Solana Launchpad",
    };

    const response = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
        headers: {
            "Content-Type": "application/json",
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
    });

    return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
}

export async function POST(request: NextRequest) {
    const body = await request.formData();
    
    const name = body.get("name") as string;
    const symbol = body.get("symbol") as string;
    const privateKey = body.get("privateKey") as string;
    const imageFile = body.get("image") as File;

    // if (!name || !symbol || !privateKey || !imageFile) {
    //     return new Response(JSON.stringify({ error: "Missing required fields" }), {
    //         headers: { "Content-Type": "application/json" },
    //     });
    // }

	console.log(name, symbol, privateKey, imageFile);

    const payer = Keypair.fromSecretKey(bs58.decode(privateKey));
    const mintAuthority = payer;

    try {
        // Upload image and metadata to Pinata
        const imageUrl = await uploadToPinata(imageFile);
        const metadataUri = await uploadMetadataToPinata(name, symbol, imageUrl);

        // Create token mint
        // const mintPubKey = await createMint(
        //     connection,
        //     payer,
        //     mintAuthority.publicKey,
        //     null,
        //     9
        // );

        // console.log("Mint Created: ", mintPubKey.toBase58());
        // console.log("Metadata URI: ", metadataUri);

        // return new Response(JSON.stringify({ mintPubKey: mintPubKey.toBase58(), metadataUri }), {
        //     headers: { "Content-Type": "application/json" },
        // });

		return new Response(JSON.stringify({ imageUrl, metadataUri }), {
			headers: { "Content-Type": "application/json" },
		});
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
        });
    }
}
