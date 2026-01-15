"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { login } from "../actions";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="bg-background-secondary rounded-xl p-8 border border-border">
      <h2 className="text-xl font-semibold text-foreground mb-6">Sign in to your account</h2>

      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-error/10 border border-error/30 text-error rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          icon={<EnvelopeIcon className="w-5 h-5" />}
          required
        />

        <Input
          name="password"
          type={showPassword ? "text" : "password"}
          label="Password"
          placeholder="Enter your password"
          icon={<LockClosedIcon className="w-5 h-5" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-foreground-muted hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          }
          required
        />

        <Button type="submit" className="w-full" loading={loading}>
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-foreground-muted text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-green hover:text-green-light transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}
