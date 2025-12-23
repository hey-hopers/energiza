import React, { useState, useCallback, useEffect } from 'react';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import DashboardPage from './components/pages/DashboardPage';
import MyBusinessPage from './components/pages/MyBusinessPage';
import AccountPage from './components/pages/AccountPage';
import SystemPage from './components/pages/SystemPage';
import Layout from './components/layout/Layout';
import { User, Person } from './types';

export type Page = 'dashboard' | 'my-business' | 'account' | 'system';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  // Verificar autenticação ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const sessionId = localStorage.getItem('sessionId');
      
      if (!token || !sessionId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3001/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Session-Id': sessionId,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const user: User = {
              id: data.data.id.toString(),
              name: data.data.nome,
              email: data.data.email,
              avatarUrl: `https://i.pravatar.cc/150?u=${data.data.email}`,
            };
            setUser(user);
          }
        } else {
          // Token inválido, limpar storage
          localStorage.removeItem('token');
          localStorage.removeItem('sessionId');
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('sessionId');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
    setShowRegister(false);
  }, []);

  const handleLogout = useCallback(async () => {
    const token = localStorage.getItem('token');
    const sessionId = localStorage.getItem('sessionId');
    
    // Sempre limpar o localStorage, mesmo se a chamada ao backend falhar
    localStorage.removeItem('token');
    localStorage.removeItem('sessionId');
    setUser(null);
    setCurrentPage('dashboard');
    
    // Tentar invalidar a sessão no backend (não bloqueia o logout se falhar)
    if (token && sessionId) {
      try {
        await fetch('http://localhost:3001/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Session-Id': sessionId,
          },
        });
      } catch (error) {
        // Log do erro mas não impede o logout
        console.error('Erro ao invalidar sessão no servidor:', error);
      }
    }
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'my-business':
        return <MyBusinessPage people={people} setPeople={setPeople} />;
      case 'account':
        return <AccountPage user={user!} people={people} />;
      case 'system':
        return <SystemPage />;
      default:
        return <DashboardPage />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showRegister) {
      return (
        <RegisterPage
          onRegister={handleLogin}
          onBackToLogin={() => setShowRegister(false)}
        />
      );
    }
    return <LoginPage onLogin={handleLogin} onShowRegister={() => setShowRegister(true)} />;
  }

  return (
    <Layout
      user={user}
      onLogout={handleLogout}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
    >
      {renderPage()}
    </Layout>
  );
};

export default App;