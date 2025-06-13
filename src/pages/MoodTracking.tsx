import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Smile, Frown, Meh, Plus, Calendar, TrendingUp, Brain, Zap, Shield, Sun, Cloud, CloudRain } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar } from 'recharts';
import { DatabaseService } from '../services/database';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const moodEmojis = {
  1: '😢', 2: '😟', 3: '😕', 4: '😐', 5: '😊',
  6: '😊', 7: '😄', 8: '😁', 9: '🤩', 10: '🥳'
};

const weatherMoodMap = {
  sunny: { icon: Sun, color: 'text-yellow-500', mood: 8 },
  cloudy: { icon: Cloud, color: 'text-gray-500', mood: 6 },
  rainy: { icon: CloudRain, color: 'text-blue-500', mood: 5 }
};

export const MoodTracking: React.FC = () => {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedView, setSelectedView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [moodData, setMoodData] = useState<any[]>([]);
  const [newEntry, setNewEntry] = useState({
    mood: 5,
    energy: 5,
    stress: 5,
    anxiety: 5,
    happiness: 5,
    notes: '',
    weather: 'sunny'
  });

  useEffect(() => {
    if (user) {
      loadMoodData();
    }
  }, [user]);

  const loadMoodData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const logs = await DatabaseService.getMoodLogs(user.id, 30);
      setMoodData(logs);
    } catch (error) {
      console.error('Error loading mood data:', error);
      toast.error('Failed to load mood data');
    } finally {
      setLoading(false);
    }
  };

  const averageMood = moodData.length > 0 
    ? moodData.reduce((sum, day) => sum + day.mood, 0) / moodData.length 
    : 0;
  
  const averageEnergy = moodData.length > 0 
    ? moodData.reduce((sum, day) => sum + day.energy, 0) / moodData.length 
    : 0;
  
  const averageStress = moodData.length > 0 
    ? moodData.reduce((sum, day) => sum + day.stress, 0) / moodData.length 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to log mood');
      return;
    }

    try {
      const moodLog = await DatabaseService.createMoodLog({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        mood: newEntry.mood,
        energy: newEntry.energy,
        stress: newEntry.stress,
        anxiety: newEntry.anxiety,
        happiness: newEntry.happiness,
        weather: newEntry.weather,
        notes: newEntry.notes
      });

      if (moodLog) {
        toast.success('Mood entry logged successfully!');
        setShowAddForm(false);
        setNewEntry({ mood: 5, energy: 5, stress: 5, anxiety: 5, happiness: 5, notes: '', weather: 'sunny' });
        loadMoodData(); // Reload data
      } else {
        toast.error('Failed to log mood entry');
      }
    } catch (error) {
      console.error('Error logging mood:', error);
      toast.error('Failed to log mood entry');
    }
  };

  const getMoodIcon = (mood: number) => {
    if (mood >= 8) return <Smile className="h-6 w-6 text-green-600" />;
    if (mood >= 6) return <Meh className="h-6 w-6 text-yellow-600" />;
    return <Frown className="h-6 w-6 text-red-600" />;
  };

  // Prepare chart data from real data
  const chartData = moodData.slice(0, 7).reverse().map((day, index) => ({
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index] || 'Day',
    mood: day.mood || 0,
    energy: day.energy || 0,
    stress: day.stress || 0,
    anxiety: day.anxiety || 0,
    happiness: day.happiness || 0
  }));

  const radarData = [
    { metric: 'Mood', value: averageMood, fullMark: 10 },
    { metric: 'Energy', value: averageEnergy, fullMark: 10 },
    { metric: 'Happiness', value: moodData.length > 0 ? moodData.reduce((sum, day) => sum + day.happiness, 0) / moodData.length : 0, fullMark: 10 },
    { metric: 'Stress', value: 10 - averageStress, fullMark: 10 }, // Invert stress for better visualization
    { metric: 'Anxiety', value: moodData.length > 0 ? 10 - (moodData.reduce((sum, day) => sum + day.anxiety, 0) / moodData.length) : 0, fullMark: 10 }, // Invert anxiety
  ];

  const moodInsights = [
    {
      title: 'Emotional Stability',
      score: Math.round((averageMood / 10) * 100),
      description: 'Your mood shows good consistency with minor fluctuations',
      recommendation: 'Continue your current wellness practices',
      icon: Heart,
      color: 'text-pink-600'
    },
    {
      title: 'Energy Levels',
      score: Math.round((averageEnergy / 10) * 100),
      description: 'Energy correlates well with sleep quality and exercise',
      recommendation: 'Maintain regular sleep schedule and physical activity',
      icon: Zap,
      color: 'text-yellow-600'
    },
    {
      title: 'Stress Management',
      score: Math.round(((10 - averageStress) / 10) * 100),
      description: 'You handle stress well with effective coping strategies',
      recommendation: 'Keep practicing mindfulness and relaxation techniques',
      icon: Shield,
      color: 'text-green-600'
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center">
            <Heart className="h-10 w-10 text-pink-600 mr-4" />
            Mood Tracking
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Track your emotional well-being and identify patterns</p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-4">
          <div className="flex bg-white rounded-xl p-1 shadow-sm border">
            {['overview', 'insights', 'patterns'].map((view) => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedView === view
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
          <motion.button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="h-5 w-5 mr-2 inline" />
            Log Mood
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
            name: 'Average Mood',
            value: `${averageMood.toFixed(1)}/10`,
            icon: Heart,
            color: 'from-pink-500 to-rose-600',
            progress: (averageMood / 10) * 100,
            trend: '+5%'
          },
          {
            name: 'Energy Level',
            value: `${averageEnergy.toFixed(1)}/10`,
            icon: Zap,
            color: 'from-yellow-500 to-orange-600',
            progress: (averageEnergy / 10) * 100,
            trend: '+8%'
          },
          {
            name: 'Stress Level',
            value: `${averageStress.toFixed(1)}/10`,
            icon: Brain,
            color: 'from-blue-500 to-indigo-600',
            progress: 100 - (averageStress / 10) * 100,
            trend: '-12%'
          },
          {
            name: 'Mood Stability',
            value: '85%',
            icon: Shield,
            color: 'from-green-500 to-emerald-600',
            progress: 85,
            trend: '+3%'
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
                  <span className="text-sm font-medium text-green-600">{stat.trend}</span>
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
            {/* Mood Trends Chart */}
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Weekly Mood Trends</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" domain={[0, 10]} />
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
                      dataKey="mood" 
                      stroke="#ec4899" 
                      strokeWidth={3}
                      dot={{ fill: '#ec4899', strokeWidth: 2, r: 5 }}
                      name="Mood"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="energy" 
                      stroke="#f97316" 
                      strokeWidth={3}
                      dot={{ fill: '#f97316', strokeWidth: 2, r: 5 }}
                      name="Energy"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="stress" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                      name="Stress"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No mood data yet</p>
                    <p className="text-sm">Start logging your mood to see trends</p>
                  </div>
                </div>
              )}
            </div>

            {/* Emotional Balance Radar */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Emotional Balance</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} />
                  <Radar
                    name="Current Week"
                    dataKey="value"
                    stroke="#ec4899"
                    fill="#ec4899"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Your emotional balance shows {moodData.length > 0 ? 'healthy patterns' : 'no data yet'}
                </p>
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
            {moodInsights.map((insight, index) => {
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
                    <div className="p-3 rounded-xl bg-gray-100">
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

        {selectedView === 'patterns' && (
          <motion.div
            key="patterns"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Mood Journal */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Mood Journal</h3>
              {moodData.length > 0 ? (
                <div className="space-y-4">
                  {moodData.slice(0, 10).map((entry, index) => (
                    <motion.div 
                      key={entry.id} 
                      className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl">
                            {moodEmojis[entry.mood as keyof typeof moodEmojis]}
                          </div>
                          <div>
                            <div className="flex items-center space-x-4 mb-2">
                              <span className="text-sm font-semibold text-gray-700">
                                {new Date(entry.date).toLocaleDateString()}
                              </span>
                              <div className="flex items-center space-x-3">
                                <span className="text-xs text-gray-500">Mood:</span>
                                <span className="text-sm font-medium text-pink-600">{entry.mood}/10</span>
                                <span className="text-xs text-gray-500">Energy:</span>
                                <span className="text-sm font-medium text-orange-600">{entry.energy}/10</span>
                                <span className="text-xs text-gray-500">Stress:</span>
                                <span className="text-sm font-medium text-blue-600">{entry.stress}/10</span>
                              </div>
                            </div>
                            {entry.notes && (
                              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">{entry.notes}</p>
                            )}
                          </div>
                        </div>
                        {getMoodIcon(entry.mood)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No mood entries yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start tracking your mood to see patterns</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Add Mood Entry Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Log Mood Entry</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    How are you feeling? ({newEntry.mood}/10)
                  </label>
                  <div className="text-center text-5xl mb-4">
                    {moodEmojis[newEntry.mood as keyof typeof moodEmojis]}
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={newEntry.mood}
                    onChange={(e) => setNewEntry({ ...newEntry, mood: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Terrible</span>
                    <span>Amazing</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Energy Level ({newEntry.energy}/10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={newEntry.energy}
                      onChange={(e) => setNewEntry({ ...newEntry, energy: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Stress Level ({newEntry.stress}/10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={newEntry.stress}
                      onChange={(e) => setNewEntry({ ...newEntry, stress: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Anxiety Level ({newEntry.anxiety}/10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={newEntry.anxiety}
                      onChange={(e) => setNewEntry({ ...newEntry, anxiety: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Happiness ({newEntry.happiness}/10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={newEntry.happiness}
                      onChange={(e) => setNewEntry({ ...newEntry, happiness: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Weather Today
                  </label>
                  <div className="flex space-x-3">
                    {Object.entries(weatherMoodMap).map(([weather, data]) => {
                      const Icon = data.icon;
                      return (
                        <button
                          key={weather}
                          type="button"
                          onClick={() => setNewEntry({ ...newEntry, weather })}
                          className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                            newEntry.weather === weather
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`h-6 w-6 mx-auto ${data.color}`} />
                          <span className="text-xs mt-1 block capitalize">{weather}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={newEntry.notes}
                    onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                    rows={3}
                    placeholder="How was your day? What affected your mood?"
                  />
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
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
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
  );
};