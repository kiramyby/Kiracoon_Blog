import { defineConfig } from 'vitepress'

// https://github.com/mdit-plugins/mdit-plugins/tree/main/packages
import { tasklist } from '@mdit/plugin-tasklist'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/',
  head: [
    ['link', { rel: 'icon', href: 'https://blog.kiracoon.top/pic/avatar-hq.png' }]
  ],
  title: "Kiracoon",
  description: "Komm, süsser Tod.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: 'https://doc.k1r4ca.top/pic/avatar-hq.png',

    search: {
      provider: 'local'
    },

    nav: [
      { text: '🏠Home', link: '/' },
      { text: '🔖Archive', link: '/archive/' },
      { text: '🧠About', link: '/about' },
      { text: '📢BlogMoment', link: '/archive/blog' },
      { text: '💼BlogRepo', link: 'https://github.com/kiramyby/kiracoon_blog' }
    ],

    sidebar: {
      '/archive/': [ // 归档页面-概括性
          { // 技术类文章
            text: 'Tech',
            collapsed: false,
            items: [
              { // 一些语言基础和开发技术学习
                text: 'Development', link: '/archive/webdev/',
                collapsed: true,
                items:[
                  { text: 'Architecture', link: '/archive/webdev/archer/' },
                  { text: 'Go', link: '/archive/webdev/go/' },
                  { text: 'Java', link: '/archive/webdev/java/' },
                  { text: 'JavaScript', link: '/archive/webdev/js/' }
                ]
              },
              { // 参赛/比赛复现WP
                text: 'Competition', link: '/archive/compete/',
                // collapsed: true,
                // items: [
                //   { text: 'xxx CTF', link: '/archive/compete/xxxctf' }
                // ] 
              },

              { // CVE和可能的攻击点，可按语言/环境分类
                text: 'Vulnerability', link: '/archive/vuln/',
                // collapsed: true,
                // items: [
                //   { text: 'xxx', link: '/archive/Vuln/xxx' }
                // ]
              }

            ] },

          { // 生活类文章
            text: 'Life',
            collapsed: true,
            items: [
              { text: 'Rambling', link: '/archive/rab/' },
              { text: 'Summary', link: '/archive/sum/' }
            ] }
        ]

      },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/kiramyby',},
      { icon: 'twitter', link:'https://twitter.com/Kir4_C4'}
    ],

    lastUpdated: {
      text: 'Updated at',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium'
      }
    },

    footer: {
      message: '2023-present Kiracoon',
      // copyright: 'Copyright © 2023-present Kir4C4'
    }
  },

  markdown : {
    // markdown-it插件设置
    // https://vitepress.dev/zh/guide/markdown#advanced-configuration
    
    config: (md) => {
      md.use(tasklist)
    }
  },
  
})
