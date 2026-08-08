"use client";

import React, { useState } from "react";
import BaseCard from "./BaseCard";
import { supabase } from "@/utils/supabase";
import { Mail, Lock, LogIn, UserPlus, AlertCircle, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";

export default function Auth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (!email || !password) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Handle Supabase Sign Up with verbose logging
        console.log("=== SUPABASE SIGNUP ATTEMPT ===");
        console.log("Email:", email);
        console.log("Full Name:", fullName);
        console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log("Anon Key (first 20 chars):", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20));

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}`,
          },
        });

        console.log("=== SUPABASE SIGNUP RESPONSE ===");
        console.log("DATA object:", JSON.stringify(data, null, 2));
        console.log("ERROR object:", JSON.stringify(signUpError, null, 2));

        if (data?.user) {
          console.log("User ID:", data.user.id);
          console.log("User email:", data.user.email);
          console.log("User confirmed_at:", data.user.confirmed_at);
          console.log("User email_confirmed_at:", data.user.email_confirmed_at);
          console.log("User identities:", JSON.stringify(data.user.identities, null, 2));
          console.log("User identities length:", data.user.identities?.length);
        }

        if (data?.session) {
          console.log("Session access_token (first 20):", data.session.access_token?.substring(0, 20));
        } else {
          console.log("Session is NULL (email confirmation likely required).");
        }

        if (signUpError) {
          console.error("SUPABASE AUTH ERROR:", signUpError);
          console.error("Error message:", signUpError.message);
          console.error("Error status:", signUpError.status);
          console.error("Error name:", signUpError.name);
          throw signUpError;
        }

        // CRITICAL CHECK: Supabase returns a fake user with empty identities
        // when a user already exists but hasn't confirmed their email, OR
        // when "Confirm email" is ON and the email was already used.
        if (data?.user && data.user.identities && data.user.identities.length === 0) {
          console.warn("⚠️ GHOST USER DETECTED: identities[] is empty. This usually means the email is already registered.");
          setError("This email may already be registered. Check your inbox for a previous confirmation link, or try logging in.");
          setLoading(false);
          return;
        }

        if (data?.session) {
          setMessage("Account created and logged in successfully!");
          if (onAuthSuccess) onAuthSuccess(data.session);
        } else {
          setMessage("Check your email for the confirmation link to complete registration.");
        }
      } else {
        // Handle Supabase Sign In with verbose logging
        console.log("=== SUPABASE SIGNIN ATTEMPT ===");
        console.log("Email:", email);

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log("=== SUPABASE SIGNIN RESPONSE ===");
        console.log("DATA object:", JSON.stringify(data, null, 2));
        console.log("ERROR object:", JSON.stringify(signInError, null, 2));

        if (signInError) {
          console.error("SUPABASE AUTH ERROR:", signInError);
          throw signInError;
        }

        setMessage("Logged in successfully!");
        if (onAuthSuccess) onAuthSuccess(data.session);
      }
    } catch (err) {
      console.error("=== AUTH CATCH BLOCK ===");
      console.error("Error type:", typeof err);
      console.error("Error message:", err?.message);
      console.error("Error status:", err?.status);
      console.error("Full error:", err);
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
    setMessage("");
  };

  return (
    <BaseCard
      className="w-full max-w-sm sm:max-w-md mx-auto"
      padding="p-4 sm:p-6 sm:p-8"
      title={isSignUp ? "Create Account" : "Welcome Back"}
      subtitle={
        isSignUp
          ? "Sign up to start tracking team time & prorated payouts"
          : "Log in to access your team time logs and payout calculator"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name Input (Only on Sign Up) */}
        {isSignUp && (
          <div>
            <label
              htmlFor="fullName"
              className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
            />
          </div>
        )}

        {/* Email Input */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
          >
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
          >
            Password
          </label>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 sm:px-4 flex items-center justify-center text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-r-xl"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="flex items-start gap-2 p-3.5 bg-red-50 border border-red-200/80 rounded-xl text-xs font-medium text-red-700 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug break-words">{error}</span>
          </div>
        )}

        {message && (
          <div className="flex items-start gap-2 p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs font-medium text-emerald-700 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug break-words">{message}</span>
          </div>
        )}

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] disabled:opacity-60 text-white font-medium rounded-xl shadow-xs transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSignUp ? (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>

        {/* State Toggle Muted Link */}
        <div className="pt-2 text-center text-xs text-slate-500">
          {isSignUp ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
              >
                Log In
              </button>
            </p>
          ) : (
            <p>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
              >
                Create Account
              </button>
            </p>
          )}
        </div>
      </form>

    </BaseCard>
  );
}
