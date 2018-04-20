import * as dl from 'deeplearn';
import { lerp } from '../../lib/tensorUtils.js';
import { map } from '../../lib/helpers.js';

export default class DataPicker {
  constructor(ctx, gridData, opts) {
    this.ctx = ctx;

    this.width = this.ctx.canvas.width;
    this.height = this.ctx.canvas.height;

    this.outputWidth = opts.outputWidth;
    this.outputHeight = opts.outputHeight;

    this.grid = gridData.data; // keys are [ column-row ]
    this.rows = gridData.grid.rows;
    this.columns = gridData.grid.columns;

    this.originX = this.width / 2;
    this.originY = this.height / 2;

    this.scale = 1;
    this.minScale = 1;
    this.maxScale = 15;

    this.minSize = 10;

    this.drawFn = opts.drawFn || (() => { return; });
    this.decodeFn = opts.decodeFn || (() => { return; });

    this.highlightedCells = [];

    initCanvas(ctx);
    /*
      Map of drawn objects, store under the key schema:
      [subdivision]-[columnIndex]-[rowIndex]-[subcolumnIndex]-[subrowIndex]
    */
    this.cells = {};
    this.draw();
  };
  updateHighlightedCells(references) {
    const prevHighlighted = this.highlightedCells;
    for (let keyIndex in prevHighlighted) {
      const key = prevHighlighted[keyIndex];
      this.cells[key].highlighted = false;
    }

    for (let keyIndex in references) {
      const key = references[keyIndex];
      this.cells[key].highlighted = true;
    }
    this.highlightedCells = references;
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
  get indicesToDraw() { // return an array of evenly distributed column indices to draw
    let indicesToDraw = [0];
    const minSize = this.minSize || this.columns;

    for (let i = 1; i < minSize - 1; i++) {
      const val = Math.floor(map(i, 0, minSize - 1, 0, this.columns - 1));
      indicesToDraw.push(val)
    }
    indicesToDraw.push(this.columns - 1);

    return indicesToDraw;
  };
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
    const toDraw = this.indicesToDraw;
    this.clearCanvas();
    for (let cellKey in this.grid) {
      const data = this.grid[cellKey];
      const column = toDraw.indexOf(data.column);
      const row = toDraw.indexOf(data.row);
      const shouldDraw = toDraw.indexOf(column) >= 0 && toDraw.indexOf(row) >= 0;

      if (!shouldDraw) {
        continue;
      } else {
        const cell = {
          column,
          row,
          w: this.width / toDraw.length,
          h: this.height / toDraw.length,
          get x() {
            return this.column * this.w;
          },
          get y() {
            return this.row * this.h;
          },
        };
        const subdivisions = this.subdivisions;
        for (let ySub = 0; ySub < subdivisions; ySub++) {
          for (let xSub = 0; xSub < subdivisions; xSub++) {
            const dataKey = `${subdivisions}-${cell.column}-${cell.row}-${xSub}-${ySub}`;
            let subCell = this.cells[dataKey];
            if (!subCell) {
              subCell = {
                w: cell.w / subdivisions,
                h: cell.h / subdivisions,
                get x() {
                  return cell.x + xSub * this.w;
                },
                get y() {
                  return cell.y + ySub * this.h;
                },
                get top() {
                  return this.y;
                },
                get right() {
                  return this.x + this.w;
                },
                get bottom() {
                  return this.y + this.h;
                },
                get left() {
                  return this.x;
                },
              };
            }
            // ignore element if out of bounds
            if (subCell.right < -this.translateX/this.scale) {
              continue;
            }
            if (subCell.left > (this.width - this.translateX)/this.scale) {
              continue;
            }
            if (subCell.top > (this.height-this.translateY)/this.scale) {
              continue;
            }
            if (subCell.bottom < -this.translateY/this.scale) {
              continue;
            }

            if (!this.cells[dataKey]) {
              // default to closest known data point
              let mappedX = data.column;
              let mappedY = data.row;

              // calculate position relative to grid
              if (subdivisions > 0) {
                if (!(xSub === 0 && ySub === 0)) {
                  const drawnIndexX = parseInt((cell.column * subdivisions + xSub));
                  const drawnIndexY = parseInt((cell.row * subdivisions + ySub));
                  const endColumn = toDraw[Math.min(cell.column + 1, this.minSize - 1)];
                  const endRow = toDraw[Math.min(cell.row + 1, this.minSize - 1)];
                  mappedX = map(drawnIndexX, cell.column * subdivisions, (cell.column + 1) * subdivisions, mappedX, endColumn).toFixed(2)
                  mappedY = map(drawnIndexY, cell.row * subdivisions, (cell.row + 1) * subdivisions, mappedY, endRow).toFixed(2)
                }
              }

              subCell.relativeX = mappedX;
              subCell.relativeY = mappedY;
              subCell.outputWidth = this.outputWidth;
              subCell.outputHeight = this.outputHeight;

              subCell = new Cell(this.ctx, this.drawFn, this.decodeFn, this.grid, subCell);
              this.cells[dataKey] = subCell;
            }
            subCell.draw();
          }
        }
        // draw data corners
        this.ctx.strokeStyle = '#C9C9C9';
        this.ctx.lineWidth = 2 / this.scale;
        const cornerSize = 3;
        // tl
        this.ctx.beginPath();
        this.ctx.moveTo(cell.x, cell.y + cornerSize);
        this.ctx.lineTo(cell.x, cell.y);
        this.ctx.lineTo(cell.x + cornerSize, cell.y);
        this.ctx.stroke();
        // tr
        this.ctx.beginPath();
        this.ctx.moveTo(cell.x + cell.w, cell.y + cornerSize);
        this.ctx.lineTo(cell.x + cell.w, cell.y);
        this.ctx.lineTo(cell.x  + cell.w - cornerSize, cell.y);
        this.ctx.stroke();
        // // br
        this.ctx.beginPath();
        this.ctx.moveTo(cell.x + cell.w, cell.y + cell.h - cornerSize);
        this.ctx.lineTo(cell.x + cell.w, cell.y + cell.h);
        this.ctx.lineTo(cell.x  + cell.w - cornerSize, cell.y + cell.h);
        this.ctx.stroke();
        // bl
        this.ctx.beginPath();
        this.ctx.moveTo(cell.x, cell.y + cell.h - cornerSize);
        this.ctx.lineTo(cell.x, cell.y + cell.h);
        this.ctx.lineTo(cell.x + cornerSize, cell.y + cell.h);
        this.ctx.stroke();

        // this.ctx.setLineDash([2, 4]);
        // this.ctx.lineDashOffset = 4;
        // this.ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);
        // }
      }
    }
  };
}

