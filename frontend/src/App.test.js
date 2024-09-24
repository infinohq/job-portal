import { render, screen } from '@testing-library/react';
import App from './App';
import { diag } from '@opentelemetry/api';

test('renders learn react link', () => {
  diag.debug('Rendering the App component');
  render(<App />);
  
  diag.debug('Searching for the "learn react" link element');
  const linkElement = screen.getByText(/learn react/i);
  diag.debug('Found link element:', linkElement);
  
  diag.debug('Checking if the link element is in the document');
  expect(linkElement).toBeInTheDocument();
});
