import React, { useEffect, useState } from 'react';
import './Post.css';
import { FaHeart, FaRegComment, FaShare } from 'react-icons/fa';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ref, get, child, set, onValue } from 'firebase/database';
import { database } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import ListComments from '../../components/ListComments/ListComments';


dayjs.extend(relativeTime);

const Post = ({
  key,
  groupId,
  userId,
  postId,
  createAt,
  postImage = [],
  content = '',
  likes = 0,
  comments = 0,
  shares = 0
}) => {
  const auth = getAuth();
  const [adminAvatar, setAdminAvatar] = useState('/default-avatar.png');
  const [adminName, setAdminName] = useState('No name');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const currentUserId = auth.currentUser?.uid;
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Realtime like status
  useEffect(() => {
    const postLikeRef = ref(database, `Posts/${groupId}/${userId}/${postId}/postLike`);

    const unsubscribe = onValue(postLikeRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setLikeCount(data.count || 0);
        setLiked(data.userIds?.includes(currentUserId) || false);
      } else {
        setLikeCount(0);
        setLiked(false);
      }
    });

    return () => unsubscribe();
  }, [groupId, postId, currentUserId]);

  const handlePress = async () => {
    const postRef = ref(database, `Posts/${groupId}/${userId}/${postId}/postLike`);

    try {
      const snapshot = await get(postRef);
      let currentPostLike = snapshot.val() || { count: 0, userIds: [] };
      const newLikeStatus = !liked;

      let updatedUserIds = [...(currentPostLike.userIds || [])];
      if (newLikeStatus) {
        if (!updatedUserIds.includes(currentUserId)) {
          updatedUserIds.push(currentUserId);
        }
      } else {
        updatedUserIds = updatedUserIds.filter(id => id !== currentUserId);
      }

      const newPostLike = {
        count: updatedUserIds.length,
        userIds: updatedUserIds,
      };

      await set(postRef, newPostLike);
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

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

  const formatDate = (timestamp: number) => {
    console.log('timestamp', timestamp);
    if (!timestamp || isNaN(timestamp)) return 'Thời gian không hợp lệ';

    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    return `${diffInDays} ngày trước`;
  };

  const handleNext = () => {
    if (currentImageIndex < postImage.length - 1) {
      switchImage(currentImageIndex + 1);
    }
  };

  return (
    <div>
      <div className="post">
        <div className="post-header">
          <img src={adminAvatar} alt="avatar" className="post-avatar" />
          <div className="post-user-info">
            <div className="post-name">{adminName}</div>
            <div className="post-time">
              {formatDate(createAt)}
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
          <div className="action" onClick={handlePress} style={{ cursor: 'pointer' }}>
            <FaHeart color={liked ? 'red' : 'gray'} />
            <span>{likeCount}</span>
          </div>

          <div className="action" onClick={() => setShowCommentModal(true)} style={{ cursor: 'pointer' }}>
            <FaRegComment /> <span>{comments}</span>
          </div>

          <div className="action">
            <FaShare /> <span>{shares}</span>
          </div>
        </div>
      </div>

      {showCommentModal && (
        <div className="modal-backdrop" onClick={() => setShowCommentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>

            {/* PHẦN 1: Hiển thị lại nội dung bài viết */}
            <div className="post">
              <div className="post-header">
                <img src={adminAvatar} alt="avatar" className="post-avatar" />
                <div className="post-user-info">
                  <div className="post-name">{adminName}</div>
                  <div className="post-time">
                    {formatDate(createAt)}
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
                <div className="action" onClick={handlePress} style={{ cursor: 'pointer' }}>
                  <FaHeart color={liked ? 'red' : 'gray'} />
                  <span>{likeCount}</span>
                </div>

                <div className="action" onClick={() => setShowCommentModal(true)} style={{ cursor: 'pointer' }}>
                  <FaRegComment /> <span>{comments}</span>
                </div>

                <div className="action">
                  <FaShare /> <span>{shares}</span>
                </div>
              </div>
            </div>

            {/* PHẦN 2: Danh sách bình luận */}
            <div className="modal-comments" style={{ margin: '15px 0' }}>
              <span className="title-comment"> Bình luận </span>
              <ListComments postId={postId} groupId={groupId} userId={userId} />
            </div>

            {/* PHẦN 3: Nhập bình luận */}
            <div className="modal-input">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Nhập bình luận..."
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            {/* PHẦN 4: Nút đóng và gửi */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button onClick={() => setShowCommentModal(false)} style={{ marginRight: '10px' }}>Đóng</button>
              <button
                onClick={() => {
                  console.log('Bình luận:', newComment);
                  // TODO: Gửi bình luận lên Firebase tại đây
                  setNewComment('');
                  setShowCommentModal(false);
                }}
              >
                Gửi
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Post;
