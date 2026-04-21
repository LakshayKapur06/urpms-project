import { useState } from "react";
import API from "../api/api";

export default function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const login = async () => {
    setError("");

    if (!email.trim() || !password) {
      setError("Enter both email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
    } catch (loginError) {
      setError(loginError.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-80 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-xl backdrop-blur-md transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/75">
        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
          Login
        </h2>

        <input
          className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error ? (
          <p className="mb-3 text-sm text-rose-600 dark:text-rose-300">{error}</p>
        ) : null}

        <button
          className="w-full rounded-lg bg-blue-600 p-2 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
          onClick={login}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Login"}
        </button>
      </div>
    </div>
  );
}
