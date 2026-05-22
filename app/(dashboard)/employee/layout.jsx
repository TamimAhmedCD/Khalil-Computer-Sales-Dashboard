import { auth } from "@/auth"

export default async function layout({ children }) {
    const session = await auth()
    if (!session) {
        return <div>Unauthorized</div>
    }
        if (session.user.role !== "employee") {
      return <div>Unauthorized</div>;
    }

  return (
    <div>{children}</div>
  )
}
