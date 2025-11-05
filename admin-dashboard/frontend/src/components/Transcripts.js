import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transcriptsAPI } from '../services/api';
import { FiFileText, FiRefreshCw } from 'react-icons/fi';
import { format } from 'date-fns';

function Transcripts() {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTranscripts();
  }, [pagination.page]);

  const fetchTranscripts = async () => {
    setLoading(true);
    try {
      const response = await transcriptsAPI.getAll(pagination.page, pagination.limit);
      setTranscripts(response.data.transcripts);
      setPagination({ ...pagination, ...response.data.pagination });
    } catch (error) {
      console.error('Error fetching transcripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return dateString;
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading && transcripts.length === 0) {
    return <div className="loading">Loading transcripts...</div>;
  }

  return (
    <div className="transcripts">
      <div className="page-header">
        <h1><FiFileText /> Call Transcripts</h1>
        <button onClick={fetchTranscripts} className="btn-secondary">
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {transcripts.length === 0 ? (
        <div className="empty-state">
          <FiFileText />
          <p>No transcripts available yet</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Transcripts will appear here after calls are completed
          </p>
        </div>
      ) : (
        <>
          <div className="transcripts-list">
            {transcripts.map((transcript) => (
              <div
                key={transcript.id}
                className="transcript-item"
                onClick={() => navigate(`/transcripts/${transcript.call_id}`)}
              >
                <div className="transcript-header">
                  <span className="transcript-id">
                    Call ID: {transcript.call_id}
                  </span>
                  <span className="transcript-time">
                    {formatDate(transcript.start_time)}
                  </span>
                </div>
                <div className="transcript-details">
                  <span>📞 {transcript.caller_number || 'Unknown'}</span>
                  <span>⏱️ {formatDuration(transcript.duration_seconds)}</span>
                  <span>💬 {transcript.message_count} messages</span>
                  <span className={`status-${transcript.status}`}>
                    Status: {transcript.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
              >
                Previous
              </button>
              
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPagination({ ...pagination, page: i + 1 })}
                  className={pagination.page === i + 1 ? 'active' : ''}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Transcripts;

