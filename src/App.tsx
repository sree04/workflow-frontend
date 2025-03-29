import React, { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import WelcomePage from './components/WelcomePage';
import LoginPage from './components/LoginPage';
import RoleSelectionPage from './components/RoleSelectionPage';
import WorkflowWizard from './components/WorkflowWizard';
import Dashboard from './components/Dashboard';

function App() {
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleLogin = (userId: number, roles: string[]) => {
    console.log('handleLogin called with:', { userId, roles }); // Debug log
    setIsLoginOpen(false);
    navigate('/role-selection', { state: { userId, roles } }); // Ensure state is passed
  };

  const handleLogout = () => {
    navigate('/welcome');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {isLoginOpen ? (
        <LoginPage 
          onClose={() => setIsLoginOpen(false)} 
          onLogin={handleLogin}
        />
      ) : null}

      <Routes>
        <Route path="/welcome" element={<WelcomePage onGetStarted={() => setIsLoginOpen(true)} />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} onClose={() => setIsLoginOpen(false)} />} />
        <Route path="/role-selection" element={<RoleSelectionPage />} />
        <Route path="/wizard" element={<WorkflowWizard onComplete={() => navigate('/dashboard')} />} />
        <Route path="/dashboard" element={<Dashboard onLogout={handleLogout} />} />
        <Route path="/" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </div>
  );
}

export default App;