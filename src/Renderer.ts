class Renderer {
  canvasEl: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width = 500;
  height = 500;
  cellSize = 10;

  constructor() {
    this.canvasEl = document.createElement("canvas");
    this.ctx = this.canvasEl.getContext("2d")!;
  }
}

export { Renderer };
