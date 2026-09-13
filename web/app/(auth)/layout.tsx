/** Sign-in and sign-up screens: the logo, then one centered card on a muted ground (shadcn login-03). */
import type { JSX, ReactNode } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { getCurrentUser, ROLE_HOME } from "@/lib/session";

/** A signed-in person has nothing to do here, so they go straight to their own space. */
export default async function AuthLayout({ children }: { children: ReactNode }): Promise<JSX.Element> {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);
  return (
    <main
      id="contenu"
      tabIndex={-1}
      className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-muted p-6 outline-none md:p-10"
    >
      <Logo />
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
