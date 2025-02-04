'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import TokenForm from './(home)/TokenForm';
 
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);
const Providers = dynamic(
  () => import('./Providers'),
  { ssr: false }
);

function page() {
  return (
    <Providers>
      <WalletMultiButton />
      <div className='max-w-[60%] mx-auto'>
        <TokenForm />
      </div>
    </Providers>
  )
}

export default page