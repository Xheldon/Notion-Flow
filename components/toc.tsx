import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Collapse, Empty } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';

import type { State, TocItem } from '$types';
import { getToc, locateHeading } from '$utils';
import store, { setToc } from '$store';

const { Panel } = Collapse;

const Toc = (props: any) => {
  const toc = useSelector((state: State) => state.toc.data);
  const [active, setActive] = useState(true);

  const _locateHeading = useCallback((key: string) => {
    return () => {
      locateHeading(key);
    };
  }, []);

  const onItemClick = useCallback(() => {
    setActive(!active);
  }, [active]);

  const getExtra = useCallback(() => {
    return (
      <ReloadOutlined
        // onClick={(e) => {
        //   e.stopPropagation();
        //   getToc();
        // }}
      />
    );
  }, []);

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

//   useEffect(() => {
//     window._fromMain('toc-update', (_, toc: TocItem[]) => {
//       store.dispatch(setToc(toc));
//     });
//     getToc();
//   }, []);

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
