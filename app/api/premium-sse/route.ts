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
const expiredIds = new Set<string>(); // Track already-moved premiumUser _id

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

  

    for (const user of expiredUsers) {
      if (!user._id) {
       
        continue;
      }

      // Skip if this exact premium record already moved
      if (expiredIds.has(user._id)) continue;

      const emailLower = user.email.toLowerCase();


      // Double-check in Sanity if already moved (_id based)
      const alreadyExpired: { _id: string }[] = await client.fetch(
        `*[_type == "premium_ends" && originalId == $id]`,
        { id: user._id }
      );
      if (alreadyExpired.length > 0) {
        expiredIds.add(user._id);
        continue;
      }

      try {
        // Move user to expired
        const created = await client.create({
          _type: "premium_ends",
          originalId: user._id,        // Track original premiumUser _id
          email: user.email,
          name: user.name || null,
          premiumStart: user.premiumStart || null,
          premiumEnd: user.premiumEnd || null,
          payments: user.payments || [],
          movedAt: new Date().toISOString(),
        });
        

        // Delete from active premium
        const deleted = await client.delete(user._id);
        

        // Mark as expired in memory
        expiredIds.add(user._id);

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



