import React from 'react';
import PropTypes from 'prop-types';

import ModelLoader from '../lib/ModelLoader.js';
// import ModelToLoad from '../Models/MNISTModel.js';
// import ModelToLoad from '../Models/FontModel.js';
// import ModelToLoad from '../Models/Colours.js';
import ModelToLoad from '../Models/Word2Vec.js';
// import ModelToLoad from '../Models/FaceModel.js';

import GenerateDataPicker from '../lib/DataPickerGenerator.js';
// import DataPickerGrids from './DataPickerGrids/FontModel/FontDataPickers.js';

import DataPickers from './DataPicker/DataPickers.jsx';

import Spreadsheet from './Spreadsheet/Spreadsheet.jsx';

export default class Application extends React.Component {
  constructor(props) {
    super(props);

    const debugMode = Boolean(window.location.hash && window.location.hash.toLowerCase() === '#debug');

    this.state = {
      model: null,
      currentModel: 'COLOURS', // FACES, FONTS, MNIST, COLOURS
      inputBarValue: "",
      dataPickerGrids: null,
      debugMode
    };

    this.onHashChange = this.onHashChange.bind(this);

    this.setSpreadsheetCellFromDataPicker = this.setSpreadsheetCellFromDataPicker.bind(this);
    this.getCellFromDataPicker = this.getCellFromDataPicker.bind(this);
    this.setInputBarValue = this.setInputBarValue.bind(this);
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
              height={ appHeight }
              getCellFromDataPicker={ this.getCellFromDataPicker }
              ref='spreadsheet'
              model={ this.state.model }
              setTableRef={ ref => {
                this.hotInstance = ref.hotInstance;
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
          </div>
        </div>
        <BottomNav
          activeLink={this.state.currentModel}
          links={[
            {label: 'Faces', id: 'FACES', href: 'http://bryanlohjy.gitlab.io/spacesheet/faces.html'},
            {label: 'Fonts', id: 'FONTS', href: 'http://bryanlohjy.gitlab.io/spacesheet/index.html'},
            {label: 'MNIST', id: 'MNIST', href: 'http://bryanlohjy.gitlab.io/spacesheet/mnist.html'},
            {label: 'Colours', id: 'COLOURS', href: 'http://bryanlohjy.gitlab.io/spacesheet/colours.html'},
          ]}
          debugMode={this.state.debugMode}
          saveVectors={e => {
            console.log(e)
          }}
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
                  target='_blank'
                >{link.label}</a>
              )
            })
          }
        </div>
        <div>
          {
            this.props.debugMode && <a onClick={this.props.saveVectors}>Save vectors</a>
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
