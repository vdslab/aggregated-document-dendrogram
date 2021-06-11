import React from "react";
import { render } from "react-dom";
import { Link, Router, Route, Switch } from "react-router-dom";
import { createBrowserHistory } from "history";

import RootPage from "./pages/root";
import DocumentSimilarityCopy from "./pages/document-similarity-copy";

const history = createBrowserHistory();

const App = () => {
  return (
    <Router history={history}>
      <div className="columns">
        <div className="column is=3">
          <aside className="menu">
            <p className="menu-label">Contents</p>
            <ul className="menu-list">
              <li>
                <Link to="/document-similarity-copy">test</Link>
              </li>
            </ul>
          </aside>
        </div>
        <div className="column is-8">
          <Switch>
            <Route path="/" component={RootPage} exact />
            <Route
              path="/document-similarity-copy"
              component={DocumentSimilarityCopy}
            />
          </Switch>
        </div>
      </div>
    </Router>
  );
};

render(<App />, document.querySelector("#content"));
