```jsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  console.log('Rendering App component');
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  console.log('Checking if "learn react" link is in the document');
  expect(linkElement).toBeInTheDocument();
});
```