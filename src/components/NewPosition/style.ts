import { colors, typography } from '@static/theme'
import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()(theme => {
  return {
    wrapper: {
      width: 952
    },
    headerContainer: {
      columnGap: 24
    },
    back: {
      height: 24,
      marginBottom: 18,
      width: 'fit-content',
      transition: 'filter 300ms',

      '&:hover': {
        filter: 'brightness(2)'
      }
    },
    backIcon: {
      width: 22,
      height: 24,
      marginRight: 12
    },
    backText: {
      color: colors.invariant.lightHover,
      WebkitPaddingBefore: '2px',
      ...typography.body2
    },
    title: {
      color: colors.white.main,
      ...typography.heading4,

      [theme.breakpoints.down('sm')]: {
        fontSize: 18
      }
    },
    row: {
      minWidth: 464,
      minHeight: 540,
      position: 'relative',
      flexDirection: 'row',

      '& .noConnectedLayer': {
        height: '100%'
      },

      [theme.breakpoints.down('md')]: {
        flexDirection: 'column',
        minWidth: 0,

        '& .noConnectedInfo': {
          justifyContent: 'flex-start',
          paddingTop: 60
        }
      }
    },
    deposit: {
      marginRight: 24,

      [theme.breakpoints.down('md')]: {
        marginBottom: 24,
        marginRight: 0
      }
    },
    settingsIconBtn: {
      width: 20,
      height: 20,
      padding: 0,
      margin: 0,
      marginLeft: 10,
      minWidth: 'auto',
      background: 'none',
      '&:hover': {
        backgroundColor: 'none'
      }
    },
    settingsIcon: {
      width: 20,
      height: 20,
      cursor: 'pointer',
      transition: 'filter 100ms',
      '&:hover': {
        filter: 'brightness(1.5)'
      }
    },
    options: {
      width: 'fit-content',
      marginBottom: 18,
      height: 28
    },
    switch: {
      transition: 'opacity 500ms'
    },
    titleContainer: {
      maxWidth: 464,
      marginBottom: 18,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexGrow: 1,
      [theme.breakpoints.down('md')]: {
        maxWidth: 'none'
      }
    }
  }
})

export default useStyles
