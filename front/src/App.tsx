import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RequestPage from './pages/RequestPage';
import AddExpensePage from './pages/AddExpensePage';
import AddIncomePage from './pages/AddIncomePage';
import PrivateRoute from './components/PrivateRoute';
import SignupPage from './pages/SignupPage';
import FixedExpensesPage from './pages/FixedExpensesPage';
import ChildrenManagementPage from './pages/ChildrenManagementPage';
import ChildDashboardPage from './pages/ChildDashboardPage';
import ManageChildrenPage from './pages/ManageChildrenPage';

const App: React.FC = () => {
  return (
    <Router future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/child-dashboard" element={<ChildDashboardPage />} />
        
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/requests" element={<RequestPage />} />
          <Route path="/expenses/add" element={<AddExpensePage />} />
          <Route path="/income/add" element={<AddIncomePage />} />
          <Route path="/expenses/fixed" element={<FixedExpensesPage />} />
          <Route path="/children" element={<ChildrenManagementPage />} />
          <Route path="/manage-children" element={<ManageChildrenPage />} />
        </Route>
      </Routes>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={true}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </Router>
  );
};

export default App;
