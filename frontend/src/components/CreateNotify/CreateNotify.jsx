import React, { useState, useEffect } from 'react';
import { auth } from '../../firebaseConfig';
import { ref, get, child, set } from 'firebase/database';
import { database } from '../../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import './CreateNotify.css';

const CreateNotify = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [user, setUser] = useState('');
  const [filterType, setFilterType] = useState('');
  const [bussinesses, setBussinesses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsInDepartment, setStudentsInDepartment] = useState([]);
  const [searchStudentId, setSearchStudentId] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [majors, setMajors] = useState([]);
  const [searchClassId, setSearchClassId] = useState('');
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [selectedClassStudents, setSelectedClassStudents] = useState([]);
  const [departmentClasses, setDepartmentClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);

  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();

  const dateCreateNotify = `Ngày ${day} tháng ${month} năm ${year}`;

  const fetchMajors = async (departmentId) => {
    const majorsRef = ref(database, `Departments/${departmentId}/majors`);
    try {
      const majorsSnap = await get(majorsRef);
      if (majorsSnap.exists()) {
        const majorsData = majorsSnap.val();
        const majorEntries = Object.entries(majorsData);
        setMajors(prev => [...prev, ...majorEntries]);

        const classList = [];
        for (const majorId in majorsData) {
          const classes = majorsData[majorId]?.classes || {};
          for (const classId in classes) {
            classList.push([classId, { className: classes[classId].className }]);
          }
        }
        setDepartmentClasses(prev => [...prev, ...classList]);
      } else {
        console.warn(`Không tìm thấy majors của khoa ${departmentId}`);
      }
    } catch (err) {
      console.error(`Lỗi khi lấy majors từ khoa ${departmentId}:`, err);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const uid = currentUser.uid;

        try {
          const dbRef = ref(database);
          const adminTypes = ['AdminBussinesses', 'AdminDefaults', 'AdminDepartments'];
          let foundData = null;

          for (const type of adminTypes) {
            const snapshot = await get(child(dbRef, `Admins/${type}/${uid}`));
            if (snapshot.exists()) {
              foundData = snapshot.val();
              foundData.role = type;
              break;
            }
          }

          console.log('Found Admin Data:', foundData.role);

          if (foundData) {
            if (foundData.role === 'AdminDepartments' && foundData.departmentId) {
              try {
                const collabSnap = await get(child(dbRef, `Departments/${foundData.departmentId}/collabs`));
                if (collabSnap.exists()) {
                  foundData.linkedBussinessIds = collabSnap.val(); // Mảng ID
                } else {
                  foundData.linkedBussinessIds = [];
                }
              } catch (err) {
                console.error('Lỗi khi lấy collabs:', err);
                foundData.linkedBussinessIds = [];
              }

              await fetchMajors(foundData.departmentId);

            } else if (foundData.role === 'AdminBussinesses' && foundData.bussinessId) {
              try {
                const collabSnap = await get(child(dbRef, `Bussinesses/${foundData.bussinessId}/collabs`));
                if (collabSnap.exists()) {
                  foundData.linkedDepartmentIds = collabSnap.val();
                  await Promise.all(
                    foundData.linkedDepartmentIds.map(depId => fetchMajors(depId))
                  );
                } else {
                  foundData.linkedDepartmentIds = [];
                }
              } catch (err) {
                console.error('Lỗi khi lấy collabs:', err);
                foundData.linkedDepartmentIds = [];
              }
            }
            setUser(foundData);
          }
        } catch (error) {
          console.error('Lỗi truy xuất Admins:', error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchClassId.trim() === '' || filterType !== 'byClass') {
      setFilteredClasses([]);
      return;
    }

    const result = departmentClasses.filter(([id, cls]) =>
      id.toLowerCase().includes(searchClassId.toLowerCase()) ||
      cls.className?.toLowerCase().includes(searchClassId.toLowerCase())
    );

    setFilteredClasses(result);
  }, [searchClassId, departmentClasses, filterType]);

  const handleSelectClass = async (classId) => {
    const existing = selectedClasses.find((cls) => cls.classId === classId);
    if (existing) return;

    const dbRef = ref(database);
    try {
      const departmentId = user.departmentId;
      const majorsSnap = await get(child(dbRef, `Departments/${departmentId}/majors`));
      if (!majorsSnap.exists()) return;

      const majorsData = majorsSnap.val();
      for (const majorId in majorsData) {
        const classes = majorsData[majorId]?.classes || {};
        if (classes[classId]) {
          const classData = classes[classId];
          const studentsObj = classData.students || {};
          const studentCount = Object.keys(studentsObj).length;

          setSelectedClasses(prev => [
            ...prev,
            {
              classId,
              className: classData.className || classId,
              studentCount,
            },
          ]);
          break;
        }
      }

      const studentsInClass = students.filter(
        ([id, stu]) => stu.classId === classId
      ).map(([id, stu]) => ({ ...stu, uid: id }));

      setSelectedClassStudents(studentsInClass);
      setSearchClassId('');
      setFilteredClasses([]);
    } catch (err) {
      console.error("Lỗi khi lấy thông tin lớp:", err);
    }
  };

  const handleRemoveClass = (classId) => {
    setSelectedClasses((prev) => prev.filter((cls) => cls.classId !== classId));
  };

  const handleSelectStudent = (student, id) => {
    const newStudent = { ...student, uid: id };
    const isExists = selectedStudents.some((s) => s.uid === id);
    if (!isExists) {
      setSelectedStudents([...selectedStudents, newStudent]);
    }
    setSearchStudentId('');
    setFilteredStudents([]);
  };

  const handleRemoveStudent = (studentNumber) => {
    setSelectedStudents(selectedStudents.filter((s) => s.studentNumber !== studentNumber));
  };

  const getFilterOptions = () => {
    switch (user?.role) {
      case 'AdminDefaults':
        return [
          { value: 'bussinesses', label: 'Doanh nghiệp' },
          { value: 'departments', label: 'Phòng ban' },
          { value: 'allStudents', label: 'Học sinh toàn trường' },
          { value: 'departmentStudents', label: 'Học sinh thuộc khoa' },
          { value: 'personalStudents', label: 'Các cá nhân học sinh' },
        ];
      case 'AdminDepartments':
        return [
          { value: 'linkedBussinesses', label: 'Doanh nghiệp liên kết' },
          { value: 'myDepartment', label: 'Toàn bộ học sinh trong khoa' },
          { value: 'byClass', label: 'Học sinh thuộc lớp' },
          { value: 'personalDepartmentStudents', label: 'Các cá nhân học sinh thuộc khoa' },
        ];
      case 'AdminBussinesses':
        return [
          { value: 'linkedDepartments', label: 'Khoa liên kết' },
          { value: 'departmentCollabStudents', label: 'Học sinh thuộc khoa liên kết' },
          { value: 'majors', label: 'Học sinh thuộc chuyên ngành' },
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    const dbRef = ref(database);
    const fetchData = async () => {
      try {
        const bussinessSnap = await get(child(dbRef, 'Bussinesses'));
        const departmentSnap = await get(child(dbRef, 'Departments'));
        const studentSnap = await get(child(dbRef, 'Users'));

        if (bussinessSnap.exists()) setBussinesses(Object.entries(bussinessSnap.val()));
        if (departmentSnap.exists()) setDepartments(Object.entries(departmentSnap.val()));
        if (studentSnap.exists()) setStudents(Object.entries(studentSnap.val()));

      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (searchStudentId.trim() === '') {
      setFilteredStudents([]);
      return;
    }

    if (filterType === 'personalStudents') {
      const result = students.filter(([id, stu]) => {
        return (
          stu &&
          stu.studentNumber &&
          stu.studentName &&
          stu.studentNumber.toLowerCase().includes(searchStudentId.toLowerCase())
        );
      });
      setFilteredStudents(result);
    } else if (filterType === 'personalDepartmentStudents') {
      const result = studentsInDepartment.filter(([id, stu]) => {
        return (
          stu &&
          stu.studentNumber &&
          stu.studentName &&
          stu.studentNumber.toLowerCase().includes(searchStudentId.toLowerCase())
        );
      });
      setFilteredStudents(result);
    }
  }, [searchStudentId, students, studentsInDepartment, filterType]);


  const renderCheckboxGrid = (data, labelField) => (
    <div className="checkbox-grid">
      {data.map(([id, item]) => (
        <label key={id} className="checkbox-item">
          <input type="checkbox" value={id} />
          {item[labelField]}
        </label>
      ))}
    </div>
  );

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung thông báo');
      return;
    }

    if (!filterType) {
      alert('Vui lòng chọn đối tượng muốn thông báo');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('Không tìm thấy người dùng hiện tại');
      return;
    }

    const notifyId = uuidv4();
    const createAt = Date.now();
    const userId = currentUser.uid;

    // Xử lý filter
    let filterData = { filterType };

    const checked = document.querySelectorAll('.notify-list-filter input[type="checkbox"]:checked');
    const selectedIds = Array.from(checked).map((input) => input.value);

    if (['personalStudents', 'personalDepartmentStudents'].includes(filterType)) {
      filterData.userIds = selectedStudents.map(stu => stu.uid);
    } else if (
      ['bussinesses', 'linkedBussinesses'].includes(filterType)
    ) {
      filterData.bussinessIds = selectedIds;
    } else if (
      ['departments', 'departmentStudents', 'linkedDepartments'].includes(filterType)
    ) {
      filterData.departmentIds = selectedIds;
    } else if (filterType === 'majors') {
      filterData.majorIds = selectedIds;
    } else if (filterType === 'byClass') {
      filterData.classIds = selectedClasses.map(cls => cls.classId);
    } else if (filterType === 'myDepartment') {
      filterData.departmentIds = [user.departmentId];
    } else if (filterType === 'departmentCollabStudents') {
      filterData.departmentIds = selectedIds;
    }


    const notifyData = {
      title,
      content,
      createAt,
      userId: userId,
      notifyId,
      filterData,
    };

    try {
      await set(ref(database, `Notifies/${userId}/${notifyId}`), notifyData);
      alert('Gửi thông báo thành công');
      setTitle('');
      setContent('');
      setFilterType('');
      setSelectedStudents([]);
      setSearchStudentId('');
      setFilteredStudents([]);
    } catch (error) {
      console.error('Lỗi khi gửi thông báo:', error);
      alert('Đã có lỗi xảy ra khi gửi thông báo');
    }
  }

  useEffect(() => {
    if (!user?.departmentId) return;

    const fetchStudentsInDepartment = async () => {
      try {
        const studentSnap = await get(child(ref(database), 'Users'));
        if (studentSnap.exists()) {
          const allStudents = Object.entries(studentSnap.val());
          const filtered = allStudents.filter(
            ([id, stu]) => stu.departmentId === user.departmentId
          );
          setStudentsInDepartment(filtered);
        }
      } catch (error) {
        console.error('Lỗi khi tải học sinh thuộc khoa:', error);
      }
    };

    fetchStudentsInDepartment();
  }, [user]);

  return (
    <div className="contract-container">
      <form className="form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div className="personal">
          <img src={user.avatar} alt="avatar" className="personal-avatar" />
          <div className="notify-admin">{user.fullName}</div>
        </div>

        <textarea
          className="notify-title"
          placeholder="Nhập tiêu đề thông báo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="notify-date">{dateCreateNotify}</div>

        <div className="notify-filter">
          <div className='notify-filter-header'>
            <div className="notify-admin">Gửi thông báo đến:</div>
            {['personalStudents', 'byClass', 'personalDepartmentStudents'].includes(filterType) && (
              <div className="search-student-container">
                {filterType === 'personalStudents' && (
                  <>
                    <input
                      type="text"
                      className="search-student"
                      placeholder="Nhập MSSV để tìm..."
                      value={searchStudentId}
                      onChange={(e) => setSearchStudentId(e.target.value)}
                    />
                    {filteredStudents.length > 0 && (
                      <div className="search-results">
                        {filteredStudents.map(([id, student]) => (
                          <div
                            key={id}
                            className="student-result"
                            onClick={() => handleSelectStudent(student, id)}
                          >
                            <div className="popup-result">
                              <span className="name">{student.studentName}</span>
                              <span className="mssv">{student.studentNumber}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {filterType === 'personalDepartmentStudents' && (
                  <>
                    <input
                      type="text"
                      className="search-student"
                      placeholder="Nhập MSSV để tìm..."
                      value={searchStudentId}
                      onChange={(e) => setSearchStudentId(e.target.value)}
                    />
                    {searchStudentId.trim() !== '' && (
                      <>
                        {filteredStudents.length > 0 ? (
                          <div className="search-results">
                            {filteredStudents.map(([id, student]) => (
                              <div
                                key={id}
                                className="student-result"
                                onClick={() => handleSelectStudent(student, id)}
                              >
                                <div className="popup-result">
                                  <span className="name">{student.studentName}</span>
                                  <span className="mssv">{student.studentNumber}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                          : (
                            <div className="search-results">
                              <div className="no-student-message">Hiện tại không có học sinh nào trong khoa này</div>
                            </div>
                          )}
                      </>
                    )}
                  </>
                )}

                {filterType === 'byClass' && (
                  <>
                    <input
                      type="text"
                      className="search-student"
                      placeholder="Nhập mã lớp để tìm..."
                      value={searchClassId}
                      onChange={(e) => setSearchClassId(e.target.value)}
                    />
                    {filteredClasses.length > 0 && (
                      <div className="search-results">
                        {filteredClasses.map(([id, cls]) => (
                          <div
                            key={id}
                            className="student-result"
                            onClick={() => handleSelectClass(id)}
                          >
                            <div className="popup-result">
                              <span className="name">{cls.className}</span>
                              <span className="mssv">{id}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          </div>

          <select
            className="notify-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">-- Lựa chọn --</option>
            {getFilterOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="notify-admin">Nội dung: </div>

        <textarea
          className="notify-content"
          placeholder="Nhập nội dung thông báo ..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div className="notify-admin">Danh sách đối tượng được thông báo:</div>

        <div className="notify-list-filter">
          {filterType === 'bussinesses' && renderCheckboxGrid(bussinesses, 'bussinessName')}
          {filterType === 'departments' && renderCheckboxGrid(departments, 'departmentName')}
          {filterType === 'departmentStudents' && renderCheckboxGrid(departments, 'departmentName')}
          {filterType === 'myDepartment' && (
            <div className="notify-ha"> Toàn bộ học sinh thuộc khoa </div>
          )}
          {filterType === 'linkedDepartments' && renderCheckboxGrid(
            departments.filter(([id]) => user?.linkedDepartmentIds?.includes(id)), 'departmentName')}
          {filterType === 'linkedBussinesses' && renderCheckboxGrid(
            bussinesses.filter(([id]) => user?.linkedBussinessIds?.includes(id)), 'bussinessName'
          )}
          {filterType === 'departmentCollabStudents' && renderCheckboxGrid(
            departments.filter(([id]) => user?.linkedDepartmentIds?.includes(id)), 'departmentName')}

          {filterType === 'majors' && renderCheckboxGrid(majors, 'majorName')}

          {filterType === 'byClass' && selectedClasses.length > 0 && (
            <div className="selected-tags">
              {selectedClasses.map((cls) => (
                <div className="class-result" key={cls.classId}>
                  <div className="popup-result-tag">
                    <span className="name">Lớp: {cls.className}</span>
                    <span className="mssv">Số lượng sinh viên: {cls.studentCount}</span>
                    <span
                      className="remove-tag"
                      onClick={() => handleRemoveClass(cls.classId)}
                      style={{ marginLeft: '10px', cursor: 'pointer', color: 'red', fontWeight: 'bold' }}
                    >
                      &times;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(['personalStudents', 'personalDepartmentStudents'].includes(filterType)) && selectedStudents.length > 0 && (
            <div className="selected-tags">
              {selectedStudents.map((stu) => (
                <div className="tag" key={stu.studentNumber}>
                  {stu.studentName} ({stu.studentNumber})
                  <span className="remove-tagg" onClick={() => handleRemoveStudent(stu.studentNumber)}>
                    &times;
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>

        <button type="submit" className="submit-btnn">
          Gửi thông báo
        </button>
      </form>
    </div>
  );
};

export default CreateNotify;