import { defineConfig } from 'vitepress'
import { set_sidebar } from './utils/auto_sidebar.js'

// const sidebarData = await set_sidebar("/docs");

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Yan's Blog",
  description: "This is my knowledge base, primarily documenting key insights from my studies and professional work.",
  head: [['link', {rel: 'icon', href: '/logo_1.png'}]],
  lastUpdated: true,
  // base: '/base/',
  // rewrites: {
  //   'packages/:pkg/src/(.*)': ':pkg/index.md'
  // },
  themeConfig: {
    outlineTitle: '目录',
    outline: [2, 6],  // 生成2-6级标题
    logo: '/logo.png',  // 左上角logo
    // siteTitle: false,
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档',
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
            }
          }
        }
      }
    },
    // 导航栏
    nav: [
      { text: '家', link: '/' },
      {text: '代码', link: '/markdown-examples'},
      { text: '笔记', items: [
          {text: 'llm', link: '/docs/notes/llm/first.md'}, // llm下的第一个文章
          {text: 'rl', link: '/docs/notes/rl/aa.md'}]},
      {text: '论文', items: [
          {text: 'llm', link: '/'}
        ]}
    ],
    // 侧边栏
    sidebar: {"/docs": set_sidebar("/docs")},
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Sunny2Yan' }
    ],
    footer: {
      copyright: "Copyright © 2025-present <a href=\"https://github.com/Sunny2Yan\">Yan</a>"
    },
    // 广告支持
    // carbonAds: {
    //   code: 'your-carbon-code',
    //   placement: 'your-carbon-placement'
    // }
  },
  markdown: {
    math: true,  // 支持数学公式
    image: {
      lazyLoading: true  // 启用图片懒加载
    },
    lineNumbers: true,
  },
})

