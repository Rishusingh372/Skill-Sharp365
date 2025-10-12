import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { courseService } from '../services/courseService';
import { uploadService } from '../services/uploadService';

const CreateCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    price: '',
    thumbnail: '',
    category: '',
    level: 'beginner',
    requirements: [''],
    learningOutcomes: [''],
    tags: [],
    totalHours: '',
    language: 'English'
  });

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }));
  };

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field, index) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setThumbnailFile(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setThumbnailPreview(previewUrl);

    // Auto-upload the image
    handleThumbnailUpload(file);
  };

  const handleThumbnailUpload = async (file) => {
    try {
      setUploading(true);
      const response = await uploadService.uploadCourseThumbnail(file);
      setFormData(prev => ({
        ...prev,
        thumbnail: response.imageUrl
      }));
      toast.success('Thumbnail uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload thumbnail. Please try again.');
      // Reset thumbnail state on error
      setThumbnailFile(null);
      setThumbnailPreview('');
    } finally {
      setUploading(false);
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
    setFormData(prev => ({
      ...prev,
      thumbnail: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Basic validation
      if (!formData.title || !formData.description || !formData.price || !formData.category) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (formData.price < 0) {
        toast.error('Price cannot be negative');
        setLoading(false);
        return;
      }

      // Filter out empty array values
      const submitData = {
        ...formData,
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        learningOutcomes: formData.learningOutcomes.filter(outcome => outcome.trim() !== ''),
        price: parseFloat(formData.price),
        totalHours: parseInt(formData.totalHours) || 0,
        tags: Array.isArray(formData.tags) ? formData.tags : formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const response = await courseService.createCourse(submitData);
      
      toast.success('Course created successfully!');
      navigate('/instructor/dashboard');
    } catch (error) {
      console.error('Create course error:', error);
      toast.error(error.response?.data?.message || 'Failed to create course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Default thumbnail placeholder
  const defaultThumbnail = 'https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?w=400&h=225&fit=crop';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
          <p className="text-gray-600 mt-2">
            Share your knowledge with students around the world
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Information</h2>
            
            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Title <span className="text-error-600">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="input"
                placeholder="e.g., Complete Web Development Bootcamp"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-error-600">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="input"
                placeholder="Describe what students will learn in this course..."
              />
            </div>

            {/* Short Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description
              </label>
              <textarea
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                rows={2}
                className="input"
                placeholder="Brief description for course cards (max 200 characters)"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.shortDescription.length}/200 characters
              </p>
            </div>

            {/* Thumbnail Upload - Optional */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Thumbnail <span className="text-gray-500">(Optional)</span>
              </label>
              <div className="space-y-4">
                {/* Thumbnail Preview */}
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                    <img
                      src={thumbnailPreview || formData.thumbnail || defaultThumbnail}
                      alt="Course thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">
                      {thumbnailPreview || formData.thumbnail 
                        ? 'Thumbnail selected' 
                        : 'No thumbnail selected. A default image will be used.'}
                    </p>
                    <div className="flex items-center space-x-3">
                      {/* File Input */}
                      <div>
                        <input
                          type="file"
                          accept="image/*"  // Accept all image types
                          onChange={handleThumbnailChange}
                          className="hidden"
                          id="thumbnail-upload"
                        />
                        <label
                          htmlFor="thumbnail-upload"
                          className="btn-secondary cursor-pointer inline-flex items-center space-x-2"
                          disabled={uploading}
                        >
                          {uploading ? (
                            <>
                              <div className="w-4 h-4 border-t-2 border-gray-600 border-solid rounded-full animate-spin"></div>
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              <span>Choose Image</span>
                            </>
                          )}
                        </label>
                      </div>

                      {/* Remove Thumbnail Button */}
                      {(thumbnailPreview || formData.thumbnail) && (
                        <button
                          type="button"
                          onClick={removeThumbnail}
                          className="btn bg-error-100 text-error-700 hover:bg-error-200 text-sm"
                          disabled={uploading}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* File Requirements */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <strong>Supported formats:</strong> JPG, JPEG, PNG, GIF, WEBP, SVG<br />
                    <strong>Max file size:</strong> 5MB<br />
                    <strong>Recommended size:</strong> 800x450 pixels
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Course Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-error-600">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="">Select Category</option>
                  <option value="web-development">Web Development</option>
                  <option value="mobile-development">Mobile Development</option>
                  <option value="data-science">Data Science</option>
                  <option value="business">Business</option>
                  <option value="design">Design</option>
                  <option value="marketing">Marketing</option>
                  <option value="music">Music</option>
                  <option value="photography">Photography</option>
                  <option value="health">Health & Fitness</option>
                  <option value="lifestyle">Lifestyle</option>
                </select>
              </div>

              {/* Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level <span className="text-error-600">*</span>
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="all-levels">All Levels</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (USD) <span className="text-error-600">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="input"
                  placeholder="0.00"
                />
              </div>

              {/* Total Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Hours
                </label>
                <input
                  type="number"
                  name="totalHours"
                  value={formData.totalHours}
                  onChange={handleChange}
                  min="0"
                  className="input"
                  placeholder="0"
                />
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    tags: e.target.value
                  }))}
                  className="input"
                  placeholder="react, javascript, web-development (comma separated)"
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Requirements</h2>
              <button
                type="button"
                onClick={() => addArrayField('requirements')}
                className="btn-secondary text-sm"
              >
                Add Requirement
              </button>
            </div>
            
            {formData.requirements.map((requirement, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={requirement}
                  onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                  className="input flex-1"
                  placeholder="e.g., Basic computer knowledge"
                />
                {formData.requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayField('requirements', index)}
                    className="text-error-600 hover:text-error-700 p-2"
                    title="Remove requirement"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Learning Outcomes */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">What Students Will Learn</h2>
              <button
                type="button"
                onClick={() => addArrayField('learningOutcomes')}
                className="btn-secondary text-sm"
              >
                Add Learning Outcome
              </button>
            </div>
            
            {formData.learningOutcomes.map((outcome, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={outcome}
                  onChange={(e) => handleArrayChange('learningOutcomes', index, e.target.value)}
                  className="input flex-1"
                  placeholder="e.g., Build a complete web application"
                />
                {formData.learningOutcomes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayField('learningOutcomes', index)}
                    className="text-error-600 hover:text-error-700 p-2"
                    title="Remove learning outcome"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/instructor/dashboard')}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin"></div>
                  <span>Creating Course...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Create Course</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;