"use client";

import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/session";

export function AppHeader({ name, role }: { name: string; role: string }) {
  const router = useRouter();
  return (
    <header className="app-header">
      <div>
        <a className="brand" href="/">Dhaka Tesla Pool</a>
        <span className="role-pill">{role}</span>
      </div>
      <div className="header-user">
        <span>{name}</span>
        <button
          className="button button-ghost button-small"
          onClick={() => {
            clearSession();
            router.replace("/login");
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
