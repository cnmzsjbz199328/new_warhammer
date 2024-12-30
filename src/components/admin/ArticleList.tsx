import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Article {
  id: number;
  title: string;
  category: string;
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
        .select('id, title, category, created_at')
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

  const handleDeleteArticle = async (id: number) => {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting article:', error);
      setMessage({ type: 'error', text: '删除文章失败' });
    } else {
      setArticles(articles.filter(article => article.id !== id));
      setMessage({ type: 'success', text: '文章删除成功' });
    }
  };

  return (
    <div className="article-list">
      <h2>文章列表</h2>
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      {loading ? (
        <p>加载中...</p>
      ) : (
        <ul>
          {articles.map(article => (
            <li key={article.id}>
              <span>{article.title} - {article.category} - {new Date(article.created_at).toLocaleDateString()}</span>
              <button onClick={() => handleDeleteArticle(article.id)}>删除</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ArticleList;
