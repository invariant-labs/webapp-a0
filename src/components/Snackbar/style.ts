import { styled } from '@mui/material'
import { colors, typography } from '@static/theme'

import { MaterialDesignContent } from 'notistack'

export const StyledMaterialDesignContent = styled(MaterialDesignContent)(({ theme }) => ({
  '&.notistack-MuiContent-success': {
    backgroundColor: colors.invariant.component,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: colors.invariant.component,
    borderRadius: 10,
    ...typography.body2,
    maxWidth: '100vw',
    width: 330,
    padding: '4px 16px',
    minWidth: 100,

    '& > div:first-of-type': {
      flex: 1
    },

    '& SVG': {
      fontSize: '16px !important',
      color: colors.invariant.green,
      marginTop: -2,
      [theme.breakpoints.down('sm')]: {
        marginTop: 2
      }
    },
    [theme.breakpoints.down('sm')]: {
      maxWidth: 'calc(100vw - 64px)',
      width: 'auto'
    }
  },
  '&.notistack-MuiContent-error': {
    backgroundColor: colors.invariant.component,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: colors.invariant.component,
    borderRadius: 10,
    ...typography.body2,
    maxWidth: '100vw',
    width: 330,
    padding: '4px 16px',
    minWidth: 100,

    '& > div:first-of-type': {
      flex: 1
    },

    '& SVG': {
      fontSize: '16px !important',
      color: colors.invariant.Error,
      marginTop: -2,
      [theme.breakpoints.down('sm')]: {
        marginTop: 2
      }
    },
    [theme.breakpoints.down('sm')]: {
      maxWidth: 'calc(100vw - 64px)',
      width: 'auto'
    }
  },
  '&.notistack-MuiContent-info': {
    backgroundColor: colors.invariant.component,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: colors.invariant.component,
    borderRadius: 10,
    ...typography.body2,
    maxWidth: '100vw',
    width: 330,
    padding: '6px 16px',
    minWidth: 100,

    '& > div:first-of-type': {
      flex: 1
    },

    '& SVG': {
      fontSize: '16px !important',
      color: colors.invariant.textGrey,
      marginTop: -2,
      [theme.breakpoints.down('sm')]: {
        marginTop: 2
      }
    },
    [theme.breakpoints.down('sm')]: {
      maxWidth: 'calc(100vw - 64px)',
      width: 'auto'
    }
  },
  '&.notistack-MuiContent-warning': {
    backgroundColor: colors.invariant.component,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: colors.invariant.component,
    borderRadius: 10,
    ...typography.body2,
    maxWidth: '100vw',
    width: 330,
    padding: '6px 16px',
    minWidth: 100,

    '& > div:first-of-type': {
      flex: 1
    },

    '& SVG': {
      fontSize: '16px !important',
      color: colors.invariant.warning,
      marginTop: -2,
      [theme.breakpoints.down('sm')]: {
        marginTop: 2
      }
    },
    [theme.breakpoints.down('sm')]: {
      maxWidth: 'calc(100vw - 64px)',
      width: 'auto'
    }
  }
}))
