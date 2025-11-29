import { client } from "@/sanity/lib/client"; // adjust the path to your client

async function deleteAllPremiumUserEnds() {
  const query = '*[_type == "premium_user_ends"]';
  const result = await client.delete({ query });
  console.log("Deleted documents:", result);
}

deleteAllPremiumUserEnds().catch((err) => {
  console.error("Error deleting documents:", err);
});
