import * as React from 'react';

import { FileModuleViewProps } from './FileModule.types';

export default function FileModuleView(props: FileModuleViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
