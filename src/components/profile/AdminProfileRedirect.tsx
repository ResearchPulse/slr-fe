import { FiUser } from "react-icons/fi";

const AdminProfileRedirect: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
        <FiUser className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Profile</h2>
      <p className="text-gray-500 max-w-md mb-8">
        To view and manage your profile settings, please visit the
        <span className="font-bold text-indigo-600"> Admin Dashboard</span>.
      </p>
    </div>
  );
};

export default AdminProfileRedirect;
