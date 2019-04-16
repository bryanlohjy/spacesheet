import React from 'react';
import PropTypes from 'prop-types';

export default class ClassCompositionList extends React.Component {
  get compositionSum() {
    return this.props.selectedClasses.reduce((total, _class) => {
      return total+_class.amount;
    }, 0);
  }

  render() {
    return (
      <div className="composition-section">
        <p>Composition</p>
        <ul>
        {
          this.props.selectedClasses.map((_class, i) => {
            const { id, name, amount } = _class;
            let percentage = amount/this.compositionSum;
            percentage *= 100;
            return (
              <li key={id}>
                <span>{percentage.toFixed(1)}%</span><span>{name}</span>
              </li>
            )
          })
        }
        </ul>
      </div>
    );
  }
}

ClassCompositionList.propTypes = {
  selectedClasses: PropTypes.array
};
