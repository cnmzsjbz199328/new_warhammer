import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import '../../styles/LoginModal.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const hashPassword = async (password: string) => {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const hashedPassword = await hashPassword(password);
      const { data, error } = await supabase
        .from('admin_users')
        .select('username')
        .eq('username', username)
        .eq('password_hash', hashedPassword)
        .single();

      if (error || !data) throw new Error('用户名或密码错误');

      setMessage({ type: 'success', text: '登录成功！' });
      console.log('Login successful, setting session storage'); // Add this line
      sessionStorage.setItem('username', username);
      onLogin();
      onClose();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const hashedPassword = await hashPassword(password);
      
      const { error } = await supabase
        .from('admin_users')
        .insert([{ 
          username,
          password_hash: hashedPassword
        }]);

      if (error) {
        if (error.code === '23505') {
          throw new Error('用户名已存在');
        }
        throw error;
      }

      setMessage({ type: 'success', text: '注册成功！' });
      setIsRegistering(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRegister = () => {
    setIsRegistering(!isRegistering);
    setMessage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isRegistering ? '注册' : '登录'}</h2>
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : (isRegistering ? '注册' : '登录')}
          </button>
        </form>
        <button 
          onClick={toggleRegister} 
          className="toggle-button"
          disabled={isLoading}
        >
          {isRegistering ? '已有账户？登录' : '没有账户？注册'}
        </button>
      </div>
    </div>
  );
};

export default LoginModal;