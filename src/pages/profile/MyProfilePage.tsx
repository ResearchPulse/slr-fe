import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  FiCheck,
  FiCheckCircle,
  FiCopy,
  FiInfo,
  FiKey,
  FiLock,
  FiMail,
  FiShield,
  FiX,
  FiEdit2,
  FiBriefcase,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import FormField from "../../components/ui/FormField";
import Input from "../../components/ui/Input";
import { cn } from "../../utils/cn";
import {
  useUserProfile,
  useUpdateUserMutation,
  useChangePasswordMutation,
} from "../../hooks/useUsers";
import { useMyProjects } from "../../hooks/useProjects";

const getInitials = (name: string) =>
  name.trim().charAt(0).toUpperCase() || "S";

function CopyField({ label, value, displayValue }: { label: string; value: string; displayValue?: string }) {
  const [copied, setCopied] = useState(false);
  const hasValue = value.length > 0;

  const copyValue = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}.`);
    }
  };

  return (
    <div className="min-w-0 rounded-xl bg-[#F7F9FA] px-4 py-3.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#83939D]">{label}</p>
      <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2">
        <p className="min-w-0 truncate text-[13px] font-semibold text-[#173247]" title={displayValue || value}>{displayValue ?? value}</p>
        <button
          type="button"
          onClick={copyValue}
          title={copied ? "Copied" : "Copy"}
          aria-label={`${copied ? "Copied" : "Copy"} ${label}`}
          disabled={!hasValue}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#718591] transition hover:bg-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? <FiCheck className="h-3.5 w-3.5 text-[#2E8B60]" /> : <FiCopy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

function InformationField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#F7F9FA] px-4 py-3.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#83939D]">{label}</p>
      <p className="mt-1.5 truncate text-[13px] font-semibold text-[#173247]" title={value}>{value}</p>
    </div>
  );
}

const MyProfilePage: React.FC = () => {
  const { user, isLoading, isError, error, refetch, isFetching } = useUserProfile();
  const { updateUser, isLoading: isProfileSaving } = useUpdateUserMutation();
  const { changePassword } = useChangePasswordMutation();
  const { projects, data: projectsData } = useMyProjects({ pageNumber: 1, pageSize: 100 });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ fullName: "", username: "" });
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (user && !isEditingProfile) {
      setProfileDraft({ fullName: user.fullName || "", username: user.username || "" });
    }
  }, [user, isEditingProfile]);

  useEffect(() => {
    const revealItems = document.querySelectorAll<HTMLElement>(".profile-scroll-reveal");
    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -24px 0px" },
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [isLoading, user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    const fullName = profileDraft.fullName.trim();
    const username = profileDraft.username.trim();
    if (!fullName || !username) {
      toast.error("Full name and username are required.");
      return;
    }
    if (fullName === user.fullName && username === user.username) {
      setIsEditingProfile(false);
      return;
    }

    try {
      await updateUser({ id: user.id, fullName, email: user.email, username });
      toast.success("Profile updated successfully.");
      setIsEditingProfile(false);
    } catch {
      toast.error("Could not update your profile.");
    }
  };

  const handleCancelProfileEdit = () => {
    setProfileDraft({ fullName: user?.fullName || "", username: user?.username || "" });
    setIsEditingProfile(false);
  };

  const resetPasswordForm = () => {
    setIsResettingPassword(false);
    setStatus(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match." });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await changePassword({ oldPassword: currentPassword, newPassword });
      const successMessage = response.message || "Password successfully updated.";
      setStatus({ type: "success", message: successMessage });
      toast.success(successMessage);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => {
        setIsResettingPassword(false);
        setStatus(null);
      }, 2200);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "Could not update password.";
      setStatus({ type: "error", message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center bg-[#F6F9FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#087BC1] border-t-transparent" />
          <p className="text-[11px] font-semibold text-[#71838F]">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center bg-[#F6F9FB] px-4">
        <div className="w-full max-w-md rounded-2xl border border-[#DCE6EC] bg-white p-8 text-center shadow-[0_12px_35px_rgba(19,43,60,0.06)]">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF6FB] text-primary"><FiInfo className="h-5 w-5" /></div>
          <h2 className="text-xl font-bold text-[#173247]">Could not load your profile</h2>
          <p className="mt-2 text-sm leading-6 text-[#71838F]">{error || "Please try again in a moment."}</p>
          <Button className="mx-auto mt-6" onClick={() => void refetch()} isLoading={isFetching}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const displayName = user.fullName?.trim() || user.username?.trim() || "SLRS User";
  const displayUsername = user.username?.trim() || "Username not set";
  const userId = user.id || (user as typeof user & { uid?: string }).uid || "";
  const roleLabel = user.role?.trim() || "User";
  const isAccountActive = user.isActive !== false;
  const activeProjects = projects.filter((project) => project.statusText === "Active").length;
  const roleBadgeStyle = user.role?.toLowerCase() === "admin"
    ? "bg-[#EEF3FA] text-[#405F91]"
    : "bg-[#EAF4FA] text-[#236E99]";

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#F6F9FB] px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
      <main className="mx-auto max-w-[1160px] space-y-8">
        <header className="profile-scroll-reveal scroll-reveal mb-1">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Account settings</p>
          <h1 className="text-[32px] font-bold tracking-[-0.045em] text-[#102B3D] sm:text-[38px]">Profile</h1>
          <p className="mt-2 text-[14px] text-[#6C7C88]">Manage your personal information and account settings.</p>
        </header>

        <section aria-labelledby="profile-overview-title" className="profile-scroll-reveal scroll-reveal overflow-hidden rounded-[20px] border border-[#DCE6EC] bg-white shadow-[0_10px_32px_rgba(19,43,60,0.045)]">
          <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10 lg:p-8">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[22px] bg-[#087BC1] text-[30px] font-bold tracking-[-0.05em] text-white">
                {getInitials(displayName)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 id="profile-overview-title" className="text-[25px] font-bold leading-tight tracking-[-0.04em] text-[#173247] sm:text-[29px]">{displayName}</h2>
                  <span className={cn("rounded-full px-2.5 py-1 text-[9px] font-bold", roleBadgeStyle)}>{roleLabel}</span>
                </div>
                <p className="mt-1 text-[12px] font-medium text-[#81919B]">@{displayUsername}</p>
                <p className="mt-2 flex min-w-0 items-center gap-1.5 text-[12px] text-[#607582]"><FiMail className="h-3.5 w-3.5 shrink-0 text-[#8A9AA4]" /><span className="truncate">{user.email}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <div className="rounded-xl bg-[#F7F9FA] px-3.5 py-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.11em] text-[#8797A1]">Role</p>
                <p className="mt-1.5 truncate text-[12px] font-bold text-[#173247]">{roleLabel}</p>
              </div>
              <div className="rounded-xl bg-[#F7F9FA] px-3.5 py-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.11em] text-[#8797A1]">Projects</p>
                <p className="mt-1.5 text-[12px] font-bold text-[#173247]">{projectsData?.totalCount ?? projects.length} total <span className="font-medium text-[#84949E]">· {activeProjects} active</span></p>
              </div>
              <div className="col-span-2 rounded-xl bg-[#F7F9FA] px-3.5 py-3 sm:col-span-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.11em] text-[#8797A1]">Account status</p>
                <p className={`mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-bold ${isAccountActive ? "text-[#32815A]" : "text-[#A15F55]"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isAccountActive ? "bg-[#2E9B68]" : "bg-[#C66B5E]"}`} />{isAccountActive ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-[#EDF1F3] bg-[#FCFDFD] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-[11px] text-[#85949D]">Keep your account details up to date.</p>
            {isEditingProfile ? (
              <div className="flex w-full gap-2 sm:w-auto">
                <Button size="sm" variant="outline" onClick={handleCancelProfileEdit} disabled={isProfileSaving} className="flex-1 sm:flex-none">Cancel</Button>
                <Button size="sm" onClick={handleSaveProfile} isLoading={isProfileSaving} className="flex-1 sm:flex-none"><FiCheck className="mr-1.5" />Save changes</Button>
              </div>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setIsEditingProfile(true)} className="w-full sm:w-auto"><FiEdit2 className="mr-2 h-3.5 w-3.5" />Edit profile</Button>
            )}
          </div>
        </section>

        <section aria-labelledby="personal-info-title" className="profile-scroll-reveal scroll-reveal rounded-[20px] border border-[#DCE6EC] bg-white p-5 shadow-[0_10px_32px_rgba(19,43,60,0.035)] sm:p-7">
          <div className="mb-5">
            <h2 id="personal-info-title" className="text-[20px] font-bold tracking-[-0.03em] text-[#173247]">Personal information</h2>
            <p className="mt-1 text-[12px] text-[#7A8B96]">Manage your identity and contact details.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {isEditingProfile ? (
              <label className="rounded-xl bg-[#F7F9FA] px-4 py-3.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#83939D]">Full name</span>
                <Input value={profileDraft.fullName} onChange={(event) => setProfileDraft((draft) => ({ ...draft, fullName: event.target.value }))} autoFocus className="mt-2 h-9 rounded-lg border-[#DCE6EC] bg-white text-[13px]" />
              </label>
            ) : <InformationField label="Full name" value={displayName} />}

            {isEditingProfile ? (
              <label className="rounded-xl bg-[#F7F9FA] px-4 py-3.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#83939D]">Username</span>
                <Input value={profileDraft.username} onChange={(event) => setProfileDraft((draft) => ({ ...draft, username: event.target.value }))} className="mt-2 h-9 rounded-lg border-[#DCE6EC] bg-white text-[13px]" />
              </label>
            ) : <InformationField label="Username" value={displayUsername} />}

            <CopyField label="Email address" value={user.email || "Not provided"} />
            <CopyField label="User ID" value={userId} />
          </div>
          {isEditingProfile && <p className="mt-3 text-[10px] text-[#84949E]">Email address cannot be changed here.</p>}
        </section>

        <section aria-labelledby="security-title" className="profile-scroll-reveal scroll-reveal rounded-[20px] border border-[#DCE6EC] bg-white p-5 shadow-[0_10px_32px_rgba(19,43,60,0.035)] sm:p-7">
          <div className="mb-5">
            <h2 id="security-title" className="text-[20px] font-bold tracking-[-0.03em] text-[#173247]">Security & account</h2>
            <p className="mt-1 text-[12px] text-[#7A8B96]">Manage how you access and protect your account.</p>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl bg-[#F7F9FA] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#397FA8]"><FiLock className="h-[17px] w-[17px]" /></span>
              <div>
                <p className="text-[13px] font-bold text-[#173247]">Password</p>
                <p className="mt-1 text-[11px] leading-5 text-[#7A8B96]">Use a strong password to keep your account secure.</p>
              </div>
            </div>
            {!isResettingPassword && <Button size="sm" variant="secondary" onClick={() => setIsResettingPassword(true)} className="w-full sm:w-auto"><FiKey className="mr-2 h-3.5 w-3.5" />Change password</Button>}
          </div>

          {isResettingPassword && (
            <form onSubmit={handleResetPassword} className="mt-4 rounded-2xl border border-[#E5ECEF] bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><p className="text-[13px] font-bold text-[#173247]">Update password</p><p className="mt-1 text-[11px] text-[#7A8B96]">Choose a new password you do not use elsewhere.</p></div>
                <button type="button" onClick={resetPasswordForm} aria-label="Cancel password change" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#80909A] transition hover:bg-[#F1F5F7] hover:text-[#173247]"><FiX /></button>
              </div>

              {status && <div className={cn("mb-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12px]", status.type === "success" ? "bg-[#EFF8F2] text-[#327B55]" : "bg-[#FBF2F1] text-[#A04F4B]")}>{status.type === "success" ? <FiCheckCircle className="shrink-0" /> : <FiInfo className="shrink-0" />}{status.message}</div>}

              <div className="space-y-4">
                <FormField id="current-password" label="Current password" type="password" placeholder="Enter current password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField id="new-password" label="New password" type="password" placeholder="Enter new password" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} helperText="At least 8 characters" />
                  <FormField id="confirm-password" label="Confirm new password" type="password" placeholder="Re-enter new password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} errorMessage={confirmPassword && newPassword !== confirmPassword ? "Passwords do not match" : undefined} />
                </div>
              </div>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" size="sm" onClick={resetPasswordForm} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" size="sm" isLoading={isSubmitting} disabled={isSubmitting || (!!newPassword && newPassword !== confirmPassword)}><FiCheck className="mr-1.5" />Save password</Button>
              </div>
            </form>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-[#E8EEF1] px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF5FA] text-[#547F9A]"><FiShield className="h-4 w-4" /></span>
              <div><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#8797A1]">Account status</p><p className={`mt-1 text-[12px] font-bold ${isAccountActive ? "text-[#32815A]" : "text-[#A15F55]"}`}>{isAccountActive ? "Active" : "Inactive"}</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[#E8EEF1] px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF5FA] text-[#547F9A]"><FiBriefcase className="h-4 w-4" /></span>
              <div><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#8797A1]">Account role</p><p className="mt-1 text-[12px] font-bold text-[#173247]">{roleLabel}</p></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MyProfilePage;
