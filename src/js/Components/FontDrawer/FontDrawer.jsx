import React from 'react';
import PropTypes from 'prop-types';
import { isFormula, cellLabelToCoords, cellCoordsToLabel, cellLabelIsWithinSpreadsheet } from '../Spreadsheet/CellHelpers.js';
import { charToDecodeIndex } from './FontDrawerHelpers.js';
import { arraysAreSimilar } from '../../lib/helpers.js';
import { CELL_REFERENCE } from '../../lib/Regex.js';
import { SortableContainer, SortableElement, SortableHandle, arrayMove } from 'react-sortable-hoc';
import uuidv4 from 'uuid/v4';

export default class FontDrawer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sampleText: 'handgloves',
      items: [
        { locked: false, cell: 'C2', vector: [], id: uuidv4() },
        { locked: false, cell: '', vector: [], id: uuidv4() },
        { locked: false, cell: '', vector: [], id: uuidv4() },
      ],
    };
    this.updateFontSamples = this.updateFontSamples.bind(this);
    this.onSortEnd = this.onSortEnd.bind(this);
    this.setItemProperty = this.setItemProperty.bind(this);
    this.setSampleFontFromSelection = this.setSampleFontFromSelection.bind(this);
    this.clearSampleFont = this.clearSampleFont.bind(this);
  };
  componentDidMount() {
    this.updateFontSamples();
    this.props.hotInstance.render();
  };
  updateFontSamples() {
    if (!this.props.hotInstance || !this.props.formulaParser) { return; }
    let items = JSON.parse(JSON.stringify(this.state.items));
    items.map(item => {
      if (item.cell && new RegExp(CELL_REFERENCE).test(item.cell)) {
        const { row, col } = cellLabelToCoords(item.cell);
        const cellData = this.props.hotInstance.getDataAtCell(row, col);
        if (!item.locked) {
          if (cellData && isFormula(cellData)) {
            const result = this.props.formulaParser.parse(cellData.replace('=', '')).result;
            if (result && result.length === 40 && !(btoa(result) === btoa(item.vector))) {
              item.vector = result;
            }
          } else if (!cellData) {
            item.vector = [];
          }
        }
      }
      return item;
    });
    this.setState({ items: items });
  };
  onSortEnd({oldIndex, newIndex}) {
    let items = JSON.parse(JSON.stringify(this.state.items));
    const sortedItems = arrayMove(items, oldIndex, newIndex);
    this.setState({ items: sortedItems });
  };
  setItemProperty(itemIndex, changes) {
    let items = JSON.parse(JSON.stringify(this.state.items));
    const _item = items[itemIndex];
    const changeKeys = Object.keys(changes);
    for (let changeIndex = 0; changeIndex < changeKeys.length; changeIndex++) {
      const changeKey = changeKeys[changeIndex];
      _item[changeKey] = changes[changeKey];
    }
    items[itemIndex] = _item;
    this.setState({ items: items }, () => {
      if (changeKeys.indexOf('cell') > -1) {
        this.updateFontSamples();
      }
    });
  };
  setSampleFontFromSelection(itemIndex) {
    if (!this.props.hotInstance || !this.props.formulaParser) { return; }
    const selection = this.props.hotInstance.getSelected();
    const row = selection[0];
    const col = selection[1];
    this.setItemProperty(itemIndex, { cell: cellCoordsToLabel({row: row, col: col}), locked: false });
  };
  clearSampleFont(itemIndex) {
    if (!this.props.hotInstance || !this.props.formulaParser) { return; }
    this.setItemProperty(itemIndex, { cell: '', vector: [], locked: false });
  };
  render() {
    return (
      <div
        className="font-drawer"
      >
        <input
          className="sample-font-input"
          type="text"
          value={this.state.sampleText}
          onKeyDown={e => {
            const acceptedMeta = [8, 46, 32, 37, 38, 39, 40].indexOf(e.keyCode) > -1;
            const acceptedKeys = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            if (acceptedKeys.indexOf(e.key) < 0 && !acceptedMeta) {
              e.preventDefault();
            }
          }}
          onChange={e => {
            this.setState({
              sampleText: e.target.value,
            });
          }}
          tabIndex="-1"
          autoComplete={false}
          spellCheck={false}
        />
        <FontSampleList
          items={this.state.items}
          sampleText={this.state.sampleText}
          setItemProperty={this.setItemProperty}
          setSampleFontFromSelection={this.setSampleFontFromSelection}
          clearSampleFont={this.clearSampleFont}


          hotInstance={this.props.hotInstance}
          drawFn={this.props.model.drawFn}
          decodeFn={this.props.model.decodeFn}
          outputWidth={ this.props.model.outputWidth }
          outputHeight={ this.props.model.outputHeight }

          onSortEnd={this.onSortEnd}
          lockAxis="y"

          useDragHandle={true}
        />
      </div>
    );
  };
}
FontDrawer.propTypes = {
  hotInstance: PropTypes.object,
  formulaParser: PropTypes.object,
  model: PropTypes.object.isRequired
};


const SortableFontSample = SortableElement(props => {
  return (<FontSample {...props}/>);
});
const FontSampleList = SortableContainer(props => {
  const items = props.items;
  return (
    <div className="font-samples">
      {items.map((item, index) => (
        <SortableFontSample
          key={`item-${item.id}`}
          index={index}

          itemIndex={index}

          setItemProperty={props.setItemProperty}

          cell={item.cell}
          locked={item.locked}
          vector={item.vector}

          sampleText={props.sampleText}

          hotInstance={props.hotInstance}
          drawFn={props.drawFn}
          decodeFn={props.decodeFn}
          outputWidth={props.outputWidth}
          outputHeight={props.outputHeight}
          setSampleFontFromSelection={props.setSampleFontFromSelection}
          clearSampleFont={props.clearSampleFont}
        />
      ))}
    </div>
  );
});

