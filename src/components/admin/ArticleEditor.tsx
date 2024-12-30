import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import LoginModal from './LoginModal';
import ArticleList from './ArticleList'; // Add this line
import '../../styles/ArticleList.css'; // Add this line

interface ArticleFormData {
  title: string;
  content: string;
  category: string;
  summary: string;
  cover_image: string;
}

interface FileObject {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

const ArticleEditor = () => {
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    content: '',
    category: '帝国攻略',
    summary: '',
    cover_image: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileObject[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const categories = [
    '帝国攻略',
    '鼠人战术',
    '混沌入门',
    '通用教程'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sessionUser = sessionStorage.getItem('user');
    console.log('Submitting article, session user:', sessionUser); // Add this line
    if (!sessionUser) {
      setIsLoginModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const { data, error } = await supabase
        .from('articles')
        .insert([
          {
            ...formData,
            views: 0,
          }
        ]);

      if (error) throw error;

      setMessage({ type: 'success', text: '文章发布成功！' });
      setFormData({
        title: '',
        content: '',
        category: '帝国攻略',
        summary: '',
        cover_image: ''
      });
    } catch (error) {
      setMessage({ type: 'error', text: '发布失败，请重试' });
      console.error('Error publishing article:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `article-covers/${fileName}`;

      const { data, error } = await supabase.storage
        .from('picture')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error details:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('picture')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        cover_image: publicUrl
      }));

      const uploadedImage = document.getElementById('uploadedImage') as HTMLImageElement;
      if (uploadedImage) {
        uploadedImage.src = publicUrl;
        uploadedImage.style.display = 'block';
      }

      setMessage({ type: 'success', text: '图片上传成功！' });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setMessage({ 
        type: 'error', 
        text: `图片上传失败: ${error.message || '请重试'}`
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Fetch uploaded files
  const fetchUploadedFiles = async () => {
    try {
      setIsLoadingFiles(true);
      const { data, error } = await supabase
        .storage
        .from('article-images')
        .list('article-covers', {
          limit: 10,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;
      setUploadedFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      setMessage({ type: 'error', text: '获取文件列表失败' });
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // 删除文件
  const handleDeleteFile = async (fileName: string) => {
    try {
      const { error } = await supabase
        .storage
        .from('article-images')
        .remove([`article-covers/${fileName}`]);

      if (error) throw error;

      setMessage({ type: 'success', text: '文件删除成功' });
      await fetchUploadedFiles(); // 刷新文件列表
    } catch (error) {
      console.error('Error deleting file:', error);
      setMessage({ type: 'error', text: '删除文件失败' });
    }
  };

  // 选择已上传的图片作为封面
  const handleSelectImage = (fileName: string) => {
    const publicUrl = supabase.storage
      .from('article-images')
      .getPublicUrl(`article-covers/${fileName}`).data.publicUrl;

    setFormData(prev => ({
      ...prev,
      cover_image: publicUrl
    }));
  };

  // 在组件加载时获取文件列表
  useEffect(() => {
    const checkAuthStatus = async () => {
      const sessionUser = sessionStorage.getItem('user');
      console.log('Session user:', sessionUser); // Add this line
      if (!sessionUser) {
        setIsLoginModalOpen(true);
      } else {
        fetchUploadedFiles();
      }
    };

    checkAuthStatus();
  }, []);

  const handleLoginSuccess = () => {
    console.log('Login successful, setting session storage'); // Add this line
    sessionStorage.setItem('user', 'loggedIn');
    setIsLoginModalOpen(false);
    fetchUploadedFiles();
  };

  return (
    <div className="admin-editor">
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLogin={handleLoginSuccess} 
      />
      
      
      
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="editor-form">
      <h1 className="editor-title">发布新文章</h1>
        <div className="form-group">
          <label htmlFor="title">标题</label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">分类</label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({...prev, category: e.target.value}))}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="cover_image">封面图片</label>
          <div className="image-upload">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              ref={fileInputRef}
              className="file-input"
            />
            {isUploading && <span className="upload-status">上传中...</span>}
            
            {/* 显示已上传的图片列表 */}
            <div className="uploaded-images">
              <h3>已上传的图片</h3>
              {isLoadingFiles ? (
                <p>加载中...</p>
              ) : (
                <div className="image-grid">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="image-item">
                      <img
                        src={supabase.storage
                          .from('article-images')
                          .getPublicUrl(`article-covers/${file.name}`).data.publicUrl}
                        alt={file.name}
                        onClick={() => handleSelectImage(file.name)}
                      />
                      <div className="image-actions">
                        <button
                          type="button"
                          onClick={() => handleSelectImage(file.name)}
                          className="select-button"
                        >
                          选择
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file.name)}
                          className="delete-button"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 当前选中的封面预览 */}
            {formData.cover_image && (
              <div className="image-preview">
                <img src={formData.cover_image} alt="封面预览" />
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, cover_image: '' }));
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="remove-image"
                >
                  移除封面
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="summary">摘要</label>
          <textarea
            id="summary"
            value={formData.summary}
            onChange={(e) => setFormData(prev => ({...prev, summary: e.target.value}))}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">正文内容</label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({...prev, content: e.target.value}))}
            rows={10}
            required
          />
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? '发布中...' : '发布文章'}
        </button>
      </form>
      
      <ArticleList /> {/* Add this line to include the ArticleList component */}
    </div>
  );
};

export default ArticleEditor;