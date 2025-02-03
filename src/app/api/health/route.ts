import { NextRequest } from "next/server";

export async function GET(_request: NextRequest) {
    console.log("Health check Successful");
    return new Response("OK", {
        headers: { "Content-Type": "text/plain" },
    });
}