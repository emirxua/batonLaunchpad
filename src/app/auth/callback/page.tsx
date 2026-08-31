"use client";

import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function GoogleAuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Parse hash fragments (#access_token=... or #id_token=...)
      const hash = window.location.hash.substring(1);
      const search = window.location.search.substring(1);
      const params = new URLSearchParams(hash || search);

      const idToken = params.get("id_token");
      const accessToken = params.get("access_token");
      const error = params.get("error");

      if (error) {
        setStatus("error");
        setErrorText(error);
        if (window.opener) {
          window.opener.postMessage(
            { type: "GOOGLE_AUTH_ERROR", error },
            window.location.origin
          );
        }
        setTimeout(() => window.close(), 2000);
        return;
      }

      if (idToken || accessToken) {
        setStatus("success");
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "GOOGLE_AUTH_SUCCESS",
              idToken,
              accessToken,
            },
            window.location.origin
          );
        }
        setTimeout(() => window.close(), 800);
      } else {
        setStatus("error");
        setErrorText("No authentication token received from Google.");
      }
    } catch (err: unknown) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : String(err);
      setErrorText(msg || "Error completing authentication.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white flex flex-col items-center justify-center p-6 font-mono select-none">
      <div className="bg-[#12141A] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
            <h2 className="text-base font-bold">Completing Google Sign In...</h2>
            <p className="text-xs text-zinc-400">Please wait while we verify your account.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
            <h2 className="text-base font-bold text-emerald-400">Authenticated!</h2>
            <p className="text-xs text-zinc-400">Closing window and redirecting to Outbid...</p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-base font-bold text-rose-400">Sign In Error</h2>
            <p className="text-xs text-zinc-400">{errorText || "Could not complete sign in."}</p>
          </>
        )}
      </div>
    </div>
  );
}
