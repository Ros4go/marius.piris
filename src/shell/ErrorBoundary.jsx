import { Component } from 'react'
import { navigate } from '../core/router.js'

// Filet de sécurité autour d'un module : si son rendu (ou son chargement) échoue,
// on affiche un message au lieu de démonter tout le site (écran blanc).
// À placer avec une `key` qui change avec la page, pour repartir de zéro
// quand on navigue ailleurs.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Erreur dans un module :', error, info && info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div>
        <h1 className="module-head">Oups</h1>
        <p className="prose-read mb-6">
          Cette page n'a pas pu s'afficher. Le site vient peut-être d'être mis à jour : recharger la page règle
          généralement le problème.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="btn" onClick={() => window.location.reload()}>
            <span>Recharger</span>
          </button>
          <button className="btn ghost" onClick={() => navigate('/')}>
            <span>◄ Retour au menu</span>
          </button>
        </div>
      </div>
    )
  }
}
