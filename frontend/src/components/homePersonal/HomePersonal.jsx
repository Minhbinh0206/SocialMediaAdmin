import React, { useEffect, useState } from 'react';
import './HomePersonal.css';
import { auth } from '../../firebaseConfig'; // sửa đường dẫn nếu khác
import { ref, get, child } from 'firebase/database';
import { database } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';

const HomePersonal = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // 👈 khởi tạo điều hướng

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

  return (
    <div className='container'>
      <div className='personal-container'>
        {/* Hiển thị avatar nếu có */}
        {user && user.avatar ? (
          <img src={user.avatar} alt='avatar' className='avatar' />
        ) : (
          <div className='avatar placeholder'>🙂</div> // avatar mặc định
        )}
        <div className='name'>
          {user ? `${user.fullName || user.email}` : 'Chưa đăng nhập'}
        </div>
      </div>

      <div className='manager-container'>
        <div className='home' onClick={() => navigate('/home')}>Home</div>
        <div className='posts' onClick={() => navigate('/posts')}>Bài viết</div>
        <div className='notify' onClick={() => navigate('/notifies')}>Thông báo</div>
        <div className='event' onClick={() => navigate('/events')}>Sự kiện</div>
      </div>
    </div>
  );
};

export default HomePersonal;
