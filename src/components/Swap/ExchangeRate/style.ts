import { colors, typography } from '@static/theme'
import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()(() => ({
  rateText: {
    color: colors.invariant.lightGrey,
    ...typography.caption2,
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden'
  },
  loadingContainer: {
    width: 20,
    paddingInline: 15,
    justifyContent: 'center',
    overflow: 'hidden'
  },
  loading: {
    width: 15,
    zIndex: 10,
    marginTop: 6
  },
  ableToHover: {
    border: `1px solid ${colors.invariant.light}`,
    borderRadius: '10px',
    paddingInline: 15,
    cursor: 'pointer',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    '&:hover': {
      borderColor: colors.invariant.lightHover
    },
    '@media (max-width: 400px)': {
      width: '100%'
    }
  }
}))

export default useStyles
