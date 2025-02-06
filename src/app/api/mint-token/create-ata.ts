import {
    Connection,
    PublicKey,
    Transaction,
    Commitment
} from "@solana/web3.js";
import {
    getAssociatedTokenAddressSync,
    getAccount,
    createAssociatedTokenAccountInstruction,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TokenAccountNotFoundError,
    TokenInvalidAccountOwnerError
} from "@solana/spl-token";

export async function getOrCreateAssociatedTokenAccountTx(
    connection: Connection,
    payer: PublicKey,
    mint: PublicKey,
    owner: PublicKey,
    allowOwnerOffCurve = false,
    commitment?: Commitment,
    programId = TOKEN_PROGRAM_ID,
    associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID,
): Promise<{ serializedTx: string, associatedToken: PublicKey }> {
    const associatedToken = getAssociatedTokenAddressSync(
        mint,
        owner,
        allowOwnerOffCurve,
        programId,
        associatedTokenProgramId,
    );

    try {
        // Check if account exists
        await getAccount(connection, associatedToken, commitment, programId);
    } catch (error: unknown) {
        if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
            const transaction = new Transaction().add(
                createAssociatedTokenAccountInstruction(
                    payer,
                    associatedToken,
                    owner,
                    mint,
                    programId,
                    associatedTokenProgramId,
                )
            );

            const { blockhash } = await connection.getLatestBlockhash(commitment);
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = payer;

            // Serialize the transaction to base64
            const serializedTx = transaction.serialize({ requireAllSignatures: false }).toString("base64");

            return { serializedTx, associatedToken };
        } else {
            throw error;
        }
    }

    return { serializedTx: "", associatedToken };
}
