import { Link } from "react-router-dom";
import { FiArrowRight, FiUser } from "react-icons/fi";

const AdminProfileRedirect: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-150 motion-reduce:animate-none">
      <div className="w-20 h-20 bg-bg-secondary text-accent rounded-[4px] flex items-center justify-center mb-6 shadow-none">
        <FiUser className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">
        Admin Profile
      </h2>
      <p className="text-text-secondary max-w-md mb-8">
        Manage your personal details and account security in your admin profile settings.
      </p>
      <Link
        to="/admin/profile"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 motion-reduce:transition-none"
      >
        Open profile settings
        <FiArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </div>
  );
};

export default AdminProfileRedirect;
