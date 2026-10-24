import React, { useState } from 'react';
import Login from './Login';
import SignUp from './SignUp';

const AuthModal = ({ isOpen, onClose, initialView = 'login' }) => {
  const [currentView, setCurrentView] = useState(initialView);

  const handleSuccess = (data) => {
    console.log('Authentication successful:', data);
    onClose();
  };

  const switchToLogin = () => {
    setCurrentView('login');
  };

  const switchToSignUp = () => {
    setCurrentView('signup');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        
        {currentView === 'login' ? (
          <Login 
            onSwitchToSignUp={switchToSignUp}
            onSuccess={handleSuccess}
          />
        ) : (
          <SignUp 
            onSwitchToLogin={switchToLogin}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;