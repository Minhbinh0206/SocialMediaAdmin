import React, { useEffect, useState } from 'react';
import './Post.css';
import { FaHeart, FaRegComment, FaShare } from 'react-icons/fa';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ref, get, child, set, onValue, push, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import ListComments from '../../components/ListComments/ListComments';


dayjs.extend(relativeTime);

interface Tag {
  commentId: string;
  userCommentId: string;
  postId: string;
  userReplyId: string;
  userPostId: string;
}

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
  const [tag, setTag] = useState<Tag | null>();
  const [commentCount, setCommentCount] = useState(0);
  const [userNametag, setUserNameTag] = useState('');

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

  useEffect(() => {
    if (!groupId || !userId || !postId) return;

    const commentsRef = ref(database, `Posts/${groupId}/${userId}/${postId}/comments`);

    const unsubscribe = onValue(commentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const commentData = data.commentData || {};

        const commentList = Object.entries(commentData).map(([id, value]) => ({ id, ...(value as Record<string, any>) }));
        setCommentCount(commentList.length); // Gán số lượng
      } else {
        setCommentCount(0);
      }
    });

    return () => unsubscribe();
  }, [groupId, userId, postId]);

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

  const handleComment = async () => {
    if (!newComment.trim()) return;

    if (tag != null) {
      // Xử lý khi có tag
      const replyRef = ref(database, `Posts/${groupId}/${userId}/${postId}/comments/commentData/${tag.commentId}/replies/replyData`);
      const newReplyRef = push(replyRef);

      const replyData = {
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
        replyLike: 0,
        replyId: newReplyRef.key || '',
        userReplyId: currentUserId || '',
      };

      await set(newReplyRef, replyData);

      // Cập nhật lại count
      const countRef = ref(database, `Posts/${groupId}/${userId}/${postId}/comments/commentData/${tag.commentId}/replies/count`);
      await get(countRef).then(snapshot => {
        const currentCount = snapshot.exists() ? snapshot.val() : 0;
        set(countRef, currentCount + 1);
      });

      setTag(null);
    }
    else {
      const commentDataRef = ref(database, `Posts/${groupId}/${userId}/${postId}/comments/commentData`);
      const newCommentRef = push(commentDataRef); // Đẩy vào commentData

      const commentData = {
        userCommentId: currentUserId || '',
        commentId: newCommentRef.key || '',
        content: newComment.trim(),
        commentCreateAt: new Date().toISOString(),
        commentLike: 0,
      };

      // Ghi dữ liệu bình luận
      await set(newCommentRef, commentData);

      // Cập nhật lại count
      const countRef = ref(database, `Posts/${groupId}/${userId}/${postId}/comments/count`);
      await get(countRef).then(snapshot => {
        const currentCount = snapshot.exists() ? snapshot.val() : 0;
        set(countRef, currentCount + 1);
      });
    }

    setNewComment('');
  };

  const findAdminByUserId = async (userId: string): Promise<string> => {
    const adminPaths = ['AdminDefaults', 'AdminDepartments', 'AdminBusinesses'];
    for (let path of adminPaths) {
      const pathRef = ref(database, `Admins/${path}/${userId}`);
      const snapshot = await get(pathRef);
      console.log(`Đang kiểm tra path: Admins/${path}/${userId}`);
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('Tìm thấy admin:', data);
        return data.fullName || 'No name';
      }
    }
    console.log('Không tìm thấy admin:', userId);
    return 'Không rõ';
  };

  const findAdminOrStudentByUserId = async (userId: string): Promise<string> => {
    const adminName = await findAdminByUserId(userId);
    if (adminName !== 'Không rõ') return adminName;

    console.log('Không phải admin, thử tìm student:', userId);

    const studentQuery = query(ref(database, 'Students'), orderByChild('userId'), equalTo(userId));
    const snapshot = await get(studentQuery);

    if (snapshot.exists()) {
      const firstItem: any = Object.values(snapshot.val())[0];
      console.log('Tìm thấy student:', firstItem);
      return firstItem.studentName || 'No name';
    }

    console.log('Không tìm thấy student:', userId);
    return 'Không rõ';
  };

  const handleTagUser = async (userTag: Tag) => {
    let userName = '';

    if (userTag.userReplyId) {
      userName = await findAdminByUserId(userTag.userReplyId);
    }

    if (!userTag.userReplyId && userTag.userCommentId) {
      userName = await findAdminOrStudentByUserId(userTag.userCommentId);
    }

    setUserNameTag(userName); // Cập nhật state sau khi đã chắc chắn có tên
    setTag(userTag); // Cập nhật tag
  };

  const removeTag = () => {
    setTag(null); // Xóa tag
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
            <FaRegComment /> <span>{commentCount}</span>
          </div>

          <div className="action">
            <FaShare /> <span>{shares}</span>
          </div>
        </div>
      </div>

      {showCommentModal && (
        <div className="modal-backdrop" onClick={() => setShowCommentModal(false)}>

          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowCommentModal(false)}>×</button>

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
                  <FaRegComment /> <span>{commentCount}</span>
                </div>

                <div className="action">
                  <FaShare /> <span>{shares}</span>
                </div>
              </div>
            </div>

            {/* PHẦN 2: Danh sách bình luận */}
            <div className="modal-comments" style={{ margin: '15px 0' }}>
              <span className="title-comment"> Bình luận </span>
              <ListComments postId={postId} groupId={groupId} userId={userId} onTagUser={handleTagUser} />
            </div>
          </div>

          {/* Thanh nhập bình luận đặt riêng bên ngoài để dính đáy */}
          <div className="modal-input" onClick={(e) => e.stopPropagation()}>
            {tag && (
              <div className="tag-preview">
                <span>Đang phản hồi <strong>@{userNametag}</strong></span>
                <button className="cancel-tag" onClick={removeTag}>×</button>
              </div>
            )}
            <div className="input-send-container">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Nhập bình luận..."
                className="comment-textarea"
                rows={1}
              />
              <button
                className="send-button"
                onClick={() => {
                  console.log('Bình luận:', newComment);
                  handleComment();
                  setNewComment('');
                }}
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      )
      }
    </div >
  );
};

export default Post;
