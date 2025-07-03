import logo from './logo.svg';
import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Logins/Login';
import PostPage from './pages/Posts/PostPage';
import HomePage from './pages/Homes/Home';
import NotifyPage from './pages/Notify/NotifyPage';
import EventPage from './pages/Events/Event';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/posts" element={<PostPage />} />
        <Route path="/notifies" element={<NotifyPage />} />
        <Route path="/events" element={<EventPage />} />
      </Routes>
    </Router>
  );
}

export default App;
