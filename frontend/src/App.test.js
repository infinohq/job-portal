import { render, screen } from '@testing-library/react';
import { trace, metrics } from '@opentelemetry/api';
import App from './App';

const tracer = trace.getTracer('default');
const meter = metrics.getMeter('default');

const appRenderCounter = meter.createCounter('app_render_count', {
  description: 'Counts the number of times the App component is rendered'
});

const linkElementFoundCounter = meter.createCounter('link_element_found_count', {
  description: 'Counts the number of times the "learn react" link element is found'
});

const linkElementInDocumentCounter = meter.createCounter('link_element_in_document_count', {
  description: 'Counts the number of times the "learn react" link element is confirmed to be in the document'
});

test('renders learn react link', () => {
  const span = tracer.startSpan('test renders learn react link');
  try {
    render(<App />);
    span.addEvent('App rendered');
    appRenderCounter.add(1);
    
    const linkElement = screen.getByText(/learn react/i);
    span.addEvent('linkElement found', { innerText: linkElement.innerText });
    linkElementFoundCounter.add(1);
    
    expect(linkElement).toBeInTheDocument();
    span.addEvent('linkElement is in the document');
    linkElementInDocumentCounter.add(1);
  } catch (error) {
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
});
