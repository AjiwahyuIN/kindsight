import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/main.scss';
import './styles/pages/_spa.scss';
import { App } from './app/App';

const root = document.getElementById('root');
if (!root) throw new Error('Application root not found.');
createRoot(root).render(<StrictMode><App /></StrictMode>);
