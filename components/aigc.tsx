import React, { useCallback, useEffect, useState } from "react";
import { Button, Form, Input, Divider, Col, Row, Collapse, notification, Select, Space, Typography} from "antd";
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import type { MouseEvent } from 'react';

import reduxStore, { setAigc, setPublisher } from '$store';
import type { State, PublisherConfig, AigcPrompt, AigcData } from '$types';
import { notion2markdown, notionMeta2string, logToRenderer, getPublisherConfig, getAigcConfig } from '$utils';

const { Panel } = Collapse;
const { Paragraph, Text } = Typography;
const { TextArea } = Input;

const itemList = [
    {
        type: 'row',
        children: [
            {
                type: 'input',
                label: 'ChatGPT API Key',
                name: ['key', 'ChatGPT']
            }
        ]
    },
    {
        type: 'row',
        children: [
            {
                type: 'list',
                label: 'Prompt 列表',
                name: ['prompt'],
                listName: ['prompts']
            },
            {   
                type: 'select',
                label: '模型',
                name: ['model'],
                list: (aigc: AigcData) => {
                    if (!aigc) return [];
                    return Object.keys(aigc.key || {}).map(item => ({value: item, label: item}));
                },
            },
            {
                type: 'select',
                label: '温度参数',
                name: ['temperature'],
                list: (aigc: AigcData) => {
                    if (!aigc) return [];
                    const list = [];
                    for (let i = 0; i < 21; i+=2) {
                        if (String(i).length < 2) {
                            list.push(`0.${i}`);
                        } else {
                            list.push(String(i/10));
                        }
                    }
                    return list.map(item => ({value: item, label: item}));
                },
            },
            {
                type: 'select',
                label: '上下文数',
                name: ['contextNum'],
                list: () => {
                    const list = [];
                    for (let i = 1; i < 21; i++) {
                        list.push(String(i));
                    }
                    list.push('100');
                    return list.map(item => ({value: item, label: item}));
                },
            }
        ],
    },
];

