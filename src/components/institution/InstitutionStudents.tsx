import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import {
  GraduationCap,
  Search,
  Filter,
  Plus,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MoreVertical,
  ChevronRight,
  Shield,
  Smartphone,
  BookOpen,
  Calendar,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const InstitutionStudents: React.FC = () => {
  const {
    students,
    batches,
    addStudent,
    updateStudentProfile,
    importStudentsFromCSV,
    deleteStudent,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('ALL');
  const [selectedAttendanceFilter, setSelectedAttendanceFilter] = useState<'ALL' | 'AT_RISK' | 'GOOD'>('ALL');
  const [selectedStudentForDrawer, setSelectedStudentForDrawer] = useState<Student | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);

  // Add Single Student Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    registerNumber: '',
    netId: '',
    dept: 'Computer Science & Engineering',
    batchId: batches[0]?.id || 'batch-cs-26a',
    section: 'A',
    phone: '',
  });

  // CSV Import State
  const [csvText, setCsvText] = useState(
    `RegisterNumber,NetID,FullName,Email,Department,Section\n710022104008,net_harper,Harper Vance,harper.v@stanford.edu,Computer Science,A\n710022104009,net_ian,Ian Gallagher,ian.g@stanford.edu,Computer Science,A`
  );

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.registerNumber && s.registerNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.netId && s.netId.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesBatch =
        selectedBatchFilter === 'ALL' || s.batchId === selectedBatchFilter;

      const attPct = s.academicRecord?.attendancePercentage ?? 90;
      const matchesAtt =
        selectedAttendanceFilter === 'ALL' ||
        (selectedAttendanceFilter === 'AT_RISK' && attPct < 75) ||
        (selectedAttendanceFilter === 'GOOD' && attPct >= 75);

      return matchesSearch && matchesBatch && matchesAtt;
    });
  }, [students, searchQuery, selectedBatchFilter, selectedAttendanceFilter]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      showToast('Please provide student name and email', 'error');
      return;
    }

    const targetBatch = batches.find((b) => b.id === formData.batchId);

    addStudent({
      name: formData.name,
      email: formData.email,
      registerNumber: formData.registerNumber || `7100221040${Math.floor(10 + Math.random() * 89)}`,
      netId: formData.netId || formData.name.toLowerCase().replace(/\s+/g, '_'),
      studentIdentifier: formData.registerNumber || `SU-${Date.now().toString().slice(-4)}`,
      dept: formData.dept,
      batchId: formData.batchId,
      batchName: targetBatch?.name || 'CS 2026 Batch',
      section: formData.section,
      phone: formData.phone || '+1 (650) 723-0000',
    });

    setShowAddModal(false);
    setFormData({
      name: '',
      email: '',
      registerNumber: '',
      netId: '',
      dept: 'Computer Science & Engineering',
      batchId: batches[0]?.id || 'batch-cs-26a',
      section: 'A',
      phone: '',
    });
  };

  const handleCSVImport = () => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length <= 1) {
        showToast('Please enter at least one data row in the CSV', 'error');
        return;
      }

      const rows: Array<Partial<Student>> = [];
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length >= 4) {
          const [registerNumber, netId, name, email, dept, section] = parts;
          rows.push({
            registerNumber,
            netId,
            name,
            email,
            dept: dept || 'Computer Science',
            section: section || 'A',
            batchId: selectedBatchFilter !== 'ALL' ? selectedBatchFilter : 'batch-cs-26a',
          });
        }
      }

      const res = importStudentsFromCSV(rows);
      if (res.imported > 0) {
        setShowCSVModal(false);
      }
    } catch (err) {
      showToast('Failed to parse CSV format', 'error');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-blue-600" />
            <span>Student Rosters & Records</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage enrolled students, academic registration numbers, NetIDs, and batch allocations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCSVModal(true)}
            className="border border-slate-200 bg-white text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 font-medium text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Bulk CSV Import</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, register #, or NetID..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Batch Filter */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-medium">Batch:</span>
            <select
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Batches ({students.length})</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.section})
                </option>
              ))}
            </select>
          </div>

          {/* Attendance Threshold */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">Attendance:</span>
            <select
              value={selectedAttendanceFilter}
              onChange={(e) => setSelectedAttendanceFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Attendance</option>
              <option value="AT_RISK">At-Risk (&lt;75%)</option>
              <option value="GOOD">Good (&ge;75%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-xs">
              <tr>
                <th className="py-3.5 px-4">Student & NetID</th>
                <th className="py-3.5 px-4">Register No.</th>
                <th className="py-3.5 px-4">Batch / Section</th>
                <th className="py-3.5 px-4">Attendance Rate</th>
                <th className="py-3.5 px-4">CGPA</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No students match the selected filter or search criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const attPct = s.academicRecord?.attendancePercentage ?? 92.0;
                  const isAtRisk = attPct < 75;

                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedStudentForDrawer(s)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg ${
                              s.avatarColor || 'bg-blue-600'
                            } text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                          >
                            {s.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {s.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {s.netId ? `@${s.netId}` : s.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Register Number */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                        {s.registerNumber || s.studentIdentifier || '710022104000'}
                      </td>

                      {/* Batch & Section */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {s.batchName || 'CS 2026 Batch'}
                        </div>
                        <div className="text-xs text-slate-500">
                          Section {s.section || 'A'} • {s.dept || 'CS'}
                        </div>
                      </td>

                      {/* Attendance % */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isAtRisk ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${attPct}%` }}
                            ></div>
                          </div>
                          <span
                            className={`font-semibold text-xs ${
                              isAtRisk ? 'text-rose-600' : 'text-emerald-700'
                            }`}
                          >
                            {attPct}%
                          </span>
                        </div>
                      </td>

                      {/* CGPA */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">
                          {s.academicRecord?.cgpa?.toFixed(2) || '3.85'}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">CGPA</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            s.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudentForDrawer(s);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Slide-out Drawer */}
      {selectedStudentForDrawer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white border-l border-slate-200 h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl ${
                    selectedStudentForDrawer.avatarColor || 'bg-blue-600'
                  } text-white font-bold text-base flex items-center justify-center`}
                >
                  {selectedStudentForDrawer.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedStudentForDrawer.name}
                  </h2>
                  <div className="text-xs text-slate-500">
                    Register #: <span className="font-mono text-slate-800 font-medium">{selectedStudentForDrawer.registerNumber || selectedStudentForDrawer.studentIdentifier}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentForDrawer(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Academic Summary Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-500">Batch & Section</span>
                <div className="font-semibold text-slate-900 text-sm mt-0.5">
                  {selectedStudentForDrawer.batchName} (Sec {selectedStudentForDrawer.section || 'A'})
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-500">Attendance Percentage</span>
                <div
                  className={`text-base font-bold mt-0.5 ${
                    (selectedStudentForDrawer.academicRecord?.attendancePercentage ?? 92) < 75
                      ? 'text-rose-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {selectedStudentForDrawer.academicRecord?.attendancePercentage ?? 92.0}%
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-500">Institutional NetID</span>
                <div className="font-mono text-blue-700 font-semibold text-sm mt-0.5">
                  {selectedStudentForDrawer.netId || `@student_${selectedStudentForDrawer.id}`}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-500">Cumulative GPA</span>
                <div className="font-semibold text-slate-900 text-base mt-0.5">
                  {selectedStudentForDrawer.academicRecord?.cgpa || 3.85} / 4.0
                </div>
              </div>
            </div>

            {/* Assessment History */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Assessment History & Malpractice Status
              </h3>
              <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden">
                {selectedStudentForDrawer.assignments?.length ? (
                  selectedStudentForDrawer.assignments.map((ass) => (
                    <div key={ass.id || ass.assessmentId} className="p-3.5 text-xs flex items-center justify-between bg-white">
                      <div>
                        <div className="font-semibold text-slate-900">{ass.assessmentTitle}</div>
                        <div className="text-xs text-slate-500">
                          Score: {ass.scoreSummary?.score ?? '—'} • Assigned: {ass.assignedAt}
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          ass.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ass.status === 'REVOKED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {ass.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    No assessments assigned yet.
                  </div>
                )}
              </div>
            </div>

            {/* Active Device Sessions */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Registered Device Sessions & Logins
              </h3>
              <div className="space-y-2">
                {selectedStudentForDrawer.activeDevices?.map((dev) => (
                  <div
                    key={dev.sessionId || dev.deviceId}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-slate-500" />
                      <div>
                        <div className="font-semibold text-slate-900">
                          {dev.browser} on {dev.deviceType}
                        </div>
                        <div className="text-xs text-slate-500">
                          IP: {dev.ipAddress} • {dev.location || 'Campus Lab'}
                        </div>
                      </div>
                    </div>
                    {dev.isCurrentSession && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  deleteStudent(selectedStudentForDrawer.id);
                  setSelectedStudentForDrawer(null);
                }}
                className="px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold cursor-pointer transition-colors"
              >
                Delete Student Record
              </button>

              <button
                onClick={() => setSelectedStudentForDrawer(null)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Enroll New Student</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rachel Adams"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Student Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rachel.a@stanford.edu"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Register Number</label>
                  <input
                    type="text"
                    value={formData.registerNumber}
                    onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })}
                    placeholder="710022104008"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Institutional NetID</label>
                  <input
                    type="text"
                    value={formData.netId}
                    onChange={(e) => setFormData({ ...formData, netId: e.target.value })}
                    placeholder="net_radams"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assign Batch</label>
                  <select
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Section</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="A"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer shadow-xs"
                >
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Bulk Upload Modal */}
      {showCSVModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Bulk CSV / Excel Student Import</h2>
              </div>
              <button
                onClick={() => setShowCSVModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Paste standard CSV rows below with header: <code className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">RegisterNumber,NetID,FullName,Email,Department,Section</code>
            </p>

            <div>
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
              <span className="text-slate-500">
                Target Batch: <span className="text-slate-900 font-semibold">{batches[0]?.name}</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCSVModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCSVImport}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer shadow-xs"
                >
                  Import All Rows
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
