import { Box, Container, Paper, Typography } from '@mui/material';

import { makeStyles } from '../theme/theme';

const useStyles = makeStyles()((theme) => ({
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
  const { classes } = useStyles();
  // test

  return (
    <Paper className={classes.wrapper}>
      <Typography variant="h1" className={classes.title}>
        CTRL + V
      </Typography>
      {/* <h1 className={styles.title}>CTRL + V</h1> */}
    </Paper>
  );
};

export default TitleText;
