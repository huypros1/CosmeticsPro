import { createRoot } from 'react-dom/client';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/main.css';
import './styles/layouts.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/admin.css';
import App from './App.jsx';


createRoot(document.getElementById('app')).render(<App />);

