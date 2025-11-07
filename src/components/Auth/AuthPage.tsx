// [COMPLETE CODE FOR: frontend/src/components/Auth/AuthPage.tsx]

import React from "react";
import { useNavigate } from "react-router-dom"; // Import navigate for redirect
import AuthModal from "./AuthModal"; // This path is correct

const AuthPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AuthModal
        isOpen={true} // Always open on this page
        // When the user closes the modal, redirect them to the homepage
        onClose={() => navigate("/")} 
        initialMode="login" // Hardcode this page to login
      />
    </div>
  );
};

export default AuthPage;