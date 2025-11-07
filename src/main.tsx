import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// --- NEW: Import Google Provider ---
import { GoogleOAuthProvider } from '@react-oauth/google';

// --- NEW: Get Client ID from .env ---
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// --- NEW: Add a check for the Client ID ---
if (!googleClientId) {
  console.error(
    'FATAL ERROR: VITE_GOOGLE_CLIENT_ID environment variable is not set.' +
    ' Please create a .env file in the frontend root and add VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID'
  );
  // Optionally render an error message to the user here instead of the app
}
// ------------------------------------

const rootElement = document.getElementById('root');

// Ensure the root element exists before trying to render
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      {/* --- NEW: Wrap App with Google Provider --- */}
      {/* Pass the clientId obtained from the environment variable */}
      <GoogleOAuthProvider clientId={googleClientId || ""}> {/* Provide empty string as fallback if required */}
        <App />
      </GoogleOAuthProvider>
      {/* -------------------------------------- */}
    </StrictMode>
  );
} else {
  console.error("Failed to find the root element with ID 'root'.");
}