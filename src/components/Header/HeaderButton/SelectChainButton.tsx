import React from 'react'
import useStyles from './style'
import { blurContent, unblurContent } from '@utils/uiUtils'
import { Button } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import SelectChain from '@components/Modals/SelectChain/SelectChain'
import { ISelectChain } from '@store/consts/types'

export interface IProps {
  activeChain: ISelectChain
  chains: ISelectChain[]
  onSelect: (chain: ISelectChain) => void
  disabled?: boolean
}
export const SelectChainButton: React.FC<IProps> = ({
  activeChain,
  chains,
  onSelect,
  disabled = false
}) => {
  const { classes } = useStyles()
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const [openNetworks, setOpenNetworks] = React.useState<boolean>(false)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    blurContent()
    setOpenNetworks(true)
  }

  const handleClose = () => {
    unblurContent()
    setOpenNetworks(false)
  }

  return (
    <>
      <Button
        className={classes.headerButton}
        variant='contained'
        classes={{ disabled: classes.disabled }}
        disabled={disabled}
        endIcon={<KeyboardArrowDownIcon id='downIcon' />}
        onClick={handleClick}>
        {activeChain.name}
      </Button>
      <SelectChain
        chains={chains}
        open={openNetworks}
        anchorEl={anchorEl}
        onSelect={chain => {
          onSelect(chain)
          handleClose()
        }}
        handleClose={handleClose}
        activeChain={activeChain}
      />
    </>
  )
}
export default SelectChainButton
