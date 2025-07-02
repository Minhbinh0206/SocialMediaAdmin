import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FiTrash2 } from 'react-icons/fi';      // icon xoá
import './CreateSurvey.css';
import { getDatabase, ref, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const SURVEY_TYPES = {
    option: 'Khảo sát lựa chọn',
    number: 'Khảo sát số lượng',
    level: 'Khảo sát mức độ',
};

const emojiLevels = ['😞', '🙂', '😊', '😁', '😍'];
const emojiDescriptions = ['Rất tệ', 'Không thích', 'Bình thường', 'Thích', 'Rất thích'];

export default function CreateSurvey({ onClose }) {
    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState([]);
    const [startedAt, setStartedAt] = useState('');
    const [finishedAt, setFinishedAt] = useState('');

    /* Thêm câu hỏi mới */
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

    const getColorByProgress = (q) => {
        const { min, max, value } = q;
        const range = max - min || 1;
        const progress = (value - min) / range;

        if (progress < 0.25) return '#e74c3c';       // đỏ
        if (progress < 0.5) return '#e67e22';        // cam
        if (progress < 0.75) return '#f1c40f';       // vàng
        return '#33CC00';                            // xanh
    };

    const getColorByLevel = (level) => {
        switch (level) {
            case 1: return '#e74c3c';   // đỏ
            case 2: return '#e67e22';   // cam
            case 3: return '#f1c40f';   // vàng
            case 4: return '#27ae60';   // xanh vừa
            case 5: return '#2ecc71';   // xanh lá
            default: return '#333';
        }
    };

    /* Cập nhật fields */
    const update = (id, fields) =>
        setQuestions((arr) => arr.map((q) => (q.id === id ? { ...q, ...fields } : q)));

    /* Xoá câu hỏi */
    const remove = (id) => setQuestions((arr) => arr.filter((q) => q.id !== id));

    const handleSubmit = () => {
        if (!title.trim()) {
            alert('Nhập tiêu đề khảo sát');
            return;
        }

        if (!questions.length) {
            alert('Thêm ít nhất 1 câu hỏi');
            return;
        }

        if (!startedAt || !finishedAt) {
            alert('Vui lòng chọn thời gian bắt đầu và kết thúc khảo sát.');
            return;
        }

        const start = new Date(startedAt);
        const end = new Date(finishedAt);

        if (end - start < 5 * 60 * 1000) {
            alert('Thời gian kết thúc phải cách thời gian bắt đầu ít nhất 5 phút.');
            return;
        }

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];

            if (!q.text?.trim()) {
                alert(`Câu ${i + 1} không được bỏ trống`);
                return;
            }

            if (q.type === 'option') {
                for (let j = 0; j < q.options.length; j++) {
                    const opt = q.options[j];
                    if (!opt?.trim()) {
                        const choiceLabel = String.fromCharCode(65 + j); // A, B, C, D
                        alert(`Lựa chọn ${choiceLabel} của câu ${i + 1} không được bỏ trống`);
                        return;
                    }
                }
            }
        }

        const db = getDatabase();
        const auth = getAuth();
        const userId = auth.currentUser?.uid || 'anonymous';
        const surveyId = uuidv4();

        const surveyData = {
            title,
            startedAt: new Date(startedAt).getTime(),
            finishedAt: new Date(finishedAt).getTime(),
            createdAt: Date.now(),
            userId,
            surveyId,
            questions: {},
        };

        questions.forEach((q, idx) => {
            const questionId = uuidv4();
            const questionEntry = {
                index: idx,
                content: q.text,
                type: q.type,
            };

            // Gán answers tùy theo type
            if (q.type === 'option') {
                questionEntry.answers = {
                    A: { content: q.options[0], userChooseIds: [] },
                    B: { content: q.options[1], userChooseIds: [] },
                    C: { content: q.options[2], userChooseIds: [] },
                    D: { content: q.options[3], userChooseIds: [] },
                };
            } 
            else if (q.type === 'number') {
                questionEntry.min = q.min;  
                questionEntry.max = q.max;      
                questionEntry.answers = '';     
            }
            else if (q.type === 'level') {
                questionEntry.average = 0;     
                questionEntry.answers = {
                    1: { value: 1, userChooseIds: [] },
                    2: { value: 2, userChooseIds: [] },
                    3: { value: 3, userChooseIds: [] },
                    4: { value: 4, userChooseIds: [] },
                    5: { value: 5, userChooseIds: [] },
                };
            }

            surveyData.questions[questionId] = questionEntry;
        });

        set(ref(db, `Surveys/${surveyId}`), surveyData)
            .then(() => {
                alert('Đã tạo khảo sát!');
                onClose();
            })
            .catch((error) => {
                console.error('Lỗi khi tạo khảo sát:', error);
                alert('Đã có lỗi khi tạo khảo sát.');
            });
        onClose();
    };

    const getMinFinishTime = (start) => {
        const dt = new Date(start);
        dt.setMinutes(dt.getMinutes() + 5);
        return dt.toISOString().slice(0, 16); // cắt tới phút
    };

    return (
        <div className="survey-modal">
            <div className="survey-box">
                <h2 className="survey-heading">Tạo Khảo Sát</h2>

                <div className="time-inputs">
                    <label>
                        Ngày bắt đầu:
                        <input
                            style={{ marginTop: 5 }}
                            type="datetime-local"
                            value={startedAt}
                            onChange={(e) => setStartedAt(e.target.value)}
                        />
                    </label>

                    <label>
                        Ngày kết thúc:
                        <input
                            style={{ marginTop: 5 }}
                            type="datetime-local"
                            value={finishedAt}
                            min={startedAt ? getMinFinishTime(startedAt) : ''}
                            onChange={(e) => setFinishedAt(e.target.value)}
                        />
                    </label>
                </div>

                <input
                    className="survey-title-input"
                    placeholder="Tiêu đề khảo sát..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <div className="survey-type-buttons">
                    {Object.entries(SURVEY_TYPES).map(([id, label]) => (
                        <button key={id} className="type-btn" onClick={() => addQuestion(id)}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Danh sách câu hỏi */}
                <div className="question-list">
                    {questions.map((q, idx) => (
                        <div key={q.id} className={`question-card ${q.type}`}>
                            <div style={{}}>
                                <button className="trash-btn" onClick={() => remove(q.id)}>
                                    <FiTrash2 size={16} />
                                </button>
                                <label className="q-label">Câu {idx + 1}:</label>

                            </div>
                            <textarea
                                className="q-text"
                                placeholder="Nhập nội dung câu hỏi..."
                                value={q.text}
                                onChange={(e) => update(q.id, { text: e.target.value })}
                            />

                            {/* Khảo sát lựa chọn */}
                            {q.type === 'option' && (
                                <ul className="option-group">
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
                                                    update(q.id, { options: opts });
                                                }}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Khảo sát số lượng */}
                            {q.type === 'number' && (
                                <div className="number-block">
                                    {/* Nhập min – max */}
                                    <div className="minmax-inputs">
                                        <label>
                                            Min:
                                            <input
                                                type="number"
                                                className="nm-input"
                                                value={q.min}
                                                onChange={(e) => {
                                                    let min = Math.max(0, +e.target.value);
                                                    const max = Math.max(min, q.max);
                                                    const value = Math.min(Math.max(q.value, min), max);
                                                    update(q.id, { min, max, value });
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
                                                    const max = +e.target.value;
                                                    const min = Math.min(max, q.min);
                                                    const value = Math.min(Math.max(q.value, min), max);
                                                    update(q.id, { min, max, value });
                                                }}
                                            />
                                        </label>
                                    </div>

                                    {/* Slider */}
                                    <input
                                        type="range"
                                        min={q.min}
                                        max={q.max}
                                        value={q.value}
                                        onChange={(e) => update(q.id, { value: +e.target.value })}
                                    />

                                    <div className="range-labels">
                                        <span>{q.min}</span>
                                        <span
                                            className="range-value"
                                            style={{ backgroundColor: getColorByProgress(q) }}
                                        >
                                            {q.value}
                                        </span>

                                        <span>{q.max}</span>
                                    </div>
                                </div>
                            )}

                            {/* Khảo sát mức độ */}
                            {q.type === 'level' && (
                                <div className="level-group">
                                    <div
                                        className="level-description"
                                        style={{ color: getColorByLevel(q.level) }}
                                    >
                                        {emojiDescriptions[q.level - 1]}
                                    </div>


                                    <div className="emoji-row">
                                        {emojiLevels.map((emj, i) => (
                                            <span
                                                key={i}
                                                className={`emoji ${q.level === i + 1 ? 'active' : ''}`}
                                                onClick={() => update(q.id, { level: i + 1 })}
                                            >
                                                {emj}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    ))}
                </div>

                <div className="survey-actions">
                    <button className="cancel-btn" onClick={onClose}>Hủy</button>
                    <button className="submit-btn" onClick={handleSubmit}>Tạo</button>
                </div>
            </div>
        </div>
    );
}
