import { SinglePositionWrapper } from '@containers/SinglePositionWrapper/SinglePositionWrapper'
import { Grid } from '@mui/material'
import React from 'react'
import { useParams } from 'react-router-dom'
import useStyles from './styles'

const SinglePositionPage: React.FC = () => {
  const { address, id } = useParams()
  const { classes } = useStyles()

  return (
    <Grid container className={classes.container} justifyContent='center'>
      <Grid item>
        <SinglePositionWrapper address={address ?? ''} id={id ? BigInt(id) : -1n} />
      </Grid>
    </Grid>
  )
}

export default SinglePositionPage
