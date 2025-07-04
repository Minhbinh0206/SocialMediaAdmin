// EventCard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

const FORMAT = 'HH:mm:ss DD/MM/YYYY';
const STATUS = [
  { text:'Sắp bắt đầu', color:'#F5A623' },
  { text:'Đang diễn ra', color:'#27AE60' },
  { text:'Đã kết thúc',  color:'#BDBDBD' }
];

export default function Event({ event }) {
  const begin  = useMemo(() => dayjs(event.beginAt,  FORMAT), [event.beginAt]);
  const finish = useMemo(() => dayjs(event.finishAt, FORMAT), [event.finishAt]);
  const [tick, setTick] = useState(Date.now());           // trigger re‑render / 1 giây

  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /**⏲ Tính countdown tuỳ status */
  const countdown = useMemo(() => {
    let target = null;
    if (event.status === 0) target = begin;
    else if (event.status === 1) target = finish;
    if (!target) return '';

    let diff = target.diff(dayjs(), 'second');
    if (diff < 0) diff = 0;
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${h}h ${m}m ${s}s`;
  }, [tick, event.status, begin, finish]);

  const { text, color } = STATUS[event.status];

  return (
    <div style={styles.card}>
      <div style={styles.row}>
        {event.status !== 2 && (
          <span style={{ ...styles.count, color }}>{countdown}</span>
        )}
        <span style={{ ...styles.status, color }}>{text}</span>
      </div>

      {event.imageEvents && (
        <img src={event.imageEvents} alt={event.titleEvent} style={styles.img}/>
      )}

      <h3 style={styles.title}>{event.titleEvent}</h3>
      <p style={styles.desc}>{truncate(event.contentEvent, 90)}</p>
    </div>
  );
}

/*------------- helpers & styles ----------------*/
const truncate = (t, n) => (t?.length > n ? t.slice(0, n) + '…' : t);

const styles = {
  card: { width:250, borderRadius:8, boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)', padding:12, background:'#fff', margin: 10},
  row:  { display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 },
  count:{ fontWeight:600 },
  status:{ fontWeight:600 },
  img:  { width:'100%', height:120, objectFit:'cover', borderRadius:6, marginBottom:8 },
  title:{ margin:'4px 0 2px', fontSize:16, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  desc: { fontSize:13, color:'#555', margin:0, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }
};
