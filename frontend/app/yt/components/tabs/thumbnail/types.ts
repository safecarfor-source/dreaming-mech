// 썸네일 탭 공유 타입

export type { ThumbnailStrategy, ThumbnailRecord } from '../../../lib/api';

export interface CanvasEditorProps {
  backgroundUrl?: string;
  strategy?: import('../../../lib/api').ThumbnailStrategy;
  projectId?: string;
  onSave?: (record: unknown) => void;
  onBack?: () => void;
}
