import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Plus, Clock, Flame, TrendingUp, Play, Pause, RotateCcw, Brain, Zap, CheckCircle, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AIWorkoutRecommendations } from '../components/AIWorkoutRecommendations';
import { FeatureGate, UsageLimit } from '../components/FeatureGate';
import { DatabaseService } from '../services/database';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import toast from 'react-hot-toast';

const workoutTemplates = [
  {
    name: 'Upper Body Strength',
    duration: 45,
    exercises: ['Push-ups', 'Pull-ups', 'Bench Press', 'Shoulder Press', 'Bicep Curls'],
    difficulty: 'Intermediate',
    calories: 380
  },
  {
    name: 'HIIT Cardio',
    duration: 20,
    exercises: ['Burpees', 'Jump Squats', 'Mountain Climbers', 'High Knees'],
    difficulty: 'Advanced',
    calories: 320
  },
  {
    name: 'Yoga Flow',
    duration: 30,
    exercises: ['Sun Salutation', 'Warrior Poses', 'Tree Pose', 'Downward Dog'],
    difficulty: 'Beginner',
    calories: 150
  },
  {
    name: 'Lower Body Power',
    duration: 50,
    exercises: ['Squats', 'Deadlifts', 'Lunges', 'Calf Raises', 'Leg Press'],
    difficulty: 'Intermediate',
    calories: 420
  }
];

