import React from 'react';
import {Typography} from 'antd';

const {Text, Link} = Typography;

export default {
    Options: {
        Common: {
            More: 'See',
            Export: 'Export Setting',
            Import: 'Import Setting',
            ExportAndImport: 'Import & Export',
            Basic: 'Basic',
            Advance: 'Advance',
            Message: {
                OptionsSaveSucc: 'Setting saved successfully',
                OptionsExportSucc: 'Export setting successfully',
                OptionsExportFail: 'Export setting failed',
                OptionsImportSucc: 'Import setting successfully',
                OptionsImportFail: 'Import setting failed',
            },
        },
        Basic: {
            Toc: {
                Label: 'Heading Style',
                Text: 'Text（H1 H2 H3）',
                Number: 'Number（1. 2. 3.）',
                None: 'None（Only Intent）'
            },
            ScrollAnimation: 'Locate Heading Animation',
            MoreFeature: 'More configurable options will be made available later on, such as whether to use animations when scrolling in Notion, scroll speed, types of notifications, theme colors, Markdown syntax styles, etc. Please stay tuned.',
        },
        Publisher: {
            Common : {
                PublishToGithub: 'Publish to Github',
                Desc: (
                <>
                    <Text>The Publisher function allows you to publish content from Notion to GitHub Pages<Text strong mark type="danger">(Currently only supports Jekyll blogging system.).</Text></Text>
                    <br />
                    <Text>In the future, it will also support writing Ruby plugins directly in the plugin that are supported by the Jekyll blog system for Github Pages. This will allow the correct display of Notion's non-standard Markdown modules in the blog, with the Bookmark module being a typical example.</Text>
                    <br />
                    <Text strong>You are free to choose whether to enable the publishing function, but please be aware that this requires you to be familiar with concepts such as Github Personal Token, Notion integration, OSS Token, etc.</Text>
                </>),
                Alert: (
                    <>
                        <Text mark>Important! Must Read Before Use!</Text>
                        <Text strong><Link href='https://xheldon.notion.site/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4' target='_blank'>Issuance of Instructions and Q&A for Advanced Features Usage</Link></Text>.
                    </>
                )
            },
            Notion: {
                Label: 'Notion Token',
                Tooltips: 'How to get notion token',
                Message: 'Notion token is required',
            },
            Github: {
                Token: {
                    Label: 'Github Personal Token',
                    Tooltips: 'How to get github personal token',
                    Message: 'Github personal token is required',
                },
                Repo: {
                    Label: 'Github repo',
                    Tooltips: 'How to get github repo name',
                    Message: 'Repo name is required',
                },
                Branch: {
                    Label: 'Github branch',
                    Tooltips: 'How to get github branch name',
                    Message: 'Branch name is required',
                },
                User: {
                    Label: 'Github owner',
                    Tooltips: 'How to get github username',
                    Message: 'Owner is required',
                },
                FilePath: {
                    Label: 'Upload file Path',
                    Placeholder: 'Please enter the file path to publish to the Github repository.',
                    Extra: (
                        <>
                            <Text>Set the file path to publish to the Github repository here, with support for using {"{{}}"} to reference Notion Page Property fields, as well as variables such as YYYY, YY, MM, DD, etc. See details: <Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#82254baee3524131b6b36a777e72fc0a' target='_blank'>How to set up the file upload path?</Link></Text>
                        </>
                    ),
                },
                AddLastUpdateTime: {
                    Label: 'Auto Add \'lastUpdateTime\'',
                    Extra: (
                        <>
                            <Text>When publishing a blog from Notion Flow, automatically add a fixed 'lastUpdateTime' field to the Front Matter, which you can use in your Jekyll blog to inform readers of the last update date, see details:<Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#82254baee3524131b6b36a777e72fc0a' target='_blank'>How to use lastUpdateTime?</Link></Text>
                        </>
                    ),
                },
                UpdateNotionLastUpdateTime: {
                    Label: 'Update the \'lastUpdateTime\' field in Notion',
                    Extra: (
                        <>
                            <Text>After successfully publishing a blog from Notion Flow, update the lastUpdateTime Property on the Notion Page. This will allow you to easily see when the article was last posted in Notion. You will need to add this field to the Notion Page's Property in advance. See the detailed information for further instructions. See details:<Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#82254baee3524131b6b36a777e72fc0a' target='_blank'>How to check the last published time of a page in Notion?</Link></Text>
                        </>
                    ),
                },
                FrontMatter: {
                    Label: 'Fixed Front Matter',
                    Extra: (
                        <>
                            <Text>Under normal circumstances, you should write the Front Matter related to the page within the Property section of Pages. Here, you can write fixed Front Matter. For example, in my use case, I set a 'layout: post' property for each blog post published through Notion Flow. See details: <Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#82254baee3524131b6b36a777e72fc0a' target='_blank'>How to set up a fixed Front Matter?</Link></Text>
                        </>
                    ),
                    Placeholder: 'Enter the additional fixed Front Matter fields to be used in the blog, separated by English commas.'
                },
                HeaderImgName: {
                    Label: 'Header image name',
                    Extra: (
                        <>
                            <Text>The header image of the Notion Page can be used as the header image for the blog. You need to set which field in the Front Matter to correspond to the Notion header image. Then, use this field in the Jekyll blog (the image will be uploaded to OSS). <Text italic>(Leave blank if not applicable)</Text>See details: <Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#f3b5e0d7e5b94f2a9f3f7f8c5a9a6e7b' target='_blank'>How to set up a header image?</Link></Text>
                        </>
                    ),
                    Placeholder: 'Leave blank if not applicable'
                },
                Transform: {
                    Desc: (
                        <Text strong>Notion contains non-standard Markdown formats, such as Bookmarks and Video. However, with some configuration and a bit of coding, you can also support the modules you want on your own blog, although this will require certain style settings. See details:<Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#82254baee3524131b6b36a777e72fc0a' target='_blank'>如何使用内置处理插件？</Link></Text>
                    ),
                    Image: 'Image conversion',
                    Bookmark: 'Bookmark conversion',
                    Callout: 'Callout conversion',
                    Quoteblock: 'Quoteblock conversion',

                }
            },
            Oss: {
                Label: 'OSS Service Provider',
                Extra: (
                    <>
                        <Text>Notion image URLs have a short validity period, so after retrieving images from Notion, it is necessary to promptly transfer them to your own OSS (Object Storage Service) provider. It is essential to use in conjunction with a CDN (Content Delivery Network); otherwise, the costs of directly connecting to the OSS are exorbitant.</Text>
                        <br />
                        <Text strong italic>More OSS service providers are in development...</Text>
                    </>
                ),
                TX: {
                    Label: 'Tencent Cloud',
                    SecretId: {
                        Label: 'SecretId',
                        Tooltips: 'How to get tecent cloud secretId',
                        Message: 'SecretId is required'
                    },
                    SecretKey: {
                        Label: 'SecretKey',
                        Tooltips: 'How to get tecent cloud SecretKey',
                        Message: 'SecretKey is required'
                    },
                    Bucket: {
                        Label: 'Bucket',
                        Tooltips: 'How to get tecent cloud bucket',
                        Message: 'Bucket is required'
                    },
                    Region: {
                        Label: 'Region',
                        Tooltips: 'How to get tecent cloud region',
                        Message: 'Region is required'
                    },
                    CDN: {
                        Label: 'CDN address',
                        Tooltips: 'How to set tecent cloud CDN address',
                        Message: 'Cdn address is required'
                    },
                    MediaPath: {
                        Label: 'Media path',
                        Tooltips: 'How to set tecent cloud media path',
                        Message: 'Media path is required'
                    },
                },
            },
        },
        AIGC: {
            Label: 'AI(coming soon)',
            Extra: (
                <>
                    <Text>The AIGC functionality allows you to use AIGC features through the OpenAI API, which is not as convenient as Notion AI (for example, needing to select content, generate content then paste it; or selecting a block before clicking to insert), but it offers greater flexibility and is more cost-effective.</Text>
                    <br />
                    <Text strong>You are free to choose whether to enable the AIGC feature, please note that this requires you to provide the OpenAI API.</Text>
                </>
            ),
        },
        Plugin: {
            Label: 'Plugin(coming soon)',
            Extra: (
                <>
                    <Text>Plugin features allow you to participate in the construction of Notion blog content by writing code. For example, you can create custom Notion Block processing functions to generate content in specific formats, and then customize Jekyll plugins to handle that specific content to generate particular HTML. A typical use case is handling Bookmark elements in Notion that use non-standard Markdown syntax.</Text>
                    <br />
                    <Text>Another typical use of a plugin is that it allows you to modify the content of a Notion page after a successful publication, such as updating the 'lastUpdateTime' field, etc.</Text>
                    <br />
                    <Text strong>You are free to choose whether or not to activate the "Plugin Love You" feature. Please note that this requires you to be familiar with JavaScript and Ruby as well as the Notion API, and to understand the principles behind the construction of this plugin.</Text>
                </>
            ),
        },
        About: {
            Labe: 'About',
        }
    }
}