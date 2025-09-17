declare module "monaco-vim" {
  export function initVimMode(
    editor: any,
    statusBar: HTMLElement
  ): {
    dispose: () => void;
  };
}
