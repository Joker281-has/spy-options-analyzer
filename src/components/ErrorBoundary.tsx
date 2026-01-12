import React from 'react'

export default class ErrorBoundary extends React.Component<any, { hasError: boolean }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary caught', error, info)
  }
  render() {
    if (this.state.hasError) return <div className="state error">Something went wrong rendering the UI.</div>
    return this.props.children
  }
}
