import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Edit, Camera, Award, Activity, Calendar, TrendingUp, Crown, Mail, Phone, MapPin, Heart, Dumbbell, AlertTriangle, Pill, Target, Clock, CheckCircle, Save } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { DatabaseService } from '../services/database';
import toast from 'react-hot-toast';

const userStats = [
  { label: 'Days Active', value: '127', icon: Calendar },
  { label: 'Workouts Completed', value: '89', icon: Activity },
  { label: 'Goals Achieved', value: '12', icon: Award },
  { label: 'Streak', value: '15 days', icon: TrendingUp }
];

const recentActivity = [
  { type: 'workout', description: 'Completed HIIT workout', date: '2024-01-07', duration: '25 min' },
  { type: 'nutrition', description: 'Logged healthy breakfast', date: '2024-01-07', calories: '320 kcal' },
  { type: 'sleep', description: 'Slept 8.2 hours', date: '2024-01-06', quality: '9/10' },
  { type: 'mood', description: 'Mood check-in completed', date: '2024-01-06', mood: '8/10' },
  { type: 'goal', description: 'Reached daily step goal', date: '2024-01-05', steps: '10,247' }
];

// Health profile options matching database schema
const fitnessLevels = ['beginner', 'intermediate', 'advanced'];
const commonAllergies = ['None', 'Peanuts', 'Tree nuts', 'Dairy', 'Gluten', 'Shellfish', 'Eggs', 'Soy', 'Fish', 'Sesame'];
const commonHealthConditions = ['None', 'Diabetes', 'High blood pressure', 'Heart disease', 'Asthma', 'Arthritis', 'Back problems', 'Anxiety', 'Depression'];
const commonMedications = ['None', 'Blood pressure medication', 'Diabetes medication', 'Pain relievers', 'Antidepressants', 'Allergy medication', 'Vitamins/Supplements'];
const commonInjuries = ['None', 'Knee injury', 'Back injury', 'Shoulder injury', 'Ankle injury', 'Wrist injury', 'Hip injury'];
const workoutTypes = ['Cardio', 'Strength training', 'Yoga', 'Pilates', 'HIIT', 'Running', 'Swimming', 'Cycling', 'Dancing', 'Martial arts'];
const equipmentOptions = ['None', 'Dumbbells', 'Resistance bands', 'Yoga mat', 'Treadmill', 'Exercise bike', 'Pull-up bar', 'Kettlebells', 'Barbell', 'Home gym'];
const fitnessGoals = ['Weight loss', 'Build muscle', 'Improve endurance', 'Increase flexibility', 'Better sleep', 'Stress relief', 'General fitness', 'Athletic performance'];

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const { subscription, planName, isPremium } = useSubscription();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'health' | 'fitness'>('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [profile, setProfile] = useState({
    // Basic Information - matching database schema exactly
    name: '',
    email: '',
    age: '',
    height: '',
    weight: '',
    bio: '',
    
    // Health Information - matching database arrays
    fitness_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    allergies: [] as string[],
    health_conditions: [] as string[],
    medications: [] as string[],
    previous_injuries: [] as string[],
    
    // Fitness Information - matching database arrays
    goals: [] as string[],
    preferred_workout_types: [] as string[],
    available_equipment: [] as string[]
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const profileData = await DatabaseService.getProfile(user.id);
      if (profileData) {
        setProfile({
          name: profileData.name || '',
          email: profileData.email || user.email || '',
          age: profileData.age?.toString() || '',
          height: profileData.height?.toString() || '',
          weight: profileData.weight?.toString() || '',
          bio: profileData.bio || '',
          fitness_level: profileData.fitness_level || 'beginner',
          allergies: profileData.allergies || [],
          health_conditions: profileData.health_conditions || [],
          medications: profileData.medications || [],
          previous_injuries: profileData.previous_injuries || [],
          goals: profileData.goals || [],
          preferred_workout_types: profileData.preferred_workout_types || [],
          available_equipment: profileData.available_equipment || []
        });
      } else {
        // Set default values from auth user
        setProfile(prev => ({
          ...prev,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || ''
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setShowSaveSuccess(false);
    
    try {
      // Prepare data exactly matching database schema
      const updates = {
        name: profile.name,
        email: profile.email,
        age: profile.age ? parseInt(profile.age) : null,
        height: profile.height ? parseInt(profile.height) : null,
        weight: profile.weight ? parseInt(profile.weight) : null,
        bio: profile.bio,
        fitness_level: profile.fitness_level,
        allergies: profile.allergies,
        health_conditions: profile.health_conditions,
        medications: profile.medications,
        previous_injuries: profile.previous_injuries,
        goals: profile.goals,
        preferred_workout_types: profile.preferred_workout_types,
        available_equipment: profile.available_equipment
      };

      const updatedProfile = await DatabaseService.updateProfile(user.id, updates);
      
      if (updatedProfile) {
        // Show success animation
        setShowSaveSuccess(true);
        toast.success('Health profile updated successfully!');
        
        // Auto-hide success animation after 3 seconds
        setTimeout(() => {
          setShowSaveSuccess(false);
          setIsEditing(false);
        }, 3000);
      } else {
        // Try creating profile if update failed
        const newProfile = await DatabaseService.createProfile({
          user_id: user.id,
          ...updates
        });
        
        if (newProfile) {
          setShowSaveSuccess(true);
          toast.success('Health profile created successfully!');
          
          setTimeout(() => {
            setShowSaveSuccess(false);
            setIsEditing(false);
          }, 3000);
        } else {
          toast.error('Failed to save profile');
        }
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleArrayItem = (field: keyof typeof profile, item: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(item)
        ? (prev[field] as string[]).filter(i => i !== item)
        : [...(prev[field] as string[]), item]
    }));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'workout': return '💪';
      case 'nutrition': return '🍎';
      case 'sleep': return '😴';
      case 'mood': return '😊';
      case 'goal': return '🎯';
      default: return '📊';
    }
  };

  const getUserInitials = () => {
    const name = profile.name || 'User';
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getCompletionPercentage = () => {
    const fields = [
      profile.name, profile.email, profile.age, profile.height, profile.weight,
      profile.fitness_level, profile.goals.length > 0, profile.preferred_workout_types.length > 0
    ];
    const completed = fields.filter(field => field && field !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
              className="bg-white rounded-2xl p-8 shadow-2xl border border-green-200"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="text-center">
                <motion.div
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 15 }}
                >
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </motion.div>
                <motion.h3
                  className="text-xl font-bold text-gray-900 mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Profile Saved Successfully!
                </motion.h3>
                <motion.p
                  className="text-gray-600"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Your health profile has been updated and saved to the database.
                </motion.p>
                <motion.div
                  className="mt-4 flex items-center justify-center space-x-2 text-sm text-green-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Data synced to database</span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <User className="h-8 w-8 text-blue-600 mr-3" />
            Health Profile
          </h1>
          <p className="text-gray-600 mt-2">Manage your personal information and health profile for better recommendations</p>
          
          {/* Profile Completion */}
          <div className="mt-4 flex items-center space-x-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
              <motion.div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${getCompletionPercentage()}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600">
              {getCompletionPercentage()}% Complete
            </span>
          </div>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-4">
          {isPremium && (
            <div className="flex items-center bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg">
              <Crown className="h-4 w-4 mr-2" />
              <span className="font-medium">{planName} Member</span>
            </div>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
          >
            <Edit className="h-5 w-5 mr-2" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6 lg:mb-0">
            <div className="relative">
              <div className="h-32 w-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-3xl">{getUserInitials()}</span>
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <Camera className="h-4 w-4 text-gray-600" />
                </button>
              )}
            </div>
            <div className="mt-4 text-center">
              <h2 className="text-xl font-bold text-gray-900">{profile.name || 'User'}</h2>
              <div className="flex items-center justify-center mt-2">
                {isPremium ? (
                  <div className="flex items-center bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full">
                    <Crown className="h-4 w-4 mr-1" />
                    <span className="font-medium">{planName}</span>
                  </div>
                ) : (
                  <span className="text-gray-500">Free Member</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{profile.age || '--'}</div>
                <div className="text-sm text-gray-600">Age</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{profile.height || '--'}"</div>
                <div className="text-sm text-gray-600">Height</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{profile.weight || '--'} lbs</div>
                <div className="text-sm text-gray-600">Weight</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 capitalize">{profile.fitness_level}</div>
                <div className="text-sm text-gray-600">Fitness Level</div>
              </div>
            </div>

            {/* Health Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <Target className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium text-gray-900">Goals</span>
                </div>
                <div className="text-sm text-gray-600">
                  {profile.goals.length > 0 ? profile.goals.slice(0, 2).join(', ') + (profile.goals.length > 2 ? '...' : '') : 'No goals set'}
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="font-medium text-gray-900">Health Conditions</span>
                </div>
                <div className="text-sm text-gray-600">
                  {profile.health_conditions.length > 0 ? profile.health_conditions.slice(0, 2).join(', ') : 'None reported'}
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <Dumbbell className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-gray-900">Preferred Workouts</span>
                </div>
                <div className="text-sm text-gray-600">
                  {profile.preferred_workout_types.length > 0 ? profile.preferred_workout_types.slice(0, 2).join(', ') : 'Not specified'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editing Interface */}
      {isEditing && (
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'basic', name: 'Basic Info', icon: User },
                { id: 'health', name: 'Health Profile', icon: Heart },
                { id: 'fitness', name: 'Fitness Goals', icon: Dumbbell }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'basic' && (
              <motion.div
                key="basic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                        placeholder="Enter your email"
                      />
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                    <input
                      type="number"
                      value={profile.age}
                      onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your age"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Height (inches)</label>
                    <input
                      type="number"
                      value={profile.height}
                      onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your height"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight (lbs)</label>
                    <input
                      type="number"
                      value={profile.weight}
                      onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your weight"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fitness Level</label>
                    <select
                      value={profile.fitness_level}
                      onChange={(e) => setProfile({ ...profile, fitness_level: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {fitnessLevels.map(level => (
                        <option key={level} value={level} className="capitalize">{level}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Tell us about yourself and your fitness journey"
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'health' && (
              <motion.div
                key="health"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">Health Profile</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Allergies</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {commonAllergies.map(allergy => (
                      <label key={allergy} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.allergies.includes(allergy)}
                          onChange={() => toggleArrayItem('allergies', allergy)}
                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{allergy}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Health Conditions</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {commonHealthConditions.map(condition => (
                      <label key={condition} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.health_conditions.includes(condition)}
                          onChange={() => toggleArrayItem('health_conditions', condition)}
                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{condition}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Current Medications</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {commonMedications.map(medication => (
                      <label key={medication} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.medications.includes(medication)}
                          onChange={() => toggleArrayItem('medications', medication)}
                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{medication}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Previous Injuries</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {commonInjuries.map(injury => (
                      <label key={injury} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.previous_injuries.includes(injury)}
                          onChange={() => toggleArrayItem('previous_injuries', injury)}
                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{injury}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'fitness' && (
              <motion.div
                key="fitness"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">Fitness Goals & Preferences</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Fitness Goals</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {fitnessGoals.map(goal => (
                      <label key={goal} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.goals.includes(goal)}
                          onChange={() => toggleArrayItem('goals', goal)}
                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{goal}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Workout Types</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {workoutTypes.map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.preferred_workout_types.includes(type)}
                          onChange={() => toggleArrayItem('preferred_workout_types', type)}
                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Available Equipment</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {equipmentOptions.map(equipment => (
                      <label key={equipment} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.available_equipment.includes(equipment)}
                          onChange={() => toggleArrayItem('available_equipment', equipment)}
                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{equipment}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save/Cancel Buttons */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <motion.button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center relative overflow-hidden"
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
            >
              {saving ? (
                <>
                  <motion.div
                    className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Saving to Database...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Health Profile
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
            <button
              onClick={() => setIsEditing(false)}
              disabled={saving}
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {userStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={index} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <motion.div 
              key={index} 
              className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="text-2xl">{getActivityIcon(activity.type)}</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{activity.description}</h4>
                <p className="text-sm text-gray-500">{activity.date}</p>
              </div>
              <div className="text-right text-sm text-gray-600">
                {activity.duration && <p>{activity.duration}</p>}
                {activity.calories && <p>{activity.calories}</p>}
                {activity.quality && <p>Quality: {activity.quality}</p>}
                {activity.mood && <p>Mood: {activity.mood}</p>}
                {activity.steps && <p>{activity.steps} steps</p>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};