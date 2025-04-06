import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Produtos from "./pages/Produtos";
import Categorias from "./pages/Categorias";
import Orcamentos from "./pages/Orcamentos";
import Vendas from "./pages/Vendas";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Configuracoes from "./pages/Configuracoes";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Componente de rota protegida
const RotaProtegida = ({ children }) => {
  const { currentUser } = useAuth();
  const [verificando, setVerificando] = useState(true);
  
  useEffect(() => {
    // Verificar autenticação e atualizar estado
    setTimeout(() => {
      setVerificando(false);
    }, 500);
  }, []);
  
  if (verificando) {
    // Exibir indicador de carregamento enquanto verifica autenticação
    return (
      <div className="min-h-screen h-full w-full flex items-center justify-center bg-[#0f1117]">
        <div className="text-white text-center">
          <p className="text-xl">Carregando...</p>
          <p className="text-gray-400 mt-2">Verificando autenticação</p>
        </div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Layout para páginas autenticadas
const LayoutAutenticado = ({ children }) => {
  return (
    <div className="min-h-screen h-full w-full flex bg-[#0f1117]">
      {/* Sidebar */}
      <Sidebar />

      {/* Conteúdo principal */}
      <main className="flex-1 w-full overflow-x-hidden">
        <div className="w-full h-full p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            
            {/* Rotas protegidas */}
            <Route path="/" element={
              <RotaProtegida>
                <LayoutAutenticado>
                  <Dashboard />
                </LayoutAutenticado>
              </RotaProtegida>
            } />
            
            <Route path="/clientes" element={
              <RotaProtegida>
                <LayoutAutenticado>
                  <Clientes />
                </LayoutAutenticado>
              </RotaProtegida>
            } />
            
            <Route path="/produtos" element={
              <RotaProtegida>
                <LayoutAutenticado>
                  <Produtos />
                </LayoutAutenticado>
              </RotaProtegida>
            } />
            
            <Route path="/categorias" element={
              <RotaProtegida>
                <LayoutAutenticado>
                  <Categorias />
                </LayoutAutenticado>
              </RotaProtegida>
            } />
            
            <Route path="/orcamentos" element={
              <RotaProtegida>
                <LayoutAutenticado>
                  <Orcamentos />
                </LayoutAutenticado>
              </RotaProtegida>
            } />
            
            <Route path="/vendas" element={
              <RotaProtegida>
                <LayoutAutenticado>
                  <Vendas />
                </LayoutAutenticado>
              </RotaProtegida>
            } />
            
            <Route path="/configuracoes" element={
              <RotaProtegida>
                <LayoutAutenticado>
                  <Configuracoes />
                </LayoutAutenticado>
              </RotaProtegida>
            } />
            
            {/* Rota de fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
