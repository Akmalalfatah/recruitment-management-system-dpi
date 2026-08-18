import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usingDemoData, demo } from "../../lib/db";
import { TextInput, PrimaryButton } from "../../components/common/Ui";
import Logo from "../../components/common/Logo";
import { LogIn } from "lucide-react";

export default function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Gagal masuk. Periksa email dan password Anda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-6">
        <div className="flex flex-col items-center">
          <Logo width={300} height={200} className="bg-white p-1.5" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {error && (
            <div className="text-xs bg-status-red/10 border border-status-red/30 text-status-red px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1">Email</label>
            <TextInput
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@dpi.co.id"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1">Password</label>
            <TextInput
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <PrimaryButton type="submit" disabled={loading} className="w-full justify-center">
            <LogIn size={15} /> {loading ? "Memproses..." : "Masuk"}
          </PrimaryButton>

          {usingDemoData && (
            <div className="pt-3 border-t border-surface-border text-[11px] text-ink-500 space-y-1">
              <p className="font-semibold text-ink-700">Mode demo (belum terhubung ke Supabase):</p>
              {Object.entries(demo.credentials).map(([em, pw]) => (
                <button
                  type="button"
                  key={em}
                  onClick={() => {
                    setEmail(em);
                    setPassword(pw);
                  }}
                  className="flex justify-between w-full text-left hover:text-primary"
                >
                  <span>{em}</span>
                  <span className="text-ink-300">{pw}</span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
