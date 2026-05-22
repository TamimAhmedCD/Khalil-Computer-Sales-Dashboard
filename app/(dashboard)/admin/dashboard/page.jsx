"use client"
import { AdminDashboard } from "@/components/Admin/Dashboard/dashboard";
import { useSession } from "next-auth/react"

export default function AdminDashboardPage() {
    const { data: session, status } = useSession()
    if (status === "loading") {
        return <div>Loading...</div>
    }
    if (status === "unauthenticated") {
        return <div>Not logged in</div>
    }
    if (session.user.role !== "admin") {
        return <div>Unauthorized</div>
    }
    return (
        <div><AdminDashboard session={session} />
        </div>
    )
}
