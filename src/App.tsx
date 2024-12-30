import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './warhammer-blog-page';
import ArticleEditor from './components/admin/ArticleEditor';
import './index.css';
import './styles/admin.css';

const App = () => {
  return (
    <Router>
      <nav className="admin-nav">
        <div className="container">
          <Link to="/" className="nav-link">My LOGO</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/editor" element={<ArticleEditor />} />
      </Routes>
    </Router>
  );
};

export default App; 