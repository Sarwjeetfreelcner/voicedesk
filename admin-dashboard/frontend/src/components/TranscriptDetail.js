import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { transcriptsAPI } from '../services/api';
import { FiArrowLeft, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';

function TranscriptDetail() {
  const { callId } = useParams();
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTranscript();
  }, [callId]);

  const fetchTranscript = async () => {
    try {
      const response = await transcriptsAPI.getOne(callId);
      setTranscript(response.data.transcript);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching transcript:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this transcript?')) {
      return;
    }

    try {
      await transcriptsAPI.delete(callId);
      navigate('/transcripts');
    } catch (error) {
      console.error('Error deleting transcript:', error);
      alert('Failed to delete transcript');
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

  if (loading) {
    return <div className="loading">Loading transcript...</div>;
  }

  if (!transcript) {
    return (
      <div className="empty-state">
        <p>Transcript not found</p>
        <button onClick={() => navigate('/transcripts')} className="btn-secondary">
          Back to Transcripts
        </button>
      </div>
    );
  }

  return (
    <div className="transcript-detail">
      <div className="page-header">
        <button onClick={() => navigate('/transcripts')} className="btn-secondary">
          <FiArrowLeft /> Back
        </button>
        <button onClick={handleDelete} className="btn-delete" style={{ background: '#f44336' }}>
          <FiTrash2 /> Delete
        </button>
      </div>

      <div className="detail-card">
        <div className="detail-header">
          <h1>Call Transcript</h1>
        </div>

        <div className="detail-info">
          <div className="info-item">
            <label>Call ID</label>
            <p>{transcript.call_id}</p>
          </div>
          <div className="info-item">
            <label>Caller Number</label>
            <p>{transcript.caller_number || 'Unknown'}</p>
          </div>
          <div className="info-item">
            <label>Channel ID</label>
            <p>{transcript.channel_id || 'N/A'}</p>
          </div>
          <div className="info-item">
            <label>Start Time</label>
            <p>{formatDate(transcript.start_time)}</p>
          </div>
          <div className="info-item">
            <label>End Time</label>
            <p>{transcript.end_time ? formatDate(transcript.end_time) : 'In Progress'}</p>
          </div>
          <div className="info-item">
            <label>Duration</label>
            <p>{formatDuration(transcript.duration_seconds)}</p>
          </div>
          <div className="info-item">
            <label>Status</label>
            <p style={{ textTransform: 'capitalize' }}>{transcript.status}</p>
          </div>
          <div className="info-item">
            <label>Messages</label>
            <p>{messages.length}</p>
          </div>
        </div>

        <div className="messages-list">
          <h2>Conversation</h2>
          {messages.length === 0 ? (
            <p style={{ color: '#888', marginTop: '1rem' }}>No messages in this conversation</p>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`message message-${message.role}`}
              >
                <div className="message-role">
                  {message.role === 'user' ? '👤 User' : 
                   message.role === 'assistant' ? '🤖 Assistant' : 
                   '⚙️ System'}
                </div>
                <div className="message-content">
                  {message.content}
                </div>
                {message.timestamp && (
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
                    {formatDate(message.timestamp)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default TranscriptDetail;

