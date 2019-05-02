import React from 'react';
import ReactDOM from 'react-dom';

const title = 'My Minimal React Webpack Babel Setup';
import Mention from './mention';

ReactDOM.render(
  <Mention />,
  document.getElementById('app')
);

module.hot.accept();
