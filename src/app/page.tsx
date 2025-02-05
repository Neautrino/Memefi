"use client";

import React from "react";
import dynamic from "next/dynamic";
import TokenForm from "./(home)/TokenForm";

const WalletMultiButton = dynamic(
	() =>
		import("@solana/wallet-adapter-react-ui").then(
			(mod) => mod.WalletMultiButton
		),
	{ ssr: false }
);
const Providers = dynamic(() => import("./Providers"), { ssr: false });

function page() {
	return (
		<Providers>
			<div className="relative w-full min-h-screen font-sans flex flex-col items-center justify-center p-8">
				<div className="absolute top-0 right-0 p-12 flex items-center justify-between w-full">
					<h2 className="text-3xl italic font-mono font-extrabold">@Memefi</h2>
					<h1 className="text-3xl font-bold  text-center">
						Launch Your MemeCoin Now
					</h1>
					<WalletMultiButton />
				</div>
				<TokenForm />
			</div>
		</Providers>
	);
}

export default page;