const DragHandle = SortableHandle(() => <span className="sort-handle">:</span>); // This can be any component you want
class FontSample extends React.Component {
  constructor(props) {
    super(props);
    this.ctx;
    this.updateCanvas = this.updateCanvas.bind(this);
    this.toggleLocked = this.toggleLocked.bind(this);
  };
  componentDidMount() {
    const parentEl = this.refs.container;
    const controls = this.refs.controls;

    this.refs.canvasEl.width = parentEl.clientWidth - controls.clientWidth;
    this.decodedImages = {};
    this.ctx = this.refs.canvasEl.getContext('2d');
    this.updateCanvas();
  };
  componentWillReceiveProps(newProps) {
    if (!arraysAreSimilar(newProps.vector || [], this.props.vector) || newProps.sampleText !== this.props.sampleText) {
      this.decodedImages = {};
      setTimeout(this.updateCanvas, 0);
    }
  };
  updateCanvas() {
    const canvas = this.ctx.canvas;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    const vec = this.props.vector;
    if (vec.length <= 0) { return; }

    const sampleString = this.props.sampleText;
    const scaleFactor = 0.6;
    if (sampleString && sampleString.length > 0) {
      const charsToDraw = sampleString.split('');
      for (let charIndex = 0; charIndex < charsToDraw.length; charIndex++) {
        const char = sampleString[charIndex];
        const decodeIndex = charToDecodeIndex(char);
        if (decodeIndex > -1) {
          this.ctx.save();
          this.ctx.scale(scaleFactor, scaleFactor);
          let image;
          if (this.decodedImages[decodeIndex]) { // decode only if it hasn't before
            image = this.decodedImages[decodeIndex];
          } else {
            image = this.props.decodeFn(Object.values(vec), decodeIndex);
            this.decodedImages[decodeIndex] = image;
          }
          this.ctx.translate(this.props.outputWidth * charIndex + this.props.outputWidth /2 , (canvas.height/scaleFactor - this.props.outputHeight)/2);
          this.props.drawFn(this.ctx, image);
          this.ctx.restore();
        }
      }
    }
  };
  toggleLocked() {
    this.props.setItemProperty(this.props.itemIndex, { locked: !this.props.locked });
  };
  render() {
    const validCell = this.props.cell && new RegExp(CELL_REFERENCE).test(this.props.cell);
    const withinRange = validCell ? cellLabelIsWithinSpreadsheet(this.props.hotInstance, this.props.cell) : false;
    const validClass = validCell && withinRange ? 'valid' : 'invalid';
    const lockedClass = this.props.locked ? 'locked' : '';
    const inputClasses = `${this.props.cell && !this.props.locked ? validClass : ''} ${lockedClass}`;
    return (
      <div className="font-sample" ref="container">
        <div className="font-sample-controls" ref="controls">
          <DragHandle/>
          <div className="font-sample-panel">
            { this.props.cell ?
                this.props.locked ? (
                  <div className="font-sample-options" onClick={this.toggleLocked}>
                    <img src='./dist/assets/sharp-lock-24px.svg'/>
                    <span>LOCK</span>
                  </div>
                ): (
                  <div className="font-sample-options" onClick={this.toggleLocked}>
                    <img src='./dist/assets/sharp-lock_open-24px.svg'/>
                    <span>WATCH</span>
                  </div>
                )
              : ""
            }
            <div className="font-sample-reference">
              <div className={`cell-reference ${inputClasses} ${this.props.locked && 'disabled'}`}>
                {this.props.cell}
              </div>
              {/* <input
                type="text"
                value={this.props.cell}
                onKeyDown={ e => {
                  // let acceptedKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                  // acceptedKeys = acceptedKeys.split('').concat(['BACKSPACE']);
                  // if (acceptedKeys.indexOf(e.key.toUpperCase()) < 0) {
                  //   e.preventDefault();
                  //   return;
                  // };
                }}
                onChange={ e => {
                  this.props.setItemProperty(this.props.itemIndex, { cell: e.target.value });
                }}
                className={`cell-reference ${inputClasses}`}
                disabled={this.props.locked}
              /> */}
              { !this.props.cell ? (
                  <button onClick={ e => {
                    this.props.setSampleFontFromSelection(this.props.itemIndex);
                  }}>+</button>
                ) : (
                  <button onClick={ e => {
                    this.props.clearSampleFont(this.props.itemIndex);
                  }}>x</button>)
              }
            </div>
          </div>
        </div>
        <canvas
          ref="canvasEl"
          className="font-sample-canvas"
          height={80}
        />
      </div>
    );
  };
}
FontSample.propTypes = {
  cell: PropTypes.string,
  mode: PropTypes.string,
  vector: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object,
  ]),
  sampleText: PropTypes.string,
  itemIndex: PropTypes.number,
  setItemProperty: PropTypes.func,
  drawFn: PropTypes.func,
  decodeFn: PropTypes.func,
  outputWidth: PropTypes.number,
  outputHeight: PropTypes.number,
  setSampleFontFromSelection: PropTypes.func,
  clearSampleFont: PropTypes.func,
  hotInstance: PropTypes.object,
};
