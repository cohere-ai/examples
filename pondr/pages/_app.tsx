import type { AppProps } from 'next/app';
import { createClient, Provider } from 'urql';

import '../styles/globals.css';

const client = createClient({
  url: '/api/graphql',
  // fetchOptions: () => {
  //   const token = process.env.NEXT_PUBLIC_COHERE_API_KEY;
  //   return {
  //     headers: { authorization: token ? `Bearer ${token}` : '' },
  //   };
  // },
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider value={client}>
      <Component {...pageProps} />
    </Provider>
  );
}

export default MyApp;
