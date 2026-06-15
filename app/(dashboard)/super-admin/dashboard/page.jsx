"use client";
import { signOut, useSession } from "next-auth/react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  if (status === "loading") {
    return <div>Loading...</div>;
  }
  if (status === "unauthenticated") {
    return <div>Not logged in</div>;
  }
  if (session.user.role !== "superAdmin") {
    return <div>Unauthorized</div>;
  }
  return (
    <div>
      <p>This is the Super Admin dashboard</p>
      <h4>{session.user.name}</h4>
      <button
        onClick={() => {
          signOut();
        }}
        className="bg-white px-4 py-2 text-black cursor-pointer"
      >
        Logout
      </button>
    </div>
  );
}
