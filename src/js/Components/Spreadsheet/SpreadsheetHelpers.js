const Regex = {
  cellReferences: /[a-z]\d{1,2}/ig,
  dataPickerFormula: /DATAPICKER\(([^)]+)\)/ig,
}

const GetCellType = cellData => {
  if (!cellData) { return; }
  if (cellData.trim()[0] === '=') {
    return 'FORMULA';
  } else {
    return 'TEXT';
  }
}

const highlightReferencesInString = (hotInstance, cellData) => {
  const cellReferences = parseCellReferences(cellData);
  if (cellReferences && cellReferences.length > 0) {
    for (let index in cellReferences) {
      const cellPos = cellReferences[index];
      const cell = hotInstance.getCell(cellPos.row, cellPos.column);
      cell.classList.add(`reference-cell-${index}`);
    }
  }
  const dataPickerReferences = parseDataPickerReferences(cellData);
  if (dataPickerReferences && dataPickerReferences.length > 0) {
    for (let index in dataPickerReferences) {
      const reference = dataPickerReferences[index]
      console.log(reference)
    }
  }
}

const clearHighlightedReferences = () => {
  const existingReferences = document.querySelectorAll("[class^='reference']");
  if (existingReferences && existingReferences.length > 0) {
    for (let index in existingReferences) {
      let reference = existingReferences[index];
      let classes = reference.classList;
      for (let classIndex in classes) {
        let className = classes[classIndex];
        if (className && className.toString().indexOf('reference-cell') >= 0) {
          reference.classList.remove(className);
        }
      }
    }
  }
}

const parseDataPickerReferences = cellData => {
  let references = cellData.match(Regex.dataPickerFormula);
  if (references && references.length > 0) {
    references = references.map(dataPickerReference => {
      return (/\(([^)]+)\)/ig).exec(dataPickerReference)[1].replace(/\"|'/g, "");
    });
  }
  return references;
}

const parseCellReferences = cellData => {
  let references = cellData.match(Regex.cellReferences);
  if (references && references.length > 0) {
    references = references.map(cell => {
      return cellReferenceToCoord(cell)
    });
  }
  return references;
}

const cellReferenceToCoord = cellReference => {
  const alphabet = cellReference.match(/[a-z]/ig)[0];
  const number = cellReference.match(/[0-9]+/ig)[0];
  const charString = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const res = {};
  if (alphabet && number) {
    res.row = parseInt(number) - 1;
    res.column = charString.indexOf(alphabet.toUpperCase());
  }
  return res;
}

module.exports = { highlightReferencesInString, clearHighlightedReferences, GetCellType };
