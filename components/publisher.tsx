import React, {useCallback, useEffect, useRef, useState} from "react";
import {Button, Row, Collapse, Typography, message} from "antd";
import {ClearOutlined} from '@ant-design/icons';
import {useSelector} from 'react-redux';
import type {MouseEvent} from 'react';
import {Storage} from "@plasmohq/storage";
import * as acorn from 'acorn';

import Editor from 'react-simple-code-editor';
import {highlight, languages} from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css'

import reduxStore, {setPublisher, setLogs as reduxSetLogs} from '$store';
import type {State, Meta, PublisherOptions} from '$types';
import {notion2markdown, notionMeta2string, logToRenderer, _toContent, logTypeMap, EventBus} from '$utils';

const {Panel} = Collapse;
const {Link} = Typography;

const storage = new Storage();

const Publisher = (props: any) => {
    const {req: {current: req}, ...restProps} = props;
    const config = useSelector((state: State) => state.publisher.data);
    const logs = useSelector((state: State) => state.logs.data);
    // Note: 默认打开状态通过配置读取，记录上次打开状态
    const [activeFunc, setActiveFunc] = useState(config.functionFold);
    const [activePlugin, setActivePlugin] = useState(config.pluginFold);
    const [activeLog, setActiveLog] = useState(config.logFold);
    const [pluginCode, setPluginCode] = useState(config.pluginCode || '{}');
    const [loading, setLoading] = useState(false);
    const loged = useRef({});
    const cn = restProps.cn;

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
        return () => {
            if (loading) {
                return;
            }
            // console.log('config:', req?.pluginCode);
            setLoading(true);
            _toContent('notion-block-id-get', null, (blockId) => {
                // console.log('获取当前 block id:', blockId);
                storage.get<PublisherOptions>('options').then((props) => {
                    const {language: lang, publisher} = props || {};
                    const cn = lang === 'cn';
                    if (blockId) {
                        // Note: meta 信息中可以拿到 cover 信息，对应 header-img 属性
                        return req?.getNotionMeta(blockId, debug).then((meta: Meta) => {
                            logToRenderer('info',
                                cn ? '[Notion] 获取 Notion database 页面属性:' : '[Notion] Get Notion Pages Properties:', meta);
                            if (!meta.title || !meta.name || !meta.date) {
                                setLoading(false);
                                logToRenderer('error',
                                    cn ? '[Notion Flow] 获取 Notion Meta 内容失败，请检查是否缺失必填字段（name、date）且文章标题不能为空' : 'Get Notion Meta content failed, please check if the required fields (name, date) are missing and the article title is not empty');
                                return Promise.reject(null);
                            }
                            return req?.getNotionContent(blockId).then(blocks => {
                                return notionMeta2string(meta).then(metaString => {
                                    return notion2markdown.bind(req)(blocks, meta, 0, debug).then((markdown) => {
                                        logToRenderer('info',
                                            cn ? '[Notion] 获取 Markdown 内容:' : '[Notion] Get Markdown Content:', metaString.split('\n').join('<br />') + '<br />' + markdown.join('<br /><br />'));
                                        logToRenderer('info',
                                            cn ? '[Github] 即将发送内容到 Github' : '[Github] Ready to send content to github');
                                        logToRenderer('info',
                                            cn ? `[Github] FrontMatter 已${publisher?.enableFrontMatter ? '启用' : '禁用'}` : `[Github] FrontMatter is ${publisher?.enableFrontMatter ? 'enabled' : 'disabled'}`);
                                        return req?.send2Github({meta, content: (publisher?.enableFrontMatter ? metaString : '') + markdown.join('\n'), debug}).then(result => {
                                            const setNotionLastUpdateTime = publisher?.setNotionLastUpdateTime;
                                            logToRenderer('info',
                                                cn ? `[Notion] 发布到 Github 成功${setNotionLastUpdateTime ? '，即将更新 Notion lastUpdateTime 信息:' : ':'}` : `[Notion] Publish to Github success${setNotionLastUpdateTime ? ', ready to update Notion lastUpdateTime:' : ':'}`, result);
                                            if (setNotionLastUpdateTime) {
                                                return req?.updateNotionLastUpdateTime({blockId, debug}).then(updateMetaResult => {
                                                    setLoading(false);
                                                    if (!updateMetaResult) {
                                                        logToRenderer('error',
                                                            cn ? '[Notion] 更新 「lastUpdateTime」 属性失败:' : '[Notion] Update lastUpdateTime Page Properties faild:', updateMetaResult);
                                                    } else {
                                                        logToRenderer('info',
                                                            cn ? '[Notion] 更新 「lastUpdateTime」 属性成功:' : '[Notion] Update lastUpdateTime Page Properties success:', updateMetaResult);
                                                    }
                                                    // Note: 不 reject，因为更新 lastUpdateTime 不是必须的，出错不影响大流程
                                                    return Promise.resolve(null);
                                                });
                                            } else {
                                                setLoading(false);
                                                return Promise.resolve(null);
                                            }
                                        });
                                    });
                                });
                            });
                        }).catch((e) => {
                            setLoading(false);
                            logToRenderer('error',
                                cn ? '[Notion] Notion 内容处理过程中出现错误，请检查日志:' : '[Notion] Error occurred during Notion content processing, see log:', e);
                        });
                    } else {
                        setLoading(false);
                        logToRenderer('error',
                            cn ? '[Notion] 获取 block id 失败, 请确认当前页面为正常 Notion 页面' : '[Notion] Get Notion block id failed, please confirm that the current page is a Notion page');
                    }
                })
            });
        };
    }, [req]);

    const onPublish = onDebug(false);

    const onClearLog = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        reduxStore.dispatch(reduxSetLogs([]));
        // Note: 清空插件日志后，重置 loged 对象
        loged.current = {};
    }, []);

    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        req.pluginCode = pluginCode;
    }, [pluginCode]);

    useEffect(() => {
        const onMessage = (event) => {
            const {data} = event;
            EventBus.dispatch(data.id, data);
        };
        window.addEventListener("message", onMessage);
        return () => {
            window.removeEventListener("message", onMessage);
        };
    }, []);

    useEffect(() => {
        // Note: 将 postMessage 方法绑定到 req 上方便使用
        req.postMessage = (config) => {
            const _config = {
                func: pluginCode,
                ...config,
            };
            const id = config.id;
            return new Promise((resolve) => {
                EventBus.on(id, (data) => {
                    const {result, type} = data;
                    let shouldLog = true;
                    if (loged.current[type]) {
                        shouldLog = false;
                    }
                    loged.current[type] = true;
                    if (result === null || result === undefined && shouldLog) {
                        if (result === undefined) {
                            logToRenderer('info',
                                cn ? `[Notion Flow] 使用默认 ${type} 格式` : `[Notion Flow] Use default ${type} style`);
                        } else if (result === null && shouldLog) {
                            logToRenderer('error',
                                cn ? `[Notion Flow] ${type} 模块转换函数出错` : `[Notion Flow] Block ${type} conversion function error`);
                        }
                        return resolve({result: null});
                    }
                    if (shouldLog) {
                        logToRenderer('info',
                            cn ? `[Notion Flow] 启用自定义 「${type}」 转换` : `[Notion Flow] Enable custom ${type} conversion`);
                    }
                    return resolve({result});
                });
                iframeRef.current?.contentWindow?.postMessage(_config, '*');
            });
        };
    }, [pluginCode, req, loading]);

    let timer = 0;
    const _setPluginCode = useCallback((code: string) => {
        setPluginCode(code);
        clearTimeout(timer);
        timer = window.setTimeout(() => {
            try {
                acorn.parse(`(${code})`, {ecmaVersion: 'latest'});
                reduxStore.dispatch(setPublisher({
                    pluginCode: code,
                }));
                message.success(cn ? '插件转换配置成功' : 'Plugin code conversion configuration successful');
                // Note: 重新配置插件转换后，重置 loged 对象
                loged.current = {};
            } catch (e) {
                // logToRenderer('error', cn ? '[Notion Flow] 插件格式错误，请仔细检查' : '[Notion Flow] Plugin code format error, please check carefully', e);
                message.error(cn ? '插件语法存在错误，请仔细检查' : 'Plugin code syntax error, please check carefully');
            }
        }, 2000);
    }, []);

    return (
        <>
            <iframe src="sandbox.html" ref={iframeRef} style={{display: "none"}} />
            <Panel {...restProps} isActive={activeFunc} onItemClick={onItemClick('Func')} header={cn ? '功能' : 'Function'} key='func'>
                <Row justify={'space-around'} gutter={[16, 16]}>
                    <Button key="log" disabled={loading} loading={loading} size={'small'} onClick={onDebug(true)}>{cn ? '调试(不上传任何文件)' : 'Debug(No upload anthing)'}</Button>
                    <Button key="publish" disabled={loading} loading={loading} type={'primary'} size={'small'} onClick={onPublish}>{cn ? '发布到 Github' : 'Publish to Github'}</Button>
                </Row>
            </Panel>
            <Panel {...restProps} isActive={activePlugin} onItemClick={onItemClick('Plugin')} header={cn ? '模块处理插件' : 'Module Conversion'} key='plugin'>
                <span style={{fontSize: 12, color: '#aaa', }} key='intro'>{cn ? '*内容被修改 2s 后将自动保存，无需手动操作。请按照固定格式书写模块处理函数，详情请见: ' : 'The content will be automatically saved 2 seconds after it is modified, no manual operation is required. Please write the module processing function in a fixed format, for details please see:'}
                    <Link href={cn ? 'https://notion-flow.xheldon.com/docs/advanced/publishing/module-conversion' : 'https://notion-flow.xheldon.com/en/docs/advanced/publishing/module-conversion'} target="_blank" style={{fontSize: 12}}>{cn ? '说明' : 'Guide'}</Link></span>
                <div className='editor-container' key="editor">
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
            <Panel {...restProps} isActive={activeLog} onItemClick={onItemClick('Log')} extra={<ClearOutlined onClick={onClearLog} />} header={cn ? '实时日志' : 'Log'} key='log'>
                <Collapse ghost size='small' className='publisher-log'>
                    {logs.map((log, key) => {
                        return (<Panel key={key} header={`${logTypeMap[log.type]} ${log.header}`}>
                            <div style={{overflow: 'scroll'}} dangerouslySetInnerHTML={{__html: log.msgs}} />
                        </Panel>);
                    })}
                </Collapse>
            </Panel>
        </>
    );
};

export default Publisher;

