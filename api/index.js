require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Server-side Supabase client authenticated with the service-role key. This key MUST stay
// server-side — it is never sent to, or used by, the React Native client. It lets the API
// write security-sensitive rows (PIN hash, wallet creation) that RLS would otherwise block.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/**
 * POST /pin
 * Securely set a user's 4-digit PIN and complete account onboarding.
 *
 * Body: { userId: string, pin: string }
 *
 * Steps (all-or-nothing-ish, idempotent so a double tap is safe):
 *  1. Validate inputs.
 *  2. Hash the PIN with bcrypt (never store plaintext, never returned to the client).
 *  3. Upsert the user_security record (hash only).
 *  4. Create the primary SSP wallet if it does not already exist (balance 0 — no fake money).
 *  5. Flip profile.account_status from 'pending_pin' to 'active' (only after PIN is saved).
 *
 * On success returns { ok: true } — the PIN hash is NEVER exposed to the client.
 */
app.post("/pin", async (req, res) => {
  try {
    const { userId, pin } = req.body ?? {};

    if (!userId || typeof userId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return res.status(400).json({ error: "invalid_session" });
    }
    if (typeof pin !== "string" || !/^[0-9]{4}$/.test(pin)) {
      return res.status(400).json({ error: "invalid_pin" });
    }

    // 1. Hash the PIN server-side. Cost 12 keeps it one-way and slow to brute-force.
    const pinHash = await bcrypt.hash(pin, 12);

    // 2. Persist the hash. Upsert so re-running this after a partial failure never duplicates.
    const { error: secError } = await supabase
      .from("user_security")
      .upsert(
        { user_id: userId, pin_hash: pinHash },
        { onConflict: "user_id" },
      );
    if (secError) {
      console.error("[pin] security upsert failed:", secError.message);
      return res.status(500).json({ error: "save_failed" });
    }

    // 3. Create the primary SSP wallet for this user. The unique (user_id, currency)
    //    constraint + onConflict ignore guarantees no duplicate wallet on retry.
    const { error: walletError } = await supabase
      .from("wallets")
      .upsert(
        { user_id: userId, currency: "SSP", balance: 0 },
        { onConflict: "user_id,currency", ignoreDuplicates: true },
      );
    if (walletError) {
      console.error("[pin] wallet create failed:", walletError.message);
      return res.status(500).json({ error: "wallet_failed" });
    }

    // 4. Activate the account — only now that the PIN hash is safely stored. Only flip from
    //    pending_pin so an earlier activation is never undone by a duplicate request.
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ account_status: "active" })
      .eq("id", userId)
      .eq("account_status", "pending_pin");
    if (profileError) {
      console.error("[pin] profile activate failed:", profileError.message);
      return res.status(500).json({ error: "activation_failed" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("[pin] unexpected:", err && err.message);
    return res.status(500).json({ error: "server_error" });
  }
});

app.get("/", (req, res) => {
  res.json({
    project: process.env.RAPIDNATIVE_PROJECT_ID,
    environment: process.env.RAPIDNATIVE_ENV,
    message: "API server running",
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log("[api] Running on port " + port);
});
