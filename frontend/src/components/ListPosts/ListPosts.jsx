// components/ListPost.jsx
import React from 'react';
import Post from '../../componentsItem/Post/Post.tsx';

const ListPost = () => {
  const posts = [
    {
      id: 1,
      avatar: 'https://i.pravatar.cc/100?img=1',
      name: 'Nguyễn Văn A',
      timeAgo: '177 ngày trước',
      image: 'https://cdn.pixabay.com/photo/2017/11/09/21/41/cat-2934720_1280.jpg',
      description: "Tham gia cuộc thi nhiếp ảnh với chủ đề 'Khoảnh khắc tuổi trẻ' từ ngày 1/10 đến 30/10.",
      likes: 45,
      comments: 0,
      shares: 0,
    },
    // Có thể thêm nhiều post ở đây
  ];

  return (
    <div className="list-posts">
      {posts.map(post => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  );
};

export default ListPost;
