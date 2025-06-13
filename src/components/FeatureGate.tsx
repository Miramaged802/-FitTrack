import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Crown, Zap, ArrowRight } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';
import { DatabaseService } from '../services/database';
import { useNavigate } from 'react-router-dom';

interface FeatureGateProps {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  showUpgrade?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  fallback,
  children,
  showUpgrade = true
}) => {
  const { user } = useAuth();
  const { hasFeatureAccess, loading, planName, isPremium } = useSubscription();
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, [feature, user]);

  const checkAccess = async () => {
    setCheckingAccess(true);
    try {
      // Check localStorage first for immediate premium access
      if (user && DatabaseService.isPremiumUser(user.id)) {
        setHasAccess(true);
        setCheckingAccess(false);
        return;
      }

      // For basic features, allow access
      const basicFeatures = ['basic_tracking', 'mood_tracking', 'sleep_tracking'];
      if (basicFeatures.includes(feature)) {
        setHasAccess(true);
        setCheckingAccess(false);
        return;
      }

      // Check subscription-based access
      const access = await hasFeatureAccess(feature);
      setHasAccess(access);
    } catch (error) {
      console.error('Error checking feature access:', error);
      // Default to allowing access to prevent blocking users
      setHasAccess(true);
    } finally {
      setCheckingAccess(false);
    }
  };

  if (loading || checkingAccess) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgrade) {
    return null;
  }

  return (
    <motion.div
      className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 text-center border border-purple-200"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full">
          <Crown className="h-8 w-8 text-white" />
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Feature</h3>
      <p className="text-gray-600 mb-6">
        This feature is available with our Premium plan. 
        You're currently on the {planName} plan.
      </p>
      
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <Lock className="h-4 w-4 mr-2" />
            <span>Feature Locked</span>
          </div>
          <div className="flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            <span>Upgrade Required</span>
          </div>
        </div>
        
        <motion.button
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center mx-auto"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/subscription')}
        >
          Upgrade Now
          <ArrowRight className="h-4 w-4 ml-2" />
        </motion.button>
      </div>
    </motion.div>
  );
};

// Usage limit component for features with limits
interface UsageLimitProps {
  feature: string;
  currentUsage: number;
  children: React.ReactNode;
  warningThreshold?: number; // Show warning when usage is above this percentage
}

export const UsageLimit: React.FC<UsageLimitProps> = ({
  feature,
  currentUsage,
  children,
  warningThreshold = 0.8
}) => {
  const { user } = useAuth();
  const { getFeatureLimit, planName } = useSubscription();
  const [limit, setLimit] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkLimit();
  }, [feature, user]);

  const checkLimit = async () => {
    try {
      // Check localStorage first for immediate premium access
      if (user && DatabaseService.isPremiumUser(user.id)) {
        setLimit(-1); // Unlimited for premium users
        setLoading(false);
        return;
      }

      const featureLimit = await getFeatureLimit(feature);
      setLimit(featureLimit);
    } catch (error) {
      console.error('Error checking feature limit:', error);
      // Default to unlimited to prevent blocking users
      setLimit(-1);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <>{children}</>;
  }

  // -1 means unlimited
  if (limit === -1) {
    return <>{children}</>;
  }

  const usagePercentage = limit > 0 ? currentUsage / limit : 0;
  const isAtLimit = currentUsage >= limit;
  const isNearLimit = usagePercentage >= warningThreshold;

  if (isAtLimit) {
    return (
      <motion.div
        className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 text-center border border-orange-200"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-orange-500 rounded-full">
            <Lock className="h-6 w-6 text-white" />
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">Usage Limit Reached</h3>
        <p className="text-gray-600 mb-4">
          You've reached your {feature.replace('_', ' ')} limit of {limit} for the {planName} plan.
        </p>
        
        <motion.button
          className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2 rounded-lg font-medium flex items-center mx-auto"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/subscription')}
        >
          Upgrade Plan
          <ArrowRight className="h-4 w-4 ml-2" />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {isNearLimit && (
        <motion.div
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg mr-3">
              <Zap className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Approaching Usage Limit
              </p>
              <p className="text-sm text-yellow-700">
                {currentUsage} of {limit} {feature.replace('_', ' ')} used. Consider upgrading for unlimited access.
              </p>
            </div>
            <button
              onClick={() => navigate('/subscription')}
              className="text-yellow-600 hover:text-yellow-700 font-medium text-sm"
            >
              Upgrade
            </button>
          </div>
        </motion.div>
      )}
      
      {children}
      
      {/* Usage indicator */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>{feature.replace('_', ' ')} Usage</span>
          <span>{currentUsage} / {limit === -1 ? '∞' : limit}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full transition-all duration-300 ${
              isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(usagePercentage * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};