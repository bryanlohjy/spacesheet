import React from 'react';
import PropTypes from 'prop-types';

export default class ClassCompositionBar extends React.Component {
  get compositionSum() {
    return this.props.selectedClasses.reduce((total, _class) => {
      return total+_class.amount;
    }, 0);
  }

  render() {
    return (
      <div className="composition-bar">
      {
        this.props.selectedClasses.map((_class, i) => {
          const { id, name, amount } = _class;
          let percentage = amount/this.compositionSum;
          percentage *= 100;

          const numClassColors = 7;
          const colorIndex = i%7;
          return (
            <span
              className={`composition-span class-color-${colorIndex}`}
              title={`${percentage.toFixed(2)}% ${name}`}
              key={id}
              style={{
                width: `${percentage}%`
              }}
            />
          )
        })
      }
      </div>
    );
  }
}
// {/* <p>Composition</p>
//   <ul>
//   {
//   this.props.selectedClasses.map((_class, i) => {
//   const { id, name, amount } = _class;
//   let percentage = amount/this.compositionSum;
//   percentage *= 100;
//   return (
//   <li key={id}>
//   <span>{percentage.toFixed(1)}%</span><span>{name}</span>
// </li>
// )
// })
// }
// </ul> */}

ClassCompositionBar.propTypes = {
  selectedClasses: PropTypes.array
};
