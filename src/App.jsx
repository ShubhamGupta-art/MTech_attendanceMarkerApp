import React, { useState, useRef, useMemo, useEffect } from 'react';
import { toPng } from 'html-to-image';
import data from './data.json';
import AttendanceHeader from './components/AttendanceHeader';
import { databases, APPWRITE_CONFIG, ID } from './lib/appwrite';
import { Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getCurrentSubjectId } from './utils/timetable';

const App = () => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(data.subjects[0].id);
  const [attendance, setAttendance] = useState(
    data.students.reduce((acc, student) => ({ ...acc, [student.rollNumber]: false }), {})
  );
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'success' | 'error'

  const exportRef = useRef(null);

  useEffect(() => {
    const autoSubjectId = getCurrentSubjectId();
    if (autoSubjectId) {
      // confirm it exists in our data
      const exists = data.subjects.find(s => s.id === autoSubjectId);
      if (exists) {
        setSelectedSubjectId(autoSubjectId);
      }
    }
  }, []);

  const selectedSubject = useMemo(() => 
    data.subjects.find(s => s.id === selectedSubjectId),
  [selectedSubjectId]);

  const today = useMemo(() => {
    const d = new Date();
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }, []);

  const todayFilename = useMemo(() => {
    const d = new Date();
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }, []);

  const toggleAttendance = (rollNumber) => {
    setAttendance(prev => ({
      ...prev,
      [rollNumber]: !prev[rollNumber]
    }));
  };

  const handleExportAndSave = async () => {
    if (exportRef.current === null) return;
    setSaveStatus('saving');
    
    try {
      // 1. Export as PNG
      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        backgroundColor: '#000000',
        style: {
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          width: '540px',
        }
      });
      
      const link = document.createElement('a');
      link.download = `attendance_${selectedSubjectId}_${todayFilename}.png`;
      link.href = dataUrl;
      link.click();

      // 2. Save to Appwrite
      const presentRollNumbers = data.students
        .filter(s => attendance[s.rollNumber])
        .map(s => s.rollNumber);

      await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collectionId,
        ID.unique(),
        {
          subject: `${selectedSubject.name} (${selectedSubjectId})`,
          subjectId: selectedSubjectId,
          subjectName: selectedSubject.name,
          date: new Date().toISOString(), // Use ISO string for Appwrite datetime column
          present: presentRollNumbers,   // attribute ID is 'present'
        }
      );

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Export or Save failed', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  const handleSelectAll = () => {
    const allChecked = Object.values(attendance).every(v => v);
    const newState = data.students.reduce((acc, student) => ({
      ...acc,
      [student.rollNumber]: !allChecked
    }), {});
    setAttendance(newState);
  };

  const presentStudents = data.students.filter(s => attendance[s.rollNumber]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6 font-sans">
      {/* Subject Selector (UI Only) */}
      <div className="w-full max-w-md mb-4">
        <label className="block text-xs uppercase text-gray-400 mb-2">Select Subject</label>
        <select 
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="w-full bg-black border border-white text-white p-2 text-sm focus:outline-none"
        >
          {data.subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
          ))}
        </select>
      </div>

      {/* Select All Button (UI Only) */}
      <div className="w-full max-w-md mb-4">
        <button 
          onClick={handleSelectAll}
          className="w-full text-[10px] uppercase tracking-[0.2em] text-gray-400 border border-gray-800 p-1 hover:border-white hover:text-white transition-all"
        >
          {Object.values(attendance).every(v => v) ? "Deselect All" : "Select All Students"}
        </button>
      </div>

      {/* Main Attendance Interface */}
      <div className="w-full max-w-md space-y-4">
        <AttendanceHeader 
          subject={selectedSubject.name}
          professor={selectedSubject.professor}
          date={today}
        />

        <div className="space-y-3">
          {data.students.map(student => (
            <div key={student.rollNumber} className="flex items-center space-x-4">
              <input 
                type="checkbox"
                checked={attendance[student.rollNumber]}
                onChange={() => toggleAttendance(student.rollNumber)}
                id={`student-${student.rollNumber}`}
              />
              <label 
                htmlFor={`student-${student.rollNumber}`}
                className="flex items-center space-x-4 cursor-pointer select-none"
              >
                <span className="text-gray-400 font-mono text-sm">
                  {student.rollNumber.slice(-2)}
                </span>
                <span className="text-sm font-medium uppercase tracking-wide">
                  {student.name}
                </span>
              </label>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <button 
            onClick={handleExportAndSave}
            disabled={saveStatus === 'saving'}
            className={`w-full flex items-center justify-center space-x-3 border p-4 text-sm font-bold uppercase tracking-[0.2em] transition-all ${
              saveStatus === 'success' 
                ? 'bg-green-600 border-green-600 text-white' 
                : saveStatus === 'error'
                ? 'bg-red-600 border-red-600 text-white'
                : 'border-white hover:bg-white hover:text-black disabled:opacity-50'
            }`}
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saveStatus === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : saveStatus === 'error' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>
              {saveStatus === 'saving' ? 'Exporting & Saving...' : 
               saveStatus === 'success' ? 'Exported & Saved' : 
               saveStatus === 'error' ? 'Failed' : 
               'Export'}
            </span>
          </button>
        </div>
      </div>

      {/* Sticky Footer */}
      <a 
        href="https://www.linkedin.com/in/shubham-gupta-866747300?utm_source=share_via&utm_content=profile&utm_medium=member_android"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-full text-[10px] uppercase tracking-widest text-gray-400 hover:text-white hover:border-zinc-600 transition-all group scale-100 hover:scale-105"
        style={{ textDecoration: 'none' }}
      >
        <span className="block md:hidden">made with ❤️</span>
        <span className="hidden md:block">made with ❤️ by sonofdawnn</span>
      </a>

      {/* Hidden Export Template (Exactly what will be in PNG) */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div 
          ref={exportRef} 
          className="bg-black text-white flex flex-col items-center" 
          style={{ width: '540px', minHeight: '960px', padding: '60px' }}
        >
          <AttendanceHeader 
            subject={selectedSubject.name}
            professor={selectedSubject.professor}
            date={today}
          />
          
          <div className="w-full space-y-4 mt-4">
            {presentStudents.length > 0 ? (
              presentStudents.map(student => (
                <div key={student.rollNumber} className="flex items-center space-x-6">
                  <span className="text-gray-400 font-mono text-base">
                    {student.rollNumber.slice(-2)}
                  </span>
                  <span className="text-base font-bold uppercase tracking-widest">
                    {student.name}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 italic mt-10 uppercase text-xs tracking-widest">
                No students marked present
              </p>
            )}
          </div>
          
          {/* Footer for the document feel */}
          <div className="mt-auto pt-10 text-[10px] text-gray-500 uppercase tracking-[0.2em] text-center w-full">
            Generated Document • Academic Attendance
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
