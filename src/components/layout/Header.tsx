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

  const navLinks = [{ name: "Projects", path: "/projects", icon: FiLayers }];

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
        className="bg-bg-primary border-b border-border sticky top-0 z-[100] transition-all duration-300 h-[52px] md:h-[60px]"
        onClickCapture={handleHeaderInteraction}
        onKeyDownCapture={handleHeaderInteraction}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
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
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className="px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-text-primary hover:opacity-60 transition-opacity whitespace-nowrap"
                  >
                    {link.name}
                  </Link>
                ))}
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
                      className={`relative p-2 transition-opacity duration-200 text-text-secondary ${
                        showNotifications ? "opacity-100" : "hover:opacity-60"
                      }`}
                    >
                      <span className="sr-only">Notifications</span>
                      <FiBell className="w-5 h-5" />
                      {/* Badge */}
                      {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-accent border-2 border-bg-primary rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? (
                            <span className="text-[6px] text-white">9+</span>
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
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-text-primary hover:bg-[#2a2a2a] text-bg-primary rounded-[4px] transition-colors duration-200"
                    >
                      <FiShield className="w-4 h-4" />
                      <span className="hidden sm:inline text-[11px] font-medium uppercase tracking-[0.15em]">
                        Admin Console
                      </span>
                    </button>
                  )}

                  {/* Desktop Separator */}
                  <div className="hidden sm:block h-6 w-px bg-border mx-1"></div>

                  {/* User Profile Dropdown */}
                  <div className="relative" ref={userDropdownRef}>
                    <button
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="flex items-center gap-3 py-1 transition-opacity hover:opacity-80 group"
                    >
                      <div className="hidden lg:block text-right">
                        <p className="text-sm font-medium text-text-primary">
                          {user?.name || "User"}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-text-secondary">
                          {user?.role || "User"}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-accent text-bg-primary rounded-[4px] flex items-center justify-center font-medium text-sm">
                        {user?.name ? getUserInitials(user.name) : "U"}
                      </div>
                    </button>

                    {/* Profile Dropdown Menu */}
                    {showUserDropdown && (
                      <div className="absolute right-0 mt-2 w-52 bg-surface-white rounded-[4px] border border-border py-1 z-50">
                        <div className="px-4 py-3 border-b border-border mb-1 lg:hidden">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {user?.name}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-text-secondary truncate">
                            {user?.role}
                          </p>
                        </div>

                        <Link
                          to="/profile"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
                        >
                          <FiUser className="w-4 h-4" />
                          Profile
                        </Link>

                        <div className="h-px bg-border my-1 mx-2"></div>

                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-accent hover:bg-bg-secondary transition-colors"
                        >
                          <FiLogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  {location.pathname === "/" && (
                    <Link to="/auth/signin" className="hidden sm:block">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="px-5 py-2 h-auto rounded-[4px] shadow-none text-[12px] uppercase tracking-[0.15em]"
                      >
                        Get Started
                      </Button>
                    </Link>
                  )}
                  <Link to="/auth/signin">
                    <Button
                      variant="primary"
                      size="sm"
                      className="px-5 py-2 h-auto rounded-[4px] shadow-none text-[12px] uppercase tracking-[0.15em]"
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
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="flex items-center gap-4 p-3 text-[11px] font-medium uppercase tracking-[0.2em] text-text-primary hover:bg-bg-secondary transition-colors"
            >
              <link.icon className="w-4 h-4 opacity-50" />
              {link.name}
            </Link>
          ))}
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
