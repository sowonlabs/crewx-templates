import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/ko/docs/intro">
            시작하기 - 5분 ⏱️
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}에 오신 것을 환영합니다`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              <div className={clsx('col col--4')}>
                <div className="text--center padding-horiz--md">
                  <h3>📝 AI 기반 자동 번역</h3>
                  <p>
                    한국어로 한 번 작성하면 CrewX 에이전트가 영어로 자동 번역합니다.
                    Claude AI 기반의 자연스럽고 전문적인 기술 블로그 번역을 제공합니다.
                  </p>
                </div>
              </div>
              <div className={clsx('col col--4')}>
                <div className="text--center padding-horiz--md">
                  <h3>🚀 바로 배포 가능</h3>
                  <p>
                    Docusaurus 3.9.2 버전이 고정되고 i18n 설정이 완료된 상태입니다.
                    복잡한 설정 없이 바로 문서 작성을 시작할 수 있습니다.
                  </p>
                </div>
              </div>
              <div className={clsx('col col--4')}>
                <div className="text--center padding-horiz--md">
                  <h3>🤖 3개의 AI 에이전트</h3>
                  <p>
                    콘텐츠 생성을 위한 블로그 매니저, 자동 번역을 위한 번역가,
                    안내형 설정을 위한 설치 도우미. CLI 또는 Slack으로 작업하세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
