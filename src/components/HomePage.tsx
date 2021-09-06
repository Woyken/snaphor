import { useState } from 'react';

import Results from './Results';
import TitleText from './TitleText';

const Home: React.FC = (props) => {
  const [isResultsModalVisible, setIsResultsModalVisible] = useState(false);
  return (
    <>
      <div>
        {/* <motion.div
      animate={{ rotateX: 360 }}
      transition={{
        repeat: Infinity,
        duration: 200,
        ease: 'linear',
      }}
    > */}
        <TitleText />
        {/* </motion.div> */}
      </div>
      <Results />
    </>
  );
};

export default Home;
