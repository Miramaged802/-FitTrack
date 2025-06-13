import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Star, Users, Shield } from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import toast from 'react-hot-toast';

interface Plan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price: number;
  interval_type: 'month' | 'year';
  features: Record<string, any>;
  is_popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'free',
    display_name: 'Free',
    description: 'Perfect for getting started with basic fitness tracking',
    price: 0,
    interval_type: 'month',
    features: {
      workouts: 10,
      ai_recommendations: 2,
      basic_tracking: true,
      community_access: true
    }
  },
  {
    id: 'premium',
    name: 'premium',
    display_name: 'Premium',
    description: 'Full access to all features with unlimited usage',
    price: 9.99,
    interval_type: 'month',
    features: {
      workouts: -1,
      ai_recommendations: -1,
      advanced_analytics: true,
      priority_support: true,
      custom_workouts: true
    },
    is_popular: true
  },
  {
    id: 'premium_yearly',
    name: 'premium_yearly',
    display_name: 'Premium Yearly',
    description: 'Full access with yearly discount - save 20%!',
    price: 99.99,
    interval_type: 'year',
    features: {
      workouts: -1,
      ai_recommendations: -1,
      advanced_analytics: true,
      priority_support: true,
      custom_workouts: true,
      yearly_discount: true
    }
  }
];

interface SubscriptionPlansProps {
  onPlanSelect?: (planId: string, billingCycle: 'monthly' | 'yearly') => void;
  currentPlanId?: string;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  onPlanSelect,
  currentPlanId
}) => {
  const { user } = useAuth();
  const { subscription, refreshSubscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handlePlanSelect = (plan: Plan) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return;
    }

    if (plan.id === currentPlanId || plan.id === subscription?.plan_id) {
      toast.info('You are already on this plan');
      return;
    }

    if (plan.price === 0) {
      // Free plan - handle directly
      toast.success('Switched to Free plan!');
      return;
    }

    // Paid plan - show payment modal
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    toast.success(`Successfully upgraded to ${selectedPlan?.display_name}!`);
    refreshSubscription();
    setShowPaymentModal(false);
    setSelectedPlan(null);
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'free': return <Zap className="h-6 w-6" />;
      case 'premium': return <Crown className="h-6 w-6" />;
      case 'premium_yearly': return <Star className="h-6 w-6" />;
      default: return <Shield className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'free': return 'from-gray-500 to-gray-600';
      case 'premium': return 'from-purple-500 to-pink-600';
      case 'premium_yearly': return 'from-orange-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getFeatureList = (plan: Plan) => {
    const features = [];
    
    if (plan.features.workouts === -1) {
      features.push('Unlimited workout logging');
    } else {
      features.push(`${plan.features.workouts} workouts/month`);
    }
    
    if (plan.features.ai_recommendations === -1) {
      features.push('Unlimited AI recommendations');
    } else if (plan.features.ai_recommendations > 0) {
      features.push(`${plan.features.ai_recommendations} AI recommendations/month`);
    }
    
    features.push('Sleep & mood tracking');
    features.push('Nutrition logging');
    
    if (plan.features.advanced_analytics) {
      features.push('Advanced analytics & insights');
    }
    
    if (plan.features.priority_support) {
      features.push('Priority customer support');
    }
    
    if (plan.features.custom_workouts) {
      features.push('Custom workout plans');
    }
    
    if (plan.features.yearly_discount) {
      features.push('20% yearly savings');
    }
    
    if (plan.features.basic_tracking) {
      features.push('Basic fitness tracking');
    }
    
    if (plan.features.community_access) {
      features.push('Community access');
    }
    
    return features;
  };

  const isCurrentPlan = (plan: Plan) => {
    return plan.id === currentPlanId || plan.id === subscription?.plan_id;
  };

  const getMonthlyPrice = (plan: Plan) => {
    if (plan.interval_type === 'year') {
      return plan.price / 12;
    }
    return plan.price;
  };

  return (
    <div className="space-y-8">
      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, index) => {
          const features = getFeatureList(plan);
          const isCurrentPlanSelected = isCurrentPlan(plan);
          const isPopular = plan.is_popular;
          const monthlyPrice = getMonthlyPrice(plan);

          return (
            <motion.div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                isPopular ? 'border-purple-500 scale-105' : 'border-gray-200 hover:border-gray-300'
              } ${isCurrentPlanSelected ? 'ring-2 ring-blue-500' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlanSelected && (
                <div className="absolute -top-4 right-4">
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${getPlanColor(plan.name)} text-white mb-4`}>
                    {getPlanIcon(plan.name)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.display_name}</h3>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                {/* Pricing */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.price === 0 ? 'Free' : `$${plan.price.toFixed(0)}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-500 ml-1">
                        /{plan.interval_type}
                      </span>
                    )}
                  </div>
                  {plan.interval_type === 'year' && plan.price > 0 && (
                    <p className="text-green-600 text-sm font-medium mt-1">
                      Save 20% annually
                    </p>
                  )}
                  {plan.interval_type === 'year' && plan.price > 0 && (
                    <p className="text-gray-500 text-sm mt-1">
                      ${monthlyPrice.toFixed(2)}/month billed annually
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <motion.button
                  onClick={() => handlePlanSelect(plan)}
                  disabled={isCurrentPlanSelected}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                    isCurrentPlanSelected
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : isPopular
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-lg'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                  whileHover={!isCurrentPlanSelected ? { scale: 1.02 } : {}}
                  whileTap={!isCurrentPlanSelected ? { scale: 0.98 } : {}}
                >
                  {isCurrentPlanSelected ? (
                    'Current Plan'
                  ) : plan.name === 'free' ? (
                    'Get Started'
                  ) : (
                    `Upgrade to ${plan.display_name}`
                  )}
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Feature Comparison */}
      <div className="mt-12 bg-gray-50 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Compare All Features
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Feature</th>
                {plans.map(plan => (
                  <th key={plan.id} className="text-center py-3 px-4 font-semibold text-gray-700">
                    {plan.display_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Monthly Workouts', key: 'workouts' },
                { name: 'AI Recommendations', key: 'ai_recommendations' },
                { name: 'Advanced Analytics', key: 'advanced_analytics' },
                { name: 'Priority Support', key: 'priority_support' },
                { name: 'Custom Workouts', key: 'custom_workouts' }
              ].map((feature, index) => (
                <tr key={feature.key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-3 px-4 font-medium text-gray-900">{feature.name}</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-3 px-4">
                      {feature.key === 'workouts' || feature.key === 'ai_recommendations' ? (
                        <span className="text-gray-700">
                          {plan.features[feature.key] === -1 
                            ? 'Unlimited' 
                            : plan.features[feature.key] || '—'
                          }
                        </span>
                      ) : (
                        plan.features[feature.key] ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
          planName={selectedPlan.display_name}
          amount={selectedPlan.price}
          planId={selectedPlan.id}
          billingCycle={selectedPlan.interval_type === 'year' ? 'yearly' : 'monthly'}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};