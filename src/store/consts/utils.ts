import { TokenAmount, getMaxTick, getMinTick, priceToSqrtPrice } from '@invariant-labs/a0-sdk'
import { PlotTickData } from '@store/reducers/positions'
import axios from 'axios'
import { NetworkType, TokenPriceData, tokensPrices } from './static'

export const createLoaderKey = () => (new Date().getMilliseconds() + Math.random()).toString()

export const getInvariantAddress = (network: NetworkType): string | null => {
  switch (network) {
    case NetworkType.TESTNET:
      return '5FiTccBSAH9obLA4Q33hYrL3coPm2SE276rFPVttFPFnaxnC'
    default:
      return null
  }
}

export interface PrefixConfig {
  B?: number
  M?: number
  K?: number
}

const defaultPrefixConfig: PrefixConfig = {
  B: 1000000000,
  M: 1000000,
  K: 10000
}

export const showPrefix = (nr: number, config: PrefixConfig = defaultPrefixConfig): string => {
  const abs = Math.abs(nr)

  if (typeof config.B !== 'undefined' && abs >= config.B) {
    return 'B'
  }

  if (typeof config.M !== 'undefined' && abs >= config.M) {
    return 'M'
  }

  if (typeof config.K !== 'undefined' && abs >= config.K) {
    return 'K'
  }

  return ''
}

export interface FormatNumberThreshold {
  value: number
  decimals: number
  divider?: number
}

export const defaultThresholds: FormatNumberThreshold[] = [
  {
    value: 10,
    decimals: 4
  },
  {
    value: 1000,
    decimals: 2
  },
  {
    value: 10000,
    decimals: 1
  },
  {
    value: 1000000,
    decimals: 2,
    divider: 1000
  },
  {
    value: 1000000000,
    decimals: 2,
    divider: 1000000
  },
  {
    value: Infinity,
    decimals: 2,
    divider: 1000000000
  }
]

export const formatNumbers =
  (thresholds: FormatNumberThreshold[] = defaultThresholds) =>
  (value: string) => {
    const num = Number(value)
    const abs = Math.abs(num)
    const threshold = thresholds.sort((a, b) => a.value - b.value).find(thr => abs < thr.value)

    const formatted = threshold
      ? (abs / (threshold.divider ?? 1)).toFixed(threshold.decimals)
      : value

    return num < 0 && threshold ? '-' + formatted : formatted
  }

export const printAmount = (amount: string, decimals: number): string => {
  const isNegative = amount.length > 0 && amount[0] === '-'

  const balanceString = isNegative ? amount.slice(1) : amount

  if (balanceString.length <= decimals) {
    return (
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      (isNegative ? '-' : '') + '0.' + '0'.repeat(decimals - balanceString.length) + balanceString
    )
  } else {
    return (
      (isNegative ? '-' : '') +
      trimZeros(
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        balanceString.substring(0, balanceString.length - decimals) +
          '.' +
          balanceString.substring(balanceString.length - decimals)
      )
    )
  }
}

export const trimZeros = (numStr: string): string => {
  numStr = numStr.replace(/(\.\d*?)0+$/, '$1')

  return numStr
}

export const PRICE_DECIMAL = 24

export const calcYPerXPrice = (sqrtPrice: string, xDecimal: number, yDecimal: number): number => {
  const sqrt = +printAmount(sqrtPrice, PRICE_DECIMAL)
  const proportion = sqrt * sqrt

  return proportion / 10 ** (yDecimal - xDecimal)
}

export const trimLeadingZeros = (amount: string): string => {
  const amountParts = amount.split('.')

  if (!amountParts.length) {
    return '0'
  }

  if (amountParts.length === 1) {
    return amountParts[0]
  }

  const reversedDec = Array.from(amountParts[1]).reverse()
  const firstNonZero = reversedDec.findIndex(char => char !== '0')

  if (firstNonZero === -1) {
    return amountParts[0]
  }

  const trimmed = reversedDec.slice(firstNonZero, reversedDec.length).reverse().join('')

  return `${amountParts[0]}.${trimmed}`
}

export const getScaleFromString = (value: string): number => {
  const parts = value.split('.')

  if ((parts?.length ?? 0) < 2) {
    return 0
  }

  return parts[1]?.length ?? 0
}

export const toMaxNumericPlaces = (num: number, places: number): string => {
  const log = Math.floor(Math.log10(num))

  if (log >= places) {
    return num.toFixed(0)
  }

  if (log >= 0) {
    return num.toFixed(places - log - 1)
  }

  return num.toFixed(places + Math.abs(log) - 1)
}

export const calcPrice = (index: bigint, isXtoY: boolean, xDecimal: number, yDecimal: number) => {
  //Check if this is correct
  const price = calcYPerXPrice(priceToSqrtPrice(index).toString(), xDecimal, yDecimal)

  return isXtoY ? price : price !== 0 ? 1 / price : Number.MAX_SAFE_INTEGER
}

export const createPlaceholderLiquidityPlot = (
  isXtoY: boolean,
  yValueToFill: number,
  tickSpacing: number,
  tokenXDecimal: number,
  tokenYDecimal: number
) => {
  const ticksData: PlotTickData[] = []

  const min = getMinTick(tickSpacing)
  const max = getMaxTick(tickSpacing)

  const minPrice = calcPrice(min, isXtoY, tokenXDecimal, tokenYDecimal)

  ticksData.push({
    x: minPrice,
    y: yValueToFill,
    index: Number(min)
  })

  const maxPrice = calcPrice(max, isXtoY, tokenXDecimal, tokenYDecimal)

  ticksData.push({
    x: maxPrice,
    y: yValueToFill,
    index: Number(max)
  })

  return isXtoY ? ticksData : ticksData.reverse()
}

export interface CoingeckoPriceData {
  price: number
  priceChange: number
}
export interface CoingeckoApiPriceData {
  id: string
  current_price: number
  price_change_percentage_24h: number
}

export const getCoingeckoTokenPrice = async (id: string): Promise<CoingeckoPriceData> => {
  return await axios
    .get<
      CoingeckoApiPriceData[]
    >(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${id}`)
    .then(res => {
      return {
        price: res.data[0].current_price ?? 0,
        priceChange: res.data[0].price_change_percentage_24h ?? 0
      }
    })
}

export const getMockedTokenPrice = (symbol: string, network: NetworkType): TokenPriceData => {
  const sufix = network === NetworkType.DEVNET ? '_DEV' : '_TEST'
  const prices = tokensPrices[network]
  switch (symbol) {
    case 'BTC':
      return prices[symbol + sufix]
    case 'ETH':
      return prices['W' + symbol + sufix]
    case 'USDC':
      return prices[symbol + sufix]
    default:
      return { price: 0 }
  }
}

export const printBN = (amount: TokenAmount, decimals: number): string => {
  const amountString = amount.toString()
  const isNegative = amountString.length > 0 && amountString[0] === '-'

  const balanceString = isNegative ? amountString.slice(1) : amountString

  if (balanceString.length <= decimals) {
    return (
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      (isNegative ? '-' : '') + '0.' + '0'.repeat(decimals - balanceString.length) + balanceString
    )
  } else {
    return (
      (isNegative ? '-' : '') +
      trimZeros(
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        balanceString.substring(0, balanceString.length - decimals) +
          '.' +
          balanceString.substring(balanceString.length - decimals)
      )
    )
  }
}
