/** @format */

import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

export const authClient = createAuthClient<typeof auth>({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
