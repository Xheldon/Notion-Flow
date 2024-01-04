import React, { useCallback, useEffect, useState } from "react";
import { Button, Form, Input, Divider, Col, Row, Collapse, notification } from "antd";
import { ClearOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import type { MouseEvent } from 'react';

import reduxStore, { setConfig } from '$store';
import type { State, Config } from '$types';
import { notion2markdown, notionMeta2string, logToRenderer } from '$utils';

const { Panel } = Collapse;

const itemList = [
    {
        type: 'divider',
        text: 'Github 配置👇🏻'
    },
    {
        type: 'row',
        children: [
            {
                label: 'Token',
                tooltips: {
                    link: 'https://www.xheldon.com',
                    text: '如何获取 Github Token'
                },
                message: '请输入 Github Token',
                name: ['github', 'token'],
            },
            {
                label: 'Branch',
                tooltips: {
                    link: 'https://www.xheldon.com',
                    text: '如何获取 Github Branch 名'
                },
                message: '请输入 Blog 分支名',
                name: ['github', 'branch']
            },
            {
                label: 'Repo',
                tooltips: {
                    link: 'https://www.xheldon.com',
                    text: '如何获取 Github Repo 名'
                },
                message: '请输入 Blog 所在的仓库名',
                name: ['github', 'repo']
            },
            {
                label: 'Owner',
                tooltips: {
                    link: 'https://www.xheldon.com',
                    text: '如何获取 Github Owner 名'
                },
                message: '请输入 Github 用户名',
                name: ['github', 'owner']
            },
        ],
    },
    {
        type: 'divider',
        text: '腾讯云配置👇🏻'
    },
    {
        type: 'row',
        children: [
            {
                label: 'SecretId',
                tooltips: {
                    link: 'https://www.xheldon.com',
                    text: '如何获取腾讯云 SecretId',
                },
                message: '请输入腾讯云 SecretId',
                name: ['oss', 'secretId']
            },
            {
                label: 'SecretKey',
                tooltips: {
                    link: 'https://www.xheldon.com',
                    text: '如何获取腾讯云 SecretKey',
                },
                message: '请输入腾讯云 SecretKey',
                name: ['oss', 'secretKey']
            },
            {
                label: 'Bucket',
                tooltips: {
                    link: 'https://www.xheldon.com',
                    text: '如何获取腾讯云 Bucket',
                },
                message: '请输入腾讯云 Bucket',
                name: ['oss', 'bucket']
            },
            {
                label: 'Region',
                tooltips: {
                    link: 'https://www.xheldon.com',
                    text: '如何获取腾讯云 Region',
                },
                message: '请输入腾讯云 Region',
                name: ['oss', 'region']
            }
        ],
    },
    {
        type: 'devider',
        text: 'Notion 配置👇🏻'
    },
    {
        type: 'row',
        children: [
            {
                label: 'Notion Token',
                tooltips: {
                    link: 'https://www.xheldon.com',
                    text: '如何获取 Notion Token',
                },
                message: '请输入 Notion Token',
                name: ['notion', 'token']
            },
        ]
    },
    {
        type: 'divider',
        text: '',
    }
];

const Publisher = (props: any) => {
    const config = useSelector((state: State) => state.config.data);
    const [form] = Form.useForm();
    // Note: 默认打开状态通过配置读取，记录上次打开状态
    const [activeConfig, setActiveConfig] = useState(true);
    const [activeFunc, setActiveFunc] = useState(true);
    const [activeLog, setActiveLog] = useState(true);
    const [loading, setLoading] = useState(false);
    const [noti, contextHolder] = notification.useNotification();
    const [logs, setLogs] = useState(null);

    const tooltips = useCallback((tooltip: {link: string; text: string}) => {
        return <div>参见:<a href={tooltip.link} target="_blank">{tooltip.text}</a></div>
    }, []);

    const onSave = useCallback(() => {
        // logToRenderer('form:', form.getFieldsValue());
        reduxStore.dispatch(setConfig(form.getFieldsValue() as Config));
    }, [loading]);

    const onItemClick = useCallback((itemName: 'Config' | 'Func' | 'Log') => {
        return () => {
            if (loading) {
                return;
            }
            // Note: 不管了，拼字符串了
            eval(`setActive${itemName}(!active${itemName})`)
        };
    }, [activeConfig, activeFunc, activeLog, loading]);

    const onDebug = useCallback((debug: boolean) => {
        return async () => {
            if (loading) {
                return;
            }
            setLoading(true);
            // const blockId = await window._toMain('notion-block-id-get');
            // logToRenderer('blockid-get:', blockId);
            try {
                // Note: meta 信息中可以拿到 cover 信息，对应 header-img 属性
                /* const meta = await window._toMain('notion-meta-get', blockId, debug);
                logToRenderer('获取 meta 信息:', meta);
                const blocks = await window._toMain('notion-content-get', blockId);
                // Note: 其值转 markdown 放到 main 也可以，放 render 只是为了方便调试
                const metaString = notionMeta2string(meta);
                const markdown = await notion2markdown(blocks, meta, 0, debug);
                logToRenderer('blocks:', metaString + markdown.join('\n'));
                console.log(metaString + markdown.join('\n'));
                const result = await window._toMain('github-update-content', {meta, content: metaString + markdown.join('\n'), debug});
                // Note: 如果更新成功，则更新该 page 的 lastUpdateTime 属性
                const updateMetaResult = await window._toMain('notion-meta-update', {blockId, debug});
                logToRenderer('更新 Notion meta 结果:', updateMetaResult);
                logToRenderer('更新到 github 结果:', result);
                setLoading(false); */
            } catch (e) {
                setLoading(false);
                logToRenderer('renderer 出错:', e);
            }
        };
    }, []);

    const openDevtool = useCallback((type: 'notion' | 'custom') => {
        // Note: 看起来是 bug，设置启用了工具栏，但是没有打开，此处手动触发
        return () => {
            // window._toMain('dev-devtool-open', type);
        };
    }, []);

    const onPublish = onDebug(false);

    const onClearLog = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        setLogs('');
    }, []);

    useEffect(() => {
        /* window._fromMain('dev-logs', (_, log) => {
            const _logs = (
                <>
                    <div>{log}</div>
                    {logs}
                </>
            );
            setLogs(_logs);
        }); */
    }, []);

    
    return (
        <>
            {contextHolder}
            <Panel {...props} isActive={activeConfig} onItemClick={onItemClick('Config')} header="配置" key='config'>
                <Form
                    initialValues={config}
                    form={form}
                    // layout={'inline'}
                    size={'small'}
                    labelCol={{ span: 24 }}
                    wrapperCol={{ span: 24 }}
                    labelAlign={'left'}
                    scrollToFirstError={true}
                >
                    <>
                        {itemList.map((item, key) => {
                            const {type, children} = item;
                            switch (type) {
                                case 'row': {
                                    return (
                                        <Row key={key} gutter={[5, 5]}>
                                            {children.map(child => {
                                                const {label, tooltips: _tooltips, message, name} = child;
                                                return (
                                                    <Col key={label} span={12}>
                                                        <Form.Item style={{marginBottom: 0}} tooltip={tooltips(_tooltips)} rules={[{required: true, message}]} name={name} label={label}>
                                                            <Input />
                                                        </Form.Item>
                                                    </Col>
                                                );
                                            })}
                                        </Row>
                                    );
                                }
                                case 'divider': {
                                    const {text} = item;
                                    return <Divider key={key}>{text}</Divider>
                                }
                            }
                        })}
                    </>
                    <Col span={12}>
                        <Form.Item>
                            <Button type="primary" onClick={onSave}>保存</Button>
                        </Form.Item>
                    </Col>
                </Form>
            </Panel>
            <Panel {...props} isActive={activeFunc} onItemClick={onItemClick('Func')} header="功能" key='func'>
                <Row justify={'space-around'} gutter={[16, 16]}>
                    <Button disabled={loading} loading={loading} size={'small'} onClick={onDebug(true)}>日志</Button>
                    <Button disabled={loading} size={'small'} onClick={openDevtool('notion')}>Notion Devtools</Button>
                    <Button disabled={loading} size={'small'} onClick={openDevtool('custom')}>当前 DevTools</Button>
                    <Button disabled={loading} type={'primary'} size={'small'} onClick={onPublish}>发布</Button>
                </Row>
            </Panel>
            <Panel {...props} isActive={activeLog} onItemClick={onItemClick('Log')} extra={<ClearOutlined onClick={onClearLog}/>} header="实时日志" key='log'>
                <div style={{whiteSpace: 'nowrap', overflow: 'scroll'}}>{logs}</div>
            </Panel>
        </>
    );
};

export default Publisher;

