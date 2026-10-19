import React from "react";

interface SynthesisWorkspaceErrorBoundaryProps {
  children: React.ReactNode;
}

interface SynthesisWorkspaceErrorBoundaryState {
  hasError: boolean;
}

export default class SynthesisWorkspaceErrorBoundary extends React.Component<
  SynthesisWorkspaceErrorBoundaryProps,
  SynthesisWorkspaceErrorBoundaryState
> {
  state: SynthesisWorkspaceErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Synthesis workspace crashed", error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-error/20 bg-surface-white p-6 text-center shadow-none">
          <h2 className="text-lg font-semibold text-error">
            Synthesis workspace failed to render
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Refresh the page or return to the project workflow if the problem
            persists.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-error px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-error/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
