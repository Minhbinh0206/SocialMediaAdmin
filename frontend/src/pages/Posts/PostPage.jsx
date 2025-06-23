import React, { useEffect, useState } from 'react';
import './PostPage.css'; // Assuming you have a CSS file for styling
import HomePersonal from '../../components/HomePersonal/HomePersonal';
import NavBar from '../../components/NavBar/NavBar';
import ListPost from '../../components/ListPosts/ListPosts';
import { FiEdit } from 'react-icons/fi';
import { auth } from '../../firebaseConfig'; // sửa đường dẫn nếu khác
import { ref, get, child, onValue } from 'firebase/database';
import { database } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import CreatePost from '../../components/CreatePost/CreatePost';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const PostPage = () => {
    const [firebaseUser, setFirebaseUser] = useState(null); // lưu user từ Firebase Auth
    const [adminUser, setAdminUser] = useState(null);       // lưu user từ Admins node
    const [showModal, setShowModal] = useState(false);
    const [myPost, setMyPosts] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setFirebaseUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchAdminData = async () => {
            if (!firebaseUser) return;
            const uid = firebaseUser.uid;
            const dbRef = ref(database);

            try {
                const adminTypes = ['AdminBusinesses', 'AdminDefaults', 'AdminDepartments'];
                let foundData = null;

                for (const type of adminTypes) {
                    const snapshot = await get(child(dbRef, `Admins/${type}/${uid}`));
                    if (snapshot.exists()) {
                        foundData = snapshot.val();
                        foundData.role = type;
                        break;
                    }
                }

                if (foundData) {
                    setAdminUser(foundData);
                } else {
                    console.log('Không tìm thấy user trong Admins');
                }
            } catch (error) {
                console.error('Lỗi truy xuất Admins:', error);
            }
        };

        fetchAdminData();
    }, [firebaseUser]);


    useEffect(() => {
        if (!firebaseUser) return;
        const postsRef = ref(database, 'Posts');

        const unsubscribe = onValue(postsRef, (snapshot) => {
            const postList = [];

            snapshot.forEach(groupSnap => {
                groupSnap.forEach(adminSnap => {
                    adminSnap.forEach(postSnap => {
                        const postData = postSnap.val();
                        if (postData.userId === firebaseUser.uid) {  // 👈 chỉ lấy post của current user
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
                        }
                    });
                });
            });

            postList.sort((a, b) => new Date(b.timeAgo) - new Date(a.timeAgo));
            setMyPosts(postList);
        });

        return () => unsubscribe();
    }, [firebaseUser]);


    return (
        <div>
            <NavBar />
            <div className="home-container">
                <div className="column left-column">
                    <HomePersonal />
                </div>
                <div className="middle2-column">
                    <div>
                        <div className='create-post'>
                            {/* Hiển thị avatar nếu có */}
                            {adminUser && adminUser.avatar ? (
                                <img src={adminUser.avatar} alt='avatar' className='avatar-cre' />
                            ) : (
                                <div className='avatar-cre placeholder'>🙂</div>
                            )}
                            <div className='field' onClick={() => setShowModal(true)}>
                                Tạo bài viết mới...
                            </div>
                            <div className='button-action'>
                                <button className="create-btn" onClick={() => setShowModal(true)}>
                                    <FiEdit className="icon" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="column middle-column">
                        <h3 style={{ fontSize: 25, padding: '0 30px' }}>Quản lý bài viết</h3>
                        <ListPost posts={myPost} />
                    </div>
                </div>
                <div className="column right-column">
                    <h3>Cột phải</h3>
                    <p>Thông báo, lời mời, bạn bè…</p>
                </div>
                {showModal && <CreatePost onClose={() => setShowModal(false)} />}
            </div>
        </div>
    );
};

export default PostPage;
