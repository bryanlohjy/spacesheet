const funcs = {
  saveJSON(data, fileName) {
    const a = document.createElement('a');
    a.setAttribute('href', `data:text/plain;charset=utf-u,${data}`);
    a.setAttribute('download', `${fileName}.json`);

    document.body.appendChild(a);
    a.setAttribute('style', 'display: none;');
    a.click();

    const parent = a.parentNode;
    parent.removeChild(a);
  },
}

module.exports = funcs;
