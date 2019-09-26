import React from 'react';
import PropTypes from 'prop-types';

import ModelLoader from '../lib/ModelLoader.js';
// import ModelToLoad from '../Models/FaceModel.js';
// import ModelToLoad from '../Models/FontModel.js';
// import ModelToLoad from '../Models/Word2Vec.js';
// import ModelToLoad from '../Models/MNISTModel.js';
// import ModelToLoad from '../Models/Colours.js';
import ModelToLoad from '../Models/BigGAN.js';

// import GenerateDataPicker from '../lib/DataPickerGenerator.js';
// import DataPickerGrids from './DataPickerGrids/FaceModel/FaceDataPickers.js';
// import DataPickerGrids from './DataPickerGrids/FontModel/FontDataPickers.js';
// import DataPickerGrids from './DataPickerGrids/Word2Vec/Word2VecDataPicker.js';
// import DataPickerGrids from './DataPickerGrids/MNISTModel/MNISTDataPicker.js';
// import DataPickerGrids from './DataPickerGrids/ColorModel/ColorDataPicker.js';
import DataPickerGrids from './DataPickerGrids/BigGAN/BigGANDataPickers.js';
import DataPickers from './DataPicker/DataPickers.jsx';
// import FontDrawer from './FontDrawer/FontDrawer.jsx';

import Spreadsheet from './Spreadsheet/Spreadsheet.jsx';
import Modal from './Modal/Modal.jsx';

import browser from 'browser-detect';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { matrixForEach, cellCoordsToLabel } from './Spreadsheet/CellHelpers.js';
import { formatDate } from '../lib/helpers.js';

console.log(DataPickerGrids)

export default class Application extends React.Component {
  constructor(props) {
    super(props);

    const debugMode = Boolean(window.location.hash && window.location.hash.toLowerCase() === '#debug');

    const sess = browser();
    const isMobileSection = sess.mobile ? 'MOBILE' : '';

    const sessBrowser = sess.name.toUpperCase();
    const unsupportedBrowsers = ['SAFARI'];
    const isUnsupportedSection = unsupportedBrowsers.indexOf(sessBrowser) > -1 ? 'UNSUPPORTED' : '';

    this.state = {
      model: null,
      currentModel: 'BIGGAN', // FACES, FONTS, WORD2VEC, MNIST, COLOURS, BIGGAN
      inputBarValue: "",
      dataPickerGrids: null,
      debugMode,
      modalSection: isMobileSection || isUnsupportedSection || 'LOADING', // MOBILE, UNSSUPORTED, LOADING, INFO, CREATE_DATAPICKER
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    };

    this.onHashChange = this.onHashChange.bind(this);

    this.setSpreadsheetCellFromDataPicker = this.setSpreadsheetCellFromDataPicker.bind(this);
    this.getCellFromDataPicker = this.getCellFromDataPicker.bind(this);
    this.setInputBarValue = this.setInputBarValue.bind(this);
    this.saveVectors = this.saveVectors.bind(this);
    this.setModalSection = this.setModalSection.bind(this);
    this.onResize = this.onResize.bind(this);
    this.afterResize = this.afterResize.bind(this);

    this.resizeTimer;
  };

  componentDidMount() { // Initialise model + load grid data for DataPicker
    if (this.state.modalSection === 'MOBILE') { return; }

    this.bottomNav = this.refs.bottomNav;
    this.memoryCtx = this.refs.memoryCanvas.getContext('2d'); // used to store and render drawings

    const modelOpts = {
      afterDecode: (el) => {
        this.hotInstance.render();
      }
    };
    const loader = new ModelLoader(this, ModelToLoad, modelOpts);

    loader.load(async res => {
      if (!res.errors) {
        let dataPickerGrids;
        try {
          dataPickerGrids = DataPickerGrids;
        } catch (e) {
          dataPickerGrids = GenerateDataPicker(10, 10, 'DATAPICKER', res.model);
        }

        if (res.model.cacheDatapicker) {
          await res.model.cacheDatapicker(dataPickerGrids);
        }

        this.setState({
          model: res.model,
          dataPickerGrids: dataPickerGrids,
        });

        if (this.state.modalSection === 'LOADING') {
          setTimeout(() => { // prevent flickering modal
            this.setState({
              modalSection: ''
            });
          }, 2500);
        }

      } else {
        console.error(res.errors);
      }
    });

    window.addEventListener('hashchange', this.onHashChange, false);
    window.addEventListener('resize', this.onResize);
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

  setModalSection(modalSection) {
    this.setState({
      modalSection
    });
  }

  onResize(e) {
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(this.afterResize, 300);
  }

  afterResize(e) {
    if (!this.hotInstance) { return; }
    // updates DataPicker
    this.setState({
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    });

    this.hotInstance.render();
  }

  render() {
    const docHeight = document.body.offsetHeight;
    const navHeight = 50;
    const appHeight = docHeight - navHeight;

    return (
      <div className="application-container">
        <Modal
          modalSection={this.state.modalSection}
          setModalSection={this.setModalSection}
          currentModel={this.state.currentModel}
          model={this.state.model}
        />
        <canvas className='memory-canvas' ref="memoryCanvas"/>
        <div className="component-container">
          <div
            className="left-container"
            style={{ maxWidth: appHeight }}
          >
            <DataPickers
              windowWidth={this.state.windowWidth}
              windowHeight={this.state.windowHeight}

              currentModel={this.state.currentModel}
              model={ this.state.model }
              dataPickerGrids={this.state.dataPickerGrids}
              onCellClick={ this.setSpreadsheetCellFromDataPicker }

              setModalSection={this.setModalSection}
              ref='dataPickers'
            />
          </div>
          <div className="right-container" ref="rightContainer">
            <Spreadsheet
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
            {label: 'Faces', id: 'FACES', href: 'http://bryanlohjy.gitlab.io/spacesheet/index.html'},
            {label: 'Fonts', id: 'FONTS', href: 'http://bryanlohjy.gitlab.io/spacesheet/fonts.html'},
            {label: 'WORD2VEC', id: 'WORD2VEC', href: 'http://bryanlohjy.gitlab.io/spacesheet/word2vec.html'},
            {label: 'MNIST', id: 'MNIST', href: 'http://bryanlohjy.gitlab.io/spacesheet/mnist.html'},
            {label: 'Colours', id: 'COLOURS', href: 'http://bryanlohjy.gitlab.io/spacesheet/colours.html'},
            {label: 'BigGAN', id: 'BIGGAN', href: ''}
          ]}
          debugMode={this.state.debugMode}
          saveVectors={this.saveVectors}
          setModalSection={this.setModalSection}
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
            <a href="http://vusd.github.io/spacesheet" target="_blank" className="logo-link">
              <img
                src='./dist/assets/logo.png'
                alt="SpaceSheet Logo"
              />
            </a>
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
          {/* <a href="http://vusd.github.io/spacesheet" target="_blank">Info</a> */}
          <a onClick={e => { this.props.setModalSection('INFO'); }} className="info-button">i</a>
        </div>
      </nav>
    );
  }
}

BottomNav.propTypes = {
  activeLink: PropTypes.string.isRequired,
  links: PropTypes.array.isRequired,
  debugMode: PropTypes.bool.isRequired,
  saveVectors: PropTypes.func,
  setModalSection: PropTypes.func.isRequired
};
