import { Keyring } from '@polkadot/api'
import { AddressOrPair } from '@polkadot/api/types'

export enum NetworkType {
  DEVNET = 'Devnet',
  TESTNET = 'Testnet',
  LOCALNET = 'Localnet',
  MAINNET = 'Mainnet'
}

export enum AlephZeroNetworks {
  TEST = 'wss://ws.test.azero.dev',
  DEV = 'wss://ws.dev.azero.dev'
}

export const POSITIONS_PER_PAGE = 5

export const STABLECOIN_ADDRESSES: string[] = []

export const DEFAULT_PUBLICKEY = new Keyring({ type: 'ecdsa' })

export type PositionOpeningMethod = 'range' | 'concentration'

export interface TokenPriceData {
  price: number
}

export interface Token {
  symbol: string
  address: AddressOrPair
  decimals: number
  name: string
  logoURI: string
  coingeckoId?: string
  isUnknown?: boolean
}

// TODO - add real data
export const ALL_FEE_TIERS_DATA = []

export const tokensPrices: Record<NetworkType, Record<string, TokenPriceData>> = {
  Devnet: {},
  Mainnet: {},
  Testnet: {
    USDC_TEST: { price: 1 },
    BTC_TEST: { price: 64572.0 }
  },
  Localnet: {}
}
export interface BestTier {
  tokenX: AddressOrPair
  tokenY: AddressOrPair
  bestTierIndex: number
}

const mainnetBestTiersCreator = () => {
  const stableTokens = {
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
  }

  const unstableTokens = {
    BTC: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E'
  }

  const bestTiers: BestTier[] = []

  for (let i = 0; i < 4; i++) {
    const tokenX = Object.values(stableTokens)[i]
    for (let j = i + 1; j < 4; j++) {
      const tokenY = Object.values(stableTokens)[j]

      bestTiers.push({
        tokenX,
        tokenY,
        bestTierIndex: 0
      })
    }
  }

  for (let i = 0; i < 5; i++) {
    const [symbolX, tokenX] = Object.entries(unstableTokens)[i]
    for (let j = i + 1; j < 5; j++) {
      const [symbolY, tokenY] = Object.entries(unstableTokens)[j]

      if (symbolX.slice(-3) === 'SOL' && symbolY.slice(-3) === 'SOL') {
        bestTiers.push({
          tokenX,
          tokenY,
          bestTierIndex: 0
        })
      } else {
        bestTiers.push({
          tokenX,
          tokenY,
          bestTierIndex: 2
        })
      }
    }
  }

  for (let i = 0; i < 4; i++) {
    const tokenX = Object.values(stableTokens)[i]
    for (let j = 0; j < 5; j++) {
      const tokenY = Object.values(unstableTokens)[j]

      bestTiers.push({
        tokenX,
        tokenY,
        bestTierIndex: 2
      })
    }
  }

  return bestTiers
}

export const bestTiers: Record<NetworkType, BestTier[]> = {
  Devnet: [],
  Testnet: [],
  Mainnet: [],
  Localnet: []
}

export const commonTokensForNetworks: Record<NetworkType, AddressOrPair[]> = {
  Devnet: [],
  Mainnet: [],
  Testnet: [],
  Localnet: []
}

export const FAUCET_TOKEN_AMOUNT = 1000n

export enum FaucetDecimal {
  BTC = 8,
  ETH = 18,
  USDC = 6
}

export enum FaucetToken {
  BTC = '5HSJiEuRf7U1kaQ5FvYiiFyL8hFd8iNaVHgSu6hRovWQ4NjH',
  ETH = '5HmtCRaA51dANEnbPnAZzmUmytGbXBbwXHaWn3GdNfTHkncG',
  USDC = '5DxLneeqtaCeeCMHBJkm5cbfvuGQ2Lk9mXW7UcdHqFo9E8kQ'
}
