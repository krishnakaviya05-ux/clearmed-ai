import React, {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import "../styles/login.css";
import { loginUser, signupUser } from "../services/authService";

interface LoginPageProps {
  onLogin: (name: string, email: string) => void;
}

type AuthMode = "login" | "signup";

type RobotMood =
  | "idle"
  | "watching"
  | "happy"
  | "excited"
  | "pressed"
  | "success"
  | "shy";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const nameMessages = [
  "A visitor. State your name.",
  "Typing detected. Go on, I'm watching.",
];

const buttonMessages = [
  "Ooh. Do it. Press it.",
  "This is my favorite part.",
];

const pressMessages = [
  "Ahh. That's the stuff.",
  "Mmm. Satisfying.",
  "Beep. Do that again.",
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
}) => {
  // =========================================================
  // AUTH MODE
  // =========================================================

  const [mode, setMode] = useState<AuthMode>("login");

  // =========================================================
  // FORM STATE
  // =========================================================

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // =========================================================
  // ROBOT STATE
  // =========================================================

  const [mood, setMood] = useState<RobotMood>("idle");
  const [turnedAway, setTurnedAway] = useState(false);
  const [hyped, setHyped] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [spinning, setSpinning] = useState(false);

  // =========================================================
  // SPEECH BUBBLE
  // =========================================================

  const [message, setMessage] = useState(
    "Hi. I'm Volt. I guard this form."
  );

  const [bubblePop, setBubblePop] = useState(false);

  // =========================================================
  // EYE / HEAD MOVEMENT
  // =========================================================

  const [eyeX, setEyeX] = useState(0);
  const [eyeY, setEyeY] = useState(0);

  const [headRotateY, setHeadRotateY] = useState(0);
  const [headRotateX, setHeadRotateX] = useState(0);

  // =========================================================
  // LOGIN STATE
  // =========================================================

  const [done, setDone] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [buttonSuccess, setButtonSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  // =========================================================
  // PASSWORD METER
  // =========================================================

  const [passwordLevel, setPasswordLevel] = useState(0);

  // =========================================================
  // BLINK
  // =========================================================

  const [blinking, setBlinking] = useState(false);

  // =========================================================
  // REDUCED MOTION
  // =========================================================

  const [reduceMotion, setReduceMotion] = useState(false);

  // =========================================================
  // REFS
  // =========================================================

  const robotRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  // =========================================================
  // REDUCED MOTION DETECTION
  // =========================================================

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const handleChange = () => {
      setReduceMotion(media.matches);
    };

    handleChange();

    media.addEventListener("change", handleChange);

    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, []);

  // =========================================================
  // CLEAN TIMERS
  // =========================================================

  useEffect(() => {
    return () => {
      if (pressTimerRef.current !== null) {
        window.clearTimeout(pressTimerRef.current);
      }

      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  // =========================================================
  // SPEECH
  // =========================================================

  const say = (text: string) => {
    setMessage((previous) => {
      if (previous === text) {
        return previous;
      }
      return text;
    });

    setBubblePop(false);

    requestAnimationFrame(() => {
      setBubblePop(true);
    });
  };

  // =========================================================
  // MOOD
  // =========================================================

  const changeMood = (nextMood: RobotMood) => {
    if (!done) {
      setMood(nextMood);
    }
  };

  // =========================================================
  // EYES
  // =========================================================

  const look = (x: number, y: number) => {
    setEyeX(x);
    setEyeY(y);
  };

  // =========================================================
  // HEAD TILT
  // =========================================================

  const tilt = (ry: number, rx: number) => {
    setHeadRotateY(ry);
    setHeadRotateX(rx);
  };

  // =========================================================
  // FOLLOW TYPING
  // =========================================================

  const followTyping = (value: string) => {
    const ratio = Math.min(value.length / 22, 1);

    look(-6 + 12 * ratio, 5);
    tilt(-5 + 10 * ratio, -8);
  };

  // =========================================================
  // NAME
  // =========================================================

  const handleNameFocus = () => {
    setTurnedAway(false);
    changeMood("watching");
    say(pick(nameMessages));
    followTyping(name);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    followTyping(value);

    const trimmed = value.trim();
    if (trimmed.length >= 2) {
      say(`${trimmed}. Solid name. Filed forever.`);
    } else if (trimmed.length === 0) {
      say("Deleted. I've already forgotten it. Mostly.");
    }
  };

  // =========================================================
  // EMAIL
  // =========================================================

  const handleEmailFocus = () => {
    setTurnedAway(false);
    changeMood("watching");
    say("Email next. I don't do spam — I don't even have an inbox.");
    followTyping(email);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    followTyping(value);

    if (EMAIL_RE.test(value.trim())) {
      changeMood("happy");
      say(
        pick([
          "Now that is a proper email. Respect.",
          "Valid address detected. Quietly delighted.",
        ])
      );
    } else {
      changeMood("watching");
      if (value.includes("@")) {
        say("Close. My sensors say: not yet.");
      }
    }
  };

  // =========================================================
  // PASSWORD
  // =========================================================

  const handlePasswordFocus = () => {
    changeMood("shy");
    setTurnedAway(true);
    look(0, 0);
    tilt(0, 0);
    say("A secret? Say no more. *turns around*");
  };

  const handlePasswordBlur = () => {
    setTurnedAway(false);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);

    let score = 0;
    if (value.length >= 8) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^a-zA-Z0-9]/.test(value)) score++;
    if (value.length > 0 && score === 0) score = 1;

    setPasswordLevel(score);
  };

  // =========================================================
  // CONFIRM PASSWORD
  // =========================================================

  const handleConfirmPasswordFocus = () => {
    changeMood("shy");
    setTurnedAway(true);
    look(0, 0);
    tilt(0, 0);
    say("Confirming it? Still facing the wall. No peeking.");
  };

  const handleConfirmPasswordBlur = () => {
    setTurnedAway(false);
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (value && password && value === password) {
      say("Match confirmed! My sensors approve.");
    }
  };

  // =========================================================
  // PASSWORD LABEL
  // =========================================================

  const passwordLabels = [
    "NOT LOOKING",
    "TOO SHORT",
    "GETTING THERE",
    "STRONG",
    "FORT KNOX",
  ];

  const passwordLabel =
    passwordLabels[
      Math.min(passwordLevel, passwordLabels.length - 1)
    ];

  // =========================================================
  // PASSWORD SHOW / HIDE
  // =========================================================

  const togglePassword = () => {
    const nextShow = !showPassword;
    setShowPassword(nextShow);
    if (nextShow) {
      say("Revealing it? Good thing I'm facing the wall.");
    }
  };

  const toggleConfirmPassword = () => {
    const nextShow = !showConfirmPassword;
    setShowConfirmPassword(nextShow);
  };

  // =========================================================
  // BUTTON HOVER
  // =========================================================

  const handleHype = (active: boolean) => {
    if (done) return;
    if (active && pressed) return;

    setHyped(active);

    if (active) {
      setTurnedAway(false);
      changeMood("excited");
      say(pick(buttonMessages));
    } else {
      changeMood("idle");
      say("The button misses you already.");
    }
  };

  // =========================================================
  // BUTTON PRESS
  // =========================================================

  const handlePointerDown = () => {
    if (done) return;

    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
    }

    setPressed(true);
    setMood("pressed");
    say(pick(pressMessages));
  };

  const releasePress = () => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
    }

    pressTimerRef.current = window.setTimeout(() => {
      setPressed(false);
      if (!done) {
        setMood("excited");
      }
    }, 340);
  };

  // =========================================================
  // SWITCH MODE
  // =========================================================

  const handleSwitchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setFormError(null);
    setSuccessNotice(null);
    setPassword("");
    setConfirmPassword("");
    setPasswordLevel(0);
    setTurnedAway(false);
    setMood("idle");

    if (nextMode === "signup") {
      say("New human detected! Tell me your name and email.");
    } else {
      say("Welcome back! Enter your email and password.");
    }
  };

  // =========================================================
  // SHAKE TRIGGER
  // =========================================================

  const triggerShake = () => {
    setShake(false);
    requestAnimationFrame(() => {
      setShake(true);
    });
  };

  // =========================================================
  // CONFETTI
  // =========================================================

  const createConfetti = () => {
    if (!stageRef.current) return;

    const button = stageRef.current.querySelector(
      ".login-btn"
    ) as HTMLElement | null;

    if (!button) return;

    const colors = [
      "#ff6b4b",
      "#2ec4b6",
      "#ffc53d",
      "#23252d",
      "#fffdf8",
    ];

    const origin = button.getBoundingClientRect();
    const host = stageRef.current.getBoundingClientRect();

    const ox = origin.left - host.left + origin.width / 2;
    const oy = origin.top - host.top;

    for (let i = 0; i < 70; i++) {
      const bit = document.createElement("span");
      bit.className = "login-confetti";
      bit.style.background = pick(colors);

      if (Math.random() > 0.5) {
        bit.style.borderRadius = "50%";
      }

      stageRef.current.appendChild(bit);

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const speed = 240 + Math.random() * 380;
      const tx = Math.cos(angle) * speed;
      const ty = Math.sin(angle) * speed;
      const rotation = 540 * (Math.random() > 0.5 ? 1 : -1);

      const animation = bit.animate(
        [
          {
            transform: `translate(${ox}px, ${oy}px) rotate(0deg) scale(1)`,
            opacity: 1,
          },
          {
            transform: `translate(${ox + tx}px, ${oy + ty + 320}px) rotate(${rotation}deg) scale(.6)`,
            opacity: 0,
          },
        ],
        {
          duration: 1100 + Math.random() * 700,
          easing: "cubic-bezier(.15,.6,.35,1)",
        }
      );

      animation.onfinish = () => {
        bit.remove();
      };
    }
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (done || isLoggingIn) return;

    setFormError(null);
    setSuccessNotice(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    let errorMessage = "";
    let errorField = "";

    if (mode === "signup") {
      if (!trimmedName) {
        errorMessage = "Still don't know your name.";
        errorField = "name";
      } else if (!trimmedEmail) {
        errorMessage = "Email is required to sign up.";
        errorField = "email";
      } else if (!EMAIL_RE.test(trimmedEmail)) {
        errorMessage = "That email isn't a real place.";
        errorField = "email";
      } else if (!password) {
        errorMessage = "A password would help.";
        errorField = "password";
      } else if (password.length < 6) {
        errorMessage = "Password must be at least 6 characters.";
        errorField = "password";
      } else if (password !== confirmPassword) {
        errorMessage = "Passwords do not match.";
        errorField = "confirm-password";
      }
    } else {
      // LOGIN MODE
      if (!trimmedEmail) {
        errorMessage = "Please enter your email.";
        errorField = "email";
      } else if (!EMAIL_RE.test(trimmedEmail)) {
        errorMessage = "That email isn't a real place.";
        errorField = "email";
      } else if (!password) {
        errorMessage = "A password would help.";
        errorField = "password";
      }
    }

    if (errorField) {
      triggerShake();
      setFormError(errorMessage);

      window.setTimeout(() => {
        say(errorMessage);
        changeMood("watching");
        document.getElementById(errorField)?.focus();
      }, 380);

      return;
    }

    // -------------------------------------------------------
    // AUTHENTICATE WITH BACKEND
    // -------------------------------------------------------

    setIsLoggingIn(true);
    setDone(true);
    setTurnedAway(false);
    setHyped(false);
    setPressed(false);

    try {
      if (mode === "signup") {
        await signupUser({
          name: trimmedName,
          email: trimmedEmail,
          password: password,
        });

        // SUCCESSFUL SIGNUP
        // Do NOT bypass login. Return to login mode with prefilled email.
        setIsLoggingIn(false);
        setDone(false);
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        setPasswordLevel(0);
        setTurnedAway(false);
        setSuccessNotice("Account created successfully! Please log in with your password.");
        changeMood("happy");
        say("Account created successfully! Please log in.");

        window.setTimeout(() => {
          document.getElementById("password")?.focus();
        }, 200);

        return;
      }

      // LOGIN MODE
      const loggedInUser = await loginUser({
        email: trimmedEmail,
        password: password,
      });

      // SUCCESS
      setMood("success");
      say(`Access granted. Welcome, ${loggedInUser.name}.`);
      setButtonSuccess(true);
      setEyeX(0);
      setEyeY(0);
      setHeadRotateY(0);
      setHeadRotateX(0);
      setIsLoggingIn(false);

      // SAVE SAFE USER INFO TO LOCALSTORAGE
      localStorage.setItem(
        "clearmed_user",
        JSON.stringify({
          name: loggedInUser.name,
          email: loggedInUser.email,
        })
      );

      // SUCCESS ANIMATION
      if (!reduceMotion) {
        setSpinning(true);
        window.setTimeout(() => {
          setSpinning(false);
        }, 950);
        createConfetti();
      }

      // PASS LOGIN TO PARENT
      window.setTimeout(() => {
        onLogin(loggedInUser.name, loggedInUser.email);
      }, 500);

    } catch (err: any) {
      setIsLoggingIn(false);
      setDone(false);
      setButtonSuccess(false);

      const displayError = err.message || (mode === "signup" ? "Could not create account." : "Invalid email or password.");
      setFormError(displayError);
      triggerShake();

      say(displayError);
      changeMood("watching");
    }

    // RESET INTERNAL ROBOT STATE AFTER TIMEOUT
    resetTimerRef.current = window.setTimeout(() => {
      setDone(false);
      setMood("idle");
      setButtonSuccess(false);
      setPressed(false);
      setHyped(false);
      say("Again? I could do this all day.");
    }, 6200);
  };

  // =========================================================
  // BLINK LOOP
  // =========================================================

  useEffect(() => {
    let timeoutId: number;

    const blinkLoop = () => {
      timeoutId = window.setTimeout(() => {
        if (mood !== "success" && !turnedAway && !done) {
          setBlinking(true);
          window.setTimeout(() => {
            setBlinking(false);
          }, 150);
        }
        blinkLoop();
      }, 2600 + Math.random() * 2600);
    };

    blinkLoop();

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [mood, turnedAway, done]);

  // =========================================================
  // MOUSE TRACKING
  // =========================================================

  useEffect(() => {
    let rafPending = false;

    const handleMouseMove = (event: MouseEvent) => {
      if (done) return;

      const active = document.activeElement;
      if (active && active.tagName === "INPUT") return;
      if (rafPending) return;

      rafPending = true;

      requestAnimationFrame(() => {
        rafPending = false;
        if (!robotRef.current) return;

        const rect = robotRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const dx = Math.max(-1, Math.min(1, (event.clientX - cx) / 260));
        const dy = Math.max(-1, Math.min(1, (event.clientY - cy) / 260));

        look(dx * 7, dy * 6);

        if (!turnedAway) {
          tilt(dx * 12, -dy * 9);
        }
      });
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [done, turnedAway]);

  // =========================================================
  // CSS CLASSES
  // =========================================================

  const stageClassName = [
    "login-stage",
    hyped ? "login-is-hyped" : "",
    pressed ? "login-is-pressed" : "",
    turnedAway ? "login-is-turned" : "",
    spinning ? "login-is-spinning" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const robotStyle = {
    "--login-lx": `${eyeX}px`,
    "--login-ly": `${eyeY}px`,
    "--login-ry": `${headRotateY}deg`,
    "--login-rx": `${headRotateX}deg`,
  } as React.CSSProperties;

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="login-scene">
      <main className={stageClassName} ref={stageRef}>
        {/* ===================================================
            ROBOT
        =================================================== */}

        <div
          className="login-robot"
          ref={robotRef}
          data-mood={mood}
          style={robotStyle}
        >
          {/* Speech Bubble */}
          <div
            className={[
              "login-bubble",
              bubblePop ? "login-pop" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            role="status"
            aria-live="polite"
          >
            {message}
          </div>

          {/* Antenna */}
          <div className="login-antenna" aria-hidden="true">
            <span className="login-antenna-rod" />
            <span className="login-antenna-tip" />
          </div>

          {/* 3D Head */}
          <div className="login-head3d" aria-hidden="true">
            <div className="login-head">
              {/* Ears */}
              <span className="login-ear login-ear-left" />
              <span className="login-ear login-ear-right" />

              {/* Front Face */}
              <div className="login-face login-face-front">
                <div className="login-visor">
                  <div
                    className={[
                      "login-eyes",
                      blinking ? "login-blink" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span className="login-eye login-eye-left" />
                    <span className="login-eye login-eye-right" />
                  </div>

                  <span className="login-cheek login-cheek-left" />
                  <span className="login-cheek login-cheek-right" />
                  <span className="login-mouth" />
                </div>
              </div>

              {/* Back Face */}
              <div className="login-face login-face-back">
                <div className="login-panel">
                  <span className="login-panel-lights">
                    <i />
                    <i />
                    <i />
                  </span>

                  <div className="login-meter" data-lvl={passwordLevel}>
                    {[0, 1, 2, 3].map((index) => (
                      <i
                        key={index}
                        className={index < passwordLevel ? "on" : ""}
                      />
                    ))}
                  </div>

                  <p>{passwordLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            AUTH FORM CARD
        =================================================== */}

        <form
          className={[
            "login-card",
            shake ? "login-shake" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Robot Hands */}
          <span className="login-hand login-hand-left" aria-hidden="true" />
          <span className="login-hand login-hand-right" aria-hidden="true" />

          {/* Title */}
          <h1 className="login-title">
            {mode === "signup" ? "Create your ClearMed account" : "Beep boop. Who goes there?"}
          </h1>

          {/* Error Banner */}
          {formError && (
            <div className="login-error-banner" role="alert">
              {formError}
            </div>
          )}

          {/* Success Banner */}
          {successNotice && (
            <div className="login-success-banner" role="status">
              {successNotice}
            </div>
          )}

          {/* =================================================
              NAME (ONLY IN SIGN UP MODE)
          ================================================= */}
          {mode === "signup" && (
            <label className="login-field">
              <svg
                className="login-field-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-3.9 0-8 2-8 5v1.5h16V19c0-3-4.1-5-8-5Z" />
              </svg>

              <input
                id="name"
                type="text"
                placeholder="Your full name"
                autoComplete="name"
                aria-label="Your full name"
                value={name}
                onFocus={handleNameFocus}
                onChange={(event) => handleNameChange(event.target.value)}
              />
            </label>
          )}

          {/* =================================================
              EMAIL (BOTH MODES)
          ================================================= */}
          <label className="login-field">
            <svg
              className="login-field-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm8 7.3L4.4 7h15.2L12 12.3ZM4 9.2V17h16V9.2l-8 5.3-8-5.3Z" />
            </svg>

            <input
              id="email"
              type="email"
              placeholder="Your email address"
              autoComplete="email"
              aria-label="Your email address"
              value={email}
              onFocus={handleEmailFocus}
              onChange={(event) => handleEmailChange(event.target.value)}
            />
          </label>

          {/* =================================================
              PASSWORD (BOTH MODES)
          ================================================= */}
          <label className="login-field">
            <svg
              className="login-field-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 0 1 6 0v3H9Zm3 4a2 2 0 0 1 1 3.7V19h-2v-1.3a2 2 0 0 1 1-3.7Z" />
            </svg>

            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={mode === "signup" ? "Create a secure password" : "Super secret password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              aria-label="Password"
              value={password}
              onFocus={handlePasswordFocus}
              onBlur={handlePasswordBlur}
              onChange={(event) => handlePasswordChange(event.target.value)}
            />

            <button
              className="login-peek"
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={togglePassword}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5c-5 0-9.3 3.1-11 7.5C2.7 16.9 7 20 12 20s9.3-3.1 11-7.5C21.3 8.1 17 5 12 5Zm0 12.5a5 5 0 1 1 5-5 5 5 0 0 1-5 5Zm0-8a3 3 0 1 0 3 3 3 3 0 0 0-3-3Z" />
              </svg>
            </button>
          </label>

          {/* =================================================
              CONFIRM PASSWORD (ONLY IN SIGN UP MODE)
          ================================================= */}
          {mode === "signup" && (
            <label className="login-field">
              <svg
                className="login-field-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 0 1 6 0v3H9Zm3 4a2 2 0 0 1 1 3.7V19h-2v-1.3a2 2 0 0 1 1-3.7Z" />
              </svg>

              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                autoComplete="new-password"
                aria-label="Confirm password"
                value={confirmPassword}
                onFocus={handleConfirmPasswordFocus}
                onBlur={handleConfirmPasswordBlur}
                onChange={(event) => handleConfirmPasswordChange(event.target.value)}
              />

              <button
                className="login-peek"
                type="button"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                aria-pressed={showConfirmPassword}
                onClick={toggleConfirmPassword}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5c-5 0-9.3 3.1-11 7.5C2.7 16.9 7 20 12 20s9.3-3.1 11-7.5C21.3 8.1 17 5 12 5Zm0 12.5a5 5 0 1 1 5-5 5 5 0 0 1-5 5Zm0-8a3 3 0 1 0 3 3 3 3 0 0 0-3-3Z" />
                </svg>
              </button>
            </label>
          )}

          {/* =================================================
              SUBMIT BUTTON
          ================================================= */}
          <button
            className={[
              "login-btn",
              buttonSuccess ? "login-is-success" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            type="submit"
            disabled={isLoggingIn}
            onMouseEnter={() => handleHype(true)}
            onMouseLeave={() => handleHype(false)}
            onFocus={() => handleHype(true)}
            onBlur={() => handleHype(false)}
            onPointerDown={handlePointerDown}
            onPointerUp={releasePress}
            onPointerCancel={releasePress}
            onPointerLeave={() => {
              if (pressed) {
                releasePress();
              }
            }}
          >
            <span className="login-btn-bolt" aria-hidden="true">
              ⚡
            </span>

            <span>
              {buttonSuccess
                ? "ACCESS GRANTED ✓"
                : isLoggingIn
                  ? (mode === "signup" ? "CREATING..." : "CHECKING...")
                  : (mode === "signup" ? "CREATE ACCOUNT" : "LOG ME IN")}
            </span>
          </button>

          {/* =================================================
              LOGIN / SIGNUP SWITCH TOGGLE
          ================================================= */}
          <div className="login-switch">
            {mode === "login" ? (
              <>
                Don't have an account?
                <button
                  type="button"
                  className="login-switch-btn"
                  onClick={() => handleSwitchMode("signup")}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?
                <button
                  type="button"
                  className="login-switch-btn"
                  onClick={() => handleSwitchMode("login")}
                >
                  Back to Login
                </button>
              </>
            )}
          </div>

          {/* Robot Feet */}
          <span className="login-foot login-foot-left" aria-hidden="true" />
          <span className="login-foot login-foot-right" aria-hidden="true" />
        </form>
      </main>
    </div>
  );
};

export default LoginPage;
