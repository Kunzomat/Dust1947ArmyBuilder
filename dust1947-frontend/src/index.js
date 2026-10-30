import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@fontsource/oswald/latin-400.css';
import '@fontsource/oswald/latin-700.css';
import CssBaseline from "@mui/material/CssBaseline";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <CssBaseline />
    <App />
  </React.StrictMode>
);
