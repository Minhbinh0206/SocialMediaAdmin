// src/components/Survey/SurveyReadonly.jsx
import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import './Survey.css';

const emojiLevels = ['😞', '🙂', '😊', '😁', '😍'];
const levelColors = ['#e74c3c', '#e67e22', '#f1c40f', '#27ae60', '#2ecc71'];
const statusTxt = ['🟡 Sắp bắt đầu', '🟢 Đang diễn ra', '🔴 Đã kết thúc'];
const PAGE_SIZE = 2; // Có thể thay đổi tùy ý: 2 hoặc 3 câu hỏi/trang

/* tiện ích đếm user chọn */
const totalCnt = (ans = {}) =>
  Object.values(ans).reduce((s, a) => s + Object.keys(a.userChooseIds ?? {}).length, 0);

export default function Survey({ survey, onClose }) {
  const [page, setPage] = useState(0);

  // Nếu không có survey, trả về sớm

  const { title, startedAt, finishedAt, questions = {} } = survey;

  const now = dayjs();
  const status = now.isBefore(dayjs(startedAt))
    ? 0 : now.isBefore(dayjs(finishedAt)) ? 1 : 2;

  const qList = useMemo(() => (
    Object.entries(questions).sort((a, b) => a[1].index - b[1].index)
  ), [questions]);

  const totalPage = Math.ceil(qList.length / PAGE_SIZE);
  if (!survey) return <p>(Không có dữ liệu khảo sát)</p>;

  return (
    <div className="survey-view">
      <h2 className="sv-title">{title}</h2>
      <p className="sv-status">{statusTxt[status]}</p>

      <button className="close-btn" onClick={onClose}>✕</button>

      {/* hiển thị câu hỏi phân trang */}
      {qList
        .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
        .map(([qid, q], localIdx) => {
          const idx = page * PAGE_SIZE + localIdx;

          /* -------- OPTION -------- */
          if (q.type === 'option') {
            const total = totalCnt(q.answers);
            return (
              <div key={qid} className="sv-question card option">
                <p className="q-text"><b>{idx + 1}.</b> {q.content}</p>
                {['A', 'B', 'C', 'D'].map(letter => {
                  const cnt = Object.keys(q.answers?.[letter]?.userChooseIds ?? {}).length;
                  const pct = total ? Math.round(cnt / total * 100) : 0;
                  return (
                    <div key={letter} className="opt-row">
                      <div className="opt-bar" />
                      <div className="opt-fill" style={{ width: `${pct}%` }} />
                      <span className="opt-label">
                        <b>{letter}.</b> {q.answers?.[letter]?.content || '(chưa đặt)'}
                      </span>
                      <span className="opt-pct">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            );
          }

          /* -------- NUMBER -------- */
          if (q.type === 'number') {
            // Tính trung bình từ keys trong q.answers
            let sum = 0, count = 0;
            Object.entries(q.answers ?? {}).forEach(([val, obj]) => {
              const n = (obj.userChooseIds ?? []).length;
              sum += +val * n;
              count += n;
            });
            const avgVal = count ? sum / count : 0;
            const avg = avgVal.toFixed(1);
            const percent = ((avgVal - q.min) / (q.max - q.min || 1)) * 100;

            return (
              <div key={qid} className="sv-question card number">
                <p className="q-text"><b>{idx + 1}.</b> {q.content}</p>
                <div className="num-slider-wrapper">
                  <div className="num-slider-fill" style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
                </div>
                <p className="num-range">
                  Khoảng: <b>{q.min}</b>–<b>{q.max}</b>  |
                  Trung bình: <b>{avg}</b>
                </p>
              </div>
            );
          }

          /* -------- LEVEL -------- */
          if (q.type === 'level') {
            const avg = (q.average ?? 0).toFixed(1);
            const total = totalCnt(q.answers);
            return (
              <div key={qid} className="sv-question card level">
                <p className="q-text"><b>{idx + 1}.</b> {q.content}</p>
                <div className="level-row">
                  {emojiLevels.map((emj, i) => {
                    const cnt = Object.keys(q.answers?.[i + 1]?.userChooseIds ?? {}).length;
                    const pct = total ? Math.round(cnt / total * 100) : 0;
                    return (
                      <div key={i} className="level-block">
                        <span className="level-emoji">{emj}</span>
                        <span className="level-pct">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
                <p className={`level-desc ${avg < 2 ? 'low' : avg < 3 ? 'medium' : avg < 4 ? 'good' : 'excel'
                  }`}>
                  Trung bình: <b>{avg}</b>
                </p>
              </div>
            );
          }

          return null;
        })}

      {/* --- dot navigation --- */}
      {totalPage > 1 && (
        <div className="dot-nav">
          {Array.from({ length: totalPage }).map((_, i) => (
            <span
              key={i}
              className={i === page ? 'active' : ''}
              onClick={() => setPage(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
