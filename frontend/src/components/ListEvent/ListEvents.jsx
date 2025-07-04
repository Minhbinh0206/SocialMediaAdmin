// src/components/ListEvent/ListEvents.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { getDatabase, ref, onValue, update, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { FiTrash2 } from 'react-icons/fi';
import Event from '../../componentsItem/Event/Event';
import './ListEvents.css';

/* ====== HẰNG SỐ DÙNG CHUNG ====== */
const FORMAT = 'HH:mm:ss DD/MM/YYYY';
const STATUS_TXT = ['Sắp bắt đầu', 'Đang diễn ra', 'Đã kết thúc'];
const SURVEY_TYPES = {
  option: 'Khảo sát lựa chọn',
  number: 'Khảo sát số lượng',
  level: 'Khảo sát mức độ',
};
const emojiLevels = ['😞', '🙂', '😊', '😁', '😍'];
const emojiDescriptions = ['Rất tệ', 'Không thích', 'Bình thường', 'Thích', 'Rất thích'];

const getColorByLevel = (level) => {
  switch (level) {
    case 1: return '#e74c3c';
    case 2: return '#e67e22';
    case 3: return '#f1c40f';
    case 4: return '#27ae60';
    case 5: return '#2ecc71';
    default: return '#333';
  }
};

/* =========================================================
 *  COMPONENT CON – EventModal
 *  (đặt ngoài ListEvents để giữ identity ⇒ không mất focus)
 * ========================================================= */
