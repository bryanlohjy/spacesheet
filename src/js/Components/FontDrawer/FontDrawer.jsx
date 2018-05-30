import React from 'react';
import PropTypes from 'prop-types';
import { isFormula } from '../Spreadsheet/CellHelpers.js';
import { charToDecodeIndex } from './FontDrawerHelpers.js';
import { arraysAreSimilar } from '../../lib/helpers.js';
import { SortableContainer, SortableElement, SortableHandle, arrayMove } from 'react-sortable-hoc';

export default class FontDrawer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sampleText: 'handgloves',
      items: [
        { mode: 'WATCHING', cell: 'A1', vector: [], },
        { mode: 'LOCKED', cell: '', vector: [], },
        { mode: 'WATCHING', cell: 'B3', vector: [], },
        { mode: 'WATCHING', cell: 'A1', vector: [], },
        { mode: 'LOCKED', cell: '', vector: [], },
        { mode: 'WATCHING', cell: 'B3', vector: [], },
      ],
    };
    this.onSortEnd = this.onSortEnd.bind(this);
    this.setItemProperty = this.setItemProperty.bind(this);
  };
  onSortEnd({oldIndex, newIndex}) {
    this.setState({
      items: arrayMove(this.state.items, oldIndex, newIndex),
    });
  };
  setItemProperty(itemIndex, changes) {
    const _item = this.state.items[itemIndex];
    const changeKeys = Object.keys(changes);
    for (let changeIndex = 0; changeIndex < changeKeys.length; changeIndex++) {
      const changeKey = changeKeys[changeIndex];
      _item[changeKey] = changes[changeKey];
    }

    let items = this.state.items;
    items[itemIndex] = _item;

    this.setState({
      items: items,
    });
  };
  render() {
    return (
      <div
        className="font-drawer"
        style={{height: this.props.height}}
      >
        <input
          className="sample-font-input"
          type="text"
          value={this.state.sampleText}
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
          //
          // hotInstance={this.props.hotInstance}
          // formulaParser={this.props.formulaParser}
          // drawFn={this.props.drawFn}
          // decodeFn={this.props.decodeFn}
          // outputWidth={ this.props.outputWidth }
          // outputHeight={ this.props.outputHeight }
          //
          onSortEnd={this.onSortEnd}
          lockAxis="y"
          // transitionDuration={50}
          useDragHandle={true}
        />
      </div>
    );
  };
}
FontDrawer.propTypes = {
  height: PropTypes.number,
  hotInstance: PropTypes.object,
  formulaParser: PropTypes.object,
  drawFn: PropTypes.func,
  decodeFn: PropTypes.func,
  outputWidth: PropTypes.number,
  outputHeight: PropTypes.number,
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
          key={`item-${index}`}
          index={index}

          itemIndex={index}

          setItemProperty={props.setItemProperty}

          cell={item.cell}
          mode={item.mode}
          vector={item.vector}

          sampleText={props.sampleText}


          // hotInstance={props.hotInstance}
          // formulaParser={props.formulaParser}
          // drawFn={props.drawFn}
          // decodeFn={props.decodeFn}
          // outputWidth={ props.outputWidth }
          // outputHeight={ props.outputHeight }
          // item={item}
        />
      ))}
    </div>
  );
});

// FontSampleList.propTypes = {
//   items: array,
//   sampleText: string,
//    setItemProperty
// };

// onMouseDown={ () => {
//   this.props.setItemProperty(this.props.itemIndex, { cell: Math.random().toString() });
// }}
// >
const DragHandle = SortableHandle(() => <span className="sort-handle">::</span>); // This can be any component you want
class FontSample extends React.Component {
  constructor(props) {
    super(props);
    this.ctx;
    this.updateCanvas = this.updateCanvas.bind(this);
  };
  componentDidMount() {
    // console.log(this.refs.controls.clientHeight, this.refs.controls.clientWidth)
    const parentEl = this.refs.container;
    const controls = this.refs.controls;
    //
    this.refs.canvasEl.width = parentEl.clientWidth - controls.clientWidth;
    // console.log(this.refs.canvasEl.width)
    // this.refs.canvasEl.height = controls.clientHeight;

    this.ctx = this.refs.canvasEl.getContext('2d');
    this.updateCanvas();
  };
  componentWillReceiveProps(props) {
    // console.log(props);
    // console.log('updateCanvas')
  };
  updateCanvas() {
    const el = this.ctx.canvas;
    this.ctx.fillStyle = 'teal';
    this.ctx.rect(0, 0, 20 || el.width, 20 || el.height);
    this.ctx.fill();
  };
  render() {
    return (
      <div className="font-sample" ref="container">
        <div className="font-sample-controls" ref="controls">
          <DragHandle/>
          <div className="font-sample-panel">
            { this.props.cell ?
              <input type="text" value={this.props.cell}/> :
              <button>+</button>
            }
            <span>{this.props.mode.charAt(0)}</span>
          </div>
        </div>
        <canvas
          ref="canvasEl"
          className="font-sample-canvas"
          // width={100} //
          height={100} //
        />
      </div>
    );
  };
}
FontSample.propTypes = {
  cell: PropTypes.string,
  mode: PropTypes.string,
  vector: PropTypes.array,
  sampleText: PropTypes.string,
  itemIndex: PropTypes.number,
  setItemProperty: PropTypes.func,
  // hotInstance: PropTypes.object,
  // formulaParser: PropTypes.object,
  // drawFn: PropTypes.func,
  // decodeFn: PropTypes.func,
  // outputWidth: PropTypes.number,
  // outputHeight: PropTypes.number,
};


