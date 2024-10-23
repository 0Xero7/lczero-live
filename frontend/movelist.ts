export interface GamePositionResponse {
  ply: number;  // 0 for startpos
  thinkingId?: number;
  moveUci?: string;
  moveSan?: string;
  fen: string;
  whiteClock?: number;
  blackClock?: number;
  scoreQ?: number;
  scoreW?: number;
  scoreD?: number;
  scoreL?: number;
}

export interface MoveSelectionObserver {
  onMoveSelected(position: GamePositionResponse): void;
}

export class MoveList {
  private element: HTMLElement;
  private positions: GamePositionResponse[] = [];
  private positionIdx: number = 0;
  private observers: MoveSelectionObserver[] = [];

  constructor(element: HTMLElement) {
    this.element = element;
    this.element.setAttribute('tabindex', '0');
    this.element.addEventListener('click', this.onClick.bind(this));
    this.element.addEventListener('keydown', this.onKeydown.bind(this));
  }

  private onClick(event: Event): void {
    const target = event.target as HTMLElement;
    const plyIdx = target.getAttribute('ply-idx');
    if (plyIdx !== null) this.selectPly(parseInt(plyIdx, 10));
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

  private notifyObservers(): void {
    this.observers.forEach(
        observer => observer.onMoveSelected(this.positions[this.positionIdx]));
  }

  private selectPly(positionIdx: number): void {
    if (positionIdx < 0 || positionIdx >= this.positions.length) return;
    if (this.positionIdx === positionIdx) return;
    Array.from(this.element.children)
        .forEach(row => row.classList.remove('movelist-selected'));
    const targetRow =
        Array.from(this.element.children)
            .find(row => row.getAttribute('ply-idx') === String(positionIdx));
    targetRow?.classList.add('movelist-selected');
    this.positionIdx = positionIdx;
    this.notifyObservers();
  }

  public setPositions(positions: GamePositionResponse[]): void {
    this.positions = positions;
    this.element.innerHTML = '';
    positions.forEach(position => {
      if (position.ply === 0) return;
      const move_idx = Math.floor((position.ply + 1) / 2);
      const is_black = (position.ply % 2) === 0;

      const rowEl = document.createElement('div');
      rowEl.classList.add('movelist-item');
      rowEl.setAttribute('ply-idx', position.ply.toString());
      rowEl.innerHTML =
          `${is_black ? '&nbsp;&nbsp;&nbsp;…' : `${move_idx}. `} ${
              position.moveSan}`;
      this.element.appendChild(rowEl);
    });
    this.selectPly(this.positions.length - 1);
  }
};