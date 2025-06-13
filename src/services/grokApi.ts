import { supabase } from '../lib/supabase';
import { DatabaseService } from './database';

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
  availableTime: number; // minutes
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

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class GrokWorkoutService {
  private async callGroqAPI(prompt: string): Promise<string> {
    if (!GROQ_API_KEY) {
      console.warn('GROQ API key is not configured. Using fallback recommendations.');
      throw new Error('GROQ_API_NOT_CONFIGURED');
    }

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an expert fitness trainer and health specialist. You create personalized workout recommendations based on user health profiles, allergies, and medical conditions. Always prioritize safety and provide modifications for different fitness levels. Format your response as valid JSON.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'llama3-8b-8192',
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`GROQ API error: ${response.status} - ${errorText}`);
        throw new Error(`GROQ API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling GROQ API:', error);
      throw new Error('Failed to get AI workout recommendation');
    }
  }

  async generateWorkoutRecommendation(
    userProfile: UserHealthProfile,
    currentMood?: number,
    energyLevel?: number,
    stressLevel?: number
  ): Promise<WorkoutRecommendation> {
    const prompt = `
    Create a personalized workout recommendation for a user with the following profile:

    HEALTH PROFILE:
    - Allergies: ${userProfile.allergies.join(', ') || 'None'}
    - Health Conditions: ${userProfile.healthConditions.join(', ') || 'None'}
    - Fitness Level: ${userProfile.fitnessLevel}
    - Age: ${userProfile.age}
    - Weight: ${userProfile.weight} lbs
    - Height: ${userProfile.height} inches
    - Goals: ${userProfile.goals.join(', ')}
    - Previous Injuries: ${userProfile.previousInjuries.join(', ') || 'None'}
    - Medications: ${userProfile.medications.join(', ') || 'None'}
    - Available Time: ${userProfile.availableTime} minutes
    - Preferred Workout Types: ${userProfile.preferredWorkoutTypes.join(', ')}
    - Available Equipment: ${userProfile.equipment.join(', ') || 'Bodyweight only'}

    CURRENT STATE:
    - Mood: ${currentMood || 'Not specified'}/10
    - Energy Level: ${energyLevel || 'Not specified'}/10
    - Stress Level: ${stressLevel || 'Not specified'}/10

    REQUIREMENTS:
    1. Consider all allergies and health conditions for safety
    2. Adapt intensity based on current mood and energy
    3. Provide modifications for any limitations
    4. Include specific cautions related to health conditions
    5. Estimate calorie burn based on user profile
    6. Explain reasoning for the recommendation

    Please respond with a JSON object matching this structure:
    {
      "id": "unique_id",
      "name": "Workout Name",
      "description": "Brief description",
      "duration": number_in_minutes,
      "difficulty": "easy|moderate|hard",
      "exercises": [
        {
          "name": "Exercise Name",
          "sets": number,
          "reps": "number or time",
          "duration": optional_seconds,
          "restTime": seconds,
          "instructions": ["step1", "step2"],
          "modifications": ["modification1"],
          "targetMuscles": ["muscle1", "muscle2"]
        }
      ],
      "cautions": ["caution1", "caution2"],
      "benefits": ["benefit1", "benefit2"],
      "modifications": ["modification1"],
      "estimatedCalories": number,
      "targetMuscleGroups": ["group1", "group2"],
      "reasoning": "Explanation of why this workout was chosen"
    }
    `;

    try {
      const response = await this.callGroqAPI(prompt);
      
      // Parse the JSON response
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const recommendation = JSON.parse(cleanResponse);
      
      // Add unique ID if not provided
      if (!recommendation.id) {
        recommendation.id = `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Save to database if user is authenticated
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await DatabaseService.saveAIRecommendation({
            user_id: user.id,
            recommendation_type: 'workout',
            name: recommendation.name,
            description: recommendation.description,
            content: recommendation,
            reasoning: recommendation.reasoning,
            mood_score: currentMood,
            energy_score: energyLevel,
            stress_score: stressLevel,
            used: false
          });
        }
      } catch (dbError) {
        console.warn('Failed to save AI recommendation to database:', dbError);
        // Continue without saving to database
      }

      return recommendation;
    } catch (error) {
      console.error('Error generating AI workout recommendation:', error);
      
      // Use fallback recommendation when GROQ API is not available
      console.log('Using fallback workout recommendation');
      return this.getFallbackRecommendation(userProfile);
    }
  }

  async generateNutritionAdvice(
    userProfile: UserHealthProfile,
    workoutRecommendation: WorkoutRecommendation
  ): Promise<string> {
    const prompt = `
    Based on the user's health profile and the recommended workout, provide personalized nutrition advice:

    USER PROFILE:
    - Allergies: ${userProfile.allergies.join(', ') || 'None'}
    - Health Conditions: ${userProfile.healthConditions.join(', ') || 'None'}
    - Goals: ${userProfile.goals.join(', ')}
    - Age: ${userProfile.age}
    - Weight: ${userProfile.weight} lbs

    WORKOUT:
    - Name: ${workoutRecommendation.name}
    - Duration: ${workoutRecommendation.duration} minutes
    - Estimated Calories: ${workoutRecommendation.estimatedCalories}
    - Target Muscle Groups: ${workoutRecommendation.targetMuscleGroups.join(', ')}

    Provide specific nutrition advice including:
    1. Pre-workout meal/snack recommendations (considering allergies)
    2. Post-workout recovery nutrition
    3. Hydration guidelines
    4. Foods to avoid based on health conditions
    5. Timing recommendations

    Keep the response concise and practical. Respond with plain text, not JSON.
    `;

    try {
      const response = await this.callGroqAPI(prompt);
      return response;
    } catch (error) {
      console.error('Error getting AI nutrition advice:', error);
      console.log('Using fallback nutrition advice');
      return this.getFallbackNutritionAdvice(userProfile, workoutRecommendation);
    }
  }

  private getFallbackRecommendation(userProfile: UserHealthProfile): WorkoutRecommendation {
    const duration = Math.min(userProfile.availableTime, 30);
    const isLowIntensity = userProfile.healthConditions.length > 0 || userProfile.fitnessLevel === 'beginner';
    
    return {
      id: `fallback_${Date.now()}`,
      name: isLowIntensity ? 'Gentle Full Body Workout' : 'Balanced Fitness Routine',
      description: 'A safe, adaptable workout suitable for your fitness level and health profile',
      duration: duration,
      difficulty: isLowIntensity ? 'easy' : 'moderate',
      exercises: [
        {
          name: 'Bodyweight Squats',
          sets: isLowIntensity ? 2 : 3,
          reps: isLowIntensity ? '8-12' : '12-15',
          restTime: 60,
          instructions: [
            'Stand with feet shoulder-width apart',
            'Lower down as if sitting in a chair',
            'Keep your chest up and knees behind toes',
            'Return to standing position'
          ],
          modifications: ['Use a chair for support', 'Reduce range of motion', 'Hold onto wall for balance'],
          targetMuscles: ['quadriceps', 'glutes', 'hamstrings']
        },
        {
          name: isLowIntensity ? 'Wall Push-ups' : 'Modified Push-ups',
          sets: 2,
          reps: isLowIntensity ? '5-10' : '8-15',
          restTime: 60,
          instructions: [
            isLowIntensity ? 'Stand arm\'s length from wall' : 'Start in plank position on knees',
            isLowIntensity ? 'Place palms flat against wall' : 'Lower chest toward ground',
            isLowIntensity ? 'Push away from wall' : 'Push back to starting position'
          ],
          modifications: ['Move closer to wall for easier variation', 'Use incline surface', 'Reduce range of motion'],
          targetMuscles: ['chest', 'shoulders', 'triceps']
        },
        {
          name: 'Marching in Place',
          sets: 1,
          reps: `${Math.floor(duration / 3)} minutes`,
          duration: Math.floor(duration / 3) * 60,
          restTime: 30,
          instructions: [
            'Lift knees alternately to comfortable height',
            'Swing arms naturally',
            'Maintain steady, comfortable pace',
            'Focus on controlled movements'
          ],
          modifications: ['Reduce knee height', 'Hold onto chair for balance', 'March while seated'],
          targetMuscles: ['legs', 'core', 'cardiovascular system']
        }
      ],
      cautions: [
        'Stop immediately if you feel dizzy, short of breath, or experience any pain',
        'Consult your doctor before starting any new exercise program',
        'Stay hydrated throughout the workout',
        'Listen to your body and rest when needed'
      ],
      benefits: [
        'Improves cardiovascular health',
        'Strengthens major muscle groups',
        'Low impact on joints',
        'Enhances balance and coordination',
        'Boosts mood and energy levels'
      ],
      modifications: [
        'All exercises can be modified for seated position',
        'Reduce intensity and duration as needed',
        'Take additional rest breaks between exercises',
        'Focus on proper form over speed or intensity'
      ],
      estimatedCalories: Math.round(duration * (isLowIntensity ? 2.5 : 4)),
      targetMuscleGroups: ['Full body', 'Cardiovascular system'],
      reasoning: `This ${isLowIntensity ? 'gentle' : 'balanced'} workout is designed to be safe for your health profile while providing meaningful fitness benefits. The exercises are adaptable to your current fitness level and can be modified based on any health conditions or limitations you may have. Since AI recommendations are not available, this fallback workout focuses on fundamental movements that are safe and effective for most users.`
    };
  }

  private getFallbackNutritionAdvice(userProfile: UserHealthProfile, workout: WorkoutRecommendation): string {
    const hasAllergies = userProfile.allergies.length > 0;
    const hasHealthConditions = userProfile.healthConditions.length > 0;
    
    let advice = `Here's personalized nutrition advice for your ${workout.name}:\n\n`;
    
    advice += `**Pre-Workout (30-60 minutes before):**\n`;
    if (hasAllergies) {
      advice += `- Choose easily digestible carbohydrates (avoiding your known allergies: ${userProfile.allergies.join(', ')})\n`;
    } else {
      advice += `- Light snack with carbohydrates: banana, oatmeal, or whole grain toast\n`;
    }
    advice += `- Small amount of protein if desired\n`;
    advice += `- Avoid heavy, fatty, or high-fiber foods\n\n`;
    
    advice += `**Post-Workout (within 2 hours):**\n`;
    advice += `- Combine protein and carbohydrates for recovery\n`;
    advice += `- Aim for 15-25g protein and 30-60g carbohydrates\n`;
    if (hasAllergies) {
      advice += `- Choose protein sources that avoid your allergies\n`;
    } else {
      advice += `- Good options: Greek yogurt with fruit, chocolate milk, or lean protein with rice\n`;
    }
    advice += `\n**Hydration:**\n`;
    advice += `- Drink 16-20 oz water 2-3 hours before exercise\n`;
    advice += `- Sip 6-12 oz every 15-20 minutes during workout\n`;
    advice += `- Replace fluids lost through sweat after exercise\n\n`;
    
    if (hasHealthConditions) {
      advice += `**Special Considerations:**\n`;
      advice += `- Follow any dietary restrictions related to your health conditions\n`;
      advice += `- Consult your healthcare provider for specific nutritional needs\n`;
      advice += `- Monitor blood sugar if diabetic\n\n`;
    }
    
    advice += `**Timing:**\n`;
    advice += `- Don't exercise on a completely empty stomach\n`;
    advice += `- Allow 1-3 hours for larger meals to digest\n`;
    advice += `- Post-workout nutrition is most effective within the first 2 hours\n\n`;
    
    advice += `*Note: AI-powered nutrition advice is currently unavailable. This general guidance is based on standard nutritional principles. For personalized advice, consider consulting with a registered dietitian.*`;
    
    return advice;
  }

  async getWorkoutModifications(
    originalWorkout: WorkoutRecommendation,
    healthConcerns: string[]
  ): Promise<string[]> {
    const prompt = `
    Given this workout and specific health concerns, provide detailed modifications:

    ORIGINAL WORKOUT: ${originalWorkout.name}
    EXERCISES: ${originalWorkout.exercises.map(e => e.name).join(', ')}
    
    HEALTH CONCERNS: ${healthConcerns.join(', ')}

    Provide specific modifications for each exercise to accommodate these health concerns. 
    Format as an array of strings, each containing a modification.
    `;

    try {
      const response = await this.callGroqAPI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error getting AI modifications:', error);
      console.log('Using fallback workout modifications');
      return [
        'Reduce intensity and duration as needed',
        'Take frequent breaks between exercises',
        'Stop immediately if you experience any discomfort',
        'Focus on proper form over speed or repetitions',
        'Consider seated or supported variations of exercises',
        'Consult with your healthcare provider before continuing'
      ];
    }
  }
}

export const grokWorkoutService = new GrokWorkoutService();