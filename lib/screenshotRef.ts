import { createRef } from 'react';
import { View } from 'react-native';

/** Set once by app/_layout.tsx, read by lib/screenshot.ts when a shake fires. */
export const rootViewRef = createRef<View>();
