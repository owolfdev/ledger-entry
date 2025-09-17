declare module "monaco-vim" {
  export function initVimMode(
    editor: unknown,
    statusBar: HTMLElement
  ): {
    dispose: () => void;
  };
}

type VimMode = {
  dispose: () => void;
};
