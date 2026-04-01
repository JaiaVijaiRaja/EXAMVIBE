import React, { useState, useMemo } from 'react';
import { Calculator as CalcIcon, Plus, Trash2, GraduationCap, Percent, BookOpen } from 'lucide-react';

const GRADES = [
  { grade: 'O', point: 10, min: 91, max: 100, label: 'Outstanding' },
  { grade: 'A+', point: 9, min: 81, max: 90, label: 'Excellent' },
  { grade: 'A', point: 8, min: 71, max: 80, label: 'Very Good' },
  { grade: 'B+', point: 7, min: 61, max: 70, label: 'Good' },
  { grade: 'B', point: 6, min: 56, max: 60, label: 'Above Average' },
  { grade: 'C', point: 5, min: 50, max: 55, label: 'Average' },
  { grade: 'F', point: 0, min: 0, max: 49, label: 'Fail' },
];

const getGradeFromMarks = (marks: number) => {
  if (marks < 0 || marks > 100) return null;
  return GRADES.find(g => marks >= g.min && marks <= g.max) || GRADES[GRADES.length - 1];
};

export const Calculator: React.FC = () => {
  // Marks to Grade State
  const [marks, setMarks] = useState<string>('');
  
  // SGPA State
  const [subjects, setSubjects] = useState([{ id: 1, name: '', credits: 3, grade: 'O' }]);
  const [sgpaResult, setSgpaResult] = useState<number | null>(null);

  // CGPA State
  const [semesters, setSemesters] = useState([{ id: 1, sgpa: '', credits: '' }]);
  const [cgpaResult, setCgpaResult] = useState<number | null>(null);

  // CGPA to Percentage State
  const [cgpaInput, setCgpaInput] = useState<string>('');

  // Marks to Grade Logic
  const marksValue = parseInt(marks);
  const gradeResult = !isNaN(marksValue) ? getGradeFromMarks(marksValue) : null;

  // SGPA Logic
  const addSubject = () => {
    setSubjects([...subjects, { id: Date.now(), name: '', credits: 3, grade: 'O' }]);
  };

  const removeSubject = (id: number) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  };

  const updateSubject = (id: number, field: string, value: string | number) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const calculateSGPA = () => {
    let totalCredits = 0;
    let totalPoints = 0;
    
    subjects.forEach(sub => {
      const credit = Number(sub.credits);
      const gradeObj = GRADES.find(g => g.grade === sub.grade);
      if (credit > 0 && gradeObj) {
        totalCredits += credit;
        totalPoints += credit * gradeObj.point;
      }
    });

    if (totalCredits > 0) {
      setSgpaResult(Number((totalPoints / totalCredits).toFixed(2)));
    } else {
      setSgpaResult(0);
    }
  };

  // CGPA Logic
  const addSemester = () => {
    if (semesters.length < 8) {
      setSemesters([...semesters, { id: Date.now(), sgpa: '', credits: '' }]);
    }
  };

  const removeSemester = (id: number) => {
    if (semesters.length > 1) {
      setSemesters(semesters.filter(s => s.id !== id));
    }
  };

  const updateSemester = (id: number, field: string, value: string) => {
    setSemesters(semesters.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const calculateCGPA = () => {
    let totalCredits = 0;
    let totalPoints = 0;

    semesters.forEach(sem => {
      const sgpa = parseFloat(sem.sgpa);
      const credits = parseFloat(sem.credits);
      if (!isNaN(sgpa) && !isNaN(credits) && credits > 0) {
        totalCredits += credits;
        totalPoints += sgpa * credits;
      }
    });

    if (totalCredits > 0) {
      setCgpaResult(Number((totalPoints / totalCredits).toFixed(2)));
    } else {
      setCgpaResult(0);
    }
  };

  return (
    <div className="space-y-8 pb-20 text-slate-200">
      <header>
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <CalcIcon className="w-8 h-8 text-indigo-400" />
          Grade Calculator
        </h2>
        <p className="text-slate-400 mt-2">Calculate your SGPA, CGPA, and convert marks to grades based on the 2021 Regulation (10-point scale).</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marks to Grade Converter */}
        <div className="bg-[#111111] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Marks to Grade</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Enter Marks (0-100)</label>
              <input 
                type="number" 
                min="0" 
                max="100"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="e.g. 85"
              />
            </div>

            {gradeResult && (
              <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-300 font-medium">{gradeResult.label}</p>
                  <p className="text-3xl font-bold text-indigo-400">Grade {gradeResult.grade}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-indigo-300 font-medium">Grade Point</p>
                  <p className="text-3xl font-bold text-indigo-400">{gradeResult.point}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CGPA to Percentage Converter */}
        <div className="bg-[#111111] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Percent className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white">CGPA to Percentage</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Enter CGPA</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                max="10"
                value={cgpaInput}
                onChange={(e) => setCgpaInput(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="e.g. 8.5"
              />
            </div>

            {cgpaInput && !isNaN(parseFloat(cgpaInput)) && (
              <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-300 font-medium">Equivalent Percentage</p>
                  <p className="text-3xl font-bold text-emerald-400">
                    {(parseFloat(cgpaInput) * 10).toFixed(2)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SGPA Calculator */}
      <div className="bg-[#111111] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <CalcIcon className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white">SGPA Calculator</h3>
          </div>
          <button 
            onClick={addSubject}
            className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-12 gap-4 px-2 text-sm font-medium text-slate-400 hidden sm:grid">
            <div className="col-span-5">Subject Name (Optional)</div>
            <div className="col-span-3">Credits</div>
            <div className="col-span-3">Grade</div>
            <div className="col-span-1"></div>
          </div>
          
          {subjects.map((subject, index) => (
            <div key={subject.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center bg-[#1a1a1a] p-3 sm:p-2 rounded-xl border border-slate-800">
              <div className="col-span-1 sm:col-span-5">
                <input 
                  type="text" 
                  value={subject.name}
                  onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                  placeholder={`Subject ${index + 1}`}
                  className="w-full bg-transparent border-none text-white focus:ring-0 outline-none px-2"
                />
              </div>
              <div className="col-span-1 sm:col-span-3 flex items-center gap-2 sm:block">
                <span className="text-xs text-slate-500 sm:hidden w-16">Credits:</span>
                <input 
                  type="number" 
                  min="1"
                  max="10"
                  value={subject.credits}
                  onChange={(e) => updateSubject(subject.id, 'credits', parseInt(e.target.value) || 0)}
                  className="w-full bg-[#222] border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="col-span-1 sm:col-span-3 flex items-center gap-2 sm:block">
                <span className="text-xs text-slate-500 sm:hidden w-16">Grade:</span>
                <select 
                  value={subject.grade}
                  onChange={(e) => updateSubject(subject.id, 'grade', e.target.value)}
                  className="w-full bg-[#222] border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                >
                  {GRADES.map(g => (
                    <option key={g.grade} value={g.grade}>{g.grade} ({g.point} pts)</option>
                  ))}
                </select>
              </div>
              <div className="col-span-1 flex justify-end sm:justify-center mt-2 sm:mt-0">
                <button 
                  onClick={() => removeSubject(subject.id)}
                  disabled={subjects.length === 1}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <button 
            onClick={calculateSGPA}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-lg shadow-blue-900/20"
          >
            Calculate SGPA
          </button>
          
          {sgpaResult !== null && (
            <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 px-6 py-3 rounded-xl w-full sm:w-auto justify-center">
              <span className="text-blue-300 font-medium">Your SGPA:</span>
              <span className="text-2xl font-bold text-blue-400">{sgpaResult.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* CGPA Calculator */}
      <div className="bg-[#111111] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <GraduationCap className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white">CGPA Calculator</h3>
          </div>
          <button 
            onClick={addSemester}
            disabled={semesters.length >= 8}
            className="flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> Add Semester
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-12 gap-4 px-2 text-sm font-medium text-slate-400 hidden sm:grid">
            <div className="col-span-3">Semester</div>
            <div className="col-span-4">SGPA</div>
            <div className="col-span-4">Total Credits</div>
            <div className="col-span-1"></div>
          </div>
          
          {semesters.map((sem, index) => (
            <div key={sem.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center bg-[#1a1a1a] p-3 sm:p-2 rounded-xl border border-slate-800">
              <div className="col-span-1 sm:col-span-3 px-2 text-slate-300 font-medium">
                Semester {index + 1}
              </div>
              <div className="col-span-1 sm:col-span-4 flex items-center gap-2 sm:block">
                <span className="text-xs text-slate-500 sm:hidden w-20">SGPA:</span>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  max="10"
                  value={sem.sgpa}
                  onChange={(e) => updateSemester(sem.id, 'sgpa', e.target.value)}
                  placeholder="e.g. 8.5"
                  className="w-full bg-[#222] border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="col-span-1 sm:col-span-4 flex items-center gap-2 sm:block">
                <span className="text-xs text-slate-500 sm:hidden w-20">Credits:</span>
                <input 
                  type="number" 
                  min="1"
                  value={sem.credits}
                  onChange={(e) => updateSemester(sem.id, 'credits', e.target.value)}
                  placeholder="e.g. 22"
                  className="w-full bg-[#222] border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="col-span-1 flex justify-end sm:justify-center mt-2 sm:mt-0">
                <button 
                  onClick={() => removeSemester(sem.id)}
                  disabled={semesters.length === 1}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <button 
            onClick={calculateCGPA}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-lg shadow-purple-900/20"
          >
            Calculate CGPA
          </button>
          
          {cgpaResult !== null && (
            <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 px-6 py-3 rounded-xl w-full sm:w-auto justify-center">
              <span className="text-purple-300 font-medium">Your CGPA:</span>
              <span className="text-2xl font-bold text-purple-400">{cgpaResult.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
