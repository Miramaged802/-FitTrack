import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Zap, 
  Heart, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target, 
  Flame,
  User,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Star,
  TrendingUp,
  Shield
} from 'lucide-react';
import { grokWorkoutService } from '../services/grokApi';
import toast from 'react-hot-toast';

interface UserHealthProfile {
  allergies: string[];
  healthConditions: string[];
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  age: number;
  weight: number;
  height: number;
  goals: string[];
  previousInjuries: string[];
  medications: string[];
  availableTime: number;
  preferredWorkoutTypes: string[];
  equipment: string[];
}

interface WorkoutRecommendation {
  id: string;
  name: string;
  description: string;
  duration: number;
  difficulty: 'easy' | 'moderate' | 'hard';
  exercises: Exercise[];
  cautions: string[];
  benefits: string[];
  modifications: string[];
  estimatedCalories: number;
  targetMuscleGroups: string[];
  reasoning: string;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  duration?: number;
  restTime: number;
  instructions: string[];
  modifications: string[];
  targetMuscles: string[];
}

interface AIWorkoutRecommendationsProps {
  currentMood?: number;
  energyLevel?: number;
  stressLevel?: number;
}

export const AIWorkoutRecommendations: React.FC<AIWorkoutRecommendationsProps> = ({
  currentMood = 7,
  energyLevel = 6,
  stressLevel = 4
}) => {
  const [userProfile, setUserProfile] = useState<UserHealthProfile>({
    allergies: [],
    healthConditions: [],
    fitnessLevel: 'intermediate',
    age: 28,
    weight: 165,
    height: 70,
    goals: ['Build muscle', 'Improve endurance'],
    previousInjuries: [],
    medications: [],
    availableTime: 45,
    preferredWorkoutTypes: ['Strength training', 'HIIT'],
    equipment: ['Dumbbells', 'Resistance bands']
  });

  const [recommendation, setRecommendation] = useState<WorkoutRecommendation | null>(null);
  const [nutritionAdvice, setNutritionAdvice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [activeTimer, setActiveTimer] = useState<{ isRunning: boolean; time: number; exercise: string } | null>(null);

  const commonAllergies = ['Latex', 'Dust', 'Pollen', 'Pet dander', 'Food allergies'];
  const commonConditions = ['Asthma', 'Diabetes', 'High blood pressure', 'Heart condition', 'Arthritis', 'Back problems'];
  const commonGoals = ['Weight loss', 'Build muscle', 'Improve endurance', 'Increase flexibility', 'Stress relief', 'Better sleep'];
  const commonEquipment = ['Dumbbells', 'Resistance bands', 'Yoga mat', 'Pull-up bar', 'Kettlebell', 'Treadmill'];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer?.isRunning) {
      interval = setInterval(() => {
        setActiveTimer(prev => prev ? { ...prev, time: prev.time + 1 } : null);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer?.isRunning]);

  const generateRecommendation = async () => {
    setIsLoading(true);
    try {
      const workoutRec = await grokWorkoutService.generateWorkoutRecommendation(
        userProfile,
        currentMood,
        energyLevel,
        stressLevel
      );
      
      setRecommendation(workoutRec);
      
      // Get nutrition advice
      const nutrition = await grokWorkoutService.generateNutritionAdvice(userProfile, workoutRec);
      setNutritionAdvice(nutrition);
      
      toast.success('AI workout recommendation generated!');
    } catch (error) {
      toast.error('Failed to generate recommendation. Please try again.');
      console.error('Error generating recommendation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startExerciseTimer = (exerciseName: string) => {
    setActiveTimer({ isRunning: true, time: 0, exercise: exerciseName });
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const updateProfile = (field: keyof UserHealthProfile, value: any) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof UserHealthProfile, item: string) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(item)
        ? (prev[field] as string[]).filter(i => i !== item)
        : [...(prev[field] as string[]), item]
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center">
            <Brain className="h-8 w-8 text-blue-600 mr-3" />
            AI Workout Recommendations
          </h2>
          <p className="text-gray-600 mt-2">Personalized workouts based on your health profile and current state</p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-4">
          <motion.button
            onClick={() => setShowProfileForm(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Health Profile
          </motion.button>
          <motion.button
            onClick={generateRecommendation}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </div>
            ) : (
              <div className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Get AI Recommendation
              </div>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Current State Display */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {[
          { name: 'Mood', value: currentMood, icon: Heart, color: 'from-pink-500 to-rose-600' },
          { name: 'Energy', value: energyLevel, icon: Zap, color: 'from-yellow-500 to-orange-600' },
          { name: 'Stress', value: stressLevel, icon: Brain, color: 'from-blue-500 to-indigo-600' }
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={metric.name} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-4">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${metric.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Current {metric.name}</p>
                  <p className="text-xl font-bold text-gray-900">{metric.value}/10</p>
                </div>
              </div>
            </div>
          );
        })}
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
                <h3 className="text-lg font-semibold">{activeTimer.exercise}</h3>
                <p className="text-orange-100">Exercise in progress</p>
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

      {/* Workout Recommendation */}
      <AnimatePresence>
        {recommendation && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Recommendation Header */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{recommendation.name}</h3>
                  <p className="text-gray-600 mb-4">{recommendation.description}</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-500 mr-1" />
                      {recommendation.duration} minutes
                    </div>
                    <div className="flex items-center">
                      <Flame className="h-4 w-4 text-orange-500 mr-1" />
                      ~{recommendation.estimatedCalories} calories
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recommendation.difficulty)}`}>
                      {recommendation.difficulty}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-blue-600 mb-2">
                    <Star className="h-5 w-5 mr-1" />
                    <span className="font-semibold">AI Recommended</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Target: {recommendation.targetMuscleGroups.join(', ')}
                  </div>
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <Brain className="h-4 w-4 mr-2" />
                  AI Analysis
                </h4>
                <p className="text-blue-800 text-sm">{recommendation.reasoning}</p>
              </div>

              {/* Health Cautions */}
              {recommendation.cautions.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Important Cautions
                  </h4>
                  <ul className="text-yellow-800 text-sm space-y-1">
                    {recommendation.cautions.map((caution, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        {caution}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Expected Benefits
                </h4>
                <ul className="text-green-800 text-sm space-y-1">
                  {recommendation.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Exercises */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-6">Workout Exercises</h4>
              <div className="space-y-6">
                {recommendation.exercises.map((exercise, index) => (
                  <motion.div
                    key={index}
                    className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="text-lg font-semibold text-gray-900">{exercise.name}</h5>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span>{exercise.sets} sets</span>
                          <span>{exercise.reps} reps</span>
                          <span>{exercise.restTime}s rest</span>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => startExerciseTimer(exercise.name)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </motion.button>
                    </div>

                    <div className="mb-3">
                      <h6 className="font-medium text-gray-700 mb-2">Instructions:</h6>
                      <ol className="text-sm text-gray-600 space-y-1">
                        {exercise.instructions.map((instruction, i) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-2 text-blue-600 font-medium">{i + 1}.</span>
                            {instruction}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {exercise.modifications.length > 0 && (
                      <div className="mb-3">
                        <h6 className="font-medium text-gray-700 mb-2">Modifications:</h6>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {exercise.modifications.map((mod, i) => (
                            <li key={i} className="flex items-start">
                              <span className="mr-2">•</span>
                              {mod}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {exercise.targetMuscles.map((muscle, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Nutrition Advice */}
            {nutritionAdvice && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-green-600" />
                  Personalized Nutrition Advice
                </h4>
                <div className="prose prose-sm max-w-none text-gray-700">
                  {nutritionAdvice.split('\n').map((line, index) => (
                    <p key={index} className="mb-2">{line}</p>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Health Profile Form Modal */}
      <AnimatePresence>
        {showProfileForm && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <User className="h-6 w-6 mr-2" />
                Health Profile Setup
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                      <input
                        type="number"
                        value={userProfile.age}
                        onChange={(e) => updateProfile('age', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
                      <input
                        type="number"
                        value={userProfile.weight}
                        onChange={(e) => updateProfile('weight', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (inches)</label>
                    <input
                      type="number"
                      value={userProfile.height}
                      onChange={(e) => updateProfile('height', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fitness Level</label>
                    <select
                      value={userProfile.fitnessLevel}
                      onChange={(e) => updateProfile('fitnessLevel', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Available Time (minutes)</label>
                    <input
                      type="number"
                      value={userProfile.availableTime}
                      onChange={(e) => updateProfile('availableTime', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Health Conditions */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700">Health Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                    <div className="space-y-2">
                      {commonAllergies.map(allergy => (
                        <label key={allergy} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={userProfile.allergies.includes(allergy)}
                            onChange={() => toggleArrayItem('allergies', allergy)}
                            className="mr-2"
                          />
                          <span className="text-sm">{allergy}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Health Conditions</label>
                    <div className="space-y-2">
                      {commonConditions.map(condition => (
                        <label key={condition} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={userProfile.healthConditions.includes(condition)}
                            onChange={() => toggleArrayItem('healthConditions', condition)}
                            className="mr-2"
                          />
                          <span className="text-sm">{condition}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Goals */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700">Fitness Goals</h4>
                  <div className="space-y-2">
                    {commonGoals.map(goal => (
                      <label key={goal} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={userProfile.goals.includes(goal)}
                          onChange={() => toggleArrayItem('goals', goal)}
                          className="mr-2"
                        />
                        <span className="text-sm">{goal}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Equipment */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700">Available Equipment</h4>
                  <div className="space-y-2">
                    {commonEquipment.map(equipment => (
                      <label key={equipment} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={userProfile.equipment.includes(equipment)}
                          onChange={() => toggleArrayItem('equipment', equipment)}
                          className="mr-2"
                        />
                        <span className="text-sm">{equipment}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <motion.button
                  onClick={() => setShowProfileForm(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowProfileForm(false);
                    toast.success('Health profile updated!');
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Save Profile
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};