class Cell {
  constructor(ctx, drawFn, decodeFn, grid, params) {
    this.ctx = ctx;
    this.drawFn = drawFn;
    this.decodeFn = decodeFn;
    this.grid = grid;
    this.outputWidth = params.outputWidth;
    this.outputHeight = params.outputHeight;

    this.relativeX = params.relativeX;
    this.relativeY = params.relativeY;

    this.x = params.x;
    this.y = params.y;
    this.w = params.w;
    this.h = params.h;

    this.vector = this.computeVector();
    this.image = this.decodeFn(this.vector); // decoded vector

    this.highlighted = false;
  };
  computeVector() { // interpolates a vector relative to cell position, and then decodes that data
    const xPos = this.relativeX;
    const yPos = this.relativeY;

    const xFrom = Math.floor(xPos);
    const xTo = Math.ceil(xPos);
    const xBy = xPos - xFrom;

    const yFrom = Math.floor(yPos);
    const yTo = Math.ceil(yPos);
    const yBy = yPos - yFrom;

    if (xBy === 0 && yBy === 0) { // lookup non interp color
      const dataKey = `${xFrom}-${yFrom}`;
      return this.grid[dataKey].data;
    }
    return dl.tidy(() => { // interpolate
      const xFromData = this.grid[`${xFrom}-${yFrom}`].data;
      const xToData = this.grid[`${xTo}-${yFrom}`].data;
      const yFromData = this.grid[`${xFrom}-${yFrom}`].data;
      const yToData = this.grid[`${xFrom}-${yTo}`].data;

      // To be optimized further - sometimes only interpolating across one axis
      // Construct corners interpolation =================
      const t = dl.tensor1d(yFromData)
      const r = dl.tensor1d(xToData)
      const b = dl.tensor1d(yToData)
      const l = dl.tensor1d(xFromData)

      const hOperator = b.sub(t);
      const wOperator = r.sub(l);

      const tl = t.sub(wOperator.div(dl.scalar(2)));
      const tr = r.sub(hOperator.div(dl.scalar(2)));
      const br = b.add(wOperator.div(dl.scalar(2)));
      const bl = l.add(hOperator.div(dl.scalar(2)));

      const tChord = lerp(tl, tr, xBy);
      const bChord = lerp(bl, br, xBy);

      return lerp(tChord, bChord, yBy).getValues();
    });
  }
  draw() {
    this.ctx.save();
    const scaleFactor = this.w / this.outputWidth;
    this.ctx.translate(this.x, this.y);
    this.ctx.scale(scaleFactor, scaleFactor);
    if (this.highlighted) {
      this.ctx.save();
      this.ctx.rect(0, 0, this.outputWidth, this.outputHeight)
      this.ctx.fillStyle = 'rgba(255, 180, 0, 0.2)';
      this.ctx.strokeStyle = 'rgba(235, 160, 0, 1)';
      this.ctx.lineWidth = 1;
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();
    }
    this.drawFn(this.ctx, this.image);
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
