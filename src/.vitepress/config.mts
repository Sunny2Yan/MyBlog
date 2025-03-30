import { defineConfig } from 'vitepress'
import { set_sidebar } from './utils/auto_sidebar.js'

// const sidebarData = await set_sidebar("/docs");

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Yan's Blog",
  description: "This is my knowledge base, primarily documenting key insights from my studies and professional work.",
  head: [['link', {rel: 'icon', href: '/MyBlog/logo_1.png'}]],
  lastUpdated: true,
  base: '/MyBlog/',
  cleanUrls: true,
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
      {text: '代码', link: '/'},
      { text: '笔记', items: [
          {text: 'LLm', link: '/docs/notes/llm/first.md'}, // llm下的第一个文章
          {text: 'RL', link: '/docs/notes/rl/markov_decision.md'}]},
      {text: '论文', items: [
          {text: 'LLM', link: '/papers/llm/'},
          {text: 'Multimodal', link: '/papers/multimodal/'}
        ]},
      {text: '工具', items: [
          {text: 'Linux', link: '/tools/linux/'},
          {text: 'Python', link: '/tools/python/'},
          {text: 'C++', link: '/tools/c++/'},
          {text: 'Rust', link: '/tools/rust/'},
          {text: 'DataBase', link: '/tools/database/'},
          {text: 'Docker', link: '/tools/docker/'},
          {text: 'Configuration', link: '/tool/configuration/01_ini.md'},
          {text: 'Others', link: '/tools/others/01_setuptools.md'}
        ]},
      {text: '杂记', items: [
          {text: 'other', link: '/'}
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

