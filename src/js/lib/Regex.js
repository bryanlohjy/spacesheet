module.exports = {
  CELLS: {
    RANDFONT: new RegExp(/=\s*randfont\(.*\)$/ig),
    SLIDER: new RegExp(/=\s*slider\(.*\)$/ig),
  },
  RANDFONT: {
    isValid: new RegExp(/RANDFONT\(\s*[\d]+\s*\)/ig),
  },
  SLIDER: new RegExp(/\s*slider/ig),
};
