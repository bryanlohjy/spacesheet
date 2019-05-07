/*
  Node script to write out datapicker file + decode images
*/
const fs = require('fs');
const fetch = require('node-fetch');

const tf = require('@tensorflow/tfjs');

const base64ImageToFile = require('base64image-to-file');

const latentDims = 140;
const classDims = 1000;

/* Create list of latent vectors */
// const randVector = () => {
//   let array = tf.tidy(() => {
//     // return tf.randomNormal([1, latentDims], 0, 2);
//     return tf.randomUniform([1, latentDims], 0, 1);
//   }).dataSync();
//   return array;
// }
//
// const createVectors = (amt) => {
//   let vectors = [];
//   for (let i = 0; i < amt; i++) {
//     vectors.push(Array.from(randVector()));
//   }
//   return vectors;
// }
//
// let vectors = createVectors(25);
// fs.writeFile('latentVectors.json', JSON.stringify(vectors, null, 2), 'utf8', () => {});
// return;

/* Create distribution of labels from BigGAN Classes */
// const createLabelsFile = (numLabels) => {
//   let labels = [];
//
//   const classInterval = Math.floor(classDims/numLabels);
//
//   for (let labelIndex=0; labelIndex<numLabels; labelIndex++) {
//     let label = new Array(classDims).fill(0);
//     const classIndex = labelIndex*classInterval;
//
//     label[classIndex] = 1;
//     labels.push(label);
//   }
//
//   fs.writeFile('labels.json', JSON.stringify(labels), 'utf8', () => {});
// }
//
// createLabelsFile(1000);
//
// return;

/* Decode latents into images */
const modelUrl = "http://deeptom.staff.vuw.ac.nz:5000";
const decodeVector = (vec, label) => {
  const decodeUrl = `${modelUrl}/decode`;
  return fetch(decodeUrl, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `vector=${JSON.stringify(vec)}&label=${JSON.stringify(label)}`
  });
}
// DataPicker for Single Class
// const latents = require('./latentVectors.json');
// // //
// const strawBananaLabel =[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
// const label = strawBananaLabel;
// //
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
//
// const start = async () => {
//   let decodedLatents = [];
//
//   await asyncForEach(latents, async (latent, index) => {
//     let image = await decodeVector(latent, label);
//     image = await image.json();
//     base64ImageToFile(image, './reconstructions/', `image-${index}`, () => {});
//
//     const decodedLatent = {
//       latent,
//       image
//     };
//     console.log(index)
//     decodedLatents.push(decodedLatent);
//   });
//
//   fs.writeFile('decodedLatents.json', JSON.stringify(decodedLatents, null, 2), 'utf8', () => {});
// }
// start();
// // return
// //
// // /* Latents to DataPicker */
const decodedLatents = require('./decodedLatents.json');
const dataPickerSize = 5;

let dataPickerGrid = {
  data: {
    '0-0': {
      base64: '',
      column: 0,
      row: 0,
      vector: []
    }
  },
  grid: {
    rows: dataPickerSize,
    columns: dataPickerSize,
    decodeFromServer: true
  }
};

decodedLatents.forEach((latent, index) => {
  const row = Math.floor(index/dataPickerSize);
  const col = index-(row*dataPickerSize);
  const pickerCell = {
    base64: latent.image,
    row: row,
    column: col,
    vector: latent.latent.concat(latent.label)
  }

  const pickerKey = `${col}-${row}`;
  dataPickerGrid.data[pickerKey] = pickerCell;
});

fs.writeFile('dataPickerGrid.json', JSON.stringify(dataPickerGrid), 'utf8', () => {});

/* Cherrypick utils */
// let cherrypickedLabels = [];
// fs.readdir('./reconstructions/biggan-all/cherrypicked', (err, names) => {
//   names.forEach(name => {
//     const bigGANClassIndex = name.replace('image-', '').replace('.jpeg', '');
//     cherrypickedLabels.push(Number(bigGANClassIndex))
//   });
//   fs.writeFile('cherrypickedLabels.json', JSON.stringify(cherrypickedLabels, null), 'utf8', () => {});
// });

/* Multi-labelled Datapicker (latent is constant)*/
// const labels = require('./labels.json');

/* Reduce cherrypicked to num*/
// const cherrypickedIndexes = require('./cherrypickedLabels');
// const numToKeep = 25;
//
// let shuffled = cherrypickedIndexes.sort(() => 0.5 - Math.random());
// let reducedCherrypicked = shuffled.slice(0, 25);
// reducedCherrypicked = reducedCherrypicked.map(index => {
//   let oneHot = new Array(classDims).fill(0);
//   oneHot[index] = 1;
//   return oneHot;
// });
// fs.writeFile('reducedCherrypicked.json', JSON.stringify(reducedCherrypicked, null), 'utf8', () => {});

// const cherrypicked = require('./reducedCherrypicked.json');
//
// const start = async () => {
//   let decodedLatents = [];
//   const latent = new Array(latentDims).fill(0);
//
//   await asyncForEach(cherrypicked, async (label, index) => {
//     let image = await decodeVector(latent, label);
//     image = await image.json();
//     base64ImageToFile(image, './reconstructions/', `image-${index}`, () => {});
//
//     const decodedLatent = {
//       latent,
//       image,
//       label
//     };
//     console.log(index)
//     decodedLatents.push(decodedLatent);
//   });
//
//   fs.writeFile('decodedLatents.json', JSON.stringify(decodedLatents, null, 2), 'utf8', () => {});
// }
// start();
