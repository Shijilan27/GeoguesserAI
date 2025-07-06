import React, { useState, useEffect } from 'react';
import { FaTrash, FaDownload, FaEllipsisV, FaCog, FaFilter, FaArrowLeft } from 'react-icons/fa';
import { Tooltip } from 'react-tooltip';

const ADMIN_PASSWORD = '#2712Shiji'; // Change this to your desired password

const confidenceColors: Record<string, string> = {
  High: 'bg-green-500',
  Medium: 'bg-yellow-400',
  Low: 'bg-red-500',
};

const feedbackColors: Record<string, string> = {
  correct: 'bg-green-600',
  incorrect: 'bg-red-600',
  'not provided': 'bg-gray-500',
};

const getAvatarUrl = (name: string) => {
  // Use DiceBear Avatars for a random, unique avatar (SVG extension)
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
};

const goBackToApp = () => {
  window.location.href = '/'; // Change this if you use React Router
};

const AdminLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterUser, setFilterUser] = useState('');
  const [filterFeedback, setFilterFeedback] = useState('');

  useEffect(() => {
    if (authenticated) {
      fetch('http://localhost:3001/api/logs')
        .then(res => res.json())
        .then(setLogs)
        .catch(() => setError('Failed to fetch logs'));
    }
  }, [authenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const fetchLogs = () => {
    fetch('http://localhost:3001/api/logs')
      .then(res => res.json())
      .then(setLogs)
      .catch(() => setError('Failed to fetch logs'));
  };

  const handleClearAllLogs = async () => {
    if (!window.confirm('Are you sure you want to delete all logs? This action cannot be undone.')) return;
    await fetch('http://localhost:3001/api/logs', { method: 'DELETE' });
    fetchLogs();
    setShowSettings(false);
  };

  // Dummy handlers for actions
  const handleDelete = (id: string) => {
    alert('Delete functionality coming soon!');
  };
  const handleDownload = (imgUrl: string) => {
    window.open(imgUrl, '_blank');
  };

  if (!authenticated) {
    return (
      <div className="w-screen h-screen min-h-screen min-w-full bg-white flex items-center justify-center">
        <button
          onClick={goBackToApp}
          className="absolute top-6 left-6 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md font-semibold z-10"
        >
          <FaArrowLeft /> Back to App
        </button>
        <form onSubmit={handleLogin} className="bg-white border border-slate-200 p-6 rounded-xl shadow-lg flex flex-col gap-4 w-full max-w-xs items-center">
          <h2 className="text-xl font-bold mb-2 text-center">Admin Login</h2>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="p-2 rounded bg-slate-100 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
          />
          <button type="submit" className="bg-indigo-700 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md w-full">Login</button>
          {error && <p className="text-red-500 text-center">{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-white flex flex-col overflow-hidden">
      {/* Back to App Button */}
      <button
        onClick={goBackToApp}
        className="absolute top-6 left-6 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md font-semibold z-10"
      >
        <FaArrowLeft /> Back to App
      </button>
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-20 w-full bg-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-6 border-b border-slate-200">
        <h2 className="text-3xl font-bold text-slate-900">All User Logs <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full align-middle">New</span></h2>
        <div className="flex gap-2 items-center">
          <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg shadow-sm" onClick={() => setShowFilter(v => !v)}><FaFilter /> Filter</button>
          <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg shadow-sm" onClick={() => setShowSettings(v => !v)}><FaCog /> Settings</button>
        </div>
      </div>
      {/* Filter UI */}
      {showFilter && (
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex gap-4 items-center">
          <input
            type="text"
            placeholder="Filter by user name"
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
            className="p-2 rounded border border-slate-300"
          />
          <select
            value={filterFeedback}
            onChange={e => setFilterFeedback(e.target.value)}
            className="p-2 rounded border border-slate-300"
          >
            <option value="">All Feedback</option>
            <option value="correct">Correct</option>
            <option value="incorrect">Incorrect</option>
            <option value="not provided">Not Provided</option>
          </select>
        </div>
      )}
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col gap-4 min-w-[300px]">
            <h3 className="text-lg font-bold mb-2">Settings</h3>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold" onClick={handleClearAllLogs}>Clear All Logs</button>
            <button className="mt-2 text-slate-600 hover:text-slate-900 underline" onClick={() => setShowSettings(false)}>Close</button>
          </div>
        </div>
      )}
      {/* Table Section - fills the rest of the page */}
      <div className="flex-1 w-full h-full overflow-auto">
        <div className="w-full h-full">
          <table className="table-fixed w-full text-sm md:text-base bg-white">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-slate-700 text-left">
                <th className="p-4 font-semibold truncate">User</th>
                <th className="p-4 font-semibold truncate">Country</th>
                <th className="p-4 font-semibold truncate">State</th>
                <th className="p-4 font-semibold truncate">City</th>
                <th className="p-4 font-semibold truncate">Direction</th>
                <th className="p-4 font-semibold truncate">Nearest City</th>
                <th className="p-4 font-semibold truncate">Reasoning</th>
                <th className="p-4 font-semibold truncate">Confidence</th>
                <th className="p-4 font-semibold truncate">Accuracy</th>
                <th className="p-4 font-semibold truncate">Feedback</th>
                <th className="p-4 font-semibold truncate">Correction</th>
                <th className="p-4 font-semibold truncate">Image</th>
                <th className="p-4 font-semibold truncate">Timestamp</th>
                <th className="p-4 font-semibold text-center truncate">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.filter(log =>
                (!filterUser || (log.userName && log.userName.toLowerCase().includes(filterUser.toLowerCase()))) &&
                (!filterFeedback || (log.feedback && log.feedback.toLowerCase() === filterFeedback))
              ).length === 0 ? (
                <tr><td colSpan={14} className="text-center p-8 text-slate-500">No logs found.</td></tr>
              ) : (
                logs.filter(log =>
                  (!filterUser || (log.userName && log.userName.toLowerCase().includes(filterUser.toLowerCase()))) &&
                  (!filterFeedback || (log.feedback && log.feedback.toLowerCase() === filterFeedback))
                ).map((log, idx) => {
                  // Confidence as a percentage for progress bar
                  let confidencePercent = 0;
                  if (log.confidence === 'High') confidencePercent = 90;
                  else if (log.confidence === 'Medium') confidencePercent = 60;
                  else if (log.confidence === 'Low') confidencePercent = 30;
                  return (
                    <tr key={log._id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      {/* User/Avatar */}
                      <td className="p-4 whitespace-nowrap flex items-center gap-3 truncate max-w-[140px]">
                        {log.imageName ? (
                          <img
                            src={`http://localhost:3001/uploads/${log.imageName}`}
                            alt="User upload"
                            className="w-12 h-12 object-cover rounded-full border-2 border-indigo-200 shadow cursor-pointer hover:scale-105 transition"
                            onClick={() => setModalImage(`http://localhost:3001/uploads/${log.imageName}`)}
                            data-tooltip-id={`img-tip-${idx}`}
                            onError={e => {
                              (e.target as HTMLImageElement).src = getAvatarUrl(log.userName || 'User');
                            }}
                          />
                        ) : (
                          <img
                            src={getAvatarUrl(log.userName || 'User')}
                            alt="Avatar"
                            className="w-12 h-12 rounded-full border-2 border-indigo-200 shadow cursor-pointer hover:scale-105 transition"
                            data-tooltip-id={`img-tip-${idx}`}
                            onError={e => {
                              (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=User';
                            }}
                          />
                        )}
                        <div className="truncate max-w-[80px]">
                          <div className="font-semibold text-slate-800 truncate">{log.userName}</div>
                          <div className="text-xs text-slate-500 truncate">{log.countryCode}</div>
                        </div>
                        <Tooltip id={`img-tip-${idx}`} place="top" content="Click to enlarge image" />
                      </td>
                      <td className="p-4 whitespace-nowrap truncate max-w-[120px]">{log.country}</td>
                      <td className="p-4 whitespace-nowrap truncate max-w-[120px]">{log.state}</td>
                      <td className="p-4 whitespace-nowrap truncate max-w-[120px]">{log.city}</td>
                      <td className="p-4 whitespace-nowrap truncate max-w-[120px]">{log.direction}</td>
                      <td className="p-4 whitespace-nowrap truncate max-w-[120px]">{log.nearestCity}</td>
                      <td className="p-4 max-w-[180px] truncate" title={log.reasoning}>{log.reasoning}</td>
                      {/* Confidence as badge and progress bar */}
                      <td className="p-4 whitespace-nowrap truncate max-w-[100px]">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${confidenceColors[log.confidence] || 'bg-gray-400'}`}>{log.confidence}</span>
                        <div className="w-24 h-2 bg-slate-200 rounded mt-1">
                          <div className={`h-2 rounded ${confidenceColors[log.confidence] || 'bg-gray-400'}`} style={{ width: `${confidencePercent}%` }}></div>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap truncate max-w-[100px]">{log.accuracyRadius || '—'}</td>
                      {/* Feedback as badge */}
                      <td className="p-4 whitespace-nowrap truncate max-w-[100px]">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${feedbackColors[log.feedback?.toLowerCase()] || 'bg-gray-400'}`}>{log.feedback || '—'}</span>
                      </td>
                      {/* Correction as tags */}
                      <td className="p-4 whitespace-nowrap truncate max-w-[120px]">
                        <div className="flex flex-col gap-1">
                          {log.correctedCountry && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-semibold truncate">Country: {log.correctedCountry}</span>}
                          {log.correctedState && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-semibold truncate">State: {log.correctedState}</span>}
                          {log.correctedCity && <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-semibold truncate">City: {log.correctedCity}</span>}
                          {!(log.correctedCountry || log.correctedState || log.correctedCity) && <span className="text-slate-400">—</span>}
                        </div>
                      </td>
                      {/* Image thumbnail (again, for quick access) */}
                      <td className="p-4 truncate max-w-[80px]">
                        {log.imageName ? (
                          <img
                            src={`http://localhost:3001/uploads/${log.imageName}`}
                            alt="User upload"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 cursor-pointer hover:scale-110 transition"
                            onClick={() => setModalImage(`http://localhost:3001/uploads/${log.imageName}`)}
                            onError={e => {
                              (e.target as HTMLImageElement).src = getAvatarUrl(log.userName || 'User');
                            }}
                          />
                        ) : '—'}
                      </td>
                      <td className="p-4 whitespace-nowrap text-xs text-slate-500 truncate max-w-[120px]">{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</td>
                      {/* Actions */}
                      <td className="p-4 whitespace-nowrap flex gap-2 items-center justify-center truncate max-w-[80px]">
                        <button className="text-slate-400 hover:text-red-600" onClick={() => handleDelete(log._id)} data-tooltip-id={`del-tip-${idx}`}><FaTrash /></button>
                        <Tooltip id={`del-tip-${idx}`} place="top" content="Delete log" />
                        {log.imageName && (
                          <button className="text-slate-400 hover:text-indigo-600" onClick={() => handleDownload(`http://localhost:3001/uploads/${log.imageName}`)} data-tooltip-id={`dl-tip-${idx}`}><FaDownload /></button>
                        )}
                        <Tooltip id={`dl-tip-${idx}`} place="top" content="Download image" />
                        <button className="text-slate-400 hover:text-slate-700"><FaEllipsisV /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal for expanded image */}
      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={() => setModalImage(null)}>
          <img
            src={modalImage}
            alt="Expanded user upload"
            className="max-w-3xl max-h-[80vh] rounded-lg shadow-2xl border-4 border-indigo-500"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute top-8 right-8 text-white text-3xl font-bold bg-indigo-700 rounded-full px-4 py-2 shadow-lg hover:bg-indigo-600"
            onClick={() => setModalImage(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminLogViewer; 