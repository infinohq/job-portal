import { render, screen } from '@testing-library/react';
import App from './App';
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('default');

test('renders learn react link', () => {
  const span = tracer.startSpan('render App component');
  render(<App />);
  span.addEvent('App component rendered');
  
  const linkElement = screen.getByText(/learn react/i);
  span.addEvent('Queried for learn react link', { linkElement: !!linkElement });
  
  expect(linkElement).toBeInTheDocument();
  span.addEvent('Assertion passed: learn react link is in the document');
  
  span.end();
});