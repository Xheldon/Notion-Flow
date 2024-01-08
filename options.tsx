import React, { useCallback, useState } from "react";
import {
    Typography,
    Row,
    Col,
    Divider,
    Form,
    Switch,
    Radio,
    Input,
    message
} from "antd";

import { Storage } from "@plasmohq/storage"

const storage = new Storage();

let config = null;

(async () => {
    config = await storage.get('options');
})();

const {
    Paragraph,
    Text,
    Link
} = Typography;

const publisherFormItems = [
    {
        label: 'Notion Token',
        tooltips: {
            link: 'https://www.xheldon.com',
            text: '如何获取 Notion Token',
        },
        message: '请输入 Notion Token',
        name: ['notion', 'token']
    },
    {
        label: 'Github Personal Token',
        tooltips: {
            link: 'https://www.xheldon.com',
            text: '如何获取 Github Token'
        },
        message: '请输入 Github Token',
        name: ['github', 'token'],
    },
    {
        label: 'Github 仓库',
        tooltips: {
            link: 'https://www.xheldon.com',
            text: '如何获取 Github Repo 名'
        },
        message: '请输入 Blog 所在的仓库名',
        name: ['github', 'repo']
    },
    {
        label: 'Github 分支',
        tooltips: {
            link: 'https://www.xheldon.com',
            text: '如何获取 Github Branch 名'
        },
        message: '请输入 Blog 分支名',
        name: ['github', 'branch']
    },
    {
        label: 'Github 用户名',
        tooltips: {
            link: 'https://www.xheldon.com',
            text: '如何获取 Github Owner 名'
        },
        message: '请输入 Github 用户名',
        name: ['github', 'owner']
    },
];

const ossNameMap = {
    tx: '腾讯云',
};

const ossFormItems = {
    tx: [{
        label: 'SecretId',
        tooltips: {
            link: 'https://www.xheldon.com',
            text: '如何获取腾讯云 SecretId',
        },
        message: '请输入腾讯云 SecretId',
        name: ['secretId']
    },
    {
        label: 'SecretKey',
        tooltips: {
            link: 'https://www.xheldon.com',
            text: '如何获取腾讯云 SecretKey',
        },
        message: '请输入腾讯云 SecretKey',
        name: ['secretKey']
    },
    {
        label: 'Bucket',
        tooltips: {
            link: 'https://www.xheldon.com',
            text: '如何获取腾讯云 Bucket',
        },
        message: '请输入腾讯云 Bucket',
        name: ['bucket']
    },
    {
        label: 'Region',
        tooltips: {
            link: 'https://www.xheldon.com',
            text: '如何获取腾讯云 Region',
        },
        message: '请输入腾讯云 Region',
        name: ['region']
    }, {
        label: 'CDN 地址',
        tooltips: {
            link: 'https://www.xheldon.com',
            text: '如何设置 CDN 地址',
        },
        message: '请输入 CDN 地址',
        name: ['cdn']
    }],
}

const formItemLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 14 },
}

