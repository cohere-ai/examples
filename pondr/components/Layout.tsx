import classNames from 'classnames';
import Link from 'next/link';
import React from 'react';

import LogoSmall from '../assets/logo-small.svg';

const Grid: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div
    className={classNames(
      'h-full grid grid-cols-[1fr_minmax(auto,672px)_1fr]',
      'grid-rows-[auto_1fr_auto]',
      'overflow-auto',
    )}
  >
    {children}
  </div>
);

const Header: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <header className={classNames('col-start-2 col-span-1', 'py-4', 'flex', 'justify-center')}>
    {children}
  </header>
);

const Main: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <main
    className={classNames(
      'col-start-2 row-start-2',
      'px-4',
      'flex flex-col',
      'items-center justify-center',
      className,
    )}
  >
    {children}
  </main>
);

// const Footer: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
//   <footer className={classNames('col-start-2 row-start-3', 'p-4')}>{children}</footer>
// );

interface LayoutProps {
  children?: React.ReactNode;
  className?: string;
  use100vh?: boolean;
}

/**
 * Main layout.
 */
const Layout: React.FC<LayoutProps> = ({ children, className, use100vh = true }) => {
  const layout = (
    <Grid>
      <Header>
        <Link href="/">
          <a>
            <LogoSmall />
          </a>
        </Link>
      </Header>
      <Main className={className}>{children}</Main>
      {/* <Footer></Footer> */}
    </Grid>
  );

  if (use100vh) {
    return <div className="h-screen">{layout}</div>;
  }

  return layout;
};

export default Layout;
