import type { Meta, StoryObj } from '@storybook/react'

import Button from './Button'

const meta = {
  title: 'Example/NavbarButton',
  component: Button
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    name: 'Test Button'
  }
}

// More on interaction testing: https://storybook.js.org/docs/writing-tests/interaction-testing
