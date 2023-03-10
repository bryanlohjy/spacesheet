import * as dl from 'deeplearn';
import { randomInt } from '../../lib/helpers';

export default class Formulae {
  constructor(opts) {
    this.getCellFromDataPicker = opts.getCellFromDataPicker;
    this.model = opts.model;
    this.modSegmentCount = opts.modSegmentCount;
  };
  DATAPICKER(params) {
    return this.getCellFromDataPicker(params);
  };
  RANDVAR(params) {
    return this.model.randVectorFn(params);
  };
  AVERAGE(params) {
    let result = 0;
    for (let i = 0; i < params.length; i++) {
      result += Number(params[i]);
    }
    return result /= params.length;
  };
  AVERAGE_TENSOR(params) {
    return dl.tidy(() => {
      let total;
      let count = 0;
      for (count; count < params.length; count++) {
        const param = params[count];
        if (param) {
          if (!total) {
            total = dl.tensor1d(param);
          } else {
            total = total.add(dl.tensor1d(param));
          }
        }
      }
      if (total) {
        return total.div(dl.scalar(count));
      }
    }).dataSync();
  };
  MINUS_TENSOR(params) {
    if (params.length > 2 || params.length === 1) {
      return;
    }
    return dl.tidy(() => {
      let total;
      for (let count = 0; count < params.length; count++) {
        const param = params[count];
        if (param) {
          if (!total) {
            total = dl.tensor1d(param);
          } else {
            total = total.sub(dl.tensor1d(param));
          }
        }
      }
      return total;
    }).dataSync();
  };
  SUM(params) {
    if (!params || params.length < 2) { return '#N/A'; }
    let total = 0;
    for (let index = 0; index < params.length; index++) {
      total += Number(params[index]);
    }
    return total;
  };
  SUM_TENSOR(params) {
    if (!params || params.length < 2) { return '#N/A'; }
    return dl.tidy(() => {
      let total;
      for (let count = 0; count < params.length; count++) {
        const param = params[count];
        if (param) {
          if (!total) {
            total = dl.tensor1d(param);
          } else {
            total = total.add(dl.tensor1d(param));
          }
        }
      }
      return total;
    }).dataSync();
  };
  LERP(params) {
    if (params.length !== 3) {
      return '#N/A';
    }
    const from = params[0];
    const to = params[1];
    const by = params[2];
    return from + ((to - from) * by);
  };
  LERP_TENSOR(params) {
    if (params.length !== 3) { return '#N/A'; }

    return dl.tidy(() => {
      const from = dl.tensor1d(params[0]);
      const to = dl.tensor1d(params[1]);
      const step = params[2];
      return from.add(to.sub(from).mul(dl.scalar(step)));
    }).dataSync();
  };
  MULTIPLY(params) {
    const validParams = params.filter(param => param || param === 0);
    if (validParams.length < 2) {
      return '#N/A';
    }
    params = validParams;
    let result;
    for (let i = 0; i < params.length; i++) {
      if (isNaN(result)) {
        result = params[i]
      } else {
        result *= Number(params[i]);
      }
    }
    return result;
  };
  MULTIPLY_TENSOR(params) {
    const validParams = params.filter(param => param || param === 0);
    if (validParams.length < 2) {
      return '#N/A';
    }
    params = validParams;
    return dl.tidy(() => {
      let total;
      for (let count = 0; count < params.length; count++) {
        let param = params[count];
        if (typeof param === "object") {
          param = dl.tensor1d(param);
        } else {
          param = dl.scalar(param);
        }
        if (!total) {
          total = param;
        } else {
          total = total.mul(param);
        }
      }
      return total;
    }).dataSync();
  };
  SLERP(params) {
    return '#N/A';
  };
  SLERP_TENSOR(params) {
    if (params.length !== 3) {
      return '#N/A';
    }
    return dl.tidy(() => {
      const from = dl.tensor1d(params[0]);
      const to = dl.tensor1d(params[1]);
      const step = params[2];
      const omega = dl.acos(from.mul(to));
      const so = dl.sin(omega);
      return dl.sin(omega.mul(dl.scalar(1 - step)).div(so).mul(from).add(dl.sin(dl.scalar(step).mul(omega)).div(so).mul(to)));
    }).dataSync();
  };
  DIST(params) {
    return '#N/A';
  };
  DIST_TENSOR(params) {
    if (params.length !== 2) {
      return '#N/A';
    }
    return dl.tidy(() => {
      const a = dl.tensor1d(params[0]);
      const b = dl.tensor1d(params[1]);
      return b.sub(a).square().sum().sqrt();
    }).dataSync()[0].toString();
  };
  SLIDER(params) {
    const validParams = params.filter(val => { return !isNaN(val) })
    if (validParams.length < 2 || validParams.length > 3) {
      return '#N/A';
    }

    let min = validParams[0];
    let max = validParams[1];
    let step = validParams[2] || (max - min) / 20;

    if (min === max) {
      return '#N/A';
    } else if (step > Math.abs(max - min)) {
      return '#N/A';
    }

    return { min, max, step, };
  };
  SLIDER_TENSOR(params) {
    return '#N/A';
  };
  DOT(params) {
    return '#N/A';
  };
  DOT_TENSOR(params) {
    if (params.length !== 2) {
      return '#N/A';
    }
    return dl.tidy(() => { // multiply two vectors, and sum resulting vector
      const multiplied = dl.tensor1d(params[0]).mul(dl.tensor1d(params[1]));
      return multiplied.sum();
    }).dataSync()[0];
  };
  MOD(params) {
    return '#N/A';
  };
  MOD_TENSOR(params) {
    /*
      [from, segment, dist]
      interpolates between [from] and a RANDVAR seeded by [segment] by [dist] amount
    */

    const segment = params[1];
    const dist = params[2];
    const segmentOutOfBounds = segment && (segment > this.modSegmentCount || segment < 0);

    if (params.length !== 3) {
      return '#N/A';
    }

    return dl.tidy(() => {
      let from = dl.tensor1d(params[0]);
      let to = dl.tensor1d(this.model.randVectorFn(segment));
      let step = dist/1.5; // max level of deviation from base
      return from.add(to.sub(from).mul(dl.scalar(step)));
    }).dataSync();
  };

  call(name, params, isTensorCalculation) {
    const aliases = {
      'ADD': 'SUM',
      'INTERPOLATE': 'LERP',
      'MUL': 'MULTIPLY',
    };

    name = name.toUpperCase();
    if (aliases[name]) {
      name = aliases[name];
    }

    let formulaKey = `${name.toUpperCase()}${isTensorCalculation ? '_TENSOR' : ''}`;

    if (!this[formulaKey]) {
      return;
    } else {
      params = params.filter(param => (!isNaN(parseInt(param)) || param));
      return this[formulaKey](params);
    }
  };
};
