import { REPORT_DIFFICULTY_LABELS, REPORT_METADATA_SECTIONS } from '@smartnippo/lib';
import type { ReportFormData } from '@smartnippo/types';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { MetadataInput } from '../metadata-input';

interface MetadataStepProps {
  formData: ReportFormData;
  onUpdateFormData: (updates: Partial<ReportFormData>) => void;
}

const difficultyLabels = REPORT_DIFFICULTY_LABELS;

export const MetadataStep: React.FC<MetadataStepProps> = ({ formData, onUpdateFormData }) => {
  // metadataが未定義の場合のデフォルト値
  const metadata = formData.metadata || {
    achievements: [],
    challenges: [],
    learnings: [],
    nextActionItems: [],
    difficulty: undefined,
  };

  const updateMetadata = (updates: Partial<ReportFormData['metadata']>) => {
    onUpdateFormData({
      metadata: { ...metadata, ...updates },
    });
  };

  return (
    <ScrollView className='max-h-96'>
      <View className='mb-4'>
        <Text className='mb-2 font-medium text-gray-700'>
          {REPORT_METADATA_SECTIONS.DIFFICULTY}
        </Text>
        <View className='flex-row space-x-2'>
          {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
            <Pressable
              key={difficulty}
              onPress={() => updateMetadata({ difficulty })}
              className={`flex-1 rounded-lg py-3 ${
                metadata.difficulty === difficulty ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  metadata.difficulty === difficulty ? 'text-white' : 'text-gray-700'
                }`}
              >
                {difficultyLabels[difficulty]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <MetadataInput
        label={REPORT_METADATA_SECTIONS.ACHIEVEMENTS}
        items={metadata.achievements}
        onAdd={(item) =>
          updateMetadata({
            achievements: [...(metadata.achievements || []), item],
          })
        }
        onRemove={(index) =>
          updateMetadata({
            achievements: (metadata.achievements || []).filter((_, i) => i !== index),
          })
        }
      />

      <MetadataInput
        label={REPORT_METADATA_SECTIONS.CHALLENGES}
        items={metadata.challenges}
        onAdd={(item) =>
          updateMetadata({
            challenges: [...(metadata.challenges || []), item],
          })
        }
        onRemove={(index) =>
          updateMetadata({
            challenges: (metadata.challenges || []).filter((_, i) => i !== index),
          })
        }
      />

      <MetadataInput
        label={REPORT_METADATA_SECTIONS.LEARNINGS}
        items={metadata.learnings}
        onAdd={(item) =>
          updateMetadata({
            learnings: [...(metadata.learnings || []), item],
          })
        }
        onRemove={(index) =>
          updateMetadata({
            learnings: (metadata.learnings || []).filter((_, i) => i !== index),
          })
        }
      />

      <MetadataInput
        label={REPORT_METADATA_SECTIONS.NEXT_ACTIONS}
        items={metadata.nextActionItems}
        onAdd={(item) =>
          updateMetadata({
            nextActionItems: [...(metadata.nextActionItems || []), item],
          })
        }
        onRemove={(index) =>
          updateMetadata({
            nextActionItems: (metadata.nextActionItems || []).filter((_, i) => i !== index),
          })
        }
      />
    </ScrollView>
  );
};
