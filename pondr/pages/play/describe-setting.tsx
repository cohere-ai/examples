import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import { Layout } from '../../components';

interface Props {}

/**
 * Describe the setting of both players.
 */
const DescribeRelationshipPage: React.FC<Props> = () => {
  const router = useRouter();
  const [setting, setSetting] = useState('');

  const getNextHref = (setting: string) => {
    return {
      pathname: '/play/question/1',
      query: {
        player1: router.query.player1,
        player2: router.query.player2,
        relationship: router.query.relationship,
        setting,
        depth: 0,
        player1Flipped: 'false',
        player2Flipped: 'false',
      },
    };
  };

  return (
    <Layout>
      <h1 className="text-3xl">What is your setting?</h1>
      <textarea
        className="block w-full rounded-lg mt-4"
        rows={10}
        placeholder='Examples: "At a cafe for lunch", "Just watched a movie", "On a road trip"'
        value={setting}
        onChange={(e) => setSetting(e.target.value)}
      />
      <Link href={getNextHref(setting)}>
        <a className="block rounded-full bg-purple py-2 px-24 text-white mt-3 text-center">Begin</a>
      </Link>
    </Layout>
  );
};

export default DescribeRelationshipPage;
