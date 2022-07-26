import { clamp } from '@/component/canvas/draggable';
import {
    LayoutItem,
    ItemPos,
    GridType,
    MarginType,
    BoundType,
    WidgetType,
    Pos
} from '@/interfaces';

export const RULER_GAP = 100; // 标尺间隔大小
export const TOP_RULER_LEFT_MARGIN = 15; //顶部标尺左侧间隔
export const WRAPPER_PADDING = 200; // 编辑状态下的边框

export const MIN_DRAG_LENGTH = 10; // 最小的拖拽效果下的长度

export const calcXYWH = (
    item: LayoutItem,
    col_width: number,
    row_height: number,
    margin_x: number,
    margin_y: number,
    padding: MarginType
) => {
    const { type, is_resizing, is_dropping, is_dragging, w, h, x, y } = item;
    const out: Pos = {
        x: 0,
        y: 0,
        h: 0,
        w: 0
    };

    // drag/resizing
    if (type === WidgetType.drag || is_resizing) {
        out.w = Math.round(w);
        out.h = Math.round(h);
    }
    // grid
    else {
        out.w = gridXY(w, col_width, margin_x);
        out.h = gridXY(h, row_height, margin_y);
    }

    // drag/dragging
    if (type === WidgetType.drag || is_dragging || is_resizing || is_dropping) {
        out.x = Math.round(x);
        out.y = Math.round(y);
    }
    // grid
    else {
        out.x = Math.round((col_width + margin_x) * x + padding.left);
        out.y = Math.round((row_height + margin_y) * y + padding.top);
    }
    return out;
};

export const gridXY = (
    grid_number: number,
    size: number,
    margin_px: number
) => {
    if (!Number.isFinite(grid_number)) return grid_number;
    return Math.round(
        size * grid_number + Math.max(0, grid_number - 1) * margin_px
    );
};

export const calcXY = (
    grid_number: number,
    size: number,
    margin_px: number,
    padding_px: number,
    min_size: number = -Infinity,
    max_size: number = Infinity
) => {
    const result = Math.round((grid_number - padding_px) / (size + margin_px));

    return clamp(result, min_size, max_size);
};

export const calcWH = (
    grid_number: number,
    size: number,
    margin_px: number,
    min_size: number = -Infinity,
    max_size: number = Infinity
): number => {
    const result = Math.round((grid_number + margin_px) / (size + margin_px));

    return clamp(result, min_size, max_size);
};

export function moveToWidget(target: LayoutItem, to: ItemPos) {
    target.x = to.x;
    target.y = to.y;
    target.w = to.w;
    target.h = to.h;
}

export function replaceWidget(arr: LayoutItem[], item?: LayoutItem) {
    return item
        ? arr.map((obj) => [item].find((o) => o.i === obj.i) || obj)
        : arr;
}
export function cloneWidget(w: LayoutItem) {
    return {
        ...w
    };
}

export function collides(item_1: ItemPos, item_2: ItemPos): boolean {
    if (item_1.i === item_2.i) return false; // 相同节点
    if (item_1.x + item_1.w <= item_2.x) return false; // 👈
    if (item_1.x >= item_2.x + item_2.w) return false; // 👉
    if (item_1.y + item_1.h <= item_2.y) return false; // 👆
    if (item_1.y >= item_2.y + item_2.h) return false; // 👇
    return true;
}

export function getFirstCollision(layout: LayoutItem[], item: LayoutItem) {
    return layout.find((l) => {
        return collides(l, item);
    });
}

function sortGridLayoutItems(layout: LayoutItem[]) {
    return layout
        .filter((l) => {
            return l.type === WidgetType.grid;
        })
        .sort((a, b) => {
            if (a.y > b.y || (a.y === b.y && a.x > b.x)) {
                return 1;
            } else if (a.y === b.y && a.x === b.x) {
                return 0;
            }
            return -1;
        });
}

function bottom(layout: LayoutItem[]) {
    let max = 0,
        bottomY;
    for (let i = 0, len = layout.length; i < len; i++) {
        bottomY = layout[i].y + layout[i].h;
        if (bottomY > max) max = bottomY;
    }
    return max;
}

function resolveCompactionCollision(
    layout: LayoutItem[],
    item: LayoutItem,
    move_to: number
) {
    item.y += 1;
    const idx = layout
        .map((layoutItem) => {
            return layoutItem.i;
        })
        .indexOf(item.i);

    for (let i = idx + 1; i < layout.length; i++) {
        const l = layout[i];
        if (l.y > item.y + item.h) {
            break;
        }
        if (collides(item, l)) {
            resolveCompactionCollision(layout, l, move_to + item.h);
        }
    }
    item.y = move_to;
}

function compactItem(
    compare_with: LayoutItem[],
    l: LayoutItem,
    sorted: LayoutItem[]
) {
    l.y = Math.min(bottom(compare_with), l.y);

    while (l.y > 0) {
        if (getFirstCollision(compare_with, l)) {
            break;
        } else {
            l.y -= 1;
        }
    }

    let collides;
    while ((collides = getFirstCollision(compare_with, l))) {
        resolveCompactionCollision(sorted, l, collides.y + collides.h);
    }

    l.y = Math.max(l.y, 0);
    l.x = Math.max(l.x, 0);
    return l;
}

