import React, { useEffect, useState } from 'react';
import './Post.css';
import { FaHeart, FaRegComment, FaShare } from 'react-icons/fa';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ref, get, child } from 'firebase/database';
import { database } from '../../firebaseConfig';

dayjs.extend(relativeTime);

const Post = ({
  userId,
  createAt,
  postImage = [],
  content = '',
  likes = 0,
  comments = 0,
  shares = 0
}) => {
  const [adminAvatar, setAdminAvatar] = useState('/default-avatar.png');
  const [adminName, setAdminName] = useState('No name');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Tìm thông tin admin theo userId
  useEffect(() => {
    const findAdminInfo = async () => {
      const adminPaths = ['AdminDefaults', 'AdminDepartments', 'AdminBusinesses'];

      for (let path of adminPaths) {
        const snapshot = await get(child(ref(database), `Admins/${path}/${userId}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log('DATA FOUND:', data);
          setAdminAvatar(data.avatar || '/default-avatar.png');
          setAdminName(data.fullName || 'No name');
          return;
        }
      }

      console.log('Không tìm thấy userId:', userId);
    };

    if (userId) {
      findAdminInfo();
    }
  }, [userId]);

  console.log('Ảnh bài viết:', postImage);

  const [isFading, setIsFading] = useState(false);

  const switchImage = (index) => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentImageIndex(index);
      setIsFading(false);
    }, 200); // thời gian phải khớp với CSS transition
  };

  const handlePrev = () => {
    if (currentImageIndex > 0) {
      switchImage(currentImageIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentImageIndex < postImage.length - 1) {
      switchImage(currentImageIndex + 1);
    }
  };

  return (
    <div className="post">
      <div className="post-header">
        <img src={adminAvatar} alt="avatar" className="post-avatar" />
        <div className="post-user-info">
          <div className="post-name">{adminName}</div>
          <div className="post-time">
            {createAt ? dayjs(createAt).fromNow() : 'Vừa xong'}
          </div>
        </div>
        <div className="post-options">⋮</div>
      </div>

      <div className="post-content">{content}</div>

      {postImage.length > 0 && (
        <div className="post-image">
          <div
            className="post-image-slider"
            style={{
              transform: `translateX(-${currentImageIndex * 100}%)`
            }}
          >
            {postImage.map((img, idx) => (
              <img key={idx} src={img} alt="post" className="post-image-slide" />
            ))}
          </div>

          {postImage.length > 1 && (
            <>
              <button
                className={`slide-btn left ${currentImageIndex === 0 ? 'disabled' : ''}`}
                onClick={handlePrev}
                disabled={currentImageIndex === 0}
              >
                &#10094;
              </button>

              <button
                className={`slide-btn right ${currentImageIndex === postImage.length - 1 ? 'disabled' : ''}`}
                onClick={handleNext}
                disabled={currentImageIndex === postImage.length - 1}
              >
                &#10095;
              </button>
            </>
          )}
        </div>
      )}

      <div className="post-actions">
        <div className="action"><FaHeart /> <span>{likes}</span></div>
        <div className="action"><FaRegComment /> <span>{comments}</span></div>
        <div className="action"><FaShare /> <span>{shares}</span></div>
      </div>
    </div>
  );
};

export default Post;
