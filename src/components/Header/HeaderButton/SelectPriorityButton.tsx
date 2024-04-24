import React, { useState } from 'react'
import useStyles from './style'
import { blurContent, unblurContent } from '@utils/uiUtils'
import { Button } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import Priority from '@components/Modals/Priority'

export interface Props {
  recentPriorityFee: string
  onPrioritySave: () => void
}

export const SelectPriorityButton: React.FC<Props> = ({ recentPriorityFee, onPrioritySave }) => {
  const { classes } = useStyles()

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [priorityModal, setPriorityModal] = useState(false)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    blurContent()
    setPriorityModal(true)
  }

  const handleClose = () => {
    unblurContent()
    setPriorityModal(false)
  }

  return (
    <>
      <Button
        className={classes.headerButton}
        variant='contained'
        endIcon={<KeyboardArrowDownIcon id='downIcon' />}
        onClick={handleClick}>
        Fee
      </Button>
      <Priority
        open={priorityModal}
        anchorEl={anchorEl}
        recentPriorityFee={recentPriorityFee}
        handleClose={handleClose}
        onPrioritySave={onPrioritySave}
      />
    </>
  )
}

export default SelectPriorityButton
