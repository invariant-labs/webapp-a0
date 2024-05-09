import { TESTNET_WAZERO_ADDRESS, TokenAmount } from '@invariant-labs/a0-sdk'
import { AddressOrPair } from '@polkadot/api/types'
import { BN } from '@polkadot/util'
import { createSelector } from '@reduxjs/toolkit'
import { NetworkType } from '@store/consts/static'
import { IAlephZeroWallet, ITokenAccount, walletSliceName } from '@store/reducers/wallet'
import { AnyProps, keySelectors } from './helpers'
import { tokens } from './pools'

const store = (s: AnyProps) => s[walletSliceName] as IAlephZeroWallet

export const { address, balance, accounts, status, balanceLoading } = keySelectors(store, [
  'address',
  'balance',
  'accounts',
  'status',
  'balanceLoading'
])

// export const tokenBalance = (tokenAddress: Keyring) =>
//   createSelector(accounts, balance, (tokensAccounts, solBalance) => {
//     if (tokenAddress.equals(new Keyring(MOCK_TOKENS.SOL))) {
//       return { balance: solBalance, decimals: 9 }
//     } else {
//       if (!tokensAccounts[tokenAddress.toString()]) {
//         return { balance: new BN(0), decimals: 9 }
//       }
//       return {
//         balance: tokensAccounts[tokenAddress.toString()].balance,
//         decimals: tokensAccounts[tokenAddress.toString()].decimals
//       }
//     }
//   })

export const tokenAccount = (tokenAddress: AddressOrPair) =>
  createSelector(accounts, tokensAccounts => {
    if (tokensAccounts[tokenAddress.toString()]) {
      return tokensAccounts[tokenAddress.toString()]
    }
  })

export const tokenAccountsAddress = () =>
  createSelector(accounts, tokenAccounts => {
    return Object.values(tokenAccounts).map(item => {
      return item.address
    })
  })

export interface SwapToken {
  balance: TokenAmount
  decimals: number
  symbol: string
  assetAddress: AddressOrPair
  name: string
  logoURI: string
  isUnknown?: boolean
  coingeckoId?: string
}

export const swapTokens = createSelector(
  accounts,
  tokens,
  balance,
  (allAccounts, tokens, a0Balance) => {
    return Object.values(tokens).map(token => ({
      ...token,
      assetAddress: token.address,
      balance:
        token.address.toString() === TESTNET_WAZERO_ADDRESS
          ? a0Balance
          : allAccounts[token.address.toString()]?.balance ?? BigInt(0)
    }))
  }
)

export const swapTokensDict = createSelector(
  accounts,
  tokens,
  balance,
  (allAccounts, tokens, a0Balance) => {
    const swapTokens: Record<string, SwapToken> = {}
    //Check if this is correct
    Object.entries(tokens).forEach(([key, val]) => {
      swapTokens[key] = {
        ...val,
        assetAddress: val.address,
        balance:
          val.address.toString() === TESTNET_WAZERO_ADDRESS
            ? BigInt(a0Balance)
            : allAccounts[val.address.toString()]?.balance ?? BigInt(0)
      }
    })

    return swapTokens
  }
)

export const canCreateNewPool = (network: NetworkType) =>
  createSelector(balance, ethBalance => {
    // switch (network) {
    //   case NetworkType.DEVNET:
    //     return ethBalance.gte(WETH_POOL_INIT_LAMPORTS)
    //   case NetworkType.TESTNET:
    //     return ethBalance.gte(WETH_POOL_INIT_LAMPORTS_TEST)
    //   case NetworkType.MAINNET:
    //     return ethBalance.gte(WETH_POOL_INIT_LAMPORTS)
    //   default:
    //     return ethBalance.gte(WETH_POOL_INIT_LAMPORTS)
    // }
    return true
  })
export const canCreateNewPosition = (network: NetworkType) =>
  createSelector(balance, ethBalance => {
    // switch (network) {
    //   case NetworkType.DEVNET:
    //     return ethBalance.gte(WETH_POOL_INIT_LAMPORTS)
    //   case NetworkType.TESTNET:
    //     return ethBalance.gte(WETH_POOL_INIT_LAMPORTS_TEST)
    //   case NetworkType.MAINNET:
    //     return ethBalance.gte(WETH_POOL_INIT_LAMPORTS)
    //   default:
    //     return ethBalance.gte(WETH_POOL_INIT_LAMPORTS)
    // }
    return true
  })

export type TokenAccounts = ITokenAccount & {
  symbol: string
  usdValue: BN
  assetDecimals: number
}

export const alephZeroWalletSelectors = {
  address,
  balance,
  accounts,
  status,
  tokenAccount,
  balanceLoading
}
export default alephZeroWalletSelectors