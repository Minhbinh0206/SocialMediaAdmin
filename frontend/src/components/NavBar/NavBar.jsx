import React from 'react';
import './NavBar.css';

const NavBar = () => {
  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <img src="/logo192.png" alt="logo" className="logo" /> {/* hoặc thay bằng biểu tượng khác */}
        <span className="brand-name">Social Media <span className="tdc">TDC</span></span>
      </div>
      <div className="navbar-right">

      </div>
    </header>
  );
};

export default NavBar;
