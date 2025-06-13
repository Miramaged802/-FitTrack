import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Clock, TrendingUp, Calendar, Plus, BarChart3, Brain, Zap, Shield, Target, Award, Sun } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadialBarChart, RadialBar, PieChart, Pie, Cell } from 'recharts';
import { FeatureGate } from '../components/FeatureGate';
import { DatabaseService } from '../services/database';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export const SleepTracking: React.FC = () => {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedView, setSelectedView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [sleepData, setSleepData] = useState<any[]>([]);
  const [newEntry, setNewEntry] = useState({
    bedtime: '',
    wakeup: '',
    quality: 5
  });

  useEffect(() => {
    if (user) {
      loadSleepData();
    }
  }, [user]);

  const loadSleepData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const logs = await DatabaseService.getSleepLogs(user.id, 30);
      setSleepData(logs);
    } catch (error) {
      console.error('Error loading sleep data:', error);
      toast.error('Failed to load sleep data');
    } finally {
      setLoading(false);
    }
  };

  const averageSleep = sleepData.length > 0 
    ? sleepData.reduce((sum, day) => sum + day.duration, 0) / sleepData.length 
    : 0;
  
  const averageQuality = sleepData.length > 0 
    ? sleepData.reduce((sum, day) => sum + day.quality, 0) / sleepData.length 
    : 0;
  
  const sleepDebt = Math.max(0, (8 * 7) - sleepData.slice(0, 7).reduce((sum, day) => sum + day.duration, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to log sleep');
      return;
    }

    try {
      // Calculate duration
      const bedtime = new Date(`2000-01-01T${newEntry.bedtime}:00`);
      const wakeup = new Date(`2000-01-01T${newEntry.wakeup}:00`);
      
      // Handle overnight sleep
      if (wakeup < bedtime) {
        wakeup.setDate(wakeup.getDate() + 1);
      }
      
      const duration = (wakeup.getTime() - bedtime.getTime()) / (1000 * 60 * 60);

      const sleepLog = await DatabaseService.createSleepLog({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        bedtime: newEntry.bedtime,
        wakeup_time: newEntry.wakeup,
        duration: Math.round(duration * 10) / 10,
        quality: newEntry.quality,
        notes: ''
      });

      if (sleepLog) {
        toast.success('Sleep entry logged successfully!');
        setShowAddForm(false);
        setNewEntry({ bedtime: '', wakeup: '', quality: 5 });
        loadSleepData(); // Reload data
      } else {
        toast.error('Failed to log sleep entry');
      }
    } catch (error) {
      console.error('Error logging sleep:', error);
      toast.error('Failed to log sleep entry');
    }
  };

  // Prepare chart data from real data
  const weeklyData = sleepData.slice(0, 7).reverse().map((day, index) => ({
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index] || 'Day',
    hours: day.duration || 0,
    quality: day.quality || 0,
    deepSleep: day.deep_sleep || 0,
    remSleep: day.rem_sleep || 0,
    lightSleep: day.light_sleep || 0
  }));

  const sleepPhases = [
    { name: 'Deep Sleep', value: 26, color: '#1e40af', description: 'Physical recovery' },
    { name: 'REM Sleep', value: 23, color: '#7c3aed', description: 'Mental restoration' },
    { name: 'Light Sleep', value: 51, color: '#06b6d4', description: 'Transition phases' },
  ];

  const sleepInsights = [
    {
      title: 'Sleep Consistency',
      score: 85,
      description: 'Your bedtime varies by 45 minutes on average',
      recommendation: 'Try to maintain a consistent bedtime within 30 minutes',
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      title: 'Sleep Efficiency',
      score: 92,
      description: 'You fall asleep quickly and stay asleep well',
      recommendation: 'Excellent! Keep up your current sleep hygiene',
      icon: Zap,
      color: 'text-green-600'
    },
    {
      title: 'Recovery Quality',
      score: 78,
      description: 'Good balance of deep and REM sleep phases',
      recommendation: 'Consider reducing screen time before bed',
      icon: Brain,
      color: 'text-purple-600'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <FeatureGate feature="sleep_tracking">
      <motion.div 
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Enhanced Header */}
        <motion.div 
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center">
              <Moon className="h-10 w-10 text-purple-600 mr-4" />
              Sleep Tracking
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Monitor your sleep patterns and optimize your rest quality</p>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center space-x-4">
            <div className="flex bg-white rounded-xl p-1 shadow-sm border">
              {['overview', 'insights', 'trends'].map((view) => (
                <button
                  key={view}
                  onClick={() => setSelectedView(view)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedView === view
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
            <motion.button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="h-5 w-5 mr-2 inline" />
              Log Sleep
            </motion.button>
          </div>
        </motion.div>

        {/* Enhanced Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
          variants={itemVariants}
        >
          {[
            {
              name: 'Average Sleep',
              value: `${averageSleep.toFixed(1)}h`,
              target: '8.0h',
              icon: Clock,
              color: 'from-purple-500 to-indigo-600',
              progress: (averageSleep / 8) * 100
            },
            {
              name: 'Sleep Quality',
              value: `${averageQuality.toFixed(1)}/10`,
              target: '8.0+',
              icon: BarChart3,
              color: 'from-blue-500 to-cyan-600',
              progress: (averageQuality / 10) * 100
            },
            {
              name: 'Sleep Debt',
              value: `${sleepDebt.toFixed(1)}h`,
              target: '0h',
              icon: Shield,
              color: sleepDebt > 2 ? 'from-red-500 to-pink-600' : 'from-green-500 to-emerald-600',
              progress: Math.max(0, 100 - (sleepDebt / 8) * 100)
            },
            {
              name: 'Consistency',
              value: '85%',
              target: '90%+',
              icon: Target,
              color: 'from-orange-500 to-red-600',
              progress: 85
            }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div 
                key={stat.name}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300"
                whileHover={{ y: -5, scale: 1.02 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Target: {stat.target}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">{stat.name}</h3>
                  <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div 
                      className={`h-2 rounded-full bg-gradient-to-r ${stat.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.progress}%` }}
                      transition={{ delay: index * 0.2, duration: 0.8 }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Content based on selected view */}
        <AnimatePresence mode="wait">
          {selectedView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Sleep Duration Chart */}
              <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Sleep Duration & Quality</h3>
                {weeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                        name="Sleep Hours"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="quality" 
                        stroke="#06b6d4" 
                        strokeWidth={3}
                        dot={{ fill: '#06b6d4', strokeWidth: 2, r: 5 }}
                        name="Quality Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <Moon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No sleep data yet</p>
                      <p className="text-sm">Start logging your sleep to see trends</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sleep Phases */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Sleep Phases</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={sleepPhases}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sleepPhases.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value}%`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 mt-4">
                  {sleepPhases.map((phase, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: phase.color }}
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">{phase.name}</span>
                          <p className="text-xs text-gray-500">{phase.description}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{phase.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {selectedView === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {sleepInsights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <motion.div
                    key={insight.title}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-xl bg-gray-100`}>
                        <Icon className={`h-6 w-6 ${insight.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{insight.title}</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-gray-900">{insight.score}</span>
                            <span className="text-sm text-gray-500">/100</span>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3">{insight.description}</p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            <strong>Recommendation:</strong> {insight.recommendation}
                          </p>
                        </div>
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div 
                              className={`h-2 rounded-full ${
                                insight.score >= 80 ? 'bg-green-500' : 
                                insight.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${insight.score}%` }}
                              transition={{ delay: index * 0.2, duration: 0.8 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {selectedView === 'trends' && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Recent Sleep Logs */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Sleep Logs</h3>
                {sleepData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Bedtime</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Wake Up</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Duration</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Quality</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sleepData.slice(0, 10).map((entry, index) => (
                          <motion.tr 
                            key={entry.id} 
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <td className="py-3 px-4">
                              {new Date(entry.date).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 flex items-center">
                              <Moon className="h-4 w-4 text-purple-600 mr-2" />
                              {entry.bedtime}
                            </td>
                            <td className="py-3 px-4 flex items-center">
                              <Sun className="h-4 w-4 text-orange-600 mr-2" />
                              {entry.wakeup_time}
                            </td>
                            <td className="py-3 px-4 font-medium">{entry.duration}h</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div className="flex space-x-1">
                                  {[...Array(10)].map((_, i) => (
                                    <div
                                      key={i}
                                      className={`w-2 h-2 rounded-full ${
                                        i < entry.quality ? 'bg-purple-500' : 'bg-gray-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="ml-2 text-sm text-gray-600">{entry.quality}/10</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                entry.quality >= 8 ? 'bg-green-100 text-green-800' :
                                entry.quality >= 6 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {entry.quality >= 8 ? 'Excellent' : entry.quality >= 6 ? 'Good' : 'Poor'}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Moon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No sleep logs yet</p>
                    <p className="text-sm text-gray-400 mt-1">Start tracking your sleep to see your patterns</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Add Sleep Entry Modal */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Log Sleep Entry</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Bedtime
                    </label>
                    <input
                      type="time"
                      value={newEntry.bedtime}
                      onChange={(e) => setNewEntry({ ...newEntry, bedtime: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Wake Up Time
                    </label>
                    <input
                      type="time"
                      value={newEntry.wakeup}
                      onChange={(e) => setNewEntry({ ...newEntry, wakeup: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Sleep Quality (1-10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={newEntry.quality}
                      onChange={(e) => setNewEntry({ ...newEntry, quality: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Poor</span>
                      <span className="font-bold text-lg text-purple-600">{newEntry.quality}</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                  <div className="flex space-x-4 pt-4">
                    <motion.button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Save Entry
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </FeatureGate>
  );
};