import { client } from "@/sanity/lib/client";

interface PremiumUser {
  _id: string;
  email: string;
  name?: string;
  premiumStart?: string;
  premiumEnd?: string;
  payments?:[];
}

interface ExpiredUserNotification {
  email: string;
  expired: true;
}

// Store connected SSE clients
let clients: Array<ReadableStreamDefaultController<string>> = [];
const expiredEmails = new Set<string>(); // Track already-expired users

const sendToClients = (data: ExpiredUserNotification) => {
  const jsonData = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach((controller) => {
    try {
      controller.enqueue(jsonData);
    } catch (err) {
      console.error("Error writing to SSE client:", err);
    }
  });
};

// Function to check expired premium users
const checkExpiredPremiumUsers = async () => {
  const now = new Date().toISOString();

  // Fetch all expired premium users
  const expiredUsers: PremiumUser[] = await client.fetch(
    `*[_type == "premiumUser" && datetime(premiumEnd) <= $now]`,
    { now }
  );

  for (const user of expiredUsers) {
    const emailLower = user.email.toLowerCase();

    // Skip if already expired in memory
    if (expiredEmails.has(emailLower)) continue;

    // Double-check in Sanity if already moved
    const alreadyExpired: { email: string }[] = await client.fetch(
      `*[_type == "premiumEndedUser" && lower(email) == $email]`,
      { email: emailLower }
    );
    if (alreadyExpired.length > 0) {
      expiredEmails.add(emailLower);
      continue;
    }

    // Move user to expired
    await client.create({
      _type: "premiumEndedUser",
      email: user.email,
      name: user.name || null,
      premiumStart: user.premiumStart || null,
      premiumEnd: user.premiumEnd || null,
      payments: user.payments || [],
      movedAt: new Date().toISOString(),
    });

    // Delete from active premium
    await client.delete(user._id);

    // Mark as expired in memory
    expiredEmails.add(emailLower);

    // Notify SSE clients
    sendToClients({ email: user.email, expired: true });
    console.log(`[SSE] User expired: ${user.email}`);
  }
};

// Check every 10 seconds
setInterval(checkExpiredPremiumUsers, 10000);

// SSE endpoint
export async function GET() {
  const stream = new ReadableStream<string>({
    start(controller) {
      clients.push(controller);

      // Initial comment to keep connection alive
      controller.enqueue(": connected\n\n");

      // Ping every 15 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        controller.enqueue(": ping\n\n");
      }, 15000);

      // Cleanup when client disconnects
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
