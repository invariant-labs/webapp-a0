import Header from '@components/Header/Header'
import { Network } from '@invariant-labs/a0-sdk'
import { AlephZeroNetworks } from '@store/consts/static'
import { actions } from '@store/reducers/connection'
import { Status, actions as walletActions } from '@store/reducers/wallet'
import { networkType, rpcAddress } from '@store/selectors/connection'
import { address, status } from '@store/selectors/wallet'
import { openWalletSelectorModal } from '@utils/web3/selector'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import React, { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

export const HeaderWrapper: React.FC = () => {
  const dispatch = useDispatch()
  const walletStatus = useSelector(status)
  const currentNetwork = useSelector(networkType)
  const currentRpc = useSelector(rpcAddress)
  const location = useLocation()
  const walletAddress = useSelector(address)

  useEffect(() => {
    const fetchWallet = async () => {
      const wallet = await getAlephZeroWallet()
      wallet.addListener('connect', () => {
        dispatch(walletActions.connect())
      })
      // if (wallet.connected) {
      //   dispatch(walletActions.connect())
      // }

      await wallet.canEagerConnect().then(
        async canEagerConnect => {
          if (canEagerConnect) {
            // await wallet.connect()

            dispatch(walletActions.connect())
          }
        },
        error => {
          console.log(error)
        }
      )
    }

    fetchWallet()
  }, [])

  const defaultTestnetRPC = useMemo(() => {
    const lastRPC = localStorage.getItem('INVARIANT_TESTNET_RPC')

    return lastRPC === null ? AlephZeroNetworks.TEST : lastRPC
  }, [])

  return (
    <Header
      address={walletAddress}
      onNetworkSelect={(network, rpcAddress, rpcName) => {
        if (network !== currentNetwork || rpcAddress !== currentRpc) {
          if (network === Network.Testnet) {
            localStorage.setItem('INVARIANT_TESTNET_RPC', rpcAddress)
          }

          dispatch(actions.setNetwork({ networkType: network, rpcAddress, rpcName }))
        }
      }}
      onConnectWallet={openWalletSelectorModal}
      landing={location.pathname.substring(1)}
      walletConnected={walletStatus === Status.Initialized}
      onDisconnectWallet={() => {
        dispatch(walletActions.disconnect())
      }}
      onFaucet={() => dispatch(walletActions.airdrop())}
      typeOfNetwork={currentNetwork}
      rpc={currentRpc}
      defaultTestnetRPC={defaultTestnetRPC}
    />
  )
}

export default HeaderWrapper
