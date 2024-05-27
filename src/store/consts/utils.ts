import {
  Invariant,
  Network,
  PSP22,
  PoolKey,
  TESTNET_INVARIANT_ADDRESS,
  TokenAmount,
  calculateSqrtPrice,
  calculateTickDelta,
  getMaxTick,
  getMinTick
} from '@invariant-labs/a0-sdk'
import { PRICE_SCALE } from '@invariant-labs/a0-sdk/target/consts'
import { ApiPromise } from '@polkadot/api'
import { PoolWithPoolKey } from '@store/reducers/pools'
import { PlotTickData } from '@store/reducers/positions'
import axios from 'axios'
import {
  BTC,
  DEFAULT_INVARIANT_OPTIONS,
  DEFAULT_PSP22_OPTIONS,
  ETH,
  Token,
  TokenPriceData,
  USDC,
  tokensPrices
} from './static'

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

export const trimZeros = (numStr: string): string => {
  numStr = numStr.replace(/(\.\d*?)0+$/, '$1')

  return numStr
}

export const calcYPerXPriceByTickIndex = (
  tickIndex: bigint,
  xDecimal: bigint,
  yDecimal: bigint
): number => {
  const sqrt = +printBigint(calculateSqrtPrice(tickIndex), PRICE_SCALE)

  const proportion = sqrt * sqrt

  return proportion / 10 ** Number(yDecimal - xDecimal)
}
export const calcYPerXPriceBySqrtPrice = (
  sqrtPrice: bigint,
  xDecimal: bigint,
  yDecimal: bigint
): number => {
  const sqrt = +printBigint(sqrtPrice, PRICE_SCALE)

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

export const calcPrice = (
  amountTickIndex: bigint,
  isXtoY: boolean,
  xDecimal: bigint,
  yDecimal: bigint
): number => {
  const price = calcYPerXPriceByTickIndex(amountTickIndex, xDecimal, yDecimal)

  return isXtoY ? price : 1 / price
}

export const createPlaceholderLiquidityPlot = (
  isXtoY: boolean,
  yValueToFill: number,
  tickSpacing: bigint,
  tokenXDecimal: bigint,
  tokenYDecimal: bigint
) => {
  const ticksData: PlotTickData[] = []

  const min = getMinTick(tickSpacing)
  const max = getMaxTick(tickSpacing)

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

export const printBigint = (amount: TokenAmount, decimals: bigint): string => {
  const parsedDecimals = Number(decimals)
  const amountString = amount.toString()
  const isNegative = amountString.length > 0 && amountString[0] === '-'

  const balanceString = isNegative ? amountString.slice(1) : amountString

  if (balanceString.length <= parsedDecimals) {
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

export const getTokenDataByAddresses = async (
  tokens: string[],
  api: ApiPromise,
  network: Network,
  address: string
): Promise<Record<string, Token>> => {
  const psp22 = await PSP22.load(api, network, DEFAULT_PSP22_OPTIONS)

  const promises = tokens.flatMap(token => {
    return [
      psp22.tokenSymbol(token),
      psp22.tokenName(token),
      psp22.tokenDecimals(token),
      psp22.balanceOf(address, token)
    ]
  })
  const results = await Promise.all(promises)

  const newTokens: Record<string, Token> = {}
  tokens.forEach((token, index) => {
    const baseIndex = index * 4
    newTokens[token] = {
      symbol: results[baseIndex] as string,
      address: token,
      name: results[baseIndex + 1] as string,
      decimals: results[baseIndex + 2] as bigint,
      balance: results[baseIndex + 3] as bigint,
      logoURI: ''
    }
  })
  return newTokens
}

export const getTokenBalances = async (
  tokens: string[],
  api: ApiPromise,
  network: Network,
  address: string
): Promise<[string, bigint][]> => {
  const psp22 = await PSP22.load(api, network, DEFAULT_PSP22_OPTIONS)

  const promises: Promise<any>[] = []
  tokens.map(token => {
    promises.push(psp22.balanceOf(address, token))
  })
  const results = await Promise.all(promises)

  const tokenBalances: [string, bigint][] = []
  tokens.map((token, index) => {
    tokenBalances.push([token, results[index]])
  })
  return tokenBalances
}

export const getPoolsByPoolKeys = async (
  poolKeys: PoolKey[],
  api: ApiPromise,
  network: Network
): Promise<PoolWithPoolKey[]> => {
  const invariant = await Invariant.load(
    api,
    network,
    TESTNET_INVARIANT_ADDRESS,
    DEFAULT_INVARIANT_OPTIONS
  )

  const promises = poolKeys.map(({ tokenX, tokenY, feeTier }) =>
    invariant.getPool(tokenX, tokenY, feeTier)
  )
  const pools = await Promise.all(promises)

  return pools.map((pool, index) => ({
    ...pool,
    poolKey: poolKeys[index]
  }))
}

export const poolKeyToString = (poolKey: PoolKey): string => {
  return poolKey.tokenX + poolKey.tokenY + poolKey.feeTier.fee + poolKey.feeTier.tickSpacing
}

export const getNetworkTokensList = (networkType: Network): Record<string, Token> => {
  switch (networkType) {
    case Network.Mainnet: {
    }
    case Network.Testnet:
      return {
        [USDC.address.toString()]: USDC,
        [BTC.address.toString()]: BTC,
        [ETH.address.toString()]: ETH
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

export const adjustToSpacing = (baseTick: number, spacing: number, isGreater: boolean): number => {
  const remainder = baseTick % spacing

  if (Math.abs(remainder) === 0) {
    return baseTick
  }

  let adjustment: number
  if (isGreater) {
    if (baseTick >= 0) {
      adjustment = spacing - remainder
    } else {
      adjustment = Math.abs(remainder)
    }
  } else {
    if (baseTick >= 0) {
      adjustment = -remainder
    } else {
      adjustment = -(spacing - Math.abs(remainder))
    }
  }

  return baseTick + adjustment
}

export const spacingMultiplicityLte = (arg: number, spacing: number): number => {
  return adjustToSpacing(arg, spacing, false)
}

export const spacingMultiplicityGte = (arg: number, spacing: number): number => {
  return adjustToSpacing(arg, spacing, true)
}

export const nearestSpacingMultiplicity = (centerTick: number, spacing: number) => {
  const greaterTick = spacingMultiplicityGte(centerTick, spacing)
  const lowerTick = spacingMultiplicityLte(centerTick, spacing)

  const nearestTick =
    Math.abs(greaterTick - centerTick) < Math.abs(lowerTick - centerTick) ? greaterTick : lowerTick

  return Math.max(
    Math.min(nearestTick, Number(getMaxTick(BigInt(spacing)))),
    Number(getMinTick(BigInt(spacing)))
  )
}

export const nearestTickIndex = (
  price: number,
  spacing: bigint,
  isXtoY: boolean,
  xDecimal: bigint,
  yDecimal: bigint
) => {
  try {
    const minTick = getMinTick(spacing)
    const maxTick = getMaxTick(spacing)

    const basePrice = Math.max(
      price,
      Number(calcPrice(isXtoY ? minTick : maxTick, isXtoY, xDecimal, yDecimal))
    )
    const primaryUnitsPrice = getPrimaryUnitsPrice(
      basePrice,
      isXtoY,
      Number(xDecimal),
      Number(yDecimal)
    )
    const tick = Math.round(logBase(primaryUnitsPrice, 1.0001))

    return BigInt(nearestSpacingMultiplicity(tick, Number(spacing)))
  } catch (error) {
    console.log(error)
  }
}

export const convertBalanceToBigint = (amount: string, decimals: bigint | number): bigint => {
  const balanceString = amount.split('.')
  if (balanceString.length !== 2) {
    return BigInt(balanceString[0] + '0'.repeat(Number(decimals)))
  }

  if (balanceString[1].length <= decimals) {
    return BigInt(
      balanceString[0] + balanceString[1] + '0'.repeat(Number(decimals) - balanceString[1].length)
    )
  }
  return 0n
}
export const convertBalanceToBigint2 = (amount: string, decimals: bigint | number): bigint => {
  const [integerPart, fractionalPart = ''] = amount.split('.')
  const decimalsNumber = Number(decimals)

  if (fractionalPart.length > decimalsNumber) {
    return 0n
  }
  const paddedFractionalPart = fractionalPart.padEnd(decimalsNumber, '0')

  return BigInt(integerPart + paddedFractionalPart)
}

export enum PositionTokenBlock {
  None,
  A,
  B
}

export const determinePositionTokenBlock = (
  currentSqrtPrice: bigint,
  lowerTick: bigint,
  upperTick: bigint,
  isXtoY: boolean
) => {
  const lowerPrice = calculateSqrtPrice(lowerTick)
  const upperPrice = calculateSqrtPrice(upperTick)

  const isBelowLowerPrice = lowerPrice >= currentSqrtPrice
  const isAboveUpperPrice = upperPrice <= currentSqrtPrice

  if (isBelowLowerPrice) {
    return isXtoY ? PositionTokenBlock.B : PositionTokenBlock.A
  }
  if (isAboveUpperPrice) {
    return isXtoY ? PositionTokenBlock.A : PositionTokenBlock.B
  }

  return PositionTokenBlock.None
}

export const findPairs = (tokenFrom: string, tokenTo: string, pairs: PoolWithPoolKey[]) => {
  return pairs.filter(
    pool =>
      (tokenFrom === pool.poolKey.tokenX && tokenTo === pool.poolKey.tokenY) ||
      (tokenFrom === pool.poolKey.tokenY && tokenTo === pool.poolKey.tokenX)
  )
}

export const findPairsByPoolKeys = (tokenFrom: string, tokenTo: string, poolKeys: PoolKey[]) => {
  return poolKeys.filter(
    poolKey =>
      (tokenFrom === poolKey.tokenX && tokenTo === poolKey.tokenY) ||
      (tokenFrom === poolKey.tokenY && tokenTo === poolKey.tokenX)
  )
}

export type SimulateResult = {
  amountOut: bigint
  fee: bigint
  priceImpact: number
}

export const getPools = async (
  invariant: Invariant,
  poolKeys: PoolKey[]
): Promise<PoolWithPoolKey[]> => {
  const promises = poolKeys.map(poolKey =>
    invariant.getPool(poolKey.tokenX, poolKey.tokenY, poolKey.feeTier)
  )

  const pools = await Promise.all(promises)
  return pools.map((pool, index) => {
    return { ...pool, poolKey: poolKeys[index] }
  })
}

export const calculateConcentrationRange = (
  tickSpacing: bigint,
  concentration: number,
  minimumRange: number,
  currentTick: bigint,
  isXToY: boolean
) => {
  const parsedTickSpacing = Number(tickSpacing)
  const parsedCurrentTick = Number(currentTick)
  const tickDelta = calculateTickDelta(parsedTickSpacing, minimumRange, concentration)
  const lowerTick = parsedCurrentTick - (minimumRange / 2 + tickDelta) * parsedTickSpacing
  const upperTick = parsedCurrentTick + (minimumRange / 2 + tickDelta) * parsedTickSpacing

  return {
    leftRange: BigInt(isXToY ? lowerTick : upperTick),
    rightRange: BigInt(isXToY ? upperTick : lowerTick)
  }
}

export const calcTicksAmountInRange = (
  min: number,
  max: number,
  tickSpacing: number,
  isXtoY: boolean,
  xDecimal: number,
  yDecimal: number
): number => {
  const primaryUnitsMin = getPrimaryUnitsPrice(min, isXtoY, xDecimal, yDecimal)
  const primaryUnitsMax = getPrimaryUnitsPrice(max, isXtoY, xDecimal, yDecimal)
  const minIndex = logBase(primaryUnitsMin, 1.0001)
  const maxIndex = logBase(primaryUnitsMax, 1.0001)

  return Math.ceil(Math.abs(maxIndex - minIndex) / tickSpacing)
}
