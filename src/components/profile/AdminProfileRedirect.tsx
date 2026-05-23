import { FiUser } from "react-icons/fi";

const AdminProfileRedirect: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-20 h-20 bg-bg-secondary text-accent rounded-[4px] flex items-center justify-center mb-6 shadow-none">
        <FiUser className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">
        Admin Profile
      </h2>
      <p className="text-text-secondary max-w-md mb-8">
        To view and manage your profile settings, please visit the
        <span className="font-bold text-accent"> Admin Dashboard</span>.
      </p>
    </div>
  );
};

export default AdminProfileRedirect;
