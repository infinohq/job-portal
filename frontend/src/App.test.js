import { render, screen } from '@testing-library/react';
import { trace } from '@opentelemetry/api'; // Import OpenTelemetry trace
import App from './App';

test('renders learn react link', () => {
  const tracer = trace.getTracer('default'); // Get a tracer
  tracer.startActiveSpan('renderApp', span => {
    render(<App />);
    span.addEvent('App component rendered'); // Log event after rendering

    const linkElement = screen.getByText(/learn react/i);
    span.addEvent('Link element retrieved', { elementText: linkElement.textContent }); // Log event with link element text

    expect(linkElement).toBeInTheDocument();
    span.end(); // End the span
  });
});
