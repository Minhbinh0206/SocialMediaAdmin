import React, { useEffect, useState, useRef } from 'react';
import { auth, database, storage } from '../../firebaseConfig';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import './CreateEvent.css';
import { push, ref, set } from 'firebase/database';

const generateQrCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const DD = String(d.getDate()).padStart(2, '0');
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const YYYY = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss} ${DD}/${MM}/${YYYY}`;
};

export default function CreateEvent({ onSubmit }) {
    const [userId, setUserId] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);
    const [previews, setPreviews] = useState([]);

    const fileInputRef = useRef();

    const [event, setEvent] = useState({
        titleEvent: '',
        eventId: '',
        contentEvent: '',
        beginAt: '',
        finishAt: '',
    });

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (currentUser) setUserId(currentUser.uid);
    }, []);

    useEffect(() => {
        previews.forEach((url) => URL.revokeObjectURL(url));
        const urls = imageFiles.map((file) => URL.createObjectURL(file));
        setPreviews(urls);
        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, [imageFiles]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEvent((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        if (e.target.files.length) {
            setImageFiles(Array.from(e.target.files));
        }
    };

    const removeImage = (index) => {
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ───── Validation nhanh ─────
        if (!userId) return alert('Bạn chưa đăng nhập!');
        if (!event.titleEvent.trim() || !event.beginAt || !event.finishAt)
            return alert('Vui lòng nhập tiêu đề & thời gian');
        if (!event.contentEvent.trim()) return alert('Nội dung bắt buộc');
        if (imageFiles.length === 0) return alert('Hãy chọn ít nhất 1 ảnh');

        try {
            /* 1) Tạo node mới dưới 'Events' và lấy eventId */
            const newEventRef = push(ref(database, `Events/${userId}`));  
            const eventId = newEventRef.key; 
            /* 2) Upload ảnh vào 'events/{eventId}/...' */
            const imageUrls = await Promise.all(
                imageFiles.map((file) => {
                    const path = `events/${eventId}/${Date.now()}_${file.name}`;
                    const fileRef = sRef(storage, path);
                    return uploadBytes(fileRef, file).then(() => getDownloadURL(fileRef));
                })
            );

            /* 3) Tạo payload */
            const payload = {
                ...event,
                userId,
                eventId,
                beginAt: formatDate(event.beginAt),
                finishAt: formatDate(event.finishAt),
                createAt: formatDate(Date.now()),
                imageEvents: imageUrls,
                currentQrCode: generateQrCode(),
                status: 0,
            };

            /* 4) Lưu payload vào Realtime DB */
            await set(newEventRef, payload);   // newEventRef == 'Events/{eventId}'

            /* 5) Reset form */
            setEvent({
                titleEvent: '',
                eventId: '',
                contentEvent: '',
                beginAt: '',
                finishAt: '',
            });
            setImageFiles([]);
            alert('Tạo sự kiện thành công!');
            onSubmit && onSubmit(payload);
        } catch (err) {
            console.error('Lỗi khi lưu sự kiện:', err);
            alert('Đã có lỗi, hãy thử lại');
        }
    };


    return (
        <form className="event-form" onSubmit={handleSubmit}>
            <h2>Tạo sự kiện mới</h2>

            <label>
                Tiêu đề <span className="req">*</span>
                <input
                    type="text"
                    name="titleEvent"
                    value={event.titleEvent}
                    onChange={handleChange}
                    required
                />
            </label>

            <label>
                Thời gian <span className="req">*</span>
                <div className="date-inline">
                    <input
                        type="datetime-local"
                        name="beginAt"
                        value={event.beginAt}
                        onChange={handleChange}
                        required
                    />
                    <span className="date-inline-preview">
                        -
                    </span>
                    <input
                        type="datetime-local"
                        name="finishAt"
                        value={event.finishAt}
                        onChange={handleChange}
                        required
                    />
                </div>
            </label>

            <label>
                Nội dung <span className="req">*</span>
                <textarea
                    name="contentEvent"
                    rows="6"
                    value={event.contentEvent}
                    onChange={handleChange}
                    required
                />
            </label>

            <div className="image-upload">
                <button
                    type="button"
                    className="image-button"
                    onClick={() => fileInputRef.current.click()}
                >
                    <div className="image-icon" />
                    Chọn ảnh
                </button>
                <span className="picked-count">
                    {imageFiles.length > 0
                        ? `${imageFiles.length} ảnh đã chọn`
                        : 'Chưa chọn ảnh'}
                </span>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    ref={fileInputRef}
                    onChange={handleImageChange}
                />
            </div>

            {previews.length > 0 && (
                <div className="grid-preview">
                    {previews.map((src, idx) => (
                        <div className="thumb-wrapper" key={idx}>
                            <img src={src} alt={`thumb-${idx}`} />
                            <span className="remove-btn" onClick={() => removeImage(idx)}>
                                &times;
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <button type="submit">Tạo sự kiện</button>
        </form>
    );
}
