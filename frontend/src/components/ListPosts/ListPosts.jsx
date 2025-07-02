// components/ListPost.jsx
import React, { use, useEffect, useState } from 'react';
import Post from '../../componentsItem/Post/Post';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebaseConfig';

const ListPost = ({ posts  }) => {

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
            marks={post.marks}
          />
        ))
      ) : (
        <p>Không có bài viết nào.</p>
      )}
    </div>
  );
};

export default ListPost;
