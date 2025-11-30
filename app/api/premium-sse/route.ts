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
      console.log("[SSE] Sent notification to client:", data);
    } catch (err) {
      console.error("Error writing to SSE client:", err);
    }
  });
};

// Function to check expired premium users
const checkExpiredPremiumUsers = async () => {
  const now = new Date().toISOString();
  console.log("[DEBUG] Checking expired users at:", now);

  try {
    // Fetch all expired premium users
    const expiredUsers: PremiumUser[] = await client.fetch(
      `*[_type == "premiumUser" && premiumEnd <= $now]`,
      { now }
    );

    console.log("[DEBUG] Expired users found:", expiredUsers.map(u => u.email));

    for (const user of expiredUsers) {
      const emailLower = user.email.toLowerCase();

      // Skip if already expired in memory
      if (expiredEmails.has(emailLower)) {
        console.log("[DEBUG] Already expired in memory, skipping:", emailLower);
        continue;
      }

      // Double-check in Sanity if already moved
      const alreadyExpired: { email: string }[] = await client.fetch(
        `*[_type == "premiumEndedUser" && lower(email) == $email]`,
        { email: emailLower }
      );

      if (alreadyExpired.length > 0) {
        console.log("[DEBUG] Already moved to expired collection in Sanity:", emailLower);
        expiredEmails.add(emailLower);
        continue;
      }

      console.log("[DEBUG] Moving user to expired:", user.email);

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
  } catch (err) {
    console.error("[ERROR] Failed to check/move expired users:", err);
  }
};

// Check every 10 seconds
setInterval(() => {
  checkExpiredPremiumUsers().catch(err => console.error("[ERROR] Interval check failed:", err));
}, 10000);

// SSE endpoint
export async function GET() {
  const stream = new ReadableStream<string>({
    start(controller) {
      clients.push(controller);
      console.log("[SSE] Client connected, total clients:", clients.length);

      // Initial comment to keep connection alive
      controller.enqueue(": connected\n\n");

      // Ping every 15 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        controller.enqueue(": ping\n\n");
        console.log("[SSE] Ping sent to clients");
      }, 15000);

      // Cleanup when client disconnects
      return () => {
        clearInterval(pingInterval);
        clients = clients.filter((c) => c !== controller);
        console.log("[SSE] Client disconnected, remaining clients:", clients.length);
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
