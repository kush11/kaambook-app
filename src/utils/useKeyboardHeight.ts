import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

// Height of the on-screen keyboard, 0 when hidden.
// The app targets Android 15+, where apps draw edge-to-edge and `adjustResize` no longer
// shrinks the window, so centred modals and dialogs stay behind the keyboard. Add this as
// bottom padding/margin to keep their inputs and buttons above it.
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}
