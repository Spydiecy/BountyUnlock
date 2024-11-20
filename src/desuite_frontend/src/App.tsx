import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Dashboard } from './pages/Dashboard';
import { Space } from './pages/Space';
import { Spaces } from './pages/Spaces';
import { CreateSpace } from './pages/CreateSpace';
import { CreateTask } from './pages/CreateTask';
import { TaskView } from './pages/TaskView';
import { Tasks } from './pages/Tasks';
import { Profile } from './pages/Profile';
import { Leaderboard } from './pages/Leaderboard';

// Layout component for protected routes
const ProtectedLayout = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/spaces" element={<Spaces />} />
            <Route path="/space" element={<Space />} />
            <Route path="/spaces/:spaceId/tasks/create" element={<CreateTask />} />
            <Route path="/spaces/create" element={<CreateSpace />} />
            <Route path="/spaces/:spaceId" element={<Space />} />
            <Route path="/spaces/:spaceId/tasks/:taskId" element={<TaskView />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;