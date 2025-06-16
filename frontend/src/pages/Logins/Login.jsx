import React, { useState } from 'react';
import './Login.css';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig'; // điều chỉnh đúng đường dẫn nếu khác

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Đăng nhập thành công:', user);
      window.location.href = "/home"; // chuyển hướng nếu thành công
    } catch (err) {
      console.error('Đăng nhập thất bại:', err.message);
      setError('Email hoặc mật khẩu không đúng');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Đăng Nhập</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Đăng nhập</button>
        {error && <p className="error">{error}</p>}
        <p className="note">
          Bạn chưa có tài khoản? <a href="/register">Đăng ký</a>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
