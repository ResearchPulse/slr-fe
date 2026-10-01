import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import { authService } from "../../services/authService";
import { login } from "../../redux/slices/authSlice";
import { toastSuccess, toastError } from "../../utils/toast";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const isGoogleSignInConfigured = Boolean(
  GOOGLE_CLIENT_ID?.trim() && FIREBASE_API_KEY?.trim(),
);
const showQuickLogin = import.meta.env.DEV;

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        auto_select: boolean;
        cancel_on_tap_outside: boolean;
      }) => void;
      renderButton: (
        element: HTMLElement | null,
        options: {
          theme: string;
          size: string;
          width: number;
          text: string;
          shape: string;
        },
      ) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

<<<<<<< HEAD
const normalizeGlobalRole = (role?: string | null) =>
  role?.toUpperCase() === "ADMIN" ? "Admin" : role ?? undefined;
=======
const normalizeGlobalRole = (role?: string | null) => {
  if (!role) return undefined;

  const normalizedRole = role.trim().toUpperCase();

  return normalizedRole === "ADMIN" ? "Admin" : role.trim();
};
>>>>>>> origin/dev

const LoginForm: React.FC = () => {
  const [keyLogin, setKeyLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleGoogleCredentialResponse = useCallback(
    async (response: GoogleCredentialResponse) => {
      setIsLoading(true);
      try {
        const res = await authService.googleLogin(response.credential);

        if (res.isSuccess) {
          const { accessToken, userId, username, email, role } = res.data;
          const normalizedRole = normalizeGlobalRole(role);

          dispatch(
            login({
              accessToken,
              accessTokenExpiresAt: res.data.accessTokenExpiresAt,
              user: {
                id: userId,
                name: username,
                email,
                username,
                role: normalizedRole,
              },
            }),
          );

          toastSuccess(
            "Welcome to Systematic Review Support System",
            `Hello ${username}`,
          );
          if (normalizedRole === "Admin") {
            navigate("/admin");
          } else {
            navigate("/");
          }
        } else {
          toastError(
            "Login Failed",
            res.message || "Google authentication was rejected. Please try again.",
          );
        }
      } catch (error) {
        toastError(
          "Google sign-in failed",
          error instanceof Error
            ? error.message
            : "Unknown Google authentication error. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, navigate],
  );

  useEffect(() => {
    if (!isGoogleSignInConfigured) return;

    let script = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    ) as HTMLScriptElement;

    const initializeGoogleSignIn = () => {
      const google = window.google;
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          {
            theme: "outline",
            size: "large",
            width: 320,
            text: "continue_with",
            shape: "rectangular",
          },
        );
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      script.onload = initializeGoogleSignIn;
    } else {
      initializeGoogleSignIn();
    }
  }, [handleGoogleCredentialResponse]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!keyLogin.trim()) {
      newErrors.keyLogin = "Username or email is required";
    } else if (keyLogin.includes("@")) {
      if (!validateEmail(keyLogin)) {
        newErrors.keyLogin = "Please enter a valid email address";
      }
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (/\s/.test(password)) {
      newErrors.password = "Spaces are not allowed in password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await authService.login({ keyLogin, password });

      if (response.isSuccess) {
        const { accessToken, userId, username, email, role } = response.data;
        const normalizedRole = normalizeGlobalRole(role);

        dispatch(
          login({
            accessToken,
            accessTokenExpiresAt: response.data.accessTokenExpiresAt,
            user: {
              id: userId,
              name: username,
              email,
              username,
              role: normalizedRole,
            },
          }),
        );

        toastSuccess(
          "Welcome to Systematic Review Support System",
          `Hello ${response.data.username}`,
        );
        if (normalizedRole === "Admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        toastError(
          "Login Failed",
          "Your account does not exist or invalid credentials.",
        );

        // Map backend errors if specific fields are provided
        const fieldErrors: Record<string, string> = {};
        response.errors?.forEach((err) => {
          if (err.code.toLowerCase().includes("password"))
            fieldErrors.password = err.message;
          if (
            err.code.toLowerCase().includes("keylogin") ||
            err.code.toLowerCase().includes("username") ||
            err.code.toLowerCase().includes("email")
          ) {
            fieldErrors.keyLogin = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } catch {
      toastError(
        "Error",
        "Your account does not exist or invalid credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (account: "admin" | "leader" | "reviewer") => {
    setIsLoading(true);
    try {
      const response = await authService.quickLogin(account);
      if (!response.isSuccess) {
        throw new Error("Quick login failed");
      }

      const { accessToken, userId, username, email, role } = response.data;
      const normalizedRole = normalizeGlobalRole(role);
      dispatch(
        login({
          accessToken,
          accessTokenExpiresAt: response.data.accessTokenExpiresAt,
          user: { id: userId, name: username, email, username, role: normalizedRole },
        }),
      );
      toastSuccess("Welcome to Systematic Review Support System", `Hello ${username}`);
      navigate(normalizedRole === "Admin" ? "/admin" : "/");
    } catch {
      toastError("Quick Login Failed", "Check that development authentication is enabled on the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Heading */}
      <div className="w-full text-center mb-9">
        <h2 className="text-[28px] sm:text-[32px] font-semibold text-text-primary leading-tight mb-3 tracking-[-0.01em]">
          Welcome back
        </h2>
        <p className="text-text-secondary text-base leading-relaxed">
          Sign in to continue to your account
        </p>
      </div>

      {/* Sign-in Card */}
      <div className="w-full bg-surface-white border border-border rounded-[16px] shadow-[0_1px_3px_rgba(18,35,49,0.06)] px-6 py-9 sm:px-9 sm:py-10">
        {/* Login Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <FormField
            id="keyLogin"
            label="Email / Username"
            type="text"
            autoComplete="username"
            placeholder="Enter email or username"
            value={keyLogin}
            onChange={(e) =>
              setKeyLogin(e.target.value.replace(/[^a-zA-Z0-9@._\-+]/g, ""))
            }
            errorMessage={errors.keyLogin}
            disabled={isLoading}
            className="h-[52px]"
          />

          {/* Password Field */}
          <FormField
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value.replace(/\s/g, ""))}
            errorMessage={errors.password}
            disabled={isLoading}
            className="h-[52px]"
          />

          {/* Forgot password hint (no reset flow exists yet) */}
          <div className="flex justify-end -mt-1">
            <span className="text-[13px] text-text-secondary">
              Forgot password?
            </span>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </div>
        </form>

        {showQuickLogin && (
          <div className="mt-5">
            <p className="mb-3 text-center text-[11px] uppercase tracking-wider text-text-secondary">
              Quick login (development)
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isLoading}
                onClick={() => void handleQuickLogin("admin")}
              >
                Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isLoading}
                onClick={() => void handleQuickLogin("leader")}
              >
                Leader
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isLoading}
                onClick={() => void handleQuickLogin("reviewer")}
              >
                Reviewer
              </Button>
            </div>
          </div>
        )}

        {/* OR Divider & Google Login */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-surface-white px-3 text-text-secondary">Or</span>
          </div>
        </div>

        <div className="w-full flex justify-center">
          {isGoogleSignInConfigured ? (
            <div
              id="google-signin-btn"
              className="w-full max-w-[320px] flex justify-center"
            ></div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full max-w-[320px]"
              disabled
            >
              Continue with Google
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
