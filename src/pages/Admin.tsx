import { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';

const WORKER_URL = import.meta.env.VITE_PUBLIC_WORKER_URL || 'http://localhost:8787';
const ANALYTICS_URL = 'https://dash.cloudflare.com/?to=/:account/web-analytics';

interface AiRequest {
  issueNumber: number;
  issueUrl: string;
  issueState: string;
  description: string;
  createdAt: string;
  prNumber: number | null;
  prUrl: string | null;
  previewUrl: string | null;
  status: 'pending' | 'building' | 'preview_ready' | 'applied' | 'replaced' | 'discarded';
}

function Admin() {
  const [activePanel, setActivePanel] = useState<'ai' | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [requests, setRequests] = useState<AiRequest[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AiRequest | null>(null);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [reviseFeedback, setReviseFeedback] = useState('');

  const loadRequests = useCallback(async () => {
    setLoadingList(true);
    try {
      const response = await fetch(`${WORKER_URL}/api/ai-mod/list`);
      const result = await response.json();
      if (result.success) {
        setRequests(result.data);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (activePanel === 'ai') {
      loadRequests();
    }
  }, [activePanel, loadRequests]);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    
    setSubmitting(true);
    setSubmitResult(null);
    
    try {
      const response = await fetch(`${WORKER_URL}/api/ai-mod/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      const result = await response.json();
      
      if (result.success) {
        setSubmitResult({ success: true, message: `Created issue #${result.data.issueNumber}` });
        setDescription('');
        loadRequests();
      } else {
        setSubmitResult({ success: false, message: result.error || 'Failed to submit' });
      }
    } catch (err) {
      setSubmitResult({ success: false, message: `Network error: ${err}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest?.prNumber) return;
    setActionResult(null);
    
    try {
      const response = await fetch(`${WORKER_URL}/api/ai-mod/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prNumber: selectedRequest.prNumber }),
      });
      const result = await response.json();
      
      if (result.success) {
        setActionResult({ success: true, message: 'Changes merged!' });
        loadRequests();
        setSelectedRequest(null);
      } else {
        setActionResult({ success: false, message: result.error || 'Failed to merge' });
      }
    } catch (err) {
      setActionResult({ success: false, message: `Network error: ${err}` });
    }
  };

  const handleReject = async () => {
    if (!selectedRequest?.prNumber) return;
    setActionResult(null);
    
    try {
      const response = await fetch(`${WORKER_URL}/api/ai-mod/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prNumber: selectedRequest.prNumber }),
      });
      const result = await response.json();
      
      if (result.success) {
        setActionResult({ success: true, message: 'PR closed' });
        loadRequests();
        setSelectedRequest(null);
      } else {
        setActionResult({ success: false, message: result.error || 'Failed to reject' });
      }
    } catch (err) {
      setActionResult({ success: false, message: `Network error: ${err}` });
    }
  };

  const handleRevise = async () => {
    if (!selectedRequest || !reviseFeedback.trim()) return;
    setActionResult(null);
    
    try {
      const response = await fetch(`${WORKER_URL}/api/ai-mod/revise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueNumber: selectedRequest.issueNumber,
          prNumber: selectedRequest.prNumber,
          originalDescription: selectedRequest.description,
          feedback: reviseFeedback,
        }),
      });
      const result = await response.json();
      
      if (result.success) {
        setActionResult({ success: true, message: `Created revision issue #${result.data.issueNumber}` });
        setReviseFeedback('');
        loadRequests();
        setSelectedRequest(null);
      } else {
        setActionResult({ success: false, message: result.error || 'Failed to revise' });
      }
    } catch (err) {
      setActionResult({ success: false, message: `Network error: ${err}` });
    }
  };

  const handleRevert = async () => {
    if (!selectedRequest?.prNumber) return;
    setActionResult(null);
    
    try {
      const response = await fetch(`${WORKER_URL}/api/ai-mod/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prNumber: selectedRequest.prNumber,
          description: selectedRequest.description,
        }),
      });
      const result = await response.json();
      
      if (result.success) {
        setActionResult({ success: true, message: `Created revert issue #${result.data.issueNumber}` });
        loadRequests();
        setSelectedRequest(null);
      } else {
        setActionResult({ success: false, message: result.error || 'Failed to revert' });
      }
    } catch (err) {
      setActionResult({ success: false, message: `Network error: ${err}` });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'building': return '🔨';
      case 'preview_ready': return '👁️';
      case 'applied': return '✅';
      case 'replaced': return '🔄';
      case 'discarded': return '❌';
      default: return '❓';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Waiting for Copilot';
      case 'building': return 'Building preview...';
      case 'preview_ready': return 'Ready to review';
      case 'applied': return 'Applied';
      case 'replaced': return 'Replaced';
      case 'discarded': return 'Discarded';
      default: return status;
    }
  };

  return (
    <main className="min-h-screen px-6 sm:px-12 max-w-3xl mx-auto py-10 sm:py-12">
      <Header />

      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Admin Panel
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Site management tools
      </p>

      <div className="flex flex-col gap-3 max-w-xs">
        <button
          onClick={() => setActivePanel(activePanel === 'ai' ? null : 'ai')}
          className="px-4 py-3 text-left rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
        >
          🤖 Modify Site with AI
        </button>

        <a
          href={ANALYTICS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-3 text-center rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
        >
          📊 View Analytics
        </a>
      </div>

      {activePanel === 'ai' && (
        <div className="mt-8 p-6 bg-purple-50 dark:bg-purple-950/30 rounded-lg max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            🤖 Modify Site with AI
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Describe what you want to change. Copilot will create a PR with the changes for you to review.
          </p>

          <details open className="mb-6">
            <summary className="cursor-pointer font-medium text-gray-900 dark:text-gray-100 py-2">
              ➕ New Request
            </summary>
            <div className="pt-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Add a dark mode toggle to the header..."
                rows={3}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-y"
              />
              <button
                onClick={handleSubmit}
                disabled={submitting || !description.trim()}
                className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {submitting ? 'Submitting...' : '🚀 Submit Request'}
              </button>
              {submitResult && (
                <span className={`ml-3 text-sm ${submitResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {submitResult.message}
                </span>
              )}
            </div>
          </details>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                📋 Previous Requests
              </h3>
              <button
                onClick={loadRequests}
                className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded"
              >
                ↻ Refresh
              </button>
            </div>

            {loadingList ? (
              <p className="text-gray-500">Loading...</p>
            ) : requests.length === 0 ? (
              <p className="text-gray-500">No requests yet. Submit one above!</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {requests.map((req) => (
                  <div
                    key={req.issueNumber}
                    onClick={() => {
                      setSelectedRequest(req);
                      setActionResult(null);
                      setReviseFeedback('');
                    }}
                    className={`p-3 bg-white dark:bg-gray-900 rounded-lg cursor-pointer border-l-4 hover:shadow-sm transition-shadow ${
                      req.status === 'applied' ? 'border-green-500' :
                      req.status === 'preview_ready' ? 'border-purple-500' :
                      req.status === 'pending' ? 'border-amber-500' :
                      req.status === 'building' ? 'border-blue-500' :
                      'border-gray-300'
                    } ${req.issueState === 'closed' ? 'opacity-60' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-gray-900 dark:text-gray-100">
                          {getStatusIcon(req.status)} {req.description}
                        </strong>
                        <div className="text-xs text-gray-500 mt-1">
                          #{req.issueNumber} • {getStatusLabel(req.status)}
                        </div>
                      </div>
                      {req.previewUrl && (
                        <span className="text-xs text-purple-600">Preview ✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedRequest && (
            <div className="mt-6 p-4 bg-white dark:bg-gray-900 rounded-lg border-2 border-purple-500">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedRequest.description}
                </h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {getStatusIcon(selectedRequest.status)} {getStatusLabel(selectedRequest.status)}
              </p>

              {selectedRequest.previewUrl && selectedRequest.status === 'preview_ready' && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Preview:</h4>
                  <div className="border-2 border-purple-300 rounded overflow-hidden">
                    <div className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-2 py-1">
                      ⚠️ Preview of proposed changes
                    </div>
                    <iframe
                      src={selectedRequest.previewUrl}
                      className="w-full h-64 border-none"
                      title="Preview"
                    />
                  </div>
                  <a
                    href={selectedRequest.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 hover:underline mt-1 inline-block"
                  >
                    Open preview in new tab →
                  </a>
                </div>
              )}

              {(selectedRequest.status === 'preview_ready' || selectedRequest.status === 'building') && (
                <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950/50 rounded">
                  <h4 className="text-sm font-medium mb-2">✏️ Request Changes</h4>
                  <textarea
                    value={reviseFeedback}
                    onChange={(e) => setReviseFeedback(e.target.value)}
                    placeholder="e.g., Make the button bigger..."
                    rows={2}
                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                  <button
                    onClick={handleRevise}
                    disabled={!reviseFeedback.trim()}
                    className="mt-2 px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded"
                  >
                    Request Changes
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {selectedRequest.issueUrl && (
                  <a
                    href={selectedRequest.issueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    View Issue
                  </a>
                )}
                {selectedRequest.prUrl && (
                  <a
                    href={selectedRequest.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    View PR
                  </a>
                )}
                {(selectedRequest.status === 'preview_ready' || selectedRequest.status === 'building') && selectedRequest.prNumber && (
                  <>
                    <button
                      onClick={handleApprove}
                      className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded"
                    >
                      ✅ Approve & Merge
                    </button>
                    <button
                      onClick={handleReject}
                      className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
                    >
                      ❌ Reject
                    </button>
                  </>
                )}
                {selectedRequest.status === 'applied' && selectedRequest.prNumber && (
                  <button
                    onClick={handleRevert}
                    className="px-3 py-1 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded"
                  >
                    ↩️ Revert
                  </button>
                )}
              </div>

              {actionResult && (
                <p className={`mt-3 text-sm ${actionResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {actionResult.message}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default Admin;