//
//
// class FontSample extends React.Component {
//   constructor(props) {
//     super(props);
//     this.ctx;
//     this.updateCanvas = this.updateCanvas.bind(this);
//     this.storeSelectedFont = this.storeSelectedFont.bind(this);
//     this.state = { vector: [] };
//
//     this.decodedImages = {};
//   };
//   componentDidMount() {
//     const parentEl = this.refs.canvasEl.parentNode;
//     const controls = this.refs.canvasEl.previousSibling;
//
//     this.refs.canvasEl.width = parentEl.clientWidth - controls.clientWidth;
//     this.refs.canvasEl.height = controls.clientHeight;
//
//     this.ctx = this.refs.canvasEl.getContext('2d');
//     this.updateCanvas();
//   };
//   componentWillReceiveProps(newProps) {
//     if (newProps.inputValue !== this.props.inputValue) {
//       setTimeout(() => {
//         this.updateCanvas();
//       }, 0);
//     }
//   };
//   storeSelectedFont(e) {
//     if (!this.props.hotInstance || !this.props.formulaParser) { return; }
//     const selection = this.props.hotInstance.getSelected();
//     const selectedVal = this.props.hotInstance.getDataAtCell(selection[0], selection[1]);
//
//     if (!selectedVal || !selectedVal.trim() || !isFormula(selectedVal)) { return; }
//     const result = this.props.formulaParser.parse(selectedVal.replace('=', '')).result;
//     if (result && result.length === 40) {
//       if (!arraysAreSimilar(result, this.state.vector)) {
//         this.setState({ vector: result }, () => {
//           this.updateCanvas();
//         });
//         console.log('set')
//         this.decodedImages = {};
//       }
//     }
//   };
//   updateCanvas() {
//     const vec = this.state.vector;
//     if (vec.length <= 0) { return; }
//
//     const canvas = this.ctx.canvas;
//     this.ctx.clearRect(0, 0, canvas.width, canvas.height);
//     const sampleString = this.props.inputValue;
//
//     if (sampleString && sampleString.length > 0) {
//       const charsToDraw = sampleString.split('');
//       for (let charIndex = 0; charIndex < charsToDraw.length; charIndex++) {
//         const char = sampleString[charIndex];
//         const decodeIndex = charToDecodeIndex(char);
//         if (decodeIndex > -1) {
//           this.ctx.save();
//           this.ctx.scale(0.5, 0.5);
//           let image;
//           if (this.decodedImages[decodeIndex]) { // decode only if it hasn't before
//             image = this.decodedImages[decodeIndex];
//           } else {
//             image = this.props.decodeFn(vec, decodeIndex);
//             this.decodedImages[decodeIndex] = image;
//           }
//           this.ctx.translate(this.props.outputWidth * charIndex, 0);
//           this.props.drawFn(this.ctx, image);
//           this.ctx.restore();
//         }
//       }
//     }
//   };
//   render() {
//     return (
//       <div className="font-sample">
//         <div className="font-sample-controls">
//           <button
//             onClick={ this.storeSelectedFont }
//           >
//             store
//           </button>
//         </div>
//         <canvas
//           ref="canvasEl"
//           className="font-sample-canvas"
//         />
//       </div>
//     );
//   };
// };
// FontSample.propTypes = {
//   inputValue: PropTypes.string,
//   hotInstance: PropTypes.object,
//   formulaParser: PropTypes.object,
//   drawFn: PropTypes.func,
//   decodeFn: PropTypes.func,
//   outputWidth: PropTypes.number,
//   outputHeight: PropTypes.number,
// };
