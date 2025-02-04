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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import axios from "axios";

const formSchema = z.object({
	name: z.string().nonempty(),
  symbol: z.string().nonempty(),
  decimals: z.number().int().positive(),
  totalSupply: z.number().int().positive(),
  initialSupply: z.number().int().positive(),
  mintAuthority: z.string().nonempty(),
  freezeAuthority: z.string().nonempty()
});

export default function TokenForm() {

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      symbol: "",
      decimals: 0,
      totalSupply: 0,
      initialSupply: 0,
      mintAuthority: "",
      freezeAuthority: ""
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="space-y-8"
			>
				<div className="flex gap-4">
        <FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input
									placeholder="shadcn"
									{...field}
								/>
							</FormControl>
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
                  placeholder="SHAD"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        </div>
        <div className="flex gap-4">
        <FormField
          control={form.control}
          name="decimals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Decimals</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                    onChange={e => field.onChange(parseInt(e.target.value))}
                    value={field.value}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="totalSupply"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Supply</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={e => field.onChange(parseInt(e.target.value))}
                  value={field.value}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="initialSupply"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initial Supply</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                    onChange={e => field.onChange(parseInt(e.target.value))}
                    value={field.value}
                />
              </FormControl>
            </FormItem>
          )}
        />
        </div>
        <div className="flex gap-4">
        <FormField
          control={form.control}
          name="mintAuthority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mint Authority</FormLabel>
              <FormControl>
                <Input
                  placeholder="mint authority"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="freezeAuthority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Freeze Authority</FormLabel>
              <FormControl>
                <Input
                  placeholder="freeze authority"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}

        />
        </div>        
				<Button type="submit">Submit</Button>
			</form>
		</Form>
	);
}