const Aigc = (props: any = {}) => {
    const aigc = useSelector((state: State) => state.aigc.data);
    const [form] = Form.useForm();
    const [activeConfig, setActiveConfig] = useState(true);
    const [activeAction, setActiveAction] = useState(true);
    const [loading, setLoading] = useState(false);
    const [newPrompt, setNewPrompt] = useState('');
    const [open, setOpen] = useState(false);
    const [noti, contextHolder] = notification.useNotification();
    const [selectContent, setSelectContent] = useState('');
    const [result, setResult] = useState('');

    const onItemClick = useCallback((itemName: 'Config' | 'Action') => {
        return () => {
            if (loading) {
                return;
            }
            switch (itemName) {
                case 'Config': {
                    setActiveConfig(!activeConfig);
                    break;
                }
                case 'Action': {
                    setActiveAction(!activeAction);
                    break;
                }
            }
        }
    }, [activeConfig, activeAction, loading]);

    const onNewPromptChange = (e:  React.ChangeEvent<HTMLInputElement>) => {
        setNewPrompt(e.target.value);
    };

    const addPrompt = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
        e.preventDefault();
        const prompts = form.getFieldValue('prompts');
        // Note: 添加新的 prompt 的时候先看有没有重复的，有就不添加
        if (prompts.some((prompt: AigcPrompt) => prompt === newPrompt)) {
            return;
        }
        const newPrompts = prompts.slice();
        newPrompts.push(newPrompt);
        console.log('newPrompt:', newPrompt, prompts, newPrompts);
        form.setFieldValue('prompts', newPrompts);
        form.setFieldValue('prompt', newPrompt);
        // Note: 因为非用户出发的 change 不会出发 onFormChange，所以手动触发一次
        onFormChange();
        setNewPrompt('');
        setOpen(false);
    };

    const onFormChange = () => {
        const newAigc = form.getFieldsValue();
        console.log('form value:', newAigc);
        reduxStore.dispatch(setAigc(newAigc));
    };

    const onOptionDelete = (field: keyof AigcData, index: number) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        const prev = form.getFieldValue(field) || [];
        const next = prev.slice();
        const del = next.splice(index, 1);
        console.log('del:', del);
        form.setFieldValue(field, next);
        // Note: 如果删的刚好是当前选中的，则应该清空一下 prompt
        if (form.getFieldValue('prompt') === del[0]) {
            form.setFieldValue('prompt', '');
        }
        setOpen(false);
        onFormChange();
    };
         
    useEffect(() => {
        /* window._fromMain('aigc-select-content', (_, content) => {
            console.log('aigc-select-content 内容:', content);
            let _content = content;
            if (_content.length > 500) {
                _content = `${_content.slice(0, 500)}...`;
            }
            setSelectContent(_content);
        }); */
    }, []);

    return (
        <>
            {contextHolder}
            <Panel {...props} isActive={activeConfig} onItemClick={onItemClick('Config')} header="配置" key="config">
                <Form
                    initialValues={aigc}
                    form={form}
                    size={'small'}
                    labelCol={{ span: 6 }}
                    labelAlign={'left'}
                    scrollToFirstError={true}
                    onValuesChange={onFormChange}
                >
                    <Space direction={'vertical'}>
                        {itemList.map((item, key) => {
                            const {type, children} = item;
                            switch (type) {
                                case 'row': {
                                    return (
                                        <Row key={key} gutter={[8, 8]}>
                                            {children.map((child, key) => {
                                                    const {label, name, type, list, listName} = child as any;
                                                    switch (type) {
                                                        // Note: 目前只允许一个 open，就这样吧先
                                                        case 'list': {
                                                            return (
                                                                <Col key={key} span={24}>
                                                                    <Form.Item key={label} style={{marginBottom: 0}} name={name} label={label}>
                                                                        <Select
                                                                            open={open}
                                                                            placeholder={'选择一个 Prompt'}
                                                                            optionLabelProp={'label'}
                                                                            onDropdownVisibleChange={(visible) => setOpen(visible)}
                                                                            dropdownRender={menu => {
                                                                                return (
                                                                                    <>
                                                                                        {menu}
                                                                                        <Divider />
                                                                                        <Space>
                                                                                            <Input
                                                                                                value={newPrompt}
                                                                                                onChange={onNewPromptChange}
                                                                                            />
                                                                                            <Space />
                                                                                            <Button type="text" icon={<PlusOutlined />} onClick={addPrompt}>
                                                                                                新增
                                                                                            </Button>
                                                                                        </Space>
                                                                                    </>
                                                                                );
                                                                            }}
                                                                        >
                                                                            {
                                                                                (form.getFieldValue('prompts') || []).map((prompt: AigcPrompt, index: number) => {
                                                                                    return (
                                                                                        <Select.Option key={index} value={prompt} label={prompt}>
                                                                                            <div style={{display: 'flex', justifyContent: 'space-between'}}><span>{prompt}</span><CloseOutlined onClick={onOptionDelete('prompts', index)} /></div>
                                                                                        </Select.Option>
                                                                                    );

                                                                                })
                                                                            }
                                                                        </Select>
                                                                    </Form.Item>
                                                                    <Form.Item hidden key={`${label}-hidden`} name={listName}><div>此处隐藏，存粹为了绑定 propmpts 到 form 上</div></Form.Item>
                                                                </Col>
                                                                );
                                                        }
                                                        case 'select': {
                                                            return (
                                                                <Col key={key} span={12}>
                                                                    <Form.Item key={label} style={{marginBottom: 0}} name={name} label={label}>
                                                                        <Select
                                                                            options={list(aigc)}
                                                                        >
                                                                        </Select>
                                                                    </Form.Item>
                                                                </Col>
                                                            );
                                                        }
                                                        case 'input': {
                                                            return (
                                                                <Col key={key} span={24}>
                                                                    <Form.Item key={label} style={{marginBottom: 0}} name={name} label={label}>
                                                                        <Input type={'password'} />
                                                                    </Form.Item>
                                                                </Col>
                                                                
                                                            );
                                                        }
                                                    }
                                                })}          
                                        </Row>
                                    );
                                }
                            }
                        })}
                    </Space>
                </Form>
            </Panel>
            <Panel {...props} isActive={activeAction} onItemClick={onItemClick('Action')} header="操作" key="action">
                <Paragraph>
                    <Row /* gutter={[20, 20]} */>
                        <Text>选区内容:</Text>
                        <TextArea
                            showCount
                            disabled
                            autoSize={{
                                minRows: 1,
                                maxRows: 6
                            }}
                            style={{ resize: 'none' }}
                            value={selectContent}
                        />
                    </Row>
                    <Row /* gutter={[20, 20]} */>
                        <Text>结果:</Text>
                        <TextArea
                            autoSize={{
                                minRows: 1,
                                maxRows: 20
                            }}
                            style={{ resize: 'none' }}
                            value={result}
                        />
                    </Row>
                </Paragraph>
                {/* <Paragraph>
                    <TextArea
                        style={{ height: 120, resize: 'none' }}
                    />
                </Paragraph> */}
                <Space>
                    <Button loading={loading} onClick={() => {
                        setLoading(true);
                        setTimeout(() => {
                            setLoading(false);
                            // Note: DEMO 效果示例测试
                            setResult(`"大叔，您要拍我吗？"

大叔笑着说道："不是不是，我在拍这只可爱的小松鼠呢。"
                            
我跟着看向他指的方向，果然看到了一只小松鼠正在树上玩耍。我也跟着陶醉在小松鼠的美丽身姿中。
                            
突然，手机里传来了一条新闻闹钟的提示，我赶紧打开新闻摘要：因新冠疫情的影响，全球范围内的旅游业都受到了前所未有的打击，许多旅游业者被迫关闭，很多人失业。
                            
我意识到，虽然疫情也给我的生活带来了一定的影响，但我和大叔这样能自由地外出旅行的人还是非常幸运的。我决定从现在开始，努力支持我们周围的小商家，为他们的生意和生活出一份力。`);
                        }, 2000);
                    // setResult(`生成内容示例:${Math.random()}`);
                    }}>生成</Button>
                    <Button>替换原始块(仅单块选区可用)</Button>
                    <Button>复制内容</Button>
                </Space>
            </Panel>
            
        </>
    );
};

export default Aigc;