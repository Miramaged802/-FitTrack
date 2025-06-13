import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Moon, Heart, Dumbbell, Apple, Target, TrendingUp, Calendar, Award, Clock, Zap, Droplets, Brain, Shield, ChevronRight, Plus, Star, Siren as Fire } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';
import { DatabaseService } from '../services/database';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { planName, isPremium } = useSubscription();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Dynamic data states
  const [sleepData, setSleepData] = useState<any[]>([]);
  const [workoutData, setWorkoutData] = useState<any[]>([]);
  const [moodData, setMoodData] = useState<any[]>([]);
  const [nutritionData, setNutritionData] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [
        sleepLogs,
        workouts,
        moodLogs,
        nutritionLogs,
        userGoals,
        userAchievements,
        weeklyStats
      ] = await Promise.all([
        DatabaseService.getSleepLogs(user.id, 7),
        DatabaseService.getWorkouts(user.id, 7),
        DatabaseService.getMoodLogs(user.id, 7),
        DatabaseService.getNutritionLogs(user.id),
        DatabaseService.getGoals(user.id),
        DatabaseService.getAchievements(user.id),
        DatabaseService.getWeeklyStats(user.id)
      ]);

      setSleepData(sleepLogs);
      setWorkoutData(workouts);
      setMoodData(moodLogs);
      setNutritionData(nutritionLogs);
      setGoals(userGoals);
      setAchievements(userAchievements);

      // Calculate streak from workout data
      const streak = calculateStreak(workouts);
      setCurrentStreak(streak);

      // Generate recent activities from all data
      const activities = generateRecentActivities(workouts, sleepLogs, moodLogs, nutritionLogs);
      setRecentActivities(activities);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (workouts: any[]) => {
    if (!workouts.length) return 0;
    
    let streak = 0;
    const today = new Date();
    const sortedWorkouts = workouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toISOString().split('T')[0];
      
      const hasWorkout = sortedWorkouts.some(w => w.date === dateString);
      if (hasWorkout) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  const generateRecentActivities = (workouts: any[], sleepLogs: any[], moodLogs: any[], nutritionLogs: any[]) => {
    const activities: any[] = [];
    
    // Add recent workouts
    workouts.slice(0, 2).forEach(workout => {
      activities.push({
        type: 'workout',
        name: `${workout.type} Workout`,
        time: formatTimeAgo(workout.created_at),
        icon: Dumbbell,
        color: 'text-orange-600'
      });
    });

    // Add recent sleep logs
    sleepLogs.slice(0, 1).forEach(sleep => {
      activities.push({
        type: 'sleep',
        name: `${sleep.duration}h Quality Sleep`,
        time: formatTimeAgo(sleep.created_at),
        icon: Moon,
        color: 'text-purple-600'
      });
    });

    // Add recent mood logs
    moodLogs.slice(0, 1).forEach(mood => {
      activities.push({
        type: 'mood',
        name: `Mood: ${mood.mood}/10`,
        time: formatTimeAgo(mood.created_at),
        icon: Heart,
        color: 'text-pink-600'
      });
    });

    // Add recent nutrition logs
    nutritionLogs.slice(0, 1).forEach(nutrition => {
      activities.push({
        type: 'meal',
        name: nutrition.food_name,
        time: formatTimeAgo(nutrition.created_at),
        icon: Apple,
        color: 'text-green-600'
      });
    });

    return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 4);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const handleQuickAction = (action: string) => {
    setShowQuickActions(false);
    
    switch (action) {
      case 'workout':
        navigate('/workouts');
        break;
      case 'mood':
        navigate('/mood');
        break;
      case 'sleep':
        navigate('/sleep');
        break;
      case 'nutrition':
        navigate('/nutrition');
        break;
      default:
        break;
    }
  };

  // Calculate stats from real data
  const averageSleep = sleepData.length > 0 
    ? sleepData.reduce((sum, day) => sum + day.duration, 0) / sleepData.length 
    : 0;
  
  const averageMood = moodData.length > 0 
    ? moodData.reduce((sum, day) => sum + day.mood, 0) / moodData.length 
    : 0;

  const totalCalories = workoutData.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
  
  const todayNutrition = nutritionData.filter(n => 
    n.date === new Date().toISOString().split('T')[0]
  );
  const todayWaterGlasses = Math.min(8, Math.floor(todayNutrition.length / 2)); // Estimate

  const stats = [
    {
      name: 'Sleep Quality',
      value: averageSleep > 0 ? `${averageSleep.toFixed(1)}h` : '0h',
      change: '+12%',
      trend: 'up',
      icon: Moon,
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      description: 'Average this week'
    },
    {
      name: 'Mood Score',
      value: averageMood > 0 ? `${averageMood.toFixed(1)}/10` : '0/10',
      change: '+5%',
      trend: 'up',
      icon: Heart,
      color: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
      description: 'Feeling great!'
    },
    {
      name: 'Active Calories',
      value: totalCalories.toLocaleString(),
      change: '+8%',
      trend: 'up',
      icon: Fire,
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      description: 'This week'
    },
    {
      name: 'Hydration',
      value: `${todayWaterGlasses}/8`,
      change: '+2',
      trend: 'up',
      icon: Droplets,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      description: 'Glasses today'
    },
  ];

  const quickActions = [
    { name: 'Log Workout', icon: Dumbbell, color: 'bg-orange-500', action: 'workout' },
    { name: 'Track Mood', icon: Heart, color: 'bg-pink-500', action: 'mood' },
    { name: 'Log Sleep', icon: Moon, color: 'bg-purple-500', action: 'sleep' },
    { name: 'Add Meal', icon: Apple, color: 'bg-green-500', action: 'nutrition' },
  ];

  // Prepare chart data
  const chartData = sleepData.slice(0, 7).map((sleep, index) => ({
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index] || 'Day',
    hours: sleep.duration || 0,
    quality: sleep.quality || 0
  }));

  const workoutChartData = workoutData.slice(0, 7).map((workout, index) => ({
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index] || 'Day',
    calories: workout.calories_burned || 0,
    duration: workout.duration || 0
  }));

  // Weekly goals from real data
  const weeklyGoals = [
    { 
      name: 'Workouts', 
      current: workoutData.length, 
      target: 5, 
      color: '#f97316' 
    },
    { 
      name: 'Sleep', 
      current: averageSleep, 
      target: 8, 
      color: '#8b5cf6' 
    },
    { 
      name: 'Mood', 
      current: averageMood, 
      target: 8, 
      color: '#ec4899' 
    },
    { 
      name: 'Water', 
      current: todayWaterGlasses, 
      target: 8, 
      color: '#06b6d4' 
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Here's your fitness overview for today</p>
          {isPremium && (
            <div className="flex items-center mt-2">
              <div className="flex items-center bg-gradient-to-r from-purple-500 to-pink-600 text-white px-3 py-1 rounded-full text-sm">
                <Star className="h-4 w-4 mr-1" />
                <span className="font-medium">{planName} Member</span>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-6">
          <div className="flex items-center text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm">
            <Calendar className="h-4 w-4 mr-2" />
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <motion.button
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowQuickActions(!showQuickActions)}
          >
            <Plus className="h-5 w-5 mr-2 inline" />
            Quick Action
          </motion.button>
        </div>
      </motion.div>

      {/* Quick Actions Modal */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQuickActions(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 m-4 max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.name}
                      className={`${action.color} text-white p-4 rounded-xl flex flex-col items-center space-y-2 hover:shadow-lg transition-all duration-200`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleQuickAction(action.action)}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{action.name}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Stats Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={itemVariants}
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={stat.name} 
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 group"
              whileHover={{ y: -5, scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className={`flex items-center text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {stat.change}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">{stat.name}</h3>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Multi-metric Chart */}
        <motion.div 
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Weekly Trends</h3>
            <div className="flex space-x-2">
              {['Sleep', 'Mood'].map((metric) => (
                <button
                  key={metric}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedMetric === metric.toLowerCase()
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedMetric(metric.toLowerCase())}
                >
                  {metric}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
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
                name="Quality"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Workout Chart */}
        <motion.div 
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Workout Activity</h3>
            <Dumbbell className="h-6 w-6 text-orange-600" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workoutChartData}>
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
        </motion.div>
      </div>

      {/* Goals and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enhanced Goals */}
        <motion.div 
          className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Weekly Goals</h3>
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <div className="space-y-6">
            {weeklyGoals.map((goal, index) => {
              const progress = (goal.current / goal.target) * 100;
              return (
                <motion.div 
                  key={goal.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-semibold text-gray-700">{goal.name}</span>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {goal.current.toFixed(1)}/{goal.target} {goal.name === 'Workouts' ? 'workouts' : goal.name === 'Water' ? 'glasses' : goal.name === 'Sleep' ? 'hours' : 'score'}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <motion.div 
                        className="h-3 rounded-full transition-all duration-500"
                        style={{ backgroundColor: goal.color, width: `${Math.min(progress, 100)}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ delay: index * 0.2, duration: 0.8 }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="font-medium" style={{ color: goal.color }}>
                        {Math.round(progress)}% complete
                      </span>
                      {progress >= 100 && (
                        <motion.span 
                          className="text-green-600 font-medium flex items-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        >
                          <Star className="h-4 w-4 mr-1 fill-current" />
                          Goal Achieved!
                        </motion.span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Enhanced Recent Activities */}
        <motion.div 
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
            <Activity className="h-6 w-6 text-green-600" />
          </div>
          <div className="space-y-4">
            {recentActivities.length > 0 ? recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <motion.div 
                  key={index} 
                  className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                    <Icon className={`h-5 w-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.name}</p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {activity.time}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </motion.div>
              );
            }) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent activities</p>
                <p className="text-sm text-gray-400 mt-1">Start logging your fitness journey!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Enhanced Achievement Banner */}
      <motion.div 
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white relative overflow-hidden"
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <motion.div 
                className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
              >
                <Award className="h-10 w-10" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  {currentStreak > 0 ? `${currentStreak} Day Streak! 🎉` : 'Start Your Journey! 🚀'}
                </h3>
                <p className="text-blue-100 text-lg">
                  {currentStreak > 0 
                    ? `You've maintained a ${currentStreak}-day fitness streak!`
                    : 'Begin tracking your fitness journey today!'
                  }
                </p>
                <div className="flex items-center mt-3 space-x-4">
                  {achievements.slice(0, 3).map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                        achievement.earned ? 'bg-white/20' : 'bg-white/10'
                      }`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.2 }}
                    >
                      <span>{achievement.icon}</span>
                      <span className="font-medium">{achievement.name}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            <motion.button 
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all duration-200 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/subscription')}
            >
              {isPremium ? 'Manage Subscription' : 'Upgrade Now'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};