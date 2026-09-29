import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import { authService } from "../../services/authService";
import { login } from "../../redux/slices/authSlice";
import { toastSuccess, toastError } from "../../utils/toast";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const LoginForm: React.FC = () => {
  const [keyLogin, setKeyLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleGoogleCredentialResponse = async (response: any) => {
    setIsLoading(true);
    try {
      const res = await authService.googleLogin(response.credential);

      if (res.isSuccess) {
        const { accessToken, userId, username, email, role } = res.data;

        dispatch(
          login({
            accessToken,
            accessTokenExpiresAt: res.data.accessTokenExpiresAt,
            user: {
              id: userId,
              name: username,
              email,
              username,
              role,
            },
          }),
        );

        toastSuccess(
          "Welcome to Systematic Review Support System",
          `Hello ${username}`,
        );
        if (role === "Admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        toastError(
          "Login Failed",
          "Google authentication failed. Please try again.",
        );
      }
    } catch (error: any) {
      toastError(
        "Error",
        "Google authentication failed. Please check your credentials or try again later.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]') as HTMLScriptElement;

    const initializeGoogleSignIn = () => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          {
            theme: "outline",
            size: "large",
            width: 320,
            text: "continue_with",
            shape: "rectangular"
          }
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
  }, []);

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

        dispatch(
          login({
            accessToken,
            accessTokenExpiresAt: response.data.accessTokenExpiresAt,
            user: {
              id: userId,
              name: username,
              email,
              username,
              role,
            },
          }),
        );

        toastSuccess(
          "Welcome to Systematic Review Support System",
          `Hello ${response.data.username}`,
        );
        if (role === "Admin") {
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
    } catch (error: any) {
      toastError(
        "Error",
        "Your account does not exist or invalid credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Heading */}
      <div className="w-full text-center mb-8">
        <h2 className="font-cormorant text-[30px] sm:text-[36px] font-normal text-text-primary leading-tight mb-3 tracking-tight">
          Welcome back
        </h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          Sign in to continue to your account
        </p>
      </div>

      {/* Sign-in Card */}
      <div className="w-full bg-surface-white border border-border rounded-[4px] px-6 py-8 sm:px-8">
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
          />

          {/* Forgot password hint (no reset flow exists yet) */}
          <div className="flex justify-end -mt-2">
            <span className="text-[12px] text-text-secondary">
              Forgot password?
            </span>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 text-[12px] uppercase tracking-[0.15em] rounded-[4px]"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </div>
        </form>

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
          <div id="google-signin-btn" className="w-full max-w-[320px] flex justify-center"></div>
        </div>

        {/* Sign-up hint (no registration page exists yet) */}
        <p className="mt-6 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <span className="font-medium text-accent">Sign up</span>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
