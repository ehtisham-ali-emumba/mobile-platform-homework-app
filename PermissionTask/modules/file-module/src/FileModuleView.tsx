import { requireNativeView } from 'expo';
import * as React from 'react';

import { FileModuleViewProps } from './FileModule.types';

const NativeView: React.ComponentType<FileModuleViewProps> =
  requireNativeView('FileModule');

export default function FileModuleView(props: FileModuleViewProps) {
  return <NativeView {...props} />;
}
