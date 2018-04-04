const helpers = {
	random: function(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return (Math.random() * (max - min)) + min;
	},
	randomInt: function(min, max) { // max is non-inclusive
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min)) + min;
	},
	randomPick: function(arr, cb) {
		if (cb) { // return random picked and index of element
			const randomIndex = helpers.randomInt(0, arr.length-1);
			cb(arr[randomIndex], randomIndex);
		} else {
			return (arr[helpers.randomInt(0, arr.length-1)]);
		}
	},
  getData: function(url) { // function to get data from server
    return new Promise((resolve, reject) => {
      var req = new XMLHttpRequest();
      req.open('GET', url);
      req.onload = function() {
        if (req.status == 200) {
          resolve(req.response);
        } else {
          reject(Error(`Network Error: ${req.status}`));
        }
      }
      req.send();
    });
  },
	getFileName: function(path, removeExtension) {
		if (removeExtension) {
			let filename = path.split('/').pop().split('.');
			filename.pop();
			return filename.join('.');
		}
		return path.split('/').pop();
	},
  map: function(n, start1, stop1, start2, stop2, withinBounds) { // adapted from p5.js https://github.com/processing/p5.js/blob/master/src/math/calculation.js#L418
    const newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
    if (!withinBounds) {
      return newval;
    }
    if (start2 < stop2) {
      return Math.max(Math.min(newval, stop2), start2);
    } else {
      return Math.max(Math.min(newval, start2), stop2);
    }
  },
};
module.exports = helpers;
