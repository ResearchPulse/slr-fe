import { useState, useRef, useEffect } from "react";
import {
  FiBell,
  FiMenu,
  FiX,
  FiLayers,
  FiUser,
  FiLogOut,
  FiShield,
} from "react-icons/fi";
import SystemSignature from "../logo/SystemSignature";
import NotificationDropdown from "./NotificationDropdown";
import { Link, useLocation, useNavigate } from "react-router";
import Drawer from "../ui/Drawer";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../redux/store";
import { logout } from "../../redux/slices/authSlice";
import { clearCurrentProject } from "../../redux/slices/projectSlice";
import Button from "../ui/Button";
import { toastWarning } from "../../utils/toast";
import { useUnreadCount } from "../../hooks/useNotifications";

const Header: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth,
  );
  const { unreadCount } = useUnreadCount();

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCurrentProject());
    navigate("/auth/signin");
  };

  const handleSwitchAdmin = () => {
    navigate("/admin");
  };

  const getUserInitials = (name: string) => {
    return name ? name.trim().charAt(0).toUpperCase() : "";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setShowNotifications(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(target)
      ) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu and dropdowns on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setShowNotifications(false);
    setShowUserDropdown(false);
  }, [location.pathname]);

  const navLinks = location.pathname === "/"
    ? [
        { name: "Projects", path: "/projects", icon: FiLayers },
        { name: "Workflow", path: "/#workflow", icon: FiLayers },
        { name: "Features", path: "/#features", icon: FiLayers },
        { name: "About", path: "/#about", icon: FiLayers },
      ]
    : [{ name: "Projects", path: "/projects", icon: FiLayers }];

  const handleHeaderInteraction = (
    e: React.MouseEvent | React.KeyboardEvent,
  ) => {
    if (user?.role !== "Admin") return;

    const target = e.target as HTMLElement;
    const button = target.closest("button");
    const isLink = target.closest("a");

    // Allow Admin Console button
    const isAdminConsole = button?.textContent?.includes("Admin Console");
    // Allow Mobile Menu toggle
    const isMenuToggle = button?.getAttribute("aria-label") === "Toggle Menu";
    // Allow standard navigation links
    if (isLink || isAdminConsole || isMenuToggle) return;

    // Block other interactive elements (Notifications, Profile dropdown, etc.)
    const isForbiddenAction =
      button || target.closest("input, select, textarea");
    if (isForbiddenAction) {
      e.preventDefault();
      e.stopPropagation();
      toastWarning(
        "Read-only Mode",
        "Only client can perform actions on these components.",
      );
    }
  };

  return (
    <>
      <header
        className="bg-surface-white border-b border-border sticky top-0 z-[100] transition-[box-shadow] duration-300 h-[60px] md:h-[72px]"
        onClickCapture={handleHeaderInteraction}
        onKeyDownCapture={handleHeaderInteraction}
      >
        <div className="container mx-auto px-5 sm:px-8 lg:px-12 h-full">
          <div className="flex justify-between items-center h-full">
            {/* Left Side: Logo & Desktop Nav */}
            <div className="flex items-center gap-8 lg:gap-12">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary transition-opacity"
                aria-label="Toggle Menu"
              >
                {isMenuOpen ? (
                  <FiX className="w-5 h-5" />
                ) : (
                  <FiMenu className="w-5 h-5" />
                )}
              </button>

              <Link to="/" className="flex items-center gap-2 group shrink-0">
                <SystemSignature
                  primaryClassName="text-text-primary"
                  accentClassName="text-accent"
                  className="mb-0"
                />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const className = `px-3 py-2 text-[11px] font-semibold transition-colors whitespace-nowrap ${location.pathname === "/" ? "normal-case tracking-[0.01em] text-[#536B7A] hover:text-primary" : "uppercase tracking-[0.2em] text-text-primary hover:opacity-60"}`;
                  return location.pathname === "/" && link.path.startsWith("/#") ? (
                    <a key={link.name} href={link.path.slice(1)} className={className}>{link.name}</a>
                  ) : (
                    <Link key={link.name} to={link.path} className={className}>{link.name}</Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Side: Actions & User Profile */}
            <div className="flex items-center gap-2 sm:gap-4">
              {isAuthenticated ? (
                <>
                  {/* Notification Area */}
                  <div className="relative" ref={notificationRef}>
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
                      className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200 ${
                        showNotifications
                          ? "bg-[#EFF7FB] text-primary"
                          : "text-[#657B89] hover:bg-[#F3F7F9] hover:text-primary"
                      }`}
                    >
                      <FiBell className="h-[18px] w-[18px]" />
                      {/* Badge */}
                      {unreadCount > 0 && (
                        <span className="absolute right-1 top-1 flex h-2.5 min-w-2.5 items-center justify-center rounded-full border-2 border-white bg-[#087BC1]">
                          {unreadCount > 9 ? (
                            <span className="px-0.5 text-[6px] font-bold text-white">9+</span>
                          ) : null}
                        </span>
                      )}
                    </button>

                    {/* Dropdown */}
                    {showNotifications && <NotificationDropdown />}
                  </div>

                  {/* Admin Dashboard Access */}
                  {user?.role === "Admin" && (
                    <button
                      onClick={handleSwitchAdmin}
                      className="flex items-center gap-2 rounded-xl bg-[#102B3D] px-3 py-2 text-white transition-colors duration-200 hover:bg-[#1B4057] sm:px-4"
                    >
                      <FiShield className="w-4 h-4" />
                      <span className="hidden sm:inline text-[11px] font-medium uppercase tracking-[0.15em]">
                        Admin Console
                      </span>
                    </button>
                  )}

                  {/* Desktop Separator */}
                  <div className="mx-0.5 hidden h-7 w-px bg-[#DCE6EC] sm:block"></div>

                  {/* User Profile Dropdown */}
                  <div className="relative" ref={userDropdownRef}>
                    <button
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      aria-expanded={showUserDropdown}
                      className={`group flex items-center gap-2.5 rounded-lg py-1 pl-2 pr-1 transition-colors ${
                        showUserDropdown
                          ? "bg-[#F1F6F8]"
                          : "hover:bg-[#F3F7F9]"
                      }`}
                    >
                      <div className="hidden lg:block text-right">
                        <p className="text-[12px] font-bold leading-tight text-[#173247]">
                          {user?.name || "User"}
                        </p>
                        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8797A1]">
                          {user?.role || "User"}
                        </p>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[#087BC1] text-sm font-bold text-white">
                        {user?.name ? getUserInitials(user.name) : "U"}
                      </div>
                    </button>

                    {/* Profile Dropdown Menu */}
                    {showUserDropdown && (
                      <div className="absolute right-0 z-50 mt-3 w-[248px] rounded-xl border border-[#DCE6EC] bg-white p-1.5 shadow-[0_16px_42px_rgba(19,43,60,0.14)]">
                        <div className="flex items-center gap-3 px-3 py-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#087BC1] text-sm font-bold text-white">
                            {user?.name ? getUserInitials(user.name) : "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-bold text-[#173247]">
                              {user?.name || "User"}
                            </p>
                            <p className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-[0.13em] text-[#8797A1]">
                              {user?.role || "User"}
                            </p>
                          </div>
                        </div>

                        <div className="mx-2 h-px bg-[#E8EEF1]" />

                        <Link
                          to="/profile"
                          onClick={() => setShowUserDropdown(false)}
                          className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#435B69] transition-colors hover:bg-[#F1F7FA] hover:text-[#173247]"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF4F9] text-[#397FA8]"><FiUser className="h-4 w-4" /></span>
                          <span>
                            <span className="block text-[11px] font-bold">Profile</span>
                            <span className="mt-0.5 block text-[9px] text-[#8797A1]">View your account</span>
                          </span>
                        </Link>

                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            handleLogout();
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[#9B5552] transition-colors hover:bg-[#FBF3F2] hover:text-[#823E3C]"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FBF0EF] text-[#A65A56]"><FiLogOut className="h-4 w-4" /></span>
                          <span>
                            <span className="block text-left text-[11px] font-bold">Sign out</span>
                            <span className="mt-0.5 block text-left text-[9px] text-[#A17D7A]">End your current session</span>
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2.5 sm:gap-3">
                  {location.pathname === "/" && (
                    <Link to="/auth/signin" className="hidden sm:block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-6"
                      >
                        Get Started
                      </Button>
                    </Link>
                  )}
                  <Link to="/auth/signin">
                    <Button
                      variant="primary"
                      size="sm"
                      className="px-6"
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <Drawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        side="left"
        maxWidth="max-w-[85%] md:hidden"
        title={
          <Link to="/" onClick={() => setIsMenuOpen(false)}>
            <SystemSignature
              primaryClassName="text-text-primary"
              accentClassName="text-accent"
              className="mb-0 scale-90 origin-left"
            />
          </Link>
        }
        footer={
          <p className="text-[10px] text-text-secondary text-center uppercase tracking-widest leading-loose">
            SLRS
            <br />
            v1.0.2 • 2026
          </p>
        }
      >
        <p className="text-[11px] text-text-secondary uppercase tracking-[0.2em] mb-6">
          Navigation
        </p>
        <nav className="space-y-1">
          {navLinks.map((link) => {
            const className = "flex items-center gap-4 p-3 text-[11px] font-medium uppercase tracking-[0.2em] text-text-primary hover:bg-bg-secondary transition-colors";
            const content = <><link.icon className="w-4 h-4 opacity-50" />{link.name}</>;
            return location.pathname === "/" && link.path.startsWith("/#") ? (
              <a key={link.name} href={link.path.slice(1)} onClick={() => setIsMenuOpen(false)} className={className}>{content}</a>
            ) : (
              <Link key={link.name} to={link.path} className={className}>{content}</Link>
            );
          })}
        </nav>

        <div className="mt-12">
          {user?.role === "Admin" && (
            <div className="mb-6">
              <p className="text-[11px] text-text-secondary uppercase tracking-[0.2em] mb-4">
                Management
              </p>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleSwitchAdmin();
                }}
                className="w-full flex items-center gap-4 p-3 bg-text-primary text-bg-primary rounded-[4px] transition-colors active:scale-[0.98]"
              >
                <FiShield className="w-4 h-4" />
                <span className="text-[12px] font-medium uppercase tracking-[0.15em]">
                  Admin Dashboard
                </span>
              </button>
            </div>
          )}
          <p className="text-[11px] text-text-secondary uppercase tracking-[0.2em] mb-4">
            Account
          </p>
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-[4px]">
                <div className="h-10 w-10 bg-accent text-bg-primary rounded-[4px] flex items-center justify-center font-medium text-base">
                  {user?.name ? getUserInitials(user.name) : "U"}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {user?.name || "User"}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-text-secondary">
                    {user?.role || "User"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full mt-3 flex items-center gap-3 p-3 text-sm text-accent hover:bg-bg-secondary transition-colors"
              >
                <FiLogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/auth/signin" onClick={() => setIsMenuOpen(false)}>
              <Button className="w-full">Sign In</Button>
            </Link>
          )}
        </div>
      </Drawer>
    </>
  );
};

export default Header;
