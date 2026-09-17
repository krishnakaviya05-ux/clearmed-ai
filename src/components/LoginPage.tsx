import React, { FormEvent, useState } from "react";
import "../styles/login.css";
import { loginUser, signupUser } from "../services/authService";
import {
  Activity,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface LoginPageProps {
  onLogin: (name: string, email: string) => void;
}

type AuthMode = "login" | "signup";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  // =========================================================
  // STATE
  // =========================================================
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // =========================================================
  // SWITCH MODE
  // =========================================================
  const handleSwitchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setFormError(null);
    setSuccessNotice(null);
    setPassword("");
    setConfirmPassword("");
  };

  // =========================================================
  // SUBMIT
  // =========================================================
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setFormError(null);
    setSuccessNotice(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    // Friendly validation checks
    if (mode === "signup") {
      if (!trimmedName) {
        setFormError("Please enter your full name.");
        document.getElementById("name")?.focus();
        return;
      }
      if (!trimmedEmail) {
        setFormError("Please enter your email address.");
        document.getElementById("email")?.focus();
        return;
      }
      if (!EMAIL_RE.test(trimmedEmail)) {
        setFormError("Please enter a valid email address (e.g. name@example.com).");
        document.getElementById("email")?.focus();
        return;
      }
      if (!password) {
        setFormError("Please enter a password.");
        document.getElementById("password")?.focus();
        return;
      }
      if (password.length < 6) {
        setFormError("Password must be at least 6 characters long.");
        document.getElementById("password")?.focus();
        return;
      }
      if (password !== confirmPassword) {
        setFormError("Passwords do not match. Please re-type your password.");
        document.getElementById("confirm-password")?.focus();
        return;
      }
    } else {
      if (!trimmedEmail) {
        setFormError("Please enter your email address.");
        document.getElementById("email")?.focus();
        return;
      }
      if (!EMAIL_RE.test(trimmedEmail)) {
        setFormError("Please enter a valid email address.");
        document.getElementById("email")?.focus();
        return;
      }
      if (!password) {
        setFormError("Please enter your password.");
        document.getElementById("password")?.focus();
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        await signupUser({
          name: trimmedName,
          email: trimmedEmail,
          password: password,
        });

        // Successful signup -> prompt user to login with their credentials
        setIsSubmitting(false);
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        setSuccessNotice("Account created successfully! Please log in with your password.");
        window.setTimeout(() => {
          document.getElementById("password")?.focus();
        }, 150);
        return;
      }

      // Login Mode
      const loggedInUser = await loginUser({
        email: trimmedEmail,
        password: password,
      });

      // Save safe user info to localStorage
      localStorage.setItem(
        "clearmed_user",
        JSON.stringify({
          name: loggedInUser.name,
          email: loggedInUser.email,
        })
      );

      setIsSubmitting(false);
      onLogin(loggedInUser.name, loggedInUser.email);
    } catch (err: any) {
      setIsSubmitting(false);
      const displayError =
        err.message ||
        (mode === "signup"
          ? "Could not create account. Please check your connection and try again."
          : "Invalid email or password. Please verify your details.");
      setFormError(displayError);
    }
  };

  return (
    <div className="login-page-root">
      {/* Top Universal Branding Header */}
      <header className="login-header-bar">
        <div className="login-header-container">
          <div className="login-brand-group">
            <div className="login-brand-icon-box">
              <Activity className="login-brand-ecg-icon" strokeWidth={2.5} />
            </div>
            <div className="login-brand-text-col">
              <div className="login-brand-headline">
                <span className="login-brand-title">ClearMed</span>
                <span className="login-brand-tag">AI DIAGNOSTIC EXPLAINER</span>
              </div>
              <p className="login-brand-tagline">
                Understand medical reports in simple language
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="login-main-wrapper">
        <div className="login-card-container">
          {/* Heading */}
          <div className="login-card-intro">
            <h1 className="login-card-heading">
              {mode === "signup" ? "Create your Account" : "Welcome to ClearMed"}
            </h1>
            <p className="login-card-subheading">
              Understand your medical reports in simple language.
            </p>
          </div>

          {/* Error Message */}
          {formError && (
            <div className="login-alert-box login-alert-error" role="alert">
              <AlertCircle className="login-alert-icon" />
              <div className="login-alert-content">{formError}</div>
            </div>
          )}

          {/* Success Message */}
          {successNotice && (
            <div className="login-alert-box login-alert-success" role="status">
              <CheckCircle2 className="login-alert-icon" />
              <div className="login-alert-content">{successNotice}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="login-card-form">
            {/* Full Name (Signup only) */}
            {mode === "signup" && (
              <div className="login-field-group">
                <label htmlFor="name" className="login-field-label">
                  Full Name
                </label>
                <div className="login-field-input-box">
                  <User className="login-field-icon" aria-hidden="true" />
                  <input
                    id="name"
                    type="text"
                    className="login-field-control"
                    placeholder="e.g. John Doe"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formError) setFormError(null);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="login-field-group">
              <label htmlFor="email" className="login-field-label">
                Email Address
              </label>
              <div className="login-field-input-box">
                <Mail className="login-field-icon" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  className="login-field-control"
                  placeholder="name@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formError) setFormError(null);
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field-group">
              <div className="login-field-label-split">
                <label htmlFor="password" className="login-field-label">
                  Password
                </label>
                {mode === "signup" && (
                  <span className="login-field-hint">Min. 6 characters</span>
                )}
              </div>
              <div className="login-field-input-box">
                <Lock className="login-field-icon" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="login-field-control"
                  placeholder="Enter your password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formError) setFormError(null);
                  }}
                />
                <button
                  type="button"
                  className="login-field-peek-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Signup only) */}
            {mode === "signup" && (
              <div className="login-field-group">
                <label htmlFor="confirm-password" className="login-field-label">
                  Confirm Password
                </label>
                <div className="login-field-input-box">
                  <Lock className="login-field-icon" aria-hidden="true" />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    className="login-field-control"
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (formError) setFormError(null);
                    }}
                  />
                  <button
                    type="button"
                    className="login-field-peek-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="login-primary-btn"
              id="login-submit-btn"
            >
              {isSubmitting ? (
                <span className="login-btn-loading">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{mode === "signup" ? "Creating Account..." : "Signing in..."}</span>
                </span>
              ) : (
                <span>{mode === "signup" ? "CREATE ACCOUNT" : "LOG ME IN"}</span>
              )}
            </button>
          </form>

          {/* Mode Switch Footer */}
          <div className="login-mode-switch-row">
            {mode === "login" ? (
              <p className="login-mode-switch-copy">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchMode("signup")}
                  className="login-mode-switch-link"
                  id="switch-to-signup-btn"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p className="login-mode-switch-copy">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchMode("login")}
                  className="login-mode-switch-link"
                  id="switch-to-login-btn"
                >
                  Back to Login
                </button>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
