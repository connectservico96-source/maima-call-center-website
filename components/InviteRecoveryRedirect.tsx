"use client";

import { useEffect } from "react";

export default function InviteRecoveryRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (accessToken && refreshToken && (type === "invite" || type === "recovery" || type === "signup")) {
      window.location.replace(`/recuperar-password${hash}`);
    }
  }, []);

  return null;
}
