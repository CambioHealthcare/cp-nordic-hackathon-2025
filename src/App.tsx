import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Login from './pages/Login/Login';
import Callback from './pages/Callback/Callback';
import FormPage from './pages/FormPage';
import authService from './services/auth.service';
import './App.css';
import Grafana from 'pages/Grafana/Grafana';
import ShowComposition from 'pages/ShowComposition/ShowComposition';
import Organization from './pages/Organization/Organization';
import Patient from './pages/Patient/Patient';
import PatientSelector from './components/PatientSelector/PatientSelector';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const isAuthenticated = !!authService.getToken();
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
    return (
        <div className="App">
            <Router>
                <Layout>
                    <nav className="nav-fixed">
                        <PatientSelector />
                        <ul className="nav-list">
                            <li>
                                <Link to="/login" className="nav-link">Login</Link>
                            </li>
                            <li>
                                <Link to="/form" className="nav-link">Form Data Input</Link>
                            </li>
                            <li>
                                <Link to="/grafana" className="nav-link">Embedded Grafana</Link>
                            </li>
                            <li>
                                <Link to="/showComposition" className="nav-link">Show openEHR Composition</Link>
                            </li>
                            <li>
                                <Link to="/organization" className="nav-link">FHIR Organization Viewer</Link>
                            </li>
                            <li>
                                <Link to="/patient" className="nav-link">FHIR Patient Viewer</Link>
                            </li>
                        </ul>
                    </nav>
                    <header className="App-header">
                        <Routes>
                            <Route path="/" element={<Navigate to="/login" />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/form" element={<FormPage />} />
                            <Route path="/callback" element={<Callback />} />
                            <Route path="/grafana" element={<Grafana />} />
                            <Route path="/showComposition" element={<ShowComposition />} />
                            <Route 
                                path="/organization" 
                                element={
                                    <ProtectedRoute>
                                        <Organization />
                                    </ProtectedRoute>
                                }
                            />
                            <Route 
                                path="/patient" 
                                element={
                                    <ProtectedRoute>
                                        <Patient />
                                    </ProtectedRoute>
                                }
                            />
                        </Routes>
                    </header>
                    <div className="App-content">
                    </div>
                </Layout>
            </Router>
        </div>
    );
};

export default React.memo(App);
