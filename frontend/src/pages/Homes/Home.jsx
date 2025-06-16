import React from 'react';
import './Home.css';
import HomePersonal from '../../components/homePersonal/HomePersonal';

const HomePage = () => {
  return (
    <div className="home-container">
      <div className="column left-column">
        <HomePersonal />
      </div>
      <div className="column middle-column">
        <h3>Cột giữa</h3>
        <p>Nội dung chính như bài viết, bảng tin…</p>
      </div>
      <div className="column right-column">
        <h3>Cột phải</h3>
        <p>Thông báo, lời mời, bạn bè…</p>
      </div>
    </div>
  );
};

export default HomePage;
