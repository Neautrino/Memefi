export async function GET() {
    console.log("Health check Successful");
    return new Response("OK", {
        headers: { "Content-Type": "text/plain" },
    });
}