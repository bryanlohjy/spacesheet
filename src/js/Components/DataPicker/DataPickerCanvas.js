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

    initCanvas(ctx);
    /*
      Map of drawn objects, store under the key schema:
      [subdivision]-[columnIndex]-[rowIndex]-[subcolumnIndex]-[subrowIndex]
    */
    this.cells = {};
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
    // iterate through grid, drawing all anchors
    for (let y = 0; y < totalRows; y++) {
      for (let x = 0; x < totalColumns; x++) {
        if (y % intermediates === 0 && x % intermediates === 0) {
          const row = Math.floor(y / intermediates);
          const column = Math.floor(x / intermediates);
          const subrow = y % intermediates;
          const subcolumn = x % intermediates;

          const cellKey = `${ intermediates }-${ column }-${ row }-${ subcolumn }-${ subrow }`;

          if (!this.cells[cellKey]) {
            const anchorKey = `${ column }-${ row }`;
            const anchor = this.grid[anchorKey];
            const self = this;
            // console.log(column, x, intermediates)
            const cellParams = {
              get x() {
                return x * this.w;
              },
              get y() {
                return y * this.h;
              },
              get w() {
                return self.width / (self.columns * intermediates);
              },
              get h() {
                return self.height / (self.rows * intermediates);
              },
              image: anchor.image,
              vector: anchor.data,
              drawFn: this.drawFn,
              decodeFn: this.decodeFn,
              outputWidth: this.outputWidth,
              outputHeight: this.outputHeight,
              row,
              column,
              subrow,
              subcolumn,
            };
            this.cells[cellKey] = new Cell(this.ctx, cellParams);
          }
          this.cells[cellKey].draw();
        }
      }
    }

    // draw horizontals
    for (let y = 0; y < totalRows; y++) {
      for (let x = 0; x < totalColumns; x++) {
        if (y % intermediates === 0 && x % intermediates !== 0) {
          const row = Math.floor(y / intermediates);
          const column = Math.floor(x / intermediates);
          const subrow = y % intermediates;
          const subcolumn = x % intermediates;

          const cellKey = `${ intermediates }-${ column }-${ row }-${ subcolumn }-${ subrow }`;

          if (!this.cells[cellKey]) {
            const prevCellKey =  `${ intermediates }-${ column }-${ row }-0-0`;
            const nextCellKey =  `${ intermediates }-${ (column + 1) % this.columns }-${ row }-0-0`;

            const fromAnchor = this.cells[prevCellKey];
            const toAnchor = this.cells[nextCellKey];


            const self = this;
            //
            if (!fromAnchor.vector || !toAnchor.vector ) {
              console.log(prevCellKey, nextCellKey)
            }

            const vector = dl.tidy(() => {
              const from = dl.tensor1d(fromAnchor.vector);
              const to = dl.tensor1d(toAnchor.vector);
              const lerpAmount = 1 / intermediates * subcolumn;
              return lerp(from, to, lerpAmount)
            }).getValues();

            const cellParams = {
              get x() {
                return x * this.w;
              },
              get y() {
                return y * this.h;
              },
              get w() {
                return self.width / (self.columns * intermediates);
              },
              get h() {
                return self.height / (self.rows * intermediates);
              },
              // image: fromAnchor.image,
              vector: vector,
              // lerpVal: lerpAmount,
              drawFn: this.drawFn,
              decodeFn: this.decodeFn,
              outputWidth: this.outputWidth,
              outputHeight: this.outputHeight,
              row,
              column,
              subrow,
              subcolumn,
            };
            this.cells[cellKey] = new Cell(this.ctx, cellParams);
          }
          this.cells[cellKey].draw();
        }
      }
    }

