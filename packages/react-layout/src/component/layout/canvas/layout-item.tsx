import {
    WidgetItemProps,
    LayoutMode,
    LayoutItemEntry,
    LayoutItemDescriptor,
    WidgetType,
    OperatorType
} from '@/interfaces';
import isEqual from 'lodash.isequal';
import React, {
    memo,
    ReactElement,
    useContext,
    useRef,
    useCallback,
    useMemo,
    useEffect,
    useState,
    useLayoutEffect
} from 'react';

import { MIN_DRAG_LENGTH } from '../calc';
import Draggable, { DEFAULT_BOUND } from './draggable';
import Resizable from './resizable';
// vite在watch模式下检测style变化需要先将内容引进来才能监听到
import styles from './styles.module.css';
import './styles.module.css';
import { LayoutContext } from '../context';

const WidgetItem = React.forwardRef((props: WidgetItemProps, ref) => {
    const child = React.Children.only(props.children) as ReactElement;
    const item_ref = ref ?? useRef<HTMLDivElement>(null);

    // 子元素中有布局
    const [has_inner_layout, setHasInnerLayout] = useState<boolean>();

    const { col_width, row_height } = props.grid;
    const [is_ready, setIsReady] = useState(false);

    const {
        i,
        w,
        h,
        x,
        y,
        type,
        is_dragging,
        is_draggable,
        is_resizable,
        need_border_draggable_handler,
        has_outer_layout,
        layout_id,
        offset_x,
        offset_y,
        margin_height,
        margin_width,
        min_x,
        max_x,
        min_y,
        max_y
    } = props;

    const { operator_type, registry } = useContext(LayoutContext);

    const is_float = type === WidgetType.drag;

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

    // 如果child是一个iframe，就是一个黑洞，用遮罩把黑洞填上
    const mask_handler = (
        <div
            key={'mask'}
            className={`layout-item-mask`}
            style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0
            }}
        ></div>
    );

    // 如果child是一个iframe，就是一个黑洞，用遮罩把黑洞填上
    const draggable_handler = (
        <React.Fragment>
            <div
                key={'top_draggable_handler'}
                className={`draggable_handler`}
                style={{
                    border: 'none',
                    width: '100%',
                    height: '5%',
                    minHeight: 10,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    cursor: 'grab',
                    pointerEvents: 'all'
                }}
            ></div>
            <div
                key={'left_draggable_handler'}
                className={`draggable_handler`}
                style={{
                    border: 'none',
                    width: '5%',
                    height: '100%',
                    minWidth: 10,
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    cursor: 'grab',
                    pointerEvents: 'all'
                }}
            ></div>
            <div
                key={'bottom_draggable_handler'}
                className={`draggable_handler`}
                style={{
                    border: 'none',
                    width: '100%',
                    height: '5%',
                    minHeight: 10,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    cursor: 'grab',
                    pointerEvents: 'all'
                }}
            ></div>
            <div
                key={'right_draggable_handler'}
                className={`draggable_handler`}
                style={{
                    border: 'none',
                    width: '5%',
                    height: '100%',
                    minWidth: 10,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    cursor: 'grab',
                    pointerEvents: 'all'
                }}
            ></div>
        </React.Fragment>
    );

    const getCurrentChildren = useCallback(() => {
        const children = [child.props.children];
        if (props.mode === LayoutMode.edit) {
            if (need_border_draggable_handler) {
                children.push(draggable_handler);
            }
            // 拖拽过程中让所有元素都可以触发move事件
            if (
                operator_type &&
                [
                    OperatorType.drag,
                    OperatorType.drop,
                    OperatorType.resize
                ].includes(operator_type) &&
                !has_inner_layout
            ) {
                children.push(mask_handler);
            }
        }
        return children;
    }, [operator_type, child, need_border_draggable_handler, has_inner_layout]);

    const getTransition = () => {
        const transition = 'all 0.2s cubic-bezier(0.2, 0, 0, 1) 0s';
        if (props.is_placeholder) return transition;

        if (props.is_checked || !is_ready) return 'none';

        return transition;
    };

    const new_child = React.cloneElement(child, {
        tabIndex: i,
        onMouseDown: () => {
            props.setCurrentChecked?.(i);
        },
        // onClick: (e: React.MouseEvent) => {
        //     e.stopPropagation();
        // },
        onDragLeave: (e: React.MouseEvent) => {
            e.stopPropagation();
        },
        onDragEnter: (e: React.MouseEvent) => {
            e.stopPropagation();
        },
        onKeyDown: (e: React.KeyboardEvent) => {
            if (is_float) {
                const keydown_pos = handleKeyDown(e);
                if (keydown_pos) {
                    props.onPositionChange?.({
                        ...{ x, y, h, w, i, type },
                        ...keydown_pos
                    });
                }
            }
        },
        ref: item_ref,
        id: `${
            child.props.id
                ? child.props.id + ' layout_item_' + i
                : 'layout_item_' + i
        }`,
        className: `${[
            child.props.className,
            styles.layout_item,
            props.is_checked ? styles['no-border'] : ''
        ].join(' ')}`,
        style: {
            border: '1px solid transparent',
            transition: getTransition(),
            width: w,
            height: h,
            ...child.props.style,
            pointerEvents:
                is_dragging || props.is_placeholder ? 'none' : 'auto',
            cursor:
                props.is_draggable && !props.need_border_draggable_handler
                    ? 'grab'
                    : 'inherit'
        },
        children: getCurrentChildren()
    });

    /**
     * 获取模块最小范围
     */
    const getCurrentGrid = () => {
        if (is_float) {
            return {
                col_width: props.min_w ?? MIN_DRAG_LENGTH,
                row_height: props.min_h ?? MIN_DRAG_LENGTH
            };
        } else {
            return {
                col_width: (props.min_w ?? 1) * col_width,
                row_height: (props.min_h ?? 1) * row_height
            };
        }
    };

    const unique_id = useMemo(() => {
        return `layout_item_${i}`;
    }, []);

    useLayoutEffect(() => {
        if (props.is_placeholder) return;

        setHasInnerLayout(!!getLayoutItemRef()?.querySelector('.react-layout'));
    }, []);

    useEffect(() => {
        has_inner_layout !== undefined && setIsReady(true);
    }, [has_inner_layout]);

    // useEffect(() => {
    //     if (props.is_placeholder) return;

    //     console.log(unique_id, 'mount');
    //     return () => {
    //         console.log(unique_id, 'unmount');
    //     };
    // }, []);

    const descriptor: LayoutItemDescriptor = useMemo(
        () => ({
            id: i,
            layout_id,
            is_ready,
            pos: {
                i,
                x: x - offset_x,
                y: y - offset_y,
                w: w + margin_width,
                h: h + margin_height,
                type,
                has_inner_layout,
                is_resizable,
                is_draggable
            }
        }),
        [
            i,
            layout_id,
            x,
            y,
            w,
            h,
            type,
            has_inner_layout,
            is_resizable,
            is_draggable,
            is_ready
        ]
    );

    const getLayoutItemRef = useCallback((): HTMLElement | null => {
        if (item_ref instanceof Function) {
            return null;
        }
        return item_ref.current as HTMLElement;
    }, []);

    const entry: LayoutItemEntry = useMemo(
        () => ({
            descriptor,
            unique_id,
            getRef: getLayoutItemRef
        }),
        [descriptor, getLayoutItemRef, unique_id]
    );
    const published_ref = useRef<LayoutItemEntry>(entry);
    const is_first_publish_ref = useRef<boolean>(true);

    useEffect(() => {
        if (props.is_placeholder) return;
        registry.draggable.register(published_ref.current);
        return () => registry.draggable.unregister(published_ref.current);
    }, [registry.draggable]);

    useEffect(() => {
        if (props.is_placeholder) return;
        if (is_first_publish_ref.current) {
            is_first_publish_ref.current = false;
            return;
        }

        const last = published_ref.current;
        published_ref.current = entry;
        registry.draggable.update(entry, last);
    }, [entry, registry.draggable]);

    return (
        <React.Fragment>
            <Draggable
                {...{ x, y, h, w, i }}
                threshold={5}
                use_css_transform={!has_inner_layout}
                use_css_fixed={true}
                scale={props.scale}
                is_draggable={is_draggable}
                is_dragging={is_dragging}
                onDragStart={() => {
                    props.onDragStart?.();
                }}
                draggable_handler={
                    need_border_draggable_handler
                        ? '.draggable_handler'
                        : undefined
                }
                draggable_cancel_handler={props.draggable_cancel_handler}
                // bound={
                //     has_outer_layout
                //         ? DEFAULT_BOUND
                //         : {
                //               max_y: max_y - h,
                //               min_y,
                //               max_x: max_x - w,
                //               min_x
                //           }
                // }
                onDrag={({ x, y }) => {
                    const item = {
                        x: x - offset_x,
                        y: y - offset_y,
                        w: w + margin_width,
                        h: h + margin_height,
                        type,
                        i
                    };
                    props.onDrag?.(item);
                }}
                onDragStop={({ x, y }) => {
                    props.onDragStop?.({
                        x: x - offset_x,
                        y: y - offset_y,
                        w: w + margin_width,
                        h: h + margin_height,
                        type,
                        i
                    });
                }}
            >
                <Resizable
                    ref={item_ref}
                    {...{ x, y, h, w, i, type }}
                    scale={props.scale}
                    is_resizable={is_resizable}
                    is_dragging={is_dragging}
                    onResizeStart={() => {
                        props.onResizeStart?.();
                    }}
                    onResize={({ x, y, h, w }) => {
                        props.onResize?.({
                            x: x - offset_x,
                            y: y - offset_y,
                            w: w + margin_width,
                            h: h + margin_height,
                            type,
                            i
                        });
                    }}
                    grid={getCurrentGrid()}
                    bound={{ max_x, max_y, min_x, min_y }}
                    onResizeStop={({ x, y, h, w }) => {
                        props.onResizeStop?.({
                            x: x - offset_x,
                            y: y - offset_y,
                            w: w + margin_width,
                            h: h + margin_height,
                            type,
                            i
                        });
                    }}
                >
                    {new_child}
                </Resizable>
            </Draggable>
            {props.is_checked && !props.is_placeholder && (
                <div
                    className='checked_border'
                    style={{
                        position: is_dragging ? 'fixed' : 'absolute',
                        transform: `translate(${props.x}px,${props.y}px)`,
                        width: w,
                        height: h,
                        pointerEvents: 'none',
                        backgroundColor: 'transparent',
                        mixBlendMode: 'difference',
                        filter: 'invert(0)',
                        borderRadius: 5,
                        border: '1px dashed #ed7116' // #ed7116
                    }}
                ></div>
            )}
        </React.Fragment>
    );
});

WidgetItem.defaultProps = {
    scale: 1,
    type: WidgetType.grid,
    is_checked: false,
    is_placeholder: false,
    has_outer_layout: false,
    style: {},
    margin: [0, 0] as [number, number]
};

export default memo(WidgetItem, compareProps);

function compareProps<T>(prev: Readonly<T>, next: Readonly<T>): boolean {
    return !Object.keys(prev)
        .map((key) => {
            if (
                [
                    'data-drag',
                    'setCurrentChecked',
                    'onDragStart',
                    'onDrag',
                    'onDragStop',
                    'onResizeStart',
                    'onResize',
                    'onResizeStop',
                    'onPositionChange'
                ].includes(key)
            ) {
                return true;
            } else {
                return isEqual(prev[key], next[key]);
            }
        })
        .some((state) => state === false);
}

export function childrenEqual(a: ReactElement, b: ReactElement): boolean {
    return isEqual(
        React.Children.map(a, (c) => c?.key),
        React.Children.map(b, (c) => c?.key)
    );
}
