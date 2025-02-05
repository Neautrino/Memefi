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
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
	token: z.string(),
	receiver: z.string(),
	supply: z
		.string()
		.refine((val) => !isNaN(Number(val)), "Expected a number")
		.transform((val) => Number(val)),
});

export default function TokenForm() {
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
            formData.append("token", values.token);
            formData.append("receiver", values.receiver);
            formData.append("supply", values.supply.toString());

			const publicKey = wallet.publicKey?.toBase58();

			if (!publicKey) {
				throw new Error("Wallet not connected");
			}

			formData.append("publicKey", publicKey);

			const response = await axios.post("/api/create-token", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			const data = response.data;

			if (response.status !== 200) {
				throw new Error(data.error || "Failed to create token");
			}

			const {
				serializedTransaction,
				tokenAddress,
				lastValidBlockHeight,
			} = data;

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

			console.log("Token address: ", tokenAddress);
			console.log("Signature: ", signature);

			setSuccess(
				`Token created successfully! Address: ${tokenAddress} with Signature: ${signature}`
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
							className="overflow-x-scroll"
						>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					{success && (
						<Alert className="overflow-x-scroll">
							<AlertDescription>{success}</AlertDescription>
						</Alert>
					)}

					<div className="grid grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input
											placeholder="My Token"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="symbol"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Symbol</FormLabel>
									<FormControl>
										<Input
											placeholder="TKN"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="grid grid-cols-3 gap-4">
						<FormField
							control={form.control}
							name="initialSupply"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Initial Token Supply</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="1000000"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="totalSupply"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Total Token Supply</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="1000000"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="decimals"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Decimals</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="6"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Description</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Token description"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="image"
						render={({ field: { onChange, value, ...field } }) => (
							<FormItem>
								<FormLabel>Token Image</FormLabel>
								<FormControl>
									<Input
										type="file"
										accept={ACCEPTED_IMAGE_TYPES.join(",")}
										onChange={(e) =>
											onChange(e.target.files)
										}
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
