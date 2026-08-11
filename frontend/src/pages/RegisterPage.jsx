import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AnimatedPage from "../components/AnimatedPage";
import GlassCard from "../components/GlassCard";
import GlowButton from "../components/GlowButton";
import useAuth from "../hooks/useAuth";

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "tester",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const redirectPath = await register(form);
      navigate(redirectPath);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to register");
    }
  };

  return (
    <AnimatedPage className="flex min-h-screen items-center justify-center px-4 py-10">
      <GlassCard className="w-full max-w-lg p-8">
        <p className="text-sm uppercase tracking-[0.35em] text-glow">Create Account</p>
        <h1 className="mt-4 font-display text-4xl font-bold text-white">Register</h1>
        <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
          <input
            placeholder="Full name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none"
          />
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
          <select
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none"
          >
            <option value="tester">Tester</option>
            <option value="developer">Developer</option>
            <option value="admin">Admin</option>
          </select>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <GlowButton type="submit" className="w-full py-3">
            Create Account
          </GlowButton>
        </form>
        <p className="mt-5 text-sm text-slate-400">
          Already registered?{" "}
          <Link to="/login" className="text-glow">
            Sign in
          </Link>
        </p>
      </GlassCard>
    </AnimatedPage>
  );
}

export default RegisterPage;
