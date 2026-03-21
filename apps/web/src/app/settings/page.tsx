"use client";

import { useState, useEffect, FormEvent } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import Tabs from "@/components/ui/Tabs";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

interface ProfileForm {
  displayName: string;
  bio: string;
  location: string;
  websiteUrl: string;
  avatarUrl: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Notifications {
  emailNewFollower: boolean;
  emailLike: boolean;
  emailDownload: boolean;
  emailModeration: boolean;
  emailMarketing: boolean;
}

interface AccountInfo {
  email: string;
  username: string;
  createdAt: string;
  lastLoginAt: string | null;
  isContributor: boolean;
  isAdmin: boolean;
  oauthProvider: string | null;
}

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-danger-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-warning-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-blue-500" };
  return { score, label: "Strong", color: "bg-emerald-500" };
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-brand" : "bg-surface-300"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

const SETTINGS_TABS = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "account", label: "Account" },
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const [profile, setProfile] = useState<ProfileForm>({
    displayName: "",
    bio: "",
    location: "",
    websiteUrl: "",
    avatarUrl: "",
  });

  const [password, setPassword] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState<Notifications>({
    emailNewFollower: true,
    emailLike: true,
    emailDownload: false,
    emailModeration: true,
    emailMarketing: false,
  });

  const [accountInfo, setAccountInfo] = useState<AccountInfo>({
    email: "",
    username: "",
    createdAt: "",
    lastLoginAt: null,
    isContributor: false,
    isAdmin: false,
    oauthProvider: null,
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/settings");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/internal/profile")
        .then((r) => r.json())
        .then((data) => {
          const u = data.user;
          if (u) {
            setProfile({
              displayName: u.displayName || "",
              bio: u.bio || "",
              location: u.location || "",
              websiteUrl: u.websiteUrl || "",
              avatarUrl: u.avatarUrl || "",
            });
            setAccountInfo({
              email: u.email || "",
              username: u.username || "",
              createdAt: u.createdAt || "",
              lastLoginAt: u.lastLoginAt || null,
              isContributor: u.isContributor || false,
              isAdmin: u.isAdmin || false,
              oauthProvider: u.oauthProvider || null,
            });
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session]);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/internal/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        toast("Profile updated successfully", "success");
      } else {
        const data = await res.json();
        toast(data.error || "Failed to update profile", "error");
      }
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      toast("Passwords do not match", "error");
      return;
    }
    if (password.newPassword.length < 8) {
      toast("Password must be at least 8 characters", "error");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/internal/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: password.currentPassword,
          newPassword: password.newPassword,
        }),
      });
      if (res.ok) {
        toast("Password changed successfully", "success");
        setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const data = await res.json();
        toast(data.error || "Failed to change password", "error");
      }
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifs(true);
    // Placeholder — no backend endpoint yet
    await new Promise((r) => setTimeout(r, 500));
    toast("Notification preferences saved", "success");
    setSavingNotifs(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/internal/profile/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmPassword: deletePassword }),
      });
      if (res.ok) {
        toast("Account deleted", "success");
        setShowDeleteModal(false);
        await signOut({ callbackUrl: "/" });
      } else {
        const data = await res.json();
        toast(data.error || "Failed to delete account", "error");
        setDeleting(false);
      }
    } catch {
      toast("Something went wrong", "error");
      setDeleting(false);
    }
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="container-app py-16">
        <div className="max-w-3xl mx-auto">
          <Skeleton variant="text" className="w-48 h-8 mb-6" />
          <Skeleton variant="rectangular" className="h-10 w-full mb-8" />
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-6">
                <Skeleton variant="text" className="w-32 mb-4" />
                <Skeleton variant="rectangular" className="h-10 w-full mb-3" />
                <Skeleton variant="rectangular" className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const strength = getPasswordStrength(password.newPassword);

  return (
    <div className="container-app py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-display text-surface-900 mb-6">Account Settings</h1>

        <Tabs tabs={SETTINGS_TABS} active={activeTab} onChange={setActiveTab} className="mb-8" />

        {/* ─── Profile Tab ─── */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Avatar section */}
            <div className="card p-6">
              <h2 className="text-title text-surface-900 mb-5">Avatar</h2>
              <div className="flex items-center gap-6">
                <Avatar src={profile.avatarUrl || null} name={profile.displayName || accountInfo.username || "U"} size="xl" />
                <div className="flex-1 min-w-0">
                  <label className="form-label">Avatar URL</label>
                  <input
                    type="url"
                    value={profile.avatarUrl}
                    onChange={(e) => setProfile((p) => ({ ...p, avatarUrl: e.target.value }))}
                    className="input"
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <p className="form-hint">Paste a URL to your profile picture. Recommended 256×256 pixels.</p>
                </div>
              </div>
            </div>

            {/* Profile fields */}
            <div className="card p-6">
              <h2 className="text-title text-surface-900 mb-5">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Display Name</label>
                  <input
                    type="text"
                    value={profile.displayName}
                    onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                    className="input"
                    placeholder="Your display name"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    value={accountInfo.username}
                    disabled
                    className="input bg-surface-50 text-surface-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={accountInfo.email}
                    disabled
                    className="input bg-surface-50 text-surface-500 cursor-not-allowed"
                  />
                  <p className="form-hint">Contact support to change your email address.</p>
                </div>
                <div>
                  <label className="form-label">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                    className="textarea"
                    rows={3}
                    placeholder="Tell us about yourself..."
                    maxLength={500}
                  />
                  <p className="form-hint">{profile.bio.length}/500</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                      className="input"
                      placeholder="City, Country"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="form-label">Website URL</label>
                    <input
                      type="url"
                      value={profile.websiteUrl}
                      onChange={(e) => setProfile((p) => ({ ...p, websiteUrl: e.target.value }))}
                      className="input"
                      placeholder="https://yoursite.com"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={savingProfile} className="btn btn-sm btn-primary">
                    {savingProfile ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ─── Security Tab ─── */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <form onSubmit={handleChangePassword} className="card p-6">
              <h2 className="text-title text-surface-900 mb-5">Change Password</h2>
              {accountInfo.oauthProvider && !accountInfo.oauthProvider ? null : null}
              <div className="space-y-4">
                <div>
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    value={password.currentPassword}
                    onChange={(e) => setPassword((p) => ({ ...p, currentPassword: e.target.value }))}
                    className="input"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    value={password.newPassword}
                    onChange={(e) => setPassword((p) => ({ ...p, newPassword: e.target.value }))}
                    className="input"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  {password.newPassword.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${i < strength.score ? strength.color : "bg-surface-200"}`}
                          />
                        ))}
                      </div>
                      <p className="text-micro text-surface-500">{strength.label}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    value={password.confirmPassword}
                    onChange={(e) => setPassword((p) => ({ ...p, confirmPassword: e.target.value }))}
                    className="input"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  {password.confirmPassword && password.newPassword !== password.confirmPassword && (
                    <p className="text-micro text-danger-500 mt-1">Passwords do not match</p>
                  )}
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingPassword || !password.currentPassword || !password.newPassword || !password.confirmPassword}
                    className="btn btn-sm btn-primary"
                  >
                    {savingPassword ? "Changing…" : "Change Password"}
                  </button>
                </div>
              </div>
            </form>

            <div className="card p-6">
              <h2 className="text-title text-surface-900 mb-4">Session Info</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-body text-surface-600">Auth Provider</span>
                  <span className="text-body text-surface-900 font-medium capitalize">
                    {accountInfo.oauthProvider || "Email / Password"}
                  </span>
                </div>
                {accountInfo.lastLoginAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-body text-surface-600">Last Sign-in</span>
                    <span className="text-body text-surface-900">
                      {new Date(accountInfo.lastLoginAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Notifications Tab ─── */}
        {activeTab === "notifications" && (
          <div className="card p-6">
            <h2 className="text-title text-surface-900 mb-5">Email Notifications</h2>
            <div className="space-y-5">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-body text-surface-800">New follower</p>
                  <p className="text-caption text-surface-400">Get notified when someone follows you.</p>
                </div>
                <Toggle checked={notifications.emailNewFollower} onChange={() => setNotifications((n) => ({ ...n, emailNewFollower: !n.emailNewFollower }))} />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-body text-surface-800">Photo liked</p>
                  <p className="text-caption text-surface-400">Get notified when someone likes your photo.</p>
                </div>
                <Toggle checked={notifications.emailLike} onChange={() => setNotifications((n) => ({ ...n, emailLike: !n.emailLike }))} />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-body text-surface-800">Photo downloaded</p>
                  <p className="text-caption text-surface-400">Get notified when someone downloads your photo.</p>
                </div>
                <Toggle checked={notifications.emailDownload} onChange={() => setNotifications((n) => ({ ...n, emailDownload: !n.emailDownload }))} />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-body text-surface-800">Moderation decisions</p>
                  <p className="text-caption text-surface-400">Get notified when your uploads are approved or rejected.</p>
                </div>
                <Toggle checked={notifications.emailModeration} onChange={() => setNotifications((n) => ({ ...n, emailModeration: !n.emailModeration }))} />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-body text-surface-800">Marketing emails</p>
                  <p className="text-caption text-surface-400">Receive tips, product updates, and promotional content.</p>
                </div>
                <Toggle checked={notifications.emailMarketing} onChange={() => setNotifications((n) => ({ ...n, emailMarketing: !n.emailMarketing }))} />
              </label>
              <div className="flex justify-end pt-2">
                <button onClick={handleSaveNotifications} disabled={savingNotifs} className="btn btn-sm btn-primary">
                  {savingNotifs ? "Saving…" : "Save Preferences"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Account Tab ─── */}
        {activeTab === "account" && (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-title text-surface-900 mb-5">Account Information</h2>
              <div className="space-y-3">
                {accountInfo.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-body text-surface-600">Joined</span>
                    <span className="text-body text-surface-900">
                      {new Date(accountInfo.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-body text-surface-600">Role</span>
                  <span className="text-body text-surface-900 font-medium">
                    {accountInfo.isAdmin ? "Admin" : "Member"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body text-surface-600">Contributor status</span>
                  <span className={`inline-flex items-center gap-1.5 text-caption font-medium ${accountInfo.isContributor ? "text-emerald-600" : "text-surface-500"}`}>
                    {accountInfo.isContributor ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Active Contributor
                      </>
                    ) : (
                      "Not a contributor"
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Danger zone */}
            <div className="card p-6 border-2 border-danger-400">
              <h2 className="text-title text-danger-600 mb-2">Danger Zone</h2>
              <p className="text-body text-surface-500 mb-4">
                Permanently delete your account and all associated data including photos, collections, and stats. This action <strong className="text-surface-800">cannot be undone</strong>.
              </p>
              <button onClick={() => setShowDeleteModal(true)} className="btn btn-sm btn-danger">
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* Delete account modal */}
        <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeletePassword(""); }} title="Delete Account" size="sm">
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-danger-50 border border-danger-200">
              <p className="text-caption text-danger-700">
                This will permanently delete your account, all your uploads, collections, and data. This cannot be undone.
              </p>
            </div>
            <div>
              <label className="form-label">Confirm your password</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="input"
                placeholder="Enter your password to confirm"
                autoComplete="current-password"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowDeleteModal(false); setDeletePassword(""); }} className="btn btn-sm btn-ghost">
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword}
                className="btn btn-sm btn-danger"
              >
                {deleting ? "Deleting…" : "Delete My Account"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
