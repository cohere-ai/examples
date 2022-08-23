import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

import { Layout } from '../../components';

export type Relationship = 'friendship' | 'romance' | 'coworkers' | 'strangers';

interface Props {}

/**
 * Describe the relationship between both players.
 */
const DescribeRelationshipPage: React.FC<Props> = () => {
  const router = useRouter();

  const getNextHref = (relationship: Relationship) => {
    return {
      pathname: '/play/describe-setting',
      query: {
        player1: router.query.player1,
        player2: router.query.player2,
        relationship,
      },
    };
  };

  return (
    <Layout>
      <h1 className="text-3xl">Describe your current relationship</h1>
      <div className="mt-4 w-full grid grid-cols-2 grid-rows-2 gap-3">
        <Link href={getNextHref('friendship')}>
          <a className="p-8 flex justify-center bg-purple text-white rounded-lg">friendship</a>
        </Link>
        <Link href={getNextHref('romance')}>
          <a className="p-8 flex justify-center bg-purple text-white rounded-lg">romance</a>
        </Link>
        <Link href={getNextHref('coworkers')}>
          <a className="p-8 flex justify-center bg-purple text-white rounded-lg">coworkers</a>
        </Link>
        <Link href={getNextHref('strangers')}>
          <a className="p-8 flex justify-center bg-purple text-white rounded-lg">strangers</a>
        </Link>
      </div>
    </Layout>
  );
};

export default DescribeRelationshipPage;
