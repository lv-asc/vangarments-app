import React from 'react';
import { render, screen } from '@testing-library/react';
import BetaPioneerBadge from '../BetaPioneerBadge';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('BetaPioneerBadge', () => {
  it('renders without crashing', () => {
    render(<BetaPioneerBadge />);
    expect(screen.getByText('Beta Pioneer')).toBeInTheDocument();
  });

  it('renders with small size', () => {
    render(<BetaPioneerBadge size="small" />);
    expect(screen.getByText('Beta Pioneer')).toBeInTheDocument();
  });

  it('renders without label when showLabel is false', () => {
    render(<BetaPioneerBadge showLabel={false} />);
    expect(screen.queryByText('Beta Pioneer')).not.toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const { container } = render(<BetaPioneerBadge className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders beta symbol', () => {
    render(<BetaPioneerBadge />);
    expect(screen.getByText('β')).toBeInTheDocument();
  });
});