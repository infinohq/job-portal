import { render, screen } from '@testing-library/react';
import { trace } from '@opentelemetry/api';
import App from './App';

const tracer = trace.getTracer('default');

test('renders learn react link', () => {
  const span = tracer.startSpan('test renders learn react link');
  try {
    render(<App />);
    span.addEvent('App rendered');
    
    const linkElement = screen.getByText(/learn react/i);
    span.addEvent('linkElement found', { innerText: linkElement.innerText });
    
    expect(linkElement).toBeInTheDocument();
    span.addEvent('linkElement is in the document');
  } catch (error) {
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
});