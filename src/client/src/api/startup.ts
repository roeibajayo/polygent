import { fetchGet } from './index';
import { Editor, Workspace, Environment } from '@/types';

export interface StartupData {
  workspaces: Workspace[];
  environments: Environment[];
  availableEditors: Editor[];
}

export default {
  getStartupData: (): Promise<StartupData> => fetchGet('/api/startup')
};