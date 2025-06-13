import React, { useState, useEffect } from 'react';
import { Apple, Plus, Search, Utensils, TrendingUp, Target } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { FeatureGate, UsageLimit } from '../components/FeatureGate';
import { DatabaseService } from '../services/database';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import toast from 'react-hot-toast';

const popularFoods = [
  { name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0 },
  { name: 'Chicken Breast (100g)', calories: 165, protein: 31, carbs: 0, fat: 4 },
  { name: 'Brown Rice (1 cup)', calories: 216, protein: 5, carbs: 45, fat: 2 },
  { name: 'Avocado (1 medium)', calories: 234, protein: 3, carbs: 12, fat: 21 },
  { name: 'Greek Yogurt (1 cup)', calories: 130, protein: 23, carbs: 9, fat: 0 },
  { name: 'Almonds (28g)', calories: 164, protein: 6, carbs: 6, fat: 14 },
];

export const NutritionTracking: React.FC = () => {
  const { user } = useAuth();
  const { getFeatureLimit } = useSubscription();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [nutritionData, setNutritionData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [nutritionLimit, setNutritionLimit] = useState(0);
  const [newMeal, setNewMeal] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    mealType: 'breakfast'
  });

  useEffect(() => {
    if (user) {
      loadNutritionData();
      loadNutritionLimit();
    }
  }, [user]);

  const loadNutritionData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [todayLogs, allLogs] = await Promise.all([
        DatabaseService.getNutritionLogs(user.id, today),
        DatabaseService.getNutritionLogs(user.id)
      ]);
      
      setNutritionData(todayLogs);
      
      // Generate weekly data
      const weeklyStats = generateWeeklyData(allLogs);
      setWeeklyData(weeklyStats);
    } catch (error) {
      console.error('Error loading nutrition data:', error);
      toast.error('Failed to load nutrition data');
    } finally {
      setLoading(false);
    }
  };

  const loadNutritionLimit = async () => {
    if (!user) return;
    
    try {
      const limit = await getFeatureLimit('nutrition_logging');
      setNutritionLimit(limit);
    } catch (error) {
      console.error('Error loading nutrition limit:', error);
    }
  };

  const generateWeeklyData = (logs: any[]) => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const dayLogs = logs.filter(log => log.date === dateString);
      const totalCalories = dayLogs.reduce((sum, log) => sum + log.calories, 0);
      
      last7Days.push({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        calories: totalCalories,
        target: 2200
      });
    }
    return last7Days;
  };

  const calorieGoal = 2200;
  const proteinGoal = 130;
  const carbGoal = 275;
  const fatGoal = 75;

  // Calculate today's totals
  const todaysData = {
    calories: nutritionData.reduce((sum, item) => sum + item.calories, 0),
    protein: nutritionData.reduce((sum, item) => sum + item.protein, 0),
    carbs: nutritionData.reduce((sum, item) => sum + item.carbs, 0),
    fat: nutritionData.reduce((sum, item) => sum + item.fat, 0)
  };

  const macroData = [
    { name: 'Protein', value: todaysData.protein * 4, color: '#ef4444' },
    { name: 'Carbs', value: todaysData.carbs * 4, color: '#3b82f6' },
    { name: 'Fat', value: todaysData.fat * 9, color: '#f59e0b' },
  ];

  const recentMeals = nutritionData.slice(0, 4).map(meal => ({
    name: meal.food_name,
    time: new Date(meal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    calories: meal.calories,
    type: meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to log nutrition');
      return;
    }

    // Check nutrition limit
    if (nutritionLimit !== -1 && nutritionData.length >= nutritionLimit) {
      toast.error(`You've reached your nutrition limit of ${nutritionLimit}. Upgrade to log more meals.`);
      return;
    }

    try {
      const nutritionLog = await DatabaseService.createNutritionLog({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        meal_type: newMeal.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        food_name: newMeal.name,
        calories: parseInt(newMeal.calories),
        protein: parseFloat(newMeal.protein) || 0,
        carbs: parseFloat(newMeal.carbs) || 0,
        fat: parseFloat(newMeal.fat) || 0,
        fiber: 0
      });

      if (nutritionLog) {
        toast.success('Nutrition entry logged successfully!');
        setShowAddForm(false);
        setNewMeal({ name: '', calories: '', protein: '', carbs: '', fat: '', mealType: 'breakfast' });
        loadNutritionData(); // Reload data
      } else {
        toast.error('Failed to log nutrition entry');
      }
    } catch (error) {
      console.error('Error logging nutrition:', error);
      toast.error('Failed to log nutrition entry');
    }
  };

  const addQuickFood = (food: typeof popularFoods[0]) => {
    // Check nutrition limit
    if (nutritionLimit !== -1 && nutritionData.length >= nutritionLimit) {
      toast.error(`You've reached your nutrition limit of ${nutritionLimit}. Upgrade to log more meals.`);
      return;
    }

    setNewMeal({
      name: food.name,
      calories: food.calories.toString(),
      protein: food.protein.toString(),
      carbs: food.carbs.toString(),
      fat: food.fat.toString(),
      mealType: 'snack'
    });
    setShowAddForm(true);
  };

  const filteredFoods = popularFoods.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <FeatureGate feature="nutrition_logging">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Apple className="h-8 w-8 text-green-600 mr-3" />
              Nutrition Tracking
            </h1>
            <p className="text-gray-600 mt-2">Monitor your daily nutrition and reach your health goals</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 lg:mt-0 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Food
          </button>
        </div>

        {/* Daily Overview with Usage Limit */}
        <UsageLimit feature="nutrition_logging" currentUsage={nutritionData.length}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calorie Progress */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Today's Progress</h3>
              <div className="space-y-6">
                {/* Calories */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Calories</span>
                    <span className="text-sm text-gray-500">
                      {todaysData.calories} / {calorieGoal} kcal
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((todaysData.calories / calorieGoal) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Macros */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Protein</span>
                      <span className="text-sm text-gray-500">{todaysData.protein.toFixed(1)}g</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((todaysData.protein / proteinGoal) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Carbs</span>
                      <span className="text-sm text-gray-500">{todaysData.carbs.toFixed(1)}g</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((todaysData.carbs / carbGoal) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Fat</span>
                      <span className="text-sm text-gray-500">{todaysData.fat.toFixed(1)}g</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((todaysData.fat / fatGoal) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Macro Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Macro Distribution</h3>
              {macroData.some(m => m.value > 0) ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={macroData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {macroData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${Math.round(value)} kcal`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-4">
                    {macroData.map((macro, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: macro.color }}
                          />
                          <span className="text-sm text-gray-700">{macro.name}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round(macro.value)} kcal
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Apple className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No nutrition data today</p>
                    <p className="text-sm">Start logging your meals</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </UsageLimit>

        {/* Weekly Calories Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Weekly Calorie Intake</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="calories" fill="#10b981" radius={[4, 4, 0, 0]} name="Calories" />
              <Bar dataKey="target" fill="#e5e7eb" radius={[4, 4, 0, 0]} name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Meals and Quick Add */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Meals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Today's Meals</h3>
            {recentMeals.length > 0 ? (
              <div className="space-y-4">
                {recentMeals.map((meal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Utensils className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{meal.name}</h4>
                        <p className="text-sm text-gray-500">{meal.type} • {meal.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{meal.calories} kcal</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No meals logged today</p>
                <p className="text-sm text-gray-400 mt-1">Start tracking your nutrition</p>
              </div>
            )}
          </div>

          {/* Quick Add Foods */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Add Foods</h3>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search foods..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredFoods.map((food, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => addQuickFood(food)}
                >
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">{food.name}</h4>
                    <p className="text-xs text-gray-500">
                      {food.calories} kcal • P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                    </p>
                  </div>
                  <Plus className="h-4 w-4 text-green-600" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add Food Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Food Entry</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Food Name
                  </label>
                  <input
                    type="text"
                    value={newMeal.name}
                    onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meal Type
                  </label>
                  <select
                    value={newMeal.mealType}
                    onChange={(e) => setNewMeal({ ...newMeal, mealType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calories
                    </label>
                    <input
                      type="number"
                      value={newMeal.calories}
                      onChange={(e) => setNewMeal({ ...newMeal, calories: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      value={newMeal.protein}
                      onChange={(e) => setNewMeal({ ...newMeal, protein: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      value={newMeal.carbs}
                      onChange={(e) => setNewMeal({ ...newMeal, carbs: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fat (g)
                    </label>
                    <input
                      type="number"
                      value={newMeal.fat}
                      onChange={(e) => setNewMeal({ ...newMeal, fat: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add Food
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
};