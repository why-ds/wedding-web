import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
const AdminApp=React.lazy(()=>import('./admin/AdminApp'));
const DirectoryApp=React.lazy(()=>import('./DirectoryApp'));

createRoot(document.getElementById('root')!).render(<React.StrictMode><React.Suspense fallback={<main className="empty" role="status">화면을 불러오고 있습니다.</main>}>{/^\/admin\/?$/.test(location.pathname)?<AdminApp/>:/^\/preview\/venues\/?$/.test(location.pathname)?<App/>:<DirectoryApp/>}</React.Suspense></React.StrictMode>);