function EventModal({
  open,
  onClose,
  evt,
  questions,
  setQuestions,
  page,
  setPage,
  pages,
  addQuestion,
  updateQuestion,
  removeQuestion,
  handleSubmit,
  hasSurvey, // ✅ THÊM
}) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [showQR, setShowQR] = useState(false);

  /* Auto‑slide ảnh trong modal */
  useEffect(() => {
    if (!open || !Array.isArray(evt?.imageEvents)) return;
    const id = setInterval(
      () => setSlideIndex((i) => (i + 1) % evt.imageEvents.length),
      7000
    );
    return () => clearInterval(id);
  }, [evt, open]);

  if (!open || !evt) return null;

  const isArray = Array.isArray(evt.imageEvents);

  console.log(evt.currentQrCode);
  

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="event-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* nút đóng */}
        <button className="btn-icon" onClick={onClose} aria-label="Close modal">✕</button>

        {/* ------ LEFT (thông tin event) ------ */}
        <div className="event-modal-left">
          {isArray ? (
            <div className="modal-slide-wrapper">
              <img
                src={evt.imageEvents[slideIndex]}
                alt={`slide-${slideIndex}`}
                className="modal-slide-image"
              />
              <div className="modal-dots">
                {evt.imageEvents.map((_, i) => (
                  <span
                    key={i}
                    onClick={() => setSlideIndex(i)}
                    className={`dot ${i === slideIndex ? 'active' : ''}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            evt.imageEvents && (
              <img
                src={evt.imageEvents}
                alt={evt.titleEvent}
                className="modal-single-image"
              />
            )
          )}

          <h2 className="modal-title">{evt.titleEvent}</h2>

          <div className="modal-info-box">
            <div className={`modal-status status-${evt.status}`}>
              <span className="dot-icon" />
              {STATUS_TXT[evt.status]}
            </div>

            <div className="modal-datetime">
              <div>
                <div className="label">Bắt đầu</div>
                <div>{dayjs(evt.beginAt, FORMAT).format(FORMAT)}</div>
              </div>
              <div>
                <div className="label">Kết thúc</div>
                <div>{dayjs(evt.finishAt, FORMAT).format(FORMAT)}</div>
              </div>
            </div>
          </div>

          <div className="modall-content">{evt.contentEvent}</div>
        </div>

        {/* ------ RIGHT (survey) ------ */}
        <div className="event-modal-right">
          <div className="event-survey-box">
            <h2 className="event-survey-heading">Tạo Khảo Sát</h2>

            {/* nút chọn loại câu hỏi */}
            <div className="event-survey-type-buttons">
              {Object.entries(SURVEY_TYPES).map(([id, label]) => (
                <button key={id} className="type-btn" onClick={() => addQuestion(id)}>
                  {label}
                </button>
              ))}
            </div>

            {/* danh sách câu hỏi */}
            <div className="event-question-list">
              {pages[page]?.map((q) => {
                const globalIndex = questions.findIndex((item) => item.id === q.id);

                return (
                  <div key={q.id} className="event-question-card">
                    <div>
                      <button className="trash-btn" onClick={() => removeQuestion(q.id)}>
                        <FiTrash2 size={16} />
                      </button>
                      <label className="q-label">Câu {globalIndex + 1}: </label>
                    </div>

                    <textarea
                      className="event-q-text"
                      value={q.text}
                      placeholder="Nhập nội dung câu hỏi..."
                      onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                    />

                    {/* --- Option (A‑D) --- */}
                    {q.type === 'option' && (
                      <ul className="event-option-group">
                        {['A', 'B', 'C', 'D'].map((letter, i) => (
                          <li key={letter}>
                            <span className="opt-letter">{letter}.</span>
                            <input
                              className="opt-input"
                              placeholder={`Lựa chọn ${letter}`}
                              value={q.options[i]}
                              onChange={(e) => {
                                const opts = [...q.options];
                                opts[i] = e.target.value;
                                updateQuestion(q.id, { options: opts });
                              }}
                            />
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* --- Number (min–max) --- */}
                    {q.type === 'number' && (
                      <div className="event-number-block">
                        <div className="minmax-inputs">
                          <label>
                            Min:
                            <input
                              type="number"
                              className="nm-input"
                              value={q.min}
                              onChange={(e) => {
                                const min = Math.max(0, +e.target.value);
                                const max = Math.max(min, q.max);
                                const val = Math.min(Math.max(q.value, min), max);
                                updateQuestion(q.id, { min, max, value: val });
                              }}
                            />
                          </label>
                          <label>
                            Max:
                            <input
                              type="number"
                              className="nm-input"
                              value={q.max}
                              onChange={(e) => {
                                const max = Math.max(0, +e.target.value);
                                const min = Math.min(max, q.min);
                                const val = Math.min(Math.max(q.value, min), max);
                                updateQuestion(q.id, { min, max, value: val });
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* --- Level (emoji) --- */}
                    {q.type === 'level' && (
                      <div className="event-level-group">
                        <div
                          className="level-description"
                          style={{ color: getColorByLevel(q.level) }}
                        >
                          {emojiDescriptions[q.level - 1]}
                        </div>

                        <div className="event-emoji-row">
                          {emojiLevels.map((emj, i) => (
                            <span
                              key={i}
                              className={`emoji ${q.level === i + 1 ? 'active' : ''}`}
                              onClick={() => updateQuestion(q.id, { level: i + 1 })}
                            >
                              {emj}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* chuyển trang câu hỏi */}
            <div className="survey-dots">
              {pages.map((_, i) => (
                <span
                  key={i}
                  className={`survey-dot ${i === page ? 'active' : ''}`}
                  onClick={() => setPage(i)}
                />
              ))}
            </div>

            <div className="survey-actions">
              <button className="submit-btn" onClick={() => setShowQR(true)}>
                Điểm danh
              </button>

              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={hasSurvey}
                style={{ marginLeft: 8 }}
              >
                Tạo khảo sát
              </button>
            </div>
          </div>
        </div>
      </div>
      {showQR && evt?.currentQrCode && (
        <div className="modal-backdrop" onClick={() => setShowQR(false)}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <button className="btn-icon" onClick={() => setShowQR(false)}>✕</button>

            <h2 className="qr-title">Mã điểm danh</h2>

            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(evt.currentQrCode)}&size=200x200`}
              alt="QR Code"
              className="qr-image"
            />

            <p className="qr-note" style={{ color: 'red', marginTop: 12 }}>
              Quét mã QR code trên để điểm danh
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
 *                COMPONENT CHÍNH – ListEvents
 * ========================================================= */
export default function ListEvents() {
  /* ------ state cho danh sách event ------ */
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasSurvey, setHasSurvey] = useState(false);

  /* ------ state điều khiển modal ------ */
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(null);      // event đang xem

  /* ------ state cho survey ------ */
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(0);

  /* ====== THÊM / XOÁ / CẬP NHẬT CÂU HỎI ====== */
  const addQuestion = (type) => {
    setQuestions((prev) => [
      ...prev,
      {
        id: uuidv4(),
        type,
        text: '',
        options: ['', '', '', ''],
        range: 5,
        level: 3,
        min: 1,
        max: 10,
        value: 5,
      },
    ]);
  };

  const removeQuestion = (id) =>
    setQuestions((prev) => prev.filter((q) => q.id !== id));

  const updateQuestion = (id, payload) =>
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...payload } : q))
    );

  /* ====== CHIA CÂU HỎI THÀNH TRANG ====== */
  const pages = useMemo(() => {
    const list = [];
    let buf = [];

    questions.forEach((q) => {
      const full = q.type === 'option'; // option chiếm full trang
      if (full) {
        if (buf.length) { list.push(buf); buf = []; }
        list.push([q]);
      } else {
        buf.push(q);
        if (buf.length === 2) { list.push(buf); buf = []; }
      }
    });
    if (buf.length) list.push(buf);
    return list;
  }, [questions]);

  const buildAnswer = (q) => {
    switch (q.type) {
      /* ----- OPTION: 4 lựa chọn A‑D ----- */
      case 'option': {
        const [A = '', B = '', C = '', D = ''] = q.options;
        return {
          A: { content: A, userChooseIds: [] },
          B: { content: B, userChooseIds: [] },
          C: { content: C, userChooseIds: [] },
          D: { content: D, userChooseIds: [] },
        };
      }

      /* ----- NUMBER: chỉ lưu chuỗi rỗng, sau này ghi đè kết quả ----- */
      case 'number':
        return '';

      /* ----- LEVEL: 5 mức 1‑5 ----- */
      case 'level':
        return [1, 2, 3, 4, 5].reduce((acc, v) => {
          acc[v] = { value: v, userChooseIds: [] };
          return acc;
        }, {});

      default:
        return null;            // dự phòng
    }
  };

  /* ====== SUBMIT SURVEY LÊN FIREBASE ====== */
  const handleSubmit = async () => {
    if (!questions.length) return alert('Vui lòng thêm ít nhất 1 câu hỏi');
    for (const q of questions) {
      if (!q.text.trim()) return alert('Có câu hỏi trống!');
      if (q.type === 'option' && q.options.some((o) => !o.trim()))
        return alert('Một lựa chọn bị bỏ trống!');
    }

    /* khoá giao diện (nếu muốn) */
    setQuestions((prev) => prev.map((q) => ({ ...q, locked: true })));

    try {
      const uid = getAuth().currentUser?.uid;
      if (!uid || !current?.eventId) throw new Error('Missing uid / event');

      const db = getDatabase();
      const refPath = `Events/${uid}/${current.eventId}/survey`;

      console.log(uid);
      console.log(current.eventId);

      const surveyData = {
        createAt: dayjs().format(FORMAT),
        beginAt: dayjs().format(FORMAT),
        finishAt: current.finishAt,
        questions: questions.map((q) => ({
          content: q.text,
          type: q.type,

          // thuộc tính riêng
          ...(q.type === 'number' && { min: q.min, max: q.max }),
          ...(q.type === 'level' && { average: 0.0 }),

          /* 🔑 answer chuẩn */
          answers: buildAnswer(q),
        })),
      };

      await set(ref(db, refPath), surveyData);
      alert('Tạo khảo sát thành công!');
      setOpen(false);
      setQuestions([]);
    } catch (err) {
      console.error(err);
      alert('Lưu khảo sát thất bại');
    }
  };

  /* ====== LẤY LIST EVENT TỪ FIREBASE ====== */
  useEffect(() => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;

    const db = getDatabase();
    const root = ref(db, `Events/${uid}`);

    const unsub = onValue(root, (snap) => {
      const raw = snap.val() ?? {};
      const updates = {};

      const list = Object.entries(raw).map(([id, ev]) => {
        const begin = dayjs(ev.beginAt, FORMAT);
        const finish = dayjs(ev.finishAt, FORMAT);
        const now = dayjs();

        const st = now.isBefore(begin) ? 0 : now.isBefore(finish) ? 1 : 2;
        if (st !== ev.status) updates[`${uid}/${id}/status`] = st;

        return { ...ev, eventId: id, status: st };
      });

      if (Object.keys(updates).length) update(ref(db, 'Events'), updates);
      setEvents(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ====== TÁCH EVENTS THEO TRẠNG THÁI ====== */
  const { upcoming, ongoing, finished } = useMemo(() => {
    const tmp = { upcoming: [], ongoing: [], finished: [] };
    events.forEach((ev) => {
      if (ev.status === 0) tmp.upcoming.push(ev);
      else if (ev.status === 1) tmp.ongoing.push(ev);
      else tmp.finished.push(ev);
    });
    tmp.upcoming.sort((a, b) => dayjs(a.beginAt, FORMAT) - dayjs(b.beginAt, FORMAT));
    tmp.ongoing.sort((a, b) => dayjs(a.finishAt, FORMAT) - dayjs(b.finishAt, FORMAT));
    tmp.finished.sort((a, b) => dayjs(b.finishAt, FORMAT) - dayjs(a.finishAt, FORMAT));
    return tmp;
  }, [events]);

  /* ====== COMPONENT SECTION (danh sách ngang) ====== */
  const Section = ({ title, data, emptyText }) => (
    <section style={{ marginBottom: 32 }}>
      <h2 className="section-title">{title}</h2>
      {data.length === 0 ? (
        <p className="empty-text">{emptyText}</p>
      ) : (
        <div className="scroll-row">
          {data.map((ev) => (
            <div
              key={ev.eventId}
              className="event-item-wrapper"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setCurrent(ev);
                setOpen(true);
                setPage(0);

                const db = getDatabase();
                const uid = getAuth().currentUser?.uid;
                if (!uid || !ev.eventId) return;

                const surveyRef = ref(db, `Events/${uid}/${ev.eventId}/survey`);
                onValue(surveyRef, (snap) => {
                  const exists = snap.exists();
                  setHasSurvey(exists);

                  if (exists) {
                    const surveyData = snap.val();
                    const loadedQuestions = (surveyData.questions || []).map((q) => {
                      return {
                        id: uuidv4(),
                        type: q.type,
                        text: q.content,
                        options: q.type === 'option'
                          ? [
                            q.answers?.A?.content || '',
                            q.answers?.B?.content || '',
                            q.answers?.C?.content || '',
                            q.answers?.D?.content || ''
                          ]
                          : ['', '', '', ''],
                        level: q.type === 'level' ? 3 : undefined,
                        min: q.min ?? 1,
                        max: q.max ?? 10,
                        value: 5,
                        locked: true,
                      };
                    });
                    setQuestions(loadedQuestions);
                  } else {
                    setQuestions([]);
                  }
                }, { onlyOnce: true });
              }}
            >
              <Event event={ev} />
            </div>
          ))}
        </div>
      )}
    </section>
  );

  /* ====== RENDER CHÍNH ====== */
  if (loading) return <p>Đang tải…</p>;

  return (
    <>
      <div style={{ paddingBottom: 32 }}>
        <Section
          title="🔜 Sắp bắt đầu"
          data={upcoming}
          emptyText="Chưa có sự kiện sắp diễn ra."
        />
        <Section
          title="⏳ Đang diễn ra"
          data={ongoing}
          emptyText="Hiện không có sự kiện nào đang diễn ra."
        />
        <Section
          title="✅ Đã kết thúc"
          data={finished}
          emptyText="Chưa có sự kiện đã kết thúc."
        />
      </div>

      {/* ---------- MODAL ---------- */}
      <EventModal
        open={open}
        onClose={() => setOpen(false)}
        evt={current}
        questions={questions}
        setQuestions={setQuestions}
        page={page}
        setPage={setPage}
        pages={pages}
        addQuestion={addQuestion}
        updateQuestion={updateQuestion}
        removeQuestion={removeQuestion}
        handleSubmit={handleSubmit}
        hasSurvey={hasSurvey}
      />
    </>
  );
}
