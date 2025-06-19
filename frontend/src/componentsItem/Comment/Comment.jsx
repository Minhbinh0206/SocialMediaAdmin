import React, { useState, useEffect } from 'react';
import { ref, get, onValue, set, query, orderByChild, equalTo, getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const Comment = ({
  groupId,
  postId,
  commentId,
  userCommentId,
  content,
  commentCreateAt,
  commentLike,
  userPostId,
  onTagUser
}) => {
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('/default-avatar.png');
  const [loading, setLoading] = useState(true);
  const [replyCount, setReplyCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(commentLike?.count || 0);
  const [replies, setReplies] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const currentUserId = getAuth().currentUser?.uid;

  const db = getDatabase();

  useEffect(() => {
    const likeRef = ref(db, `Posts/${groupId}/${userPostId}/${postId}/comments/commentData/${commentId}/commentLike`);
    return onValue(likeRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.userIds) {
        setLikeCount(data.userIds.length);
        setLiked(data.userIds.includes(currentUserId));
      } else {
        setLikeCount(0);
        setLiked(false);
      }
    });
  }, [groupId, userPostId, postId, commentId, currentUserId]);

  const handleLike = async () => {
    const likeRef = ref(db, `Posts/${groupId}/${userPostId}/${postId}/comments/commentData/${commentId}/commentLike`);
    const snapshot = await get(likeRef);
    const currentData = snapshot.val() || { count: 0, userIds: [] };
    let updatedUserIds = currentData.userIds || [];

    const newLike = !liked;
    if (newLike) {
      if (!updatedUserIds.includes(currentUserId)) {
        updatedUserIds.push(currentUserId);
      }
    } else {
      updatedUserIds = updatedUserIds.filter((id) => id !== currentUserId);
    }

    const newData = {
      count: updatedUserIds.length,
      userIds: updatedUserIds,
    };

    await set(likeRef, newData);
  };

  const fetchStudent = async () => {
    const studentQuery = query(ref(db, 'Students'), orderByChild('userId'), equalTo(userCommentId));
    try {
      const snapshot = await get(studentQuery);
      if (snapshot.exists()) {
        const value = Object.values(snapshot.val())[0];
        setUserName(value.studentName);
        setUserAvatar(value.avatar);
      }
    } catch (err) {
      console.error('Error fetching student info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [userCommentId]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <img src={userAvatar} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 10 }} />
        <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: 10, padding: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{loading ? 'Đang tải...' : userName}</strong>
            <small>{formatDate(commentCreateAt)}</small>
          </div>
          <p style={{ margin: '10px 0' }}>{content}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleLike} style={{ cursor: 'pointer' }}>
              👍 {likeCount}
            </button>
            <button onClick={() => onTagUser({ commentId, userCommentId, postId, userPostId, userReplyId: '' })}>
              💬 {replyCount}
            </button>
          </div>
        </div>
      </div>

      {/* {replies.length > 0 && (
        <div style={{ marginLeft: 50 }}>
          <button
            style={{ marginTop: 10, marginBottom: 5, background: 'none', border: 'none', color: 'blue' }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Thu gọn' : `Hiển thị thêm ${replies.length} phản hồi...`}
          </button>

          {isExpanded && (
            <div>
              {replies.map((reply) => (
                <ItemReply
                  key={reply.replyId}
                  groupId={groupId}
                  replyId={reply.replyId}
                  userPostId={userPostId}
                  userReplyId={reply.userReplyId}
                  commentId={commentId}
                  createdAt={reply.createdAt}
                  replyLike={reply.replyLike}
                  userCommentId={userCommentId}
                  content={reply.content}
                  postId={postId}
                  onTagUser={onTagUser}
                />
              ))}
            </div>
          )}
        </div>
      )} */}
    </div>
  );
};

export default Comment;
