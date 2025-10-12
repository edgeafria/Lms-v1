import React from "react";
import AuthModal from "../components/Auth/AuthModal";

const AuthPage: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(true);
  const [authMode, setAuthMode] = React.useState<"login" | "signup">("login");
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
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
};

export default AuthPage;
