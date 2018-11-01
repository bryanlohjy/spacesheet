module.exports = {
  CELLS: {
    RANDVAR: new RegExp(/=\s*randvar\(.*\)$/ig),
    SLIDER: new RegExp(/=\s*slider\(.*\)$/ig),
    MOD: new RegExp(/=\s*mod\(.*\)$/ig),
  },
  RANDVAR: {
    isValid: new RegExp(/RANDVAR\(\s*[\d]+\s*\)/ig),
  },
  SLIDER: new RegExp(/\s*slider/ig),
  CELL_REFERENCE: /([a-z]\d+)/gi,
  CELL_RANGE: /[a-z][\d]{1,2}\s*:\s*[a-z][\d]{1,2}/gi,
};
