import { Box, Container, makeStyles, Paper, Typography } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  title: {
    fontSize: '10em',
  },
  wrapper: {
    height: '100vh',
    maxHeight: '100%',
    width: '100vw',
    maxWidth: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

const TitleText = (): JSX.Element => {
  const styles = useStyles();
  // test

  return (
    <Paper className={styles.wrapper}>
      <Typography variant="h1" className={styles.title}>
        CTRL + V
      </Typography>
      {/* <h1 className={styles.title}>CTRL + V</h1> */}
    </Paper>
  );
};

export default TitleText;
