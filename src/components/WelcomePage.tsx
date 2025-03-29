import React from 'react';
import { Workflow } from 'lucide-react';

interface WelcomePageProps {
  onGetStarted: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 via-white to-indigo-100 p-4">
      <div className="bg-white shadow-2xl rounded-lg p-10 max-w-md w-full text-center border-2 border-purple-300 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-purple-100 opacity-50"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-100 opacity-50"></div>
        
        <div className="mb-8 flex justify-center relative z-10">
          <div className="p-5 bg-purple-100 rounded-full">
            <Workflow className="w-16 h-16 text-purple-600" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-purple-900 mb-6 relative z-10">
          Welcome to Workflow Manager
        </h1>
        
        <p className="text-lg text-purple-700 mb-8 relative z-10">
          Streamline your business processes with our intuitive workflow management system.
          Design, manage, and optimize your workflows with ease.
        </p>
        
        <button
          onClick={onGetStarted}
          className="w-full flex justify-center py-3 px-6 border border-transparent rounded-md shadow-lg text-base font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 transform hover:scale-105 relative z-10"
        >
          Get Started
        </button>
        
        <div className="mt-6 text-sm text-purple-500 relative z-10">
          The complete solution for workflow automation
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;