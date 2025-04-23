// src/main.ts
import { Plugin, WorkspaceLeaf } from 'obsidian';
import { log } from './message';

export default class AlwaysPinnedTab extends Plugin {
  private styleEl: HTMLStyleElement | null = null;

  async onload() {
    log('loading...');
    this.registerEvents();
    this.injectStyles();
    log('loaded. CSS injected.');
  }

  onunload() {
    log('unloaded.');
    this.removeStyles();
    log('CSS removed.');
  }

  private registerEvents() {
    this.app.workspace.on('active-leaf-change', (leaf) => {
      if (!leaf) return;

      // 1) 항상 핀 고정
      // @ts-expect-error
      if (!leaf.pinned) {
        leaf.setPinned(true);
      }

      // 2) 중복 탭 자동 제거 (항상 활성화)
      const sameLeaves: WorkspaceLeaf[] = [];
      leaf.parent?.children?.forEach((child: WorkspaceLeaf & { id: string }) => {
        const l = this.app.workspace.getLeafById(child.id);
        const isMarkdown = 'file' in leaf.view && 'file' in l.view;
        // @ts-expect-error
        if (isMarkdown && leaf.view.file?.path === l.view.file?.path) {
          sameLeaves.push(l);
        }
      });
      if (sameLeaves.length <= 1) return;

      const [main, ...duplicates] = sameLeaves;
      // @ts-expect-error
      if (!main.pinned) {
        main.setPinned(true);
      }
      this.app.workspace.setActiveLeaf(main);

      duplicates.forEach((l) => {
        // 살짝 딜레이 후 닫기
        // @ts-expect-error
        sleep(0).then(() => l.detach());
      });
    });
  }

  private injectStyles() {
    if (this.styleEl) return;
    this.styleEl = document.createElement('style');
    this.styleEl.id = 'always-pinned-tab-styles';
    this.styleEl.textContent = `
      /* 1. 탭 핀 아이콘 숨기기 */
      .workspace-tab-header-status-icon.mod-pinned {
        display: none !important;
      }

      /* 2. 세로 분할 상태에서 닫기 버튼 항상 보이기 */
      .workspace-split.mod-vertical.mod-root .workspace-tab-header-inner-close-button {
        display: block !important;
      }

      /* 3. pane 메뉴에서 'pane' 섹션 항목 숨기기 */
      .menu .menu-item.tappable[data-section="pane"] {
        display: none !important;
      }
    `;
    document.head.appendChild(this.styleEl);
  }

  private removeStyles() {
    if (this.styleEl) {
      this.styleEl.remove();
      this.styleEl = null;
    }
  }
}
