// components/ListPost.jsx
import React, { use, useEffect, useState } from 'react';
import Post from '../../componentsItem/Post/Post.tsx';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebaseConfig';

const ListPost = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const postsRef = ref(database, 'Posts');

    const unsubscribe = onValue(postsRef, (snapshot) => {
      const postList = [];

      snapshot.forEach(groupSnap => {
        groupSnap.forEach(adminSnap => {
          adminSnap.forEach(postSnap => {
            const postData = postSnap.val();

            postList.push({
              id: postData.postId,
              groupId: postData.groupId || '',
              userId: postData.userId || '',
              postId: postData.postId || '',
              timeAgo: postData.createAt || '',
              postImage: Array.isArray(postData.postImage) ? postData.postImage : [],
              description: postData.content,
              likes: postData.postLike?.count || 0,
              likedUserIds: Array.isArray(postData.postLike?.userIds) ? postData.postLike.userIds : [],
              comments: 0,
              shares: 0,
            });
          });
        });
      });

      // Sắp xếp bài viết theo thời gian mới nhất nếu có createAt dạng timestamp
      postList.sort((a, b) => new Date(b.timeAgo) - new Date(a.timeAgo));

      setPosts(postList);

      console.log('Danh sách bài viết:', postList);

    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="list-posts">
      {posts.length > 0 ? (
        posts.map(post => (
          <Post
            key={post.id}
            postId={post.postId}
            userId={post.userId}
            createAt={post.timeAgo}
            postImage={post.postImage}
            content={post.description}
            likes={post.likes}
            groupId={post.groupId}
            comments={post.comments}
            shares={post.shares}
          />
        ))
      ) : (
        <p>Không có bài viết nào.</p>
      )}
    </div>
  );
};

export default ListPost;
