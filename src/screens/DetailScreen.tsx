import React from 'react';
import type { RouteProp } from '@react-navigation/native';
import WebViewScreen from '../components/WebViewScreen';

type DetailScreenRouteProp = RouteProp<
  { Detail: { url: string; title: string } },
  'Detail'
>;

interface DetailScreenProps {
  route: DetailScreenRouteProp;
}

const DetailScreen: React.FC<DetailScreenProps> = ({ route }) => {
  const { url } = route.params;
  return <WebViewScreen url={url} />;
};

export default DetailScreen;
