import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AlertCircle } from "lucide-react";
import { KCE_LOGO_URL, KCE_LOGO_ALT } from "../config/branding";

console.log("MODE:", import.meta.env.MODE);
console.log("PROD:", import.meta.env.PROD);
console.log("API URL:", import.meta.env.VITE_API_BASE_URL);

export const LoginPage = () => {
  const { login, backendError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dateTimeStr, setDateTimeStr] = useState("");

  const from = location.state?.from?.pathname || "/dashboard";

  // Dynamic date/time ticker
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setDateTimeStr(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }) +
          " " +
          now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })
      );
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.message || err;
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-white text-[#111827] flex flex-col justify-start border-t-[6px] border-[#C76F2B] font-sans">
      
      {/* Header section */}
      <header className="px-8 py-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#E5E5E5] gap-4">
        {/* Left Side: KCE Portal Logo Image / Text Fallback */}
        <div className="flex items-center select-none">
          <img
            src={KCE_LOGO_URL}
            alt={KCE_LOGO_ALT}
            className="kce-login-logo"
            onError={(e) => {
              console.error("KCE Login Logo failed to load:", KCE_LOGO_URL);
              e.currentTarget.style.display = "none";
              const fallback = e.currentTarget.nextElementSibling;
              if (fallback) fallback.style.display = "block";
            }}
          />
          <div style={{ display: "none" }} className="border-l-4 border-[#C76F2B] pl-3 space-y-0.5">
            <h1 className="text-2xl font-black tracking-wider text-[#214C55] leading-none">
              KARPAGAM
            </h1>
            <h2 className="text-sm font-extrabold tracking-wide text-[#C76F2B] leading-none">
              COLLEGE OF ENGINEERING
            </h2>
            <p className="text-[10px] italic text-[#214C55]/85 tracking-widest font-semibold">
              Rediscover | Refine | Redefine
            </p>
          </div>
        </div>

        {/* Right Side: Live DateTime */}
        <div className="text-right text-xs md:text-sm font-bold text-[#214C55]">
          <span>{dateTimeStr || "Loading System Date..."}</span>
        </div>
      </header>

      {/* Full-width grey strip below header */}
      <div className="w-full bg-[#E5E5E5] h-12 flex items-center px-8 border-b border-[#D1D5DB]">
        <span className="text-xs uppercase font-extrabold tracking-wider text-[#163941]">
          Internal Student Competency & Placement Portal
        </span>
      </div>

      {/* Main content body with Login Box */}
      <main className="flex-1 flex flex-col items-center justify-start pt-12 pb-16 px-4 bg-[#F7F7F7]">
        
        {/* Centered Login Box */}
        <div className="w-full max-w-[580px] bg-white border border-[#D1D5DB] rounded-none shadow-none overflow-hidden">
          
          {/* Login box title bar */}
          <div className="bg-[#C76F2B] h-11 flex items-center px-4">
            <h3 className="text-white font-bold text-sm tracking-wide">Login</h3>
          </div>

          {/* Form Body */}
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            
            {(error || backendError) && (
              <div className="bg-rose-50 border border-rose-200 text-[#B91C1C] text-xs px-4 py-3 rounded-none flex items-center space-x-2 animate-fade-in font-semibold">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error || backendError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Email / Reg No grid row */}
              <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-center">
                <label
                  htmlFor="email-address"
                  className="w-full md:col-span-4 text-xs font-bold text-[#214C55] md:text-right uppercase tracking-wider"
                >
                  Register No / Email
                </label>
                <div className="w-full md:col-span-8">
                  <input
                    id="email-address"
                    name="email"
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D1D5DB] rounded-none focus:outline-none focus:border-[#C76F2B] text-slate-800 font-semibold"
                    placeholder="e.g. 22AD001"
                  />
                </div>
              </div>

              {/* Password grid row */}
              <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-center">
                <label
                  htmlFor="password"
                  className="w-full md:col-span-4 text-xs font-bold text-[#214C55] md:text-right uppercase tracking-wider"
                >
                  Password
                </label>
                <div className="w-full md:col-span-8">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D1D5DB] rounded-none focus:outline-none focus:border-[#C76F2B] text-slate-800 font-semibold"
                    placeholder="Enter password"
                  />
                </div>
              </div>
            </div>

            {/* Login and Forgot Password Buttons */}
            <div className="flex flex-col items-center space-y-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#C76F2B] hover:bg-[#A8561F] transition-colors rounded-none shadow-none disabled:opacity-75 cursor-pointer"
              >
                {loading ? "Authenticating..." : "Login"}
              </button>

              <button
                type="button"
                onClick={() => alert("Please contact the KCE college system administrator to reset password details.")}
                className="text-xs font-bold text-[#C76F2B] hover:text-[#A8561F] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </div>


      </main>

      {/* Institutional footer */}
      <footer className="py-4 border-t border-[#E5E5E5] text-center text-[10px] font-bold text-[#6B7280] uppercase tracking-widest bg-white">
        © {new Date().getFullYear()} Karpagam College of Engineering. All rights reserved.
      </footer>
    </div>
  );
};
export default LoginPage;
