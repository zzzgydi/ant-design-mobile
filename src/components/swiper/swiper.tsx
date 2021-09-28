import React, {
  forwardRef,
  ReactElement,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { NativeProps, withNativeProps } from '../../utils/native-props'
import { mergeProps } from '../../utils/with-default-props'
import classNames from 'classnames'
import { SwiperItem } from './swiper-item'
import { devWarning } from '../../utils/dev-log'
import { useSpring, animated } from '@react-spring/web'
import { useDrag } from 'react-use-gesture'
import PageIndicator, { PageIndicatorProps } from '../page-indicator'
import { staged } from 'staged-components'
import { useRefState } from '../../utils/use-ref-state'
import { bound } from '../../utils/bound'

export type SwiperRef = {
  swipeTo: (index: number) => void
  swipeNext: () => void
  swipePrev: () => void
}

export type SwiperProps = {
  defaultIndex?: number
  allowTouchMove?: boolean
  autoplay?: boolean
  autoplayInterval?: number
  loop?: boolean
  centered?: boolean
  onIndexChange?: (index: number) => void
  indicatorProps?: Pick<PageIndicatorProps, 'color' | 'style' | 'className'>
  indicator?: (total: number, current: number) => ReactNode
  children?: ReactElement | ReactElement[]
} & NativeProps<
  | '--height'
  | '--width'
  | '--slide-width'
  | '--border-radius'
  | '--track-padding'
>

const defaultProps = {
  defaultIndex: 0,
  allowTouchMove: true,
  autoplay: false,
  autoplayInterval: 3000,
  loop: true,
  centered: false,
}

export const Swiper = forwardRef(
  staged<SwiperProps, SwiperRef>((p, ref) => {
    const props = mergeProps(defaultProps, p)

    const { validChildren, count } = useMemo(() => {
      let count = 0
      const validChildren = React.Children.map(props.children, child => {
        if (!React.isValidElement(child)) return null
        if (child.type !== SwiperItem) {
          devWarning(
            'Swiper',
            'The children of `Swiper` must be `Swiper.Item` components.'
          )
          return null
        }
        count++
        return child
      })
      return {
        validChildren,
        count,
      }
    }, [props.children])

    if (count === 0) {
      devWarning('Swiper', '`Swiper` needs at least one child.')
      return null
    }

    return () => {
      let loop = props.loop
      if (count === 1 && loop) {
        devWarning(
          'Swiper',
          '`Swiper` needs at least two children to enable loop.'
        )
        loop = false
      }

      const swiperRef = useRef<HTMLDivElement>(null)
      const trackRef = useRef<HTMLDivElement>(null)
      const offsetRef = useRef(0)

      function getWidth() {
        const track = trackRef.current
        if (!track) return 0
        return track.offsetWidth
      }

      useLayoutEffect(() => {
        offsetRef.current = 0
        if (props.centered) {
          if (!swiperRef.current || !trackRef.current) return

          const slideWidth =
            (trackRef.current.offsetWidth / swiperRef.current.offsetWidth) * 100
          offsetRef.current = (100 - slideWidth) / (2 * slideWidth)
        }
      }, [props.centered])

      const [current, setCurrent] = useState(props.defaultIndex)

      const [dragging, setDragging, draggingRef] = useRefState(false)

      const [{ x }, api] = useSpring(
        () => ({
          x: (bound(current, 0, count - 1) - offsetRef.current) * 100,
          config: { tension: 200, friction: 30 },
          onRest: () => {
            if (draggingRef.current) return
            const rawX = x.get()
            const totalWidth = 100 * count
            const standardX = modulus(rawX, totalWidth)
            if (standardX === rawX || rawX < 0) return
            api.start({
              x: standardX,
              immediate: true,
            })
          },
        }),
        [count, offsetRef.current]
      )

      const bind = useDrag(
        state => {
          const width = getWidth()
          if (!width) return
          const [mx] = state.movement
          if (state.last) {
            window.setTimeout(() => {
              setDragging(false)
            })
            const index = Math.round((mx + state.vxvy[0] * 100) / width)
            swipeTo(index)
          } else {
            setDragging(true)
            api.start({
              x: (mx * 100) / width,
              immediate: true,
            })
          }
        },
        {
          transform: ([x, y]) => [-x, y],
          initial: () => {
            const width = getWidth()
            return [(x.get() / 100) * width, 0]
          },
          bounds: () => {
            if (loop) return {}
            const width = getWidth()
            return {
              left: 0 - offsetRef.current * width,
              right: (count - 1 - offsetRef.current) * width,
            }
          },
          rubberband: true,
          axis: 'x',
          experimental_preventWindowScrollY: true,
        }
      )

      function swipeTo(index: number) {
        if (loop) {
          const i = modulus(index, count)
          setCurrent(i)
          props.onIndexChange?.(i)
          api.start({
            x: (index - offsetRef.current) * 100,
          })
        } else {
          const i = bound(index, 0, count - 1)
          setCurrent(i)
          props.onIndexChange?.(i)
          api.start({
            x: (i - offsetRef.current) * 100,
          })
        }
      }

      function swipeNext() {
        swipeTo(Math.round(x.get() / 100) + 1)
      }

      function swipePrev() {
        swipeTo(Math.round(x.get() / 100) - 1)
      }

      useImperativeHandle(ref, () => ({
        swipeTo,
        swipeNext,
        swipePrev,
      }))

      const { autoplay, autoplayInterval } = props
      useEffect(() => {
        if (!autoplay || dragging) return
        const interval = window.setInterval(() => {
          swipeNext()
        }, autoplayInterval)
        return () => {
          window.clearInterval(interval)
        }
      }, [autoplay, autoplayInterval, dragging])

      return withNativeProps(
        props,
        <div className='adm-swiper' ref={swiperRef}>
          <div
            className={classNames('adm-swiper-track', {
              'adm-swiper-track-allow-touch-move': props.allowTouchMove,
            })}
            onClickCapture={e => {
              if (draggingRef.current) {
                e.stopPropagation()
                e.preventDefault()
              }
            }}
            {...(props.allowTouchMove ? bind() : {})}
          >
            <div className='adm-swiper-track-inner' ref={trackRef}>
              {React.Children.map(validChildren, (child, index) => {
                return (
                  <animated.div
                    className='adm-swiper-slide'
                    style={{
                      x: x.to(x => {
                        let position = -x + index * 100
                        if (loop) {
                          const totalWidth = count * 100
                          position = modulus(position + 100, totalWidth) - 100
                        }
                        return `${position}%`
                      }),
                      left: `-${index * 100}%`,
                    }}
                  >
                    {child}
                  </animated.div>
                )
              })}
            </div>
          </div>
          {props.indicator === undefined ? (
            <div className='adm-swiper-indicator'>
              <PageIndicator
                {...props.indicatorProps}
                total={count}
                current={current}
              />
            </div>
          ) : (
            props.indicator(count, current)
          )}
        </div>
      )
    }
  })
)

function modulus(value: number, division: number) {
  const remainder = value % division
  return remainder < 0 ? remainder + division : remainder
}
