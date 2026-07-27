import { Component, type ErrorInfo, type ReactNode } from "react";
import "@/styles/components/ErrorBoundary.css";

interface ErrorBoundaryProps {
  children: ReactNode;
  label?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`ErrorBoundary caught in ${this.props.label ?? "app"}:`, error, info);
  }

  handleReload = () => window.location.reload();

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { label } = this.props;
    return (
      <div className="error-boundary" role="alert">
        <div className="error-boundary-card">
          <img
            className="error-boundary-logo"
            src="/img/logos/logo-full.svg"
            alt="housemaster"
          />
          <h1 className="error-boundary-title">Something came loose</h1>
          <p className="error-boundary-message">
            {label ? `The ${label} hit an unexpected error.` : "The app hit an unexpected error."}{" "}
            Reloading usually sorts it out.
          </p>
          {import.meta.env.DEV && (
            <pre className="error-boundary-detail">{error.message}</pre>
          )}
          <button className="error-boundary-button" onClick={this.handleReload}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
