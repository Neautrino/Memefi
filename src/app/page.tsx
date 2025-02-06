"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import TokenForm from "./(home)/TokenForm";
import Sidebar from "./(home)/Sidebar";
import MintingForm from "./(home)/MintingForm";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);
const Providers = dynamic(() => import("./Providers"), { ssr: false });


function Page() {
	const [activePage, setActivePage] = useState("token");

  return (
    <Providers>
      <div className="flex min-h-screen">
        <div className="fixed left-0 top-0 h-full w-48 bg-gray-50 dark:bg-neutral-900">
          <div className="p-8 mt-2 text-center">
            <h2 className="text-3xl italic font-mono font-extrabold">@Memefi</h2>
          </div>
          <Sidebar activePage={activePage} onPageChange={setActivePage} />
        </div>

        <div className="flex-1 ml-48">
          <header className=" p-8 flex justify-around items-center border-b">
            <h1 className="text-3xl font-bold">
              Launch Your MemeCoin Now
            </h1>
            <WalletMultiButton className="bg-black" />
          </header>

          <main className="p-8">
            <div className="max-w-4xl ml-8">
              {activePage === "token" && <TokenForm />}
              {activePage === "mint" && <MintingForm />}
            </div>
          </main>
        </div>
      </div>
    </Providers>
  );
}

export default Page;