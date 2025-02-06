"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
	token: z.string()
	.min(32, "Address is required")
	.required("Address is required"),
	receiver: z.string()
	.min(32, "Address is required")
	.required("Address is required"),
	supply: z
		.number()
		.refine((val) => !isNaN(Number(val)), "Expected a number")
		.transform((val) => Number(val))
		.required();
});

export default function MintingForm() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const wallet = useWallet();
	const { connection } = useConnection();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			token: "",
			receiver: "",
			supply: 10,
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			setIsLoading(true);
			setError(null);
			setSuccess(null);

			const formData = new FormData();
			formData.append("mintPubKey", values.token);
			formData.append("receiver", values.receiver);
			formData.append("amount", values.supply.toString());

			const publicKey = wallet.publicKey?.toBase58();

			if (!publicKey) {
				throw new Error("Wallet not connected");
			}

			formData.append("sender", publicKey);

			console.log("formData", formData);

			const response = await axios.post("/api/mint-token", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			const data = response.data;
			form.reset();

			if (response.status !== 200) {
				throw new Error(data.error || "Failed to mint token");
			}

			const { serializedTransaction, lastValidBlockHeight } = data;

			const transaction = Transaction.from(
				Buffer.from(serializedTransaction, "base64")
			);

			if (!wallet.signTransaction) {
				throw new Error("Wallet does not support transaction signing");
			}

			const signedTransaction = await wallet.signTransaction(transaction);

			const rawTx = signedTransaction.serialize();
			const signature = await connection.sendRawTransaction(rawTx);

			await connection.confirmTransaction({
				signature,
				blockhash: transaction.recentBlockhash!,
				lastValidBlockHeight,
			});

			setSuccess(
				`
                Token transferred successfully!
                Transaction signature: ${signature}
                `
			);

			form.reset();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to create token"
			);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="w-full max-w-2xl mx-auto p-6">
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-6"
				>
					{error && (
						<Alert
							variant="destructive"
							className="overflow-x-scroll my-4"
						>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					{success && (
						<Alert className="overflow-x-scroll my-4">
							<AlertDescription>{success}</AlertDescription>
						</Alert>
					)}

					<FormField
						control={form.control}
						name="token"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Enter Token Address</FormLabel>
								<FormControl>
									<Input
										placeholder={`${wallet.publicKey?.toBase58().toString()}`}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="receiver"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Enter Receiver's Wallet Address
								</FormLabel>
								<FormControl>
									<Input
										placeholder="Ht544a2e7i6EWmVbA7Njo1eii7Z6382nSrqeUwDEz21"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="supply"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Minting Amount</FormLabel>
								<FormControl>
									<Input
										type="number"
										placeholder="1000"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button
						type="submit"
						className="w-full py-6 text-lg font-semibold"
						disabled={isLoading}
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Creating Token...
							</>
						) : (
							"Create Token"
						)}
					</Button>
				</form>
			</Form>
		</div>
	);
}
