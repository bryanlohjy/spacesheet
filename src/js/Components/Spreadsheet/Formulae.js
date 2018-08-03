import * as dl from 'deeplearn';
import { randomInt } from '../../lib/helpers';

export default class Formulae {
  constructor(opts) {
    this.getCellFromDataPicker = opts.getCellFromDataPicker;
    this.model = opts.model;
  };
  DATAPICKER(params) {
    return this.getCellFromDataPicker(params);
  };
  RANDFONT(params) {
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
    }).getValues();
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
    }).getValues();
  };
  SUM(params) {
    let total = 0;
    for (let index = 0; index < params.length; index++) {
      total += Number(params[index]);
    }
    return total;
  };
  SUM_TENSOR(params) {
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
    }).getValues();
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
    if (params.length !== 3) {
      return '#N/A';
    }
    return dl.tidy(() => {
      const from = isNaN(params[0]) ? dl.tensor1d(params[0]) : dl.scalar(params[0]);
      const to = isNaN(params[1]) ? dl.tensor1d(params[1]) : dl.scalar(params[1]);
      const step = params[2];
      return from.add(to.sub(from).mul(dl.scalar(step)));
    }).getValues();
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
    }).getValues();
  };
  SLERP(params) {
    return '#N/A';
  };
  SLERP_TENSOR(params) {
    if (params.length !== 3) {
      return '#N/A';
    }
    return dl.tidy(() => {
      const from = isNaN(params[0]) ? dl.tensor1d(params[0]) : dl.scalar(params[0]);
      const to = isNaN(params[1]) ? dl.tensor1d(params[1]) : dl.scalar(params[1]);
      const step = params[2];
      const omega = dl.acos(from.mul(to));
      const so = dl.sin(omega);
      return dl.sin(omega.mul(dl.scalar(1 - step)).div(so).mul(from).add(dl.sin(dl.scalar(step).mul(omega)).div(so).mul(to)));
    }).getValues();
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
    }).getValues()[0].toString();
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
    }).getValues()[0];
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
      return this[formulaKey](params);
    }
  };
};
