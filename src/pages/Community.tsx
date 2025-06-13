import React, { useState } from 'react';
import { Users, MessageCircle, Award, TrendingUp, Heart, Share2, BookOpen, Star } from 'lucide-react';

const communityPosts = [
  {
    id: 1,
    author: 'Sarah Johnson',
    avatar: 'SJ',
    time: '2 hours ago',
    content: 'Just completed my first 5K run! 🏃‍♀️ It took me 28 minutes, but I\'m so proud of myself. Thanks to everyone in this community for the motivation!',
    likes: 24,
    comments: 8,
    category: 'Fitness Achievement'
  },
  {
    id: 2,
    author: 'Mike Chen',
    avatar: 'MC',
    time: '4 hours ago',
    content: 'Week 3 of my meditation journey complete! 🧘‍♂️ Starting to notice real improvements in my stress levels and sleep quality. Anyone else doing the 30-day challenge?',
    likes: 18,
    comments: 12,
    category: 'Mental Health'
  },
  {
    id: 3,
    author: 'Emma Wilson',
    avatar: 'EW',
    time: '6 hours ago',
    content: 'Meal prep Sunday done! 🥗 Prepared healthy lunches for the entire week. Sharing my favorite quinoa bowl recipe in the comments below.',
    likes: 31,
    comments: 15,
    category: 'Nutrition'
  },
  {
    id: 4,
    author: 'David Rodriguez',
    avatar: 'DR',
    time: '1 day ago',
    content: 'Hit a new personal record on deadlifts today! 💪 185 lbs - been working towards this for months. Consistency really pays off!',
    likes: 42,
    comments: 6,
    category: 'Strength Training'
  }
];

const achievements = [
  { name: 'Early Bird', description: 'Log 7 morning workouts', icon: '🌅', earned: true },
  { name: 'Hydration Hero', description: 'Drink 8 glasses of water for 30 days', icon: '💧', earned: true },
  { name: 'Consistency King', description: 'Log activities for 100 days straight', icon: '👑', earned: false },
  { name: 'Sleep Champion', description: 'Get 8+ hours of sleep for 2 weeks', icon: '😴', earned: true },
  { name: 'Mindful Master', description: 'Complete 50 meditation sessions', icon: '🧘', earned: false },
  { name: 'Nutrition Ninja', description: 'Log meals for 60 days', icon: '🥗', earned: false }
];

const guides = [
  {
    title: 'Beginner\'s Guide to Strength Training',
    author: 'Coach Alex',
    readTime: '8 min read',
    category: 'Fitness',
    rating: 4.8,
    image: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    title: 'Meal Prep Made Simple',
    author: 'Nutritionist Lisa',
    readTime: '6 min read',
    category: 'Nutrition',
    rating: 4.9,
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    title: 'Building a Meditation Practice',
    author: 'Mindfulness Expert Tom',
    readTime: '5 min read',
    category: 'Mental Health',
    rating: 4.7,
    image: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    title: 'Sleep Optimization Strategies',
    author: 'Sleep Specialist Dr. Kim',
    readTime: '10 min read',
    category: 'Sleep',
    rating: 4.6,
    image: 'https://images.pexels.com/photos/935777/pexels-photo-935777.jpeg?auto=compress&cs=tinysrgb&w=400'
  }
];

export const Community: React.FC = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [newPost, setNewPost] = useState('');

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle post submission
    setNewPost('');
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Fitness Achievement': 'bg-orange-100 text-orange-800',
      'Mental Health': 'bg-purple-100 text-purple-800',
      'Nutrition': 'bg-green-100 text-green-800',
      'Strength Training': 'bg-red-100 text-red-800',
      'Fitness': 'bg-orange-100 text-orange-800',
      'Sleep': 'bg-blue-100 text-blue-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            Community
          </h1>
          <p className="text-gray-600 mt-2">Connect with others on their wellness journey</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'feed', name: 'Community Feed', icon: MessageCircle },
            { id: 'achievements', name: 'Achievements', icon: Award },
            { id: 'guides', name: 'Guides', icon: BookOpen }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

      {/* Community Feed */}
      {activeTab === 'feed' && (
        <div className="space-y-6">
          {/* Create Post */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handlePostSubmit}>
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share your wellness journey with the community..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={!newPost.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Share Post
                </button>
              </div>
            </form>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {communityPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{post.avatar}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{post.author}</h4>
                      <span className="text-gray-500 text-sm">•</span>
                      <span className="text-gray-500 text-sm">{post.time}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                        {post.category}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{post.content}</p>
                    <div className="flex items-center space-x-6">
                      <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors">
                        <Heart className="h-4 w-4" />
                        <span className="text-sm">{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm">{post.comments}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
                        <Share2 className="h-4 w-4" />
                        <span className="text-sm">Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Achievements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 transition-all ${
                    achievement.earned
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className={`font-semibold ${achievement.earned ? 'text-yellow-800' : 'text-gray-600'}`}>
                        {achievement.name}
                      </h4>
                      {achievement.earned && (
                        <div className="flex items-center text-yellow-600 text-sm">
                          <Award className="h-3 w-3 mr-1" />
                          Earned
                        </div>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm ${achievement.earned ? 'text-yellow-700' : 'text-gray-500'}`}>
                    {achievement.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Achievement Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Earned</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {achievements.filter(a => a.earned).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round((achievements.filter(a => a.earned).length / achievements.length) * 100)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Rank</p>
                  <p className="text-2xl font-bold text-gray-900">Gold</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guides */}
      {activeTab === 'guides' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Wellness Guides</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guides.map((guide, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <img
                    src={guide.image}
                    alt={guide.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(guide.category)}`}>
                        {guide.category}
                      </span>
                      <div className="flex items-center text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">{guide.rating}</span>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{guide.title}</h4>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>By {guide.author}</span>
                      <span>{guide.readTime}</span>
                    </div>
                    <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Read Guide
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};