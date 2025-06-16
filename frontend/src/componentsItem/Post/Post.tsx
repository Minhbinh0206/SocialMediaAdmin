import React from 'react';
import './Post.css';
import { FaHeart, FaRegComment, FaShare } from 'react-icons/fa';

const Post = ({ 
  avatar = '/default-avatar.png',
  name = 'Tên người dùng',
  timestamp = '177 ngày trước',
  image = '/cat.jpg',
  content = "Tham gia cuộc thi nhiếp ảnh với chủ đề 'Khoảnh khắc tuổi trẻ' từ ngày 1/10 đến 30/10.",
  likes = 45,
  comments = 0,
  shares = 0,
}) => {
    
  return (
    <div className="post">
      <div className="post-header">
        <img src={avatar} alt="avatar" className="post-avatar" />
        <div className="post-user-info">
          <div className="post-name">{name}</div>
          <div className="post-time">{timestamp}</div>
        </div>
        <div className="post-options">⋮</div>
      </div>
      <div className="post-image">
        <img src={image} alt="post" />
      </div>
      <div className="post-content">{content}</div>
      <div className="post-actions">
        <div className="action"><FaHeart /> <span>{likes}</span></div>
        <div className="action"><FaRegComment /> <span>{comments}</span></div>
        <div className="action"><FaShare /> <span>{shares}</span></div>
      </div>
    </div>
  );
};

export default Post;
