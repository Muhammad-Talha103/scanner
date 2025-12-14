// components/AdminAuthGuard.tsx
"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface Props {
  children: ReactNode;
}

export default function AdminAuthGuard({ children }: Props) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdminAuthenticated");
    if (isAdmin === "true") {
      setAuthorized(true);
    } else {
      router.push("/admin/admin-login");
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Checking admin authentication...</p>
      </div>
    );
  }

  if (!authorized) {
    return null; // Redirecting
  }

  return <>{children}</>;
}
