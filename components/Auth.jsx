"use client";

import React, { useState } from "react";
import BaseCard from "./BaseCard";
import { supabase } from "@/utils/supabase";
import { Mail, Lock, LogIn, UserPlus, AlertCircle, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

export default function Auth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [loading, setLoading] = useState(false);
  const [diagLoading, setDiagLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [diagOutput, setDiagOutput] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setDiagOutput("");
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

  // ============================================
  // DIAGNOSTIC TEST FUNCTION (TEMPORARY)
  // ============================================
  const runDiagnostic = async () => {
    setDiagLoading(true);
    setError("");
    setMessage("");
    setDiagOutput("");

    const diagnosticEmail = "test-diagnostic@example.com";
    const diagnosticPassword = "DiagTest2026!Secure";

    const lines = [];
    const log = (msg) => {
      console.log(msg);
      lines.push(msg);
    };

    try {
      log("=== AUTH DIAGNOSTIC START ===");
      log(`Timestamp: ${new Date().toISOString()}`);
      log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
      log(`Anon Key (first 20): ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}`);
      log(`Origin: ${window.location.origin}`);
      log(`emailRedirectTo: ${window.location.origin}`);
      log(`Test email: ${diagnosticEmail}`);
      log("");

      // Step 1: Test signUp
      log("--- Step 1: Calling supabase.auth.signUp() ---");
      const startTime = performance.now();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: diagnosticEmail,
        password: diagnosticPassword,
        options: {
          data: { full_name: "Diagnostic Test User" },
          emailRedirectTo: `${window.location.origin}`,
        },
      });

      const elapsed = (performance.now() - startTime).toFixed(0);
      log(`Response time: ${elapsed}ms`);
      log("");

      if (signUpError) {
        log(`❌ SIGNUP ERROR RETURNED`);
        log(`   message: ${signUpError.message}`);
        log(`   status: ${signUpError.status}`);
        log(`   name: ${signUpError.name}`);
        log(`   Full: ${JSON.stringify(signUpError, null, 2)}`);
      } else {
        log(`✅ No error returned from signUp`);
      }

      log("");
      if (data) {
        log(`--- data.user ---`);
        if (data.user) {
          log(`   id: ${data.user.id}`);
          log(`   email: ${data.user.email}`);
          log(`   confirmed_at: ${data.user.confirmed_at}`);
          log(`   email_confirmed_at: ${data.user.email_confirmed_at}`);
          log(`   created_at: ${data.user.created_at}`);
          log(`   aud: ${data.user.aud}`);
          log(`   role: ${data.user.role}`);
          log(`   identities count: ${data.user.identities?.length}`);
          if (data.user.identities && data.user.identities.length > 0) {
            log(`   identities[0].provider: ${data.user.identities[0].provider}`);
            log(`   identities[0].identity_id: ${data.user.identities[0].identity_id}`);
          } else {
            log(`   ⚠️ identities[] is EMPTY — possible ghost/duplicate user`);
          }
        } else {
          log(`   user is NULL`);
        }

        log("");
        log(`--- data.session ---`);
        if (data.session) {
          log(`   access_token (first 20): ${data.session.access_token?.substring(0, 20)}`);
          log(`   token_type: ${data.session.token_type}`);
          log(`   expires_in: ${data.session.expires_in}`);
        } else {
          log(`   session is NULL (email confirmation is required before login)`);
        }
      } else {
        log(`   data is NULL`);
      }

      log("");
      log("=== AUTH DIAGNOSTIC COMPLETE ===");

      // Step 2: Check Supabase project health via settings endpoint
      log("");
      log("--- Step 2: Supabase Project Health Check ---");
      try {
        const healthRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          },
        });
        const healthStatus = healthRes.status;
        log(`   /auth/v1/settings HTTP status: ${healthStatus}`);
        if (healthRes.ok) {
          const settings = await healthRes.json();
          log(`   external.email enabled: ${settings?.external?.email}`);
          log(`   mailer_autoconfirm: ${settings?.mailer_autoconfirm}`);
          log(`   disable_signup: ${settings?.disable_signup}`);
          log(`   Full settings: ${JSON.stringify(settings, null, 2)}`);
        } else {
          log(`   ⚠️ Could not fetch auth settings (HTTP ${healthStatus})`);
        }
      } catch (healthErr) {
        log(`   ❌ Health check fetch failed: ${healthErr.message}`);
      }

    } catch (err) {
      log(`❌ DIAGNOSTIC EXCEPTION: ${err.message}`);
      log(`   Full: ${JSON.stringify(err, null, 2)}`);
    } finally {
      const output = lines.join("\n");
      setDiagOutput(output);
      setDiagLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
    setMessage("");
    setDiagOutput("");
  };

  return (
    <BaseCard
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
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
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
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
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
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="flex items-start gap-2 p-3.5 bg-red-50 border border-red-200/80 rounded-xl text-xs font-medium text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug break-words">{error}</span>
          </div>
        )}

        {message && (
          <div className="flex items-start gap-2 p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs font-medium text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug break-words">{message}</span>
          </div>
        )}

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-medium rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
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
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors focus:outline-none"
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
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors focus:outline-none"
              >
                Create Account
              </button>
            </p>
          )}
        </div>
      </form>

      {/* ============================================ */}
      {/* DIAGNOSTIC SECTION (TEMPORARY — Remove after debugging) */}
      {/* ============================================ */}
      <div className="mt-6 pt-4 border-t border-red-200/60 space-y-3">
        <button
          type="button"
          onClick={runDiagnostic}
          disabled={diagLoading}
          className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:opacity-60 text-white font-medium rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm"
        >
          {diagLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <ShieldAlert className="w-4 h-4" />
              <span>Run Auth Diagnostic</span>
            </>
          )}
        </button>

        {diagOutput && (
          <div className="bg-slate-900 text-green-400 p-4 rounded-xl text-[11px] font-mono leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap border border-slate-700">
            {diagOutput}
          </div>
        )}
      </div>
    </BaseCard>
  );
}
