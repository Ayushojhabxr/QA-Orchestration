import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AnimatedPage from "../components/AnimatedPage";
import GlassCard from "../components/GlassCard";
import GlowButton from "../components/GlowButton";
import useAuth from "../hooks/useAuth";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const redirectPath = await login(form);
      navigate(redirectPath);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to log in");
    }
  };

  return (
    <AnimatedPage className="flex min-h-screen items-center justify-center px-4 py-10">
      <GlassCard className="w-full max-w-md p-8">
        <p className="text-sm uppercase tracking-[0.35em] text-glow">Welcome Back</p>
        <h1 className="mt-4 font-display text-4xl font-bold text-white">Sign In</h1>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none"
          />
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <GlowButton type="submit" className="w-full py-3">
            Sign In
          </GlowButton>
        </form>
        <p className="mt-5 text-sm text-slate-400">
          Need an account?{" "}
          <Link to="/register" className="text-glow">
            Register
          </Link>
        </p>
      </GlassCard>
    </AnimatedPage>
  );
}

export default LoginPage;
