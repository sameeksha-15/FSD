import { NavLink } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();
  
  console.log('Sidebar - User object:', user);
  // Normalize role casing
  const userRole = user?.role?.toLowerCase() || '';
  console.log('Sidebar - Current user role (lowercase):', userRole);
  // Check if user can access site monitoring
  const canAccessSiteMonitoring = ['admin', 'manager', 'supervisor'].includes(userRole);
  console.log('Can access site monitoring:', canAccessSiteMonitoring, 'for role:', userRole);
  
  // Debug role check
  if (!canAccessSiteMonitoring && user?.role) {
    console.log('Role not in allowed list. User role:', user.role, 'Allowed roles:', ['admin', 'manager', 'supervisor']);
  }

  const links = [
    { name: "Dashboard", path: "/admin" },
    ...(canAccessSiteMonitoring ? [{ name: "Site Monitoring", path: "/admin/site-monitoring" }] : []),
  ];

  return (
    <aside className="bg-blue-800 text-white w-64 min-h-screen p-4 fixed left-0 top-0">
      <h1 className="text-2xl font-bold mb-8">Admin Panel</h1>
      <nav className="space-y-4">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `block px-4 py-2 rounded transition-colors duration-200 hover:bg-blue-700 ${
                isActive ? "bg-blue-700" : ""
              }`
            }
          >
            {link.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
} 