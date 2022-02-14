import { LayoutItemProps, LayoutType } from '@/interfaces';
import React, { memo, useRef } from 'react';
import { compareProps } from './calc';
import Draggable from './draggable';
import Resizable from './resizable';
import styles from './styles.module.css';

/**
 * LayoutItem、resizable、draggable（props、child）流转：
 * LayoutItem:
 * child: 调用方child
 * props: Canvas props
 *
 * draggable:
 * child: LayoutItem
 * props: resizable props
 *
 * resizable:
 * child: draggable
 * props: LayoutItem props
 */
const LayoutItem = (props: LayoutItemProps) => {
    const child = React.Children.only(props.children);
    const item_ref = useRef<HTMLDivElement>(null);

    const { i, x, y, h, w, is_float, is_draggable, is_resizable } = props;

    console.log('render child', i);

    /** 和当前选中元素有关 */
    const handleKeyDown = (e: React.KeyboardEvent) => {
        const keycode_step = 3;

        switch (e.keyCode) {
            case 37: // ArrowLeft
                return {
                    x: x - keycode_step
                };

            case 38: // ArrowUp
                return {
                    y: y - keycode_step
                };

            case 39: // ArrowRight
                return {
                    x: x + keycode_step
                };

            case 40: // ArrowDown
                return {
                    y: y + keycode_step
                };
        }
        return undefined;
    };

    const new_child = React.cloneElement(child, {
        tabIndex: i,
        onMouseDown: () => {
            props.setCurrentChecked(i);
        },
        onKeyDown: (e: React.KeyboardEvent) => {
            if (is_float) {
                const keydown_pos = handleKeyDown(e);
                if (keydown_pos) {
                    props.onPositionChange?.(
                        Object.assign({ x, y, h, w, i, is_float }, keydown_pos)
                    );
                }
            }
        },
        ref: item_ref,
        id: `${
            child.props.id
                ? child.props.id + ' layout-item-' + i
                : 'layout-item-' + i
        }`,
        className: `${[child.props.className, styles.layout_item].join(' ')}`,
        style: {
            transform: `translate(${x}px, ${y}px)`,
            width: w,
            height: h,
            ...child.props.style
        }
    });

    return (
        <React.Fragment>
            <Resizable
                {...{ x, y, h, w, i, is_float }}
                scale={props.scale}
                is_resizable={is_resizable}
                onResizeStart={() => {
                    props.onResizeStart?.();
                }}
                onResize={({ x, y, h, w }) => {
                    props.onResize?.({ x, y, h, w, is_float, i });
                }}
                bound={
                    props.layout_type === LayoutType.DRAG && is_float
                        ? undefined
                        : props.bound
                }
                onResizeStop={({ x, y, h, w }) => {
                    props.onResizeStop?.({ x, y, h, w, is_float, i });
                }}
            >
                <Draggable
                    {...{ x, y, h, w, i, is_float }}
                    scale={props.scale}
                    is_draggable={is_draggable}
                    onDragStart={() => {
                        props.onDragStart?.();
                    }}
                    bound={
                        props.layout_type === LayoutType.DRAG && is_float
                            ? undefined
                            : props.bound
                            ? {
                                  max_x: props.bound.max_x - w,
                                  min_x: props.bound.min_x,
                                  min_y: props.bound.min_y,
                                  max_y: props.bound.max_y - h
                              }
                            : undefined
                    }
                    onDrag={({ x, y }) => {
                        props.onDrag?.({
                            x,
                            y,
                            w,
                            h,
                            is_float,
                            i
                        });
                    }}
                    onDragStop={({ x, y }) => {
                        props.onDragStop?.({
                            x,
                            y,
                            w,
                            h,
                            is_float,
                            i
                        });
                    }}
                >
                    {new_child}
                </Draggable>
            </Resizable>
        </React.Fragment>
    );
};

LayoutItem.defaultProps = {
    scale: 1,
    is_float: false,
    style: {}
};

export default memo(LayoutItem, compareProps);
