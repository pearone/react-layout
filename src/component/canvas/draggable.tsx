import { BoundType, DraggableProps } from '@/interfaces';
import { addEvent, removeEvent } from '@pearone/event-utils';
import React, { DOMElement, memo, RefObject, useEffect, useState } from 'react';

export const DEFAULT_BOUND = {
    min_x: -Infinity,
    max_x: Infinity,
    min_y: -Infinity,
    max_y: Infinity
};
interface Pos {
    x: number;
    y: number;
}

export enum DragStates {
    dragging = 'dragging',
    draged = 'draged'
}

interface Props extends DraggableProps {
    children: any;
}

const Draggable = (props: Props) => {
    const child = React.Children.only(props.children) as DOMElement<
        Props['children'],
        Element
    >;

    const pos = {
        x: props.x,
        y: props.y
    };

    const [drag_state, setDragState] = useState<DragStates>();
    const [mouse_pos, setMousePos] = useState<Pos>({ x: NaN, y: NaN }); // 鼠标点击坐标
    const [start_pos, setStartPosition] = useState<Pos>(pos); // 放置当前坐标

    /** 获取相对父元素偏移量 */
    const offsetXYFromParent = (e: MouseEvent) => {
        const current = (child.ref as RefObject<HTMLElement>).current;
        const parent = current?.parentElement as HTMLElement;

        const { left, top } = parent?.getBoundingClientRect();
        const x = (e.clientX + parent.scrollLeft - left) / props.scale;
        const y = (e.clientY + parent.scrollTop - top) / props.scale;
        return { x, y };
    };

    /** 开始 */
    const handleDragStart = (e: MouseEvent) => {
        if (!props.is_draggable) {
            return;
        }
        props.onDragStart?.();

        setDragState(DragStates.dragging);

        const { x, y } = offsetXYFromParent(e);

        setStartPosition({ x: props.x, y: props.y });
        setMousePos({ x, y });
    };

    /**
     * 拖拽计算逻辑：
     * 新坐标 = 放置当前坐标 + 鼠标偏移量
     */
    const handleDrag = (e: MouseEvent) => {
        const { x, y } = offsetXYFromParent(e);

        const delta_x = x - mouse_pos.x;
        const delta_y = y - mouse_pos.y;

        const { max_x, max_y, min_x, min_y } = formatBound(props.bound);

        const pos = {
            x: clamp(start_pos.x + delta_x, min_x, max_x),
            y: clamp(start_pos.y + delta_y, min_y, max_y)
        };

        props.onDrag?.(pos);
    };

    /** 结束 */
    const handleDragStop = () => {
        if (!props.is_draggable) {
            return;
        }
        if (drag_state !== DragStates.draged) {
            setDragState(DragStates.draged);
        }
    };

    /**
     * react的事件机制是由react重写的绑定在document上完成的，和原生事件为两套响应机制
     * 所以在react内部调用stopPropagation阻止冒泡的时候，只能阻止到document自己或者以上的事件
     * 为了阻止其他非document元素上的冒泡事件，在此处使用原生处理
     */
    const CurrentMouseUp = (e: MouseEvent) => {
        child.props.onMouseUp?.(e);
        handleDragStop();
    };

    useEffect(() => {
        const current = (child.ref as RefObject<HTMLElement>).current;
        addEvent(current, 'mouseup', CurrentMouseUp);
        return () => {
            const current = (child.ref as RefObject<HTMLElement>).current;
            removeEvent(current, 'mouseup', CurrentMouseUp);
        };
    }, [child]);

    useEffect(() => {
        if (drag_state === DragStates.dragging) {
            addEvent(document, 'mousemove', handleDrag);
            addEvent(document, 'mouseup', handleDragStop);
        }
        if (drag_state === DragStates.draged) {
            props.onDragStop?.({ x: props.x, y: props.y });
            setDragState(undefined);
        }
        return () => {
            removeEvent(document, 'mousemove', handleDrag);
            removeEvent(document, 'mouseup', handleDragStop);
        };
    }, [drag_state]);

    const new_child = React.cloneElement(child, {
        onMouseDown: (e: React.MouseEvent) => {
            child.props.onMouseDown?.(e);
            handleDragStart(e as unknown as MouseEvent);
        },
        className: `${props.className ? props.className : ''} ${
            child.props.className ? child.props.className : ''
        }`,
        style: {
            transform: `translate(${props.x}px, ${props.y}px)`,
            cursor: props.is_draggable ? 'grab' : 'inherit',
            userSelect: drag_state === DragStates.draged ? 'inherit' : 'none',
            willChange:
                drag_state === DragStates.dragging ? 'transform' : 'none',
            ...props.style,
            ...child.props.style
        }
    });

    return new_child;
};

Draggable.defaultProps = {
    is_draggable: false,
    scale: 1,
    style: {},
    bound: DEFAULT_BOUND
};

export default memo(Draggable);

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function formatBound(bound?: Partial<BoundType>): BoundType {
    if (bound) {
        return {
            max_x: bound.max_x == undefined ? Infinity : bound.max_x,
            min_x: bound.min_x == undefined ? -Infinity : bound.min_x,
            max_y: bound.max_y == undefined ? Infinity : bound.max_y,
            min_y: bound.min_y == undefined ? -Infinity : bound.min_y
        };
    }
    return DEFAULT_BOUND;
}
