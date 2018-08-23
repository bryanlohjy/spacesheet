import * as dl from 'deeplearn';
import { lerp } from '../../lib/tensorUtils.js';
import { map } from '../../lib/helpers.js';

export default class DataPicker {
  constructor(ctx, opts) {
    this.ctx = ctx;
    this.width = this.ctx.canvas.width;
    this.height = this.ctx.canvas.height;

    this.outputWidth = opts.model.outputWidth;
    this.outputHeight = opts.model.outputHeight;
    this.drawFn = opts.model.drawFn;
    this.decodeFn = opts.model.decodeFn;

    const gridData = opts.gridData;
    this.grid = gridData.data; // keys are [ column-row ]
    this.rows = gridData.grid.rows;
    this.columns = gridData.grid.columns;

    this.originX = this.width / 2;
    this.originY = this.height / 2;

    this.scale = 1;
    this.minScale = 1;
    this.maxScale = 15;

    this.minSize = 10;

    initCanvas(ctx);
    /*
      Map of drawn objects, store under the key schema:
      [subdivision]-[columnIndex]-[rowIndex]-[subcolumnIndex]-[subrowIndex]
    */
    this.cells = {};
  };
  resetZoom() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.draw();
  };
  zoom(degree) {
    // scale around origin
    const prevTransform = this.ctx.getTransform();
    const pt = this.ctx.transformedPoint(this.originX, this.originY);
    this.ctx.translate(pt.x,pt.y);

    const factor = Math.pow(1.1, degree);
    this.ctx.scale(factor,factor);
    this.ctx.translate(-pt.x,-pt.y);

    // Limit scale to min and max
    const scale = Number(this.ctx.getTransform().a);

    if (scale < this.minScale) { // if less than the min, reset view
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    } else if (scale > this.maxScale) { // if greaterm then return
      const { a, b, c, d, e, f } = prevTransform;
      this.ctx.setTransform(a, b, c, d, e, f);
      return;
    }
    this.draw();
  };
  isExceedingDataBounds(transform) {
    // Return limited transform matrix if out of bounds
    let { scale, b, c, d, translateX, translateY } = transform;

    const topFloat = translateY;
    const rightFloat = this.width - (translateX + this.width * scale);
    const bottomFloat = this.height - (translateY + this.height * scale);
    const leftFloat = translateX;

    let exceedingBounds = false;

    if (topFloat > 0) {
      translateY -= topFloat;
      exceedingBounds = true;
    }
    if (bottomFloat > 0) {
      translateY += bottomFloat;
      exceedingBounds = true;
    }
    if (leftFloat > 0) {
      translateX -= leftFloat;
      exceedingBounds = true;
    }
    if (rightFloat > 0) {
      translateX += rightFloat;
      exceedingBounds = true;
    }

    if (exceedingBounds) {
      return { scale, b, c, d, translateX, translateY }
    }
    return false;
  };
  cellIsOutOfBounds(cellParams) {
    const top = cellParams.y;
    const right = cellParams.x + cellParams.w;
    const bottom = cellParams.y + cellParams.h;
    const left = cellParams.x;

    if (right < -this.translateX/this.scale) {
      return true;
    }
    if (left > (this.width - this.translateX)/this.scale) {
      return true;
    }
    if (top > (this.height-this.translateY)/this.scale) {
      return true;
    }
    if (bottom < -this.translateY/this.scale) {
      return true;
    }
    return false;
  };
  // get indicesToDraw() { // return an array of evenly distributed column indices to draw
  //   let indicesToDraw = [0];
  //   const minSize = this.minSize || this.columns;
  //
  //   for (let i = 1; i < minSize - 1; i++) {
  //     const val = Math.floor(map(i, 0, minSize - 1, 0, this.columns - 1));
  //     indicesToDraw.push(val)
  //   }
  //   indicesToDraw.push(this.columns - 1);
  //
  //   return indicesToDraw;
  // };
  get subdivisions() { // return the amount to subdivide by
    let subdivisions = parseInt(this.scale);
    // only subdivide at even intervals
    if (subdivisions % 2 !== 0) {
      subdivisions = Math.max(1, subdivisions - 1);
    }
    return subdivisions;
  };
  updateTransform() { // limit panning + update scale attribute
    let { a: scale, b, c, d, e: translateX, f: translateY } = this.ctx.getTransform();
    // Limit panning
    const newTransform = this.isExceedingDataBounds({
      scale, b, c, d, translateX, translateY,
    });

    if (newTransform) {
      scale = newTransform.scale;
      b = newTransform.b;
      c = newTransform.c;
      d = newTransform.d;
      translateX = newTransform.translateX;
      translateY = newTransform.translateY;
      this.ctx.setTransform(scale, b, c, d, translateX, translateY);
    }
    this.scale = scale;
    this.translateX = translateX;
    this.translateY = translateY;
  };
  clearCanvas() {
    // clear background
    const { x, y } = this.ctx.transformedPoint(0, 0);
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(x, y, this.width, this.height)
  };
  draw() {
    this.updateTransform();
    // const toDraw = this.indicesToDraw;
    this.clearCanvas();
    // https://github.com/dribnet/plat/blob/master/plat/grid_layout.py#L71L106
    const intermediates = this.subdivisions;
    const totalRows = intermediates * this.rows;
    const totalColumns = intermediates * this.columns;

    // iterate through entire grid
    for (let y = 0; y < totalRows; y++) {
      for (let x = 0; x < totalColumns; x++) {
        const row = Math.floor(y / intermediates);
        const column = Math.floor(x / intermediates);
        const subrow = y % intermediates;
        const subcolumn = x % intermediates;

        // get cell coords based on index, check if within bounds
        const self = this;
        let cellParams = {
          get x() { return x * this.w; },
          get y() { return y * this.h; },
          get w() { return self.width / (self.columns * intermediates); },
          get h() { return self.height / (self.rows * intermediates); },
        };
        if (this.cellIsOutOfBounds(cellParams)) {
          continue;
        }

        // check if cell has been computed
        const cellKey = `${ intermediates }-${ column }-${ row }-${ subcolumn }-${ subrow }`;
        let cell = this.cells[cellKey];
        if (!cell) { // create a new cell
          cellParams = {
            ...cellParams,
            drawFn: this.drawFn,
            decodeFn: this.decodeFn,
            outputWidth: this.outputWidth,
            outputHeight: this.outputHeight,
            subdivisions: this.subdivisions,
            row,
            column,
            subrow,
            subcolumn,
            dataPicker: this,
          };
          cell = new Cell(this.ctx, cellParams);
          this.cells[cellKey] = cell;
        }
        cell.draw();
      }
    }
  };
}

