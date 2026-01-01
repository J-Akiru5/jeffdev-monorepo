# React Native Stack Template

> **Stack**: react-native  
> **Version**: React Native 0.73+  
> **Framework**: Expo (recommended) or bare React Native

## Project Structure

```
src/
├── components/
│   ├── ui/           # Primitive components
│   └── screens/      # Screen components
├── hooks/            # Custom hooks
├── navigation/       # React Navigation setup
├── utils/            # Helpers
└── App.tsx
```

## Component Pattern

```tsx
import { View, Text, StyleSheet, Pressable, type ViewStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.text, styles[`${variant}Text`]]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#06b6d4',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#06b6d4',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#06b6d4',
  },
});
```

## Core Components

### View (div equivalent)
```tsx
<View style={styles.container}>
  <Text>Content</Text>
</View>
```

### Text (always required for text)
```tsx
<Text style={styles.title}>Hello World</Text>
```

### Pressable (modern touchable)
```tsx
<Pressable
  onPress={() => console.log('Pressed')}
  style={({ pressed }) => [
    styles.button,
    pressed && styles.buttonPressed,
  ]}
>
  <Text>Press Me</Text>
</Pressable>
```

### ScrollView
```tsx
<ScrollView
  contentContainerStyle={styles.scrollContent}
  showsVerticalScrollIndicator={false}
>
  {/* Content */}
</ScrollView>
```

### FlatList (for lists)
```tsx
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <ItemCard item={item} />}
  ItemSeparatorComponent={() => <View style={styles.separator} />}
/>
```

### TextInput
```tsx
<TextInput
  value={text}
  onChangeText={setText}
  placeholder="Enter text..."
  placeholderTextColor="#888"
  style={styles.input}
/>
```

## Styling with StyleSheet

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // RN 0.71+
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});
```

## Platform-Specific Code

```tsx
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  }),
});
```

## Safe Area Handling

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {children}
    </SafeAreaView>
  );
}
```

## Navigation (React Navigation)

```tsx
import { useNavigation } from '@react-navigation/native';

export function HomeScreen() {
  const navigation = useNavigation();
  
  return (
    <Pressable onPress={() => navigation.navigate('Details', { id: 123 })}>
      <Text>Go to Details</Text>
    </Pressable>
  );
}
```

## Icons (Expo)

```tsx
import { Ionicons } from '@expo/vector-icons';

<Ionicons name="home" size={24} color="#fff" />
```

---

## AI Generation Rules

When generating React Native components:

1. **Use StyleSheet.create()** for all styles
2. **Wrap text in Text component** always
3. **Use Pressable** instead of TouchableOpacity
4. **No CSS units** - numbers only (no 'px')
5. **flexDirection defaults to 'column'** (opposite of web)
6. **Use Platform.select()** for platform differences
7. **SafeAreaView** for screen containers
8. **No className prop** - use style prop only
9. **FlatList for lists** - never map in ScrollView
10. **Import from 'react-native'** core components
