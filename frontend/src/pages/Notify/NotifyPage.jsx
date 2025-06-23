import React, { useEffect, useState } from 'react';
import './NotifyPage.css'; // Assuming you have a CSS file for styling
import HomePersonal from '../../components/HomePersonal/HomePersonal';
import NavBar from '../../components/NavBar/NavBar';
import ListPost from '../../components/ListPosts/ListPosts';
import { FiEdit } from 'react-icons/fi';
import { auth } from '../../firebaseConfig';
import { ref, get, child, onValue } from 'firebase/database';
import { database } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import CreatePost from '../../components/CreatePost/CreatePost';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import CreateNotify from '../../components/CreateNotify/CreateNotify';

const NotifyPage = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate(); 
    const [showModal, setShowModal] = useState(false);
    const [myPost, setMyPosts] = useState([]);

    useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe(); // clean up
  }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                const uid = currentUser.uid;

                try {
                    const dbRef = ref(database);

                    const adminTypes = ['AdminBussinesses', 'AdminDefaults', 'AdminDepartments'];
                    let foundData = null;

                    for (const type of adminTypes) {
                        const snapshot = await get(child(dbRef, `Admins/${type}/${uid}`));
                        if (snapshot.exists()) {
                            foundData = snapshot.val();
                            foundData.role = type; // gắn thêm thông tin loại admin
                            break;
                        }
                    }

                    if (foundData) {
                        console.log('Admin data:', foundData);
                        setUser(foundData); // hoặc setUserData, tùy bạn đặt tên
                    } else {
                        console.log('Không tìm thấy user trong Admins');
                    }
                } catch (error) {
                    console.error('Lỗi truy xuất Admins:', error);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const postsRef = ref(database, 'Posts');

        const unsubscribe = onValue(postsRef, (snapshot) => {
            const postList = [];

            snapshot.forEach(groupSnap => {
                groupSnap.forEach(adminSnap => {
                    if (adminSnap.key === user?.uid) { 
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
                    }
                    return null;
                });
            });

            // Sắp xếp bài viết theo thời gian mới nhất nếu có createAt dạng timestamp
            postList.sort((a, b) => new Date(b.timeAgo) - new Date(a.timeAgo));

            setMyPosts(postList);

            console.log('Danh sách bài viết:', postList);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div>
            <NavBar />
            <div className="notify-container">
                <div className="notify-column left-notify">
                    <HomePersonal />
                </div>
                <div className="notify-column middle-notify">
                    <CreateNotify />
                </div>
                <div className="notify-column right-notify">
                    <h3>Danh sách thông báo của bạn</h3>
                </div>
            </div>
        </div>
    );
};

export default NotifyPage;
