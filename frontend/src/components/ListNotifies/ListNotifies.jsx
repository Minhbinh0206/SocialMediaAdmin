import React, { useState, useEffect } from "react";
import Notify from "../../componentsItem/Notify/Notify";
import { ref, onValue, get, getDatabase } from "firebase/database";
import { database } from "../../firebaseConfig";

export default function ListNotifies({ role, currentUser }) {
    const [tab, setTab] = useState("new");
    const [sentNotifies, setSentNotifies] = useState([]);
    const [newNotifies, setNewNotifies] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [rawNotifications, setRawNotifications] = useState([]);

    // Fetch Admins
    useEffect(() => {
        const fetchAdmins = async () => {
            const db = getDatabase();

            const fetchPath = async (path) => {
                const snapshot = await get(ref(db, `Admins/${path}`));
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    return Object.keys(data).map((key) => ({
                        adminId: key,
                        fullName: data[key].fullName || 'Chưa có tên',
                        avatar: data[key].avatar || null,
                        type: path,
                    }));
                }
                return [];
            };

            const [defaultAdmins, departmentAdmins, businessAdmins] = await Promise.all([
                fetchPath('AdminDefaults'),
                fetchPath('AdminDepartments'),
                fetchPath('AdminBussinesses'),
            ]);

            setAdmins([...defaultAdmins, ...departmentAdmins, ...businessAdmins]);
        };

        fetchAdmins();
    }, []);

    // Fetch notifies
    useEffect(() => {
        const notifiesRef = ref(database, 'Notifies');
        const unsubscribe = onValue(notifiesRef, (snap) => {
            const data = snap.val();
            if (data) {
                const list = Object.keys(data).flatMap((uid) =>
                    Object.keys(data[uid]).map((nid) => ({
                        notifyId: nid,
                        userId: uid,
                        ...data[uid][nid],
                    }))
                );
                setRawNotifications(list);
            } else {
                setRawNotifications([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // Phân loại thông báo
    useEffect(() => {
        if (!role || !currentUser) return;

        const sent = [];
        const received = [];

        rawNotifications.forEach((notify) => {
            if (notify.userId === currentUser.adminId) {
                // Gửi bởi chính người dùng
                sent.push({
                    ...notify,
                    fullName: "Bạn",
                    avatar: currentUser.avatar,
                });
            } else {
                const adminInfo = admins.find(a => a.adminId === notify.userId);
                const fullName = adminInfo?.fullName || "Người gửi";
                const avatar = adminInfo?.avatar || "/default-avatar.png";

                const type = notify.filterData?.filterType;
                const ids = notify.filterData?.departmentIds || notify.filterData?.businessIds || [];

                if (role === "AdminDepartments" &&
                    (type === "departments" || type === "linkedDepartments") &&
                    ids.includes(currentUser.departmentId)
                ) {
                    received.push({
                        ...notify,
                        fullName,
                        avatar,
                    });
                }

                if (role === "AdminBussinesses" &&
                    (type === "bussinesses" || type === "linkedBussinesses") &&
                    ids.includes(currentUser.bussinessId)
                ) {
                    received.push({
                        ...notify,
                        fullName,
                        avatar,
                    });
                }
            }
        });

        sent.sort((a, b) => b.createAt - a.createAt);
        received.sort((a, b) => b.createAt - a.createAt);

        setSentNotifies(sent);
        setNewNotifies(received);
    }, [rawNotifications, role, currentUser, admins]);

    const data = tab === "sent" ? sentNotifies : newNotifies;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                📋 <span style={styles.headerText}>Danh sách thông báo</span>
            </div>

            <div style={styles.tabs}>
                <button
                    onClick={() => setTab("new")}
                    style={tab === "new" ? styles.activeTab : styles.tab}
                >
                    📢 Mới
                </button>
                <button
                    onClick={() => setTab("sent")}
                    style={tab === "sent" ? styles.activeTab : styles.tab}
                >
                    📤 Đã gửi
                </button>
            </div>

            <div style={styles.list}>
                {data.length === 0 ? (
                    <p style={styles.empty}>Không có thông báo</p>
                ) : (
                    data.map((n) => (
                        <Notify key={n.notifyId} notify={n} onClick={() => { }} />
                    ))
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        backgroundColor: "#fff",
        borderRadius: 8,
        boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
        overflow: "hidden",
        height: "100%",
    },
    tabs: {
        display: "flex",
        borderBottom: "1px solid #ddd",
    },
    tab: {
        flex: 1,
        padding: "10px 12px",
        cursor: "pointer",
        background: "#f9f9f9",
        border: "none",
        fontWeight: "bold",
    },
    activeTab: {
        flex: 1,
        padding: "10px 12px",
        cursor: "pointer",
        background: "#1877F2",
        color: "#fff",
        border: "none",
        fontWeight: "bold",
    },
    list: {
        padding: 12,
        overflowY: "auto",
        maxHeight: "calc(100vh - 140px)",
    },
    empty: {
        textAlign: "center",
        color: "#888",
        fontStyle: "italic",
    },
    header: {
        padding: "14px 16px 10px",
        fontSize: "16px",
        fontWeight: "bold",
        color: "#333",
        borderBottom: "1px solid #ddd",
        backgroundColor: "#f6f6f6",
    },
    headerText: {
        marginLeft: 6,
    },
};
