import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { AlertCircle, CheckCircle, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";
import { KCE_LOGO_URL, KCE_LOGO_ALT } from "../config/branding";

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: request, 2: verify, 3: reset, 4: success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [dateTimeStr, setDateTimeStr] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setDateTimeStr(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }) + " " + now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    tick();
    const timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email.trim());
      setSuccessMsg(res.message || "OTP code sent to your registered email.");
      setStep(2);
    } catch (err) {
      const errMsg = err.message || "";
      if (err.response?.status === 404) {
        setError("No account found for this register number or email.");
      } else if (err.response?.status === 504 || errMsg.toLowerCase().includes("timeout") || errMsg.toLowerCase().includes("exceeded")) {
        setError("Email service timed out. Please try again later.");
      } else {
        setError(err.response?.data?.detail || errMsg || "Failed to request password reset code.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authService.verifyResetOtp(email.trim(), otp.trim());
      setResetToken(res.reset_token);
      setSuccessMsg("Reset code verified successfully. Please choose a new password.");
      setStep(3);
    } catch (err) {
      const errMsg = err.message || "";
      if (err.response?.status === 404) {
        setError("No account found for this register number or email.");
      } else if (err.response?.status === 504 || errMsg.toLowerCase().includes("timeout") || errMsg.toLowerCase().includes("exceeded")) {
        setError("Email service timed out. Please try again later.");
      } else {
        setError(err.response?.data?.detail || errMsg || "Invalid reset code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(resetToken, newPassword);
      setSuccessMsg("Your password has been updated successfully.");
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to reset password. Please request a new OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111827] flex flex-col justify-start border-t-[6px] border-[#C76F2B] font-sans">
      {/* Header section */}
      <header className="px-8 py-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#E5E5E5] gap-4">
        <div className="flex items-center select-none">
          <img
            src={KCE_LOGO_URL}
            alt={KCE_LOGO_ALT}
            className="kce-login-logo"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fallback = e.currentTarget.nextElementSibling;
              if (fallback) fallback.style.display = "block";
            }}
          />
          <div style={{ display: "none" }} className="border-l-4 border-[#C76F2B] pl-3 space-y-0.5">
            <h1 className="text-2xl font-black tracking-wider text-[#214C55] leading-none uppercase">Karpagam</h1>
            <h2 className="text-sm font-extrabold tracking-wide text-[#C76F2B] leading-none uppercase">College of Engineering</h2>
          </div>
        </div>
        <div className="text-right text-xs md:text-sm font-bold text-[#214C55]">
          <span>{dateTimeStr || "Loading System Date..."}</span>
        </div>
      </header>

      {/* Gray strip */}
      <div className="w-full bg-[#E5E5E5] h-12 flex items-center px-8 border-b border-[#D1D5DB]">
        <span className="text-xs uppercase font-extrabold tracking-wider text-[#163941]">
          Internal Student Competency & Placement Portal &raquo; Password Recovery
        </span>
      </div>

      {/* Main body */}
      <main className="flex-1 flex flex-col items-center justify-start pt-12 pb-16 px-4 bg-[#F7F7F7]">
        <div className="w-full max-w-[580px] bg-white border border-[#D1D5DB] rounded-none overflow-hidden">
          {/* Header bar */}
          <div className="bg-[#C76F2B] h-11 flex items-center px-4 justify-between">
            <h3 className="text-white font-bold text-sm tracking-wide uppercase">Reset Password</h3>
            <button
              onClick={() => navigate("/login")}
              className="text-white hover:text-white/80 text-xs font-bold uppercase tracking-wider flex items-center gap-1 bg-transparent border-none cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to Login
            </button>
          </div>

          <div className="p-8 space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-[#B91C1C] text-xs px-4 py-3 rounded-none flex items-center space-x-2 font-semibold">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && step !== 4 && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-4 py-3 rounded-none flex items-center space-x-2 font-semibold">
                <CheckCircle size={16} className="flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* STEP 1: Request OTP */}
            {step === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-6">
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Enter your registered Register Number or Email. We will send you a 6-digit verification code (OTP) to reset your password.
                </p>

                <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-center">
                  <label htmlFor="email-identifier" className="w-full md:col-span-4 text-xs font-bold text-[#214C55] md:text-right uppercase tracking-wider">
                    Reg No / Email
                  </label>
                  <div className="w-full md:col-span-8">
                    <input
                      id="email-identifier"
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D1D5DB] rounded-none focus:outline-none focus:border-[#C76F2B] text-slate-800 font-bold"
                      placeholder="e.g. 22AD001 or faculty@kce.ac.in"
                    />
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#C76F2B] hover:bg-[#A8561F] transition-colors rounded-none disabled:opacity-75 cursor-pointer"
                  >
                    {loading ? "Processing..." : "Send Reset Code"}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Verify OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  We have dispatched a 6-digit One-Time Password (OTP) to your email account. Enter the OTP below to continue.
                </p>

                <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-center">
                  <label className="w-full md:col-span-4 text-xs font-bold text-[#214C55] md:text-right uppercase tracking-wider">
                    Reg No / Email
                  </label>
                  <div className="w-full md:col-span-8">
                    <input
                      type="text"
                      disabled
                      value={email}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-[#D1D5DB] rounded-none text-slate-500 font-bold"
                    />
                  </div>
                </div>

                <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-center">
                  <label htmlFor="otp-code" className="w-full md:col-span-4 text-xs font-bold text-[#214C55] md:text-right uppercase tracking-wider">
                    6-Digit OTP
                  </label>
                  <div className="w-full md:col-span-8">
                    <input
                      id="otp-code"
                      type="text"
                      required
                      maxLength={6}
                      pattern="\d{6}"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D1D5DB] rounded-none focus:outline-none focus:border-[#C76F2B] text-slate-800 text-center tracking-[0.5em] font-extrabold"
                      placeholder="******"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(""); }}
                    className="text-xs font-bold text-[#C76F2B] hover:underline"
                  >
                    Request New Code
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#C76F2B] hover:bg-[#A8561F] transition-colors rounded-none disabled:opacity-75 cursor-pointer"
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Enter New Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Verification successful. Enter your new password below.
                </p>

                <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-center">
                  <label htmlFor="new-password" className="w-full md:col-span-4 text-xs font-bold text-[#214C55] md:text-right uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="w-full md:col-span-8">
                    <input
                      id="new-password"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D1D5DB] rounded-none focus:outline-none focus:border-[#C76F2B] text-slate-800 font-bold"
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                </div>

                <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-center">
                  <label htmlFor="confirm-password" className="w-full md:col-span-4 text-xs font-bold text-[#214C55] md:text-right uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="w-full md:col-span-8">
                    <input
                      id="confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D1D5DB] rounded-none focus:outline-none focus:border-[#C76F2B] text-slate-800 font-bold"
                      placeholder="Re-enter password"
                    />
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#C76F2B] hover:bg-[#A8561F] transition-colors rounded-none disabled:opacity-75 cursor-pointer"
                  >
                    {loading ? "Updating..." : "Reset Password"}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: Success */}
            {step === 4 && (
              <div className="text-center space-y-6 py-4">
                <div className="flex justify-center text-green-600">
                  <ShieldCheck size={64} className="animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-[#214C55] uppercase tracking-wider">Password Reset Completed</h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-sm mx-auto">
                    Your password has been successfully updated. You may now login to the portal with your new credentials.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#C76F2B] hover:bg-[#A8561F] transition-colors rounded-none cursor-pointer"
                  >
                    Proceed to Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-4 border-t border-[#E5E5E5] text-center text-[10px] font-bold text-[#6B7280] uppercase tracking-widest bg-white">
        © {new Date().getFullYear()} Karpagam College of Engineering. All rights reserved.
      </footer>
    </div>
  );
};

export default ForgotPasswordPage;
