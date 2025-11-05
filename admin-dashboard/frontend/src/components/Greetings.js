import React, { useState, useEffect } from 'react';
import { greetingsAPI } from '../services/api';
import { FiMic, FiPlus, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';

function Greetings() {
  const [greetings, setGreetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGreeting, setEditingGreeting] = useState(null);
  const [formData, setFormData] = useState({ message_text: '' });

  useEffect(() => {
    fetchGreetings();
  }, []);

  const fetchGreetings = async () => {
    try {
      const response = await greetingsAPI.getAll();
      setGreetings(response.data.greetings);
    } catch (error) {
      console.error('Error fetching greetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingGreeting(null);
    setFormData({ message_text: '' });
    setShowModal(true);
  };

  const handleEdit = (greeting) => {
    setEditingGreeting(greeting);
    setFormData({ message_text: greeting.message_text });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingGreeting) {
        await greetingsAPI.update(editingGreeting.id, formData);
      } else {
        await greetingsAPI.create(formData);
      }
      setShowModal(false);
      fetchGreetings();
    } catch (error) {
      console.error('Error saving greeting:', error);
      alert('Failed to save greeting');
    }
  };

  const handleActivate = async (id) => {
    try {
      await greetingsAPI.update(id, { is_active: true });
      fetchGreetings();
    } catch (error) {
      console.error('Error activating greeting:', error);
      alert('Failed to activate greeting');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this greeting?')) {
      return;
    }

    try {
      await greetingsAPI.delete(id);
      fetchGreetings();
    } catch (error) {
      console.error('Error deleting greeting:', error);
      alert(error.response?.data?.error || 'Failed to delete greeting');
    }
  };

  if (loading) {
    return <div className="loading">Loading greetings...</div>;
  }

  return (
    <div className="greetings">
      <div className="page-header">
        <h1><FiMic /> Greeting Messages</h1>
        <button onClick={handleCreate} className="btn-secondary">
          <FiPlus /> New Greeting
        </button>
      </div>

      <div className="items-grid">
        {greetings.map((greeting) => (
          <div key={greeting.id} className={`item-card ${greeting.is_active ? 'active' : ''}`}>
            {greeting.is_active && <span className="active-badge">Active</span>}
            
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{greeting.message_text}</p>
            
            <div style={{ fontSize: '0.85rem', color: '#888' }}>
              Updated {new Date(greeting.updated_at).toLocaleDateString()}
              {greeting.updated_by_username && ` by ${greeting.updated_by_username}`}
            </div>

            <div className="item-actions">
              <button onClick={() => handleEdit(greeting)} className="btn-small btn-edit">
                <FiEdit2 /> Edit
              </button>
              {!greeting.is_active && (
                <>
                  <button onClick={() => handleActivate(greeting.id)} className="btn-small btn-activate">
                    <FiCheck /> Activate
                  </button>
                  <button onClick={() => handleDelete(greeting.id)} className="btn-small btn-delete">
                    <FiTrash2 /> Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingGreeting ? 'Edit Greeting' : 'New Greeting'}</h2>
            
            <div className="form-group">
              <label>Greeting Message</label>
              <textarea
                value={formData.message_text}
                onChange={(e) => setFormData({ ...formData, message_text: e.target.value })}
                placeholder="Enter the greeting message that will be spoken to callers..."
                rows={6}
                style={{ minHeight: '100px' }}
              />
            </div>

            <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>
              This message will be spoken when a call starts.
            </p>

            <div className="modal-actions">
              <button onClick={() => setShowModal(false)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleSave} className="btn-save">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Greetings;

