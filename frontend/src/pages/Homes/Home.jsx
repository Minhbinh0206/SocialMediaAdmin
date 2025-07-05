import React, { useEffect } from 'react';
import './Home.css';
import HomePersonal from '../../components/HomePersonal/HomePersonal';
import NavBar from '../../components/NavBar/NavBar';
import ListPost from '../../components/ListPosts/ListPosts';
import { onValue, ref } from 'firebase/database';
import { database } from '../../firebaseConfig';
import ListSurveys from '../../components/ListSurveys/ListSurveys';

const HomePage = () => {
  const [posts, setPosts] = React.useState([]);

  useEffect(() => {
    const defaultsRef = ref(database, 'PostDefaults');

    const unsubscribe = onValue(defaultsRef, snapshot => {
      const list = [];

      snapshot.forEach(postSnap => {
        const data = postSnap.val();

        list.push({
          id: postSnap.key,                     
          postId: data.postId || postSnap.key,
          groupId: data.groupId || '',
          userId: data.userId || '',
          timeAgo: data.createAt || '',         
          postImage: Array.isArray(data.postImage) ? data.postImage : [],
          description: data.content,
          likes: data.postLike?.count || 0,
          likedUserIds: Array.isArray(data.postLike?.userIds)
            ? data.postLike.userIds
            : [],
          comments: 0,
          shares: 0,
        });
      });

      // sắp xếp mới nhất
      list.sort(
        (a, b) => Number(b.timeAgo) - Number(a.timeAgo)
      );

      setPosts(list);
    });

    return () => unsubscribe();
  }, [posts]);

  return (
    <div>
      <NavBar />
      <div className="home-container">
        <div className="column left-column">
          <HomePersonal />
        </div>
        <div className="column middle-column">
          <h3 style={{ fontSize: 25, padding: '0 30px' }}>Bài viết</h3>
          <ListPost posts={posts} />
        </div>
        <div className="column right-column">
          <h3 style={{ fontSize: 25, padding: '0 30px' }}>Khảo sát</h3>
          <ListSurveys />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
