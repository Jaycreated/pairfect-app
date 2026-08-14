import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { reportContent } from '@/services/reportService';

const REASON_OPTIONS = ['Spam', 'Harassment', 'Nudity', 'Other'];

export default function ReportReasonPicker() {
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [otherText, setOtherText] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setLoading(true);
    try {
      await reportContent({
        reportedUserId: router?.params?.userId ?? '',
        contentType: router?.params?.contentType ?? 'message',
        contentId: router?.params?.contentId ?? undefined,
        content: router?.params?.content ?? '',
        reason: selectedReason === 'Other' ? otherText : selectedReason,
      });
      router.replace('/modal/reportConfirmation');
    } catch (e) {
      console.error('Report failed', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={true}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title}>Report Content</Text>
          {REASON_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.option, selectedReason === opt && styles.selected]}
              onPress={() => setSelectedReason(opt)}
            >
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          ))}
          {selectedReason === 'Other' && (
            <TextInput
              placeholder="Describe the issue"
              style={styles.input}
              multiline
              value={otherText}
              onChangeText={setOtherText}
            />
          )}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  selected: { backgroundColor: '#f0f0f0' },
  optionText: { fontSize: 16 },
  input: {
    marginTop: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 15,
    backgroundColor: '#651B55',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
