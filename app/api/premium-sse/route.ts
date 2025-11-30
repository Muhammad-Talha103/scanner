import { client } from "@/sanity/lib/client";

interface PremiumUser {
  _id: string;
  email: string;
  name?: string;
  premiumStart?: string;
  premiumEnd?: string;
  payments?: [];
}

// Store connected SSE clients
let clients: Array<ReadableStreamDefaultController<string>> = [];
const expiredEmails = new Set<string>(); // Track already-expired users

const sendToClients = (data: { email: string; expired: true }) => {
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

  try {
    // Fetch all expired premium users
    const expiredUsers: PremiumUser[] = await client.fetch(
      `*[_type == "premiumUser" && premiumEnd <= $now]`,
      { now }
    );

    console.log("[Expiration] Found expired users:", expiredUsers.length);

    for (const user of expiredUsers) {
      const emailLower = user.email.toLowerCase();

      if (!user._id) {
        console.warn("[Expiration] User has no _id, skipping:", user.email);
        continue;
      }
      console.log("[Expiration] Processing user:", user.email);

      // Skip if already expired in memory
      if (expiredEmails.has(emailLower)) continue;

      // Double-check in Sanity if already moved
      const alreadyExpired: { email: string }[] = await client.fetch(
        `*[_type == "premium_ends" && lower(email) == $email]`,
        { email: emailLower }
      );
      if (alreadyExpired.length > 0) {
        console.log("[Expiration] Already expired in Sanity:", user.email);
        expiredEmails.add(emailLower);
        continue;
      }

      try {
        // Move user to expired
        const created = await client.create({
          _type: "premium_ends",
          email: user.email,
          name: user.name || null,
          premiumStart: user.premiumStart || null,
          premiumEnd: user.premiumEnd || null,
          payments: user.payments || [],
          movedAt: new Date().toISOString(),
        });
        console.log("[Expiration] Moved to premium_ends:", created);

        // Delete from active premium
        const deleted = await client.delete(user._id);
        console.log("[Expiration] Deleted from premiumUser:", deleted);

        expiredEmails.add(emailLower);

        // Notify SSE clients
        sendToClients({ email: user.email, expired: true });
      } catch (err) {
        console.error(
          "[Expiration] Error moving/deleting user:",
          user.email,
          err
        );
      }
    }
  } catch (err) {
    console.error("[Expiration] Error fetching expired users:", err);
  }
};

// Check every 10 seconds
setInterval(checkExpiredPremiumUsers, 10000);

// SSE endpoint
export async function GET() {
  const stream = new ReadableStream<string>({
    start(controller) {
      clients.push(controller);
      controller.enqueue(": connected\n\n");

      const pingInterval = setInterval(() => {
        controller.enqueue(": ping\n\n");
      }, 15000);

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
