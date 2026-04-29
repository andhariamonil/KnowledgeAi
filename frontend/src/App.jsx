import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes/AppRoutes';
import './styles/index.css';

const AnimatedBackground = () => (
  <>
    <div className="animated-bg">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
    <div className="grid-overlay" />
  </>
);

export default function App() {
  return (
    <AuthProvider>
      <AnimatedBackground />
      <AppRoutes />
    </AuthProvider>
  );
}