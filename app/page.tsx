import { redirect } from "next/navigation";

import { getOptionalUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getOptionalUser();
  redirect(user ? "/portfolio" : "/auth/login");
}

