"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { safeCallbackUrl } from "@/lib/redirect";
import { signInSchema } from "@/lib/validation";

export type SignInState = {
  error?: string;
};

export async function signInWithCredentials(
  _previousState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl"));

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "That email or password is not correct." };
    }

    throw error;
  }

  return {};
}
