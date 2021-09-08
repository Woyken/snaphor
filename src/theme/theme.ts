import { createMakeStyles } from 'tss-react';

import { useTheme as useThemeMui } from '@mui/material';

function useTheme() {
  const theme = useThemeMui();
  return {
    ...theme,
  };
}

export const { makeStyles, useStyles } = createMakeStyles({ useTheme });
