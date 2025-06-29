import { CheckCircle } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <View className='mb-6 flex-row items-center justify-center px-4'>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          <View
            className={`h-8 w-8 items-center justify-center rounded-full ${
              index === currentStep
                ? 'bg-blue-500'
                : index < currentStep
                  ? 'bg-green-500'
                  : 'bg-gray-300'
            }`}
          >
            {index < currentStep ? (
              <CheckCircle size={16} color='white' />
            ) : (
              <Text
                className={`text-sm font-bold ${index === currentStep ? 'text-white' : 'text-gray-600'}`}
              >
                {index + 1}
              </Text>
            )}
          </View>
          {index < totalSteps - 1 && (
            <View
              className={`h-1 flex-1 ${index < currentStep ? 'bg-green-500' : 'bg-gray-300'}`}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};
