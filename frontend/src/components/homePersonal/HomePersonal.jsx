import React, { useEffect, useState } from 'react';
import './HomePersonal.css';
import { auth } from '../../firebaseConfig'; // sửa đường dẫn nếu khác
import { ref, get, child } from 'firebase/database';
import { database } from '../../firebaseConfig';

const HomePersonal = () => {
  const [user, setUser] = useState(null);

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
        <div className='home'>Home</div>
        <div className='posts'>Bài viết</div>
        <div className='notify'>Thông báo</div>
        <div className='event'>Sự kiện</div>
      </div>
    </div>
  );
};

export default HomePersonal;
