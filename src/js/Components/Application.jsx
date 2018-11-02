import React from 'react';
import PropTypes from 'prop-types';

import ModelLoader from '../lib/ModelLoader.js';
import ModelToLoad from '../Models/MNISTModel.js';
// import ModelToLoad from '../Models/FontModel.js';
// import ModelToLoad from '../Models/Colours.js';
// import ModelToLoad from '../Models/Word2Vec.js';
// import ModelToLoad from '../Models/FaceModel.js';

// import GenerateDataPicker from '../lib/DataPickerGenerator.js';
// import DataPickerGrids from './DataPickerGrids/FontModel/FontDataPickers.js';
// import DataPickerGrids from './DataPickerGrids/FaceModel/FaceDataPickers.js';
// import DataPickerGrids from './DataPickerGrids/ColorModel/ColorDataPicker.js';
// import DataPickerGrids from './DataPickerGrids/Word2Vec/Word2VecDataPicker.js';
import DataPickerGrids from './DataPickerGrids/MNISTModel/MNISTDataPicker.js';

import DataPickers from './DataPicker/DataPickers.jsx';
import FontDrawer from './FontDrawer/FontDrawer.jsx';

import Spreadsheet from './Spreadsheet/Spreadsheet.jsx';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { matrixForEach, cellCoordsToLabel } from './Spreadsheet/CellHelpers.js';
import { formatDate } from '../lib/helpers.js';

export default class Application extends React.Component {
  constructor(props) {
    super(props);

    const debugMode = Boolean(window.location.hash && window.location.hash.toLowerCase() === '#debug');

    this.state = {
      model: null,
      currentModel: 'MNIST', // FACES, FONTS, MNIST, COLOURS
      // currentModel: 'FACES', // FACES, FONTS, MNIST, COLOURS

      inputBarValue: "",
      dataPickerGrids: null,
      debugMode
    };

    this.onHashChange = this.onHashChange.bind(this);

    this.setSpreadsheetCellFromDataPicker = this.setSpreadsheetCellFromDataPicker.bind(this);
    this.getCellFromDataPicker = this.getCellFromDataPicker.bind(this);
    this.setInputBarValue = this.setInputBarValue.bind(this);
    this.saveVectors = this.saveVectors.bind(this);
  };

  componentDidMount() { // Initialise model + load grid data for DataPicker
    this.bottomNav = this.refs.bottomNav;
    this.memoryCtx = this.refs.memoryCanvas.getContext('2d'); // used to store and render drawings

    const loader = new ModelLoader(this, ModelToLoad);
    loader.load(res => {
      if (!res.errors) {
        let dataPickerGrids;
        try {
          dataPickerGrids = DataPickerGrids;
        } catch (e) {
          dataPickerGrids = GenerateDataPicker(10, 10, 'DATAPICKER', res.model);
        }
        // setTimeout(() => {
          this.setState({
            model: res.model,
            dataPickerGrids: dataPickerGrids,
          });
        // }, 5000)
      } else {
        console.error(res.errors);
      }
    });


    window.addEventListener('hashchange', this.onHashChange, false);
  };

  onHashChange(e) {
    if (window.location.hash && window.location.hash.toLowerCase() === '#debug') {
      this.setState({
        debugMode: true,
      });
    } else {
      this.setState({
        debugMode: false,
      });
    }
  };

  saveVectors(e) {
    const zip = new JSZip();
    const img = zip.folder("images");

    const vectors = {};

    const sheetData = this.hotInstance.getData();

    matrixForEach(sheetData, (val, row, col) => {
      if (val && String(val).trim()[0] === '=') {
        const cell = this.hotInstance.getCell(row, col);
        const canvasEl = cell.querySelector('canvas');

        if (canvasEl) {
          const parsed = this.formulaParser.parse(val.trim().substring(1));
          const label = cellCoordsToLabel({ row, col });

          if (!parsed.error) {
            vectors[label] = Array.from(parsed.result);
            const imgData = canvasEl.toDataURL().split('base64,')[1];
            img.file(`${label}.png`, imgData, {base64: true});
          }
        }
      }
    });

    const baseName = `spacesheet_${this.state.currentModel.toLowerCase()}_${formatDate(new Date())}`;
    zip.file(`${baseName}_vectors.json`, JSON.stringify(vectors));
    zip.generateAsync({type: 'blob'})
       .then(content => {
          saveAs(content, `${baseName}.zip`);
      	});
  };

  setSpreadsheetCellFromDataPicker(dataKey) {
    const selection = this.hotInstance.getSelected();
    const cellData = `=DATAPICKER('${dataKey}')`;
    const prevData = this.hotInstance.getDataAtCell(selection[0], selection[1]);
    if (prevData !== cellData) {
      this.hotInstance.setDataAtCell(selection[0], selection[1], cellData);
      this.setInputBarValue(cellData);
    }
  };

