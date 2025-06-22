import React, { use, useEffect, useState } from 'react';
import './Reply.css';
import { getDatabase, ref, onValue, set, get, query, orderByChild, equalTo, child } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { FaHeart, FaRegComment } from 'react-icons/fa';

const Reply = ({
  postId,
  replyId,
  groupId,
  commentId,
  userCommentId,
  userReplyId,
  content,
  createdAt,
  replyLike,
  userPostId,
  onTagUser,
}) => {
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const currentUserId = getAuth().currentUser?.uid;
  const [likeCount, setLikeCount] = useState(replyLike?.count || 0);


  useEffect(() => {
    const db = getDatabase();
    const likePath = `Posts/${groupId}/${userPostId}/${postId}/comments/commentData/${commentId}/replies/replyData/${replyId}/replyLike`;
    const commentLikeRef = ref(db, likePath);

    const unsubscribe = onValue(commentLikeRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.userIds) {
        setLikeCount(data.userIds.length);
        setLiked(data.userIds.includes(currentUserId));
      } else {
        setLikeCount(0);
        setLiked(false);
      }
    });

    return () => unsubscribe();
  }, [groupId, userPostId, postId, commentId, currentUserId]);

  const handlePress = async () => {
    const db = getDatabase();
    const likePath = `Posts/${groupId}/${userPostId}/${postId}/comments/commentData/${commentId}/replies/replyData/${replyId}/replyLike`;
    const likeRef = ref(db, likePath);

    try {
      const snapshot = await get(likeRef);
      const currentData = snapshot.val() || { count: 0, userIds: [] };
      let updatedUserIds = currentData.userIds || [];

      const isLiked = updatedUserIds.includes(currentUserId);
      if (isLiked) {
        updatedUserIds = updatedUserIds.filter((id) => id !== currentUserId);
      } else {
        updatedUserIds.push(currentUserId);
      }

      const newLikeData = {
        count: updatedUserIds.length,
        userIds: updatedUserIds,
      };

      await set(likeRef, newLikeData);
      setLiked(!liked);
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const fetchUserComment = async () => {
    const studentQuery = query(ref(getDatabase(), 'Students'), orderByChild('userId'), equalTo(userReplyId));
    try {
      const snapshot = await get(studentQuery);
      if (snapshot.exists()) {
        const student = Object.values(snapshot.val())[0];
        setUserName(student.studentName);
        setUserAvatar(student.avatar);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Lỗi khi tìm student:', err);
    }

    const adminPaths = ['AdminDefaults', 'AdminDepartments', 'AdminBusinesses'];
    try {
      for (let path of adminPaths) {
        const snapshot = await get(child(ref(getDatabase()), `Admins/${path}/${userReplyId}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUserName(data.fullName || 'No name');
          setUserAvatar(data.avatar || '/default-avatar.png');
          setLoading(false);
          return;
        }
      }
      setUserName('Không rõ');
      setUserAvatar('/default-avatar.png');
    } catch (err) {
      console.error('Lỗi khi tìm admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userCommentId) fetchUserComment();
  }, [userCommentId]);

  const formatDate = (date) => {
    if (!date || isNaN(Date.parse(date))) return 'Không xác định';
    const now = new Date();
    const commentDate = new Date(date);
    const diff = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  return (
    <div className="reply-container">
      <img src={userAvatar} alt="avatar" className="avatar" />
      <div className="comment-card">
        <div className="header">
          <span className="user-name">{loading ? 'Đang tải...' : userName}</span>
          <span className="comment-date">{formatDate(createdAt)}</span>
        </div>
        <p className="comment-content">{content}</p>
        <div className="action" onClick={handlePress}>
          <FaHeart color={liked ? 'red' : 'gray'} />
          <span>{likeCount}</span>
        </div>
        <div
          className="action"
          onClick={() =>
            onTagUser({ commentId, userCommentId, postId, userPostId, userReplyId })
          }
        >
          <FaRegComment /> <span>Phản hồi</span>
        </div>
      </div>
    </div>
  );
};

export default Reply;
