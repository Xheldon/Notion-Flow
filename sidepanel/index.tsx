import { ReloadOutlined, VerticalAlignTopOutlined } from "@ant-design/icons"
// import StickyBox from 'react-sticky-box';

import Toc from "$components/toc"
import { EventBus } from "$utils"
import { Button, Collapse, Layout, Tabs, theme, Tooltip } from "antd"
import React, { useCallback, useEffect } from "react"

import { getPort } from "@plasmohq/messaging/port"

// import Publisher from '$components/publisher';
// import Aigc from '$components/aigc';

import "./styles.css"

// import { logToRenderer } from '$utils';

// (async () => {
//     const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
//     var port = chrome.tabs.connect(tab.id, { name: "toc" });
//     // port.postMessage({joke: "Knock knock"});
//     port.onMessage.addListener(function(msg) {
//         if (msg.type === 'toc') {
//             port.postMessage({type: 'toc', content: 'sidePanel 知道了'});
//         }
//     });

// })();

chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (msg) {
        console.log('sidePanel 收到:', msg);
        port.postMessage({ type: 'toc', content: 'sidePanel 知道了'});
    });
});

function App() {
    console.log("这里是 sidePanel!!!!!!:")
    // useEffect(() => {
    //     // Note: 接受通用通知
    //     window._fromMain('notify', (_, props) => {
    //         logToRenderer('通知来啦:', props);
    //     });
    // }, []);
    const {
        token: { colorBgContainer }
    } = theme.useToken()

    useEffect(() => {
        document.body.addEventListener('click', () => {
            chrome.tabs.query({active: true, lastFocusedWindow: true}, ([tab]) => {
                const port = chrome.tabs.connect(tab.id, {name: 'toc'});
                port.postMessage({type: 'toc', content: 'sidePanel 要你定位！'});
                port.onMessage.addListener(function(msg) {
                    console.log('牛逼，我服了');
                });
            })
        });
    }, []);

    // const backToTop = useCallback(() => {
    //     window._toMain('notion-page-backtop');
    // }, []);

    // const refreshNotionPage = useCallback(() => {
    //     window._toMain('notion-page-reload');
    // }, []);

    return (
        <Layout style={{ padding: 10 }}>
            <Tabs
                size={"small"}
                type={"card"}
                defaultActiveKey={"basic"}
                tabBarExtraContent={{
                    right: (
                        <>
                            <Tooltip title={"Notion 返回顶部"}>
                                <Button type={"link"} size={"small"} /* onClick={backToTop} */>
                                    <VerticalAlignTopOutlined />
                                </Button>
                            </Tooltip>
                            <Tooltip title={"Notion 刷新页面"}>
                                <Button
                                    type={"link"}
                                    size={"small"} /* onClick={refreshNotionPage} */
                                >
                                    <ReloadOutlined />
                                </Button>
                            </Tooltip>
                        </>
                    )
                }}
                renderTabBar={(props, DefaultBar) => {
                    return null
                    // <StickyBox offsetTop={0} style={{zIndex: 1}}>
                    //     <DefaultBar
                    //         {...props}
                    //         style={{
                    //             backgroundColor: colorBgContainer,
                    //             paddingTop: 10
                    //         }}
                    //     />
                    // </StickyBox>
                }}
                items={[
                    {
                        key: "basic",
                        label: "基本",
                        children: (
                            <Collapse size="small" activeKey={["basic"]}>
                                <Toc />
                            </Collapse>
                        )
                    },
                    // {
                    //     key: 'publisher',
                    //     label: '发布',
                    //     children: (
                    //         <Collapse size="small">
                    //             <Publisher />
                    //         </Collapse>
                    //     ),
                    // },
                    // {
                    //     key: 'ai',
                    //     label: 'AIGC',
                    //     children: (
                    //         <Collapse size="small">
                    //             <Aigc />
                    //         </Collapse>
                    //     ),
                    // },
                    {
                        key: "plugin",
                        label: "插件",
                        children: <div>插件列表</div>
                    }
                ]}
            />
        </Layout>
    )
}

export default App
