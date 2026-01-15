"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signup } from "../actions";

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await signup(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="bg-background-secondary rounded-xl p-8 border border-border">
      <h2 className="text-xl font-semibold text-foreground mb-6">Create your account</h2>

      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-error/10 border border-error/30 text-error rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <Input
          name="fullName"
          type="text"
          label="Full Name"
          placeholder="John Doe"
          icon={<UserIcon className="w-5 h-5" />}
          required
        />

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
          placeholder="At least 6 characters"
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

        <Input
          name="confirmPassword"
          type={showConfirmPassword ? "text" : "password"}
          label="Confirm Password"
          placeholder="Confirm your password"
          icon={<LockClosedIcon className="w-5 h-5" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-foreground-muted hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          }
          required
        />

        <Button type="submit" className="w-full" loading={loading}>
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-foreground-muted text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-green hover:text-green-light transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
