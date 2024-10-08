import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PayloadType } from '@store/consts/types'

export enum Status {
  Uninitialized = 'uninitialized',
  Init = 'init',
  Error = 'error',
  Initialized = 'initalized'
}

export interface ITokenBalance {
  address: string
  balance: bigint
}

export interface IAlephZeroWallet {
  status: Status
  address: string
  balance: bigint
  tokensBalances: { [key in string]: ITokenBalance }
  balanceLoading: boolean
}

export const defaultState: IAlephZeroWallet = {
  status: Status.Uninitialized,
  address: '',
  balance: 0n,
  tokensBalances: {},
  balanceLoading: false
}
export const walletSliceName = 'wallet'
const walletSlice = createSlice({
  name: walletSliceName,
  initialState: defaultState,
  reducers: {
    resetState() {
      return defaultState
    },
    setAddress(state, action: PayloadAction<string>) {
      state.address = action.payload
      return state
    },
    setStatus(state, action: PayloadAction<Status>) {
      state.status = action.payload
      return state
    },
    setBalance(state, action: PayloadAction<bigint>) {
      state.balance = action.payload
      return state
    },
    getBalance(state) {
      return state
    },
    getBalances(state, _action: PayloadAction<string[]>) {
      return state
    },
    setIsBalanceLoading(state, action: PayloadAction<boolean>) {
      action.payload ? (state.balanceLoading = true) : (state.balanceLoading = false)
      return state
    },
    addTokenBalance(state, action: PayloadAction<ITokenBalance>) {
      state.tokensBalances[action.payload.address] = action.payload
      return state
    },
    addTokenBalances(state, action: PayloadAction<ITokenBalance[]>) {
      action.payload.forEach(account => {
        state.tokensBalances[account.address] = account
      })
      return state
    },
    setTokenBalance(state, action: PayloadAction<ITokenBalance>) {
      state.tokensBalances[action.payload.address.toString()] = action.payload
      return state
    },
    airdrop() {},
    connect(state, _action: PayloadAction<boolean>) {
      return state
    },
    disconnect() {},
    reconnect() {}
  }
})

export const actions = walletSlice.actions
export const reducer = walletSlice.reducer
export type PayloadTypes = PayloadType<typeof actions>
