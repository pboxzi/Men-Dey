import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
import { StateProvider } from './utils/StateContext.tsx';
import { AuthProvider } from './utils/AuthContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StateProvider>
          <App />
        </StateProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
