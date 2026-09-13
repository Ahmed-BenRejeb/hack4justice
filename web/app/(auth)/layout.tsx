/** Sign-in and sign-up screens: one centered card on a muted ground (shadcn login-03). */
import type { JSX, ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, ROLE_HOME } from "@/lib/session";

/** A signed-in person has nothing to do here, so they go straight to their own space. */
export default async function AuthLayout({ children }: { children: ReactNode }): Promise<JSX.Element> {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);
  return (
    // The viewport less the 3.5rem header, so the card sits centred without a scroll.
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
