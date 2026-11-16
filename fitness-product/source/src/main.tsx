import React from 'react';
import {createRoot} from 'react-dom/client';
import Dashboard from './Dashboard';
import './styles.css';
createRoot(document.getElementById('root')!).render(<div className="content"><Dashboard/></div>);

