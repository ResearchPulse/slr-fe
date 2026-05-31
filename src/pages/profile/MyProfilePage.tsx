import React, { useState, useEffect } from "react";
import {
  FiEdit2,
  FiCopy,
  FiCheck,
  FiShield,
  FiUser,
  FiMail,
  FiKey,
  FiX,
  FiInfo,
} from "react-icons/fi";
import Button from "../../components/ui/Button";
import FormField from "../../components/ui/FormField";
import Input from "../../components/ui/Input";
import { cn } from "../../utils/cn";
import {
  useUserProfile,
  useUpdateUserMutation,
  useChangePasswordMutation,
} from "../../hooks/useUsers";
import { toast } from "react-hot-toast";

// Role Badge Styles — aligned to design system
const ROLE_BADGE_STYLES: Record<string, string> = {
  Admin: "border-accent text-accent",
  Reviewer: "border-border text-text-secondary",
  Client: "border-border text-text-secondary",
};

const getInitials = (name: string) =>
  name ? name.trim().charAt(0).toUpperCase() : "";

/** Inline editable field component */
const EditableField: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  onSave: (val: string) => void;
}> = ({ icon, label, value, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const handleSave = () => {
    if (draft.trim() && draft.trim() !== value) {
      onSave(draft.trim());
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  return (
    <div className="flex items-start gap-4 py-4 group border-b border-border last:border-0">
      <div className="flex-shrink-0 w-8 h-8 border border-border flex items-center justify-center text-text-secondary mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <label className="text-[11px] uppercase tracking-[0.2em] text-text-secondary font-medium">
          {label}
        </label>
        {editing ? (
          <div className="flex items-center gap-2 mt-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              autoFocus
              className="h-9 text-sm"
              aria-label={`Edit ${label}`}
            />
            <button
              onClick={handleSave}
              className="flex-shrink-0 w-9 h-9 bg-text-primary text-bg-primary flex items-center justify-center hover:bg-[#2a2a2a] transition-colors"
              aria-label="Save"
            >
              <FiCheck className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="flex-shrink-0 w-9 h-9 border border-border text-text-secondary flex items-center justify-center hover:bg-bg-secondary transition-colors"
              aria-label="Cancel"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="text-text-primary font-medium text-sm truncate">
              {value}
            </span>
            <button
              onClick={() => setEditing(true)}
              className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-7 h-7 text-text-secondary hover:text-accent flex items-center justify-center transition-all"
              aria-label={`Edit ${label}`}
            >
              <FiEdit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ReadOnlyField: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  copyable?: boolean;
}> = ({ icon, label, value, copyable }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="flex items-start gap-4 py-4 group border-b border-border last:border-0">
      <div className="flex-shrink-0 w-8 h-8 border border-border flex items-center justify-center text-text-secondary mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <label className="text-[11px] uppercase tracking-[0.2em] text-text-secondary font-medium">
          {label}
        </label>
        <div className="flex items-center justify-between gap-2 mt-1">
          <span
            className={cn(
              "text-text-primary font-medium text-sm truncate",
              label.toLowerCase().includes("id") &&
                "font-mono text-xs tracking-tight text-text-secondary",
            )}
          >
            {value}
          </span>
          {copyable && (
            <button
              onClick={handleCopy}
              className="flex-shrink-0 w-7 h-7 text-text-secondary hover:text-accent flex items-center justify-center transition-colors relative"
              aria-label={`Copy ${label}`}
            >
              {copied ? (
                <FiCheck className="w-3.5 h-3.5 text-accent" />
              ) : (
                <FiCopy className="w-3.5 h-3.5" />
              )}
              {copied && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-text-primary text-bg-primary text-[10px] px-2 py-0.5 whitespace-nowrap">
                  Copied!
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const MyProfilePage: React.FC = () => {
  const { user, isLoading, isError, error } = useUserProfile();
  const { updateUser } = useUpdateUserMutation();
  const { changePassword } = useChangePasswordMutation();
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleUpdateProfile = async (
    field: "fullName" | "username",
    value: string,
  ) => {
    if (!user) return;

    // Safety check to ensure we only update allowed fields
    if (field !== "fullName" && field !== "username") return;

    try {
      await updateUser({
        id: user.id,
        fullName: field === "fullName" ? value : user.fullName,
        email: user.email, // Keep existing email as it cannot be changed from this page
        username: field === "username" ? value : user.username,
      });
      toast.success(
        `${field === "fullName" ? "Full Name" : "Username"} updated successfully`,
      );
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords don't match." });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await changePassword({
        oldPassword: currentPassword,
        newPassword: newPassword,
      });

      const successMsg = response.message || "Password successfully updated!";
      setStatus({ type: "success", message: successMsg });
      toast.success(successMsg);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setIsResettingPassword(false);
        setStatus(null);
      }, 2500);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update password.";
      setStatus({ type: "error", message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-text-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] uppercase tracking-[0.2em] text-text-secondary">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="bg-surface-white border border-border p-8 text-center max-w-md mx-4">
          <div className="w-12 h-12 border border-accent flex items-center justify-center text-accent mx-auto mb-6">
            <FiInfo className="w-6 h-6" />
          </div>
          <h2 className="font-cormorant text-[28px] font-normal text-text-primary mb-2">
            Something went wrong
          </h2>
          <p className="text-text-secondary text-sm mb-6">
            {error || "Failed to load profile. Please try again later."}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const roleBadgeStyle =
    ROLE_BADGE_STYLES[user.role] || "border-border text-text-secondary";

  return (
    <div className="min-h-screen bg-bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="border border-border overflow-hidden">
          {/* Dark editorial banner */}
          <div className="h-28 bg-text-primary relative">
            {/* Subtle decorative lines */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-bg-primary" />
            </div>
            <p className="absolute bottom-4 left-6 text-[10px] uppercase tracking-[0.3em] text-bg-primary/40">
              User Profile
            </p>
          </div>

          <div className="px-6 pb-6 bg-surface-white">
            <div className="relative flex items-end justify-between -mt-8 mb-6">
              {/* Avatar */}
              <div className="w-16 h-16 bg-accent flex items-center justify-center text-bg-primary text-xl font-medium border-2 border-surface-white select-none">
                {getInitials(user.fullName)}
              </div>

              <span
                className={cn(
                  "px-2.5 py-0.5 text-[11px] uppercase tracking-[0.1em] font-medium border",
                  roleBadgeStyle,
                )}
              >
                {user.role}
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="font-cormorant text-[32px] font-normal text-text-primary leading-tight">
                {user.fullName}
              </h1>
              <p className="text-text-secondary text-sm">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Account Information Section */}
        <section className="border border-border bg-surface-white">
          <div className="px-6 py-4 border-b border-border bg-bg-primary">
            <p className="text-[11px] uppercase tracking-[0.25em] text-text-secondary">
              Account Information
            </p>
          </div>

          <div className="px-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <ReadOnlyField
              icon={<FiKey className="w-4 h-4" />}
              label="User ID"
              value={user.id}
              copyable
            />
            <ReadOnlyField
              icon={<FiMail className="w-4 h-4" />}
              label="Email Address"
              value={user.email}
            />
            <EditableField
              icon={<FiUser className="w-4 h-4" />}
              label="Full Name"
              value={user.fullName}
              onSave={(val) => handleUpdateProfile("fullName", val)}
            />
            <EditableField
              icon={<FiUser className="w-4 h-4" />}
              label="Username"
              value={user.username}
              onSave={(val) => handleUpdateProfile("username", val)}
            />
          </div>
        </section>

        {/* Security & Password Section */}
        <section className="border border-border bg-surface-white">
          <div className="px-6 py-4 border-b border-border bg-bg-primary">
            <p className="text-[11px] uppercase tracking-[0.25em] text-text-secondary">
              Security
            </p>
          </div>

          <div className="p-6">
            {!isResettingPassword ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 border border-border flex items-center justify-center text-text-secondary">
                    <FiShield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-text-primary">
                      Password
                    </p>
                    <p className="text-[12px] text-text-secondary">
                      Protect your account with a strong password.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsResettingPassword(true)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-text-secondary">
                    Change Password
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResettingPassword(false);
                      setStatus(null);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                {status && (
                  <div
                    className={cn(
                      "p-3 flex items-center gap-3 text-sm border",
                      status.type === "success"
                        ? "bg-bg-primary text-text-primary border-border"
                        : "bg-surface-white text-accent border-accent",
                    )}
                  >
                    {status.type === "success" ? (
                      <FiCheck className="w-4 h-4 shrink-0" />
                    ) : (
                      <FiInfo className="w-4 h-4 shrink-0" />
                    )}
                    {status.message}
                  </div>
                )}

                <div className="space-y-5">
                  <FormField
                    id="current-password"
                    label="Current Password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField
                      id="new-password"
                      label="New Password"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      helperText="At least 8 characters"
                    />
                    <FormField
                      id="confirm-password"
                      label="Confirm Password"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      errorMessage={
                        confirmPassword && newPassword !== confirmPassword
                          ? "Passwords do not match"
                          : undefined
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={
                      isSubmitting ||
                      (!!newPassword && newPassword !== confirmPassword)
                    }
                    className="flex-1"
                  >
                    Update Password
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsResettingPassword(false);
                      setStatus(null);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    disabled={isSubmitting}
                    className="px-8"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MyProfilePage;
