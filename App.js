import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { generateImage } from './src/services/imageService';
import { postToBoth } from './src/services/metaApi';

export default function App() {
  const [prompt, setPrompt] = useState('');

  const [imageUri, setImageUri] = useState(null);
  const [imageSource, setImageSource] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);

  const [posting, setPosting] = useState(false);
  const [postResults, setPostResults] = useState(null);
  const [postError, setPostError] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    setPostResults(null);
    setPostError(null);
    try {
      const { uri, source } = await generateImage(prompt);
      setImageUri(uri);
      setImageSource(source);
    } catch (err) {
      setGenError(err.message || 'Failed to generate an image. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePost = async () => {
    if (!imageUri) return;
    setPosting(true);
    setPostError(null);
    setPostResults(null);
    try {
      const results = await postToBoth(imageUri, prompt || 'Posted from my test app');
      setPostResults(results);
      if (results.some((r) => !r.ok)) {
        setPostError('One or more platforms failed. See details below.');
      }
    } catch (err) {
      setPostError(err.message || 'Unexpected error while posting.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Generate & Post</Text>
        <Text style={styles.subtitle}>Test app — posts to a dev-mode Meta app only</Text>

        <TextInput
          style={styles.input}
          placeholder="Describe the image you want..."
          value={prompt}
          onChangeText={setPrompt}
          editable={!generating}
        />

        <TouchableOpacity
          style={[styles.button, generating && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={generating}
          accessibilityRole="button"
          accessibilityLabel="Generate image"
        >
          {generating ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generate</Text>}
        </TouchableOpacity>

        {genError && <Text style={styles.errorText}>⚠ {genError}</Text>}

        {imageUri && (
          <View style={styles.imageBlock}>
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
            {imageSource && <Text style={styles.caption}>Source: {imageSource}</Text>}
          </View>
        )}

        {imageUri && (
          <TouchableOpacity
            style={[styles.button, styles.postButton, posting && styles.buttonDisabled]}
            onPress={handlePost}
            disabled={posting}
            accessibilityRole="button"
            accessibilityLabel="Post to Instagram and Facebook"
          >
            {posting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Post to Instagram + Facebook</Text>
            )}
          </TouchableOpacity>
        )}

        {postError && <Text style={styles.errorText}>⚠ {postError}</Text>}

        {postResults && (
          <View style={styles.resultsBlock}>
            {postResults.map((r) => (
              <Text key={r.platform} style={r.ok ? styles.successText : styles.errorText}>
                {r.platform === 'facebook' ? 'Facebook' : 'Instagram'}:{' '}
                {r.ok ? `✅ Posted (id: ${r.postId})` : `❌ ${r.error}`}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 20, paddingTop: 40, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 12, color: '#888', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#1877F2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  postButton: { backgroundColor: '#C13584' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600' },
  imageBlock: { marginVertical: 16, alignItems: 'center' },
  image: { width: '100%', height: 300, borderRadius: 8, backgroundColor: '#eee' },
  caption: { fontSize: 12, color: '#666', marginTop: 6 },
  errorText: { color: '#D32F2F', marginBottom: 10 },
  successText: { color: '#2E7D32', marginBottom: 6 },
  resultsBlock: { marginTop: 8 },
});
