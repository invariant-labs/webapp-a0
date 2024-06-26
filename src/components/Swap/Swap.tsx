import AnimatedButton, { ProgressState } from '@components/AnimatedButton/AnimatedButton'
import ChangeWalletButton from '@components/Header/HeaderButton/ChangeWalletButton'
import ExchangeAmountInput from '@components/Inputs/ExchangeAmountInput/ExchangeAmountInput'
import Slippage from '@components/Modals/Slippage/Slippage'
import Refresher from '@components/Refresher/Refresher'
import { PoolKey, Price } from '@invariant-labs/a0-sdk'
import { PERCENTAGE_DENOMINATOR } from '@invariant-labs/a0-sdk/target/consts'
import { Box, Button, CardMedia, Grid, Typography } from '@mui/material'
import infoIcon from '@static/svg/info.svg'
import refreshIcon from '@static/svg/refresh.svg'
import settingIcon from '@static/svg/settings.svg'
import SwapArrows from '@static/svg/swap-arrows.svg'
import { DEFAULT_TOKEN_DECIMAL, REFRESHER_INTERVAL } from '@store/consts/static'
import {
  convertBalanceToBigint,
  printBigint,
  stringToFixed,
  trimLeadingZeros
} from '@store/consts/utils'
import { PoolWithPoolKey } from '@store/reducers/pools'
import { Swap as SwapData } from '@store/reducers/swap'
import { Status } from '@store/reducers/wallet'
import { SwapError } from '@store/sagas/swap'
import { SwapToken } from '@store/selectors/wallet'
import { blurContent, unblurContent } from '@utils/uiUtils'
import classNames from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import { Simulate } from '@store/reducers/swap'
import ExchangeRate from './ExchangeRate/ExchangeRate'
import TransactionDetailsBox from './TransactionDetailsBox/TransactionDetailsBox'
import useStyles from './style'
import { SimulateResult, TokenPriceData } from '@store/consts/types'

export interface Pools {
  tokenX: string
  tokenY: string
  tokenXReserve: string
  tokenYReserve: string
  tickSpacing: number
  sqrtPrice: {
    v: bigint
    scale: number
  }
  fee: {
    val: bigint
    scale: number
  }
  exchangeRate: {
    val: bigint
    scale: number
  }
}

export interface ISwap {
  isFetchingNewPool: boolean
  onRefresh: (tokenFrom: number | null, tokenTo: number | null) => void
  walletStatus: Status
  swapData: SwapData
  tokens: SwapToken[]
  pools: PoolWithPoolKey[]
  tickmap: { [x: string]: string }
  onSwap: (
    poolKey: PoolKey,
    slippage: bigint,
    knownPrice: Price,
    tokenFrom: string,
    tokenTo: string,
    amountIn: bigint,
    amountOut: bigint,
    byAmountIn: boolean
  ) => void
  onSetPair: (tokenFrom: string | null, tokenTo: string | null) => void
  progress: ProgressState
  isWaitingForNewPool: boolean
  onConnectWallet: () => void
  onDisconnectWallet: () => void
  initialTokenFromIndex: number | null
  initialTokenToIndex: number | null
  handleAddToken: (address: string) => void
  commonTokens: string[]
  initialHideUnknownTokensValue: boolean
  onHideUnknownTokensChange: (val: boolean) => void
  tokenFromPriceData?: TokenPriceData
  tokenToPriceData?: TokenPriceData
  priceFromLoading?: boolean
  priceToLoading?: boolean
  onSlippageChange: (slippage: string) => void
  initialSlippage: string
  isBalanceLoading: boolean
  simulateResult: SimulateResult
  simulateSwap: (simulate: Simulate) => void
}

