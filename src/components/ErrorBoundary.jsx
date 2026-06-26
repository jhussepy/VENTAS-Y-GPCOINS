import { Component } from 'react';

// Red de seguridad: si algún componente lanza un error, mostramos una
// pantalla amable en vez de dejar la app en blanco.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Log en consola para depuración; los datos del usuario siguen a salvo en la nube
    console.error('Error capturado por ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-dvh flex items-center justify-center bg-bg-base p-6">
          <div className="card p-8 max-w-md text-center space-y-4">
            <h1 className="text-xl font-semibold text-fg">Algo salió mal</h1>
            <p className="text-sm text-fg-muted">
              Se produjo un error al mostrar esta pantalla. Tus datos están guardados en la nube
              y no se han perdido. Prueba a recargar la página.
            </p>
            <pre className="text-[11px] text-fg-muted bg-bg-surface2 rounded-lg p-3 overflow-auto max-h-32 text-left">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button className="btn-primary w-full justify-center" onClick={() => window.location.reload()}>
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
