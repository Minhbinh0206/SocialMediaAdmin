import React, { useEffect, useState, useRef } from 'react';
import './Post.css';
import { FaHeart, FaMapMarker, FaMarker, FaRegComment, FaShare } from 'react-icons/fa';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  ref,
  get,
  push,
  set,
  update,
  onValue,
  query,
  orderByChild,
  equalTo,
} from 'firebase/database';
import { database } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import ListComments from '../../components/ListComments/ListComments';
import truncate from 'html-truncate';

dayjs.extend(relativeTime);

const Post = ({
  groupId,
  userId,
  postId,
  createAt,
  postImage = [],
  content = '',
  likes = 0,
  comments = 0,
  marks = 0,
  shares = 0,
}) => {
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;

  /* UI states */
  const [adminAvatar, setAdminAvatar] = useState('/default-avatar.png');
  const [adminName, setAdminName] = useState('No name');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [markCount, setMarkCount] = useState(marks);
  const [commentCount, setCommentCount] = useState(comments);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [tag, setTag] = useState(null); // { userCommentId, userReplyId, commentId }
  const [userNametag, setUserNameTag] = useState('');
  const [showFullContent, setShowFullContent] = useState(false);
  const [isFading, setIsFading] = useState(false);

  /* ------------------------------------------------------------------ */
  /*  LIKE realtime                                                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const likePath = `Posts/${groupId}/${userId}/${postId}/postLike`;
    const unsubscribe = onValue(ref(database, likePath), snap => {
      if (snap.exists()) {
        const data = snap.val();
        setLikeCount(data.count || 0);
        setLiked(data.userIds?.includes(currentUserId) || false);
      } else {
        setLikeCount(0);
        setLiked(false);
      }
    });
    return () => unsubscribe();
  }, [groupId, userId, postId, currentUserId]);

  const toggleLike = async () => {
    const likePath = `Posts/${groupId}/${userId}/${postId}/postLike`;
    const defaultPath = `PostDefaults/${postId}/postLike`;

    try {
      const snap = await get(ref(database, likePath));
      const cur = snap.val() || { count: 0, userIds: [] };
      const isLike = !liked;

      let ids = [...cur.userIds];
      if (isLike) {
        if (!ids.includes(currentUserId)) ids.push(currentUserId);
      } else {
        ids = ids.filter(id => id !== currentUserId);
      }

      const newLike = { count: ids.length, userIds: ids };

      await update(ref(database), {
        [likePath]: newLike,
        [defaultPath]: newLike,
      });
    } catch (err) {
      console.error('update like error', err);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  ADMIN / STUDENT INFO                                              */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const adminPaths = ['AdminDefaults', 'AdminDepartments', 'AdminBusinesses'];

    (async () => {
      for (const p of adminPaths) {
        const s = await get(ref(database, `Admins/${p}/${userId}`));
        if (s.exists()) {
          const d = s.val();
          setAdminAvatar(d.avatar || '/default-avatar.png');
          setAdminName(d.fullName || 'No name');
          return;
        }
      }
      // fallback: student
      const q = query(ref(database, 'Users'), orderByChild('userId'), equalTo(userId));
      const s2 = await get(q);
      if (s2.exists()) {
        const d = Object.values(s2.val())[0];
        setAdminAvatar(d.avatar || '/default-avatar.png');
        setAdminName(d.studentName || 'No name');
      }
    })();
  }, [userId]);

  /* ------------------------------------------------------------------ */
  /*  COMMENT & MARK counts realtime                                    */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!groupId || !userId || !postId) return;

    const cRef = ref(database, `Posts/${groupId}/${userId}/${postId}/comments`);
    const mRef = ref(database, `Posts/${groupId}/${userId}/${postId}/postMark`);

    const u1 = onValue(cRef, snap => {
      const data = snap.val() || {};
      setCommentCount(Object.keys(data.commentData || {}).length);
    });
    const u2 = onValue(mRef, snap => {
      const data = snap.val() || {};
      setMarkCount(Object.keys(data.userIds || {}).length);
    });

    return () => {
      u1();
      u2();
    };
  }, [groupId, userId, postId]);

  const switchImage = idx => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentImageIndex(idx);
      setIsFading(false);
    }, 200);
  };

  const handlePrev = () => currentImageIndex > 0 && switchImage(currentImageIndex - 1);
  const handleNext = () =>
    currentImageIndex < postImage.length - 1 && switchImage(currentImageIndex + 1);

  const formatDate = ts => {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Vừa xong';
    if (min < 60) return `${min} phút trước`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} giờ trước`;
    return `${Math.floor(hr / 24)} ngày trước`;
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    const ts = Date.now();

    if (tag) {
      // reply
      const replyId = push(
        ref(
          database,
          `Posts/${groupId}/${userId}/${postId}/comments/commentData/${tag.commentId}/replies/replyData`
        )
      ).key;

      const replyData = {
        content: newComment.trim(),
        createdAt: ts,
        replyLike: 0,
        replyId,
        userReplyId: currentUserId,
      };

      const countPath = `Posts/${groupId}/${userId}/${postId}/comments/commentData/${tag.commentId}/replies/count`;
      const cntSnap = await get(ref(database, countPath));
      const cur = cntSnap.exists() ? cntSnap.val() : 0;

      await update(ref(database), {
        [`Posts/${groupId}/${userId}/${postId}/comments/commentData/${tag.commentId}/replies/replyData/${replyId}`]:
          replyData,
        [`PostDefaults/${postId}/comments/commentData/${tag.commentId}/replies/replyData/${replyId}`]: replyData,
        [`${countPath}`]: cur + 1,
        [`PostDefaults/${postId}/comments/commentData/${tag.commentId}/replies/count`]: cur + 1,
      });
      setTag(null);
    } else {
      // comment root
      const commentId = push(
        ref(database, `Posts/${groupId}/${userId}/${postId}/comments/commentData`)
      ).key;

      const commentData = {
        userCommentId: currentUserId,
        commentId,
        content: newComment.trim(),
        commentCreateAt: ts,
        commentLike: 0,
      };

      const countPath = `Posts/${groupId}/${userId}/${postId}/comments/count`;
      const cntSnap = await get(ref(database, countPath));
      const cur = cntSnap.exists() ? cntSnap.val() : 0;

      await update(ref(database), {
        [`Posts/${groupId}/${userId}/${postId}/comments/commentData/${commentId}`]: commentData,
        [`PostDefaults/${postId}/comments/commentData/${commentId}`]: commentData,
        [`${countPath}`]: cur + 1,
        [`PostDefaults/${postId}/comments/count`]: cur + 1,
      });
    }
    setNewComment('');
  };

  /* ------------------------------------------------------------------ */
  /*  Tag logic – tìm tên người tag                                     */
  /* ------------------------------------------------------------------ */
  const findName = async uid => {
    // check admin
    const adminPaths = ['AdminDefaults', 'AdminDepartments', 'AdminBusinesses'];
    for (const p of adminPaths) {
      const s = await get(ref(database, `Admins/${p}/${uid}`));
      if (s.exists()) return s.val().fullName;
    }
    // student
    const stuQ = query(ref(database, 'Users'), orderByChild('userId'), equalTo(uid));
    const stuSnap = await get(stuQ);
    if (stuSnap.exists()) return Object.values(stuSnap.val())[0].studentName;
    return 'Không rõ';
  };

  const handleTagUser = async t => {
    const name = await findName(t.userReplyId || t.userCommentId);
    setUserNameTag(name);
    setTag(t);
  };

  const renderContent = () => {
    if (showFullContent || content.length <= 80)
      return (
        <>
          <div dangerouslySetInnerHTML={{ __html: content }} />
          {content.length > 80 && (
            <span style={{ color: 'blue', cursor: 'pointer' }} onClick={() => setShowFullContent(false)}>
              Ẩn bớt
            </span>
          )}
        </>
      );

    const truncated = truncate(content, 80, {});
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: truncated }} />
        <span style={{ color: 'blue', cursor: 'pointer' }} onClick={() => setShowFullContent(true)}>
          ... Xem thêm
        </span>
      </>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  JSX                                                               */
  /* ------------------------------------------------------------------ */
  return (
    <div>
      <div className="post">
        <div className="post-header">
          <img src={adminAvatar} alt="avatar" className="post-avatar" />
          <div className="post-user-info">
            <div className="post-name">{adminName}</div>
            <div className="post-time">{formatDate(createAt)}</div>
          </div>
          <div className="post-options">⋮</div>
        </div>

        {/* content */}
        {renderContent()}

        {/* images */}
        {postImage.length > 0 && (
          <div className="post-image">
            <div
              className="post-image-slider"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
              {postImage.map((img, idx) => (
                <img key={idx} src={img} alt="post" className="post-image-slide" />
              ))}
            </div>

            {postImage.length > 1 && (
              <>
                <button
                  className={`slide-btn left ${currentImageIndex === 0 ? 'disabled' : ''}`}
                  onClick={handlePrev}
                  disabled={currentImageIndex === 0}>
                  &#10094;
                </button>
                <button
                  className={`slide-btn right ${
                    currentImageIndex === postImage.length - 1 ? 'disabled' : ''
                  }`}
                  onClick={handleNext}
                  disabled={currentImageIndex === postImage.length - 1}>
                  &#10095;
                </button>
              </>
            )}
          </div>
        )}

        {/* actions */}
        <div className="post-actions">
          <div className="action" onClick={toggleLike} style={{ cursor: 'pointer' }}>
            <FaHeart color={liked ? 'red' : 'gray'} />
            <span>{likeCount}</span>
          </div>

          <div className="action" onClick={() => setShowCommentModal(true)} style={{ cursor: 'pointer' }}>
            <FaRegComment /> <span>{commentCount}</span>
          </div>

          <div className="action">
            <FaMapMarker /> <span>{markCount}</span>
          </div>
        </div>
      </div>

      {/* ==== COMMENT MODAL ==== */}
      {showCommentModal && (
        <div className="modal-backdrop-post" onClick={() => setShowCommentModal(false)}>
          <div className="modal-content-post" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowCommentModal(false)}>
              ×
            </button>

            <div className='title-modal'> Bình luận bài viết </div>

            {/* post preview in modal */}
            <div className="post">
              <div className="post-header">
                <img src={adminAvatar} alt="avatar" className="post-avatar" />
                <div className="post-user-info">
                  <div className="post-name">{adminName}</div>
                  <div className="post-time">{formatDate(createAt)}</div>
                </div>
                <div className="post-options">⋮</div>
              </div>

              <p dangerouslySetInnerHTML={{ __html: content }} />

              {postImage.length > 0 && (
                <div className="post-image">
                  <div
                    className="post-image-slider"
                    style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
                    {postImage.map((img, idx) => (
                      <img key={idx} src={img} alt="post" className="post-image-slide" />
                    ))}
                  </div>

                  {postImage.length > 1 && (
                    <>
                      <button
                        className={`slide-btn left ${currentImageIndex === 0 ? 'disabled' : ''}`}
                        onClick={handlePrev}
                        disabled={currentImageIndex === 0}>
                        &#10094;
                      </button>
                      <button
                        className={`slide-btn right ${
                          currentImageIndex === postImage.length - 1 ? 'disabled' : ''
                        }`}
                        onClick={handleNext}
                        disabled={currentImageIndex === postImage.length - 1}>
                        &#10095;
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="post-actions">
                <div className="action" onClick={toggleLike} style={{ cursor: 'pointer' }}>
                  <FaHeart color={liked ? 'red' : 'gray'} />
                  <span>{likeCount}</span>
                </div>

                <div className="action">
                  <FaRegComment /> <span>{commentCount}</span>
                </div>

                <div className="action">
                  <FaMarker /> <span>{markCount}</span>
                </div>
              </div>
            </div>

            {/* comment list */}
            <div className="modal-comments" style={{ margin: '15px 0' }}>
              <span className="title-comment"> Bình luận </span>
              <ListComments
                postId={postId}
                groupId={groupId}
                userId={userId}
                onTagUser={handleTagUser}
              />
            </div>
          </div>

          {/* input sticky bottom */}
          <div className="modal-input" onClick={e => e.stopPropagation()}>
            {tag && (
              <div className="tag-preview">
                <span>
                  Đang phản hồi <strong>@{userNametag}</strong>
                </span>
                <button className="cancel-tag" onClick={() => setTag(null)}>
                  ×
                </button>
              </div>
            )}

            <div className="input-send-container">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Nhập bình luận..."
                className="comment-textarea"
                rows={1}
              />
              <button
                className="send-button"
                onClick={() => {
                  handleComment();
                }}>
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;
