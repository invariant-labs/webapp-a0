import { CircularProgress, Typography } from '@mui/material'
import { styled } from '@mui/system'
import { colors, typography } from '@static/theme'

import { SnackbarContent } from 'notistack'

export const StyledSnackbarContent = styled(SnackbarContent)(({ theme }) => ({
  display: 'flex',
  position: 'relative',
  flexDirection: 'column',
  maxWidth: 330,
  width: 330,
  padding: '7px 16px',
  minWidth: 100,
  overflow: 'hidden',
  boxShadow: `0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)`,
  background: `linear-gradient(${colors.invariant.component},${colors.invariant.component} ) padding-box,
  linear-gradient(to right top, ${colors.invariant.green}, ${colors.invariant.pink}) border-box`,
  backgroundColor: colors.invariant.component,
  borderStyle: 'solid',
  borderRadius: 10,
  border: `1px solid transparent`,
  borderBottomWidth: 5,
  ...typography.body2,

  '& .MuiCircularProgress-colorPrimary': {
    color: colors.invariant.textGrey
  },

  [theme.breakpoints.down('sm')]: {
    maxWidth: 'calc(100vw - 64px)',
    width: 'auto'
  }
}))

export const StyledContainer = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: 'auto',
  minHeight: 30,
  '& div > div': {
    margin: 0
  }
})

export const StyledTitle = styled(Typography)({
  marginLeft: 8,
  color: colors.invariant.text,
  ...typography.body2
})

export const StyledCloseButton = styled('button')({
  backgroundColor: 'transparent',
  border: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 30,
  width: 'fit-content',
  cursor: 'pointer',
  margin: 0,
  '&:hover': {
    '& img': {
      transition: '.2s all ease-in',
      transform: 'scale(1.2)'
    }
  }
})

export const StyledCircularProgress = styled(CircularProgress)({
  color: colors.invariant.textGrey,
  display: 'flex',
  alignItems: 'center',

  '& SVG': {
    width: 13,
    height: 13
  }
})
