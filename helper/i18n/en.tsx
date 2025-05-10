import { Typography } from "antd"
import React from "react"

const { Text, Link } = Typography

export default {
  Options: {
    Common: {
      More: "See more",
      Export: "Export configuration",
      Import: "Import configuration",
      ExportAndImport: "Import and export",
      Basic: "Basic",
      Advance: "Advanced",
      Message: {
        OptionsSaveSucc: "Settings saved successfully",
        OptionsSaveErr: "Some required fields have errors, please check!",
        OptionsExportSucc: "Configuration exported successfully",
        OptionsExportFail: "Configuration export failed",
        OptionsImportSucc: "Configuration imported successfully",
        OptionsImportFail: "Configuration import failed"
      }
    },
    Basic: {
      Toc: {
        Label: "Heading style",
        Text: "Text (H1 H2 H3)",
        Number: "Number (1. 2. 3.)",
        None: "None (just indentation)"
      },
      ScrollAnimation: "Heading positioning animation",
      Language: "Language",
      ReloadRxplain:
        "Modifying this will refresh this page and the plugin interface",
      MoreFeature:
        "More configurable options will be available in the future, such as animation scroll speed when scrolling Notion, notification types, theme colors, Markdown syntax styles, etc., so stay tuned."
    },
    Notion: {
      Label: "Notion API Token",
      Message: "Please enter Notion Token",
      Desc: (
        <>
          <Text type="secondary">
            Notion Flow needs to use the Notion Integration Token to access
            Notion content. For more information on how to obtain it, please
            refer to{" "}
            <Link
              href="https://notion-flow.xheldon.com/en/docs/advanced/publishing/before-starting/notion"
              target="_blank">
              Notion Configuration
            </Link>
            .
          </Text>
        </>
      )
    },
    Publisher: {
      Common: {
        PublishToGithub: "Publish to Github",
        EnableFrontMatter: {
          Label: "Enable Front Matter",
          Desc: (
            <>
              <Text type="secondary">
                If your blogging system supports Front Matter, you need to
                enable this option, such as Jekyll, VitePress, Hugo, etc. This
                will insert content at the top of the Markdown content wrapped
                in three backticks `---`, which is the Front Matter. For more
                details, see{" "}
                <Link
                  href="https://notion-flow.xheldon.com/en/docs/advanced/publishing/plugin-configuration#enable-front-matter"
                  target="_blank">
                  Enable Front Matter
                </Link>
                .
              </Text>
              <br />
              <Text strong type="secondary">
                Note that if this option is turned off, the "add lastUpdateTime"
                setting at the bottom of this page will also be invalid.
              </Text>
            </>
          )
        },
        Desc: (
          <>
            <Text type="secondary">
              The publishing function allows you to publish Notion content in
              Markdown format to Github Pages, see below for more configuration.
            </Text>
            <br />
            <Text type="secondary" strong>
              Note that you need to be familiar with Github Personal Token,
              Notion Integration Token, OSS Token, CDN, and other related
              concepts.
            </Text>
          </>
        ),
        Alert: (
          <>
            <Text strong type="danger">
              Important! Read before use:
            </Text>
            <Text strong>
              <Link
                href="https://notion-flow.xheldon.com/en/docs/advanced/publishing/workflow"
                target="_blank">
                Publishing Function Instructions
              </Link>
            </Text>
          </>
        )
      },
      Github: {
        Token: {
          Label: "Github Personal Token",
          Tooltips: "How to get Github Token",
          Message: "Enter Github Token"
        },
        Repo: {
          Label: "Github Repository",
          Tooltips: "How to get Github Repo Name",
          Message: "Enter the name of the repository where the blog is located"
        },
        Branch: {
          Label: "Github Branch",
          Tooltips: "How to get the Github branch name",
          Message: "Enter the blog repository branch name"
        },
        User: {
          Label: "Github Username",
          Tooltips: "How to get Github Username",
          Message: "How to get the Github Username"
        },
        FilePath: {
          Label: "Upload file path",
          Placeholder:
            "Enter the file path to be uploaded to the Github repository",
          Extra: (
            <>
              <Text type="secondary">
                Set the file path to be uploaded to the Github repository here,
                supporting the use of {"{{}}"} to reference Notion Page
                Properties fields as well as variables such as YYYY, YY, MM, DD,
                etc. For more details, see:{" "}
                <Link
                  href="https://notion-flow.xheldon.com/en/docs/advanced/publishing/plugin-configuration#file-upload-path--image-path"
                  target="_blank">
                  Upload file path/image path
                </Link>
              </Text>
            </>
          ),
          Tooltips: "How to set the upload file path",
          Message: "Enter the upload file path"
        },
        AddLastUpdateTime: {
          Label: 'Add "lastUpdateTime"',
          Extra: (
            <>
              <Text type="secondary">
                <Text strong> (Front Matter needs to be enabled) </Text> When
                publishing a blog from Notion Flow, automatically add a fixed
                "lastUpdateTime" field to the Front Matter. You can use this
                field in the blog to tell readers the last update date. For more
                details, see:{" "}
                <Link
                  href="https://notion-flow.xheldon.com/en/docs/advanced/publishing/plugin-configuration#automatically-add-lastupdatetime"
                  target="_blank">
                  {" "}
                  Automatically add lastUpdateTime
                </Link>
              </Text>
            </>
          )
        },
        UpdateNotionLastUpdateTime: {
          Label: 'Update "lastUpdateTime"',
          Extra: (
            <>
              <Text type="secondary">
                After successfully publishing a blog from Notion Flow, update
                the Notion Page's lastUpdateTime Property for you to view when
                the article was last published in Notion. This field needs to be
                added in advance. For more details, see:{" "}
                <Link
                  href="https://notion-flow.xheldon.com/en/docs/advanced/publishing/plugin-configuration#automatically-update-lastupdatetime"
                  target="_blank">
                  {" "}
                  Automatically update lastUpdateTime
                </Link>
              </Text>
            </>
          )
        },
        FrontMatter: {
          Label: "Other Front Matter fields",
          Extra: (
            <>
              <Text type="secondary">
                <Text strong> (Front Matter needs to be enabled) </Text> In
                general, you should write Front Matter related to the page in
                the Pages Property. Write fixed Front Matter here, such as my
                use case, to set a layout: post attribute for each blog article
                published through Notion Flow. For more details, see:{" "}
                <Link
                  href="https://notion-flow.xheldon.com/en/docs/advanced/publishing/plugin-configuration#other-front-matter-fields"
                  target="_blank">
                  {" "}
                  Other Front Matter fields
                </Link>
              </Text>
            </>
          ),
          Placeholder:
            "Enter other fixed Front Matter fields to be used in the blog, separated by English commas"
        },
        HeaderImgName: {
          Label: "Header image field name",
          Extra: (
            <>
              <Text type="secondary">
                <Text strong> (Front Matter needs to be enabled) </Text> The
                header image of the Notion Page can be used as the header image
                of the blog. Set here which field of Noiton header image will be
                set as Front Matter, then use this field in the blog (the image
                will be uploaded to OSS).{" "}
                <Text italic type="secondary">
                  {" "}
                  (Leave blank if not used){" "}
                </Text>{" "}
                For more details, see:{" "}
                <Link
                  href="https://notion-flow.xheldon.com/en/docs/advanced/publishing/plugin-configuration#front-matter-fields-for-header-images"
                  target="_blank">
                  Head image Front Matter fields
                </Link>
              </Text>
            </>
          ),
          Placeholder: "Leave blank if not in use"
        }
        /* Transform: {
                Label: 'Module Conversion:',
                Desc: (
                    <>
                        <Text strong type="warning"> Currently only supports the Jekyll blogging system, and will consider user feedback to support more blogging systems in the future, so stay tuned! </Text>
                        <Text type="secondary">Notion contains non-standard Markdown formats, such as Bookmark, Video. However, with certain configurations and a small amount of code writing, you can also support the modules you want on your own blog, which requires some style settings. For more details, see: <Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#82254baee3524131b6b36a777e72fc0a' target='_blank'>How to use built-in processing plug-ins?</Link></Text>
                    </>
                ),
                Image: 'Image',
                Bookmark: 'Bookmark',
                Callout: 'Callout',
                Quoteblock: 'Quoteblock',
                } */
      },
      Oss: {
        Label: "OSS Service Provider",
        Extra: (
          <>
            <Text type="secondary">
              The validity period of the Notion image address is short, so after
              obtaining the image in Notion, it needs to be promptly stored in
              your own OSS service provider and must be used with CDN, otherwise
              the cost of direct connection to the OSS is high. Configuration
              instructions can be found in{" "}
              <Link
                href="https://notion-flow.xheldon.com/en/docs/advanced/publishing/before-starting/oss/"
                target="_blank">
                Image Upload
              </Link>
              .
            </Text>
            <Text strong type="secondary">
              If this field is not filled in, filled in incompletely, or filled
              in incorrectly, the Notion module to Markdown conversion process
              will ignore the module such as images and videos.
            </Text>
          </>
        ),
        TX: {
          Label: "Tencent Cloud",
          SecretId: {
            Label: "SecretId",
            Message: "Please enter Tencent Cloud SecretId"
          },
          SecretKey: {
            Label: "SecretKey",
            Message: "Please enter Tencent Cloud SecretKey"
          },
          Bucket: {
            Label: "Bucket",
            Message: "Please enter Tencent Cloud Bucket"
          },
          Region: {
            Label: "Region",
            Message: "Please enter Tencent Cloud Region"
          }
        },
        ALI: {
          Label: "Alibaba Cloud",
          SecretId: {
            Label: "AccessKey Id",
            Tooltips: "How to get Alibaba Cloud AccessKey Id",
            Message: "Please enter Alibaba Cloud AccessKey Id"
          },
          SecretKey: {
            Label: "AccessKey Secret",
            Message: "Please enter Alibaba Cloud AccessKey Secret"
          },
          Bucket: {
            Label: "Bucket",
            Message: "Please enter Alibaba Cloud Bucket"
          },
          Region: {
            Label: "Region",
            Message: "Please enter Alibaba Cloud Region"
          }
        },
        AWS: {
          Label: "AWS",
          SecretId: {
            Label: "Access key",
            Message: "Please enter AWS Access key"
          },
          SecretKey: {
            Label: "Secret Access Key",
            Message: "Please enter AWS Secret Access Key"
          },
          Bucket: {
            Label: "Bucket",
            Message: "Please enter AWS Bucket"
          },
          Region: {
            Label: "Region",
            Message: "Please enter AWS Region"
          },
          Endpoint: {
            Label: "Endpoint",
            Message: "Please enter self-host Endpoint (Optional)",
            Extra: (
              <Text>
                (Please leave blank for official AWS S3) Supports self-hosted
                OSS compatible with the AWS S3 API. You can enter the Endpoint
                here, such as{" "}
                <Link href="https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/">
                  Clouldflare R2
                </Link>{" "}
                and others.
              </Text>
            )
          }
        },
        CDN: {
          Label: "CDN Address",
          Message: "Please enter CDN Address",
          Extra: (
            <>
              <Text type="secondary">
                For detailed usage instructions, please refer to{" "}
                <Link
                  href="https://notion-flow.xheldon.com/en/docs/advanced/publishing/before-starting/oss/cdn"
                  target="_blank">
                  Why do we need CDN?
                </Link>
                .
              </Text>
              <Text strong type="secondary">
                If this field is not filled in (Notion Flow does not verify its
                usability), the Notion module to Markdown conversion process
                will ignore modules such as images and videos.
              </Text>
            </>
          )
        },
        MediaPath: {
          Label: "Image Path",
          Message: "Please enter Image Path",
          Extra: (
            <>
              <Text type="secondary">
                Supports wildcards, for detailed usage instructions, please
                refer to{" "}
                <Link
                  href="https://notion-flow.xheldon.com/en/docs/advanced/publishing/plugin-configuration#upload-file-path-image-path"
                  target="_blank">
                  Upload File Path/Image Path
                </Link>
                .
              </Text>
              <Text strong type="secondary">
                If this field is not filled in or filled in incorrectly (Notion
                Flow does not verify its usability, but if filled in
                incorrectly, the image will fail to upload), the Notion module
                to Markdown conversion process will ignore modules such as
                images and videos.
              </Text>
            </>
          )
        }
      }
    },
    AIGC: {
      Label: "AI (coming soon)",
      Extra: (
        <>
          <Text type="secondary">
            The AIGC function allows you to use the AIGC function in the form of
            the OpenAI API. Although it is not as convenient as Notion AI (such
            as needing to select content, then generate content and paste it, or
            select a block and click insert), it offers higher flexibility and
            lower cost.
          </Text>
          <br />
          <Text strong type="secondary">
            You can freely choose whether to enable the AIGC function, but
            please note that you will need to provide the OpenAI API.
          </Text>
        </>
      )
    },
    Plugin: {
      Label: "Plugin (coming soon)",
      Extra: (
        <>
          <Text type="secondary">
            The plugin function allows you to participate in the construction of
            Notion blog content through coding, such as customizing Notion Block
            processing functions to generate specific format content, and then
            customizing blog plugins (such as Jekyll's ruby plugins) to process
            this specific content to generate specific HTML. A typical use case
            is handling Bookmark elements with non-standard Markdown syntax in
            Notion.
          </Text>
          <br />
          <Text type="secondary">
            Another typical use case for plugins is to allow you to modify
            Notion page content after successful publication, such as updating
            the lastUpdateTime field.
          </Text>
          <br />
          <Text strong type="secondary">
            You can freely choose whether to enable the Plugin function, but
            please note that you need to be familiar with JavaScript and Ruby as
            well as the Notion API, and understand the construction principles
            of this plugin.
          </Text>
        </>
      )
    },
    About: {
      Label: "About",
      Donate: "https://notion-flow.xheldon.com/support-me",
      Version: "https://notion-flow.xheldon.com/en/blog/2025/05/10/0.4.4"
    }
  }
}
