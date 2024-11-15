export interface ElectronAPI {
    saveFile: (filePath: string, data: any) => Promise<string>;
    getSaveFilename: () => Promise<string | null>;
    on: (channel: string, listener: (...args: any[]) => void) => void;
    off: (channel: string, listener: (...args: any[]) => void) => void;
    send: (channel: string, ...args: any[]) => void;
    invoke: (channel: string, ...args: any[]) => Promise<any>;
  }
  
  declare global {
    interface Window {
      electron: ElectronAPI;
    }
  }
  