export const WorkoutManagement: React.FC = () => {
  const { user } = useAuth();
  const { getFeatureLimit } = useSubscription();
  const [workoutData, setWorkoutData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [workoutLimit, setWorkoutLimit] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [activeTimer, setActiveTimer] = useState<{ isRunning: boolean; time: number; workoutName: string } | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'ai-recommendations' | 'templates'>('overview');
  const [newWorkout, setNewWorkout] = useState({
    type: '',
    duration: '',
    calories: '',
    exercises: '',
    notes: ''
  });

  // Mock current state for AI recommendations
  const currentMood = 7;
  const energyLevel = 6;
  const stressLevel = 4;

  useEffect(() => {
    if (user) {
      loadWorkouts();
      loadWorkoutLimit();
    }
  }, [user]);

  const loadWorkouts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const workouts = await DatabaseService.getWorkouts(user.id, 30);
      setWorkoutData(workouts);
    } catch (error) {
      console.error('Error loading workouts:', error);
      toast.error('Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkoutLimit = async () => {
    if (!user) return;
    
    try {
      const limit = await getFeatureLimit('workout_logging');
      setWorkoutLimit(limit);
    } catch (error) {
      console.error('Error loading workout limit:', error);
    }
  };

  const totalWorkouts = workoutData.length;
  const totalCalories = workoutData.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
  const totalDuration = workoutData.reduce((sum, w) => sum + (w.duration || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to log workouts');
      return;
    }

    // Check workout limit
    if (workoutLimit !== -1 && workoutData.length >= workoutLimit) {
      toast.error(`You've reached your workout limit of ${workoutLimit}. Upgrade to log more workouts.`);
      return;
    }

    setSaving(true);
    setShowSaveSuccess(false);

    try {
      const exercisesList = newWorkout.exercises.split(',').map(e => e.trim()).filter(e => e);
      
      const workout = await DatabaseService.createWorkout({
        user_id: user.id,
        name: `${newWorkout.type} Workout`,
        type: newWorkout.type,
        duration: parseInt(newWorkout.duration),
        calories_burned: parseInt(newWorkout.calories),
        exercises: exercisesList,
        notes: newWorkout.notes,
        date: new Date().toISOString().split('T')[0]
      });

      if (workout) {
        // Show success animation
        setShowSaveSuccess(true);
        toast.success('Workout logged successfully!');
        
        // Auto-hide success animation after 3 seconds
        setTimeout(() => {
          setShowSaveSuccess(false);
          setShowAddForm(false);
        }, 3000);
        
        setNewWorkout({ type: '', duration: '', calories: '', exercises: '', notes: '' });
        loadWorkouts(); // Reload workouts
      } else {
        toast.error('Failed to log workout');
      }
    } catch (error) {
      console.error('Error logging workout:', error);
      toast.error('Failed to log workout');
    } finally {
      setSaving(false);
    }
  };

  const startWorkout = async (template: typeof workoutTemplates[0]) => {
    if (!user) {
      toast.error('Please sign in to start workouts');
      return;
    }

    // Check workout limit
    if (workoutLimit !== -1 && workoutData.length >= workoutLimit) {
      toast.error(`You've reached your workout limit of ${workoutLimit}. Upgrade to log more workouts.`);
      return;
    }

    setActiveTimer({ isRunning: true, time: 0, workoutName: template.name });
    
    // Auto-log the workout when started
    try {
      const workout = await DatabaseService.createWorkout({
        user_id: user.id,
        name: template.name,
        type: template.name.includes('Cardio') ? 'Cardio' : template.name.includes('Strength') ? 'Strength' : 'Other',
        duration: template.duration,
        calories_burned: template.calories,
        exercises: template.exercises,
        notes: `Started from template: ${template.name}`,
        date: new Date().toISOString().split('T')[0]
      });

      if (workout) {
        toast.success(`${template.name} workout started and logged!`);
        loadWorkouts(); // Reload workouts
      }
    } catch (error) {
      console.error('Error logging template workout:', error);
      toast.error('Failed to log workout');
    }
  };

  const toggleTimer = () => {
    if (activeTimer) {
      setActiveTimer({ ...activeTimer, isRunning: !activeTimer.isRunning });
    }
  };

  const resetTimer = () => {
    if (activeTimer) {
      setActiveTimer({ ...activeTimer, time: 0, isRunning: false });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer?.isRunning) {
      interval = setInterval(() => {
        setActiveTimer(prev => prev ? { ...prev, time: prev.time + 1 } : null);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer?.isRunning]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Prepare chart data from real data
  const weeklyData = workoutData.slice(0, 7).reverse().map((workout, index) => ({
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index] || 'Day',
    calories: workout.calories_burned || 0,
    duration: workout.duration || 0
  }));

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <FeatureGate feature="workout_logging">
      <motion.div 
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Success Animation Overlay */}
        <AnimatePresence>
          {showSaveSuccess && (
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl p-8 shadow-2xl border border-orange-200"
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <div className="text-center">
                  <motion.div
                    className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <CheckCircle className="h-8 w-8 text-orange-600" />
                  </motion.div>
                  <motion.h3
                    className="text-xl font-bold text-gray-900 mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Workout Logged Successfully!
                  </motion.h3>
                  <motion.p
                    className="text-gray-600"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Your workout has been saved and added to your fitness journey.
                  </motion.p>
                  <motion.div
                    className="mt-4 flex items-center justify-center space-x-2 text-sm text-orange-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span>Data synced to database</span>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Header */}
        <motion.div 
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent flex items-center">
              <Dumbbell className="h-10 w-10 text-orange-600 mr-4" />
              Workout Management
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Track your fitness journey and get AI-powered recommendations</p>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center space-x-4">
            <div className="flex bg-white rounded-xl p-1 shadow-sm border">
              {[
                { id: 'overview', name: 'Overview', icon: TrendingUp },
                { id: 'ai-recommendations', name: 'AI Coach', icon: Brain },
                { id: 'templates', name: 'Templates', icon: Dumbbell }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                      selectedTab === tab.id
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </div>
            <motion.button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="h-5 w-5 mr-2 inline" />
              Log Workout
            </motion.button>
          </div>
        </motion.div>

        {/* Active Timer */}
        <AnimatePresence>
          {activeTimer && (
            <motion.div
              className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-6 text-white"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{activeTimer.workoutName}</h3>
                  <p className="text-orange-100">Workout in progress</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-3xl font-bold">{formatTime(activeTimer.time)}</div>
                  <div className="flex space-x-2">
                    <button
                      onClick={toggleTimer}
                      className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                    >
                      {activeTimer.isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={resetTimer}
                      className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {selectedTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Cards with Usage Limit */}
              <UsageLimit feature="workout_logging" currentUsage={totalWorkouts}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      name: 'This Month',
                      value: `${totalWorkouts} workouts`,
                      icon: Dumbbell,
                      color: 'from-orange-500 to-red-600',
                      progress: workoutLimit === -1 ? 100 : (totalWorkouts / workoutLimit) * 100
                    },
                    {
                      name: 'Calories Burned',
                      value: totalCalories.toLocaleString(),
                      icon: Flame,
                      color: 'from-red-500 to-pink-600',
                      progress: (totalCalories / 3000) * 100
                    },
                    {
                      name: 'Total Time',
                      value: `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`,
                      icon: Clock,
                      color: 'from-blue-500 to-indigo-600',
                      progress: (totalDuration / 300) * 100
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
                            <p className="text-sm text-gray-500">{stat.name}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div 
                            className={`h-2 rounded-full bg-gradient-to-r ${stat.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(stat.progress, 100)}%` }}
                            transition={{ delay: index * 0.2, duration: 0.8 }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </UsageLimit>

              {/* Workout Chart */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Weekly Activity</h3>
                {weeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyData}>
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
                      <Bar dataKey="calories" fill="url(#orangeGradient)" radius={[6, 6, 0, 0]} name="Calories" />
                      <defs>
                        <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" />
                          <stop offset="100%" stopColor="#ea580c" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No workouts logged yet</p>
                      <p className="text-sm">Start logging your workouts to see trends</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Workouts */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Workouts</h3>
                {workoutData.length > 0 ? (
                  <div className="space-y-4">
                    {workoutData.slice(0, 5).map((workout, index) => (
                      <motion.div 
                        key={workout.id} 
                        className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <Dumbbell className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{workout.name}</h4>
                              <p className="text-sm text-gray-500">
                                {new Date(workout.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center text-gray-600">
                                <Clock className="h-4 w-4 mr-1" />
                                {workout.duration}m
                              </div>
                              <div className="flex items-center text-gray-600">
                                <Flame className="h-4 w-4 mr-1" />
                                {workout.calories_burned} cal
                              </div>
                            </div>
                            {workout.exercises && workout.exercises.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2 justify-end">
                                {workout.exercises.slice(0, 3).map((exercise: string, i: number) => (
                                  <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                    {exercise}
                                  </span>
                                ))}
                                {workout.exercises.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                    +{workout.exercises.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No workouts logged yet</p>
                    <p className="text-sm text-gray-400 mt-1">Start your fitness journey by logging your first workout!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {selectedTab === 'ai-recommendations' && (
            <motion.div
              key="ai-recommendations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FeatureGate feature="ai_recommendations">
                <AIWorkoutRecommendations 
                  currentMood={currentMood}
                  energyLevel={energyLevel}
                  stressLevel={stressLevel}
                />
              </FeatureGate>
            </motion.div>
          )}

          {selectedTab === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Workout Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {workoutTemplates.map((template, index) => (
                    <motion.div 
                      key={index} 
                      className="border border-gray-200 rounded-xl p-6 hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{template.name}</h4>
                          <p className="text-sm text-gray-500">{template.duration} minutes • {template.calories} calories</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                          {template.difficulty}
                        </span>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Exercises:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.exercises.map((exercise, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {exercise}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => startWorkout(template)}
                        className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Workout
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Workout Modal */}
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
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Log Workout</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Workout Type
                    </label>
                    <select
                      value={newWorkout.type}
                      onChange={(e) => setNewWorkout({ ...newWorkout, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select type</option>
                      <option value="Cardio">Cardio</option>
                      <option value="Strength">Strength Training</option>
                      <option value="HIIT">HIIT</option>
                      <option value="Yoga">Yoga</option>
                      <option value="Sports">Sports</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={newWorkout.duration}
                      onChange={(e) => setNewWorkout({ ...newWorkout, duration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calories Burned
                    </label>
                    <input
                      type="number"
                      value={newWorkout.calories}
                      onChange={(e) => setNewWorkout({ ...newWorkout, calories: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exercises (comma separated)
                    </label>
                    <input
                      type="text"
                      value={newWorkout.exercises}
                      onChange={(e) => setNewWorkout({ ...newWorkout, exercises: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Push-ups, Squats, Running"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={newWorkout.notes}
                      onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      rows={3}
                      placeholder="How did the workout feel?"
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <motion.button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 relative overflow-hidden"
                      whileHover={{ scale: saving ? 1 : 1.02 }}
                      whileTap={{ scale: saving ? 1 : 0.98 }}
                    >
                      {saving ? (
                        <>
                          <motion.div
                            className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Saving Workout...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2 inline" />
                          Save Workout
                        </>
                      )}
                      
                      {/* Pulse effect when saving */}
                      {saving && (
                        <motion.div
                          className="absolute inset-0 bg-white opacity-20"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
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