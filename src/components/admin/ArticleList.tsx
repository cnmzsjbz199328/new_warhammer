import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Article {
  id: number;
  title: string;
  category: string;
  cover_image: string | null;
  created_at: string;
}

const ArticleList = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, category, cover_image, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching articles:', error);
        setMessage({ type: 'error', text: '获取文章列表失败' });
      } else {
        setArticles(data || []);
      }
      setLoading(false);
    };

    fetchArticles();
  }, []);

  const handleDeleteArticle = async (id: number, coverImage: string | null) => {
    try {
      const { error: deleteError } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      if (coverImage) {
        const fileName = coverImage.split('/').pop();
        if (fileName) {
          const { error: storageError } = await supabase
            .storage
            .from('picture')
            .remove([`article-covers/${fileName}`]);

          if (storageError) {
            throw storageError;
          }
        }
      }

      setArticles(articles.filter(article => article.id !== id));
      setMessage({ type: 'success', text: '文章和图片删除成功' });
    } catch (error) {
      console.error('Error deleting article or image:', error);
      setMessage({ type: 'error', text: '删除文章或图片失败' });
    }
  };

  return (
    <div className="article-list">
      <h2 className="article-list-title">文章列表</h2>
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      {loading ? (
        <p className="loading">加载中...</p>
      ) : (
        <ul className="article-list-items">
          {articles.map(article => (
            <li key={article.id} className="article-list-item">
              <div className="article-info">
                <span className="article-title">{article.title}</span>
                <span className="article-category">{article.category}</span>
                <span className="article-date">{new Date(article.created_at).toLocaleDateString()}</span>
              </div>
              <div className="article-actions">
                <button 
                  className="delete-button" 
                  onClick={() => handleDeleteArticle(article.id, article.cover_image)}
                >
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ArticleList;
