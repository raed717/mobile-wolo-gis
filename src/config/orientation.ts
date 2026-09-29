import { ModalProps } from 'react-native';

// iOS Modals default to portrait-only; pass this to every <Modal> so it follows device rotation.
export const MODAL_SUPPORTED_ORIENTATIONS: ModalProps['supportedOrientations'] = [
  'portrait',
  'portrait-upside-down',
  'landscape',
  'landscape-left',
  'landscape-right',
];
