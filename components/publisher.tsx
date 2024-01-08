import React, { useCallback, useEffect, useState } from "react";
import { Button, Row, Collapse, notification, message } from "antd";
import { ClearOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import type { MouseEvent } from 'react';
import { Storage } from "@plasmohq/storage"

import reduxStore, { setPublisher, setLogs as reduxSetLogs } from '$store';
import type { PublisherOptions, State, Meta } from '$types';
import { notion2markdown, notionMeta2string, logToRenderer, _toContent } from '$utils';
import Req from '$api';

const { Panel } = Collapse;

const storage = new Storage();

let _publisherOptions = null;

let req = null;
(async () => {
    const _: PublisherOptions = await storage.get('options');
    if (_) {
        _publisherOptions = {
            github: _.publisher.github,
            notion: _.publisher.notion,
            oss: _.oss[_.oss.name],
        };
        req = new Req(_publisherOptions);
    }
})();

const Publisher = (props: any) => {
    const config = useSelector((state: State) => state.publisher.data);
    const logs = useSelector((state: State) => state.logs.data);
    // Note: 默认打开状态通过配置读取，记录上次打开状态
    const [activeFunc, setActiveFunc] = useState(config.functionFold);
    const [activeLog, setActiveLog] = useState(config.logFold);
    const [loading, setLoading] = useState(false);
    const [noti, contextHolder] = notification.useNotification();
    const [publisherOptions, setPublisherOptions] = useState(_publisherOptions);
    const [messageApi, contextHolder2] = message.useMessage();
    // const [logs, setLogs] = useState(_logs);


    const onItemClick = useCallback((itemName: 'Func' | 'Log') => {
        return () => {
            if (loading) {
                return;
            }
            switch (itemName) {
                case 'Func': {
                    reduxStore.dispatch(setPublisher({
                        functionFold: !activeFunc,
                    }));
                    setActiveFunc(!activeFunc);
                    break;
                }
                case 'Log': {
                    reduxStore.dispatch(setPublisher({
                        logFold: !activeLog,
                    }));
                    setActiveLog(!activeLog);
                    break;
                }
            }

        };
    }, [activeFunc, activeLog, loading]);

    const onDebug = useCallback((debug: boolean) => {
        return async () => {
            if (loading) {
                return;
            }
            setLoading(true);
            // const blockId = await window._toMain('notion-block-id-get');
            _toContent('notion-block-id-get', null, (blockId) => {
                console.log('获取当前 block id:', blockId);
                if (blockId) {
                    try {
                        // Note: meta 信息中可以拿到 cover 信息，对应 header-img 属性
                        // const meta = await window._toMain('notion-meta-get', blockId, debug);
                        req.getNotionMeta(blockId, debug).then((meta: Meta) => {
                            logToRenderer('获取 meta 信息:', meta);
                            if (!meta) {
                                messageApi.open({
                                    type: 'error',
                                    content: '获取 Notion Meta 信息失败',
                                });
                                setLoading(false);
                                return;
                            }
                            req.getNotionContent(blockId).then((blocks) => {
                                if (!blocks) {
                                    messageApi.open({
                                        type: 'error',
                                        content: '获取 Notion 模块信息失败',
                                    });
                                    setLoading(false);
                                    return;
                                }
                                const metaString = notionMeta2string(meta);
                                try {
                                    notion2markdown.bind(req)(blocks, meta, 0, debug).then(markdown => {
                                        logToRenderer('blocks:', metaString + markdown.join('\n'));
                                        console.log(metaString + markdown.join('\n'));
                                        req.send2Github({meta, content: metaString + markdown.join('\n'), debug}).then(result => {
                                            req.updateNotionLastUpdateTime({blockId, debug}).then(updateMetaResult => {
                                                logToRenderer('更新 Notion meta 结果:', updateMetaResult);
                                                logToRenderer('更新到 github 结果:', result);
                                                setLoading(false);
                                            });
                                        });
                                    });
                                } catch(e) {
                                    setLoading(false);
                                    noti.error({
                                        message: '转换 Notion 内容失败',
                                        description: e.toString()
                                    });
                                    logToRenderer('转换 Notion 内容失败:', e);
                                }
                            });
                        });
                    } catch (e) {
                        setLoading(false);
                        noti.error({
                            message: '获取 block id 失败',
                            description: e.toString()
                        });
                        logToRenderer('renderer 出错:', e);
                    }
                } else {
                    setLoading(false);
                    noti.error({
                        message: '获取 block id 失败',
                        description: '请确认当前页面为 Notion 页面'
                    });
                }
            });
        };
    }, []);

    const onPublish = onDebug(false);

    const onClearLog = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        reduxStore.dispatch(reduxSetLogs([]));
        // setLogs([]);
    }, []);

    // useEffect(() => {
    //     setLogs(_logs);
    // }, [_logs]);

    useEffect(() => {
        // Note: 初始化的时候读取 options 配置，变化的时候也监听该配置
        storage.watch({
            options: (opt) => {
                const {newValue: {publisher, oss}} = opt;
                // console.log('holy shit, i get the opt:', opt);
                setPublisherOptions({
                    github: publisher.github,
                    notion: publisher.notion,
                    oss: oss[oss.name]
                });
            }
        });
    }, []);
    
    return (
        <>
            {contextHolder}
            {contextHolder2}
            <Panel {...props} isActive={activeFunc} onItemClick={onItemClick('Func')} header="功能" key='func'>
                <Row justify={'space-around'} gutter={[16, 16]}>
                    <Button disabled={loading} loading={loading} size={'small'} onClick={onDebug(true)}>日志</Button>
                    <Button disabled={loading} type={'primary'} size={'small'} onClick={onPublish}>发布</Button>
                </Row>
            </Panel>
            <Panel {...props} isActive={activeLog} onItemClick={onItemClick('Log')} extra={<ClearOutlined onClick={onClearLog}/>} header="实时日志" key='log'>
                <div style={{whiteSpace: 'nowrap', overflow: 'scroll'}}>{logs.map(log => {
                    return (<div key={log}>{log}</div>);
                })}</div>
            </Panel>
        </>
    );
};

export default Publisher;

