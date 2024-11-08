import {isValidWdl, WdlBar} from './wdl';
import {WsPositionData} from './ws_feed';

export interface MoveSelectionObserver {
  onMoveSelected(position: WsPositionData, pos_changed: boolean): void;
}

export class MoveList {
  private parent: HTMLElement;
  private element: HTMLTableElement;
  private positions: WsPositionData[] = [];
  private positionIdx: number = -1;
  private observers: MoveSelectionObserver[] = [];

  constructor(parent: HTMLElement) {
    this.parent = parent;
    this.element = document.createElement('table');
    this.element.setAttribute('tabindex', '0');
    this.element.addEventListener('click', this.onClick.bind(this));
    this.element.addEventListener('keydown', this.onKeydown.bind(this));
    this.element.addEventListener('wheel', this.onWheel.bind(this));
    this.parent.appendChild(this.element);
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.selectPly(this.positionIdx - 1);
    } else {
      this.selectPly(this.positionIdx + 1);
    }
  }

  private onClick(event: Event): void {
    const target = event.target as HTMLElement;
    const plyIdx = target.closest('[ply-idx]')?.getAttribute('ply-idx');
    if (plyIdx != null) this.selectPly(parseInt(plyIdx, 10));
  }

  private onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      this.selectPly(this.positionIdx - 1);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.selectPly(this.positionIdx + 1);
    }
  }

  public addObserver(observer: MoveSelectionObserver): void {
    this.observers.push(observer);
  }
  public removeObserver(observer: MoveSelectionObserver): void {
    this.observers = this.observers.filter(o => o !== observer);
  }

  private notifyMoveSelected(move_changed: boolean): void {
    this.observers.forEach(
        observer => observer.onMoveSelected(
            this.positions[this.positionIdx], move_changed));
  }

  private selectPly(positionIdx: number): void {
    if (positionIdx < 0 || positionIdx >= this.positions.length) return;
    if (this.positionIdx === positionIdx) {
      this.notifyMoveSelected(false);
    } else {
      Array.from(this.element.children)
          .forEach(row => row.classList.remove('movelist-selected'));
      const targetRow =
          Array.from(this.element.children)
              .find(row => row.getAttribute('ply-idx') === String(positionIdx));
      targetRow?.classList.add('movelist-selected');
      if (positionIdx == this.positions.length - 1) {
        this.parent.scrollTo({top: this.element.scrollHeight});
      } else {
        targetRow?.scrollIntoView({block: 'nearest'});
      }
      this.positionIdx = positionIdx;
      this.notifyMoveSelected(true);
    }
  }

  private updateSinglePosition(position: WsPositionData): void {
    while (position.ply >= this.positions.length) {
      const emptyPosition: WsPositionData = {
        gameId: -1,
        ply: this.positions.length,
        fen: '',
      };
      this.positions.push(emptyPosition);
    }
    this.positions[position.ply] = position;
    if (position.ply === 0) return;

    const move_idx = Math.floor((position.ply + 1) / 2);
    const is_black = (position.ply % 2) === 0;

    const newRow = document.createElement('tr');
    newRow.classList.add('movelist-item');
    newRow.setAttribute('ply-idx', position.ply.toString());
    const moveText = document.createElement('td');
    moveText.innerHTML =
        `${is_black ? '&nbsp;&nbsp;&nbsp;…' : `${move_idx}. `} ${
            position.moveSan}`;
    newRow.appendChild(moveText);
    if (isValidWdl(position.scoreW, position.scoreD, position.scoreB)) {
      const newSpan = document.createElement('td');
      newRow.appendChild(newSpan);
      const wdlBar = new WdlBar(
          newSpan, position.scoreW!, position.scoreD!, position.scoreB!);
      wdlBar.render();
    } else {
      moveText.setAttribute('colspan', '2');
    }

    const existingRow = this.element.querySelector(
                            `[ply-idx="${position.ply}"]`) as HTMLDivElement;
    if (existingRow) {
      existingRow.innerHTML = newRow.innerHTML;
    } else {
      this.element.appendChild(newRow);
    }
  }

  public updatePositions(positions: WsPositionData[]): void {
    const wasAtEnd = (this.positionIdx === this.positions.length - 1) ||
        this.positions.length <= 1;
    positions.forEach(position => this.updateSinglePosition(position));
    if (wasAtEnd) this.selectPly(this.positions.length - 1);
  }

  public clearPositions(): void {
    this.positions = [];
    this.element.innerHTML = '';
    this.positionIdx = -1;
  }
};