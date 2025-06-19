import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebaseConfig';
import './ListComments.css'; // bạn có thể tạo CSS riêng nếu cần
import Comment from '../../componentsItem/Comment/Comment';

const ListComments = ({ groupId, userId, postId, onTagUser }) => {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!groupId || !userId || !postId) return;

    const commentsRef = ref(database, `Posts/${groupId}/${userId}/${postId}/comments`);

    const unsubscribe = onValue(commentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const commentData = data.commentData || {};

        // Chuyển object thành mảng: [{ id, ... }]
        const commentList = Object.entries(commentData).map(([id, value]) => ({
          id,
          ...value,
        }));

        // Sắp xếp theo thời gian nếu có field createAt
        commentList.sort((a, b) => b.createAt - a.createAt);

        setComments(commentList);
      } else {
        setComments([]);
      }
    });

    return () => unsubscribe();
  }, [groupId, userId, postId]);

  return (
    <div className="list-comments">
      {comments.length === 0 ? (
        <p>Chưa có bình luận nào.</p>
      ) : (
        comments.map((comment) => (
          <Comment
            key={comment.commentId}
            groupId={groupId}
            userPostId={userId}
            postId={postId}
            commentId={comment.commentId}
            userCommentId={comment.userCommentId}
            content={comment.content}
            commentCreateAt={comment.commentCreateAt}
            commentLike={comment.commentLike}
            onTagUser={onTagUser}
          />
        ))
      )}
    </div>
  );
};

export default ListComments;
