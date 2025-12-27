import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Auth Pages
import LoginPage from './Pages/Auth/LoginPage';
import RegisterPage from './Pages/Auth/RegisterPage';

// Dashboard Pages
import DashboardPage from './Pages/Dashboard/DashboardPage';
import DocumentListPage from './Pages/Dashboard/DocumentListPage';
import DocumentDetailPage from './Pages/Dashboard/DocumentDetailPage';
import FlashcardsListPage from './Pages/Dashboard/FlashcardsListPage';
import QuizTakePage from './Pages/Dashboard/QuizTakePage';
import QuizResultPage from './Pages/Dashboard/QuizResultPage';
import ProfilePage from './Pages/Dashboard/ProfilePage';

const ProtectedRoute = ({ isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/documents" element={<DocumentListPage />} />
          <Route path="/documents/:id" element={<DocumentDetailPage />} />
          <Route path="/documents/:id/flashcards" element={<FlashcardsListPage />} />
          <Route path="/flashcards" element={<FlashcardsListPage />} />
          <Route path="/quizzes/:QuizId" element={<QuizTakePage />} />
          <Route path="/quizzes/:QuizId/results" element={<QuizResultPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