  setInputBarValue(value) {
    this.setState({ inputBarValue: value });
  };

  getCellFromDataPicker(dataKey) {
    if (Array.isArray(dataKey)) {
      dataKey = dataKey[0];
    }
    dataKey = dataKey.trim().replace(/["']/gi, "");
    const firstHyphen = dataKey.indexOf('-');
    const dataPickerKey = dataKey.substring(0, firstHyphen);
    const cellKey = dataKey.substring(firstHyphen + 1, dataKey.length);
    const cell = this.state.dataPickerGrids[dataPickerKey].dataPicker.cells[cellKey];
    return cell.vector;
  };

  render() {
    const docHeight = document.body.offsetHeight;
    const navHeight = 50;
    const appHeight = docHeight - navHeight;
    const spreadsheetWidth = document.body.offsetWidth - appHeight;
    const fontDrawerHeight = 250;
    return (
      <div className="application-container">
        <canvas className='memory-canvas' ref="memoryCanvas"/>
        <div className="component-container">
          <DataPickers
            width={ appHeight || this.state.dataPickerGrids.grid.columns * this.state.model.outputWidth }
            height={ appHeight || this.state.dataPickerGrids.grid.rows * this.state.model.outputHeight }
            model={ this.state.model }
            dataPickerGrids={this.state.dataPickerGrids}
            onCellClick={ this.setSpreadsheetCellFromDataPicker }
            ref='dataPickers'
          />
          <div className="right-container">
            <Spreadsheet
              width={ spreadsheetWidth }
              height={ this.state.currentModel === 'FONTS' ? appHeight-fontDrawerHeight : appHeight }
              getCellFromDataPicker={ this.getCellFromDataPicker }
              ref='spreadsheet'
              model={ this.state.model }
              setTableRef={ ref => {
                this.hotInstance = ref.hotInstance;
                window.hotInstance = this.hotInstance;
              }}
              setFormulaParserRef={ parser => {
                this.formulaParser = parser;
              }}
              inputBarValue={this.state.inputBarValue}
              setInputBarValue={this.setInputBarValue}
              afterRender={ forced => {
                if (!forced) { return };
                if (!this.refs.fontDrawer || !this.refs.fontDrawer.updateFontSamples || !this.hotInstance) { return; }
                this.refs.fontDrawer.updateFontSamples();
                const editor = this.hotInstance.getActiveEditor();
                if (editor) {
                  editor.clearHighlightedReferences();
                  editor.highlightReferences(this.hotInstance);
                }
              }}
              currentModel={this.state.currentModel}
            />
            {
              this.state.currentModel === 'FONTS' && this.state.model &&
              <FontDrawer
                hotInstance={this.hotInstance}
                formulaParser={this.formulaParser}
                model={this.state.model}
                ref='fontDrawer'
              />
            }
          </div>
        </div>
        <BottomNav
          activeLink={this.state.currentModel}
          links={[
            {label: 'Faces', id: 'FACES', href: 'http://bryanlohjy.gitlab.io/spacesheet/faces.html'},
            {label: 'Fonts', id: 'FONTS', href: 'http://bryanlohjy.gitlab.io/spacesheet/index.html'},
            {label: 'WORD2VEC', id: 'WORD2VEC', href: 'http://bryanlohjy.gitlab.io/spacesheet/word2vec.html'},
            {label: 'MNIST', id: 'MNIST', href: 'http://bryanlohjy.gitlab.io/spacesheet/mnist.html'},
            {label: 'Colours', id: 'COLOURS', href: 'http://bryanlohjy.gitlab.io/spacesheet/colours.html'},
          ]}
          debugMode={this.state.debugMode}
          saveVectors={this.saveVectors}
        />
      </div>
    );
  }
}

class BottomNav extends React.Component {
  render() {
    return (
      <nav ref="bottomNav" className="bottom-nav">
        <div>
          <div className="logo">
            <img
              src='./dist/assets/logo.png'
              alt="SpaceSheet Logo"
            />
          </div>
          {
            this.props.links.map(link => {
              const isCurrent = this.props.activeLink === link.id;
              return (
                <a
                  key={link.id}
                  className={isCurrent ? 'active' : ''}
                  href={link.href}
                >{link.label}</a>
              )
            })
          }
        </div>
        <div>
        {
          this.props.debugMode &&
          <a onClick={this.props.saveVectors}>Save vectors</a>
        }
          <a href="http://vusd.github.io/spacesheet" target="_blank">Info</a>
        </div>
      </nav>
    );
  }
}

BottomNav.propTypes = {
  activeLink: PropTypes.string.isRequired,
  links: PropTypes.array.isRequired,
  debugMode: PropTypes.bool.isRequired,
  saveVectors: PropTypes.func
};
