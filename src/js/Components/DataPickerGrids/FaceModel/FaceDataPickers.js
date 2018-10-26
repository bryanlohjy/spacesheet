import V from './faces_variety.json';
import FEM from './faces_fem.json';
import MAS from './faces_fem.json';
import NOVEL from './faces_fem.json';

module.exports = {
  V: {
    label: 'Variety',
    data: V,
  },
  FEM: {
    label: 'Fem',
    data: FEM,
  },
  MAS: {
    label: 'Mas',
    data: MAS,
  },
  NOVEL: {
    label: 'Novel',
    data: MAS,
  },
};
