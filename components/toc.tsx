import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Collapse, Empty } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';

import type { State, TocItem } from '$types';
import { _toContent } from '$utils';
import store, { setToc } from '$store';

const { Panel } = Collapse;

const Toc = (props: any) => {
  const toc = useSelector((state: State) => state.toc.data);
  const [active, setActive] = useState(true);

  const _locateHeading = useCallback((key: string) => {
    return () => {
      _toContent('toc-locate', key);
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
          >{`H${t.level} ${t.title}`}</Col>
        );
      });
    }
    return <Empty />;
  }, [toc]);

  useEffect(() => {
    // Noote: 组件加载后立即获取一次
    _toContent('toc-update');
  }, []);

  return (
    <Panel
      {...props}
      isActive={active}
      onItemClick={onItemClick}
      header={'目录'}
      key={'toc'}
      extra={getExtra()}
    >
      {_Toc}
    </Panel>
  );
};

export default Toc;
