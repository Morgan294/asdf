import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Index from '../index';
import LandingPage from './landingpage';
import TenantChat from './tenantchat';

const App = () => {
  return (
    <main>
      <Routes>
        <Route path="/" element={<Navigate to="/index" />} />
        <Route path="/index" element={<Index />} />
        <Route path="/landingpage" element={<LandingPage />} />
        <Route path="/tenantchat" element={<TenantChat />} />
        <Route
          path="*"
          element={<div style={{ textAlign: 'center' }}><h1>404: Page Not Found</h1></div>}
        />
      </Routes>
    </main>
  );
};

export default App;