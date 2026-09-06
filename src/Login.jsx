import React from "react";
import { supabase } from "./supabase";

const PHONE_SIGNUP_URL =
  "https://ixliaqeyrsuclsyymvel.supabase.co/functions/v1/phone-signup";

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.startsWith("966")) return `+${digits}`;
  if (digits.startsWith("0")) return `+966${digits.slice(1)}`;
  return `+966${digits}`;
}

function internalEmail(phone) {
  return normalizePhone(phone).replace(/\D/g, "") + "@matjarna.local";
}

export default function Login({ onClose, onSuccess }) {
  const [mode, setMode] = React.useState("login");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");

    const normalizedPhone = normalizePhone(phone);

    if (normalizedPhone.length < 10) {
      setError("أدخل رقم جوال صحيح.");
      return;
    }

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: internalEmail(normalizedPhone),
          password,
        });

        if (error) throw error;

        onSuccess?.(data.session);
        return;
      }

      const response = await fetch(PHONE_SIGNUP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          password,
          full_name: fullName.trim(),
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.error ||
          result?.message ||
          "تعذر إنشاء الحساب."
        );
      }

      if (
        result?.session?.access_token &&
        result?.session?.refresh_token
      ) {
        const { data, error } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });

        if (error) throw error;

        onSuccess?.(data.session);
        return;
      }

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: internalEmail(normalizedPhone),
          password,
        });

      if (error) throw error;

      onSuccess?.(data.session);
    } catch (err) {
      console.error("AUTH ERROR:", err);
      setError(err?.message || "تعذر تنفيذ العملية.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(20,24,45,.55)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 430,
          background: "#fff",
          borderRadius: 24,
          padding: 24,
          boxShadow: "0 20px 70px rgba(0,0,0,.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 28 }}>🛍️</div>
            <h2 style={{ margin: "8px 0 4px" }}>
              {mode === "login"
                ? "تسجيل الدخول"
                : "إنشاء حساب"}
            </h2>
            <p style={{ margin: 0, color: "#777", fontSize: 13 }}>
              الدخول إلى حسابك في متجرنا
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: 0,
              background: "#f3f4f8",
              width: 38,
              height: 38,
              borderRadius: 12,
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} style={{ marginTop: 22 }}>
          {mode === "signup" && (
            <label style={{ display: "block", marginBottom: 14 }}>
              <span style={labelStyle}>الاسم</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="الاسم الكامل"
                style={inputStyle}
              />
            </label>
          )}

          <label style={{ display: "block", marginBottom: 14 }}>
            <span style={labelStyle}>رقم الجوال</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              inputMode="tel"
              style={{
                ...inputStyle,
                direction: "ltr",
                textAlign: "left",
              }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 14 }}>
            <span style={labelStyle}>كلمة المرور</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete={
                mode === "login"
                  ? "current-password"
                  : "new-password"
              }
              placeholder="••••••••"
              style={{
                ...inputStyle,
                direction: "ltr",
                textAlign: "left",
              }}
            />
          </label>

          {error && (
            <div
              style={{
                marginBottom: 12,
                padding: 11,
                borderRadius: 12,
                background: "#fff1f2",
                color: "#b42318",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              border: 0,
              borderRadius: 14,
              padding: "14px 16px",
              background: "#4f46e5",
              color: "#fff",
              fontWeight: 800,
              fontSize: 15,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading
              ? "جاري التنفيذ..."
              : mode === "login"
                ? "دخول"
                : "إنشاء الحساب"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
          }}
          style={{
            width: "100%",
            marginTop: 12,
            border: "1px solid #e2e3eb",
            borderRadius: 14,
            padding: "12px 16px",
            background: "#fff",
            color: "#30354f",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {mode === "login"
            ? "ليس لديك حساب؟ إنشاء حساب"
            : "لديك حساب؟ تسجيل الدخول"}
        </button>
      </section>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 7,
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #dfe1ea",
  borderRadius: 13,
  padding: "13px 14px",
  outline: "none",
  background: "#fff",
  color: "#20243c",
  fontSize: 15,
};
