import React, { useState } from 'react';
import './Register.css'; // Đừng quên tạo file CSS này

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleregister = (e) => {
    e.preventDefault();
    console.log('Đăng nhập với', { email, password });
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleregister}>
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
        <p className="note">
          Bạn chưa có tài khoản? <a href="/register">Đăng ký</a>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
