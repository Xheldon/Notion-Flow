import React, { useCallback, useEffect, useRef } from "react";
import {
    Typography,
    Row,
    Col,
    Divider,
    Form,
    Switch,
    Radio,
    Input,
    message,
    Button,
} from "antd";

import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';

import './styles.css';

import { Storage } from "@plasmohq/storage"
import { logToRenderer } from '$utils';

import * as Lang from '$lang';

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

const {
    Paragraph,
    Text,
    Link
} = Typography;

const publisherFormItems = (Locale) => {
    return [
        {
            label: Locale.Options.Publisher.Github.Token.Label,
            message: Locale.Options.Publisher.Github.Token.Message,
            name: ['github', 'token'],
            secret: true,
        },
        {
            label: Locale.Options.Publisher.Github.Repo.Label,
            message: Locale.Options.Publisher.Github.Repo.Message,
            name: ['github', 'repo']
        },
        {
            label: Locale.Options.Publisher.Github.Branch.Label,
            message: Locale.Options.Publisher.Github.Branch.Message,
            name: ['github', 'branch']
        },
        {
            label: Locale.Options.Publisher.Github.User.Label,
            message: Locale.Options.Publisher.Github.User.Message,
            name: ['github', 'owner']
        },
    ];
};

const ossNameMap = (Locale) => {
    return {
        tx: Locale.Options.Publisher.Oss.TX.Label,
        ali: Locale.Options.Publisher.Oss.ALI.Label,
        aws: Locale.Options.Publisher.Oss.AWS.Label,
    }
};

const ossFormItems = (Locale) => {
    return {
        tx: [{
            label: Locale.Options.Publisher.Oss.TX.SecretId.Label,
            message: Locale.Options.Publisher.Oss.TX.SecretId.Message,
            name: ['secretId'],
            secret: true,
        },
        {
            label: Locale.Options.Publisher.Oss.TX.SecretKey.Label,
            message: Locale.Options.Publisher.Oss.TX.SecretKey.Message,
            name: ['secretKey'],
            secret: true,
        },
        {
            label: Locale.Options.Publisher.Oss.TX.Bucket.Label,
            message: Locale.Options.Publisher.Oss.TX.Bucket.Message,
            name: ['bucket'],
            secret: true,
        },
        {
            label: Locale.Options.Publisher.Oss.TX.Region.Label,
            message: Locale.Options.Publisher.Oss.TX.Region.Message,
            name: ['region'],
            secret: true,
        }],
        ali: [{
            label: Locale.Options.Publisher.Oss.ALI.SecretId.Label,
            message: Locale.Options.Publisher.Oss.ALI.SecretId.Message,
            name: ['secretId'],
            secret: true,
        },
        {
            label: Locale.Options.Publisher.Oss.ALI.SecretKey.Label,
            message: Locale.Options.Publisher.Oss.ALI.SecretKey.Message,
            name: ['secretKey'],
            secret: true,
        },
        {
            label: Locale.Options.Publisher.Oss.ALI.Bucket.Label,
            message: Locale.Options.Publisher.Oss.ALI.Bucket.Message,
            name: ['bucket'],
            secret: true,
        },
        {
            label: Locale.Options.Publisher.Oss.ALI.Region.Label,
            message: Locale.Options.Publisher.Oss.ALI.Region.Message,
            name: ['region'],
            secret: true,
        }],
        aws: [{
            label: Locale.Options.Publisher.Oss.AWS.SecretId.Label,
            message: Locale.Options.Publisher.Oss.AWS.SecretId.Message,
            name: ['secretId'],
            secret: true,
        },
        {
            label: Locale.Options.Publisher.Oss.AWS.SecretKey.Label,
            message: Locale.Options.Publisher.Oss.AWS.SecretKey.Message,
            name: ['secretKey'],
            secret: true,
        },
        {
            label: Locale.Options.Publisher.Oss.AWS.Bucket.Label,
            message: Locale.Options.Publisher.Oss.AWS.Bucket.Message,
            name: ['bucket'],
            secret: true,
        },
        {
            label: Locale.Options.Publisher.Oss.AWS.Region.Label,
            message: Locale.Options.Publisher.Oss.AWS.Region.Message,
            name: ['region'],
            secret: true,
        }],
    };
};

const formItemLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 14 },
}

let timer: any = 0;
function OptionsIndex() {
    const [messageApi, contextHolder] = message.useMessage();
    const [form] = Form.useForm();
    const [config, setConfig] = React.useState(null);
    const [LocaleConfig, setLocaleConfig] = React.useState(null);
    // const initialValues = config || ;

    useEffect(() => {
        async function getConfig() {
            const _config: any = await storage.get('options');
            if (_config) {
                setConfig(_config);
            } else {
                setConfig({
                    language: 'cn', // Note: 默认英文界面
                    'heading-style': 'none', // Note: 默认是不显示分级标题
                    'scroll-animation': true, // Note: 默认是开启滚动动画
                    notion: {
                        token: '',
                    },
                    publisher: {
                        enable: false,
                        enableFrontMatter: true,
                        github: {
                            token: '',
                            repo: '',
                            branch: '',
                            owner: '',
                        },
                        filePath: '',
                        setNotionLastUpdateTime: true,
                        autoAddLastUpdateTime: true,
                        frontMatter: '',
                        headerImgName: 'header-img',
                        'trans-image': false,
                        'trans-bookmark': false,
                        'trans-callout': false,
                        'trans-video': false,
                        'trans-quote': false,
                    },
                    oss: {
                        // enable: true,
                        name: 'tx',
                        tx: {
                            secretId: '',
                            secretKey: '',
                            bucket: '',
                            region: '',
                        },
                        ali: {
                            secretId: '',
                            secretKey: '',
                            bucket: '',
                            region: '',
                        },
                        aws: {
                            secretId: '',
                            secretKey: '',
                            bucket: '',
                            region: '',
                        },
                        cdn: '',
                        mediaPath: '',
                    },
                    aigc: {
                        enable: false
                    },
                    plugin: {
                        enable: false
                    },
                });
            }
            setLocaleConfig(Lang[_config?.language || 'cn']);
        }
        getConfig();
    }, []);

    const enablePublisher = Form.useWatch(['publisher', 'enable'], form);
    const ossName = Form.useWatch(['oss', 'name'], form);

    const onChange = useCallback((changedValues: any, allValues: any) => {
        const {language} = changedValues;
        clearTimeout(timer);
        timer = setTimeout(() => {
            (async () => {
                await storage.set('options', allValues);
            })();
            const errors = form.getFieldsError();
            console.log('error:', errors);
            if (errors.some(e => e.errors.length > 0)) {
                messageApi.open({
                    type: 'error',
                    content: LocaleConfig.Options.Common.Message.OptionsSaveErr,
                });
            } else {
                messageApi.open({
                    type: 'success',
                    content: LocaleConfig.Options.Common.Message.OptionsSaveSucc,
                });
            }
            if (language) {
                window.location.reload();
            }
        }, 1000);
    }, [form, LocaleConfig]);

    const onDownloadConfig = useCallback(() => {
        try {
            const json = form.getFieldsValue();
            const url = URL.createObjectURL(new Blob([JSON.stringify(json)], { type: 'application/json' }));
            const a = document.createElement("a");
            const now = new Date();
            a.href = url;
            a.download = `notion-flow-${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}_${now.getMinutes()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            messageApi.open({
                type: 'success',
                content: LocaleConfig.Options.Common.Message.OptionsExportSucc,
            });
        } catch (e) {
            messageApi.open({
                type: 'error',
                content: LocaleConfig.Options.Common.Message.OptionsExportFail,
            });
        }
    }, [LocaleConfig]);

    const onUploadConfig = useCallback(() => {
        const inputElement = document.createElement('input');
        inputElement.type = 'file';
        inputElement.addEventListener('change', (event) => {
            const file = (event.target as any).files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target.result as string;
                    const jsonObj = JSON.parse(text);
                    console.log('导入配置文件:', jsonObj);
                    form.setFieldsValue(jsonObj);
                    messageApi.open({
                        type: 'success',
                        content: LocaleConfig.Options.Common.Message.OptionsImportSucc,
                    });
                } catch (e) {
                    messageApi.open({
                        type: 'error',
                        content: LocaleConfig.Options.Common.Message.OptionsImportFail,
                    });
                }
                
            };
            reader.readAsText(file);
        });
        inputElement.click();
    }, [LocaleConfig]);

    if (!LocaleConfig) return null;

    return (
        <>
            {contextHolder}
            <Row>
                <Col span={18} offset={3}>
                    <Divider orientationMargin='0' orientation="left" style={{ fontSize: 30 }}>
                        {LocaleConfig.Options.Common.ExportAndImport}
                    </Divider>
                    <Paragraph>
                        <Button onClick={onDownloadConfig} icon={<UploadOutlined />}>{LocaleConfig.Options.Common.Export}</Button>
                        <Divider type="vertical" />
                        <Button onClick={onUploadConfig} icon={<DownloadOutlined />}>{LocaleConfig.Options.Common.Import}</Button>
                    </Paragraph>
                    <Divider orientationMargin='0' orientation="left" style={{ fontSize: 30 }}>
                        {LocaleConfig.Options.Common.Basic}
                    </Divider>
                    <Form
                        form={form}
                        onValuesChange={onChange}
                        name='basic'
                        {...formItemLayout}
                        labelAlign='left'
                        initialValues={config}
                    >
                        <Form.Item
                            key={'language'}
                            style={{ marginBottom: 20 }}
                            label={LocaleConfig.Options.Basic.Language}
                            extra={
                                <Paragraph>
                                    <Text strong>{LocaleConfig.Options.Basic.ReloadRxplain}</Text>
                                </Paragraph>
                            }
                            name='language'>
                            <Radio.Group>
                                <Radio.Button value="cn">中文</Radio.Button>
                                <Radio.Button value="en">English</Radio.Button>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item
                            key={'heading-style'}
                            style={{ marginBottom: 20 }}
                            label={LocaleConfig.Options.Basic.Toc.Label}
                            name='heading-style'>
                            <Radio.Group>
                                <Radio.Button value="text">{LocaleConfig.Options.Basic.Toc.Text}</Radio.Button>
                                <Radio.Button value="number">{LocaleConfig.Options.Basic.Toc.Number}</Radio.Button>
                                <Radio.Button value="none">{LocaleConfig.Options.Basic.Toc.None}</Radio.Button>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item key={'scroll-animation'} label={LocaleConfig.Options.Basic.ScrollAnimation} name='scroll-animation'>
                            <Switch />
                        </Form.Item>
                        <Paragraph><Text strong>{LocaleConfig.Options.Basic.MoreFeature}</Text></Paragraph>
                        <Divider orientationMargin='0' orientation="left" style={{ fontSize: 30 }}>
                            {LocaleConfig.Options.Common.Advance}
                        </Divider>
                        <Form.Item
                            key={'notion'}
                            style={{ marginBottom: 20 }}
                            rules={[{required: true, message: LocaleConfig.Options.Notion.Message}]}
                            name={['notion', 'token']}
                            label={LocaleConfig.Options.Notion.Label}
                            extra={LocaleConfig.Options.Notion.Desc}>
                            <Input.Password />
                        </Form.Item>
                        <Divider />
                        <Form.Item
                            key={'publisher.enable'}
                            style={{ marginBottom: 20 }}
                            name={['publisher', 'enable']}
                            label={LocaleConfig.Options.Publisher.Common.PublishToGithub}
                            extra={LocaleConfig.Options.Publisher.Common.Desc}>
                            <Switch />
                        </Form.Item>
                        <div style={{ display: enablePublisher ? 'block' : 'none' }}>
                            <Paragraph>
                                {LocaleConfig.Options.Publisher.Common.Alert}
                            </Paragraph>
                            <Form.Item
                                key={'publisher.frontMatter'}
                                style={{ marginBottom: 20 }}
                                labelAlign='right'
                                name={['publisher', 'enableFrontMatter']}
                                label={LocaleConfig.Options.Publisher.Common.EnableFrontMatter.Label}
                                extra={LocaleConfig.Options.Publisher.Common.EnableFrontMatter.Desc}>
                                <Switch />
                            </Form.Item>
                            {publisherFormItems(LocaleConfig).map((item, key) => {
                                const { label, message, name, secret } = item;
                                const _name = name.slice();
                                _name.unshift('publisher');
                                return (
                                    <Form.Item
                                        key={name.toString()}
                                        style={{ marginBottom: 20 }}
                                        labelAlign='right'
                                        rules={[{ required: true, message }]}
                                        name={_name}
                                        label={label}>
                                        {secret ? <Input.Password /> : <Input />}
                                    </Form.Item>
                                );
                            })}
                            <Form.Item
                                key={'oss.name'}
                                style={{ marginBottom: 20 }}
                                label={LocaleConfig.Options.Publisher.Oss.Label}
                                name={['oss', 'name']}
                                labelAlign='right'
                                extra={LocaleConfig.Options.Publisher.Oss.Extra}>
                                <Radio.Group>
                                    {Object.keys(ossFormItems(LocaleConfig)).map(key => <Radio.Button key={key} value={key}>{ossNameMap(LocaleConfig)[key]}</Radio.Button>)}
                                </Radio.Group>
                            </Form.Item>
                            <div style={{ display: (ossName && ossFormItems(LocaleConfig)[ossName]) ? 'block' : 'none' }}>
                                {ossName && ossFormItems(LocaleConfig)[ossName].map((item, key) => {
                                    const { label, tooltips: _tooltips, message, name, secret } = item;
                                    const _name = name.slice();
                                    _name.unshift(form.getFieldValue(['oss', 'name']));
                                    _name.unshift('oss');
                                    return (
                                        <Form.Item
                                            key={name.toString()}
                                            style={{ marginBottom: 20 }}
                                            labelAlign='right'
                                            // tooltip={tooltips(_tooltips)}
                                            rules={[{ required: true, message }]}
                                            name={_name}
                                            label={label}>
                                            {secret ? <Input.Password /> : <Input />}
                                        </Form.Item>
                                    );
                                })}
                            </div>
                            <Form.Item
                                key={'oss.cdn'}
                                style={{ marginBottom: 20 }}
                                labelAlign='right'
                                rules={[{ required: true, message: LocaleConfig.Options.Publisher.Oss.CDN.Message }]}
                                name={['oss', 'cdn']}
                                label={LocaleConfig.Options.Publisher.Oss.CDN.Label}>
                                <Input />
                            </Form.Item>
                            <Form.Item
                                key={'oss.mediaPath'}
                                style={{ marginBottom: 20 }}
                                labelAlign='right'
                                rules={[{ required: true, message: LocaleConfig.Options.Publisher.Oss.MediaPath.Message }]}
                                name={['oss', 'mediaPath']}
                                label={LocaleConfig.Options.Publisher.Oss.MediaPath.Label}>
                                <Input />
                            </Form.Item>
                            <Form.Item
                                key="filePath"
                                name={['publisher', 'filePath']}
                                labelAlign='right'
                                style={{ marginBottom: 20 }}
                                rules={[{ required: true, message: LocaleConfig.Options.Publisher.Github.FilePath.Message }]}
                                /* tooltip={tooltips({
                                    link: 'https://www.xheldon.com',
                                    text: LocaleConfig.Options.Publisher.Github.FilePath.Tooltips,
                                })} */
                                extra={LocaleConfig.Options.Publisher.Github.FilePath.Extra}
                                label={LocaleConfig.Options.Publisher.Github.FilePath.Label}>
                                <Input placeholder={LocaleConfig.Options.Publisher.Github.FilePath.Placeholder} />
                            </Form.Item>
                            <Form.Item
                                key="autoAddLastUpdateTime"
                                name={['publisher', 'autoAddLastUpdateTime']}
                                labelAlign='right'
                                style={{ marginBottom: 20 }}
                                extra={LocaleConfig.Options.Publisher.Github.AddLastUpdateTime.Extra}
                                label={LocaleConfig.Options.Publisher.Github.AddLastUpdateTime.Label}>
                                <Switch />
                            </Form.Item>
                            <Form.Item
                                key="setNotionLastUpdateTime"
                                name={['publisher', 'setNotionLastUpdateTime']}
                                labelAlign='right'
                                style={{ marginBottom: 20 }}
                                extra={LocaleConfig.Options.Publisher.Github.UpdateNotionLastUpdateTime.Extra}
                                label={LocaleConfig.Options.Publisher.Github.UpdateNotionLastUpdateTime.Label}>
                                <Switch />
                            </Form.Item>
                            <Form.Item
                                key="frontMatter"
                                name={['publisher', 'frontMatter']}
                                labelAlign='right'
                                style={{ marginBottom: 20}}
                                extra={LocaleConfig.Options.Publisher.Github.FrontMatter.Extra}
                                label={LocaleConfig.Options.Publisher.Github.FrontMatter.Label}>
                                <Input placeholder={LocaleConfig.Options.Publisher.Github.FrontMatter.Placeholder} />
                            </Form.Item>
                            <Form.Item
                                key="headerImgName"
                                name={['publisher', 'headerImgName']}
                                labelAlign='right'
                                style={{ marginBottom: 20 }}
                                extra={LocaleConfig.Options.Publisher.Github.HeaderImgName.Extra}
                                label={LocaleConfig.Options.Publisher.Github.HeaderImgName.Label}>
                                <Input placeholder={LocaleConfig.Options.Publisher.Github.HeaderImgName.Placeholder} />
                            </Form.Item>
                            <Row>
                                <Col span={6}>
                                    <Paragraph style={{textAlign: 'right', marginRight: 10}}>
                                        {LocaleConfig.Options.Publisher.Github.Transform.Label}
                                    </Paragraph>
                                    </Col>
                                <Col span={14}>
                                    <Paragraph>
                                        {LocaleConfig.Options.Publisher.Github.Transform.Desc}
                                    </Paragraph>
                                </Col>
                            </Row>
                            <Row>
                                <Col offset={6} span={7}>
                                    <Form.Item
                                        key="trans-image"
                                        labelCol={{span: 10}}
                                        wrapperCol={{span: 10}}
                                        name={['publisher', 'trans-image']}
                                        labelAlign='right'
                                        style={{ marginBottom: 20 }}
                                        label={LocaleConfig.Options.Publisher.Github.Transform.Image}>
                                        <Switch />
                                    </Form.Item>
                                </Col>
                                <Col span={7}>
                                    <Form.Item
                                        key="trans-bookmark"
                                        labelCol={{span: 10}}
                                        wrapperCol={{span: 10}}
                                        name={['publisher', 'trans-bookmark']}
                                        labelAlign='right'
                                        style={{ marginBottom: 20 }}
                                        label={LocaleConfig.Options.Publisher.Github.Transform.Bookmark}>
                                        <Switch />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row>
                                <Col offset={6} span={7}>
                                    <Form.Item
                                        key="trans-callout"
                                        labelCol={{span: 10}}
                                        wrapperCol={{span: 10}}
                                        name={['publisher', 'trans-callout']}
                                        labelAlign='right'
                                        style={{ marginBottom: 20 }}
                                        label={LocaleConfig.Options.Publisher.Github.Transform.Callout}>
                                        <Switch />
                                    </Form.Item>
                                </Col>
                                <Col span={7}>
                                    <Form.Item
                                        key="trans-quote"
                                        labelCol={{span: 10}}
                                        wrapperCol={{span: 10}}
                                        name={['publisher', 'trans-quote']}
                                        labelAlign='right'
                                        style={{ marginBottom: 20 }}
                                        label={LocaleConfig.Options.Publisher.Github.Transform.Quoteblock}>
                                        <Switch />
                                    </Form.Item>
                                </Col>
                            </Row>
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
                            label={LocaleConfig.Options.AIGC.Label}
                            extra={LocaleConfig.Options.AIGC.Extra}>
                            <Switch disabled />
                        </Form.Item>
                        <Form.Item
                            name={['plugin', 'enable']}
                            label={LocaleConfig.Options.Plugin.Label}
                            extra={LocaleConfig.Options.Plugin.Extra}>
                            <Switch disabled />
                        </Form.Item>
                    </Form>
                    <Divider orientationMargin='0' orientation="left" style={{ fontSize: 30 }}>{LocaleConfig.Options.About.Label}</Divider>
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