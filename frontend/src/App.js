import logo from './logo.svg';
import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Logins/Login';
import PostPage from './pages/Posts/PostPage';
import HomePage from './pages/Homes/Home';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/posts" element={<PostPage />} />
      </Routes>
    </Router>
  );
}

export default App;
