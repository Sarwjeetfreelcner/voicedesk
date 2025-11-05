import React, { useState, useEffect } from 'react';
import { promptsAPI } from '../services/api';
import { FiMessageSquare, FiPlus, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';

function Prompts() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [formData, setFormData] = useState({ prompt_name: '', prompt_text: '' });

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await promptsAPI.getAll();
      setPrompts(response.data.prompts);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPrompt(null);
    setFormData({ prompt_name: '', prompt_text: '' });
    setShowModal(true);
  };

  const handleEdit = (prompt) => {
    setEditingPrompt(prompt);
    setFormData({ prompt_name: prompt.prompt_name, prompt_text: prompt.prompt_text });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingPrompt) {
        await promptsAPI.update(editingPrompt.id, formData);
      } else {
        await promptsAPI.create(formData);
      }
      setShowModal(false);
      fetchPrompts();
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Failed to save prompt');
    }
  };

  const handleActivate = async (id) => {
    try {
      await promptsAPI.update(id, { is_active: true });
      fetchPrompts();
    } catch (error) {
      console.error('Error activating prompt:', error);
      alert('Failed to activate prompt');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prompt?')) {
      return;
    }

    try {
      await promptsAPI.delete(id);
      fetchPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      alert(error.response?.data?.error || 'Failed to delete prompt');
    }
  };

  if (loading) {
    return <div className="loading">Loading prompts...</div>;
  }

  return (
    <div className="prompts">
      <div className="page-header">
        <h1><FiMessageSquare /> System Prompts</h1>
        <button onClick={handleCreate} className="btn-secondary">
          <FiPlus /> New Prompt
        </button>
      </div>

      <div className="items-grid">
        {prompts.map((prompt) => (
          <div key={prompt.id} className={`item-card ${prompt.is_active ? 'active' : ''}`}>
            {prompt.is_active && <span className="active-badge">Active</span>}
            
            <h3>{prompt.prompt_name}</h3>
            <p>{prompt.prompt_text}</p>
            
            <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.5rem' }}>
              Updated {new Date(prompt.updated_at).toLocaleDateString()}
              {prompt.updated_by_username && ` by ${prompt.updated_by_username}`}
            </div>

            <div className="item-actions">
              <button onClick={() => handleEdit(prompt)} className="btn-small btn-edit">
                <FiEdit2 /> Edit
              </button>
              {!prompt.is_active && (
                <>
                  <button onClick={() => handleActivate(prompt.id)} className="btn-small btn-activate">
                    <FiCheck /> Activate
                  </button>
                  <button onClick={() => handleDelete(prompt.id)} className="btn-small btn-delete">
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
            <h2>{editingPrompt ? 'Edit Prompt' : 'New Prompt'}</h2>
            
            <div className="form-group">
              <label>Prompt Name</label>
              <input
                type="text"
                value={formData.prompt_name}
                onChange={(e) => setFormData({ ...formData, prompt_name: e.target.value })}
                placeholder="e.g., Customer Support Prompt"
              />
            </div>

            <div className="form-group">
              <label>Prompt Text</label>
              <textarea
                value={formData.prompt_text}
                onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                placeholder="Enter the system prompt that will be used by the AI assistant..."
                rows={10}
              />
            </div>

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

export default Prompts;

