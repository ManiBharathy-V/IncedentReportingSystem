import React, { useState, useEffect } from 'react';
import { Plus, Download, Edit, Trash } from 'lucide-react';

// Define interfaces for better type safety
interface Incident {
  id: number;
  reportedBy: string;
  assignedTo: string;
  dateTime: string;
  description: string;
  attachment: string | null;
  status: 'Open' | 'In Progress' | 'Closed';
  closedOn: string | null;
  totalTime: string | null;
  createdAt: string;
}

interface Notification {
  message: string;
  type: 'success' | 'error';
}

// API URL - change this to your backend URL
const API_URL = '/api/incidents';

const api = {
  async getIncidents(): Promise<Incident[]> {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch incidents');
    return response.json();
  },

  async createIncident(formData: FormData): Promise<Incident> {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to create incident');
    return response.json();
  },

  async updateIncident(id: number, data: Partial<Incident>): Promise<Incident> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update incident');
    return response.json();
  },

  async deleteIncident(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete incident');
  },

  async exportCSV(): Promise<Blob> {
    const response = await fetch(`${API_URL}/export`);
    if (!response.ok) throw new Error('Failed to export CSV');
    return response.blob();
  },
};

const IncidentReportingSystem: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);

  const [formData, setFormData] = useState({
    reportedBy: '',
    assignedTo: '',
    dateTime: '',
    description: '',
    attachment: null as File | null,
  });

  const [editData, setEditData] = useState({
    status: 'Open' as 'Open' | 'In Progress' | 'Closed',
    closedOn: '',
  });

  useEffect(() => {
    loadIncidents();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const data = await api.getIncidents();
      setIncidents(data);
    } catch (error) {
      showNotification('Failed to load incidents', 'error');
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitFormData = new FormData();
      submitFormData.append('reportedBy', formData.reportedBy);
      submitFormData.append('assignedTo', formData.assignedTo);
      submitFormData.append('dateTime', new Date(formData.dateTime).toISOString());
      submitFormData.append('description', formData.description);
      
      if (formData.attachment) {
        submitFormData.append('attachment', formData.attachment);
      }

      await api.createIncident(submitFormData);
      showNotification('Incident reported successfully');
      setFormData({
        reportedBy: '',
        assignedTo: '',
        dateTime: '',
        description: '',
        attachment: null,
      });
      setShowModal(false);
      loadIncidents();
    } catch (error) {
      showNotification('Failed to create incident', 'error');
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: Incident) => {
    setEditingIncident(record);
    setEditData({
      status: record.status,
      closedOn: record.closedOn ? record.closedOn.slice(0, 16) : '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!editingIncident) throw new Error('No incident selected for editing');

      const updateData: Partial<Incident> = {
        status: editData.status,
        closedOn: editData.status === 'Closed' && editData.closedOn 
          ? new Date(editData.closedOn).toISOString() 
          : null,
      };

      await api.updateIncident(editingIncident.id, updateData);
      showNotification('Incident updated successfully');
      setShowEditModal(false);
      loadIncidents();
    } catch (error) {
      showNotification('Failed to update incident', 'error');
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this incident?')) {
      setLoading(true);
      try {
        await api.deleteIncident(id);
        showNotification('Incident deleted successfully');
        loadIncidents();
      } catch (error) {
        showNotification('Failed to delete incident', 'error');
        console.error('Delete error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const downloadCSV = async () => {
    try {
      const blob = await api.exportCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incidents_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showNotification('CSV downloaded successfully');
    } catch (error) {
      showNotification('Failed to download CSV', 'error');
      console.error('Download error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />

      {notification && (
        <div
          className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white animate-pulse`}
        >
          {notification.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Incident Reporting System</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Report Incident
            </button>
            <button
              onClick={downloadCSV}
              disabled={incidents.length === 0}
              className={`inline-flex items-center px-4 py-2 font-medium rounded-lg shadow-sm transition-colors ${
                incidents.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <Download className="w-5 h-5 mr-2" />
              Download CSV
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closed On</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : incidents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      <p className="mt-2">No incidents reported yet</p>
                    </td>
                  </tr>
                ) : (
                  incidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{incident.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{incident.reportedBy}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{incident.assignedTo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(incident.dateTime).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{incident.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          incident.status === 'Open' ? 'bg-red-100 text-red-800' :
                          incident.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {incident.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {incident.closedOn ? new Date(incident.closedOn).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{incident.totalTime || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(incident)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit incident"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(incident.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete incident"
                          >
                            <Trash className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Report New Incident</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reported By <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.reportedBy}
                    onChange={(e) => setFormData({...formData, reportedBy: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned To <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter assignee name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dateTime}
                    onChange={(e) => setFormData({...formData, dateTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Describe what happened..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFormData({ ...formData, attachment: e.target.files[0] });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {formData.attachment && (
                    <p className="mt-1 text-sm text-gray-500">Selected: {formData.attachment.name}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({
                    reportedBy: '',
                    assignedTo: '',
                    dateTime: '',
                    description: '',
                    attachment: null
                  });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.reportedBy || !formData.assignedTo || !formData.dateTime || !formData.description}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  loading || !formData.reportedBy || !formData.assignedTo || !formData.dateTime || !formData.description
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingIncident && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Edit Incident Status</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editData.status}
                    onChange={(e) => {
                      const value = e.target.value as 'Open' | 'In Progress' | 'Closed';
                      setEditData({ ...editData, status: value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {editData.status === 'Closed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Closed On <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={editData.closedOn}
                      onChange={(e) => setEditData({...editData, closedOn: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditData({ status: 'Open', closedOn: '' });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={loading || (editData.status === 'Closed' && !editData.closedOn)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  loading || (editData.status === 'Closed' && !editData.closedOn)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentReportingSystem;