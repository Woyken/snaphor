import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

import { Button, Card, CardActions, CardContent, CardMedia, Container, Grid, makeStyles, Paper as div, Typography } from '@material-ui/core';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';

import { useClipboard } from '../hooks/clipboardContext';

const useStyles = makeStyles({
  resultsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  previewCardWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  previewCard: {
    width: '10vw',
  },
  canvas: {
    width: '100%',
    maxWidth: '50vw',
  },
  cardTitle: {
    fontSize: 14,
  },
});

const Results: React.FC = (props) => {
  const styles = useStyles();
  const clipboardState = useClipboard();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    if (!clipboardState.inputImage) return;
    canvasRef.current.height = clipboardState.inputImage.height;
    canvasRef.current.width = clipboardState.inputImage.width;
    context.putImageData(clipboardState.inputImage, 0, 0);
    canvasRef.current.scrollIntoView();
  }, [clipboardState, clipboardState.inputImage]);

  // TODO handle drag and drop with "react-dropzone"

  return (
    <div className={styles.resultsOverlay}>
      <Container maxWidth={false}>
        <AnimatePresence>
          <Grid container>
            {!clipboardState.inputImage ? null : (
              <Grid item>
                <motion.div
                  className={styles.previewCardWrapper}
                  exit={{
                    scale: 0,
                    transition: {
                      ease: 'backOut',
                      duration: 0.4,
                    },
                  }}
                  initial={{
                    scale: 0,
                  }}
                  animate={{
                    scale: 1,
                    transformOrigin: 'left top',
                    transition: {
                      ease: 'backOut',
                      duration: 0.4,
                    },
                  }}
                >
                  <Container style={{ zIndex: 1 }}>
                    <motion.div
                      whileHover={{
                        scale: 5,
                        transition: {
                          ease: 'backOut',
                          duration: 0.4,
                        },
                      }}
                      animate={{
                        transformOrigin: 'left top',
                      }}
                    >
                      <Card className={styles.previewCard}>
                        <CardMedia>
                          <canvas className={styles.canvas} ref={canvasRef} />
                        </CardMedia>
                      </Card>
                    </motion.div>
                  </Container>
                  <ArrowForwardIcon />
                </motion.div>
              </Grid>
            )}
            <Grid item>
              <Container>
                <Grid container spacing={3}>
                  {clipboardState.parsedEvents.map((event) => (
                    <Grid item key={event.googleCreateEventUrl}>
                      <motion.div
                        exit={{
                          scale: 0,
                          transition: {
                            ease: 'backOut',
                            duration: 0.4,
                          },
                        }}
                        initial={{
                          scale: 0,
                        }}
                        animate={{
                          scale: 1,
                          transformOrigin: 'left top',
                          transition: {
                            ease: 'backOut',
                            duration: 0.4,
                          },
                        }}
                      >
                        <Card>
                          <CardContent>
                            <Typography variant="h5" component="h2">
                              {event.title}
                            </Typography>
                            <Typography variant="body1" component="p">
                              {event.description}
                            </Typography>
                            <Typography variant="body2" component="p">
                              Start: {event.startDate.toString()}
                            </Typography>
                            <Typography variant="body2" component="p">
                              End: {event.endDate.toString()}
                            </Typography>
                          </CardContent>
                          <CardActions>
                            <Button size="small" variant="contained" color="primary" href={event.googleCreateEventUrl}>
                              Google calendar create this event
                            </Button>
                          </CardActions>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </Container>
            </Grid>
          </Grid>
        </AnimatePresence>
      </Container>
    </div>
  );
};

export default Results;
