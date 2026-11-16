// Runs after each page load. Copy and share go through the Android plugins,
// and a Share control is added when the page itself does not draw one.
(function () {
  if (window.__cipherNative) return
  window.__cipherNative = { pending: true }

  function answerText() {
    var el = document.querySelector('.answer')
    if (!el) return ''
    var label = el.getAttribute('aria-label') || ''
    var match = label.match(/^Answer (.+)\. Tap to copy\.$/)
    if (match) return match[1]
    var text = (el.textContent || '').trim()
    if (!text || text === 'Copied') return ''
    return text
  }

  function ensureShare() {
    if (document.querySelector('[data-cipher-share]')) return
    var row = document.querySelector('.utility')
    if (!row) return
    var button = document.createElement('button')
    button.className = 'util'
    button.type = 'button'
    button.setAttribute('data-cipher-share', '')
    button.textContent = 'Share'
    button.addEventListener('click', function () {
      var text = answerText()
      if (!text || !navigator.share) return
      navigator.share({ title: 'Cipher', text: text }).catch(function () {})
    })
    row.appendChild(button)
  }

  function install() {
    var cap = window.Capacitor
    if (!cap || typeof cap.isNativePlatform !== 'function' || !cap.isNativePlatform()) return false
    var plugins = cap.Plugins || {}
    if (plugins.Clipboard) {
      var clipboard = navigator.clipboard || {}
      var original = clipboard.writeText ? clipboard.writeText.bind(clipboard) : null
      clipboard.writeText = function (text) {
        return plugins.Clipboard.write({ string: String(text) }).catch(function (error) {
          if (original) return original(text)
          return Promise.reject(error)
        })
      }
      navigator.clipboard = clipboard
    }
    if (plugins.Share) {
      navigator.share = function (data) {
        var text = data && (data.text || data.url || data.title) || ''
        return plugins.Share.share({
          title: (data && data.title) || 'Cipher',
          text: String(text),
          dialogTitle: 'Share',
        })
      }
    }
    ensureShare()
    if (!window.__cipherShareWatch) {
      window.__cipherShareWatch = new MutationObserver(ensureShare)
      window.__cipherShareWatch.observe(document.documentElement, { childList: true, subtree: true })
    }
    window.__cipherNative.pending = false
    return true
  }

  if (install()) return
  var tries = 0
  var timer = setInterval(function () {
    tries += 1
    if (install() || tries > 40) clearInterval(timer)
  }, 50)
})()
