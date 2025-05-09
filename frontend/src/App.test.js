import { render, screen } from '@testing-library/react';
import App from './App';
import { diag } from '@opentelemetry/api';

test('renders learn react link', () => {
  diag.info('Rendering App component');
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  diag.info('Checking if the link element is in the document', { linkElement });
  expect(linkElement).toBeInTheDocument();
});
