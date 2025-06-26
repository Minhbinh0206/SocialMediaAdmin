import React from "react";

export default function Notify({ notify, onClick }) {
  const { title, content, createAt, fullName, avatar } = notify;

  const formattedTime = new Date(createAt).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });

  return (
    <div style={styles.card} onClick={() => onClick?.(notify)}>
      <img
        src={avatar || "/placeholder_avatar.png"}
        alt={fullName || "avatar"}
        style={styles.avatar}
      />

      <div style={styles.info}>
        <div style={styles.header}>
          <span style={styles.name}>{fullName || "Người gửi"}</span>
          <span style={styles.time}>{formattedTime}</span>
        </div>
        <div style={styles.title}>{title}</div>
        <div style={styles.content}>{content}</div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    display: "flex",
    padding: 12,
    borderRadius: 12,
    background: "#fdfdfd",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    marginBottom: 12,
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "1px solid #eee",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    objectFit: "cover",
    marginRight: 12,
  },
  info: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontWeight: "600",
    fontSize: 14,
    color: "#333",
  },
  time: {
    fontSize: 12,
    color: "#999",
    whiteSpace: "nowrap",
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1877F2",
    marginBottom: 4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  content: {
    fontSize: 13,
    color: "#444",
    lineHeight: 1.4,
    maxHeight: 40,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};