class Cell {
  constructor(ctx, params) {
    this.ctx = ctx;

    this.x = params.x;
    this.y = params.y;
    this.w = params.w;
    this.h = params.h;

    this.drawFn = params.drawFn;
    this.decodeFn = params.decodeFn;
    this.outputWidth = params.outputWidth;
    this.outputHeight = params.outputHeight;

    this.subdivisions = params.subdivisions;
    this.row = params.row;
    this.column = params.column;
    this.subrow = params.subrow;
    this.subcolumn = params.subcolumn;

    this.dataPicker = params.dataPicker;

    this.vector;
    this.image;

    this.computeData();
  };
  computeData() {
    // determines interpolation dependencies, constructs them if necessary
    // it is an anchor
    if (this.subrow == 0 && this.subcolumn == 0) {
      const anchorKey = `${this.column}-${this.row}`;
      const anchor = this.dataPicker.grid[anchorKey];
      this.vector = anchor.vector;
      this.image = this.decodeFn(this.vector);
      return;
    }

    // horizontal interpolation
    if (this.subrow == 0 && this.subcolumn > 0) {
      const fromAnchorKey = `${this.column}-${this.row}`;
      const toAnchorKey =  `${(this.column + 1) % this.dataPicker.columns}-${this.row}`;

      const fromAnchor = this.dataPicker.grid[fromAnchorKey];
      const toAnchor = this.dataPicker.grid[toAnchorKey];

      this.vector = dl.tidy(() => {
        const from = dl.tensor1d(fromAnchor.vector);
        const to = dl.tensor1d(toAnchor.vector);
        const lerpAmount = 1 / this.subdivisions * this.subcolumn;
        return lerp(from, to, lerpAmount);
      }).getValues();
      this.image = this.decodeFn(this.vector);

      return;
    }

    // vertical interpolation
    if (this.subrow > 0) {
      const fromAnchorKey = `${this.subdivisions}-${this.column}-${this.row}-${this.subcolumn}-0`;
      const toAnchorKey = `${this.subdivisions}-${this.column}-${(this.row + 1) % this.dataPicker.rows}-${this.subcolumn}-0`;

      let fromAnchor = this.dataPicker.cells[fromAnchorKey];
      let toAnchor = this.dataPicker.cells[toAnchorKey];

      if (!fromAnchor) {
        const self = this;
        const x = (self.subdivisions * self.column) + self.subcolumn;
        const y = (self.subdivisions * (self.row % self.dataPicker.rows));

        const cellParams = {
          get x() { return x * this.w; },
          get y() { return y * this.h; },
          get w() { return self.dataPicker.width / (self.dataPicker.columns * self.subdivisions); },
          get h() { return self.dataPicker.height / (self.dataPicker.rows * self.subdivisions); },
          drawFn: self.drawFn,
          decodeFn: self.decodeFn,
          outputWidth: self.outputWidth,
          outputHeight: self.outputHeight,
          subdivisions: self.subdivisions,
          row: self.row,
          column: self.column,
          subrow: 0,
          subcolumn: self.subcolumn,
          dataPicker: self.dataPicker,
        }
        fromAnchor = new Cell(self.ctx, cellParams);
        self.dataPicker.cells[fromAnchorKey] = fromAnchor;
      }

      if (!toAnchor) {
        const self = this;
        const x = (self.subdivisions * self.column) + self.subcolumn;
        const y = (self.subdivisions * ((self.row + 1) % self.dataPicker.rows));

        const cellParams = {
          get x() { return x * this.w; },
          get y() { return y * this.h; },
          get w() { return self.dataPicker.width / (self.dataPicker.columns * self.subdivisions); },
          get h() { return self.dataPicker.height / (self.dataPicker.rows * self.subdivisions); },
          drawFn: self.drawFn,
          decodeFn: self.decodeFn,
          outputWidth: self.outputWidth,
          outputHeight: self.outputHeight,
          subdivisions: self.subdivisions,
          row: (self.row + 1) % self.dataPicker.rows,
          column: self.column,
          subrow: 0,
          subcolumn: self.subcolumn,
          dataPicker: self.dataPicker,
        }
        toAnchor = new Cell(self.ctx, cellParams);
        self.dataPicker.cells[toAnchorKey] = toAnchor;
      }

      this.vector = dl.tidy(() => {
        const from = dl.tensor1d(fromAnchor.vector);
        const to = dl.tensor1d(toAnchor.vector);
        const lerpAmount = 1 / this.subdivisions * this.subrow;
        return lerp(from, to, lerpAmount);
      }).getValues();
      this.image = this.decodeFn(this.vector);

      return;
    }
  };
  draw() {
    this.ctx.save();
    const scaleFactor = this.w / this.outputWidth;
    this.ctx.translate(this.x, this.y);
    this.ctx.scale(scaleFactor, scaleFactor);
    if (this.image) {
      this.drawFn(this.ctx, this.image);
    } else {
      this.ctx.strokeRect(0, 0, this.outputWidth, this.outputHeight);
      this.ctx.fillStyle = 'black'
      this.ctx.font = `${this.outputWidth/10}px Arial`;
      this.ctx.fillText(`${this.lerpVal}`, this.outputWidth/2, this.outputHeight/2);
    }
    this.ctx.restore();
  };
}

