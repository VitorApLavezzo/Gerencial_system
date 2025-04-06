import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Verificar se o usuário já está logado (localStorage)
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Registrar usuário
  const register = async (name, email, password, isAdmin = false) => {
    try {
      setError('');
      // Verificar se o e-mail já existe
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userExists = users.find(user => user.email === email);
      
      if (userExists) {
        throw new Error('E-mail já cadastrado');
      }
      
      // Criar novo usuário
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        isAdmin,
        createdAt: new Date().toISOString()
      };
      
      // Adicionar à lista de usuários
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      // Fazer login com o novo usuário (sem senha)
      const userInfo = { ...newUser };
      delete userInfo.password;
      
      localStorage.setItem('currentUser', JSON.stringify(userInfo));
      setCurrentUser(userInfo);
      
      return userInfo;
    } catch (error) {
      setError(error.message || 'Erro ao registrar. Tente novamente.');
      throw error;
    }
  };

  // Login com email/senha
  const login = async (email, password) => {
    try {
      setError('');
      // Buscar usuário
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(user => user.email === email);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      if (user.password !== password) {
        throw new Error('Senha incorreta');
      }
      
      // Criar objeto de usuário (sem senha)
      const userInfo = { ...user };
      delete userInfo.password;
      
      localStorage.setItem('currentUser', JSON.stringify(userInfo));
      setCurrentUser(userInfo);
      
      return userInfo;
    } catch (error) {
      setError(error.message || 'Erro ao fazer login. Tente novamente.');
      throw error;
    }
  };

  // Login com Google (simulado)
  const loginWithGoogle = async () => {
    return new Promise((resolve, reject) => {
      try {
        setError('');
        
        // Simular processo de autenticação do Google
        const fakeGoogleAuthWindow = window.open('', '_blank', 'width=600,height=600');
        
        if (fakeGoogleAuthWindow) {
          fakeGoogleAuthWindow.document.write(`
            <html>
              <head>
                <title>Login Google</title>
                <style>
                  body { font-family: Arial, sans-serif; background-color: #f1f1f1; padding: 20px; text-align: center; }
                  .container { background: white; padding: 20px; border-radius: 8px; max-width: 400px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                  h2 { color: #333; }
                  .google-logo { width: 80px; margin-bottom: 20px; }
                  .btn { background: #4285f4; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; font-size: 16px; }
                  .btn:hover { background: #3367d6; }
                  .account { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 10px 0; cursor: pointer; text-align: left; display: flex; align-items: center; }
                  .account:hover { background: #f5f5f5; }
                  .account img { width: 40px; height: 40px; border-radius: 50%; margin-right: 15px; }
                  .account-info { flex: 1; }
                  .account-name { font-weight: bold; }
                  .account-email { color: #666; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <img src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png" class="google-logo">
                  <h2>Escolha uma conta</h2>
                  <div class="account" id="account1">
                    <img src="https://lh3.googleusercontent.com/a/default-user">
                    <div class="account-info">
                      <div class="account-name">Usuário Google</div>
                      <div class="account-email">usuario.google@gmail.com</div>
                    </div>
                  </div>
                  <div class="account" id="account2">
                    <img src="https://lh3.googleusercontent.com/a/default-user">
                    <div class="account-info">
                      <div class="account-name">Administrador</div>
                      <div class="account-email">admin.google@gmail.com</div>
                    </div>
                  </div>
                  <button class="btn" id="cancelBtn">Cancelar</button>
                </div>
                <script>
                  document.getElementById('account1').addEventListener('click', function() {
                    window.opener.postMessage({ type: 'google-login', email: 'usuario.google@gmail.com', name: 'Usuário Google', isAdmin: false }, '*');
                    window.close();
                  });
                  document.getElementById('account2').addEventListener('click', function() {
                    window.opener.postMessage({ type: 'google-login', email: 'admin.google@gmail.com', name: 'Administrador', isAdmin: true }, '*');
                    window.close();
                  });
                  document.getElementById('cancelBtn').addEventListener('click', function() {
                    window.opener.postMessage({ type: 'google-login-cancel' }, '*');
                    window.close();
                  });
                </script>
              </body>
            </html>
          `);
        }
        
        // Configurar o manipulador de mensagens
        const messageHandler = (event) => {
          if (event.data && event.data.type === 'google-login') {
            window.removeEventListener('message', messageHandler);
            
            const { email, name, isAdmin } = event.data;
            
            // Criar objeto de usuário Google
            const googleUser = {
              id: `google-${Date.now()}`,
              name: name,
              email: email,
              picture: 'https://lh3.googleusercontent.com/a/default-user',
              isAdmin: isAdmin,
              createdAt: new Date().toISOString()
            };
            
            // Adicionar à lista de usuários se ainda não existir
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            if (!users.some(user => user.email === googleUser.email)) {
              users.push({...googleUser});
              localStorage.setItem('users', JSON.stringify(users));
            } else {
              // Atualizar usuário existente com atributo isAdmin, se aplicável
              const existingIndex = users.findIndex(user => user.email === googleUser.email);
              if (existingIndex >= 0) {
                users[existingIndex].isAdmin = isAdmin;
                localStorage.setItem('users', JSON.stringify(users));
              }
            }
            
            // Salvar no localStorage e atualizar estado
            localStorage.setItem('currentUser', JSON.stringify(googleUser));
            setCurrentUser(googleUser);
            
            resolve(googleUser);
          } else if (event.data && event.data.type === 'google-login-cancel') {
            window.removeEventListener('message', messageHandler);
            reject(new Error('Login com Google cancelado'));
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Se a janela for fechada sem selecionar uma conta
        setTimeout(() => {
          if (fakeGoogleAuthWindow && fakeGoogleAuthWindow.closed) {
            window.removeEventListener('message', messageHandler);
            reject(new Error('Login com Google cancelado'));
          }
        }, 1000);
        
      } catch (error) {
        console.error('Erro no login com Google:', error);
        reject(new Error('Erro ao fazer login com Google. Tente novamente.'));
      }
    });
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  // Verificar se o usuário é admin
  const isAdmin = () => {
    return currentUser?.isAdmin === true;
  };

  const value = {
    currentUser,
    register,
    login,
    loginWithGoogle,
    logout,
    isAdmin,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;