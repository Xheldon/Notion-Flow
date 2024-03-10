import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Collapse, Empty } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { Storage } from "@plasmohq/storage"

import type { State, TocItem } from '$types';
import { _toContent } from '$utils';

const storage = new Storage();
const { Panel } = Collapse;

const tocStyleMap = {
  text: ['H1', 'H2', 'H3'],
  number: ['1.', '2.', '3.'],
  none: ['', '', ''],
};

const Toc = (props: any) => {
  const { req, cn, ...restProps } = props;
  const toc: TocItem[] = useSelector((state: State) => state.toc.data);
  const [active, setActive] = useState(true);

  const _locateHeading = useCallback((key: string) => {
    return async () => {
      const options = await storage.get('options');
      _toContent('toc-locate', {key, smooth: options?.['scroll-animation'] || true});
    };
  }, []);

  // Note: 「基本」 tab 下，当前只有「目录」一个功能，所以暂时始终展示，后面如果添加更多功能了再持久化状态
  const onItemClick = useCallback(() => {
    setActive(!active);
  }, [active]);

  const getExtra = useCallback(() => {
    return (
      <ReloadOutlined
        onClick={(e) => {
          e.stopPropagation();
          _toContent('toc-update');
        }}
      />
    );
  }, []);

  // TODO: 自定义 heading 展示样式
  const _Toc = useMemo(() => {
    if (toc?.length) {
      return toc.map((t) => {
        return (
          <Col
            onClick={_locateHeading(t.key)}
            offset={t.level - 1}
            className={'toc-item'}
            key={t.key}
          >{`${tocStyleMap[restProps.tocstyle][t.level - 1]} ${t.title}`}</Col>
        );
      });
    }
    return <Empty />;
  }, [toc, restProps.tocstyle]);

  useEffect(() => {
    // Noote: 组件加载后立即获取一次
    _toContent('toc-update');
  }, []);

  return (
    <Panel
      {...restProps}
      isActive={active}
      onItemClick={onItemClick}
      header={cn ? '目录' : 'TOC'}
      key={'toc'}
      extra={getExtra()}
    >
      {_Toc}
    </Panel>
  );
};

export default Toc;
