import { colors, typography } from '@static/theme'
import { makeStyles } from 'tss-react/mui'

export const useWrapperStyles = makeStyles()(theme => ({
  wrapper: {
    margin: '0px 0 24px',
    borderRadius: 16,
    border: `1px solid ${colors.invariant.light}`,
    padding: '8px 12px',

    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column'
    }
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.invariant.light,
    margin: '0 24px',
    [theme.breakpoints.down('sm')]: {
      height: 1,
      width: '100%',
      margin: '8px 0'
    }
  }
}))

export const useStyles = makeStyles<{ isToken: boolean }>()((_theme, { isToken }) => ({
  token: {
    display: 'flex',
    justifyContent: 'flex-start',
    flex: 1,
    width: '100%'
  },

  tokenIcon: {
    minWidth: 30,
    maxWidth: 30,
    height: 30,
    marginRight: 8,
    borderRadius: '50%'
  },
  tokenName: {
    color: colors.white.main,
    ...typography.body1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  tokenAddress: {
    backgroundColor: colors.invariant.newDark,
    borderRadius: 4,
    padding: '2px 4px',
    display: 'flex',
    flexWrap: 'nowrap',
    alignItems: 'center',
    columnGap: 4,

    '& p': {
      color: colors.invariant.textGrey,
      ...typography.caption4,
      whiteSpace: 'nowrap'
    }
  },
  tokenDescription: {
    color: colors.invariant.textGrey,
    ...typography.caption4,
    lineHeight: '16px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingRight: 24
  },
  price: {
    color: colors.invariant.text,
    ...typography.body1,
    whiteSpace: 'nowrap'
  },
  rightItems: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  clipboardIcon: {
    display: 'inline-block',
    height: 10,
    color: colors.invariant.textGrey,
    cursor: isToken ? 'pointer' : 'default',
    '&:hover': {
      filter: isToken ? 'brightness(1.2)' : 'none'
    }
  },
  link: {
    maxHeight: 8,

    '& img': {
      height: 8,
      width: 8,
      transform: 'translateY(-12px)'
    },
    '&:hover': {
      filter: 'brightness(1.2)'
    }
  }
}))