let timer: any = 0;
function OptionsIndex() {
    const [messageApi, contextHolder] = message.useMessage();
    const [form] = Form.useForm();
    const initialValues = config || {
        'heading-style': 'text',
        publisher: {
            enable: false,
            notion: {
                token: '',
            },
            github: {
                token: '',
                repo: '',
                branch: '',
                owner: '',
            }
        },
        oss: {
            // enable: true,
            name: 'tx',
            tx: {
                secretId: '',
                secretKey: '',
                bucket: '',
                region: '',
                cdn: 'https://static.xheldon.cn',
            }
        },
        aigc: {
            enable: false
        },
        plugin: {
            enable: false
        },
    };

    const enablePublisher = Form.useWatch(['publisher', 'enable'], form);
    // const enableOss = Form.useWatch(['oss', 'enable'], form);
    const ossName = Form.useWatch(['oss', 'name'], form);

    const tooltips = useCallback((tooltip: { link: string; text: string }) => {
        return <div>参见:<a href={tooltip.link} target="_blank">{tooltip.text}</a></div>
    }, []);

    const onChange = useCallback((changedValues: any, allValues: any) => {
        console.log(changedValues, allValues);
        // TODO: 保存 allValues 到 storage
        clearTimeout(timer);
        timer = setTimeout(() => {
            (async () => {
                await storage.set('options', allValues);
            })();
            messageApi.open({
                type: 'success',
                content: '设置保存成功',
            });
        }, 1000);
    }, [form]);

    return (
        <>
            {contextHolder}
            <Row>
                <Col span={18} offset={3}>
                    <Divider orientationMargin='0' orientation="left" style={{ fontSize: 24 }}>设置（记得点保存）</Divider>
                    <Form
                        form={form}
                        onValuesChange={onChange}
                        name='basic'
                        {...formItemLayout}
                        labelAlign='left'
                        initialValues={initialValues}
                    >
                        <Form.Item label='Toc 样式' name='heading-style'>
                            <Radio.Group>
                                <Radio.Button value="text">文本（H1 H2 H3）</Radio.Button>
                                <Radio.Button value="number">数字（1. 2. 3.）</Radio.Button>
                                <Radio.Button value="none">无（仅缩进）</Radio.Button>
                            </Radio.Group>
                        </Form.Item>
                        <Divider />
                        <Form.Item
                            name={['publisher', 'enable']}
                            label="发布"
                            extra={
                                <>
                                    <Text>发布功能可以让你能够将 Notion 内容发布到 Github Pages。</Text>
                                    <br />
                                    <Text>在将来，还支持直接在插件中写 Github Pages 的 Jekyll 博客系统所支持的 Ruby 插件，以在博客中正确展示 Notion 的非 Markdown 标准模块，典型的有 Bookmark 模块。</Text>
                                    <br />
                                    <Text strong>您可以自由的选择是否启用发布功能，注意，这需要您熟悉 Github Person Token、Notion 集成、OSS Token 等相关概念。</Text>
                                </>
                            }>
                            <Switch />
                        </Form.Item>
                        <div style={{ display: enablePublisher ? 'block' : 'none' }}>
                            {publisherFormItems.map((item, key) => {
                                const { label, tooltips: _tooltips, message, name } = item;
                                const _name = name.slice();
                                _name.unshift('publisher');
                                return (
                                    <Form.Item
                                        key={name.toString()}
                                        style={{ marginBottom: 10 }}
                                        labelAlign='right'
                                        tooltip={tooltips(_tooltips)}
                                        rules={[{ required: true, message }]}
                                        name={_name}
                                        label={label}>
                                        <Input />
                                    </Form.Item>
                                );
                            })}
                        </div>
                        {/* <div style={{ display: enablePublisher ? 'block' : 'none' }}>
                            <Divider />
                            <Form.Item
                                name={['oss', 'enable']}
                                label="对象存储"
                                extra={
                                    <Text>Notion 图片地址有效期较短，因此获取 Notion 中的图片后需要及时转存到自己的 OSS 服务提供商中，强烈建议配合 CDN 使用，否则裸连 OSS 费用高昂。</Text>
                                }>
                                <Switch />
                            </Form.Item>
                        </div> */}
                        <div style={{ display: enablePublisher ? 'block' : 'none' }}>
                            <Form.Item
                                label='OSS 提供商'
                                name={['oss', 'name']}
                                labelAlign='right'
                                extra={
                                    <Text>Notion 图片地址有效期较短，因此获取 Notion 中的图片后需要及时转存到自己的 OSS 服务提供商中，强烈建议配合 CDN 使用，否则裸连 OSS 费用高昂。</Text>
                                }>
                                    <Radio.Group>
                                        {Object.keys(ossFormItems).map(key => <Radio.Button value={key}>{ossNameMap[key]}</Radio.Button>)}
                                    </Radio.Group>
                            </Form.Item>
                            <div style={{ display: (ossName && ossFormItems[ossName]) ? 'block' : 'none' }}>
                                {ossName && ossFormItems[ossName].map((item, key) => {
                                    const { label, tooltips: _tooltips, message, name } = item;
                                    const _name = name.slice();
                                    _name.unshift(form.getFieldValue(['oss', 'name']));
                                    _name.unshift('oss');
                                    return (
                                        <Form.Item
                                            key={name.toString()}
                                            style={{ marginBottom: 10 }}
                                            labelAlign='right'
                                            tooltip={tooltips(_tooltips)}
                                            rules={[{ required: true, message }]}
                                            name={_name}
                                            label={label}>
                                            <Input />
                                        </Form.Item>
                                    );
                                })}
                            </div>
                        </div>
                        <Divider />
                        <Form.Item
                            name={['aigc', 'enable']}
                            label="「AIGC」功能（敬请期待）"
                            extra={
                                <>
                                    <Text>AIGC 功能可以让你通过 OpenAI API 的形式来使用 AIGC 功能，虽然不如 Notion AI 方便（如需要选中内容，然后生成内容后再粘贴；或者选中块后再点击插入），但是其自由度更高，成本更低。</Text>
                                    <br />
                                    <Text strong>您可以自由的选择是否启用 AIGC 功能，注意，这需要您提供 OpenAI API。</Text>
                                </>
                            }>
                            <Switch disabled />
                        </Form.Item>
                        <Form.Item
                            name={['plugin', 'enable']}
                            label="「插件」功能（敬请期待）"
                            extra={
                                <>
                                    <Text>插件功能可以让你通过编写代码的方式，参与到 Notion 博客内容构建中去，如自定义 Notion Block 处理函数以生成特定格式内容，然后再自定义 Jekyll 插件来处理该特定内容以生成特定 HTML，典型的用法就是处理在 Notion 的非标准 Markdown 语法的 Bookmark 元素。</Text>
                                    <br />
                                    <Text strong>您可以自由的选择是否启用 插件爱你 功能，注意，这需要您熟悉 JavaScript 和 Ruby 以及 Notion API，同时理解本插件的构建原理。</Text>
                                </>
                            }>
                            <Switch disabled />
                        </Form.Item>
                    </Form>
                    <Divider orientationMargin='0' orientation="left" style={{ fontSize: 24 }}>关于</Divider>
                    <Paragraph>
                        <Text>
                            作者说：<br />
                            一开始我是<Link href="#" target="_blank">基于 Craft 的插件系统</Link>构建的个人博客发布流程，后来因为一些原因，转战到 Notion，构建了一个 Electron 应用（未发布）。
                        </Text>
                        <br />
                        <Text>
                            开发者邮箱: xheldoncao[at]gmail.com
                        </Text>
                        <br />
                        <Text>
                            开发者博客:  <Link href="https://www.xheldon.com" target="_blank">https://www.xheldon.com</Link>
                        </Text>
                        <br />
                        <Text>
                            <Link href="#" target="_blank">问题反馈</Link>
                            <Link href="#" target="_blank">讨论</Link>
                        </Text>

                    </Paragraph>
                </Col>
            </Row>
        </>
    );
}

export default OptionsIndex