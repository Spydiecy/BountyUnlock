import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { desuite_backend } from '../../../declarations/desuite_backend';
import { Loader2, AlertCircle, X, Plus } from 'lucide-react';
import { TaskType, TaskVisibility } from '../../../declarations/desuite_backend/desuite_backend.did';

interface TaskForm {
  title: string;
  description: string;
  points: number;
  taskType: 'once' | 'daily' | 'weekly' | 'monthly';
  requirements: string[];
  visibility: 'everyone' | 'members' | 'selected';
}

// Helper function to create TaskType variant
const createTaskType = (type: string): TaskType => {
  const taskTypes: Record<string, TaskType> = {
    'once': { 'once': null },
    'daily': { 'daily': null },
    'weekly': { 'weekly': null },
    'monthly': { 'monthly': null }
  };
  return taskTypes[type];
};

// Helper function to create TaskVisibility variant
const createVisibility = (visibility: string): TaskVisibility => {
  const visibilityTypes: Record<string, TaskVisibility> = {
    'everyone': { 'everyone': null },
    'members': { 'members': null },
    'selected': { 'selected': null }
  };
  return visibilityTypes[visibility];
};

export const CreateTask = () => {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState<TaskForm>({
    title: '',
    description: '',
    points: 0,
    taskType: 'once',
    requirements: [],
    visibility: 'everyone'
  });

  const [newRequirement, setNewRequirement] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (formData.title.trim().length < 3) {
      setError('Title must be at least 3 characters long');
      return;
    }

    if (formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters long');
      return;
    }

    if (formData.points <= 0) {
      setError('Points must be greater than 0');
      return;
    }

    setIsLoading(true);

    try {
      if (!spaceId) throw new Error('Space ID is required');

      const result = await desuite_backend.createTask(
        spaceId,
        formData.title,
        formData.description,
        BigInt(formData.points),
        createTaskType(formData.taskType),
        createVisibility(formData.visibility)
      );

      if ('ok' in result) {
        navigate(`/spaces/${spaceId}`);
      } else {
        setError(result.err);
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addRequirement = () => {
    if (newRequirement.trim() && formData.requirements.length < 5) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 mb-2">
          Create New Task
        </h1>
        <p className="text-gray-400 mb-8">Create a task for your space members</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Title */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Task Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-black/50 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="Enter task title"
              required
              minLength={3}
            />
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-black/50 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="Describe what users need to do to complete this task"
              required
              minLength={10}
            />
          </div>

          {/* Points and Task Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Points
              </label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: Math.max(0, parseInt(e.target.value) || 0) }))}
                min="1"
                className="w-full px-4 py-3 rounded-lg bg-black/50 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Task Type
              </label>
              <select
                value={formData.taskType}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  taskType: e.target.value as TaskForm['taskType']
                }))}
                className="w-full px-4 py-3 rounded-lg bg-black/50 border border-purple-500/30 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                <option value="once">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Visibility
            </label>
            <select
              value={formData.visibility}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                visibility: e.target.value as TaskForm['visibility']
              }))}
              className="w-full px-4 py-3 rounded-lg bg-black/50 border border-purple-500/30 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            >
              <option value="everyone">Everyone</option>
              <option value="members">Space Members Only</option>
              <option value="selected">Selected Members</option>
            </select>
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Requirements (Optional)
            </label>
            <div className="space-y-2 mb-3">
              {formData.requirements.map((req, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/30"
                >
                  <span className="text-gray-300">{req}</span>
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="text-gray-400 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg bg-black/50 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="Add a requirement"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
              />
              <button
                type="button"
                onClick={addRequirement}
                disabled={formData.requirements.length >= 5}
                className="px-4 py-2 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
              >
                <Plus size={18} className="mr-1" />
                Add
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-2">
              Add up to 5 specific requirements that users must meet to complete this task.
            </p>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center justify-center">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/spaces/${spaceId}`)}
              className="flex-1 py-3 px-4 rounded-lg border border-purple-500/30 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 transition-all duration-300 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Creating Task...
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};