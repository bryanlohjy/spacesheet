const fs = require('fs');

const parseTsv = (data) => {
  let rows = data.split('\n');
  rows = rows.map(row => {
    return row.split('\t');
  });

  /* Clean up */
  rows = rows.map(row => {
    row = row.filter(val => val && val !== '\r');
    row = row.map(val => val.replace(/\r/gi, ''));
    return row;
  });

  return rows;
};

const toTrailId = (trail, name) => {
  let id = `${trail.join('-')}`.toLowerCase();

  if (name) {
    id += `-${name.toLowerCase()}`;
  }

  return id;
}

fs.readFile('./classes.tsv', 'utf8', (err, tsv) => {
  const data = parseTsv(tsv);

  let tree = [];
  let trailMap = {};

  data.forEach((row, rowIndex) => {
    let [bigGANClassIndex, name, aliases, ...classes] = row;

    let pointer = tree;

    let trailIds = [];
    // Create parent classes
    classes.forEach((_class, _classIndex) => {
      let trailId = classes.slice(0, _classIndex+1);
      trailId = trailId.join('-').toLowerCase();
      trailIds.push(trailId);

      let parent = pointer.find(child => child.trailId === trailId);

      if (!parent) {
        parent = {
          id: Math.random(),
          trailId: trailId,
          name: _class,
          children: []
        };
        pointer.push(parent);
      }
      pointer = parent.children;

      const endOfTrail = _classIndex === classes.length-1;

      if (endOfTrail) {
        const newClass = {
          id: Math.random(),
          trailId: `${trailId}-${name.toLowerCase()}`,
          name,
          children: [],
          bigGANClassIndex: Number(bigGANClassIndex)
        };

        pointer.push(newClass);
      }
    });

    trailMap[name] = trailIds;
  });

  fs.writeFile('tree.json', JSON.stringify(tree, null, 2), 'utf8', () => {});
  fs.writeFile('trailMap.json', JSON.stringify(trailMap, null, 2), 'utf8', () => {});
});