export function compact(layout: LayoutItem[]) {
    const compare_with: LayoutItem[] = [];
    const sorted = sortGridLayoutItems(layout);

    sorted.map((l) => {
        l.moved = false;
        l = compactItem(compare_with, l, sorted);
        compare_with.push(l);
    });

    return compare_with;
}

export function getAllCollisions(sorted: LayoutItem[], item: LayoutItem) {
    return sorted.filter((l) => collides(l, item));
}

/**
 *
 * @param layout
 * @param l
 * @param collision
 * @param is_user_action
 * @returns
 */
function moveElementAwayFromCollision(
    layout: LayoutItem[],
    l: LayoutItem,
    collision: LayoutItem,
    is_user_action: boolean = false
) {
    const fake_item: LayoutItem = {
        x: collision.x,
        y: Math.max(l.y - collision.h, 0),
        w: collision.w,
        h: collision.h,
        i: 'fake_item',
        type: WidgetType.grid,
        layout_id: ''
    };

    if (is_user_action) {
        is_user_action = false;
        const _collision = getFirstCollision(layout, fake_item);
        if (!_collision) {
            return moveElement(
                layout,
                collision,
                collision.x,
                fake_item.y,
                is_user_action
            );
        }
    }
    return moveElement(layout, collision, collision.x, collision.y + 1);
}

/**
 * 移动元素
 * @param layout
 * @param l
 * @param x
 * @param y
 * @param is_user_action
 * @returns
 */
export function moveElement(
    layout: LayoutItem[],
    l: LayoutItem,
    x: number,
    y: number,
    is_user_action: boolean = false
) {
    const old_y = l.y;
    l.x = x;
    l.y = y;
    l.moved = true;

    let sorted = sortGridLayoutItems(layout);
    if (old_y > l.y) sorted = sorted.reverse();

    const collisions = getAllCollisions(sorted, l);

    for (let i = 0, len = collisions.length; i < len; i++) {
        const collision = collisions[i];

        if (collision.moved) {
            continue;
        }

        layout = moveElementAwayFromCollision(
            sorted,
            l,
            collision,
            is_user_action
        );
    }
    return layout;
}

/**
 * 生成从0开始的数组
 * @param count1
 * @param count2
 * @returns
 */
export const reciprocalNum = (count1: number, count2: number) => {
    const list: any[] = [];
    for (let i = -count1; i <= count2; i++) {
        list.push(i);
    }
    return list;
};

/**
 * 获取5的整数倍数值
 * @param count
 * @param approximation
 * @returns
 */
export const fiveMultipleIntergral = (count: number, approximation = 5) => {
    const max = Math.ceil(count / approximation) * approximation;
    const min = Math.floor(count / approximation) * approximation;
    return max - count >= approximation / 2 ? min : max;
};

/**
 * 补全padding
 * @param bound
 * @returns
 */
export function completedPadding(
    bound?: [number, number?, number?, number?]
): MarginType {
    let pos = { top: 0, right: 0, bottom: 0, left: 0 };
    if (bound) {
        switch (bound.length) {
            case 1:
                pos = {
                    top: bound[0],
                    right: bound[0],
                    bottom: bound[0],
                    left: bound[0]
                };
                break;
            case 2:
                pos = {
                    top: bound[0],
                    right: bound[1] as number,
                    bottom: bound[0],
                    left: bound[1] as number
                };
                break;
            case 3:
                pos = {
                    top: bound[0],
                    right: bound[1] as number,
                    bottom: bound[2] as number,
                    left: bound[1] as number
                };
                break;
            case 4:
                pos = {
                    top: bound[0],
                    right: bound[1] as number,
                    bottom: bound[2] as number,
                    left: bound[3] as number
                };
                break;
        }
    }
    return pos;
}

/**
 * 取中间值
 * @param client
 * @param calc
 * @returns
 */
export function calcOffset(client: number, calc: number) {
    return client - calc > 0 ? (client - calc) / 2 : 0;
}

/**
 * 格式化输出
 * @param arr
 * @returns
 */
export function formatOutputValue(arr: LayoutItem[]) {
    return arr.map((item) => {
        delete item.is_dragging;
        delete item.moved;
        return item;
    });
}

/**
 * 获取组件实际宽高
 * 组件信息补全
 * @param item
 * @returns
 */
export function formatInputValue(item: LayoutItem, parent_layout_id: string) {
    item.layout_id = parent_layout_id;

    item.type = item.type ?? WidgetType.drag;

    item.is_draggable = item.is_draggable ?? false;
    item.is_resizable = item.is_resizable ?? false;
    item.is_droppable = item.is_droppable ?? false;

    item.need_border_draggable_handler =
        item.need_border_draggable_handler ?? false;

    item.w = Math.max(
        item.min_w ?? (item.type === WidgetType.drag ? 5 : 1),
        item.w
    );
    item.h = Math.max(
        item.min_h ?? (item.type === WidgetType.drag ? 5 : 1),
        item.h
    );
    item.is_dragging = false;
    item.is_resizing = false;
    item.moved = false;
    return { ...item };
}
