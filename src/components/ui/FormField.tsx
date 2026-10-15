import React, { useState } from "react";
import Label from "./Label";
import Input, { type InputProps } from "./Input";
import HelperText from "./HelperText";
import { cn } from "../../utils/cn";
import { FiEye, FiEyeOff } from "react-icons/fi";

interface FormFieldProps extends InputProps {
  id: string;
  label: string;
  errorMessage?: string;
  helperText?: string;
  containerClassName?: string;
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      id,
      label,
      errorMessage,
      helperText,
      containerClassName,
      className,
      type,
      required = false,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const hasError = !!errorMessage;
    const isPasswordType = type === "password";

    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        <Label htmlFor={id}>
          {label}
          {required && (
            <>
              <span aria-hidden="true" className="ml-1 text-error">*</span>
              <span className="sr-only"> (required)</span>
            </>
          )}
        </Label>
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            type={isPasswordType ? (showPassword ? "text" : "password") : type}
            required={required}
            error={hasError}
            className={cn(className, isPasswordType && "pr-10")}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined
            }
            {...props}
          />
          {isPasswordType && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted transition-colors duration-200 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:text-text-primary"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <FiEyeOff className="w-5 h-5" />
              ) : (
                <FiEye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        {hasError ? (
          <HelperText
            message={errorMessage}
            variant="error"
            id={`${id}-error`} // Ideally helper text would accept ID for a11y
          />
        ) : helperText ? (
          <HelperText
            message={helperText}
            variant="default"
            id={`${id}-helper`}
          />
        ) : null}
      </div>
    );
  },
);

FormField.displayName = "FormField";

export default FormField;
