// /api/premium-sse.ts
import { client } from "@/sanity/lib/client";

let clients: Array<ReadableStreamDefaultController<string>> = [];
const expiredEmails = new Set<string>();

const sendToClients = (data: { email: string; expired: true }) => {
  const jsonData = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach((controller) => {
    try {
      controller.enqueue(jsonData);
    } catch (err) {
      console.error("SSE enqueue error:", err);
    }
  });
};

// **Run expiration check immediately**
const checkExpiredPremiumUsers = async () => {
  console.log("[SSE] Checking expired users...");
  const now = new Date().toISOString();
  const expiredUsers = await client.fetch(
    `*[_type == "premiumUser" && premiumEnd <= $now]`,
    { now }
  );

  console.log("[SSE] Found expired users:", expiredUsers.length);

  for (const user of expiredUsers) {
    const emailLower = user.email.toLowerCase();
    if (expiredEmails.has(emailLower)) continue;

    const alreadyExpired: { email: string }[] = await client.fetch(
      `*[_type == "premiumEndedUser" && lower(email) == $email]`,
      { email: emailLower }
    );

    if (alreadyExpired.length > 0) {
      expiredEmails.add(emailLower);
      continue;
    }

    // Move user to expired schema
    await client.create({
      _type: "premium_ends",
      email: user.email,
      name: user.name || null,
      premiumStart: user.premiumStart || null,
      premiumEnd: user.premiumEnd || null,
      payments: user.payments || [],
      movedAt: new Date().toISOString(),
    });

    await client.delete(user._id);

    expiredEmails.add(emailLower);
    console.log("[SSE] Moved expired user:", user.email);

    // Notify SSE clients
    sendToClients({ email: user.email, expired: true });
  }
};

export async function GET() {
  const stream = new ReadableStream<string>({
    start(controller) {
      clients.push(controller);
      controller.enqueue(": connected\n\n");

      // Ping every 15s to keep connection alive
      const pingInterval = setInterval(() => controller.enqueue(": ping\n\n"), 15000);

      // **Run expiration check immediately**
      checkExpiredPremiumUsers().catch(console.error);

      return () => {
        clearInterval(pingInterval);
        clients = clients.filter((c) => c !== controller);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
