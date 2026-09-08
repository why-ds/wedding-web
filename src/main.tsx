import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
const AdminApp=React.lazy(()=>import('./admin/AdminApp'));

createRoot(document.getElementById('root')!).render(<React.StrictMode>{/^\/admin\/?$/.test(location.pathname)?<React.Suspense fallback={<main className="empty" role="status">관리 화면을 불러오고 있습니다.</main>}><AdminApp/></React.Suspense>:<App/>}</React.StrictMode>);