//         const row = y / intermediates;
//         const column = x / intermediates;
//         if (row % intermediates == 0 && column % intermediates == 0) {
//           // draw anchors
//           const anchorKey = `${ column }-${ row }`;
//           const anchor = this.grid[anchorKey];
//           const dataKey = `${ this.subdivisions }-${ column }-${ row }-0-0`;
//           if (!this.cells[dataKey]) {
//             const self = this;
//             const cellParams = {
//               get x() {
//                 return x * this.w;
//               },
//               get y() {
//                 return y * this.h;
//               },
//               get w() {
//                 return self.width / (self.columns * intermediates);
//               },
//               get h() {
//                 return self.height / (self.rows * intermediates);
//               },
//               image: anchor.image,
//               vector: anchor.data,
//               drawFn: this.drawFn,
//               decodeFn: this.decodeFn,
//               outputWidth: this.outputWidth,
//               outputHeight: this.outputHeight,
//             };
//             // logic to draw only necessary interpolations ....
//             // check to see if rendering is
//             //         get top() {
//             //           return this.y;
//             //         },
//             //         get right() {
//             //           return this.x + this.w;
//             //         },
//             //         get bottom() {
//             //           return this.y + this.h;
//             //         },
//             //         get left() {
//             //           return this.x;
//             //         },
//
//             //     if (subCell.right < -this.translateX/this.scale) {
//             //       continue;
//             //     }
//             //     if (subCell.left > (this.width - this.translateX)/this.scale) {
//             //       continue;
//             //     }
//             //     if (subCell.top > (this.height-this.translateY)/this.scale) {
//             //       continue;
//             //     }
//             //     if (subCell.bottom < -this.translateY/this.scale) {
//             //       continue;
//             //     }
//
//             const cell = new Cell(this.ctx, cellParams);
//             this.cells[dataKey] = cell;
//           }
//           this.cells[dataKey].draw();
//         }
//       }
//     }
//
//     // iterate through grid, drawing horizontals between anchor points
//     for (let y = 0; y < this.rows * intermediates; y++) {
//       for (let x = 0; x < this.columns * intermediates; x++) {
//         const row = y / intermediates;
//         const column = x / intermediates;
//         if (row % intermediates == 0 && column % intermediates != 0) {
//           const dataKey = `${ this.subdivisions }-${ column }-${ row }-${y % intermediates}-${x % intermediates}`;
//           if (!this.cells[dataKey]) {
//             console.log(row, column)
//             // const prevX = Math.floor(x)
//             const lastX = Math.floor(x / intermediates);
//             let nextX = (lastX + 1) % this.columns;
//
//             const lastXKey = `${ this.subdivisions }-${ lastX }-${ row }-0-0`;
//             const lastXAnchor = this.cells[lastXKey];
//
//             const nextXKey = `${ this.subdivisions }-${ nextX }-${ row }-0-0`;
//             const nextXAnchor = this.cells[nextXKey];
//
//             // if (!nextXAnchor) {
//             //   console.log(nextXKey, 'doesnt exist', this.cells)
//             // }
//             // if (!lastXAnchor) {
//             //   console.log(lastXKey, 'doesnt exist')
//             // }
//
//
//             const degree = (x - lastX) / intermediates;
//             // if (lastXAnchor && nextXAnchor) {
//             //   console.log(lastXKey, nextXKey)
//             // const vector = dl.tidy(() => {
//             //   return lerp(dl.tensor1d(lastXAnchor.vector), dl.tensor1d(nextXAnchor.vector), degree);
//             // }).getValues();
//               // console.log(vector)
//             //
//             // }
//             // let vector;
//             // work out fromX, toX, degreeX
//             // calc interpolation and insert
//             const self = this;
//             const cellParams = {
//               get x() {
//                 return x * this.w;
//               },
//               get y() {
//                 return y * this.h;
//               },
//               get w() {
//                 return self.width / (self.columns * intermediates);
//               },
//               get h() {
//                 return self.height / (self.rows * intermediates);
//               },
//               vector: null,
//               // image: image,
//               drawFn: this.drawFn,
//               decodeFn: this.decodeFn,
//               outputWidth: this.outputWidth,
//               outputHeight: this.outputHeight,
//             };
//             const cell = new Cell(this.ctx, cellParams);
//             this.cells[dataKey] = cell;
//           }
//           this.cells[dataKey].draw();
//
// //           lastX = space * (x // space)
// //           nextX = lastX + space
// //           fracX = (x - lastX) / float(space)
// // #                 print("{} - {} - {}".format(lastX, nextX, fracX))
// //           u_list[y,x,:] = lerpv(fracX, u_list[y, lastX, :], u_list[y, nextX, :])
//         }
//       }
//     }
    // for (let y = 0; y < this.rows * intermediates; y++) {
    //   for (let x = 0; x < this.columns * intermediates; x++) {
    //     if (y % intermediates == 0 && x % intermediates == 0) {
    //       // draw anchors
    //       const anchorKey = `${y}-${x}`;
    //       const anchor = this.grid[anchorKey];
    //     }
    //   }
    // }

    // iterate through grid, drawing verticals between anchor points







          // if (y % intermediates == 0 || x % intermediates != 0) {
          //   const fromX =
          //   // const fromX = intermediates * Math.floor(x / intermediates);
          //   // const toX = fromX + intermediates;
          //   // const
          // }
        //     // if y%space == 0 and x%space != 0:
        //     //     lastX = space * (x // space)
        //     //     nextX = lastX + space
        //     //     fracX = (x - lastX) / float(space)
        //     //       print("{} - {} - {}".format(lastX, nextX, fracX))
        //     //     u_list[y,x,:] = lerpv(fracX, u_list[y, lastX, :], u_list[y, nextX, :])


        // const cellParams = {
        //   column
        // };

        //     const dataKey = `${subdivisions}-${cell.column}-${cell.row}-${xSub}-${ySub}`;
        //     let subCell = this.cells[dataKey];
        //     if (!subCell) {
        //       subCell = {
        //         w: cell.w / subdivisions,
        //         h: cell.h / subdivisions,
        //         get x() {
        //           return cell.x + xSub * this.w;
        //         },
        //         get y() {
        //           return cell.y + ySub * this.h;
        //         },
        //         get top() {
        //           return this.y;
        //         },
        //         get right() {
        //           return this.x + this.w;
        //         },
        //         get bottom() {
        //           return this.y + this.h;
        //         },
        //         get left() {
        //           return this.x;
        //         },

        //     if (subCell.right < -this.translateX/this.scale) {
        //       continue;
        //     }
        //     if (subCell.left > (this.width - this.translateX)/this.scale) {
        //       continue;
        //     }
        //     if (subCell.top > (this.height-this.translateY)/this.scale) {
        //       continue;
        //     }
        //     if (subCell.bottom < -this.translateY/this.scale) {
        //       continue;
        //     }



        // const cell = {
        //   column,
        //   row,
        //   w: this.width / toDraw.length,
        //   h: this.height / toDraw.length,
        //   get x() {
        //     return this.column * this.w;
        //   },
        //   get y() {
        //     return this.row * this.h;
        //   },
        // };
    // for (let y = 0; y < this.rows; y++) {
    //   for (let x = 0; x < this.columns; x++) {
    //     const anchorKey = `${y}-${x}`;
    //     const cell = {
    //       column: x,
    //       row: y,
    //       w: this.width / this.columns,
    //       h: this.height / this.rows,
    //       get x() {
    //         return this.column * this.w;
    //       },
    //       get y() {
    //         return this.row * this.h;
    //       },
    //     };
    //
    //     // console.log(x, y)
    //     // if ()
    //   }
    // }


    // find amount of spaces in between

    // construct horizontals

    // construct verticals




    // for (let cellKey in this.grid) {
    //   const data = this.grid[cellKey];
    //   const column = toDraw.indexOf(data.column);
    //   const row = toDraw.indexOf(data.row);
    //   const shouldDraw = toDraw.indexOf(column) >= 0 && toDraw.indexOf(row) >= 0;
    //
    //   if (!shouldDraw) {
    //     continue;
    //   } else {
    //


        // const cell = {
        //   column,
        //   row,
        //   w: this.width / toDraw.length,
        //   h: this.height / toDraw.length,
        //   get x() {
        //     return this.column * this.w;
        //   },
        //   get y() {
        //     return this.row * this.h;
        //   },
        // };
        // const subdivisions = this.subdivisions;
        // for (let ySub = 0; ySub < subdivisions; ySub++) {
        //   for (let xSub = 0; xSub < subdivisions; xSub++) {
        //     const dataKey = `${subdivisions}-${cell.column}-${cell.row}-${xSub}-${ySub}`;
        //     let subCell = this.cells[dataKey];
        //     if (!subCell) {
        //       subCell = {
        //         w: cell.w / subdivisions,
        //         h: cell.h / subdivisions,
        //         get x() {
        //           return cell.x + xSub * this.w;
        //         },
        //         get y() {
        //           return cell.y + ySub * this.h;
        //         },
        //         get top() {
        //           return this.y;
        //         },
        //         get right() {
        //           return this.x + this.w;
        //         },
        //         get bottom() {
        //           return this.y + this.h;
        //         },
        //         get left() {
        //           return this.x;
        //         },
        //       };
        //     }
        //     // ignore element if out of bounds
        //     if (subCell.right < -this.translateX/this.scale) {
        //       continue;
        //     }
        //     if (subCell.left > (this.width - this.translateX)/this.scale) {
        //       continue;
        //     }
        //     if (subCell.top > (this.height-this.translateY)/this.scale) {
        //       continue;
        //     }
        //     if (subCell.bottom < -this.translateY/this.scale) {
        //       continue;
        //     }
        //
        //     if (!this.cells[dataKey]) {
        //       // default to closest known data point
        //       let mappedX = data.column;
        //       let mappedY = data.row;
        //
        //       // calculate position relative to grid
        //       if (subdivisions > 0) {
        //         if (!(xSub === 0 && ySub === 0)) {
        //           const drawnIndexX = parseInt((cell.column * subdivisions + xSub));
        //           const drawnIndexY = parseInt((cell.row * subdivisions + ySub));
        //           const endColumn = toDraw[Math.min(cell.column + 1, this.minSize - 1)];
        //           const endRow = toDraw[Math.min(cell.row + 1, this.minSize - 1)];
        //           mappedX = map(drawnIndexX, cell.column * subdivisions, (cell.column + 1) * subdivisions, mappedX, endColumn).toFixed(2)
        //           mappedY = map(drawnIndexY, cell.row * subdivisions, (cell.row + 1) * subdivisions, mappedY, endRow).toFixed(2)
        //         }
        //       }
        //
        //
        //       const cellParams = subCell;
        //       cellParams.drawFn = this.drawFn;
        //       cellParams.decodeFn = this.decodeFn;
        //       cellParams.grid = this.grid;
        //       cellParams.relativeX = mappedX;
        //       cellParams.relativeY = mappedY;
        //       cellParams.outputWidth = this.outputWidth;
        //       cellParams.outputHeight = this.outputHeight;
        //
        //       subCell = new Cell(this.ctx, cellParams);
        //       this.cells[dataKey] = subCell;
        //     }
        //     subCell.draw();
        //   }
        // }
        // draw data corners
        // this.ctx.strokeStyle = '#C9C9C9';
        // this.ctx.lineWidth = 2 / this.scale;
        // const cornerSize = 3;
        // // tl
        // this.ctx.beginPath();
        // this.ctx.moveTo(cell.x, cell.y + cornerSize);
        // this.ctx.lineTo(cell.x, cell.y);
        // this.ctx.lineTo(cell.x + cornerSize, cell.y);
        // this.ctx.stroke();
        // // tr
        // this.ctx.beginPath();
        // this.ctx.moveTo(cell.x + cell.w, cell.y + cornerSize);
        // this.ctx.lineTo(cell.x + cell.w, cell.y);
        // this.ctx.lineTo(cell.x  + cell.w - cornerSize, cell.y);
        // this.ctx.stroke();
        // // // br
        // this.ctx.beginPath();
        // this.ctx.moveTo(cell.x + cell.w, cell.y + cell.h - cornerSize);
        // this.ctx.lineTo(cell.x + cell.w, cell.y + cell.h);
        // this.ctx.lineTo(cell.x  + cell.w - cornerSize, cell.y + cell.h);
        // this.ctx.stroke();
        // // bl
        // this.ctx.beginPath();
        // this.ctx.moveTo(cell.x, cell.y + cell.h - cornerSize);
        // this.ctx.lineTo(cell.x, cell.y + cell.h);
        // this.ctx.lineTo(cell.x + cornerSize, cell.y + cell.h);
        // this.ctx.stroke();
      // }
    // }
  };
}

