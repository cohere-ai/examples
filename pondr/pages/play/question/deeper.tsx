import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

import { Layout } from '../../../components';

interface Props {}

const DiveDeeperPage: React.FC<Props> = () => {
  const router = useRouter();
  const questionNumber = Number.parseInt(router.query.number as string, 10);
  const depth = Number.parseInt(router.query.depth as string, 10);

  const getNextHref = (depthIncrement: number) => {
    return {
      pathname: '/play/question/[number]',
      query: {
        number: questionNumber + 1,
        player1: router.query.player1,
        player2: router.query.player2,
        relationship: router.query.relationship,
        setting: router.query.setting,
        depth: depth + depthIncrement,
        model: router.query.model,
        player1Flipped: router.query.player1Flipped,
        player2Flipped: router.query.player2Flipped,
      },
    };
  };

  return (
    <Layout className="bg-purple text-white">
      <h1 className="text-3xl">Would you like to dive deeper?</h1>
      <Link href={getNextHref(0)}>
        <a className="w-24 mt-3 py-2 rounded-full text-center border-2">No</a>
      </Link>
      <Link href={getNextHref(1)}>
        <a className="w-24 mt-3 py-2 rounded-full text-center bg-white text-purple">Yes</a>
      </Link>
    </Layout>
  );
};

export default DiveDeeperPage;
