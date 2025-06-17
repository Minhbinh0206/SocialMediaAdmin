import React, { useEffect, useState } from 'react';
import './PostPage.css'; // Assuming you have a CSS file for styling
import HomePersonal from '../../components/HomePersonal/HomePersonal';
import NavBar from '../../components/NavBar/NavBar';
import ListPost from '../../components/ListPosts/ListPosts';
import { FiEdit } from 'react-icons/fi';
import { auth } from '../../firebaseConfig'; // sửa đường dẫn nếu khác
import { ref, get, child } from 'firebase/database';
import { database } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import CreatePost from '../../components/CreatePost/CreatePost';

const PostPage = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate(); // 👈 khởi tạo điều hướng
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                const uid = currentUser.uid;

                try {
                    const dbRef = ref(database);

                    const adminTypes = ['AdminBusinesses', 'AdminDefaults', 'AdminDepartments'];
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
                            {user && user.avatar ? (
                                <img src={user.avatar} alt='avatar' className='avatar-cre' />
                            ) : (
                                <div className='avatar-cre placeholder'>🙂</div> // avatar mặc định
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
                        <ListPost />
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