// Adds ctx.getTransform() - returns an SVGMatrix
// Adds ctx.transformedPoint(x,y) - returns an SVGPoint
const initCanvas = (ctx) => {
  var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
  var xform = svg.createSVGMatrix();
  ctx.getTransform = () => { return xform; };

  var savedTransforms = [];
  var save = ctx.save;
  ctx.save = () => {
    savedTransforms.push(xform.translate(0,0));
    return save.call(ctx);
  };

  var restore = ctx.restore;
  ctx.restore = () => {
    xform = savedTransforms.pop();
    return restore.call(ctx);
  };

  var scale = ctx.scale;
  ctx.scale = (sx,sy) => {
    xform = xform.scaleNonUniform(sx,sy);
    return scale.call(ctx,sx,sy);
  };

  var rotate = ctx.rotate;
  ctx.rotate = (radians) => {
    xform = xform.rotate(radians*180/Math.PI);
    return rotate.call(ctx,radians);
  };

  var translate = ctx.translate;
  ctx.translate = (dx,dy) => {
    xform = xform.translate(dx,dy);
    return translate.call(ctx,dx,dy);
  };

  var transform = ctx.transform;
  ctx.transform = (a,b,c,d,e,f) => {
    var m2 = svg.createSVGMatrix();
    m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
    xform = xform.multiply(m2);
    return transform.call(ctx,a,b,c,d,e,f);
  };

  var setTransform = ctx.setTransform;
  ctx.setTransform = (a,b,c,d,e,f) => {
    xform.a = a;
    xform.b = b;
    xform.c = c;
    xform.d = d;
    xform.e = e;
    xform.f = f;
    return setTransform.call(ctx,a,b,c,d,e,f);
  };

  var pt  = svg.createSVGPoint();
  ctx.transformedPoint = (x,y) => {
    pt.x=x; pt.y=y;
    return pt.matrixTransform(xform.inverse());
  }
};
