import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import searchIcon from '@static/svg/lupa.svg'
import { theme } from '@static/theme'
import React, { forwardRef, useMemo, useRef, useState } from 'react'
import { FixedSizeList as List } from 'react-window'
import CustomScrollbar from '../CustomScrollbar'
import useStyles from '../style'

import AddTokenModal from '@components/Modals/AddTokenModal/AddTokenModal'
import {
  Box,
  Button,
  CardMedia,
  Checkbox,
  FormControlLabel,
  Grid,
  Popover,
  Typography,
  useMediaQuery
} from '@mui/material'
import { formatNumber, printBigint } from '@store/consts/utils'
import { SwapToken } from '@store/selectors/wallet'
import Scrollbars from 'rc-scrollbars'

export interface ISelectTokenModal {
  tokens: SwapToken[]
  commonTokens: string[]
  open: boolean
  handleClose: () => void
  anchorEl: HTMLButtonElement | null
  centered?: boolean
  onSelect: (index: number) => void
  hideBalances?: boolean
  handleAddToken: (address: string) => void
  initialHideUnknownTokensValue: boolean
  onHideUnknownTokensChange: (val: boolean) => void
}

interface IScroll {
  onScroll: (e: React.UIEvent<HTMLElement>) => void
  children: React.ReactNode
}

const Scroll = forwardRef<React.LegacyRef<Scrollbars>, IScroll>(({ onScroll, children }, ref) => {
  return (
    <CustomScrollbar ref={ref} style={{ overflow: 'hidden' }} onScroll={onScroll}>
      {children}
    </CustomScrollbar>
  )
})

const CustomScrollbarsVirtualList = React.forwardRef<React.LegacyRef<Scrollbars>, IScroll>(
  (props, ref) => <Scroll {...props} ref={ref} />
)

