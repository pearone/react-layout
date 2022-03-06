import React, { ReactChild, ReactElement, RefObject } from 'react';

export enum OperatorType {
    drag = 'drag',
    dragover = 'dragover',
    resize = 'resize',
    resizeover = 'resizeover',
    drop = 'drop',
    dropover = 'dropover',
    changeover = 'changeover'
}

export enum LayoutType {
    edit = 'edit',
    view = 'view',
    DRAG = 'drag',
    GRID = 'grid'
}

export enum CursorType {
    nw = 'nw-resize',
    ne = 'ne-resize',
    sw = 'sw-resize',
    se = 'se-resize'
}

export enum DirectionType {
    horizontal = 'horizontal',
    vertical = 'vertical'
}

export type RulerPointer = {
    x: number;
    y: number;
    direction: DirectionType;
};

export type CursorPointer = {
    x: number;
    y: number;
    cursor: CursorType;
};

export type GridType = {
    col_width: number;
    row_height: number;
};

export type MarginType = {
    top: number;
    left: number;
    right: number;
    bottom: number;
};

export type BoundType = {
    max_x: number;
    max_y: number;
    min_x: number;
    min_y: number;
};

export type ItemPos = {
    i: string;
    x: number;
    y: number;
    h: number;
    w: number;
    is_float: boolean;
};

type LayoutBase = {
    scale: number;
    cols: number;
    row_height: number;
    container_padding: [number, number?, number?, number?];
    item_margin: [number, number];
    need_ruler: boolean;
    need_grid_bound: boolean;
    need_drag_bound: boolean;
    is_nested: boolean;
    className?: string;
};

type EditLayoutBase = LayoutBase & {
    getDroppingItem?: () => { h: number; w: number; i: string };
    onDrop?: (
        layout: LayoutItem[],
        { x, y }: { x: number; y: number }
    ) => LayoutItem;
    onRemove?: (i: string) => void;
    onDragStart?: () => void;
    onDrag?: (layout: LayoutItem[]) => void;
    onDragStop?: (layout: LayoutItem[]) => void;
    onResizeStart?: () => void;
    onResize?: (layout: LayoutItem[]) => void;
    onResizeStop?: (layout: LayoutItem[]) => void;
    onPositionChange?: (layout: LayoutItem[]) => void;
};

type GuideLine = {
    guide_lines?: RulerPointer[];
    addGuideLine?: ({ x, y, direction }: RulerPointer) => void;
    removeGuideLine?: ({ x, y, direction }: RulerPointer) => void;
};

export type DragLayout = LayoutBase & {
    layout_type: LayoutType.DRAG;
    width: number;
    height: number;
    mode: LayoutType.view;
    children: ReactElement[];
};

export type DragEditLayout = EditLayoutBase &
    GuideLine & {
        layout_type: LayoutType.DRAG;
        width: number;
        height: number;
        mode: LayoutType.edit;
        children: ReactElement[];
    };

export type DragLayoutProps = DragLayout | DragEditLayout;

export type GridLayout = LayoutBase & {
    layout_type: LayoutType.GRID;
    mode: LayoutType.view;
    children: ReactElement[];
};

export type GridEditLayout = EditLayoutBase &
    GuideLine & {
        layout_type: LayoutType.GRID;
        mode: LayoutType.edit;
        children: ReactElement[];
    };

export type GridLayoutProps = GridLayout | GridEditLayout;

export type EditLayoutProps = DragEditLayout | GridEditLayout;

/** 画板props */
export type ReactDragLayoutProps =
    | DragLayout
    | GridLayout
    | DragEditLayout
    | GridEditLayout;

/** 水平标尺props */
export type HorizontalRulerProps = ReactDragLayoutProps & {
    width: number;
    wrapper_width: number;
    l_offset: number;
    setRulerHoverPos: ({ x, y, direction }?: RulerPointer) => void;
    addGuideLine?: ({ x, y, direction }: RulerPointer) => void;
    canvas_viewport: RefObject<HTMLDivElement>;
};

/** 垂直标尺props */
export type VerticalRulerProps = ReactDragLayoutProps & {
    height: number;
    wrapper_height: number;
    t_offset: number;
    setRulerHoverPos: ({ x, y, direction }?: RulerPointer) => void;
    addGuideLine?: ({ x, y, direction }: RulerPointer) => void;
    canvas_viewport: RefObject<HTMLDivElement>;
};

/** 辅助线 */
export interface GuideLineProps {
    scale: number;
    l_offset: number;
    t_offset: number;
    guide_lines?: RulerPointer[];
    ruler_hover_pos?: RulerPointer;
    canvas_viewport: RefObject<HTMLDivElement>;
    removeGuideLine?: ({ x, y, direction }: RulerPointer) => void;
}

/** 单节点属性 */
export interface LayoutItem extends ItemPos {
    min_w?: number;
    min_h?: number;
    is_draggable?: boolean;
    is_resizable?: boolean;
    is_nested?: boolean;
    covered?: boolean;
    moved?: boolean;
    is_dragging?: boolean;
    is_checked?: boolean;
    // 可以通过mask在操作布局的时候屏蔽元素细节
    // 处理有iframe情况下，出现事件黑洞的情况
    need_mask?: boolean;
}

interface EventBaseProps {
    id?: string;
    className?: string;
    style?: React.CSSProperties;
    children: ReactElement;
}

/** 子元素 */
export interface WidgetItemProps extends EventBaseProps, LayoutItem {
    scale: number;
    bound: BoundType;
    grid: GridType;
    margin: [number, number];
    padding: MarginType;
    mode: LayoutType.edit | LayoutType.view;
    layout_type: LayoutType.DRAG | LayoutType.GRID;
    layout_nested?: boolean;
    setCurrentChecked?: (idx: string) => void;
    onDragStart?: () => void;
    onDrag?: (item: ItemPos) => void;
    onDragStop?: (item: ItemPos) => void;
    onResizeStart?: () => void;
    onResize?: (item: ItemPos) => void;
    onResizeStop?: (item: ItemPos) => void;
    onPositionChange?: (item: ItemPos) => void;
}
/** drag */
export interface DraggableProps extends Omit<EventBaseProps, 'children'> {
    x: number;
    y: number;
    scale: number;
    bound?: Partial<BoundType>;
    is_draggable?: boolean;
    onDragStart?: () => void;
    onDrag?: ({ x, y }: { x: number; y: number }) => void;
    onDragStop?: ({ x, y }: { x: number; y: number }) => void;
}

export interface CursorProps extends DraggableProps {
    cursor: CursorType;
    margin?: [number, number];
    onDrag?: ({ x, y, cursor }: CursorPointer) => void;
    onDragStop?: ({ x, y, cursor }: CursorPointer) => void;
}

/** resize */
export interface ResizableProps extends EventBaseProps, ItemPos {
    onMouseDown?: (e: React.MouseEvent) => void;
    scale: number;
    grid: GridType;
    bound: BoundType;
    margin?: [number, number];
    is_resizable?: boolean;
    onResizeStart?: () => void;
    onResize?: ({
        x,
        y,
        h,
        w
    }: {
        x: number;
        y: number;
        h: number;
        w: number;
    }) => void;
    onResizeStop?: ({
        x,
        y,
        h,
        w
    }: {
        x: number;
        y: number;
        h: number;
        w: number;
    }) => void;
}

export interface MenuProps {
    children: ReactElement;
    // target: ReactElement; // 点击目标时目录显示，非目标不显示
}

export interface MenuItemProps {
    children: ReactChild;
}
