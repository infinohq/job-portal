import { render, screen } from '@testing-library/react';
import { trace } from '@opentelemetry/api';
import App from './App';

const tracer = trace.getTracer('default');

test('renders learn react link', () => {
  tracer.startActiveSpan('test span', span => {
    render(<App />);
    const linkElement = screen.getByText(/learn react/i);
    console.log('Link element found:', linkElement);
    expect(linkElement).toBeInTheDocument();
    span.end();
  });
});
