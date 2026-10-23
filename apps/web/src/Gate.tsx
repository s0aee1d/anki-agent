import { ReactNode, useEffect, useState } from "react";
import { AuthState, authStatus, requestAccess } from "./api";

export function Gate({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authStatus().then(setAuth).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (auth?.state !== "pending") return;
    const t = setInterval(() => authStatus().then(setAuth).catch(() => {}), 3000);
    return () => clearInterval(t);
  }, [auth?.state]);

  if (auth?.state === "approved") return <>{children}</>;

  return (
    <div className="app">
      <header>
        <span>Anki</span>
      </header>
      {error && <p className="error">{error}</p>}
      {!auth && !error && <p className="note">Loading…</p>}
      {auth?.state === "none" && (
        <>
          <p className="note">This device is not approved yet.</p>
          <button
            onClick={() =>
              requestAccess()
                .then(setAuth)
                .catch((e) => setError(e.message))
            }
          >
            Request access
          </button>
        </>
      )}
      {auth?.state === "pending" && (
        <>
          <p className="note">Waiting for approval. Device ID:</p>
          <p className="device-id">{auth.id}</p>
          <p className="note">This page continues automatically once the device is approved.</p>
        </>
      )}
    </div>
  );
}
