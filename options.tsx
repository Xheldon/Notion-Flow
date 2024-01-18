import React, { useCallback } from "react";
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

import './styles.css';

import { Storage } from "@plasmohq/storage"

if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
}
if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
}
// Note: 自动切换
window.matchMedia('(prefers-color-scheme: dark)').addListener(function (mediaQueryList) {
    if (mediaQueryList.matches) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
    }
})
window.matchMedia('(prefers-color-scheme: light)').addListener(function (mediaQueryList) {
    if (mediaQueryList.matches) {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
    }
});

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
            link: 'https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#ed967849cdd047f6ac39492a6d6660c2',
            text: '如何获取腾讯云 SecretId',
        },
        message: '请输入腾讯云 SecretId',
        name: ['secretId']
    },
    {
        label: 'SecretKey',
        tooltips: {
            link: 'https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#ed967849cdd047f6ac39492a6d6660c2',
            text: '如何获取腾讯云 SecretKey',
        },
        message: '请输入腾讯云 SecretKey',
        name: ['secretKey']
    },
    {
        label: 'Bucket',
        tooltips: {
            link: 'https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#ed967849cdd047f6ac39492a6d6660c2',
            text: '如何获取腾讯云 Bucket',
        },
        message: '请输入腾讯云 Bucket',
        name: ['bucket']
    },
    {
        label: 'Region',
        tooltips: {
            link: 'https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#ed967849cdd047f6ac39492a6d6660c2',
            text: '如何获取腾讯云 Region',
        },
        message: '请输入腾讯云 Region',
        name: ['region']
    }, {
        label: 'CDN 地址',
        tooltips: {
            link: 'https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#ed967849cdd047f6ac39492a6d6660c2',
            text: '如何设置 CDN 地址',
        },
        message: '请输入 CDN 地址',
        name: ['cdn']
    },{
        label: '图片上传路径',
        tooltips: {
            link: 'https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#ed967849cdd047f6ac39492a6d6660c2',
            text: '图片路径支持的占位符格式',
        },
        message: '请输入图片上传路径',
        name: ['mediaPath']
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
        'heading-style': 'none', // Note: 默认是不显示分级标题
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
            },
            'filePath': '',
            'setNotionLastUpdateTime': true,
            'autoAddLastUpdateTime': true,
            'frontMatter': '',
            'trans-coverImg': true,
            'headerImgName': 'header-img',
            'trans-image': true,
            'trans-bookmark': true,
            'trans-callout': true,
            'trans-video': true,
            'trans-quote': true,
        },
        oss: {
            // enable: true,
            name: 'tx',
            tx: {
                secretId: '',
                secretKey: '',
                bucket: '',
                region: '',
                cdn: '',
                mediaPath: '', // Note: 支持通配符如 {{year}}/{{month}}/{{name}}
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
    const ossName = Form.useWatch(['oss', 'name'], form);
    const enableTransCover = Form.useWatch(['publisher', 'trans-coverImg'], form);

    const tooltips = useCallback((tooltip: { link: string; text: string }) => {
        return <div>参见:<a href={tooltip.link} target="_blank">{tooltip.text}</a></div>
    }, []);

    const onChange = useCallback((_: any, allValues: any) => {
        // console.log(changedValues, allValues);
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
                    <Divider orientationMargin='0' orientation="left" style={{ fontSize: 24 }}>设置</Divider>
                    <Form
                        form={form}
                        onValuesChange={onChange}
                        name='basic'
                        {...formItemLayout}
                        labelAlign='left'
                        initialValues={initialValues}
                    >
                        <Form.Item key={'heading-style'} label='Toc 样式' name='heading-style'>
                            <Radio.Group>
                                <Radio.Button value="text">文本（H1 H2 H3）</Radio.Button>
                                <Radio.Button value="number">数字（1. 2. 3.）</Radio.Button>
                                <Radio.Button value="none">无（仅缩进）</Radio.Button>
                            </Radio.Group>
                        </Form.Item>
                        <Paragraph><Text strong>后续将开放更多可配置选项，如是否滚动 Notion 时候使用动画、滚动速度、通知类型、主题颜色、Markdown 语法风格等，敬请期待。</Text></Paragraph>
                        <Divider />
                        <Form.Item
                            key={'publisher.enable'}
                            name={['publisher', 'enable']}
                            label="发布到 Github"
                            extra={
                                <>
                                    <Text>发布功能可以让你能够将 Notion 内容发布到 Github Pages<Text strong mark type="danger">（目前仅支持 Jekyll 博客系统）。</Text></Text>
                                    <br />
                                    <Text>在将来，还支持直接在插件中写 Github Pages 的 Jekyll 博客系统所支持的 Ruby 插件，以在博客中正确展示 Notion 的非 Markdown 标准模块，典型的有 Bookmark 模块。</Text>
                                    <br />
                                    <Text strong>您可以自由的选择是否启用发布功能，注意，这需要您熟悉 Github Person Token、Notion 集成、OSS Token 等相关概念。</Text>
                                </>
                            }>
                            <Switch />
                        </Form.Item>
                        <div style={{ display: enablePublisher ? 'block' : 'none' }}>
                            <Paragraph>
                                <Text mark>重要！使用前必读！</Text> <Text strong><Link href='https://xheldon.notion.site/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4' target='_blank'>发布等高级功能使用说明及答疑</Link></Text>。
                            </Paragraph>
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
                            <Form.Item
                                key={'oss.name'}
                                style={{ marginBottom: 10 }}
                                label='OSS 提供商'
                                name={['oss', 'name']}
                                labelAlign='right'
                                extra={
                                    <>
                                        <Text>Notion 图片地址有效期较短，因此获取 Notion 中的图片后需要及时转存到自己的 OSS 服务提供商中，必须配合 CDN 使用，否则裸连 OSS 费用高昂。</Text>
                                        <br />
                                        <Text>更多 OSS 服务提供商开发中...</Text>
                                    </>
                                }>
                                <Radio.Group>
                                    {Object.keys(ossFormItems).map(key => <Radio.Button key={key} value={key}>{ossNameMap[key]}</Radio.Button>)}
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
                            <Form.Item
                                key="filePath"
                                name={['publisher', 'filePath']}
                                labelAlign='right'
                                style={{ marginBottom: 10 }}
                                extra={
                                    <>
                                        <Text>在这里设置发布到 Github 仓库的文件路径，支持使用 {"{{}}"} 引用 Notion Page Property 的字段以及 YYYY、YY、MM、DD 等变量，详见：<Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#82254baee3524131b6b36a777e72fc0a' target='_blank'>如何使用内置处理插件？</Link></Text>
                                    </>
                                }
                                label={'上传文件路径'}>
                                <Input placeholder='输入发布到 Github 仓库的文件路径' />
                            </Form.Item>
                            <Form.Item
                                key="autoAddLastUpdateTime"
                                name={['publisher', 'autoAddLastUpdateTime']}
                                labelAlign='right'
                                style={{ marginBottom: 10 }}
                                extra={
                                    <>
                                        <Text>从 Notion Flow 发布博客的时候，自动添加一个固定的 lastUpdateTime 的字段到在 Front Matter 中，你可以在 Jekyll 博客中使用该字段，以告诉读者最后更新日期，详见：<Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#82254baee3524131b6b36a777e72fc0a' target='_blank'>如何使用内置处理插件？</Link></Text>
                                    </>
                                }
                                label={'自动添加 lastUpdateTime'}>
                                <Switch />
                            </Form.Item>
                            <Form.Item
                                key="setNotionLastUpdateTime"
                                name={['publisher', 'setNotionLastUpdateTime']}
                                labelAlign='right'
                                style={{ marginBottom: 10 }}
                                extra={
                                    <>
                                        <Text>从 Notion Flow 发布博客成功后，更新 Notion Page 的 lastUpdateTime Property，以方便你在 Notion 中查看该文章何时最后发布。需要提前添加好该字段。详见：<Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#82254baee3524131b6b36a777e72fc0a' target='_blank'>如何使用内置处理插件？</Link></Text>
                                    </>
                                }
                                label={'更新 Notion lastUpdateTime 字段'}>
                                <Switch />
                            </Form.Item>
                            <Form.Item
                                key="frontMatter"
                                name={['publisher', 'frontMatter']}
                                labelAlign='right'
                                style={{ marginBottom: 10}}
                                extra={
                                    <>
                                        <Text>一般情况你应该在 Pages 的 Property 中写与页面有关的 Front Matter，在这里写固定的 Front Matter，如我的使用 case 是设置一个 layout: post 属性。详见：<Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#82254baee3524131b6b36a777e72fc0a' target='_blank'>如何使用内置处理插件？</Link></Text>
                                    </>
                                }
                                label={'其他 Front Matter 字段'}>
                                <Input placeholder='输入将要在博客中使用的其他固定 Front Matter 字段，英文半角逗号分隔' />
                            </Form.Item>
                            <Form.Item
                                key="trans-coverImg"
                                name={['publisher', 'trans-coverImg']}
                                labelAlign='right'
                                style={{ marginBottom: 10 }}
                                extra={
                                    <>
                                        <Text>Notion Page 的头图，可以作为博客的头图，需要在下方设置字段后，在 Jekyll 博客中使用该信息（会上传到 OSS），用法详见：<Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#82254baee3524131b6b36a777e72fc0a' target='_blank'>如何使用内置处理插件？</Link></Text>
                                    </>
                                }
                                label={'使用 Notion 头图'}>
                                <Switch />
                            </Form.Item>
                            <Form.Item
                                key="headerImgName"
                                name={['publisher', 'headerImgName']}
                                labelAlign='right'
                                style={{ marginBottom: 10, display: enableTransCover ? 'block' : 'none' }}
                                /* extra={
                                    <>
                                        <Text>Notion Page 的头图，可以作为博客的头图，需要设置字段后，在 Jekyll 博客中使用该信息（会上传到 OSS）详见：<Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#82254baee3524131b6b36a777e72fc0a' target='_blank'>如何使用内置处理插件？</Link></Text>
                                    </>
                                } */
                                label={'头图字段'}>
                                <Input placeholder='输入将要在博客中使用的 Front Matter 字段，默认为 header-img' />
                            </Form.Item>
                            <Paragraph>
                                <Text strong>Notion 中含有非标准 Markdown 格式，如 Bookmark、Video。但是通过一定配置和少量代码书写，你也可以在自己博客上支持你想要的模块，需要一定样式设置。详见：<Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#82254baee3524131b6b36a777e72fc0a' target='_blank'>如何使用内置处理插件？</Link></Text>
                            </Paragraph>
                            <Form.Item
                                key="trans-image"
                                name={['publisher', 'trans-image']}
                                labelAlign='right'
                                style={{ marginBottom: 10 }}
                                label={'启用内置图片转换'}>
                                <Switch />
                            </Form.Item>
                            <Form.Item
                                key="trans-bookmark"
                                name={['publisher', 'trans-bookmark']}
                                labelAlign='right'
                                style={{ marginBottom: 10 }}
                                label={'启用内置 Bookmark 转换'}>
                                <Switch />
                            </Form.Item>
                            <Form.Item
                                key="trans-callout"
                                name={['publisher', 'trans-callout']}
                                labelAlign='right'
                                style={{ marginBottom: 10 }}
                                label={'启用内置 Callout 转换'}>
                                <Switch />
                            </Form.Item>
                            <Form.Item
                                key="trans-video"
                                name={['publisher', 'trans-video']}
                                labelAlign='right'
                                style={{ marginBottom: 10 }}
                                label={'启用内置 Video 转换'}>
                                <Switch />
                            </Form.Item>
                            <Form.Item
                                key="trans-quote"
                                name={['publisher', 'trans-quote']}
                                labelAlign='right'
                                style={{ marginBottom: 10 }}
                                label={'启用内置 Quoteblock 转换'}>
                                <Switch />
                            </Form.Item>
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
                                    <Text>插件的另一个典型用法是可以让你在发布成功之后，修改 Notoin 页面内容，如更新 lastUpdateTime 字段等。</Text>
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
                            一开始我的<Link href='https://www.xheldon.com/tech/my-blog-ci.html' target='_blank'>博客自动化</Link>是<Link href="https://www.xheldon.com/tech/use-craft-extension-to-write-blog.html" target="_blank">基于 Craft 的插件系统</Link>构建的<Link href='https://www.xheldon.com/tech/my-blog-ci-in-2022.html' target='_blank'>个人博客发布流程</Link>，还有一些<Link href='https://www.xheldon.com/tech/optimize-of-my-blog-2.html' target='_blank'>其他细节</Link>，甚至还<Link href='https://www.xheldon.com/tech/workflow-of-blog-publish-base-of-craft.html' target="_blank">做了个视频</Link>。后来因为<Link href='https://twitter.com/_Xheldon/status/1637481908136468480' target='_blank'>一些原因</Link>，转战到 Notion，构建了<Link href='https://twitter.com/_Xheldon/status/1669279758616793090' target='_blank'>一个 Electron 应用</Link>（未发布）。
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
                            
                        </Text>
                        <Text>
                            <Link href="https://t.me/+AN6Y9ngg8g9kNmVl" target="_blank">电报交流群</Link> &nbsp;&nbsp;&nbsp;
                            <Link href="https://twitter.com/_Xheldon" target="_blank">Twitter</Link> &nbsp;&nbsp;&nbsp;
                            <Link href="https://github.com/Xheldon/Notion-Flow-Prod/issues" target="_blank">Bug 反馈</Link> &nbsp;&nbsp;&nbsp;
                            <Link href="https://github.com/Xheldon/Notion-Flow-Prod/discussions" target="_blank">功能讨论</Link> 
                        </Text>

                    </Paragraph>
                </Col>
            </Row>
        </>
    );
}

export default OptionsIndex