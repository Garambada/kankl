
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GlobalStateProvider } from './context/GlobalStateContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Speakers } from './pages/Speakers';
import { Bookings } from './pages/Bookings';
import { Briefing } from './pages/Briefing';
import { RoundTable } from './pages/RoundTable';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';

function App() {
    return (
        <GlobalStateProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="speakers" element={<Speakers />} />
                        <Route path="bookings" element={<Bookings />} />
                        <Route path="briefing" element={<Briefing />} />
                        <Route path="round-table" element={<RoundTable />} />
                        <Route path="admin" element={<AdminDashboard />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </GlobalStateProvider>
    );
}

export default App;
