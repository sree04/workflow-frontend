import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const RoleSelectionPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, roles } = location.state as { userId: number; roles: string[] } || { userId: undefined, roles: [] };

  // State for selected role
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Debugging log
  console.log('RoleSelectionPage state:', { userId, roles, locationState: location.state, fullLocation: location });

  useEffect(() => {
    // If no userId or roles are available, redirect to welcome page with an error
    if (!userId || !roles || roles.length === 0) {
      console.log('No user information available, redirecting to welcome');
      navigate('/welcome', { state: { error: 'No user information available. Please log in again.' } });
      return;
    }

    // If the user does not have the workflow-designer role, redirect directly to dashboard
    if (!roles.includes('workflow-designer')) {
      console.log('User does not have workflow-designer role, redirecting to dashboard');
      navigate('/dashboard', { state: { userId, roles } });
    }
  }, [userId, roles, navigate]);

  const handleRoleSelection = () => {
    if (!selectedRole) {
      return; // Prevent navigation if no role is selected
    }

    if (selectedRole === 'workflow-designer') {
      navigate('/wizard', { state: { userId, roles: [selectedRole] } });
    } else {
      navigate('/dashboard', { state: { userId, roles: [selectedRole] } });
    }
  };

  // Since we've already redirected non-workflow-designer users, only render the role selection for workflow-designer users
  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-100">
      <div className="bg-white p-6 rounded-lg shadow-lg border border-purple-200 w-full max-w-md">
        <h2 className="text-2xl font-bold text-purple-800 mb-4">Select Your Role</h2>
        <p className="text-gray-600 mb-4">Choose a role to proceed:</p>

        {/* Display all roles available to the user, including workflow-designer */}
        {roles.map((role, index) => (
          <div key={index} className="mb-4">
            <label className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 cursor-pointer">
              <input
                type="radio"
                name="role"
                value={role}
                checked={selectedRole === role}
                onChange={() => setSelectedRole(role)}
                className="h-4 w-4 text-purple-600 border-purple-300 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-purple-800 capitalize">{role.replace(/-/g, ' ')}</span>
            </label>
          </div>
        ))}

        <button
          onClick={handleRoleSelection}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={!selectedRole}
        >
          Proceed
        </button>
      </div>
    </div>
  );
};

export default RoleSelectionPage;