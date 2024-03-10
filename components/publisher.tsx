import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button, Row, Collapse, notification, message } from "antd";
import { ClearOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import type { MouseEvent } from 'react';
import { Storage } from "@plasmohq/storage";

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css'

import reduxStore, { setPublisher, setLogs as reduxSetLogs } from '$store';
import type { State, Meta, PublisherOptions } from '$types';
import { notion2markdown, notionMeta2string, logToRenderer, _toContent, logTypeMap } from '$utils';

const { Panel } = Collapse;

const storage = new Storage();

const Publisher = (props: any) => {
    const {req: {current: req}, ...restProps} = props;
    const config = useSelector((state: State) => state.publisher.data);
    const logs = useSelector((state: State) => state.logs.data);
    // Note: 默认打开状态通过配置读取，记录上次打开状态
    const [activeFunc, setActiveFunc] = useState(config.functionFold);
    const [activePlugin, setActivePlugin] = useState(config.pluginFold);
    const [activeLog, setActiveLog] = useState(config.logFold);
    const [pluginCode, setPluginCode] = useState(config.pluginCode || '/*请按照固定格式书写模块处理函数，详情请见: www.xheldon.com */\n');
    const [loading, setLoading] = useState(false);
    const [noti, contextHolder] = notification.useNotification();
    const [messageApi, contextHolder2] = message.useMessage();

    const onItemClick = useCallback((itemName: 'Func' | 'Plugin' | 'Log') => {
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
                case 'Plugin': {
                    reduxStore.dispatch(setPublisher({
                        pluginFold: !activePlugin,
                    }));
                    setActivePlugin(!activePlugin);
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
    }, [activeFunc, activePlugin, activeLog, loading]);

    const onDebug = useCallback((debug: boolean) => {
        return async () => {
            if (loading) {
                return;
            }
            console.log('config:', req?.pluginCode);
            return;
            setLoading(true);
            _toContent('notion-block-id-get', null, (blockId) => {
                // console.log('获取当前 block id:', blockId);
                if (blockId) {
                    try {
                        // Note: meta 信息中可以拿到 cover 信息，对应 header-img 属性
                        req?.getNotionMeta(blockId, debug).then((meta: Meta) => {
                            logToRenderer('info', '[Notion] Get Notion Page Properties', meta);
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
                                    notion2markdown.bind(req)(blocks, meta, 0, debug).then(async (markdown) => {
                                        if (!markdown) {
                                            messageApi.open({
                                                type: 'error',
                                                content: 'notion2markdown 方法错误，转换成 Markdown 格式失败',
                                            });
                                            setLoading(false);
                                            return;
                                        }
                                        logToRenderer('info', '[Notion] Get Markdown content', metaString.split('\n').join('<br />') + '<br />' + markdown.join('<br /><br />'));
                                        // console.log(metaString + markdown.join('\n'));
                                        logToRenderer('info', '[Github] Ready to send content to github');
                                        const {publisher} = await storage.get('options') as PublisherOptions;
                                        logToRenderer('info', `[Github] FrontMatter is ${publisher?.enableFrontMatter ? 'enabled' : 'disabled'}`);
                                        req?.send2Github({meta, content: (publisher?.enableFrontMatter ? metaString : '') + markdown.join('\n'), debug}).then(async result => {
                                            if (!result) {
                                                messageApi.open({
                                                    type: 'error',
                                                    content: 'Send to Github error, see log',
                                                });
                                                setLoading(false);
                                                return;
                                            }
                                            const {publisher} = await storage.get('options') as PublisherOptions;
                                            const setNotionLastUpdateTime = publisher?.setNotionLastUpdateTime;
                                            messageApi.open({
                                                type: 'success',
                                                content: `发布到 Github 成功${setNotionLastUpdateTime ? '，即将更新 Notion Page Property 信息' : ''}`,
                                            });
                                            logToRenderer('info', '[Github] Send content to github success', result);
                                            if (setNotionLastUpdateTime) {
                                                logToRenderer('info', '[Notion] Ready to update「lastUpdateTime」properties');
                                                req?.updateNotionLastUpdateTime({blockId, debug}).then(updateMetaResult => {
                                                    if (!updateMetaResult) {
                                                        messageApi.open({
                                                            type: 'error',
                                                            content: 'Update「lastUpdateTime」Page Properties error, see log',
                                                        });
                                                        setLoading(false);
                                                        return;
                                                    }
                                                    logToRenderer('info', '[Notion] Update lastUpdateTime Page Properties success', updateMetaResult);
                                                    setLoading(false);
                                                });
                                            } else {
                                                setLoading(false);
                                            }
                                        });
                                    });
                                } catch(e) {
                                    setLoading(false);
                                    noti.error({
                                        message: '转换 Notion 内容失败',
                                        description: e.toString()
                                    });
                                    logToRenderer('error', '[Notion] Notion content to Markdown error', e);
                                }
                            });
                        });
                    } catch (e) {
                        setLoading(false);
                        noti.error({
                            message: '获取 block id 失败',
                            description: e.toString()
                        });
                        logToRenderer('error', '[Notion] Get Notion block id error', e);
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
    }, [req]);

    const onPublish = onDebug(false);

    const onClearLog = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        reduxStore.dispatch(reduxSetLogs([]));
    }, []);

    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        window.addEventListener("message", (event) => {
            console.log("EVAL output: " + event.data);
        })
    }, []);

    let timer = 0;
    const _setPluginCode = useCallback((code: string) => {
        setPluginCode(code);
        clearTimeout(timer);
        timer = window.setTimeout(() => {
            reduxStore.dispatch(setPublisher({
                pluginCode: code,
            }));
            console.log('code:', code);
        }, 2000);
    }, []);


    const onMessage = useCallback((event: MouseEvent) => {
        iframeRef.current?.contentWindow?.postMessage({ block: '[{name: "bookmark"}]', func: 'function(block){console.log("blockkk:", block);return "牛逼咯~"}' }, '*');
    }, []);
    
    return (
        <>
            {contextHolder}
            {contextHolder2}
            <iframe src="sandbox.html" ref={iframeRef} style={{ display: "none" }} />
            <Panel {...restProps} isActive={activeFunc} onItemClick={onItemClick('Func')} header="功能" key='func'>
                <Row justify={'space-around'} gutter={[16, 16]}>
                    <Button disabled={loading} loading={loading} size={'small'} onClick={onDebug(true)}>日志</Button>
                    <Button disabled={loading} type={'primary'} size={'small'} onClick={onPublish}>发布到 Github</Button>
                    <Button type={'primary'} size={'small'} onClick={onMessage}>发消息咯</Button>
                </Row>
            </Panel>
            <Panel {...restProps} isActive={activePlugin} onItemClick={onItemClick('Plugin')} header="模块处理插件" key='plugin'>
                <span style={{fontSize: 12, color: '#aaa', }}>*内容被修改 2s 后将自动保存，无需手动操作</span>
                <div className='editor-container'>
                    <Editor
                        value={pluginCode}
                        onValueChange={code => _setPluginCode(code)}
                        highlight={code => highlight(code, languages.js)}
                        padding={10}
                        style={{
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 12,
                        }}
                    />
                </div>
            </Panel>
            <Panel {...restProps} isActive={activeLog} onItemClick={onItemClick('Log')} extra={<ClearOutlined onClick={onClearLog}/>} header="实时日志" key='log'>
                <Collapse ghost size='small' className='publisher-log'>
                    {logs.map((log, key) => {
                        return (<Panel key={key} header={`${logTypeMap[log.type]} ${log.header}`} collapsible={!!log.msgs ? 'disabled' : 'header'}>
                            <div dangerouslySetInnerHTML={{__html: log.msgs}} />
                        </Panel>);
                    })}
                </Collapse>
                {/* <div style={{wordWrap: 'break-word', wordBreak: 'break-all'}}>{logs.map(log => {
                    return (<div style={{marginBottom: 5}} key={`${log}+${Math.random() * 10000}`} dangerouslySetInnerHTML={{ __html: `❯ ${log}` }} />);
                })}</div> */}
            </Panel>
        </>
    );
};

export default Publisher;

