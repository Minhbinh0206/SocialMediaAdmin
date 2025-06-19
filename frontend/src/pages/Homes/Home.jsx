import React from 'react';
import './Home.css';
import HomePersonal from '../../components/HomePersonal/HomePersonal';
import NavBar from '../../components/NavBar/NavBar';
import ListPost from '../../components/ListPosts/ListPosts';

const HomePage = () => {
  return (
    <div>
      <NavBar />
      <div className="home-container">
        <div className="column left-column">
          <HomePersonal />
        </div>
        <div className="column middle-column">
          <h3 style={{ fontSize: 25, padding: '0 30px' }}>Bảng tin</h3>
          <ListPost />
        </div>
        <div className="column right-column">
          <h3>Cột phải</h3>
          <p>Thông báo, lời mời, bạn bè…</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