class Cell {
  constructor(ctx, params) {
    this.ctx = ctx;
    this.drawFn = params.drawFn;
    this.decodeFn = params.decodeFn;

    this.vector = params.vector;

    this.row = params.row;
    this.column = params.column;
    this.subrow = params.subrow;
    this.subcolumn = params.subcolumn;

    if (!this.image && this.vector) {
      this.image = this.decodeFn(this.vector);
    } else {
      this.image = params.image || null;
    }
    this.lerpVal = params.lerpVal;

    this.x = params.x;
    this.y = params.y;
    this.w = params.w;
    this.h = params.h;

    this.outputWidth = params.outputWidth;
    this.outputHeight = params.outputHeight;
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


// class Cell {
//   constructor(ctx, params) {
//     this.ctx = ctx;
//     this.drawFn = params.drawFn;
//     this.decodeFn = params.decodeFn;
//     this.grid = params.grid;
//     this.outputWidth = params.outputWidth;
//     this.outputHeight = params.outputHeight;
//
//     this.relativeX = params.relativeX;
//     this.relativeY = params.relativeY;
//
//     this.x = params.x;
//     this.y = params.y;
//     this.w = params.w;
//     this.h = params.h;
//
//     this.vector = this.computeVector();
//     this.image = this.decodeFn(this.vector); // decoded vector
//   };
//   computeVector() { // interpolates a vector relative to cell position, and then decodes that data
//     const xPos = this.relativeX;
//     const yPos = this.relativeY;
//
//     const xFrom = Math.floor(xPos);
//     const xTo = Math.ceil(xPos);
//     const xBy = xPos - xFrom;
//
//     const yFrom = Math.floor(yPos);
//     const yTo = Math.ceil(yPos);
//     const yBy = yPos - yFrom;
//
//     // if (xBy === 0 && yBy === 0) { // lookup non interp color
//       const dataKey = `${xFrom}-${yFrom}`;
//       return this.grid[dataKey].data;
//     // }
//     // return dl.tidy(() => { // interpolate
//     //   const xFromData = this.grid[`${xFrom}-${yFrom}`].data;
//     //   const xToData = this.grid[`${xTo}-${yFrom}`].data;
//     //   const yFromData = this.grid[`${xFrom}-${yFrom}`].data;
//     //   const yToData = this.grid[`${xFrom}-${yTo}`].data;
//     //
//     //   // To be optimized further - sometimes only interpolating across one axis
//     //   // Construct corners interpolation =================
//     //   const t = dl.tensor1d(yFromData)
//     //   const r = dl.tensor1d(xToData)
//     //   const b = dl.tensor1d(yToData)
//     //   const l = dl.tensor1d(xFromData)
//     //
//     //   const hOperator = b.sub(t);
//     //   const wOperator = r.sub(l);
//     //
//     //   const tl = t.sub(wOperator.div(dl.scalar(2)));
//     //   const tr = r.sub(hOperator.div(dl.scalar(2)));
//     //   const br = b.add(wOperator.div(dl.scalar(2)));
//     //   const bl = l.add(hOperator.div(dl.scalar(2)));
//     //
//     //   const tChord = lerp(tl, tr, xBy);
//     //   const bChord = lerp(bl, br, xBy);
//     //
//     //   return lerp(tChord, bChord, yBy).getValues();
//     // });
//   }
//   draw() {
//     this.ctx.save();
//     const scaleFactor = this.w / this.outputWidth;
//     this.ctx.translate(this.x, this.y);
//     this.ctx.scale(scaleFactor, scaleFactor);
//     this.drawFn(this.ctx, this.image);
//     this.ctx.restore();
//   };
// }

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
