import React, { useEffect, useState, useRef } from 'react';
import './CreatePost.css';
import { FiImage, FiBarChart2 } from 'react-icons/fi';
import { auth, storage, database } from '../../firebaseConfig';
import { ref as dbRef, get, child, set, onValue } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const CreatePost = ({ onClose }) => {
  const [user, setUser] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [content, setContent] = useState('');
  const [filter, setFilter] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedTarget, setSelectedTarget] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');

  const fileInputRef = useRef();

  useEffect(() => {
    if (user?.role === 'AdminDepartments' && user.departmentId) {
      setSelectedDepartmentId(user.departmentId);
    }
  }, [user]);


  // Lấy user từ Firebase Auth và kiểm tra quyền admin
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const uid = currentUser.uid;
        try {
          const rootRef = dbRef(database);
          const adminTypes = ['AdminBusinesses', 'AdminDefaults', 'AdminDepartments'];
          for (const type of adminTypes) {
            const snapshot = await get(child(rootRef, `Admins/${type}/${uid}`));
            if (snapshot.exists()) {
              const foundData = snapshot.val();
              setUser({ ...foundData, uid, role: type });
              break;
            }
          }
        } catch (err) {
          console.error('Lỗi khi lấy admin:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Lấy danh sách Khoa
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const snap = await get(child(dbRef(database), 'Departments'));
        if (snap.exists()) {
          const data = snap.val();
          const list = Object.entries(data).map(([id, value]) => ({
            id,
            ...value,
          }));
          setDepartments(list);
        }
      } catch (err) {
        console.error("Lỗi khi lấy departments:", err);
      }
    };

    fetchDepartments();
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setSelectedImages((prev) => [...prev, ...urls]);
    setImageFiles((prev) => [...prev, ...files]);
  };

  const getTargetOptions = () => {
    switch (user?.role) {
      case 'AdminDefaults':
        return [
          { value: 'all', label: 'Học sinh toàn trường' },
          { value: 'multiDepartments', label: 'Học sinh thuộc các khoa' },
          { value: 'myDepartment', label: 'Học sinh trong khoa' },
        ];
      case 'AdminDepartments':
        return [
          { value: 'all', label: 'Học sinh toàn trường' },
          { value: 'myDepartment', label: 'Học sinh trong khoa' },
        ];
      case 'AdminBusinesses':
        return [
          { value: 'all', label: 'Học sinh toàn trường' },
          { value: 'multiDepartments', label: 'Học sinh thuộc khoa liên kết' },
        ];
      default:
        return [];
    }
  };

  const handlePrevImage = () => setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : prev));
  const handleNextImage = () => setCurrentImageIndex(prev => (prev < selectedImages.length - 1 ? prev + 1 : prev));

  const handleRemoveCurrentImage = () => {
    setSelectedImages(prev => {
      const copy = [...prev];
      copy.splice(currentImageIndex, 1);
      return copy;
    });
    setImageFiles(prev => {
      const copy = [...prev];
      copy.splice(currentImageIndex, 1);
      return copy;
    });
    setCurrentImageIndex(prev => (prev === 0 ? 0 : prev - 1));
  };

  const toggleDepartment = (id) => {
    setSelectedDepartments(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!user || !content.trim())
      return alert('Vui lòng nhập nội dung bài viết');

    if (selectedTarget === 'multiDepartments' && selectedDepartmentIds.length === 0) {
      return alert("Vui lòng chọn ít nhất 1 khoa.");
    }

    try {
      const rootRef = dbRef(database);
      const groupsSnap = await get(child(rootRef, 'Groups'));
      let groupId = null;
      groupsSnap.forEach((childSnap) => {
        const group = childSnap.val();
        if (group.adminId === user.uid) {
          groupId = group.groupId || childSnap.key;
        }
      });

      if (!groupId) return alert('Không tìm thấy group');

      const postId = uuidv4();
      const uploadedUrls = await Promise.all(
        imageFiles.map(async (file, index) => {
          const path = `PostImages/${postId}_${index}`;
          const imageRef = storageRef(storage, path);
          await uploadBytes(imageRef, file);
          return await getDownloadURL(imageRef);
        })
      );

      const postData = {
        content,
        createAt: Date.now(),
        filterData:
          selectedTarget === "all"
            ? []
            : selectedTarget === "multiDepartments"
              ? selectedDepartmentIds
              : selectedDepartmentId
                ? [selectedDepartmentId]
                : [],
        groupId,
        postId,
        postImage: uploadedUrls,
        postLike: 0,
        status: 1,
        userId: user.uid,
      };

      await set(dbRef(database, `Posts/${groupId}/${user.uid}/${postId}`), postData);
      await set(dbRef(database, `PostDefaults/${postId}`), postData);

      alert('Đăng bài thành công!');
      onClose();
    } catch (err) {
      console.error('Lỗi khi đăng bài:', err);
      alert('Đăng bài thất bại');
    }
  };

  const toggleStyle = (style) => {
    const commandMap = {
      bold: 'bold',
      italic: 'italic',
      underline: 'underline',
    };

    document.execCommand(commandMap[style], false, null);

    if (style === 'bold') setIsBold(prev => !prev);
    if (style === 'italic') setIsItalic(prev => !prev);
    if (style === 'underline') setIsUnderline(prev => !prev);
  };

  useEffect(() => {
    const checkFormatting = () => {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
      setIsUnderline(document.queryCommandState('underline'));
    };

    document.addEventListener('selectionchange', checkFormatting);
    return () => document.removeEventListener('selectionchange', checkFormatting);
  }, []);

  return (
    <div className="modal-backdrop">
      <div className="modal-transition-wrapper">
        <div className={`modal-slide slide-step-${step}`}>

          {/* Step 1 */}
          <div className="modal-box">
            <div className="title">Tạo bài viết</div>
            <div className="personal-container">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="avatar" />
              ) : (
                <div className="avatar placeholder">🙂</div>
              )}
              <span className="name">{user?.fullName || user?.email}</span>
            </div>

            <div className='content-container'>
              <div
                id="contentTextArea"
                className="text-area editable-area"
                placeholder="Nhập nội dung bài viết tại đây..."
                contentEditable
                data-placeholder="Nội dung bài viết..."
                ref={fileInputRef}
                onInput={(e) => setContent(e.currentTarget.innerHTML)}
                suppressContentEditableWarning={true}
              ></div>

              <div className="format-buttons">
                <button type="button" onClick={() => toggleStyle('bold')} className={isBold ? 'active' : ''}><b>B</b></button>
                <button type="button" onClick={() => toggleStyle('italic')} className={isItalic ? 'active' : ''}><i>I</i></button>
                <button type="button" onClick={() => toggleStyle('underline')} className={isUnderline ? 'active' : ''}><u>U</u></button>
              </div>
            </div>

            {selectedImages.length > 0 && (
              <div className="image-preview-wrapper">
                <button className="arrow left" onClick={handlePrevImage} disabled={currentImageIndex === 0}>
                  &#10094;
                </button>
                <div className="slider-track" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
                  {selectedImages.map((url, idx) => (
                    <img key={idx} src={url} className="image-post" />
                  ))}
                </div>
                <button
                  className="arrow right"
                  onClick={handleNextImage}
                  disabled={currentImageIndex === selectedImages.length - 1}
                >
                  &#10095;
                </button>
                <button className="remove-image-btn" onClick={handleRemoveCurrentImage}>
                  &times;
                </button>
              </div>
            )}

            <div className="more-options">
              <button className="option-btn" onClick={() => fileInputRef.current.click()}>
                <FiImage className="option-icon" />
                <span>Ảnh</span>
              </button>
              <input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              <button className="option-btn">
                <FiBarChart2 className="option-icon" />
                <span>Khảo sát</span>
              </button>
            </div>

            <div className="actions">
              <button onClick={onClose} className="cancel-btn">Hủy</button>
              <button className="submit-btn" onClick={() => setStep(2)}>Tiếp</button>
            </div>
          </div>

          {/* Step 2 */}
          {step === 2 && (
            <div className="modal-box box-2">
              <div className="title">Bạn muốn đăng bài viết này đến?</div>

              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="targetSelect" style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                  Chọn đối tượng hiển thị:
                </label>
                <select
                  id="targetSelect"
                  value={selectedTarget}
                  onChange={(e) => {
                    setSelectedTarget(e.target.value);
                    setSelectedDepartmentId('');
                    setSelectedDepartmentIds([]);
                  }}
                  className="target-select"
                >
                  {getTargetOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTarget === 'multiDepartments' && (
                <div className="department-checkboxes">
                  {departments.map((dept) => (
                    <label key={dept.id} className="checkbox-item">
                      <input
                        type="checkbox"
                        value={dept.id}
                        checked={selectedDepartmentIds.includes(dept.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const id = e.target.value;
                          setSelectedDepartmentIds((prev) =>
                            checked ? [...prev, id] : prev.filter((d) => d !== id)
                          );
                        }}
                      />
                      {dept.departmentName}
                    </label>
                  ))}
                </div>
              )}

              {selectedTarget === 'myDepartment' && user?.role !== 'AdminDepartments' && (
                <div className="department-radio-group">
                  {departments.map((dept) => (
                    <label key={dept.id} className="radio-item">
                      <input
                        type="radio"
                        name="department"
                        value={dept.id}
                        checked={selectedDepartmentId === dept.id}
                        onChange={(e) => setSelectedDepartmentId(e.target.value)}
                      />
                      {dept.departmentName}
                    </label>
                  ))}
                </div>
              )}

              <div className="actions">
                <button className="cancel-btn" onClick={() => setStep(1)}>Quay lại</button>
                <button className="submit-btn" onClick={handleSubmit}>Đăng bài</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CreatePost;
