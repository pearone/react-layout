import React, { useEffect, useState } from 'react';
import { Button, Input, Slider } from 'antd';
import {
    ReactDragLayout,
    LayoutType,
    DragItem,
    DirectionType
} from 'react-drag-layout';
import 'react-drag-layout/dist/index.css';
import 'antd/dist/antd.css';

const App = () => {
    const [width, setWidth] = useState<number | string>(800);
    const [height, setHeight] = useState<number | string>(400);
    const [scale, setScale] = useState<number>(1);
    const [widgets, setWidgets] = useState<DragItem[]>([]);
    const [guide_line, setGuideLine] = useState<
        {
            x: number;
            y: number;
            direction: DirectionType;
        }[]
    >([]);

    useEffect(() => {
        setWidgets(generateLayout());
    }, []);

    function generateLayout() {
        return Array.from({ length: 3 }).map((_, i) => {
            return {
                x: i * 30 + 130,
                y: i * 120 + 130,
                w: 100,
                h: 100,
                i: i.toString(),
                is_resizable: true,
                is_draggable: true,
                is_float: false
            };
        });
    }

    return (
        <div
            style={{
                display: 'flex',
                height: '100%',
                overflow: 'hidden'
            }}
        >
            <div
                style={{ height: '100%', width: 30, background: '#607d8b' }}
            ></div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: `calc(100% - 60px)`
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        height: '50px',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: '#ddd',
                        marginBottom: 10
                    }}
                >
                    <Button
                        type='primary'
                        style={{ marginRight: 10 }}
                        draggable={true}
                    >
                        拖拽添加
                    </Button>
                    <span>高度(px)：</span>
                    <Input
                        style={{ marginRight: 10, width: 150 }}
                        value={height}
                        onChange={(e) => {
                            setHeight(parseInt(e.target.value));
                        }}
                    ></Input>
                    <span>宽度(px)：</span>
                    <Input
                        value={width}
                        style={{ marginRight: 10, width: 150 }}
                        onChange={(e) => {
                            setWidth(parseInt(e.target.value));
                        }}
                    ></Input>
                    <span>缩放(100%)：</span>
                    <Slider
                        value={scale}
                        style={{ marginRight: 10, width: 150 }}
                        step={0.04}
                        min={0.04}
                        max={2}
                        onChange={setScale}
                    />
                </div>
                {/* <ReactDragLayout>
                    <div
                        data-drag={{ i: 1, w: 10, h: 10 }}
                        style={{ background: '#000' }}
                    ></div>
                    <div
                        data-drag={{ i: 2, w: 10, h: 10, x: 100, y: 100 }}
                        style={{ background: '#000' }}
                    ></div>
                </ReactDragLayout> */}
                <ReactDragLayout
                    // width={width}
                    // height={height}
                    scale={scale}
                    guide_lines={guide_line}
                    mode={LayoutType.edit}
                    onDrop={({ x, y }: any) => {
                        console.log('onDrop');

                        const drop_element = {
                            x: x,
                            y: y,
                            w: 100,
                            h: 100,
                            i: widgets.length.toString(),
                            is_resizable: true,
                            is_draggable: true
                        } as DragItem;

                        setWidgets(widgets.concat([drop_element]));
                        return drop_element;
                    }}
                    onDragStart={() => {
                        // console.log('onDragStart');
                    }}
                    // onDrag={(layout: DragItem[]) => {
                    //     console.log('onDrag');
                    //     setWidgets(layout);
                    // }}
                    onDragStop={(layout: DragItem[]) => {
                        // console.log('onDragStop');
                        setWidgets(layout);
                    }}
                    onResizeStart={() => {
                        // console.log('onResizeStart');
                    }}
                    // onResize={() => {
                    //     console.log('onResize');
                    // }}
                    onResizeStop={(layout: DragItem[]) => {
                        // console.log('onResizeStop');
                        setWidgets(layout);
                    }}
                    onPositionChange={(layout: DragItem[]) => {
                        // console.log('positionChange', layout);
                        setWidgets(layout);
                    }}
                    addGuideLine={({
                        x,
                        y,
                        direction
                    }: {
                        x: number;
                        y: number;
                        direction: DirectionType;
                    }) => {
                        setGuideLine(guide_line.concat([{ x, y, direction }]));
                    }}
                    removeGuideLine={({
                        x,
                        y,
                        direction
                    }: {
                        x: number;
                        y: number;
                        direction: DirectionType;
                    }) => {
                        setGuideLine(
                            guide_line.filter(
                                (line) =>
                                    !(
                                        line.x === x &&
                                        line.y === y &&
                                        line.direction === direction
                                    )
                            )
                        );
                    }}
                >
                    {widgets.map((w) => {
                        return (
                            <div
                                key={w.i}
                                data-drag={w}
                                // className={'app_class'}
                                id={`app_id_${w.i}`}
                                style={{ background: 'transform' }}
                            >
                                <div className='test'>
                                    我是第{w.i}个div, height: {w.h}, width:{w.w}
                                </div>
                                <Button
                                    type='primary'
                                    style={{ marginRight: 10 }}
                                    draggable={true}
                                >
                                    删除我自己
                                </Button>
                            </div>
                        );
                    })}
                </ReactDragLayout>
                <div
                    style={{ height: 30, width: '100%', background: '#607d8b' }}
                ></div>
            </div>
            <div
                style={{ height: '100%', width: 30, background: '#607d8b' }}
            ></div>
        </div>
    );
};

export default App;
