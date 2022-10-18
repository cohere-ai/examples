import { useRouter } from 'next/router';
import React from 'react';

import { Layout } from '../components';

interface Props {}

/**
 * Welcome + player name entry page.
 */
const IndexPage: React.FC<Props> = () => {
  const router = useRouter();

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const player1 = event.currentTarget['player-1'].value;
    const player2 = event.currentTarget['player-2'].value;

    router.push({
      pathname: '/play/describe-relationship',
      query: { player1, player2 },
    });
  };

  return (
    <Layout>
      <h1 className="text-3xl">Who&apos;s playing?</h1>
      <form onSubmit={handleSubmit}>
        <label className="block" htmlFor="player-1">
          Player 1
        </label>
        <input className="block" type="text" id="player-1" name="player-1" required />
        <label className="block" htmlFor="player-2">
          Player 2
        </label>
        <input className="block" type="text" id="player-2" name="player-2" required />
        <button className="block rounded-full bg-purple w-full p-2 text-white mt-3" type="submit">
          Start
        </button>
      </form>
    </Layout>
  );
};

export default IndexPage;
