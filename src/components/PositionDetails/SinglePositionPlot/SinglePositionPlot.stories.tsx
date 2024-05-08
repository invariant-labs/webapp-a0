import { fn } from '@storybook/test'
import SinglePositionPlot from './SinglePositionPlot'
import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'

const meta = {
  title: 'Components/SinglePositionPlot',
  component: SinglePositionPlot,
  decorators: [
    Story => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    )
  ]
} satisfies Meta<typeof SinglePositionPlot>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    currentPrice: 10000 as any,
    data: [],
    initialIsDiscreteValue: false,
    leftRange: {
      index: 2 as any,
      x: 10000 as any
    },
    rightRange: {
      index: 2 as any,
      x: 10000 as any
    },
    max: 100,
    min: 0,
    midPrice: {} as any,
    onDiscreteChange: fn(),
    reloadHandler: fn(),
    ticksLoading: false,
    tickSpacing: 0,
    tokenX: {
      name: 'BTC',
      decimal: 9 as any
    },
    tokenY: {
      name: 'ETH',
      decimal: 12 as any
    },
    xToY: true,
    hasTicksError: false
  },
  render: args => {
    return (
      <SinglePositionPlot
        {...args}
        currentPrice={10000n}
        leftRange={{
          index: 2n,
          x: 10000n
        }}
        rightRange={{
          index: 2n,
          x: 10000n
        }}
        midPrice={{
          index: 2n,
          x: 1020n
        }}
        tokenX={{
          name: 'BTC',
          decimal: 9n
        }}
        tokenY={{
          name: 'ETH',
          decimal: 12n
        }}
      />
    )
  }
}
