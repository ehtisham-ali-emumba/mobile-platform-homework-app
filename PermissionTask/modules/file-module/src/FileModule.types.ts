export interface FileModuleViewProps {
  url?: string;
  onLoad?: (event: any) => void;
}

export type WriteLogFunction = (
  contents: string,
  filename: string,
) => Promise<string>;
