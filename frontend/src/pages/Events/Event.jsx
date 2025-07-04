import React, { useEffect, useState } from 'react';
import './Event.css';
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
import ListNotifies from '../../components/ListNotifies/ListNotifies';
import CreateEvent from '../../components/CreateEvent/CreateEvent';
import ListEvents from '../../components/ListEvent/ListEvents';

const EventPage = () => {
    const [user, setUser] = useState(null);

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

    return (
        <div>
            <NavBar />
            <div className="notify-container">
                <div className="notify-column left-notify">
                    <HomePersonal />
                </div>
                <div className="notify-column middle-notify">
                    <CreateEvent />
                </div>
                <div className="notify-column right-notify">
                    <ListEvents />
                </div>
            </div>
        </div>
    );
};

export default EventPage;
