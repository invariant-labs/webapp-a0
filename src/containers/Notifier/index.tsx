import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSnackbar } from 'notistack'

// import { network } from '@selectors/solanaConnection'

import { snackbarsSelectors } from '@store/selectors/snackbars'
import { actions } from '@store/reducers/snackbars'
import useStyles from './style'
import icons from '@static/icons'

let displayed: string[] = []

const Notifier = () => {
  const dispatch = useDispatch()
  const notifications = useSelector(snackbarsSelectors.snackbars)
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const { classes } = useStyles()

  const storeDisplayed = (id: string) => {
    displayed = [...displayed, id]
  }

  const removeDisplayed = (id: string) => {
    displayed = [...displayed.filter(key => id !== key)]
  }
  //   const currentNetwork: string = useSelector(network)

  React.useEffect(() => {
    notifications.forEach(({ key = '', message, open, variant, txid, persist = true }) => {
      if (!open) {
        // dismiss snackbar using notistack
        closeSnackbar(key)
        return
      }
      // do nothing if snackbar is already displayed
      if (key && displayed.includes(key)) return
      // do nothing if snackbar is already displayed
      const action = () =>
        txid && (
          <div className={classes.detailsWrapper}>
            <button
              className={classes.button}
              onClick={() => {
                window.open(`https://alephzero-testnet.subscan.io/extrinsic/${txid}`, '_blank')
              }}>
              <span>Details</span>
            </button>
            <button className={classes.closeButton} onClick={() => closeSnackbar(key)}>
              <img src={icons.closeIcon}></img>
            </button>
          </div>
        )
      // display snackbar using notistack
      enqueueSnackbar(message, {
        key,
        action: action,
        variant: variant,
        persist: persist,
        // autoHideDuration: 5000,
        onExited: (_event, myKey) => {
          dispatch(actions.remove(myKey as string))
          removeDisplayed(myKey as string)
        },
        txid: txid

        // currentNetwork: currentNetwork.toLowerCase()
      })
      storeDisplayed(key)
    })
  }, [notifications, closeSnackbar, enqueueSnackbar, dispatch, classes])

  return null
}

export default Notifier
