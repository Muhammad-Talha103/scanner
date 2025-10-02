import { client } from "@/sanity/lib/client";

export interface SanityUser {
  _id: string; // ✅ Required
  username: string;
  email: string;
  userpassword: string;
  createdAt: string;
}

export interface ForgetPasswordEntry {
  _id: string;
  userEmail: string;
  password: string;
  updatedAt: string;
}

export interface Userr {
  id: string;
  serial: number;
  name: string;
  email: string;
  password: string;
  createdAt: string;
  isPasswordUpdated?: boolean;
}

const userQuery = `*[_type == "user"] | order(createdAt desc) {
  _id,
  username,
  email,
  userpassword,
  createdAt
}`;

const forgetPasswordQuery = `*[_type == "forgetPassword"] {
  _id,
  userEmail,
  password,
  updatedAt
}`;

export async function fetchUsers(): Promise<SanityUser[]> {
  const users = await client.fetch(userQuery);
  return users;
}

export async function fetchForgetPasswordEntries(): Promise<
  ForgetPasswordEntry[]
> {
  const entries = await client.fetch(forgetPasswordQuery);
  return entries;
}

export async function fetchUsersWithPasswordMerge(): Promise<Userr[]> {
  try {
    // Fetch both datasets
    const [users, forgetPasswordEntries] = await Promise.all([
      fetchUsers(),
      fetchForgetPasswordEntries(),
    ]);

    // Create a map of email to forgetPassword entry for quick lookup
    const forgetPasswordMap = new Map<string, ForgetPasswordEntry>();
    forgetPasswordEntries.forEach((entry) => {
      if (entry.userEmail && typeof entry.userEmail === "string") {
        forgetPasswordMap.set(entry.userEmail.toLowerCase(), entry);
      } else {
        console.warn(
          "⚠️ Skipping forgetPassword entry with null/invalid userEmail:",
          entry
        );
      }
    });

    // Process users and merge passwords where applicable
    const processedUsers: Userr[] = users.map((user, index) => {
      let forgetPasswordEntry = null;
      if (user.email && typeof user.email === "string") {
        forgetPasswordEntry = forgetPasswordMap.get(user.email.toLowerCase());
      } else {
        console.warn(" ⚠️ User has null/invalid email:", user);
      }

      if (forgetPasswordEntry) {
        return {
          id: user._id,
          serial: index + 1,
          name: user.username,
          email: user.email || "No Email",
          password: forgetPasswordEntry.password, // Use password from forgetPassword
          createdAt: user.createdAt,
          isPasswordUpdated: true, // Mark as updated
        };
      } else {
        return {
          id: user._id,
          serial: index + 1,
          name: user.username,
          email: user.email || "No Email", // Handle null email in display
          password: user.userpassword, // Use original password
          createdAt: user.createdAt,
          isPasswordUpdated: false, // Mark as not updated
        };
      }
    });

    return processedUsers;
  } catch (error) {
    
    throw error;
  }
}
