import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Smartphone,
  Code,
  Copy,
  Check,
  RefreshCw,
  Send,
  CheckCircle2,
  Key,
  QrCode,
  Globe,
  Radio,
  FileCode,
} from 'lucide-react';

export const InstitutionMobileSync: React.FC = () => {
  const { staffFaculty, getMobileSyncDataset, getLiveBatchForFaculty, showToast } = useApp();

  const [selectedFacultyId, setSelectedFacultyId] = useState(staffFaculty[0]?.id || 'fac-101');
  const [copiedContract, setCopiedContract] = useState(false);
  const [activeEndpointTab, setActiveEndpointTab] = useState<'sync' | 'live' | 'mark' | 'bulk'>('sync');

  const selectedFaculty = staffFaculty.find((f) => f.id === selectedFacultyId) || staffFaculty[0];

  const syncDataset = getMobileSyncDataset(selectedFacultyId);
  const liveBatchDataset = getLiveBatchForFaculty(selectedFacultyId);

  const sampleMarkPayload = {
    studentId: 1,
    batchId: 'batch-cs-26a',
    status: 'PRESENT',
    source: 'mobile-app',
    remarks: 'Scanned via iPhone 15 NFC',
    date: new Date().toISOString().split('T')[0],
    sessionTimeWindow: '09:00 - 10:30',
  };

  const sampleBulkPayload = {
    batchId: 'batch-cs-26a',
    source: 'mobile-app',
    sessionTimeWindow: '09:00 - 10:30',
    records: [
      { studentId: 1, status: 'PRESENT' },
      { studentId: 2, status: 'PRESENT' },
      { studentId: 3, status: 'ABSENT', remarks: 'Medical excusal submitted' },
    ],
  };

  const displayedPayload =
    activeEndpointTab === 'sync'
      ? syncDataset
      : activeEndpointTab === 'live'
      ? liveBatchDataset
      : activeEndpointTab === 'mark'
      ? sampleMarkPayload
      : sampleBulkPayload;

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(displayedPayload, null, 2));
    setCopiedContract(true);
    showToast('JSON contract copied to clipboard', 'info');
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Smartphone className="w-7 h-7 text-blue-600" />
            <span>Mobile App API Sync & Developer Contract</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            API-first specifications and real-time endpoints for future standalone mobile attendance-marking client apps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-semibold">
            API Contract: v1.2.0
          </span>
        </div>
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Key className="w-4 h-4 text-blue-600" />
            <span>Bearer Token / API Key Auth</span>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">
            Reuses TalHelix auth system. Faculty pass their unique API key or JWT token in Authorization header.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Radio className="w-4 h-4 text-emerald-600" />
            <span>Multi-Source Reconciliation</span>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">
            Every record explicitly stores <code className="text-emerald-700 font-semibold bg-emerald-50 px-1 py-0.5 rounded">source: "mobile-app"</code> for seamless audit tracking.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>Offline-First Mobile Sync</span>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">
            Mobile clients query dataset on boot, mark locally when offline in basement classrooms, and flush via bulk endpoint.
          </p>
        </div>
      </div>

      {/* Interactive API Tester Canvas */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-5">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Endpoint Tabs */}
          <div className="flex flex-wrap rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setActiveEndpointTab('sync')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeEndpointTab === 'sync'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GET /api/mobile/sync-dataset
            </button>

            <button
              onClick={() => setActiveEndpointTab('live')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeEndpointTab === 'live'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GET /api/attendance/live-batch
            </button>

            <button
              onClick={() => setActiveEndpointTab('mark')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeEndpointTab === 'mark'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              POST /api/attendance/mark
            </button>

            <button
              onClick={() => setActiveEndpointTab('bulk')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeEndpointTab === 'bulk'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              POST /api/attendance/bulk-mark
            </button>
          </div>

          {/* Faculty Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Context Faculty:</span>
            <select
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
            >
              {staffFaculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.employeeId})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Code / JSON Inspector */}
        <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-400" />
              <span className="font-mono text-slate-300">
                {activeEndpointTab === 'sync'
                  ? `GET /api/mobile/sync-dataset?facultyId=${selectedFaculty.id}`
                  : activeEndpointTab === 'live'
                  ? `GET /api/attendance/live-batch?facultyId=${selectedFaculty.id}`
                  : activeEndpointTab === 'mark'
                  ? `POST /api/attendance/mark`
                  : `POST /api/attendance/bulk-mark`}
              </span>
            </div>

            <button
              onClick={handleCopyJSON}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 cursor-pointer text-xs font-medium transition-colors"
            >
              {copiedContract ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedContract ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96 leading-relaxed">
            {JSON.stringify(displayedPayload, null, 2)}
          </pre>
        </div>

        {/* Curl Command Preview */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="text-xs font-semibold text-slate-600 mb-1.5">CURL Terminal Invocation:</div>
          <code className="font-mono text-blue-700 bg-white p-2.5 rounded-lg border border-slate-200 break-all select-all block">
            curl -X GET "http://localhost:3000/api/mobile/sync-dataset?facultyId={selectedFaculty.id}" -H "Authorization: Bearer {selectedFaculty.apiKey || 'th_live_fac_samplekey'}"
          </code>
        </div>
      </div>
    </div>
  );
};