export const Swap: React.FC<ISwap> = ({
  isFetchingNewPool,
  onRefresh,
  walletStatus,
  tokens,
  pools,
  tickmap,
  onSwap,
  onSetPair,
  progress,
  isWaitingForNewPool,
  onConnectWallet,
  onDisconnectWallet,
  initialTokenFromIndex,
  initialTokenToIndex,
  handleAddToken,
  commonTokens,
  initialHideUnknownTokensValue,
  onHideUnknownTokensChange,
  tokenFromPriceData,
  tokenToPriceData,
  priceFromLoading,
  priceToLoading,
  onSlippageChange,
  initialSlippage,
  isBalanceLoading,
  swapData,
  simulateResult,
  simulateSwap
}) => {
  const { classes } = useStyles()
  enum inputTarget {
    FROM = 'from',
    TO = 'to'
  }
  const [tokenFromIndex, setTokenFromIndex] = React.useState<number | null>(null)
  const [tokenToIndex, setTokenToIndex] = React.useState<number | null>(null)
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const [lockAnimation, setLockAnimation] = React.useState<boolean>(false)
  const [amountFrom, setAmountFrom] = React.useState<string>('')
  const [amountTo, setAmountTo] = React.useState<string>('')
  const [swap, setSwap] = React.useState<boolean | null>(null)
  const [rotates, setRotates] = React.useState<number>(0)
  const [slippTolerance, setSlippTolerance] = React.useState<string>(initialSlippage)
  const [throttle, setThrottle] = React.useState<boolean>(false)
  const [settings, setSettings] = React.useState<boolean>(false)
  const [detailsOpen, setDetailsOpen] = React.useState<boolean>(false)
  const [inputRef, setInputRef] = React.useState<string>(inputTarget.FROM)
  const [rateReversed, setRateReversed] = React.useState<boolean>(false)
  const [refresherTime, setRefresherTime] = React.useState<number>(REFRESHER_INTERVAL)

  const timeoutRef = useRef<number>(0)

  useEffect(() => {
    if (!!tokens.length && tokenFromIndex === null && tokenToIndex === null) {
      const firstCommonIndex = commonTokens.length
        ? tokens.findIndex(token => token.assetAddress === commonTokens[0])
        : -1

      setTokenFromIndex(
        initialTokenFromIndex !== null
          ? initialTokenFromIndex
          : firstCommonIndex !== -1
            ? firstCommonIndex
            : 0
      )
      setTokenToIndex(initialTokenToIndex)
    }
  }, [tokens])

  useEffect(() => {
    onSetPair(
      tokenFromIndex === null ? null : tokens[tokenFromIndex].assetAddress,
      tokenToIndex === null ? null : tokens[tokenToIndex].assetAddress
    )
  }, [tokenFromIndex, tokenToIndex, pools.length])

  useEffect(() => {
    if (inputRef === inputTarget.FROM && !(amountFrom === '' && amountTo === '')) {
      simulateWithTimeout()
    }
  }, [amountFrom, tokenToIndex, tokenFromIndex, slippTolerance, Object.keys(tickmap).length])

  useEffect(() => {
    if (inputRef === inputTarget.TO && !(amountFrom === '' && amountTo === '')) {
      simulateWithTimeout()
    }
  }, [amountTo, tokenToIndex, tokenFromIndex, slippTolerance, Object.keys(tickmap).length])

  useEffect(() => {
    if (progress === 'none' && !(amountFrom === '' && amountTo === '')) {
      simulateWithTimeout()
    }
  }, [progress])

  const simulateWithTimeout = () => {
    setThrottle(true)

    clearTimeout(timeoutRef.current)
    const timeout = setTimeout(() => {
      setSimulateAmount().finally(() => {
        setThrottle(false)
      })
    }, 500)
    timeoutRef.current = timeout as unknown as number
  }

  useEffect(() => {
    if (tokenFromIndex !== null && tokenToIndex !== null) {
      if (inputRef === inputTarget.FROM) {
        const amount = getAmountOut(tokens[tokenToIndex])
        setAmountTo(+amount === 0 ? '' : trimLeadingZeros(amount))
      } else {
        const amount = getAmountOut(tokens[tokenFromIndex])
        setAmountFrom(+amount === 0 ? '' : trimLeadingZeros(amount))
      }
    }
  }, [simulateResult])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (refresherTime > 0 && tokenFromIndex !== null && tokenToIndex !== null) {
        setRefresherTime(refresherTime - 1)
      } else {
        handleRefresh()
      }
    }, 1000)

    return () => clearTimeout(timeout)
  }, [refresherTime, tokenFromIndex, tokenToIndex])

  useEffect(() => {
    updateEstimatedAmount()
  }, [tokenToIndex, tokenFromIndex, pools.length])

  useEffect(() => {
    const temp: string = amountFrom
    setAmountFrom(amountTo)
    setAmountTo(temp)
    setInputRef(inputRef === inputTarget.FROM ? inputTarget.TO : inputTarget.FROM)
  }, [swap])

  useEffect(() => {
    setRateReversed(false)
  }, [tokenFromIndex, tokenToIndex])

  const getAmountOut = (assetFor: SwapToken) => {
    const amountOut = printBigint(simulateResult.amountOut, assetFor.decimals)

    return stringToFixed(amountOut, Number(assetFor.decimals))
  }

  const setSimulateAmount = async () => {
    if (
      tokenFromIndex !== null &&
      tokenToIndex !== null &&
      tokenFromIndex !== tokenToIndex &&
      swapData
    ) {
      if (inputRef === inputTarget.FROM) {
        simulateSwap({
          fromToken: tokens[tokenFromIndex].assetAddress,
          toToken: tokens[tokenToIndex].assetAddress,
          amount: convertBalanceToBigint(amountFrom, Number(tokens[tokenFromIndex].decimals)),
          byAmountIn: true
        })
      } else {
        simulateSwap({
          fromToken: tokens[tokenFromIndex].assetAddress,
          toToken: tokens[tokenToIndex].assetAddress,
          amount: convertBalanceToBigint(amountTo, Number(tokens[tokenToIndex].decimals)),
          byAmountIn: false
        })
      }
    }
  }

  const getIsXToY = (fromToken: string, toToken: string) => {
    const swapPool = pools.find(
      pool =>
        (fromToken === pool.poolKey.tokenX && toToken === pool.poolKey.tokenY) ||
        (fromToken === pool.poolKey.tokenY && toToken === pool.poolKey.tokenX)
    )
    return !!swapPool
  }

  const updateEstimatedAmount = () => {
    if (tokenFromIndex !== null && tokenToIndex !== null) {
      const amount = getAmountOut(tokens[tokenToIndex])
      setAmountTo(+amount === 0 ? '' : trimLeadingZeros(amount))
    }
  }

  const isError = (error: SwapError): boolean => {
    if (simulateResult.errors) {
      return simulateResult.errors.some(err => err === error)
    }
    return false
  }

  const getStateMessage = () => {
    if ((tokenFromIndex !== null && tokenToIndex !== null && throttle) || isWaitingForNewPool) {
      return 'Loading'
    }

    if (walletStatus !== Status.Initialized) {
      return 'Connect a wallet'
    }

    if (tokenFromIndex === null || tokenToIndex === null) {
      return 'Select a token'
    }

    if (tokenFromIndex === tokenToIndex) {
      return 'Select different tokens'
    }

    if (!getIsXToY(tokens[tokenFromIndex].assetAddress, tokens[tokenToIndex].assetAddress)) {
      return 'No route found'
    }

    if (
      simulateResult.poolKey === null &&
      (isError(SwapError.InsufficientLiquidity) || isError(SwapError.MaxTicksCrossed))
    ) {
      return 'Insufficient liquidity'
    }

    if (
      convertBalanceToBigint(amountFrom, Number(tokens[tokenFromIndex].decimals)) >
      tokens[tokenFromIndex].balance
    ) {
      return 'Insufficient balance'
    }

    if (
      convertBalanceToBigint(amountFrom, Number(tokens[tokenFromIndex].decimals)) === 0n ||
      (simulateResult.poolKey === null && isError(SwapError.AmountIsZero))
    ) {
      return 'Insufficient volume'
    }

    return 'Swap tokens'
  }
  const hasShowRateMessage = () => {
    return (
      getStateMessage() === 'Insufficient balance' ||
      getStateMessage() === 'Swap tokens' ||
      getStateMessage() === 'Loading' ||
      getStateMessage() === 'Connect a wallet' ||
      getStateMessage() === 'Insufficient liquidity'
    )
  }
  const setSlippage = (slippage: string): void => {
    setSlippTolerance(slippage)
    onSlippageChange(slippage)
  }

  const handleClickSettings = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    blurContent()
    setSettings(true)
  }

  const handleCloseSettings = () => {
    unblurContent()
    setSettings(false)
  }

  const handleOpenTransactionDetails = () => {
    setDetailsOpen(!detailsOpen)
  }

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (lockAnimation) {
      timeoutId = setTimeout(() => setLockAnimation(false), 500)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [lockAnimation])

  const swapRate =
    tokenFromIndex === null || tokenToIndex === null || amountFrom === '' || amountTo === ''
      ? 0
      : +amountTo / +amountFrom

  const canShowDetails =
    tokenFromIndex !== null &&
    tokenToIndex !== null &&
    hasShowRateMessage() &&
    (getStateMessage() === 'Loading' ||
      (swapRate !== 0 && swapRate !== Infinity && !isNaN(swapRate))) &&
    amountFrom !== '' &&
    amountTo !== ''

  const [prevOpenState, setPrevOpenState] = useState(detailsOpen && canShowDetails)

  useEffect(() => {
    if (getStateMessage() !== 'Loading') {
      setPrevOpenState(detailsOpen && canShowDetails)
    }
  }, [detailsOpen, canShowDetails])

  const handleRefresh = async () => {
    onRefresh(tokenFromIndex, tokenToIndex)
    setRefresherTime(REFRESHER_INTERVAL)
  }

  useEffect(() => {
    void setSimulateAmount()
  }, [isFetchingNewPool])

  useEffect(() => {
    setRefresherTime(REFRESHER_INTERVAL)
  }, [tokenFromIndex, tokenToIndex])

  return (
    <Grid container className={classes.swapWrapper} alignItems='center'>
      <Grid container className={classes.header}>
        <Typography component='h1'>Swap tokens</Typography>
        <Box className={classes.swapControls}>
          <Button
            onClick={handleRefresh}
            className={classes.refreshIconBtn}
            disabled={
              priceFromLoading ||
              priceToLoading ||
              isBalanceLoading ||
              getStateMessage() === 'Loading' ||
              tokenFromIndex === null ||
              tokenToIndex === null
            }>
            <img src={refreshIcon} className={classes.refreshIcon} />
          </Button>
          <Button onClick={handleClickSettings} className={classes.settingsIconBtn}>
            <img src={settingIcon} className={classes.settingsIcon} />
          </Button>
        </Box>
        <Grid className={classes.slippage}>
          <Slippage
            open={settings}
            setSlippage={setSlippage}
            handleClose={handleCloseSettings}
            anchorEl={anchorEl}
            defaultSlippage={'1'}
            initialSlippage={initialSlippage}
          />
        </Grid>
      </Grid>
      <Grid container className={classes.root} direction='column'>
        <Box
          className={classNames(
            classes.exchangeRoot,
            lockAnimation ? classes.amountInputDown : undefined
          )}>
          <ExchangeAmountInput
            value={amountFrom}
            balance={
              tokenFromIndex !== null
                ? printBigint(tokens[tokenFromIndex].balance || 0n, tokens[tokenFromIndex].decimals)
                : '- -'
            }
            decimal={
              tokenFromIndex !== null ? tokens[tokenFromIndex].decimals : DEFAULT_TOKEN_DECIMAL
            }
            className={classes.amountInput}
            setValue={value => {
              if (value.match(/^\d*\.?\d*$/)) {
                setAmountFrom(value)
                setInputRef(inputTarget.FROM)
              }
            }}
            placeholder={`0.${'0'.repeat(6)}`}
            onMaxClick={() => {
              if (tokenFromIndex !== null) {
                setInputRef(inputTarget.FROM)
                setAmountFrom(
                  printBigint(tokens[tokenFromIndex].balance, tokens[tokenFromIndex].decimals)
                )
              }
            }}
            tokens={tokens}
            current={tokenFromIndex !== null ? tokens[tokenFromIndex] : null}
            onSelect={setTokenFromIndex}
            disabled={
              tokenFromIndex === null || tokenToIndex === null || tokenFromIndex === tokenToIndex
            }
            hideBalances={walletStatus !== Status.Initialized}
            handleAddToken={handleAddToken}
            commonTokens={commonTokens}
            limit={1e14}
            initialHideUnknownTokensValue={initialHideUnknownTokensValue}
            onHideUnknownTokensChange={onHideUnknownTokensChange}
            tokenPrice={tokenFromPriceData?.price}
            priceLoading={priceFromLoading}
            isBalanceLoading={isBalanceLoading}
            showMaxButton={true}
          />
        </Box>
        <Box className={classes.tokenComponentTextContainer}>
          <Box
            className={classes.swapArrowBox}
            onClick={() => {
              if (lockAnimation) return
              setLockAnimation(!lockAnimation)
              setRotates(rotates + 1)
              swap !== null ? setSwap(!swap) : setSwap(true)
              setTimeout(() => {
                const tmpAmount = amountTo

                const tmp = tokenFromIndex
                setTokenFromIndex(tokenToIndex)
                setTokenToIndex(tmp)

                setInputRef(inputTarget.FROM)
                setAmountFrom(tmpAmount)
              }, 50)
            }}>
            <Box className={classes.swapImgRoot}>
              <img
                src={SwapArrows}
                style={{
                  transform: `rotate(${-rotates * 180}deg)`
                }}
                className={classes.swapArrows}
              />
            </Box>
          </Box>
        </Box>
        <Box
          className={classNames(
            classes.exchangeRoot,
            classes.transactionBottom,
            lockAnimation ? classes.amountInputUp : undefined
          )}>
          <ExchangeAmountInput
            value={amountTo}
            balance={
              tokenToIndex !== null
                ? printBigint(tokens[tokenToIndex].balance || 0n, tokens[tokenToIndex].decimals)
                : '- -'
            }
            className={classes.amountInput}
            decimal={tokenToIndex !== null ? tokens[tokenToIndex].decimals : DEFAULT_TOKEN_DECIMAL}
            setValue={value => {
              if (value.match(/^\d*\.?\d*$/)) {
                setAmountTo(value)
                setInputRef(inputTarget.TO)
              }
            }}
            placeholder={`0.${'0'.repeat(6)}`}
            onMaxClick={() => {
              if (tokenFromIndex !== null) {
                setInputRef(inputTarget.FROM)
                setAmountFrom(
                  printBigint(tokens[tokenFromIndex].balance, tokens[tokenFromIndex].decimals)
                )
              }
            }}
            tokens={tokens}
            current={tokenToIndex !== null ? tokens[tokenToIndex] : null}
            onSelect={setTokenToIndex}
            disabled={
              tokenFromIndex === null || tokenToIndex === null || tokenFromIndex === tokenToIndex
            }
            hideBalances={walletStatus !== Status.Initialized}
            handleAddToken={handleAddToken}
            commonTokens={commonTokens}
            limit={1e14}
            initialHideUnknownTokensValue={initialHideUnknownTokensValue}
            onHideUnknownTokensChange={onHideUnknownTokensChange}
            tokenPrice={tokenToPriceData?.price}
            priceLoading={priceToLoading}
            isBalanceLoading={isBalanceLoading}
            showMaxButton={false}
          />
        </Box>
        <Box className={classes.transactionDetails}>
          <Grid className={classes.exchangeRateContainer}>
            <button
              onClick={
                tokenFromIndex !== null &&
                tokenToIndex !== null &&
                hasShowRateMessage() &&
                amountFrom !== '' &&
                amountTo !== ''
                  ? handleOpenTransactionDetails
                  : undefined
              }
              className={
                tokenFromIndex !== null &&
                tokenToIndex !== null &&
                hasShowRateMessage() &&
                amountFrom !== '' &&
                amountTo !== ''
                  ? classes.HiddenTransactionButton
                  : classes.transactionDetailDisabled
              }>
              <Grid className={classes.transactionDetailsWrapper}>
                <Typography className={classes.transactionDetailsHeader}>
                  See transaction details
                </Typography>
                <CardMedia image={infoIcon} className={classes.infoIcon} />
              </Grid>
            </button>
            {tokenFromIndex !== null && tokenToIndex !== null && (
              <Refresher
                currentIndex={refresherTime}
                maxIndex={REFRESHER_INTERVAL}
                onClick={handleRefresh}
              />
            )}
          </Grid>
          {canShowDetails ? (
            <ExchangeRate
              onClick={() => setRateReversed(!rateReversed)}
              tokenFromSymbol={tokens[rateReversed ? tokenToIndex : tokenFromIndex].symbol}
              tokenToSymbol={tokens[rateReversed ? tokenFromIndex : tokenToIndex].symbol}
              amount={rateReversed ? 1 / swapRate : swapRate}
              tokenToDecimals={Number(
                tokens[rateReversed ? tokenFromIndex : tokenToIndex].decimals
              )}
              loading={getStateMessage() === 'Loading'}
            />
          ) : null}
        </Box>
        <TransactionDetailsBox
          open={getStateMessage() !== 'Loading' ? detailsOpen && canShowDetails : prevOpenState}
          fee={simulateResult.poolKey?.feeTier.fee ?? 0n}
          exchangeRate={{
            val: rateReversed ? 1 / swapRate : swapRate,
            symbol: canShowDetails
              ? tokens[rateReversed ? tokenFromIndex : tokenToIndex].symbol
              : '',
            decimal: canShowDetails
              ? Number(tokens[rateReversed ? tokenFromIndex : tokenToIndex].decimals)
              : 0
          }}
          priceImpact={simulateResult.priceImpact}
          slippage={+slippTolerance}
          isLoadingRate={getStateMessage() === 'Loading'}
        />
        {walletStatus !== Status.Initialized && getStateMessage() !== 'Loading' ? (
          <ChangeWalletButton
            name='Connect wallet'
            onConnect={onConnectWallet}
            connected={false}
            onDisconnect={onDisconnectWallet}
            className={classes.connectWalletButton}
          />
        ) : (
          <AnimatedButton
            content={getStateMessage()}
            className={
              getStateMessage() === 'Connect a wallet'
                ? `${classes.swapButton} ${classes.buttonSelectDisabled}`
                : getStateMessage() === 'Swap tokens' && progress === 'none'
                  ? `${classes.swapButton} ${classes.ButtonSwapActive}`
                  : classes.swapButton
            }
            disabled={getStateMessage() !== 'Swap tokens' || progress !== 'none'}
            onClick={() => {
              if (
                simulateResult.poolKey === null ||
                tokenFromIndex === null ||
                tokenToIndex === null
              )
                return

              onSwap(
                simulateResult.poolKey,
                BigInt((+slippTolerance * Number(PERCENTAGE_DENOMINATOR)) / 100),
                simulateResult.targetSqrtPrice,
                tokens[tokenFromIndex].assetAddress,
                tokens[tokenToIndex].assetAddress,
                convertBalanceToBigint(amountFrom, tokens[tokenFromIndex].decimals),
                convertBalanceToBigint(amountTo, tokens[tokenToIndex].decimals),
                inputRef === inputTarget.FROM
              )
            }}
            progress={progress}
          />
        )}
      </Grid>
    </Grid>
  )
}

export default Swap
