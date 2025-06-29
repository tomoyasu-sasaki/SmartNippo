import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface WorkingTimePickerProps {
  value: {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  };
  onUpdate: (value: any) => void;
}

export const WorkingTimePicker: React.FC<WorkingTimePickerProps> = ({ value, onUpdate }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <View>
      <Text style={styles.label}>勤務時間</Text>
      <View style={styles.container}>
        <View style={styles.timeSection}>
          <Text style={styles.sectionLabel}>開始時刻</Text>
          <View style={styles.pickerRow}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={value.startHour}
                onValueChange={(v) => onUpdate({ startHour: v })}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {hours.map((h) => (
                  <Picker.Item key={h} label={`${h.toString().padStart(2, '0')}`} value={h} />
                ))}
              </Picker>
            </View>
            <Text style={styles.unit}>時</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={value.startMinute}
                onValueChange={(v) => onUpdate({ startMinute: v })}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {minutes.map((m) => (
                  <Picker.Item key={m} label={`${m.toString().padStart(2, '0')}`} value={m} />
                ))}
              </Picker>
            </View>
            <Text style={styles.unit}>分</Text>
          </View>
        </View>

        <View style={styles.timeSection}>
          <Text style={styles.sectionLabel}>終了時刻</Text>
          <View style={styles.pickerRow}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={value.endHour}
                onValueChange={(v) => onUpdate({ endHour: v })}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {hours.map((h) => (
                  <Picker.Item key={h} label={`${h.toString().padStart(2, '0')}`} value={h} />
                ))}
              </Picker>
            </View>
            <Text style={styles.unit}>時</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={value.endMinute}
                onValueChange={(v) => onUpdate({ endMinute: v })}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {minutes.map((m) => (
                  <Picker.Item key={m} label={`${m.toString().padStart(2, '0')}`} value={m} />
                ))}
              </Picker>
            </View>
            <Text style={styles.unit}>分</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
    fontWeight: '500',
    color: '#374151',
    fontSize: 16,
  },
  container: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timeSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    marginBottom: 8,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 8,
    width: 120,
    height: 100,
    justifyContent: 'center',
  },
  picker: {
    height: 120,
    width: 120,
  },
  pickerItem: {
    fontSize: 16,
    color: '#111827',
    height: 120,
  },
  unit: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginRight: 16,
    minWidth: 20,
  },
});
