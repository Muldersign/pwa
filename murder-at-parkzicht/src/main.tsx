import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './ui/App';
import { GameProvider } from './ui/store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </StrictMode>,
);
