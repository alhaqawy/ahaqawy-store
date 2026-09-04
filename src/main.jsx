import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          direction: "ltr",
          padding: "20px",
          background: "#fff",
          color: "#b00020",
          fontFamily: "monospace",
          whiteSpace: "pre-wrap"
        }}>
          <h2>React Runtime Error</h2>
          {this.state.error?.stack || this.state.error?.message}
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
