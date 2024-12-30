import React, { useState, useEffect } from 'react';
import { Calendar, Eye, ChevronRight } from 'lucide-react';
import { supabase } from './lib/supabase';

// 更新类型定义以匹配数据库结构
interface Article {
  id: number;
  title: string;
  content: string;
  category: string;
  cover_image: string | null;
  summary: string | null;
  views: number;
  created_at: string;
  updated_at: string;
}

// 添加默认图片常量
const DEFAULT_COVER_IMAGE = '/images/default-cover.jpg';  // 你需要添加一个默认封面图

const HomePage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedArticleId, setExpandedArticleId] = useState<number | null>(null);

  // 预定义分类（因为数据库中是直接存储的分类名）
  const categories = [
    { id: 'all', name: '全部' },
    { id: '帝国攻略', name: '帝国攻略' },
    { id: '鼠人战术', name: '鼠人战术' },
    { id: '混沌入门', name: '混沌入门' },
    { id: '通用教程', name: '通用教程' }
  ];

  // 获取文章数据
  useEffect(() => {
    async function fetchArticles() {
      setLoading(true);
      let query = supabase
        .from('articles')
        .select(`
          id,
          title,
          content,
          category,
          cover_image,
          summary,
          views,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching articles:', error);
        return;
      }

      setArticles(data || []);
      setLoading(false);
    }

    fetchArticles();
  }, [selectedCategory]);

  const handleReadMore = (id: number) => {
    setExpandedArticleId(expandedArticleId === id ? null : id);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.article-card')) {
      setExpandedArticleId(null);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // 获取卡片位置
  const getCardPosition = (id: number) => {
    const card = document.querySelector(`[data-article-id="${id}"]`);
    if (card) {
      const rect = card.getBoundingClientRect();
      return {
        top: rect.top,
        left: rect.right,
        height: rect.height
      };
    }
    return null;
  };

  return (
    <div className="homepage">
      <div className="banner">
        <div className="container">
          <h1 className="title">战锤攻略站</h1>
          <p className="subtitle">分享最实用的战锤游戏攻略和战术分析</p>
        </div>
      </div>

      <div className="content">
        <div className="category-nav">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`category-button ${
                selectedCategory === category.id ? 'active' : ''
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="article-list">
          {loading ? (
            <div className="loading">加载中...</div>
          ) : articles.length === 0 ? (
            <div className="no-articles">暂无文章</div>
          ) : (
            <>
              {articles.map(article => (
                <article 
                  key={article.id} 
                  className="article-card"
                  data-article-id={article.id}
                >
                  <div className="article-content">
                    <div className="article-image">
                      <img
                        src={article.cover_image || DEFAULT_COVER_IMAGE}
                        alt={article.title}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = DEFAULT_COVER_IMAGE;
                        }}
                      />
                    </div>
                    <div className="article-details">
                      <div className="article-meta">
                        <Calendar size={16} className="icon" />
                        <span>{new Date(article.created_at).toLocaleDateString()}</span>
                        <Eye size={16} className="icon" />
                        <span>{article.views.toLocaleString()} 次浏览</span>
                      </div>
                      <h2 className="article-title">
                        {article.title}
                      </h2>
                      <p className="article-summary">
                        {article.summary || article.content.slice(0, 100) + '...'}
                      </p>
                      <div className="article-footer">
                        <span className="article-category">
                          {article.category}
                        </span>
                        <button className="read-more" onClick={() => handleReadMore(article.id)}>
                          阅读更多 <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {expandedArticleId === article.id && (
                    <div className="article-drawer">
                      <div className="article-drawer-content">
                        <button 
                          className="article-drawer-close"
                          onClick={() => setExpandedArticleId(null)}
                        >
                          ×
                        </button>
                        <div className="article-drawer-inner">
                          <div className="article-drawer-body">
                            {article.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;