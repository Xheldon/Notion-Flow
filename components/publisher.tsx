import React, { useCallback, useEffect, useState } from "react";
import { Button, Row, Collapse, notification, message } from "antd";
import { ClearOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import type { MouseEvent } from 'react';

import reduxStore, { setPublisher, setLogs as reduxSetLogs } from '$store';
import type { State, Meta } from '$types';
import { notion2markdown, notionMeta2string, logToRenderer, _toContent } from '$utils';

const { Panel } = Collapse;

const Publisher = (props: any) => {
    const {req: {current: req}, ...restProps} = props;
    const config = useSelector((state: State) => state.publisher.data);
    const logs = useSelector((state: State) => state.logs.data);
    // Note: 默认打开状态通过配置读取，记录上次打开状态
    const [activeFunc, setActiveFunc] = useState(config.functionFold);
    const [activeLog, setActiveLog] = useState(config.logFold);
    const [loading, setLoading] = useState(false);
    const [noti, contextHolder] = notification.useNotification();
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
            _toContent('notion-block-id-get', null, (blockId) => {
                // console.log('获取当前 block id:', blockId);
                if (blockId) {
                    try {
                        // Note: meta 信息中可以拿到 cover 信息，对应 header-img 属性
                        req?.getNotionMeta(blockId, debug).then((meta: Meta) => {
                            logToRenderer('获取 meta 信息:', meta);
                            if (!meta) {
                                messageApi.open({
                                    type: 'error',
                                    content: 'getNotionMeta 方法错误，获取 Notion Meta 内容失败',
                                });
                                setLoading(false);
                                return;
                            }
                            if (!meta.title || !meta.name || !meta.date) {
                                messageApi.open({
                                    type: 'error',
                                    content: '获取 Notion Meta 内容失败，请检查是否缺失必填字段（name、date）且文章标题不能为空',
                                });
                                setLoading(false);
                                return;    
                            }
                            req?.getNotionContent(blockId).then(async (blocks) => {
                                if (!blocks) {
                                    messageApi.open({
                                        type: 'error',
                                        content: 'getNotionContent 方法错误，获取 Notion 内容失败',
                                    });
                                    setLoading(false);
                                    return;
                                }
                                const metaString = await notionMeta2string(meta);
                                try {
                                    notion2markdown.bind(req)(blocks, meta, 0, debug).then(markdown => {
                                        if (!markdown) {
                                            messageApi.open({
                                                type: 'error',
                                                content: 'notion2markdown 方法错误，转换成 Markdown 格式失败',
                                            });
                                            setLoading(false);
                                            return;
                                        }
                                        logToRenderer('正文 Markdown 内容:<br/>', metaString.split('\n').join('<br />') + '<br />' + markdown.join('<br /><br />'));
                                        // console.log(metaString + markdown.join('\n'));
                                        req?.send2Github({meta, content: metaString + markdown.join('\n'), debug}).then(result => {
                                            if (!result) {
                                                messageApi.open({
                                                    type: 'error',
                                                    content: 'send2Github 方法错误',
                                                });
                                                setLoading(false);
                                                return;
                                            }
                                            messageApi.open({
                                                type: 'success',
                                                content: '发布到 Github 成功，即将更新 Notion meta 信息',
                                            });
                                            req?.updateNotionLastUpdateTime({blockId, debug}).then(updateMetaResult => {
                                                if (!updateMetaResult) {
                                                    messageApi.open({
                                                        type: 'error',
                                                        content: 'updateNotionLastUpdateTime 方法错误，未更新 lastUpdateTime 字段',
                                                    });
                                                    setLoading(false);
                                                    return;
                                                }
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
    }, []);
    
    return (
        <>
            {contextHolder}
            {contextHolder2}
            <Panel {...restProps} isActive={activeFunc} onItemClick={onItemClick('Func')} header="功能" key='func'>
                <Row justify={'space-around'} gutter={[16, 16]}>
                    <Button disabled={loading} loading={loading} size={'small'} onClick={onDebug(true)}>日志</Button>
                    <Button disabled={loading} type={'primary'} size={'small'} onClick={onPublish}>发布</Button>
                </Row>
            </Panel>
            <Panel {...restProps} isActive={activeLog} onItemClick={onItemClick('Log')} extra={<ClearOutlined onClick={onClearLog}/>} header="实时日志" key='log'>
                <div style={{wordWrap: 'break-word', wordBreak: 'break-all'}}>{logs.map(log => {
                    return (<div style={{marginBottom: 5}} key={`${log}+${Math.random() * 10000}`} dangerouslySetInnerHTML={{ __html: `> ${log}` }} />);
                })}</div>
            </Panel>
        </>
    );
};

export default Publisher;

