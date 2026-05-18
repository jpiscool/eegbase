"use server";

import { signIn } from "@/lib/auth/config";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { checkRate, clientIpFromHeaders } from "@/lib/rate-limit";

export async function loginAction(email: string, password: string) {
  // Two-axis rate limit: per-IP defeats one attacker iterating accounts;
  // per-email defeats credential-stuffing against a known account.
  // 10/min per IP and 5/min per email — generous enough that a user
  // fat-fingering their own password isn't locked out.
  const h = await headers();
  const ip = clientIpFromHeaders(h);
  const ipRate = checkRate("login-ip", ip, { max: 10, windowMs: 60 * 1000 });
  const emailRate = checkRate("login-email", email.toLowerCase(), { max: 5, windowMs: 60 * 1000 });
  if (!ipRate.ok || !emailRate.ok) {
    return { error: "Too many sign-in attempts. Wait a minute and try again." };
  }
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}
