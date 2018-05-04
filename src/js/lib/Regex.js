module.exports = {
  CELLS: {
    RANDFONT: new RegExp(/=\s*randfont\(.*\)$/ig),
    SLIDER: new RegExp(/=\s*slider\(.*\)$/ig),
  },
  RANDFONT: {
    isValid: new RegExp(/RANDFONT\(\s*[\d]+\s*\)/ig),
  },
  SLIDER: new RegExp(/\s*slider/ig),
  CELL_REFERENCE: /([a-z]\d+)/gi,
  CELL_RANGE: /[a-z][\d]{1,2}\s*:\s*[a-z][\d]{1,2}/gi,
  DATAPICKER: /datapicker\(\s*["']\d-\d-\d-\d-\d["']\s*\)/gi,
};
