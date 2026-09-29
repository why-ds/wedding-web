import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
const AdminApp=React.lazy(()=>import('./admin/AdminApp'));
const DirectoryApp=React.lazy(()=>import('./DirectoryApp'));
const DemoDirectoryApp=React.lazy(()=>import('./DemoDirectoryApp'));
const DirectoryDetailApp=React.lazy(()=>import('./DirectoryDetailApp'));
const AccountLinkApp=React.lazy(()=>import('./AccountLinkApp'));

createRoot(document.getElementById('root')!).render(<React.StrictMode><React.Suspense fallback={<main className="empty" role="status">화면을 불러오고 있습니다.</main>}>{/^\/admin\/?$/.test(location.pathname)?<AdminApp/>:/^\/account\/verify\/?$/.test(location.pathname)?<AccountLinkApp kind="verify"/>:/^\/account\/reset\/?$/.test(location.pathname)?<AccountLinkApp kind="reset"/>:/^\/preview\/venues\/?$/.test(location.pathname)?<App/>:/^\/preview\/catalog\/?$/.test(location.pathname)?<DemoDirectoryApp/>:/^\/preview\/catalog\/[^/]+\/?$/.test(location.pathname)?<DirectoryDetailApp demo/>:/^\/directory\/[^/]+\/?$/.test(location.pathname)?<DirectoryDetailApp/>:<DirectoryApp/>}</React.Suspense></React.StrictMode>);
