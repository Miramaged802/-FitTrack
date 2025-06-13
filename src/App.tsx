import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthWrapper } from './components/AuthWrapper';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { SleepTracking } from './pages/SleepTracking';
import { MoodTracking } from './pages/MoodTracking';
import { WorkoutManagement } from './pages/WorkoutManagement';
import { NutritionTracking } from './pages/NutritionTracking';
import { GoalSetting } from './pages/GoalSetting';
import { Community } from './pages/Community';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Subscription } from './pages/Subscription';

function App() {
  return (
    <>
      <AuthWrapper>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sleep" element={<SleepTracking />} />
              <Route path="/mood" element={<MoodTracking />} />
              <Route path="/workouts" element={<WorkoutManagement />} />
              <Route path="/nutrition" element={<NutritionTracking />} />
              <Route path="/goals" element={<GoalSetting />} />
              <Route path="/community" element={<Community />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/subscription" element={<Subscription />} />
            </Routes>
          </Layout>
        </Router>
      </AuthWrapper>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  );
}

export default App;