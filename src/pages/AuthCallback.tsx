import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/common/Loading";

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    const processAuth = async () => {
      console.log("Processing auth callback...", { code, state, errorParam });
      
      if (errorParam) {
        setError(errorDescription || errorParam);
        return;
      }

      if (!code) {
        setError("No authorization code received");
        return;
      }

      // Verify state if it was stored
      const storedState = sessionStorage.getItem("oauth_state");
      if (storedState && state !== storedState) {
        setError("Invalid state parameter");
        return;
      }

      // Clear stored state
      sessionStorage.removeItem("oauth_state");

      try {
        console.log("Exchanging code for token...");
        // Exchange code for token
        await handleOAuthCallback(code);
        console.log("Authentication successful, redirecting...");
        navigate("/dashboard");
      } catch (err: unknown) {
        console.error("Auth error:", err);
        const errorMessage = err instanceof Error ? err.message : "Authentication failed";
        setError(errorMessage);
      }
    };

    processAuth();
  }, [searchParams, handleOAuthCallback, navigate]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="card">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-red-600 mb-2">
            Authentication Failed
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <LoadingScreen message="Completing authentication..." />;
}
