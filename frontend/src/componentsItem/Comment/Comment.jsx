import React, { useState, useEffect } from 'react';
import { ref, get, onValue, set, query, orderByChild, equalTo, getDatabase, child } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { FaHeart, FaRegComment } from 'react-icons/fa';
import './Comment.css'; // Import your CSS styles

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

  const fetchUserComment = async () => {
    const studentQuery = query(ref(db, 'Students'), orderByChild('userId'), equalTo(userCommentId));

    try {
      const snapshot = await get(studentQuery);
      if (snapshot.exists()) {
        const value = Object.values(snapshot.val())[0];
        setUserName(value.studentName);
        setUserAvatar(value.avatar);
        setLoading(false);
        return; // ✅ Nếu tìm thấy student thì return luôn
      }
    } catch (err) {
      console.error('Lỗi khi tìm student:', err);
    }

    const adminPaths = ['AdminDefaults', 'AdminDepartments', 'AdminBusinesses'];
    try {
      for (let path of adminPaths) {
        const snapshot = await get(child(ref(db), `Admins/${path}/${userCommentId}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUserName(data.fullName || 'No name');
          setUserAvatar(data.avatar || '/default-avatar.png');
          setLoading(false);
          return;
        }
      }

      console.log('Không tìm thấy userCommentId ở Students hoặc Admins:', userCommentId);
      setUserName('Không rõ');
      setUserAvatar('/default-avatar.png');
    } catch (err) {
      console.error('Lỗi khi tìm admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userCommentId) {
      fetchUserComment();
    }
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
    <div className="comment-wrapper">
      <div className="comment-inner">
        <img src={userAvatar} alt="avatar" className="comment-avatar" />
        <div className="comment-content-box">
          <div className="comment-header">
            <strong>{loading ? 'Đang tải...' : userName}</strong>
            <small>{formatDate(commentCreateAt)}</small>
          </div>
          <p className="comment-text">{content}</p>
          <div className="post-actions">
            <div className="action" onClick={handleLike}>
              <FaHeart color={liked ? 'red' : 'gray'} />
              <span>{likeCount}</span>
            </div>
            <div
              className="action"
              onClick={() =>
                onTagUser({
                  commentId: commentId,
                  userCommentId: userCommentId,
                  postId: postId,
                  userReplyId: '', // vì đây là phản hồi bình luận chính
                  userPostId: userPostId,
                })
              }
            >
              <FaRegComment /> <span>{replyCount}</span>
            </div>
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
