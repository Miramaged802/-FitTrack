import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Shield, Zap, Users } from 'lucide-react';
import { SubscriptionManagement } from '../components/SubscriptionManagement';
import { useAuth } from '../hooks/useAuth';

export const Subscription: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
          <p className="text-gray-600">You need to be signed in to manage your subscription.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-lg">
            <Crown className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Subscription Center
        </h1>
        <p className="text-gray-600 mt-2 text-lg max-w-2xl mx-auto">
          Manage your subscription, billing information, and unlock premium features to supercharge your fitness journey
        </p>
      </motion.div>

      {/* Benefits Section */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {[
          {
            icon: Zap,
            title: 'AI-Powered Recommendations',
            description: 'Get personalized workout and nutrition recommendations based on your goals and preferences',
            color: 'from-yellow-500 to-orange-600'
          },
          {
            icon: Shield,
            title: 'Advanced Analytics',
            description: 'Deep insights into your progress with detailed charts and trend analysis',
            color: 'from-green-500 to-emerald-600'
          },
          {
            icon: Users,
            title: 'Priority Support',
            description: 'Get help when you need it with our dedicated premium support team',
            color: 'from-blue-500 to-indigo-600'
          }
        ].map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <motion.div
              key={benefit.title}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${benefit.color} text-white mb-4`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-gray-600 text-sm">{benefit.description}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Subscription Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <SubscriptionManagement />
      </motion.div>
    </div>
  );
};