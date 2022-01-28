import React, { useEffect, useState } from 'react'
import { Popover, Button, Toast } from 'antd-mobile'
import { DemoBlock } from 'demos'
import { UploadOutline, CheckShieldOutline } from 'antd-mobile-icons'

const directionList = [
  `top`,
  `topRight`,
  `rightTop`,
  `right`,
  `rightBottom`,
  `bottomRight`,
  `bottom`,
  `bottomLeft`,
  `leftBottom`,
  `left`,
  `leftTop`,
  `topLeft`,
] as const

type Union<T extends readonly string[]> = T[number]

export default () => {
  const [direction, setDirection] = useState<Union<typeof directionList>>('top')

  useEffect(() => {
    let current = 0

    const timer = window.setInterval(() => {
      if (current >= directionList.length - 1) {
        current = 0
      } else {
        current += 1
      }
      setDirection(directionList[current])
    }, 2000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  return (
    <>
      <DemoBlock title='基本的气泡'>
        <Popover
          content='Hello World'
          trigger='click'
          placement='right'
          defaultVisible
        >
          <Button>touch me</Button>
        </Popover>
      </DemoBlock>

      <DemoBlock title='带菜单的气泡'>
        <Popover.Menu
          actions={[{ text: '菜单1' }, { text: '菜单2', disabled: true }]}
          onAction={node => Toast.show(`选择了 ${node.text}`)}
          placement='bottomLeft'
          trigger='click'
        >
          <Button>touch me</Button>
        </Popover.Menu>
      </DemoBlock>

      <DemoBlock title='带图标的菜单气泡'>
        <Popover.Menu
          actions={[
            { text: '菜单1', icon: <UploadOutline /> },
            { text: '菜单2', icon: <CheckShieldOutline /> },
          ]}
          placement='topRight'
          onAction={node => Toast.show(`选择了 ${node.text}`)}
          trigger='click'
        >
          <Button>touch me</Button>
        </Popover.Menu>
      </DemoBlock>

      <DemoBlock title='深色背景' padding='12px 12px 64px'>
        <Popover
          content='Hello World'
          placement='bottom'
          mode='dark'
          trigger='click'
          visible
        >
          <Button>touch me</Button>
        </Popover>
      </DemoBlock>

      <DemoBlock title='多种位置'>
        <Popover
          key={direction}
          visible
          content={
            <>
              Popover
              <br />
              Content
            </>
          }
          placement={direction}
        >
          <div
            style={{
              margin: '32px auto',
              background: 'var(--adm-color-light)',
              height: 100,
              width: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
            }}
          >
            {direction}
          </div>
        </Popover>
      </DemoBlock>
    </>
  )
}
