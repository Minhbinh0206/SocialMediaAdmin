// src/pages/ListSurveys.jsx
import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, get } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import dayjs from 'dayjs';
import './ListSurveys.css';
import Survey from '../../componentsItem/Survey/Survey';

/* =========== HÀM LẤY INFO ADMIN =========== */
async function fetchAdminInfo(uid) {
  const db = getDatabase();
  const paths = [
    `Admins/AdminDepartments/${uid}`,
    `Admins/AdminDefaults/${uid}`,
    `Admins/AdminBussinesses/${uid}`,
  ];
  for (const p of paths) {
    const snap = await get(ref(db, p));
    if (snap.exists()) return snap.val(); // { fullName, avatar }
  }
  return null;
}

/* =========== COMPONENT ITEM =========== */
function SurveyItem({ survey, onResult }) {
  const { title, finishedAt, userId } = survey;
  const [owner, setOwner] = useState({ fullName: 'Không rõ', avatar: '/default.png' });
  const [left, setLeft] = useState(() => calcLeft(finishedAt));

  useEffect(() => {
    const id = setInterval(() => setLeft(calcLeft(finishedAt)), 1000);
    return () => clearInterval(id);
  }, [finishedAt]);

  useEffect(() => {
    let cancelled = false;
    fetchAdminInfo(userId).then(info => {
      if (info && !cancelled) setOwner(info);
    });
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <li className="survey-item">
      {/* Hàng trên */}
      <div className="survey-header">
        <div className="survey-header-left">
          <img className="survey-avatar" src={owner.avatar || '/default.png'} alt="avatar" />
          <span className="survey-org">{owner.fullName}</span>
        </div>
        <span className="survey-tag">📊 Khảo sát</span>
      </div>

      {/* Tiêu đề */}
      <div className="survey-title">{title}</div>

      {/* Hàng dưới */}
      <div className="survey-footer">
        <button
          className="survey-view-button"
          onClick={() => onResult(survey)}
        >
          Xem kết quả khảo sát
        </button>
        <span className="survey-time">{left}</span>
      </div>
    </li>
  );
}

/* =========== TÍNH THỜI GIAN CÒN LẠI =========== */
function calcLeft(finish) {
  const diff = dayjs(finish).diff(dayjs(), 'second');
  if (diff <= 0) return '00:00:00';
  const h = String(Math.floor(diff / 3600)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
  const s = String(diff % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/* =========== LIST CHÍNH =========== */
export default function ListSurveys() {
  const [surveys, setSurveys] = useState([]);
  const [modalSurvey, setModalSurvey] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, user => {
      if (!user) {
        setSurveys([]);
        return;
      }

      const db = getDatabase();
      const r = ref(db, 'Surveys');

      const unsubscribeDB = onValue(r, snap => {
        const allSurveys = snap.val() || {};
        const userSurveys = Object.values(allSurveys)
          .filter(s => s.userId === user.uid)
          .sort((a, b) => b.createdAt - a.createdAt);
        setSurveys(userSurveys);
      });

      return () => unsubscribeDB();
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <div className="list-survey">
      {surveys.length === 0 ? (
        <p className="empty-msg">Bạn chưa tạo khảo sát nào.</p>
      ) : (
        <p className="survey-list">
          {surveys.map(sv => (
            <SurveyItem key={sv.surveyId} survey={sv} onResult={setModalSurvey} />
          ))}
        </p>
      )}

      {/* MODAL */}
      {modalSurvey && (
        <div className="survey-modal-wrapper">
          <Survey survey={modalSurvey} onClose={() => setModalSurvey(null)} />
        </div>
      )}
    </div>
  );
}