export const SelectTokenModal: React.FC<ISelectTokenModal> = ({
  tokens,
  commonTokens,
  open,
  handleClose,
  anchorEl,
  centered = false,
  onSelect,
  hideBalances = false,
  handleAddToken,
  initialHideUnknownTokensValue,
  onHideUnknownTokensChange
}) => {
  const { classes } = useStyles()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))

  const [value, setValue] = useState<string>('')

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [hideUnknown, setHideUnknown] = useState(initialHideUnknownTokensValue)

  const outerRef = useRef<HTMLElement>(null)

  const tokensWithIndexes = useMemo(
    () =>
      tokens.map((token, index) => ({
        ...token,
        index,
        strAddress: token.assetAddress.toString()
      })),
    [tokens]
  )

  const commonTokensList = useMemo(
    () =>
      tokensWithIndexes.filter(
        ({ assetAddress }) => commonTokens.findIndex(key => key === assetAddress) !== -1
      ),
    [tokensWithIndexes, commonTokens]
  )

  const filteredTokens = useMemo(() => {
    const list = tokensWithIndexes.filter(token => {
      return (
        token.symbol.toLowerCase().includes(value.toLowerCase()) ||
        token.name.toLowerCase().includes(value.toLowerCase()) ||
        token.strAddress.includes(value)
      )
    })
    const sorted = list.sort((a, b) => {
      const aBalance = +printBigint(a.balance, a.decimals)
      const bBalance = +printBigint(b.balance, b.decimals)
      if ((aBalance === 0 && bBalance === 0) || (aBalance > 0 && bBalance > 0)) {
        if (value.length) {
          if (
            a.symbol.toLowerCase().startsWith(value.toLowerCase()) &&
            !b.symbol.toLowerCase().startsWith(value.toLowerCase())
          ) {
            return -1
          }
          if (
            b.symbol.toLowerCase().startsWith(value.toLowerCase()) &&
            !a.symbol.toLowerCase().startsWith(value.toLowerCase())
          ) {
            return 1
          }
        }
        return a.symbol.toLowerCase().localeCompare(b.symbol.toLowerCase())
      }
      return aBalance === 0 ? 1 : -1
    })

    return hideUnknown ? sorted.filter(token => !token.isUnknown) : sorted
  }, [value, tokensWithIndexes, hideUnknown])

  const searchToken = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }

  return (
    <>
      <Popover
        classes={{ paper: classes.paper }}
        open={open && !isAddOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorReference={centered ? 'none' : 'anchorEl'}
        className={classes.popover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}>
        <Grid container className={classes.container}>
          <Grid className={classes.selectTokenHeader}>
            <Typography component='h1'>Select a token</Typography>
            <Button className={classes.selectTokenClose} onClick={handleClose}></Button>
          </Grid>
          <Grid
            className={classes.topRow}
            container
            direction='row'
            wrap='nowrap'
            alignItems='center'>
            <Grid container className={classes.inputControl}>
              <input
                className={classes.selectTokenInput}
                placeholder='Search token name or address'
                onChange={searchToken}
                value={value}
              />
              <CardMedia image={searchIcon} className={classes.inputIcon} />
            </Grid>
            <AddCircleOutlineIcon className={classes.addIcon} onClick={() => setIsAddOpen(true)} />
          </Grid>
          <Grid container>
            <Grid className={classes.commonTokensList}>
              {commonTokensList.map(token => (
                <Box
                  className={classes.commonTokenItem}
                  key={token.symbol}
                  onClick={() => {
                    onSelect(token.index)
                    setValue('')
                    handleClose()
                  }}>
                  <img className={classes.commonTokenIcon} src={token.logoURI} />
                  <Typography component='p'>{token.symbol}</Typography>
                </Box>
              ))}
            </Grid>
          </Grid>
          <Grid container>
            <FormControlLabel
              control={
                <Checkbox
                  checked={hideUnknown}
                  onChange={e => {
                    setHideUnknown(e.target.checked)
                    onHideUnknownTokensChange(e.target.checked)
                  }}
                  name='hideUnknown'
                />
              }
              label='Hide unknown tokens'
            />
          </Grid>
          <Box className={classes.tokenList}>
            <List
              height={352}
              width={360}
              itemSize={66}
              itemCount={filteredTokens.length}
              outerElementType={CustomScrollbarsVirtualList}
              outerRef={outerRef}>
              {({ index, style }: { index: number; style: React.CSSProperties }) => {
                const token = filteredTokens[index]
                const tokenBalance = printBigint(token.balance, token.decimals)

                return (
                  <Grid
                    className={classes.tokenItem}
                    container
                    style={{
                      ...style,
                      width: '90%',
                      height: 40
                    }}
                    alignItems='center'
                    wrap='nowrap'
                    onClick={() => {
                      onSelect(token.index)
                      setValue('')
                      handleClose()
                    }}>
                    <img className={classes.tokenIcon} src={token.logoURI} loading='lazy' />{' '}
                    <Grid container className={classes.tokenContainer}>
                      <Typography className={classes.tokenName}>{token.symbol}</Typography>
                      <Typography className={classes.tokenDescrpiption}>
                        {token.name ? token.name.slice(0, isXs ? 20 : 30) : 'Unknown token'}
                        {token.name.length > (isXs ? 20 : 30) ? '...' : ''}
                      </Typography>
                    </Grid>
                    {!hideBalances && Number(tokenBalance) > 0 ? (
                      <Typography className={classes.tokenBalanceStatus}>
                        Balance: {formatNumber(tokenBalance)}
                      </Typography>
                    ) : null}
                  </Grid>
                )
              }}
            </List>
          </Box>
        </Grid>
      </Popover>
      <AddTokenModal
        open={isAddOpen}
        handleClose={() => setIsAddOpen(false)}
        addToken={(address: string) => {
          handleAddToken(address)
          setIsAddOpen(false)
        }}
      />
    </>
  )
}
export default SelectTokenModal
