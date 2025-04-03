import { watch } from 'vue'
import DefaultTheme from 'vitepress/theme'
import './style/rainbow.css'
import './style/blur.css'
import './style/blockquote.css'
import './style/vp_code.css';
import './style/vp_code_group.css';

let homePageStyle: HTMLStyleElement | undefined


export default {
  extends: DefaultTheme,

  enhanceApp({app , router }) {

    // 彩虹背景动画样式
    if (typeof window !== 'undefined') {
      watch(
        () => router.route.data.relativePath,
        () => updateHomePageStyle(location.pathname === '/'),
        { immediate: true },
      )
    }

  },
}

// 彩虹背景动画样式
function updateHomePageStyle(value: boolean) {
  if (value) {
    if (homePageStyle) return

    homePageStyle = document.createElement('style')
    homePageStyle.innerHTML = `
    :root {
      animation: rainbow 12s linear infinite;
    }`
    document.body.appendChild(homePageStyle)
  } else {
    if (!homePageStyle) return

    homePageStyle.remove()
    homePageStyle = undefined
  }
}
