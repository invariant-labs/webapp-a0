import {
  Network,
  PoolKey,
  TokenAmount,
  calculateSqrtPrice,
  getMaxTick,
  getMinTick,
  priceToSqrtPrice
} from '@invariant-labs/a0-sdk'
import { PlotTickData } from '@store/reducers/positions'
import axios from 'axios'
import { BTC_TEST, ETH_TEST, Token, TokenPriceData, USDC_TEST, tokensPrices } from './static'

export const createLoaderKey = () => (new Date().getMilliseconds() + Math.random()).toString()

export const getInvariantAddress = (network: Network): string | null => {
  switch (network) {
    case Network.Testnet:
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

export const printAmount = (amount: TokenAmount, decimals: number): string => {
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

export const trimZeros = (numStr: string): string => {
  numStr = numStr.replace(/(\.\d*?)0+$/, '$1')

  return numStr
}

export const PRICE_DECIMAL = 24

export const calcYPerXPrice = (sqrtPrice: bigint, xDecimal: bigint, yDecimal: bigint): number => {
  const sqrt = +printAmount(sqrtPrice, PRICE_DECIMAL)
  const proportion = sqrt * sqrt

  return proportion / 10 ** Number(yDecimal - xDecimal)
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

export const calcPrice = (index: bigint, isXtoY: boolean, xDecimal: bigint, yDecimal: bigint) => {
  //TODO check if this is correct, in Solana sdk was method calculatePriceSqrt which takes index to calculate price
  const price = calcYPerXPrice(calculateSqrtPrice(index), xDecimal, yDecimal)

  return isXtoY ? price : price !== 0 ? 1 / price : Number.MAX_SAFE_INTEGER
}

export const createPlaceholderLiquidityPlot = (
  isXtoY: boolean,
  yValueToFill: number,
  tickSpacing: number,
  tokenXDecimal: bigint,
  tokenYDecimal: bigint
) => {
  const ticksData: PlotTickData[] = []

  // const min = getMinTick(tickSpacing) //TODO check if this is correct
  // const max = getMaxTick(tickSpacing)

  const min = 10n
  const max = 1203n

  const minPrice = calcPrice(min, isXtoY, tokenXDecimal, tokenYDecimal)

  ticksData.push({
    x: minPrice,
    y: yValueToFill,
    index: min
  })

  const maxPrice = calcPrice(max, isXtoY, tokenXDecimal, tokenYDecimal)

  ticksData.push({
    x: maxPrice,
    y: yValueToFill,
    index: max
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

export const getMockedTokenPrice = (symbol: string, network: Network): TokenPriceData => {
  const sufix = network === Network.Testnet ? '_TEST' : '_DEV'
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

export const printBN = (amount: TokenAmount, decimals: bigint): string => {
  const parsedDecimals = Number(decimals)
  const amountString = amount.toString()
  const isNegative = amountString.length > 0 && amountString[0] === '-'

  const balanceString = isNegative ? amountString.slice(1) : amountString

  if (balanceString.length <= Number(decimals)) {
    return (
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      (isNegative ? '-' : '') +
      '0.' +
      '0'.repeat(parsedDecimals - balanceString.length) +
      balanceString
    )
  } else {
    return (
      (isNegative ? '-' : '') +
      trimZeros(
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        balanceString.substring(0, balanceString.length - parsedDecimals) +
          '.' +
          balanceString.substring(balanceString.length - parsedDecimals)
      )
    )
  }
}

export const parseFeeToPathFee = (fee: bigint): string => {
  const parsedFee = (fee / BigInt(Math.pow(10, 8))).toString().padStart(3, '0')
  return parsedFee.slice(0, parsedFee.length - 2) + '_' + parsedFee.slice(parsedFee.length - 2)
}

export const getNetworkTokensList = (networkType: Network): Record<string, Token> => {
  console.log(networkType)

  switch (networkType) {
    case Network.Mainnet: {
    }
    case Network.Testnet:
      return {
        [USDC_TEST.address.toString()]: USDC_TEST,
        [BTC_TEST.address.toString()]: BTC_TEST,
        [ETH_TEST.address.toString()]: ETH_TEST
      }
    default:
      return {}
  }
}

export const getPrimaryUnitsPrice = (
  price: number,
  isXtoY: boolean,
  xDecimal: number,
  yDecimal: number
) => {
  const xToYPrice = isXtoY ? price : 1 / price

  return xToYPrice * 10 ** (yDecimal - xDecimal)
}

export const logBase = (x: number, b: number): number => Math.log(x) / Math.log(b)

export const spacingMultiplicityLte = (arg: number, spacing: number): number => {
  if (Math.abs(arg % spacing) === 0) {
    return arg
  }

  if (arg >= 0) {
    return arg - (arg % spacing)
  }

  return arg - (spacing - (Math.abs(arg) % spacing))
}

export const spacingMultiplicityGte = (arg: number, spacing: number): number => {
  if (Math.abs(arg % spacing) === 0) {
    return arg
  }

  if (arg >= 0) {
    return arg + (spacing - (arg % spacing))
  }

  return arg + (Math.abs(arg) % spacing)
}

export const nearestSpacingMultiplicity = (arg: number, spacing: number) => {
  const greater = spacingMultiplicityGte(arg, spacing)
  const lower = spacingMultiplicityLte(arg, spacing)

  const nearest = Math.abs(greater - arg) < Math.abs(lower - arg) ? greater : lower

  return Math.max(Math.min(nearest, Number(getMaxTick(spacing))), Number(getMinTick(spacing)))
}

export const nearestTickIndex = (
  price: number,
  spacing: bigint,
  isXtoY: boolean,
  xDecimal: bigint,
  yDecimal: bigint
) => {
  //TODO check if this is correct
  try {
    const minTick = getMinTick(spacing)
    const maxTick = getMaxTick(spacing)
    const base = Math.max(
      price,
      Number(calcPrice(isXtoY ? minTick : maxTick, isXtoY, xDecimal, yDecimal))
    )

    const primaryUnitsPrice = getPrimaryUnitsPrice(base, isXtoY, Number(xDecimal), Number(yDecimal))
    const log =
      Math.round(logBase(primaryUnitsPrice, 1.0001)) >= 0
        ? Math.round(logBase(primaryUnitsPrice, 1.0001))
        : -Math.round(logBase(primaryUnitsPrice, 1.0001))

    return BigInt(nearestSpacingMultiplicity(log, Number(spacing)))
  } catch (error) {
    console.log(error)
  }
}

export const stringifyPoolKey = (poolKey: PoolKey) => {
  if (poolKey.tokenX > poolKey.tokenY) {
    return `${poolKey.tokenX}-${poolKey.tokenY}-${poolKey.feeTier.fee.toString()}`
  } else {
    return `${poolKey.tokenY}-${poolKey.tokenX}-${poolKey.feeTier.fee.toString()}`
  }
}

export const printBNtoBN = (amount: string, decimals: number): bigint => {
  const balanceString = amount.split('.')
  if (balanceString.length !== 2) {
    return BigInt(balanceString[0] + '0'.repeat(decimals))
  }

  if (balanceString[1].length <= decimals) {
    return BigInt(
      balanceString[0] + balanceString[1] + '0'.repeat(decimals - balanceString[1].length)
    )
  }
  return 0n
}
