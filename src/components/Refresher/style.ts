import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()(() => ({
  ring: {
    cursor: 'pointer'
  },
  innerCircle: {
    transition: '0.35s stroke-dashoffset',
    transform: 'rotate(-90deg)',
    transformOrigin: '50% 50%'
  }
}))
