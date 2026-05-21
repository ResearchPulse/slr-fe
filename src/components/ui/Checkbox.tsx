import React from "react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

export default function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <input
        type="checkbox"
        {...props}
        className={`h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed ${
          className ?? ""
        }`}
      />
      {label ? <span className="text-sm text-slate-700">{label}</span> : null}
    </label>
  );
}
