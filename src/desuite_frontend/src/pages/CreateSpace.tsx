import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { desuite_backend } from '../../../declarations/desuite_backend';
import { X, Loader2, AlertCircle, Lock, Globe } from 'lucide-react';

interface FormErrors {
  name?: string;
  description?: string;
  categories?: string;
}

export const CreateSpace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
    categories: [] as string[],
  });

  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Validation rules
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = 'Space name is required';
      isValid = false;
    } else if (formData.name.length < 3) {
      errors.name = 'Space name must be at least 3 characters';
      isValid = false;
    } else if (formData.name.length > 50) {
      errors.name = 'Space name must be less than 50 characters';
      isValid = false;
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
      isValid = false;
    } else if (formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
      isValid = false;
    } else if (formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
      isValid = false;
    }

    if (formData.categories.length === 0) {
      errors.categories = 'At least one category is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && formData.categories.length < 5) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()]
      }));
      setNewCategory('');
      // Clear categories error if it exists
      if (formErrors.categories) {
        setFormErrors(prev => ({ ...prev, categories: undefined }));
      }
    }
  };

  const removeCategory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await desuite_backend.createSpace(
        formData.name,
        formData.description,
        formData.isPublic
      );

      if ('ok' in result) {
        navigate(`/spaces/${result.ok.id}`);
      } else {
        setError(result.err);
      }
    } catch (err) {
      setError('Failed to create space. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
          Create a New Space
        </h1>
        <p className="text-gray-400 mb-8">Create a community and start building together</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Space Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              maxLength={50}
              className={`w-full px-4 py-3 rounded-lg bg-black/50 border ${
                formErrors.name && isSubmitted
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-purple-500/30 focus:border-purple-500'
              } text-white placeholder-gray-500 focus:outline-none focus:ring-1 ${
                formErrors.name && isSubmitted ? 'focus:ring-red-500' : 'focus:ring-purple-500'
              }`}
              placeholder="Enter space name"
            />
            {formErrors.name && isSubmitted && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {formErrors.name}
              </p>
            )}
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              maxLength={500}
              className={`w-full px-4 py-3 rounded-lg bg-black/50 border ${
                formErrors.description && isSubmitted
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-purple-500/30 focus:border-purple-500'
              } text-white placeholder-gray-500 focus:outline-none focus:ring-1 ${
                formErrors.description && isSubmitted ? 'focus:ring-red-500' : 'focus:ring-purple-500'
              }`}
              placeholder="Describe your space"
            />
            <div className="mt-1 flex justify-between">
              <div>
                {formErrors.description && isSubmitted && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {formErrors.description}
                  </p>
                )}
              </div>
              <div className="text-sm text-gray-400">
                {formData.description.length}/500
              </div>
            </div>
          </div>

          {/* Categories Input */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Categories (up to 5)
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.categories.map((category, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/20 text-purple-400"
                >
                  {category}
                  <button
                    type="button"
                    onClick={() => removeCategory(index)}
                    className="ml-2 hover:text-pink-400"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg bg-black/50 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="Add a category"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
              />
              <button
                type="button"
                onClick={addCategory}
                disabled={formData.categories.length >= 5 || !newCategory.trim()}
                className="px-4 py-2 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            {formErrors.categories && isSubmitted && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {formErrors.categories}
              </p>
            )}
          </div>

          {/* Visibility Selection */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Visibility
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={formData.isPublic}
                  onChange={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                  className="sr-only"
                />
                <div className={`px-4 py-2 rounded-lg border flex items-center ${
                  formData.isPublic
                    ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                    : 'border-purple-500/30 text-gray-400'
                } transition-all duration-200`}>
                  <Globe size={18} className="mr-2" />
                  Public
                </div>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={!formData.isPublic}
                  onChange={() => setFormData(prev => ({ ...prev, isPublic: false }))}
                  className="sr-only"
                />
                <div className={`px-4 py-2 rounded-lg border flex items-center ${
                  !formData.isPublic
                    ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                    : 'border-purple-500/30 text-gray-400'
                } transition-all duration-200`}>
                  <Lock size={18} className="mr-2" />
                  Private
                </div>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-500 text-sm text-center flex items-center justify-center">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 transition-all duration-300 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Creating Space...
              </>
            ) : (
              'Create Space'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};