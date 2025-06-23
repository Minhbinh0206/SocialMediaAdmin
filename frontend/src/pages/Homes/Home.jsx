import React, { useEffect } from 'react';
import './Home.css';
import HomePersonal from '../../components/HomePersonal/HomePersonal';
import NavBar from '../../components/NavBar/NavBar';
import ListPost from '../../components/ListPosts/ListPosts';
import { onValue, ref } from 'firebase/database';
import { database } from '../../firebaseConfig';

const HomePage = () => {
  const [posts, setPosts] = React.useState([]);

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
    <div>
      <NavBar />
      <div className="home-container">
        <div className="column left-column">
          <HomePersonal />
        </div>
        <div className="column middle-column">
          <h3 style={{ fontSize: 25, padding: '0 30px' }}>Bảng tin</h3>
          <ListPost posts={posts} />
        </div>
        <div className="column right-column">
          <h3>Cột phải</h3>
          <p>Thông báo, lời mời, bạn bè…</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
